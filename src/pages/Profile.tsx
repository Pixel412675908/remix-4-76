// /profile — Meu Perfil: tudo que era "Configuração de Conta".

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { AccountSection } from "@/pages/Settings";

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ overflowX: "hidden", maxWidth: "100vw" }}
    >
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container-flix flex items-center gap-3 h-14">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/5"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Logo size="sm" />
          <h1 className="ml-2 font-display text-lg tracking-wide">Meu Perfil</h1>
        </div>
      </header>

      <main className="container-flix pt-5 pb-24 max-w-3xl">
        <div className="space-y-4 md:space-y-5 min-w-0">
          <AccountSection />
        </div>
      </main>
    </div>
  );
}
