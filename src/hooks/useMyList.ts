// Minha Lista — store global compartilhada. Todos os componentes (cards, detalhe,
// página Minha Lista) leem do mesmo Set e re-renderizam juntos quando muda.
// Persistência: Supabase (autenticado) ou localStorage (explorador).

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const EXPLORER_KEY = "streamflix:explorer:my-list";

// ===== Store global =====
let currentIds: number[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setIds(next: number[]) {
  // Sempre criar nova referência para acionar re-render via useSyncExternalStore
  currentIds = Array.from(new Set(next));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function readLocal(): number[] {
  try {
    const raw = localStorage.getItem(EXPLORER_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

// Carrega a lista do storage adequado uma única vez por mudança de identidade
async function loadFor(user: { id: string } | null, isExplorer: boolean) {
  if (user) {
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
}

export function useMyList() {
  const { user, isExplorer } = useAuth();
  const ids = useSyncExternalStore(subscribe, () => currentIds, () => currentIds);
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    loadFor(user, isExplorer);
    setLoadKey((k) => k + 1);
  }, [user?.id, isExplorer]); // eslint-disable-line react-hooks/exhaustive-deps

  void loadKey;

  const add = useCallback(
    async (id: number) => {
      // Otimista
      setIds([...currentIds, id]);
      if (user) {
        const { error } = await supabase
          .from("my_list")
          .insert({ account_id: user.id, media_id: id });
        if (error) {
          // Se já existe ou falhou, recarrega do servidor (verdade absoluta)
          await loadFor(user, false);
        }
        return;
      }
      if (isExplorer) {
        localStorage.setItem(EXPLORER_KEY, JSON.stringify(currentIds));
      }
    },
    [user, isExplorer]
  );

  const remove = useCallback(
    async (id: number) => {
      setIds(currentIds.filter((x) => x !== id));
      if (user) {
        const { error } = await supabase
          .from("my_list")
          .delete()
          .eq("account_id", user.id)
          .eq("media_id", id);
        if (error) await loadFor(user, false);
        return;
      }
      if (isExplorer) {
        localStorage.setItem(EXPLORER_KEY, JSON.stringify(currentIds));
      }
    },
    [user, isExplorer]
  );

  const has = useCallback((id: number) => currentIds.includes(id), [ids]);
  const toggle = useCallback(
    (id: number) => (currentIds.includes(id) ? remove(id) : add(id)),
    [add, remove]
  );

  return { ids, add, remove, has, toggle };
}
