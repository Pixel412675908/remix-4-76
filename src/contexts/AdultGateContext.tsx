// Gate de conteúdo adulto explícito.
// Regra de segurança: NUNCA persiste desbloqueio. Sempre solicita a senha
// a cada novo acesso ao conteúdo. O cadeado permanece sempre visível.

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { verifyAdultPassword } from "@/lib/adultPassword";
import { AdultLockModal } from "@/components/AdultLockModal";

interface AdultGateCtx {
  unlocked: false;
  hasPassword: boolean;
  requireUnlock: (onUnlock?: () => void) => void;
  lockNow: () => void;
}

const Ctx = createContext<AdultGateCtx | null>(null);

export function AdultGateProvider({ children }: { children: ReactNode }) {
  const { user, account } = useAuth();
  const [open, setOpen] = useState(false);
  const pendingCb = useRef<(() => void) | null>(null);

  const requireUnlock = useCallback((cb?: () => void) => {
    pendingCb.current = cb ?? null;
    setOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (pwd: string): Promise<string | null> => {
      if (!user || !account?.adult_password_hash) {
        return "Senha de conteúdo adulto não foi definida no cadastro.";
      }
      const ok = await verifyAdultPassword(user.id, pwd, account.adult_password_hash);
      if (!ok) return "Senha incorreta.";
      setOpen(false);
      const cb = pendingCb.current;
      pendingCb.current = null;
      cb?.();
      return null;
    },
    [user, account?.adult_password_hash]
  );

  const lockNow = useCallback(() => {
    pendingCb.current = null;
    setOpen(false);
  }, []);

  return (
    <Ctx.Provider
      value={{
        unlocked: false,
        hasPassword: !!account?.adult_password_hash,
        requireUnlock,
        lockNow,
      }}
    >
      {children}
      <AdultLockModal
        open={open}
        onClose={() => {
          setOpen(false);
          pendingCb.current = null;
        }}
        onSubmit={handleSubmit}
      />
    </Ctx.Provider>
  );
}

export function useAdultGate() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdultGate must be used within AdultGateProvider");
  return ctx;
}

