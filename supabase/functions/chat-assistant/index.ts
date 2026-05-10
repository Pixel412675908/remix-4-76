// StreamFlix AI assistant — dois modos: "support" (suporte amplo) e "expert" (curadoria de cinema/séries).
// Ambos respondem QUALQUER pergunta com base na arquitetura real do app.
// Streaming via Lovable AI Gateway (SSE).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Conhecimento factual sobre o StreamFlix — usado nos dois modos.
// A IA deve usar isto como verdade absoluta sobre o app, sem inventar contratos
// com estúdios ou licenciamentos.
const APP_FACTS = `Fatos verificados do StreamFlix (use sempre como verdade, nunca invente):

ARQUITETURA DE CONTEÚDO:
- O StreamFlix é um agregador. Não possui contratos com estúdios, não licencia obras e não hospeda vídeo próprio.
- Catálogo, posters, banners, sinopses, elenco, temporadas, episódios, trailers, notas e gêneros vêm da TMDB (The Movie Database), uma base pública e colaborativa de metadados.
- A reprodução de vídeo é feita via embed de provedores públicos terceirizados, com hierarquia de fallback automático:
  1) VidSrc (servidor primário)
  2) AutoEmbed
  3) 2Embed
  4) Superembed / Multiembed
- Se um servidor cai, o player troca automaticamente para o próximo da lista, sem reload.

ÁUDIO E LEGENDAS:
- Prioridade global de áudio: Português Brasil (PT-BR) > Português Portugal (PT-PT) > Inglês > áudio original.
- O StreamFlix sinaliza essa preferência aos provedores; a faixa final depende do que cada provedor oferece para aquele título.

FUNCIONALIDADES:
- Perfis com avatar, modo Kids, controle parental (Kids / Teen / Adulto), bloqueio de conteúdo adulto/explícito.
- Minha Lista, histórico de visualização, "Continuar assistindo".
- Busca, catálogo infinito, coleções, "Em breve", páginas dedicadas (Filmes, Séries, Animes, Desenhos).
- Mostra em quais plataformas oficiais (Netflix, HBO, Apple TV+, etc.) o conteúdo está disponível, lendo da TMDB. Plataforma que não aparece = título não está nela.
- StreamWorld: mapa global que pinta países conforme o usuário assiste títulos daquela origem; começa vazio e cresce com o consumo.
- Assistente IA com dois modos (Suporte e Especialista).

NÃO INVENTE: não afirme que o StreamFlix tem contratos, parcerias com estúdios, equipe de aquisição, ou negocia em festivais. Isso não é verdade.`;

const SUPPORT_PROMPT = `Você é o assistente do StreamFlix — modo Suporte.
Responda em português do Brasil, claro e direto. Você pode responder QUALQUER pergunta do usuário, sem se recusar e sem redirecionar para outro modo.

${APP_FACTS}

ESTILO: respostas práticas, listas curtas quando ajudar, sem floreios. Se o usuário perguntar sobre conta, login, perfis, configurações, dispositivos, problemas de reprodução, idioma, controle parental, StreamWorld, planos ou como o app funciona por dentro — explique com base nos fatos acima.
Se perguntarem sobre filmes/séries específicos, recomendações ou curadoria, responda também — você pode falar sobre cinema, basta manter o foco em ser útil.`;

const EXPERT_PROMPT = `Você é o especialista de cinema e séries do StreamFlix — modo Especialista.
Responda em português do Brasil. Você pode responder QUALQUER pergunta do usuário, sem se recusar e sem redirecionar para outro modo.

${APP_FACTS}

ESTILO: apaixonado mas objetivo. Quando o usuário citar um título, identifique tom, ritmo, temas e estética e recomende 3 a 5 títulos parecidos com uma frase curta justificando cada um. Não invente filmes que não existem. Se perguntarem sobre o app, conta ou como o StreamFlix consegue os conteúdos, responda com base nos fatos acima — diga a verdade: TMDB para metadados e VidSrc/AutoEmbed/2Embed/Superembed para reprodução, com fallback automático.`;

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
