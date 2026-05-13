// Minha Lista — autenticado: SEMPRE Supabase filtrado por account_id.
// Explorador: localStorage isolado. Sem mistura entre os modos.

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const EXPLORER_KEY = "streamflix:explorer:my-list";

function readLocal(): number[] {
  try {
    const raw = localStorage.getItem(EXPLORER_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function useMyList() {
  const { user, isExplorer } = useAuth();
  const [ids, setIds] = useState<number[]>([]);

  const refresh = useCallback(async () => {
    if (user) {
      // Limpa qualquer leak do modo explorador na transição.
      try { localStorage.removeItem(EXPLORER_KEY); } catch {}
      const { data } = await supabase
        .from("my_list")
        .select("media_id")
        .eq("account_id", user.id);
      setIds((data ?? []).map((r) => r.media_id));
      return;
    }
    if (isExplorer) {
      setIds(readLocal());
      return;
    }
    setIds([]);
  }, [user, isExplorer]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (id: number) => {
      if (user) {
        await supabase.from("my_list").insert({ account_id: user.id, media_id: id });
        setIds((prev) => Array.from(new Set([...prev, id])));
        return;
      }
      if (isExplorer) {
        const next = Array.from(new Set([...readLocal(), id]));
        localStorage.setItem(EXPLORER_KEY, JSON.stringify(next));
        setIds(next);
      }
    },
    [user, isExplorer]
  );

  const remove = useCallback(
    async (id: number) => {
      if (user) {
        await supabase
          .from("my_list")
          .delete()
          .eq("account_id", user.id)
          .eq("media_id", id);
        setIds((prev) => prev.filter((x) => x !== id));
        return;
      }
      if (isExplorer) {
        const next = readLocal().filter((x) => x !== id);
        localStorage.setItem(EXPLORER_KEY, JSON.stringify(next));
        setIds(next);
      }
    },
    [user, isExplorer]
  );

  const has = useCallback((id: number) => ids.includes(id), [ids]);
  const toggle = useCallback((id: number) => (has(id) ? remove(id) : add(id)), [has, add, remove]);

  return { ids, add, remove, has, toggle };
}
