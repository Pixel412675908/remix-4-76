// AuthForm — design orgânico minimalista (sem card quadrado)
// Campos com border-bottom apenas, ícones à esquerda, botão pílula vermelho.

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { toast } from "@/hooks/use-toast";
import { PasswordStrength } from "@/components/PasswordStrength";
import { evaluatePassword } from "@/lib/passwordStrength";

interface AuthFormProps {
  mode: "login" | "signup";
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const isLogin = mode === "login";
  const { signIn, signUp, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) navigate("/", { replace: true });
  }, [authLoading, navigate, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (isLogin) {
      setLoading(true);
      try {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          toast({ title: "Não foi possível entrar", description: error, variant: "destructive" });
          return;
        }
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!name.trim()) {
      toast({ title: "Informe seu nome", variant: "destructive" });
      return;
    }
    const strength = evaluatePassword(password);
    if (strength.level === "weak") {
      toast({
        title: "Senha muito fraca",
        description: "Use 8+ caracteres com letras, números e símbolos.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp(email.trim(), password, name.trim());
      if (error) {
        toast({ title: "Erro no cadastro", description: error, variant: "destructive" });
        return;
      }
      navigate("/onboarding", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* glow radial */}
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

        <h1 className="font-bold text-3xl text-white text-center mb-8">
          {isLogin ? "Entrar" : "Criar conta"}
        </h1>

        <form onSubmit={submit} className="space-y-5" autoComplete="on">
          {!isLogin && (
            <UnderlineField
              icon={UserIcon}
              type="text"
              autoComplete="name"
              value={name}
              onChange={setName}
              placeholder="Nome completo"
              maxLength={60}
              required
            />
          )}

          <UnderlineField
            icon={Mail}
            type="email"
            autoComplete={isLogin ? "username" : "email"}
            inputMode="email"
            value={email}
            onChange={setEmail}
            placeholder="Email"
            maxLength={120}
            required
          />

          <UnderlineField
            icon={Lock}
            type={showPwd ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={setPassword}
            placeholder="Senha"
            minLength={6}
            maxLength={72}
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {!isLogin && <PasswordStrength password={password} />}

          {isLogin && (
            <div className="flex justify-end -mt-1">
              <Link
                to="/recuperar-senha"
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-bold text-white transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            style={{
              backgroundColor: "#E50914",
              boxShadow: "0 8px 24px rgba(229,9,20,0.3)",
            }}
          >
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta grátis"}
          </button>
        </form>

        <p className="text-zinc-500 text-sm mt-7 text-center">
          {isLogin ? "Novo por aqui? " : "Já tem conta? "}
          <Link
            to={isLogin ? "/signup" : "/login"}
            className="text-white font-semibold hover:text-[#E50914] transition-colors"
          >
            {isLogin ? "Criar conta" : "Entrar"}
          </Link>
        </p>
      </div>
    </div>
  );
};

// Campo de input com border-bottom apenas
interface UnderlineFieldProps {
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  trailing?: React.ReactNode;
}

function UnderlineField({
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  required,
  minLength,
  maxLength,
  trailing,
}: UnderlineFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-3 py-3 transition-colors"
      style={{
        borderBottom: focused
          ? "1px solid #E50914"
          : "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <Icon className="h-4 w-4 text-zinc-500 shrink-0" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className="flex-1 min-w-0 bg-transparent outline-none text-white text-sm placeholder:text-zinc-600"
      />
      {trailing}
    </div>
  );
}
