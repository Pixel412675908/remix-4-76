// No-op: a contagem global foi desativada porque disparava centenas de
// requisições ao TMDB/Supabase no boot, travando login/cadastro na preview.
export function useCatalogCountsLogger() {
  // intentionally empty
}
