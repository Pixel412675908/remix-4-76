// Edge Function pública para o app StreamWorld consumir o histórico de assistência
// dos usuários do StreamFlix. Usa Service Role para ignorar RLS, mas exige user_id
// como parâmetro. CORS liberado.
//
// Política: se user_id ausente OU inválido, retornamos { items: [] } com status 200.
// Isso evita que o StreamWorld estoure tela de erro quando o usuário ainda não
// consumiu nenhum conteúdo (ou está em modo demo). O mapa só pinta países após
// o usuário começar a assistir.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const empty = (userId: string | null = null) =>
  new Response(JSON.stringify({ user_id: userId, count: 0, items: [] }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id")?.trim() ?? "";

    // Sem user_id => retorna lista vazia (não é erro)
    if (!userId) return empty(null);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) return empty(userId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data, error } = await admin
      .from("watch_history")
      .select("id, media_id, media_type, episode_number, seconds_watched, progress_pct, completed, last_opened_at, created_at, updated_at")
      .eq("user_id", userId)
      .order("last_opened_at", { ascending: false })
      .limit(500);

    if (error) {
      // Em caso de erro de DB, ainda devolvemos vazio em vez de quebrar o app cliente
      return empty(userId);
    }

    return new Response(
      JSON.stringify({ user_id: userId, count: data?.length ?? 0, items: data ?? [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return empty(null);
  }
});
