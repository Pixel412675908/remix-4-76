// Tela de reset de senha — usuário chega aqui pelo link do email com token recovery.

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-processa o hash com type=recovery via onAuthStateChange.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Fallback: se já tem sessão, pode prosseguir.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (pwd.length < 6) {
      toast({ title: "Senha muito curta", variant: "destructive" });
      return;
    }
    if (pwd !== pwd2) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Senha atualizada", description: "Você já está logado." });
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative bg-gradient-to-b from-black via-[#0a0510] to-[#1a0a26]">
      <Link to="/" className="absolute top-5 left-5 z-10">
        <Logo size="md" />
      </Link>

      <div
        className="relative w-full max-w-[450px] rounded-lg p-8 sm:p-12 animate-fade-in"
        style={{
          backgroundColor: "rgba(20,20,20,0.95)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h1 className="font-display text-2xl font-bold text-white mb-6">Definir nova senha</h1>

        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Nova senha"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-4 pr-12 text-white text-sm placeholder:text-zinc-500 rounded outline-none focus:ring-1 focus:ring-primary"
              style={{
                backgroundColor: "rgba(51,51,51,1)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label="Mostrar senha"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <input
            type={show ? "text" : "password"}
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            placeholder="Confirme a nova senha"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-4 py-4 text-white text-sm placeholder:text-zinc-500 rounded outline-none focus:ring-1 focus:ring-primary"
            style={{
              backgroundColor: "rgba(51,51,51,1)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />

          {!ready && (
            <p className="text-xs text-zinc-500">
              Abra esta página pelo link enviado ao seu email para autorizar a troca.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !ready}
            className="w-full py-4 rounded bg-primary text-primary-foreground font-semibold text-base hover:bg-primary-glow transition-colors disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Atualizar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
