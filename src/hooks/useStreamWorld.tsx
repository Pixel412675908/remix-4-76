// Contexto leve para abrir/fechar overlay do StreamWorld.
// Segurança: tokens validados antes de irem na URL e handshake via postMessage
// restrito à origem oficial do StreamWorld.

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const STREAMWORLD_BASE: string = "https://streamword.vercel.app/";
export const STREAMWORLD_ORIGIN: string = new URL(STREAMWORLD_BASE).origin;

// Validação básica de JWT do Supabase: 3 segmentos base64url, sem caracteres
// suspeitos. Bloqueia injeção em querystring e tokens corrompidos.
const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
function isSafeJwt(token: string | undefined | null): token is string {
  if (!token || typeof token !== "string") return false;
  if (token.length < 20 || token.length > 4096) return false;
  return JWT_RE.test(token);
}

// Refresh token (formato livre), permitido apenas alfanum/underscore/dash.
const REFRESH_RE = /^[A-Za-z0-9_-]{16,512}$/;

interface Ctx {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  hasUrl: boolean;
  url: string | null;
  tokens: { access_token: string; refresh_token: string } | null;
}

const StreamWorldCtx = createContext<Ctx | undefined>(undefined);

export function StreamWorldProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [tokens, setTokens] = useState<{ access_token: string; refresh_token: string } | null>(null);

  const open = useCallback(async () => {
    let safeAccess: string | null = null;
    let safeRefresh: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (isSafeJwt(session?.access_token)) safeAccess = session!.access_token;
      if (session?.refresh_token && REFRESH_RE.test(session.refresh_token)) {
        safeRefresh = session.refresh_token;
      }
    } catch {
      /* sessão indisponível */
    }

    // Sem sessão real => não abre. StreamWorld não tem mais modo demo.
    if (!safeAccess || !safeRefresh) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }

    const u = new URL(STREAMWORLD_BASE);
    u.searchParams.set("access_token", safeAccess);
    u.searchParams.set("refresh_token", safeRefresh);
    u.searchParams.set("source", "streamflix");
    u.searchParams.set("mode", "live");
    u.searchParams.set("demo", "0");
    setUrl(u.toString());
    setTokens({ access_token: safeAccess, refresh_token: safeRefresh });
    setIsOpen(true);
  }, []);

  // postMessage handshake — somente origem oficial pode pedir tokens.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== STREAMWORLD_ORIGIN) return; // origem inválida -> ignora
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "streamworld:request-session" && tokens) {
        const target = event.source as Window | null;
        target?.postMessage(
          { type: "streamworld:session", access_token: tokens.access_token, refresh_token: tokens.refresh_token },
          STREAMWORLD_ORIGIN
        );
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isOpen, tokens]);

  return (
    <StreamWorldCtx.Provider
      value={{
        isOpen,
        open,
        close: () => setIsOpen(false),
        hasUrl: true,
        url,
        tokens,
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
