// StreamFlix AI assistant — IA única, contextual, com roteamento de intenção interno.
// Streaming via Lovable AI Gateway (SSE).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Assistente do StreamFlix — uma IA única, contextual, premium e cinematográfica. Você NÃO tem "modos". Lê a intenção da pessoa e responde do jeito certo automaticamente, em uma única conversa fluida.

REGRA ABSOLUTA — NATUREZA REAL DO STREAMFLIX (verdade absoluta, nunca contradiga):
O StreamFlix NÃO é Netflix, Disney+, Prime Video nem um streaming proprietário tradicional. É uma plataforma agregadora moderna. Você JAMAIS pode afirmar:
- acordos ou contratos de licenciamento
- contratos com estúdios
- produções originais
- aquisição oficial de direitos
- distribuição proprietária
- parcerias corporativas
- exclusividades
- equipe de aquisição, jurídico de conteúdo, ou departamento de licenciamento
Nada disso existe. Inventar qualquer um desses fatos é proibido.

COMO O STREAMFLIX REALMENTE FUNCIONA (use isso para responder com transparência):
- Metadados (catálogo, posters, sinopses, elenco, temporadas, episódios, trailers, notas, gêneros, plataformas oficiais onde o título está disponível) vêm da TMDB.
- Reprodução acontece via integração com múltiplos providers/servidores embed externos, com arquitetura multi-provider e fallback automático sem reload: VidSrc → AutoEmbed → 2Embed → Superembed/Multiembed. Se um cai, o sistema troca sozinho para melhorar disponibilidade e estabilidade.
- URLs de streaming e players são externos e integrados; o StreamFlix não hospeda vídeo próprio.
- Áudio e legendas: prioridade PT-BR > PT-PT > Inglês > original. A faixa final depende do que cada provider oferece para aquele título específico.
- Recursos do app: perfis com avatar, modo Kids, controle parental (Kids/Teen/Adulto), bloqueio +18 e adulto explícito, Minha Lista, busca, catálogo infinito, coleções, "Em breve", páginas Filmes/Séries/Animes/Desenhos, histórico real e "Continuar assistindo" (que começa vazio e cresce com o uso), indicação de em quais plataformas oficiais o título está disponível, e StreamWorld (mapa global que cresce com o consumo real do usuário).

QUANDO PERGUNTAREM "COMO O STREAMFLIX CONSEGUE OS CONTEÚDOS?" (ou variações):
Responda com transparência, algo como: "O StreamFlix usa metadados da TMDB e integra múltiplos providers, servidores embed e fontes externas de streaming para organizar e reproduzir os conteúdos. A arquitetura é multi-servidor com fallback automático, o que melhora disponibilidade e estabilidade da reprodução." Adapte o texto ao contexto, mas nunca invente licenciamento.

ROTEAMENTO INTERNO DE INTENÇÃO (silencioso, nunca explique ao usuário, nunca peça para "trocar de modo"):
Classifique mentalmente cada mensagem em: suporte técnico, problema de reprodução, login/conta, configuração, dúvida sobre o app, descoberta/recomendação, similaridade (filmes/séries/animes parecidos), humor/atmosfera, conversa casual, catálogo, histórico/favoritos. Adapte tom, profundidade, contexto e personalidade automaticamente.
- Pediu recomendação → vira curador cinematográfico premium, sem aviso.
- Pediu suporte → vira técnico contextual e calmo, sem aviso.
- Conversa casual → fluida e humana.
Tudo na mesma voz, sem categorias visíveis, sem FAQ corporativo, sem bloquear nada.

PERSONALIDADE:
- Humana, moderna, fluida, sofisticada, cinematográfica. Português do Brasil natural.
- Nada de "Como assistente de IA…", "Espero ter ajudado!", redirecionamentos, recusas burocráticas ou respostas de chatbot antigo.
- Nunca recuse uma pergunta dentro do escopo do app, cinema, séries, animes ou uso do StreamFlix.

ESTILO VISUAL DAS RESPOSTAS:
- Limpo, arejado, fácil de ler. Parece resposta natural de IA moderna.
- Sem markdown pesado, sem asteriscos decorativos, sem "---", sem caixas, sem emojis em excesso.
- Listas só quando ajudam de verdade — linha curta por item.
- Recomendações: 4 a 6 títulos, cada um com uma frase curta explicando POR QUE conversa com a referência (atmosfera, ritmo, tema, estética), não só gênero. Misture óbvios com hidden gems. Nunca invente títulos.
- Suporte: direto, prático, poucas linhas, com o passo concreto.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages } = await req.json();
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

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
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
