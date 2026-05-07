// StreamFlix AI assistant — two modes: "support" and "expert".
// Streams responses via Lovable AI Gateway.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORT_PROMPT = `Você é o assistente de suporte do StreamFlix, uma plataforma de streaming.
Responda em português do Brasil, de forma clara, breve e prática.
Foco: ajudar com dúvidas sobre o app, conta, configurações, login, perfil, histórico, problemas de reprodução, idioma, privacidade, segurança e dispositivos.
Se a pergunta for sobre filmes, séries ou recomendações, oriente o usuário a trocar para o modo "Especialista" pelo botão acima.
Seja direto, sem floreios. Use listas curtas quando ajudar.`;

const EXPERT_PROMPT = `Você é o especialista em filmes e séries do StreamFlix.
Responda em português do Brasil. Conheça profundamente cinema, séries, gêneros, diretores, atores, estilos e épocas.
Quando o usuário citar um título que gostou, identifique elementos (tom, ritmo, temas, estética) e recomende 3 a 5 títulos parecidos com uma frase curta justificando cada um.
Seja apaixonado mas objetivo. Sem listas gigantes. Sem inventar títulos que não existam.
Se a pergunta for sobre o app/conta/configurações, oriente o usuário a trocar para o modo "Suporte".`;

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
