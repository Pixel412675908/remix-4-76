// Recuperar senha — design orgânico com glassmorphism.

import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(229,9,20,0.18) 0%, transparent 60%)",
        }}
      />

      <div
        className="relative w-full max-w-[400px] rounded-3xl p-8 sm:p-10 animate-fade-in backdrop-blur-xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex justify-center mb-6">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>

        <h1 className="font-bold text-2xl text-white text-center mb-2">Recuperar senha</h1>
        <p className="text-xs text-zinc-500 text-center mb-7">
          Enviaremos um link de redefinição para seu email.
        </p>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="h-12 w-12 rounded-full grid place-items-center" style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>
              <CheckCircle2 className="h-6 w-6" style={{ color: "#22C55E" }} />
            </div>
            <p className="text-white text-sm">
              Se existir uma conta com este email, você receberá o link em alguns minutos.
            </p>
            <Link to="/login" className="mt-3 text-zinc-500 text-sm hover:text-white">
              Voltar para Entrar
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div
              className="flex items-center gap-3 py-3 transition-colors"
              style={{
                borderBottom: focused
                  ? "1px solid #E50914"
                  : "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Mail className="h-4 w-4 text-zinc-500 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Email"
                required
                autoComplete="email"
                className="flex-1 min-w-0 bg-transparent outline-none text-white text-sm placeholder:text-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full font-bold text-white transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 mt-2"
              style={{
                backgroundColor: "#E50914",
                boxShadow: "0 8px 24px rgba(229,9,20,0.3)",
              }}
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>

            <p className="text-zinc-500 text-sm text-center pt-1">
              Lembrou?{" "}
              <Link to="/login" className="text-white font-semibold hover:text-[#E50914]">
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
