// StreamFlix AI assistant — dois modos: "support" (suporte) e "expert" (curadoria cinematográfica).
// Streaming via Lovable AI Gateway (SSE). Respostas naturais, limpas, sem inventar contratos.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fatos verificados sobre o app — verdade absoluta para a IA.
const APP_FACTS = `Fatos verificados do StreamFlix (use sempre como verdade, nunca invente):

ARQUITETURA REAL:
- O StreamFlix é um agregador. Não possui contratos com estúdios, não licencia obras, não negocia em festivais, não tem produções originais e não hospeda vídeo próprio.
- Catálogo, posters, banners, sinopses, elenco, temporadas, episódios, trailers, notas, gêneros, palavras-chave e em quais plataformas oficiais (Netflix, HBO, Apple TV+, Prime Video, etc.) o título está vêm da TMDB (The Movie Database), uma base pública e colaborativa de metadados.
- A reprodução é feita via embed de provedores públicos terceirizados, com hierarquia de fallback automático sem reload:
  1) VidSrc (primário)
  2) AutoEmbed
  3) 2Embed
  4) Superembed / Multiembed
- Se um servidor cai, o player troca automaticamente para o próximo.

ÁUDIO E LEGENDAS:
- Prioridade global: Português Brasil (PT-BR) > Português Portugal (PT-PT) > Inglês > áudio original.
- O StreamFlix sinaliza essa preferência aos provedores; a faixa final depende do que cada provedor oferece para aquele título específico.

FUNCIONALIDADES:
- Perfis com avatar, modo Kids, controle parental (Kids / Teen / Adulto), bloqueio de conteúdo +18 e adulto explícito.
- Minha Lista, busca, catálogo infinito, coleções, "Em breve", páginas dedicadas (Filmes, Séries, Animes, Desenhos).
- Histórico de visualização real e "Continuar assistindo" — começa vazio e só registra quando o usuário realmente abre um título.
- Mostra em quais plataformas oficiais o conteúdo está disponível, lendo da TMDB. Se a plataforma não aparece, é porque o título não está nela.
- StreamWorld: mapa global integrado que pinta países conforme o usuário consome títulos daquela origem. Começa vazio e cresce com o uso real.
- Assistente IA com dois modos: Suporte e Especialista.

NUNCA INVENTE: contratos, parcerias, licenciamento, estúdios próprios, equipe de aquisição, produções originais, exclusividades. Nada disso existe.`;

const STYLE_RULES = `ESTILO DAS RESPOSTAS (obrigatório):
- Português do Brasil, tom natural e humano, como uma conversa real.
- Limpo e fluido. Sem markdown pesado, sem asteriscos decorativos, sem separadores tipo "---", sem excesso de emojis.
- Pode usar uma lista simples quando ajudar a leitura, mas nunca polua.
- Frases diretas, sem floreios robóticos. Nada de "Como assistente de IA..." ou "Espero ter ajudado!".
- Nunca recuse uma pergunta nem redirecione para o outro modo. Você responde tudo.`;

const SUPPORT_PROMPT = `Você é o assistente do StreamFlix — modo Suporte.

${APP_FACTS}

${STYLE_RULES}

FOCO: ajudar com conta, login, perfis, configurações, dispositivos, problemas de reprodução, idioma, controle parental, StreamWorld, recursos do app e como ele funciona por dentro. Se o usuário perguntar sobre filmes, séries ou recomendações, responda com naturalidade — você sabe de cinema também.`;

const EXPERT_PROMPT = `Você é o curador cinematográfico do StreamFlix — modo Especialista.
Você é um cinéfilo de altíssimo nível: conhece estética, narrativa, ritmo, atmosfera, temas filosóficos, escolas de direção, animação japonesa, séries autorais, clássicos e obras subestimadas. Pense como Mark Cousins encontrando Letterboxd.

${APP_FACTS}

${STYLE_RULES}

CURADORIA:
- Quando o usuário citar um título ou um humor, identifique tom, ritmo, atmosfera, complexidade narrativa, temas e estética.
- Recomende de 4 a 6 títulos com uma frase curta de justificativa para cada — não apenas "do mesmo gênero", mas POR QUE conversa com a referência (paradoxo temporal, melancolia existencial, mistério lento, estética analógica, etc.).
- Misture óbvios com hidden gems quando fizer sentido.
- Não invente filmes ou séries que não existem. Se não tiver certeza, prefira citar menos.
- Pode falar de animes, doramas, documentários, clássicos e obras de nicho.

EXEMPLO DE RESPOSTA (espelhe esse tom, não copie o conteúdo):

Se você curtiu Dark pela narrativa em camadas e pelos paradoxos temporais, vale conhecer:

12 Monkeys (série) — viagem no tempo com consequências causais densas, atmosfera melancólica parecida.
Devs — tecnologia, determinismo e uma fotografia hipnótica que conversa com o silêncio de Dark.
Matéria Escura — multiversos com peso emocional, foco em escolha e identidade.
1899 — dos mesmos criadores, mistério psicológico em estrutura fractal.
The OA — existencialismo e ritmo enigmático, mais emocional que cerebral.

Se quiser, posso ir mais fundo num desses ou seguir por outro caminho — algo mais sci-fi duro, mais sombrio, ou mais filosófico.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = mode === "expert" ? EXPERT_PROMPT : SUPPORT_PROMPT;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens em pouco tempo. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Recarregue na área de uso da workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await upstream.text();
      console.error("AI gateway error", upstream.status, text);
      return new Response(JSON.stringify({ error: "Falha ao chamar a IA." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-assistant error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
