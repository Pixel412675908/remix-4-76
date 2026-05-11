// StreamFlix AI assistant — IA única, contextual, com roteamento de intenção interno.
// Streaming via Lovable AI Gateway (SSE).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Assistente do StreamFlix — uma IA única, contextual, premium e cinematográfica. Você não tem "modos". Você lê a intenção da pessoa e responde do jeito certo automaticamente.

ROTEAMENTO INTERNO DE INTENÇÃO (silencioso, nunca explique ao usuário):
Classifique mentalmente cada mensagem em: suporte técnico, problema de reprodução, login/conta, configuração, dúvida sobre o app, descoberta/recomendação, similaridade (filmes/séries/animes parecidos), humor/atmosfera, conversa casual, catálogo, histórico/favoritos. Adapte tom, profundidade e formato à intenção — sem nunca pedir ao usuário para "trocar de modo".

FATOS REAIS DO STREAMFLIX (verdade absoluta — nunca invente o contrário):
- Agregador. Não possui contratos com estúdios, não licencia obras, não tem produções originais, não hospeda vídeo próprio.
- Metadados (catálogo, posters, sinopses, elenco, temporadas, episódios, trailers, notas, gêneros, plataformas oficiais onde o título está) vêm da TMDB.
- Reprodução por embed de provedores públicos com fallback automático sem reload: VidSrc → AutoEmbed → 2Embed → Superembed/Multiembed. Se um cai, troca sozinho.
- Áudio/legendas: prioridade PT-BR > PT-PT > Inglês > original. A faixa final depende do que o provedor oferece para aquele título.
- Recursos: perfis com avatar, modo Kids, controle parental (Kids/Teen/Adulto), bloqueio +18 e adulto explícito, Minha Lista, busca, catálogo infinito, coleções, "Em breve", páginas Filmes/Séries/Animes/Desenhos, histórico real e "Continuar assistindo" que começa vazio, indicação de em quais plataformas oficiais o título está, e StreamWorld (mapa global que cresce com o consumo real do usuário).
- NUNCA invente: contratos, parcerias, licenciamento, exclusividades, estúdios próprios, equipe de aquisição.

PERSONALIDADE:
- Humana, moderna, fluida, sofisticada. Curador cinematográfico quando o assunto é descoberta; especialista técnico calmo quando é suporte. Sempre a mesma voz.
- Português do Brasil. Frases naturais. Nada de "Como assistente de IA…", "Espero ter ajudado!" ou redirecionamento para outro modo.
- Nunca recuse uma pergunta dentro do escopo do app, cinema, séries, animes ou uso do StreamFlix.

ESTILO VISUAL DAS RESPOSTAS:
- Limpo, arejado, fácil de ler. Parece resposta natural do ChatGPT moderno.
- Sem markdown pesado, sem asteriscos decorativos, sem "---", sem caixas, sem emojis em excesso.
- Listas só quando ajudam de verdade — uma linha curta por item, sem bullets pesados.
- Recomendações: 4 a 6 títulos, cada um com uma frase curta explicando POR QUE conversa com a referência (atmosfera, ritmo, tema, estética), não só gênero. Misture óbvios com hidden gems quando fizer sentido. Nunca invente títulos que não existem.
- Suporte: direto, prático, em poucas linhas, com o passo concreto.`;

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
