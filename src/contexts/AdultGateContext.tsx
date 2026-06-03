// Gate de conteúdo adulto — controla desbloqueio por sessão.
// Reset automático em sign out.

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { verifyAdultPassword } from "@/lib/adultPassword";
import { AdultLockModal } from "@/components/AdultLockModal";

interface AdultGateCtx {
  unlocked: boolean;
  hasPassword: boolean;
  requireUnlock: (onUnlock?: () => void) => void;
  lockNow: () => void;
}

const Ctx = createContext<AdultGateCtx | null>(null);

export function AdultGateProvider({ children }: { children: ReactNode }) {
  const { user, account } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [open, setOpen] = useState(false);
  const pendingCb = useRef<(() => void) | null>(null);

  // Reset quando muda usuário (incluindo signOut)
  useEffect(() => {
    setUnlocked(false);
    setOpen(false);
    pendingCb.current = null;
  }, [user?.id]);

  const requireUnlock = useCallback(
    (cb?: () => void) => {
      if (unlocked) {
        cb?.();
        return;
      }
      pendingCb.current = cb ?? null;
      setOpen(true);
    },
    [unlocked]
  );

  const handleSubmit = useCallback(
    async (pwd: string): Promise<string | null> => {
      if (!user || !account?.adult_password_hash) {
        return "Senha de conteúdo adulto não foi definida no cadastro.";
      }
      const ok = await verifyAdultPassword(user.id, pwd, account.adult_password_hash);
      if (!ok) return "Senha incorreta.";
      setUnlocked(true);
      setOpen(false);
      const cb = pendingCb.current;
      pendingCb.current = null;
      cb?.();
      return null;
    },
    [user, account?.adult_password_hash]
  );

  const lockNow = useCallback(() => {
    setUnlocked(false);
    pendingCb.current = null;
  }, []);

  return (
    <Ctx.Provider
      value={{
        unlocked,
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
