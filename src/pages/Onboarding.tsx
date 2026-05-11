// Onboarding completo — 11 etapas, uma pergunta por tela, barra de progresso

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ALL_GENRES, type Account, type AccountType } from "@/types/media";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Draft = {
  account_type: AccountType;
  content_filters: ("light" | "mature" | "sensitive")[];
  favorite_genres: string[];
  content_types: ("movies" | "series" | "documentaries" | "anime" | "doramas" | "reality" | "tv_shows")[];
  format: "short" | "long" | "both";
  era: "recent" | "classics" | "both";
  origin: "national" | "international" | "both";
  discovery: "trending" | "personalized" | "mixed";
  continuity: boolean;
  recommendations: boolean;
  intensity: "light" | "moderate" | "intense";
};

const TOTAL = 11;

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updateAccount, loading } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    account_type: "adult",
    content_filters: ["light"],
    favorite_genres: [],
    content_types: [],
    format: "both",
    era: "both",
    origin: "both",
    discovery: "mixed",
    continuity: true,
    recommendations: true,
    intensity: "moderate",
  });

  useEffect(() => {
    if (!loading && !user) navigate("/signup", { replace: true });
  }, [user, loading, navigate]);

  // Kids → força conteúdo leve
  useEffect(() => {
    if (draft.account_type === "kids") {
      setDraft((d) => ({ ...d, content_filters: ["light"], intensity: "light" }));
    }
  }, [draft.account_type]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const toggleArr = <T extends string>(key: keyof Draft, value: T) => {
    setDraft((d) => {
      const arr = (d[key] as unknown as T[]) ?? [];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...d, [key]: next } as Draft;
    });
  };

  const canAdvance = useMemo(() => {
    switch (step) {
      case 2:
        return draft.content_filters.length > 0;
      case 3:
        return draft.favorite_genres.length >= 5;
      case 4:
        return draft.content_types.length > 0;
      default:
        return true;
    }
  }, [step, draft]);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const patch: Partial<Account> = {
        account_type: draft.account_type,
        // Conta adulta/teen recebem +18 geral ATIVADO por padrão.
        // Conteúdo explícito permanece OFF (configurável depois em Configurações).
        allow_adult: draft.account_type !== "kids",
        favorite_genres: draft.favorite_genres,
        content_filters: draft.content_filters,
        content_types: draft.content_types,
        format: draft.format,
        era: draft.era,
        origin: draft.origin,
        discovery: draft.discovery,
        continuity: draft.continuity,
        recommendations: draft.recommendations,
        intensity: draft.intensity,
        onboarded: true,
        onboarding_step: TOTAL,
      };
      await updateAccount(patch);
      toast({
        title: "Conta personalizada com sucesso!",
        description: "Seu catálogo está pronto.",
      });
      navigate("/");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!canAdvance) return;
    if (step === TOTAL) finish();
    else setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 md:py-10">
      <Logo size="md" className="mb-6 md:mb-8" />

      {/* Barra de progresso */}
      <div className="max-w-2xl w-full mx-auto mb-6 md:mb-10">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
          <span>Etapa {step} de {TOTAL}</span>
          <span>{Math.round((step / TOTAL) * 100)}%</span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto">
        <div key={step} className="animate-fade-in-up">
          {step === 1 && (
            <Question title="Qual é o tipo deste perfil?" subtitle="Isso define o catálogo inicial.">
              <Grid2>
                <Choice active={draft.account_type === "adult"} onClick={() => set("account_type", "adult")} title="Adulto" desc="Catálogo completo" />
                <Choice active={draft.account_type === "teen"} onClick={() => set("account_type", "teen")} title="Adolescente" desc="Catálogo com restrições" />
                <Choice active={draft.account_type === "kids"} onClick={() => set("account_type", "kids")} title="Kids" desc="Apenas conteúdo infantil" />
              </Grid2>
            </Question>
          )}

          {step === 2 && (
            <Question
              title="Quais tipos de conteúdo deseja permitir?"
              subtitle={draft.account_type === "kids" ? "Perfis Kids só recebem conteúdo leve." : "Você pode marcar mais de um."}
            >
              <Stack>
                <Toggle
                  disabled={draft.account_type === "kids"}
                  active={draft.content_filters.includes("light")}
                  onClick={() => toggleArr("content_filters", "light")}
                  title="Conteúdo leve"
                  desc="Livre / +12 — para todos os públicos"
                />
                <Toggle
                  disabled={draft.account_type === "kids"}
                  active={draft.content_filters.includes("mature")}
                  onClick={() => toggleArr("content_filters", "mature")}
                  title="Conteúdo maduro"
                  desc="Violência intensa, crime, linguagem forte"
                />
                <Toggle
                  disabled={draft.account_type === "kids"}
                  active={draft.content_filters.includes("sensitive")}
                  onClick={() => toggleArr("content_filters", "sensitive")}
                  title="Conteúdo sensível"
                  desc="Nudez, conteúdo sexual"
                />
              </Stack>
            </Question>
          )}

          {step === 3 && (
            <Question
              title="Seus gêneros favoritos"
              subtitle={`Escolha pelo menos 5 — selecionados: ${draft.favorite_genres.length}`}
            >
              <div className="flex flex-wrap gap-2">
                {ALL_GENRES.map((g) => {
                  const on = draft.favorite_genres.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => toggleArr("favorite_genres", g)}
                      className={cn(
                        "text-sm px-3.5 py-2 rounded-full border transition-all",
                        on
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-surface border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      )}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </Question>
          )}

          {step === 4 && (
            <Question title="Que tipos de conteúdo você curte?" subtitle="Selecione um ou mais.">
              <Grid2>
                {[
                  ["movies", "Filmes"],
                  ["series", "Séries"],
                  ["documentaries", "Documentários"],
                  ["anime", "Animes"],
                  ["doramas", "Doramas"],
                  ["reality", "Reality shows"],
                  ["tv_shows", "Programas de TV"],
                ].map(([val, label]) => (
                  <Toggle
                    key={val}
                    active={draft.content_types.includes(val as Draft["content_types"][number])}
                    onClick={() => toggleArr("content_types", val as Draft["content_types"][number])}
                    title={label}
                  />
                ))}
              </Grid2>
            </Question>
          )}

          {step === 5 && (
            <Question title="Formato preferido" subtitle="Curto, longo ou tanto faz?">
              <Grid3>
                <Choice active={draft.format === "short"} onClick={() => set("format", "short")} title="Curto" desc="Até 1h por episódio/filme" />
                <Choice active={draft.format === "long"} onClick={() => set("format", "long")} title="Longo" desc="Mais de 1h" />
                <Choice active={draft.format === "both"} onClick={() => set("format", "both")} title="Ambos" desc="Sem preferência" />
              </Grid3>
            </Question>
          )}

          {step === 6 && (
            <Question title="Lançamentos ou clássicos?" subtitle="Quando lançado importa pra você?">
              <Grid3>
                <Choice active={draft.era === "recent"} onClick={() => set("era", "recent")} title="Recentes" desc="Lançamentos do ano" />
                <Choice active={draft.era === "classics"} onClick={() => set("era", "classics")} title="Clássicos" desc="Antes dos anos 2000" />
                <Choice active={draft.era === "both"} onClick={() => set("era", "both")} title="Ambos" desc="Misture pra mim" />
              </Grid3>
            </Question>
          )}

          {step === 7 && (
            <Question title="Origem do conteúdo" subtitle="De onde devem vir as produções?">
              <Grid3>
                <Choice active={draft.origin === "national"} onClick={() => set("origin", "national")} title="Nacional" desc="Brasil em primeiro" />
                <Choice active={draft.origin === "international"} onClick={() => set("origin", "international")} title="Internacional" desc="EUA, Coreia, Europa…" />
                <Choice active={draft.origin === "both"} onClick={() => set("origin", "both")} title="Ambos" desc="Tudo misturado" />
              </Grid3>
            </Question>
          )}

          {step === 8 && (
            <Question title="Como prefere descobrir títulos?" subtitle="Define o que aparece em destaque.">
              <Grid3>
                <Choice active={draft.discovery === "trending"} onClick={() => set("discovery", "trending")} title="Em alta" desc="O que todo mundo assiste" />
                <Choice active={draft.discovery === "personalized"} onClick={() => set("discovery", "personalized")} title="Personalizado" desc="Só baseado em você" />
                <Choice active={draft.discovery === "mixed"} onClick={() => set("discovery", "mixed")} title="Misto" desc="Um pouco dos dois" />
              </Grid3>
            </Question>
          )}

          {step === 9 && (
            <Question title="Continuar de onde parou?" subtitle="Voltar automaticamente para a cena exata.">
              <Grid2>
                <Choice active={draft.continuity === true} onClick={() => set("continuity", true)} title="Sim, continue" desc="Retomar reprodução" />
                <Choice active={draft.continuity === false} onClick={() => set("continuity", false)} title="Não precisa" desc="Sempre começar do início" />
              </Grid2>
            </Question>
          )}

          {step === 10 && (
            <Question title="Quer recomendações personalizadas?" subtitle="Sugestões com base no que você assiste.">
              <Grid2>
                <Choice active={draft.recommendations === true} onClick={() => set("recommendations", true)} title="Quero" desc="Sugestões inteligentes" />
                <Choice active={draft.recommendations === false} onClick={() => set("recommendations", false)} title="Não quero" desc="Só catálogo cru" />
              </Grid2>
            </Question>
          )}

          {step === 11 && (
            <Question title="Intensidade do conteúdo" subtitle="Quão pesado pode ser?">
              <Grid3>
                <Choice
                  disabled={draft.account_type === "kids"}
                  active={draft.intensity === "light"}
                  onClick={() => set("intensity", "light")}
                  title="Leve"
                  desc="Sem cenas pesadas"
                />
                <Choice
                  disabled={draft.account_type === "kids"}
                  active={draft.intensity === "moderate"}
                  onClick={() => set("intensity", "moderate")}
                  title="Moderado"
                  desc="Equilibrado"
                />
                <Choice
                  disabled={draft.account_type === "kids"}
                  active={draft.intensity === "intense"}
                  onClick={() => set("intensity", "intense")}
                  title="Intenso"
                  desc="Sem moderação"
                />
              </Grid3>
            </Question>
          )}
        </div>

        {/* Footer ações */}
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={back}
            disabled={step === 1 || saving}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>

          {!canAdvance && step === 3 && (
            <span className="text-[11px] text-muted-foreground">
              Faltam {Math.max(0, 5 - draft.favorite_genres.length)} para avançar
            </span>
          )}

          <button
            onClick={next}
            disabled={!canAdvance || saving}
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-md transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary-glow",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {step === TOTAL ? (
              <>
                {saving ? "Finalizando..." : "Concluir"}
                <Sparkles className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============= UI helpers =============
const Question = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div>
      <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-2">{title}</h1>
    {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
    {children}
  </div>
);

const Grid2 = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
);

const Grid3 = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>
);

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-2.5">{children}</div>
);

const Choice = ({
  active,
  onClick,
  title,
  desc,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "text-left p-4 rounded-2xl border transition-all duration-200 shadow-[0_12px_32px_-18px_hsl(var(--foreground)/0.18)] hover:-translate-y-0.5",
      active
        ? "bg-primary/10 border-primary shadow-[0_20px_50px_-24px_hsl(var(--primary)/0.45)]"
        : "bg-surface-elevated/80 border-border hover:border-foreground/30",
      disabled && "opacity-40 cursor-not-allowed"
    )}
  >
    <div className="font-semibold text-sm text-foreground">{title}</div>
    {desc && <div className="text-xs text-muted-foreground mt-1">{desc}</div>}
  </button>
);

const Toggle = ({
  active,
  onClick,
  title,
  desc,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full text-left p-4 rounded-2xl border flex items-center gap-3 transition-all duration-200 shadow-[0_12px_32px_-18px_hsl(var(--foreground)/0.18)] hover:-translate-y-0.5",
      active
        ? "bg-primary/10 border-primary shadow-[0_20px_50px_-24px_hsl(var(--primary)/0.45)]"
        : "bg-surface-elevated/80 border-border hover:border-foreground/30",
      disabled && "opacity-40 cursor-not-allowed"
    )}
  >
    <span
      className={cn(
        "h-5 w-5 rounded border grid place-items-center shrink-0 transition-colors",
        active ? "bg-primary border-primary text-primary-foreground" : "border-border"
      )}
    >
      {active && <Check className="h-3.5 w-3.5" />}
    </span>
    <span className="flex-1">
      <span className="block text-sm font-semibold text-foreground">{title}</span>
      {desc && <span className="block text-xs text-muted-foreground mt-0.5">{desc}</span>}
    </span>
  </button>
);

export default Onboarding;
