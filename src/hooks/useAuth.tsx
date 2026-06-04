// Auth simples: Supabase cuida da persistência (localStorage + autoRefreshToken).
// Sistema de múltiplos perfis foi removido — cada conta tem uma única identidade
// (nome + avatar) armazenada na própria tabela accounts.
//
// `activeProfile` é mantido na API pública apenas como objeto sintético derivado
// da conta, para retrocompatibilidade com código legado (canWatch, etc).

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { Account, Profile } from "@/types/media";

const EXPLORER_KEY = "streamflix:explorer";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  account: Account | null;
  /** Objeto sintético derivado da conta (compat). */
  activeProfile: Profile | null;
  isExplorer: boolean;
  isAdmin: boolean;
  loading: boolean;
  profileLoading: boolean;

  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  enterAsExplorer: () => void;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;

  refreshAccount: () => Promise<void>;
  /** Atualiza nome/avatar da conta (substitui o antigo updateProfile do perfil). */
  updateIdentity: (patch: { name?: string; avatar_url?: string | null }) => Promise<void>;
  updateAccount: (patch: Partial<Account>) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function buildSyntheticProfile(account: Account | null): Profile | null {
  if (!account) return null;
  const maturity: Profile["maturity_level"] =
    account.account_type === "kids" ? "kids" : account.account_type === "teen" ? "teen" : "adult";
  return {
    id: account.id,
    account_id: account.id,
    name: account.display_name,
    avatar_url: account.avatar_url ?? null,
    is_kid: account.account_type === "kids",
    is_active: true,
    card_color: "#E50914",
    maturity_level: maturity,
    teen_allow_16: false,
    created_at: "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isExplorer, setIsExplorer] = useState<boolean>(() => localStorage.getItem(EXPLORER_KEY) === "1");
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadAccount = useCallback(async (uid: string) => {
    setProfileLoading(true);
    try {
      const { data } = await supabase.from("accounts").select("*").eq("id", uid).maybeSingle();
      setAccount((data ?? null) as Account | null);
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      setIsAdmin(!!roleRows?.some((r) => r.role === "admin"));
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const clearLocalView = useCallback(() => {
    setAccount(null);
    setIsAdmin(false);
  }, []);

  const hydrateFromSession = useCallback(
    (sess: Session | null) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setIsExplorer(false);
        localStorage.removeItem(EXPLORER_KEY);
        // Defer Supabase calls to avoid deadlock inside auth callback
        setTimeout(() => {
          loadAccount(sess.user.id);
        }, 0);
      } else {
        clearLocalView();
      }
    },
    [loadAccount, clearLocalView]
  );

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      hydrateFromSession(sess);
    });
    supabase.auth.getSession().then(({ data }) => {
      hydrateFromSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [hydrateFromSession]);

  const signUp: AuthCtx["signUp"] = async (email, password, displayName) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { display_name: displayName },
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const enterAsExplorer = () => {
    localStorage.setItem(EXPLORER_KEY, "1");
    setIsExplorer(true);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    setSession(null);
    setUser(null);
    clearLocalView();
    localStorage.removeItem(EXPLORER_KEY);
    setIsExplorer(false);
  };

  const signOutEverywhere = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      /* ignore */
    }
    setSession(null);
    setUser(null);
    clearLocalView();
  };

  const refreshAccount = async () => {
    if (user) await loadAccount(user.id);
  };

  const updateIdentity: AuthCtx["updateIdentity"] = async (patch) => {
    if (!user) return;
    const accountPatch: Partial<Account> = {};
    if (patch.name !== undefined) accountPatch.display_name = patch.name;
    if (patch.avatar_url !== undefined) accountPatch.avatar_url = patch.avatar_url ?? null;
    if (Object.keys(accountPatch).length === 0) return;
    await supabase.from("accounts").update(accountPatch).eq("id", user.id);
    await refreshAccount();
  };

  const updateAccount: AuthCtx["updateAccount"] = async (patch) => {
    if (!user) return;
    await supabase.from("accounts").update(patch).eq("id", user.id);
    await refreshAccount();
  };

  const activeProfile = buildSyntheticProfile(account);

  return (
    <Ctx.Provider
      value={{
        session,
        user,
        account,
        activeProfile,
        isExplorer,
        isAdmin,
        loading,
        signUp,
        signIn,
        enterAsExplorer,
        signOut,
        signOutEverywhere,
        refreshAccount,
        updateIdentity,
        updateAccount,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
