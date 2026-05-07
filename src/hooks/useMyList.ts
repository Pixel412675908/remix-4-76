// Minha Lista — persistido no Supabase (por conta) + fallback localStorage para Modo Explorador

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
  const [ids, setIds] = useState<number[]>(() => (isExplorer ? readLocal() : []));

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(readLocal());
      return;
    }
    const { data } = await supabase
      .from("my_list")
      .select("media_id")
      .eq("account_id", user.id);
    setIds((data ?? []).map((r) => r.media_id));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (id: number) => {
      if (!user) {
        const next = Array.from(new Set([...readLocal(), id]));
        localStorage.setItem(EXPLORER_KEY, JSON.stringify(next));
        setIds(next);
        return;
      }
      await supabase.from("my_list").insert({ account_id: user.id, media_id: id });
      setIds((prev) => Array.from(new Set([...prev, id])));
    },
    [user]
  );

  const remove = useCallback(
    async (id: number) => {
      if (!user) {
        const next = readLocal().filter((x) => x !== id);
        localStorage.setItem(EXPLORER_KEY, JSON.stringify(next));
        setIds(next);
        return;
      }
      await supabase
        .from("my_list")
        .delete()
        .eq("account_id", user.id)
        .eq("media_id", id);
      setIds((prev) => prev.filter((x) => x !== id));
    },
    [user]
  );

  const has = useCallback((id: number) => ids.includes(id), [ids]);
  const toggle = useCallback((id: number) => (has(id) ? remove(id) : add(id)), [has, add, remove]);

  return { ids, add, remove, has, toggle };
}
