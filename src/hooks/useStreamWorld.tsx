// Contexto leve para abrir/fechar overlay do StreamWorld.
// Passa os tokens da sessão Supabase via parâmetros de URL para que
// o StreamWorld restaure a sessão e saia do modo demo.

import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const STREAMWORLD_BASE: string = "https://streamword.vercel.app/";

interface Ctx {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  hasUrl: boolean;
  url: string | null;
}

const StreamWorldCtx = createContext<Ctx | undefined>(undefined);

export function StreamWorldProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const open = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const u = new URL(STREAMWORLD_BASE);
      if (session?.access_token) u.searchParams.set("access_token", session.access_token);
      if (session?.refresh_token) u.searchParams.set("refresh_token", session.refresh_token);
      u.searchParams.set("source", "streamflix");
      setUrl(u.toString());
    } catch {
      setUrl(STREAMWORLD_BASE);
    }
    setIsOpen(true);
  }, []);

  return (
    <StreamWorldCtx.Provider
      value={{
        isOpen,
        open,
        close: () => setIsOpen(false),
        hasUrl: true,
        url,
      }}
    >
      {children}
    </StreamWorldCtx.Provider>
  );
}

export function useStreamWorld() {
  const ctx = useContext(StreamWorldCtx);
  if (!ctx) throw new Error("useStreamWorld must be used within StreamWorldProvider");
  return ctx;
}

// Backwards compat
export const STREAMWORLD_URL: string = STREAMWORLD_BASE;
