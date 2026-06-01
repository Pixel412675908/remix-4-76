// No-op: a contagem global foi desativada porque disparava centenas de
// requisições ao TMDB/Supabase no boot, travando login/cadastro na preview.
import { useEffect } from "react";

export function useCatalogCountsLogger() {
  useEffect(() => {
    // intentionally empty
  }, []);
}
