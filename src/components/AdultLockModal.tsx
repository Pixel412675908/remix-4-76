import { useEffect, useState } from "react";
import { Lock, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<string | null>;
}

export function AdultLockModal({ open, onClose, onSubmit }: Props) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setPwd("");
      setErr(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd || loading) return;
    setLoading(true);
    const error = await onSubmit(pwd);
    setLoading(false);
    if (error) setErr(error);
  };

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 sm:p-8"
        style={{
          backgroundColor: "rgba(15,15,15,0.98)",
          border: "1px solid rgba(229,9,20,0.3)",
          boxShadow: "0 20px 60px rgba(229,9,20,0.25)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full text-zinc-500 hover:text-white hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center mb-5">
          <div
            className="h-14 w-14 grid place-items-center rounded-full mb-3"
            style={{ backgroundColor: "rgba(229,9,20,0.15)" }}
          >
            <Lock className="h-6 w-6" style={{ color: "#E50914" }} />
          </div>
          <h2 className="font-bold text-xl text-white">Conteúdo Adulto Bloqueado</h2>
          <p className="text-sm text-zinc-400 mt-1.5">
            Informe sua senha de conteúdo adulto para continuar.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={pwd}
            onChange={(e) => {
              setPwd(e.target.value);
              setErr(null);
            }}
            placeholder="Senha de conteúdo adulto"
            autoFocus
            autoComplete="off"
            className="w-full px-4 py-3 rounded-lg bg-black/60 border border-white/10 text-white text-sm outline-none focus:border-[#E50914] transition-colors"
          />

          {err && (
            <p className="text-xs text-[#E50914] text-center">{err}</p>
          )}

          <button
            type="submit"
            disabled={!pwd || loading}
            className="w-full py-3 rounded-full font-bold text-white transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#E50914",
              boxShadow: "0 8px 24px rgba(229,9,20,0.3)",
            }}
          >
            {loading ? "Verificando..." : "Desbloquear"}
          </button>

          <p className="text-[11px] text-zinc-600 text-center">
            O desbloqueio é válido apenas para esta sessão.
          </p>
        </form>
      </div>
    </div>
  );
}
