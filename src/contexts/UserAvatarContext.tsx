// Contexto global do avatar do usuário — sincroniza Navbar e Settings instantaneamente.
// Persiste em localStorage como cache otimista para evitar flash do ícone padrão
// após reload/login.

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

const LS_KEY = "streamflix_avatar_url";

interface UserAvatarCtx {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  saveAvatar: (url: string | null) => Promise<void>;
}

const Ctx = createContext<UserAvatarCtx | null>(null);

export function UserAvatarProvider({ children }: { children: ReactNode }) {
  const { user, account, updateIdentity } = useAuth();
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(() => {
    try { return localStorage.getItem(LS_KEY); } catch { return null; }
  });

  // Hidrata a partir da conta (fonte de verdade)
  useEffect(() => {
    if (account?.avatar_url !== undefined) {
      setAvatarUrlState(account.avatar_url ?? null);
      try {
        if (account.avatar_url) localStorage.setItem(LS_KEY, account.avatar_url);
        else localStorage.removeItem(LS_KEY);
      } catch { /* ignore */ }
    }
  }, [account?.avatar_url]);

  // Logout: limpa cache local
  useEffect(() => {
    if (!user) {
      try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
      setAvatarUrlState(null);
    }
  }, [user]);

  const setAvatarUrl = useCallback((url: string | null) => {
    setAvatarUrlState(url);
    try {
      if (url) localStorage.setItem(LS_KEY, url);
      else localStorage.removeItem(LS_KEY);
    } catch { /* ignore */ }
  }, []);

  const saveAvatar = useCallback(
    async (url: string | null) => {
      setAvatarUrl(url);
      if (!user) return;
      try { await updateIdentity({ avatar_url: url }); } catch { /* ignore */ }
    },
    [user, updateIdentity, setAvatarUrl]
  );

  return (
    <Ctx.Provider value={{ avatarUrl, setAvatarUrl, saveAvatar }}>{children}</Ctx.Provider>
  );
}

export function useUserAvatar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserAvatar deve ser usado dentro do UserAvatarProvider");
  return ctx;
}
