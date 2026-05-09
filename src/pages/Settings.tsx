// Página /settings — categorias profissionais com toggles e CRUD reais.

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { getMockMediaById } from "@/lib/mockData";
import { AssistantPanel } from "@/components/AssistantPanel";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AtSign,
  Bell,
  Check,
  Cookie,
  Database,
  Download,
  EyeOff,
  FileDown,
  Globe,
  Headset,
  History as HistoryIcon,
  Laptop,
  LifeBuoy,
  LogOut,
  Lock,
  Mail,
  MonitorPlay,
  Pencil,
  Sparkles,
  SkipForward,
  Subtitles,
  Trash2,
  User as UserIcon,
  UserCircle2,
  Monitor,
  Shield,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n, LANGUAGE_OPTIONS, type AppLanguage } from "@/lib/i18n";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useDevices } from "@/hooks/useDevices";
import { Logo } from "@/components/Logo";
import { PRESET_AVATARS } from "@/lib/avatars";
import { useUserAvatar } from "@/contexts/UserAvatarContext";

type SectionKey = "account" | "playback" | "content" | "history" | "privacy" | "support";

export default function Settings() {
  const navigate = useNavigate();
  const { user, account, signOut, signOutEverywhere } = useAuth();
  const { t } = useI18n();
  const { settings, loading, update } = useUserSettings();
  const [active, setActive] = useState<SectionKey>("account");

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  if (!user || !settings) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  const sections: Array<{ key: SectionKey; label: string; icon: typeof UserIcon }> = [
    { key: "account", label: t("set.section.account"), icon: UserIcon },
    { key: "playback", label: t("set.section.playback"), icon: MonitorPlay },
    { key: "content", label: t("set.section.content"), icon: Sparkles },
    { key: "history", label: t("set.section.history"), icon: HistoryIcon },
    { key: "privacy", label: t("set.section.privacy"), icon: Shield },
    { key: "support", label: t("set.section.support"), icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ overflowX: "hidden", maxWidth: "100vw" }}>
      {/* Top bar */}
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
          <h1 className="ml-2 font-display text-lg tracking-wide">{t("set.title")}</h1>
        </div>
      </header>

      <main className="container-flix pt-5 pb-24 grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar (desktop) / Tabs com scroll horizontal real (mobile) */}
        <nav className="lg:sticky lg:top-20 lg:self-start -mx-4 lg:mx-0" aria-label="Categorias de configurações">
          <div
            className="settings-tabs px-4 lg:px-0"
            style={{
              display: "flex",
              flexWrap: "nowrap",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none" as any,
              msOverflowStyle: "none" as any,
              gap: "8px",
              maxWidth: "100vw",
            }}
          >
            <ul className="flex lg:flex-col gap-2 lg:gap-1.5 lg:w-full" style={{ display: "flex", flexWrap: "nowrap" }}>
              {sections.map((s) => {
                const isActive = s.key === active;
                return (
                  <li key={s.key} style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => setActive(s.key)}
                      style={{ flexShrink: 0, whiteSpace: "nowrap" }}
                      className={cn(
                        "lg:w-full flex items-center gap-2 px-4 py-2.5 rounded-full lg:rounded-xl text-sm transition-all border",
                        isActive
                          ? "bg-white/10 text-foreground border-white/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5 border-white/5"
                      )}
                    >
                      <s.icon className="h-4 w-4" strokeWidth={1.75} />
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Content */}
        <div className="space-y-4 md:space-y-5 min-w-0">
          {active === "account" && <AccountSection />}
          {active === "playback" && <PlaybackSection />}
          {active === "content" && <ContentSection />}
          {active === "history" && <HistorySection />}
          {active === "privacy" && <PrivacySection />}
          {active === "support" && <SupportSection />}
        </div>
      </main>
    </div>
  );
}

// ============== Sections ==============

function AccountSection() {
  const navigate = useNavigate();
  const { user, account, signOut, signOutEverywhere, updateIdentity } = useAuth();
  const { avatarUrl: ctxAvatar, saveAvatar } = useUserAvatar();
  const { t } = useI18n();
  const { settings, update } = useUserSettings();
  const { devices, currentFingerprint, removeDevice } = useDevices();
  const [editingIdentity, setEditingIdentity] = useState(false);

  if (!settings) return null;

  const displayName = account?.display_name ?? user?.email ?? "";
  const avatarUrl = ctxAvatar ?? account?.avatar_url ?? null;

  // Agrupar sessões: atual primeiro, depois anteriores ordenadas por last_seen_at desc
  const currentSession = devices.find((d) => d.device_fingerprint === currentFingerprint);
  const otherSessions = devices.filter((d) => d.device_fingerprint !== currentFingerprint);

  return (
    <>
      <Card>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-primary/70 to-primary-glow/40 ring-2 ring-white/10 grid place-items-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold truncate">{displayName}</h3>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => setEditingIdentity(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium hover:border-white/20 hover:bg-white/5 transition-colors shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t("set.identity.edit")}
          </button>
        </div>
      </Card>

      <AvatarPickerCard
        currentUrl={avatarUrl}
        onSelect={async (url) => {
          await saveAvatar(url);
          toast({ title: t("set.identity.saved") });
        }}
      />

      <ChangeEmailCard />

      <Card>
        <Header icon={Globe} title={t("set.language")} desc={t("set.language.desc")} />
        <select
          value={settings.language}
          onChange={(e) => update({ language: e.target.value as AppLanguage })}
          className="mt-3 w-full sm:w-64 bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
        >
          {LANGUAGE_OPTIONS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </Card>

      <ChangePasswordCard />

      <Card>
        <Header icon={Laptop} title={t("set.sessions")} desc={t("set.sessions.desc")} />

        {currentSession && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              {t("set.sessions.current")}
            </p>
            <SessionItem session={currentSession} isCurrent />
          </div>
        )}

        {otherSessions.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              {t("set.sessions.previous")}
            </p>
            <ul className="space-y-2">
              {otherSessions.map((d) => (
                <SessionItem
                  key={d.id}
                  session={d}
                  onRemove={() => removeDevice(d.id)}
                  removeLabel={t("set.devices.logoutOne")}
                />
              ))}
            </ul>
          </div>
        )}

        {otherSessions.length > 0 && (
          <button
            onClick={async () => {
              await signOutEverywhere();
              navigate("/login", { replace: true });
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-white/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("set.devices.logoutAll")}
          </button>
        )}
      </Card>

      <Card>
        <button
          onClick={async () => {
            await signOut();
            navigate("/login", { replace: true });
          }}
          className="w-full flex items-center justify-between text-left gap-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("set.logout")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("set.logout.confirm")}</p>
          </div>
          <LogOut className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </Card>

      {editingIdentity && (
        <EditIdentityModal
          initialName={displayName}
          initialAvatarUrl={avatarUrl}
          onClose={() => setEditingIdentity(false)}
          onSave={async (patch) => {
            await updateIdentity(patch);
            setEditingIdentity(false);
            toast({ title: t("set.identity.saved") });
          }}
        />
      )}
    </>
  );
}

function SessionItem({
  session,
  isCurrent,
  onRemove,
  removeLabel,
}: {
  session: { id: string; device_name: string | null; platform: string | null; last_seen_at: string };
  isCurrent?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/5 bg-background/40 p-3">
      <span className="h-9 w-9 grid place-items-center rounded-full bg-white/5 shrink-0">
        <Monitor className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {session.device_name ?? session.platform ?? "Dispositivo"}
          {isCurrent && (
            <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-primary">
              {t("set.sessions.thisDevice")}
            </span>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {new Date(session.last_seen_at).toLocaleString()}
        </p>
      </div>
      {!isCurrent && onRemove && (
        <button
          onClick={onRemove}
          className="text-[11px] text-muted-foreground hover:text-foreground shrink-0"
        >
          {removeLabel}
        </button>
      )}
    </li>
  );
}

function ChangeEmailCard() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || trimmed === user?.email) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao alterar email", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Confirmação enviada",
      description: "Verifique sua caixa de entrada para confirmar o novo email.",
    });
  };

  return (
    <Card>
      <Header icon={AtSign} title="Email da conta" desc="Atualize o email usado para login. Você precisará confirmar pelo link enviado." />
      <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2 max-w-xl items-start md:items-stretch">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className="w-full sm:flex-1 min-w-0 bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={saving || !email.trim() || email.trim() === user?.email}
          className="w-auto md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 shrink-0"
        >
          <Mail className="h-3.5 w-3.5" />
          {saving ? "Enviando..." : "Atualizar email"}
        </button>
      </form>
    </Card>
  );
}

function AvatarPickerCard({
  currentUrl,
  onSelect,
}: {
  currentUrl: string | null;
  onSelect: (url: string | null) => Promise<void>;
}) {
  const [saving, setSaving] = useState<string | null>(null);

  const handlePick = async (url: string | null) => {
    if (saving) return;
    setSaving(url ?? "remove");
    try {
      await onSelect(url);
    } finally {
      setSaving(null);
    }
  };

  const avatars = PRESET_AVATARS;

  return (
    <Card>
      <Header
        icon={UserCircle2}
        title="Avatar do perfil"
        desc="Escolha uma imagem para representar seu perfil. Aparece na navbar e nas configurações."
      />
      <div
        className="mt-4 grid gap-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-hide"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(64px, 80px))" }}
      >
        {avatars.map((a) => {
          const isActive = currentUrl === a.url;
          const isLoading = saving === a.url;
          return (
            <button
              key={a.id}
              onClick={() => handlePick(a.url)}
              disabled={!!saving}
              aria-label={a.label}
              aria-pressed={isActive}
              className={cn(
                "relative aspect-square rounded-full overflow-hidden transition-all border",
                isActive
                  ? "border-primary ring-2 ring-primary/60 shadow-[0_0_18px_-2px_hsl(var(--primary)/0.55)]"
                  : "border-white/10 hover:border-white/30 hover:scale-105",
                saving && !isActive && "opacity-50"
              )}
            >
              <img src={a.url} alt={a.label} className="h-full w-full object-cover" />
              {isLoading && (
                <div className="absolute inset-0 grid place-items-center bg-black/50">
                  <span className="text-[10px] text-white">...</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {currentUrl && (
        <div className="mt-4">
          <button
            onClick={() => handlePick(null)}
            disabled={!!saving}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 disabled:opacity-50"
          >
            {saving === "remove" ? "Removendo..." : "Remover avatar"}
          </button>
        </div>
      )}
    </Card>
  );
}

function ChangePasswordCard() {
  const { t } = useI18n();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) {
      toast({ title: "Senha muito curta", variant: "destructive" });
      return;
    }
    if (pwd !== pwd2) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setPwd("");
    setPwd2("");
    toast({ title: t("set.security.saved") });
  };

  return (
    <Card>
      <Header icon={Lock} title={t("set.security.changePwd")} desc={t("set.security.activity.desc")} />
      <form onSubmit={submit} className="mt-3 space-y-2 max-w-sm">
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder={t("set.security.newPwd")}
          minLength={6}
          required
          autoComplete="new-password"
          className="w-full bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
        />
        <input
          type="password"
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
          placeholder={t("set.security.confirmPwd")}
          minLength={6}
          required
          autoComplete="new-password"
          className="w-full bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "..." : t("set.security.save")}
        </button>
      </form>
    </Card>
  );
}

function ContentSection() {
  const { t } = useI18n();
  const { settings, update } = useUserSettings();
  const { account, updateAccount } = useAuth();
  if (!settings) return null;

  return (
    <>
      <Card>
        <Header
          icon={Shield}
          title="Conteúdo +18 (geral)"
          desc="Permite títulos com violência forte, drogas, linguagem adulta ou nudez leve. Ex: The Boys, Game of Thrones."
        />
        <Toggle
          value={!!account?.allow_adult}
          onChange={(v) => updateAccount({ allow_adult: v })}
        />
      </Card>

      <Card>
        <Header
          icon={Lock}
          title="Conteúdo adulto explícito"
          desc="Permite títulos com sexo explícito (ex: 365 Dias). Desativado por padrão."
        />
        <Toggle
          value={!!(account as any)?.allow_explicit}
          onChange={(v) => updateAccount({ allow_explicit: v } as any)}
        />
      </Card>

      <Card>
        <Header icon={Subtitles} title={t("set.subtitles")} desc={t("set.subtitles.desc")} />
        <Toggle
          value={settings.subtitles_enabled}
          onChange={(v) => update({ subtitles_enabled: v })}
        />
        {settings.subtitles_enabled && (
          <div className="mt-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              {t("set.subtitlesLang")}
            </p>
            <select
              value={settings.subtitles_language}
              onChange={(e) => update({ subtitles_language: e.target.value as AppLanguage })}
              className="w-full sm:w-64 bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      <Card>
        <Header icon={Database} title={t("set.dataSaver")} desc={t("set.dataSaver.desc")} />
        <Toggle
          value={settings.data_saver}
          onChange={(v) => update({ data_saver: v })}
        />
      </Card>



      <Card>
        <Header icon={Sparkles} title={t("set.recs")} desc={t("set.recs.desc")} />
        <Toggle
          value={settings.recommendations_enabled}
          onChange={(v) => update({ recommendations_enabled: v })}
        />
      </Card>

      <Card>
        <Header icon={Bell} title={t("set.notif.new")} desc={t("set.notif.new.desc")} />
        <Toggle
          value={settings.notifications_new_releases}
          onChange={(v) => update({ notifications_new_releases: v })}
        />
      </Card>

      <Card>
        <Header icon={Bell} title={t("set.notif.continue")} desc={t("set.notif.continue.desc")} />
        <Toggle
          value={settings.notifications_continue_watching}
          onChange={(v) => update({ notifications_continue_watching: v })}
        />
      </Card>
    </>
  );
}

function PrivacySection() {
  const { user } = useAuth();
  const { settings, update } = useUserSettings();
  const { clearAll } = useWatchHistory();
  const [collectData, setCollectData] = useState<boolean>(() => localStorage.getItem("streamflix:privacy:collect") !== "0");
  const [cookies, setCookies] = useState<boolean>(() => localStorage.getItem("streamflix:privacy:cookies") !== "0");
  const [requesting, setRequesting] = useState(false);

  if (!settings) return null;

  const persistFlag = (key: string, value: boolean) => {
    localStorage.setItem(key, value ? "1" : "0");
  };

  const requestData = async () => {
    if (!user) return;
    setRequesting(true);
    await supabase.from("support_tickets" as never).insert({
      user_id: user.id,
      name: user.email ?? "Usuário",
      email: user.email ?? "",
      category: "account",
      message: "Solicitação de exportação de dados pessoais (LGPD/GDPR).",
    } as never);
    setRequesting(false);
    toast({ title: "Solicitação enviada", description: "Entraremos em contato pelo email da conta." });
  };

  const clearPersonalization = async () => {
    await clearAll();
    Object.keys(localStorage)
      .filter((k) => k.startsWith("streamflix:") && !["streamflix:language", "streamflix:device-fingerprint"].includes(k))
      .forEach((k) => localStorage.removeItem(k));
    toast({ title: "Dados de personalização limpos" });
  };

  return (
    <>
      <Card>
        <Header icon={Database} title="Coleta de dados" desc="Permite o uso de dados anônimos para melhorar a experiência, métricas internas e correção de erros. Nenhum dado sensível é compartilhado." />
        <Toggle value={collectData} onChange={(v) => { setCollectData(v); persistFlag("streamflix:privacy:collect", v); }} />
      </Card>

      <Card>
        <Header icon={Cookie} title="Cookies e rastreamento" desc="Controla cookies de analytics e personalização. Cookies essenciais de login permanecem ativos." />
        <Toggle value={cookies} onChange={(v) => { setCookies(v); persistFlag("streamflix:privacy:cookies", v); }} />
      </Card>

      <Card>
        <Header icon={Sparkles} title="Dados de recomendação" desc="Usar seu histórico e preferências para personalizar destaques e sugestões do catálogo." />
        <Toggle value={settings.recommendations_enabled} onChange={(v) => update({ recommendations_enabled: v })} />
      </Card>

      <Card>
        <Header icon={EyeOff} title="Limpar dados de personalização" desc="Remove o que usamos para recomendar conteúdo (histórico salvo localmente, preferências derivadas e cache)." />
        <button
          onClick={clearPersonalization}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-white/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar agora
        </button>
      </Card>

      <Card>
        <Header icon={FileDown} title="Solicitar meus dados" desc="Receba uma cópia dos dados associados à sua conta. Atendemos em até 15 dias úteis no email cadastrado." />
        <button
          onClick={requestData}
          disabled={requesting}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-white/20 disabled:opacity-50"
        >
          <FileDown className="h-3.5 w-3.5" />
          {requesting ? "Enviando..." : "Solicitar dados"}
        </button>
      </Card>
    </>
  );
}

// =================== History Section ===================

function HistorySection() {
  const { settings, update } = useUserSettings();
  const { items, loading, removeItem, clearAll } = useWatchHistory();

  const groups = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startYesterday = startToday - 24 * 60 * 60 * 1000;
    const startWeek = startToday - 7 * 24 * 60 * 60 * 1000;

    const inProgress = items.filter((i) => !i.completed);
    const watched = items.filter((i) => i.completed);

    const bucket = (list: typeof items) => {
      const today: typeof items = [];
      const yesterday: typeof items = [];
      const week: typeof items = [];
      const older: typeof items = [];
      for (const it of list) {
        const ts = new Date(it.last_opened_at).getTime();
        if (ts >= startToday) today.push(it);
        else if (ts >= startYesterday) yesterday.push(it);
        else if (ts >= startWeek) week.push(it);
        else older.push(it);
      }
      return { today, yesterday, week, older };
    };

    return { inProgress: bucket(inProgress), watched: bucket(watched) };
  }, [items]);

  if (!settings) return null;

  return (
    <>
      <Card>
        <Header icon={HistoryIcon} title="Salvar histórico de visualização" desc="Quando desativado, o app não registra novas aberturas nem progresso aproximado." />
        <Toggle value={settings.watch_history_enabled} onChange={(v) => update({ watch_history_enabled: v })} />
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <Header icon={MonitorPlay} title="Continuar assistindo" desc="Conteúdos iniciados que ainda não foram finalizados." />
        </div>
        {loading ? (
          <p className="mt-4 text-xs text-muted-foreground">Carregando…</p>
        ) : (
          <HistoryGroupedList groups={groups.inProgress} onRemove={removeItem} emptyLabel="Nada em andamento." />
        )}
      </Card>

      <Card>
        <Header icon={Check} title="Assistidos" desc="Conteúdos que você já concluiu." />
        {loading ? (
          <p className="mt-4 text-xs text-muted-foreground">Carregando…</p>
        ) : (
          <HistoryGroupedList groups={groups.watched} onRemove={removeItem} emptyLabel="Nenhum título concluído ainda." />
        )}
      </Card>

      <Card>
        <Header icon={Trash2} title="Limpar todo o histórico" desc="Remove todos os registros de progresso e aberturas." />
        <button
          onClick={async () => {
            await clearAll();
            toast({ title: "Histórico apagado" });
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-white/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar histórico
        </button>
      </Card>
    </>
  );
}

function HistoryGroupedList({
  groups,
  onRemove,
  emptyLabel,
}: {
  groups: { today: any[]; yesterday: any[]; week: any[]; older: any[] };
  onRemove: (id: string) => void;
  emptyLabel: string;
}) {
  const total = groups.today.length + groups.yesterday.length + groups.week.length + groups.older.length;
  if (total === 0) return <p className="mt-4 text-xs text-muted-foreground">{emptyLabel}</p>;
  return (
    <div className="mt-4 space-y-4">
      {groups.today.length > 0 && <HistoryBucket title="Hoje" items={groups.today} onRemove={onRemove} />}
      {groups.yesterday.length > 0 && <HistoryBucket title="Ontem" items={groups.yesterday} onRemove={onRemove} />}
      {groups.week.length > 0 && <HistoryBucket title="Esta semana" items={groups.week} onRemove={onRemove} />}
      {groups.older.length > 0 && <HistoryBucket title="Anteriores" items={groups.older} onRemove={onRemove} />}
    </div>
  );
}

function HistoryBucket({
  title,
  items,
  onRemove,
}: {
  title: string;
  items: any[];
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{title}</p>
      <ul className="space-y-2">
        {items.map((it) => {
          const media = getMockMediaById(it.media_id);
          const title = media?.title ?? `Título #${it.media_id}`;
          const poster = media?.posterUrl;
          const pct = Math.max(1, Math.min(100, it.progress_pct));
          return (
            <li key={it.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-background/40 p-2.5">
              <div className="h-12 w-9 rounded-md overflow-hidden bg-white/5 shrink-0">
                {poster ? <img src={poster} alt={title} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {title}
                  {it.media_type === "tv" && it.episode_number ? (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Ep. {it.episode_number}
                    </span>
                  ) : null}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-white/40" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-9 text-right">~{pct}%</span>
                </div>
              </div>
              <button
                onClick={() => onRemove(it.id)}
                className="h-8 w-8 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 shrink-0"
                aria-label="Remover do histórico"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SupportSection() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [category, setCategory] = useState<"bug" | "account" | "content" | "suggestion" | "other">("bug");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState<"support" | "expert">("support");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("support_tickets" as never).insert({
      user_id: user.id,
      name: name.trim().slice(0, 120),
      email: email.trim().slice(0, 160),
      category,
      message: message.trim().slice(0, 4000),
    } as never);
    setSending(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setMessage("");
    toast({ title: t("set.support.sent"), description: t("set.support.sentDesc") });
  };

  return (
    <>
      <Card>
        <Header icon={LifeBuoy} title={t("set.support.title")} desc="" />
        <form onSubmit={submit} className="mt-3 space-y-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("set.support.name")}
            required
            maxLength={120}
            onFocus={(e) => setTimeout(() => e.currentTarget?.scrollIntoView({ block: "center", behavior: "smooth" }), 250)}
            className="w-full bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("set.support.email")}
            required
            maxLength={160}
            onFocus={(e) => setTimeout(() => e.currentTarget?.scrollIntoView({ block: "center", behavior: "smooth" }), 250)}
            className="w-full bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-full bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="bug">{t("set.support.cat.bug")}</option>
            <option value="account">{t("set.support.cat.account")}</option>
            <option value="content">{t("set.support.cat.content")}</option>
            <option value="suggestion">{t("set.support.cat.suggestion")}</option>
            <option value="other">{t("set.support.cat.other")}</option>
          </select>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("set.support.message")}
            required
            maxLength={4000}
            rows={4}
            onFocus={(e) => setTimeout(() => e.currentTarget?.scrollIntoView({ block: "center", behavior: "smooth" }), 250)}
            className="w-full bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50 resize-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {sending ? "..." : t("set.support.submit")}
          </button>
        </form>
      </Card>

      <Card>
        <Header icon={Headset} title="Assistente inteligente" desc="Tire dúvidas sobre o app ou peça recomendações de filmes e séries em conversa real." />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => { setAssistantMode("support"); setAssistantOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium hover:bg-white/[0.08]"
          >
            <Headset className="h-3.5 w-3.5" />
            Abrir suporte
          </button>
          <button
            onClick={() => { setAssistantMode("expert"); setAssistantOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium hover:bg-white/[0.08]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Falar com o especialista
          </button>
        </div>
      </Card>
      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} initialMode={assistantMode} />
    </>
  );
}

// ============== Playback Section ==============

function PlaybackSection() {
  const { t } = useI18n();
  const { settings, update } = useUserSettings();
  if (!settings) return null;

  return (
    <>
      <Card>
        <Header icon={MonitorPlay} title={t("set.playback.autoplay")} desc={t("set.playback.autoplay.desc")} />
        <Toggle value={settings.autoplay_next} onChange={(v) => update({ autoplay_next: v })} />
      </Card>
      <Card>
        <Header icon={MonitorPlay} title={t("set.playback.resume")} desc={t("set.playback.resume.desc")} />
        <Toggle value={settings.resume_playback} onChange={(v) => update({ resume_playback: v })} />
      </Card>
      <Card>
        <Header icon={SkipForward} title={t("set.playback.skipIntro")} desc={t("set.playback.skipIntro.desc")} />
        <Toggle value={settings.skip_intro_auto} onChange={(v) => update({ skip_intro_auto: v })} />
        {settings.skip_intro_auto && (
          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              {t("set.playback.skipSeconds")}: <span className="text-foreground font-semibold">{settings.skip_intro_seconds}s</span>
            </p>
            <input
              type="range"
              min={30}
              max={180}
              step={5}
              value={settings.skip_intro_seconds}
              onChange={(e) => update({ skip_intro_seconds: Number(e.target.value) })}
              className="w-full sm:w-72 accent-primary"
            />
          </div>
        )}
      </Card>
      <Card>
        <Header icon={Zap} title={t("set.playback.performance")} desc={t("set.playback.performance.desc")} />
        <Toggle value={settings.performance_mode} onChange={(v) => update({ performance_mode: v })} />
      </Card>
      <Card>
        <Header icon={Sparkles} title={t("set.playback.discovery")} desc={t("set.playback.discovery.desc")} />
        <Toggle value={settings.discovery_mode} onChange={(v) => update({ discovery_mode: v })} />
      </Card>
    </>
  );
}

// ============== Edit Identity Modal ==============

function EditIdentityModal({
  initialName,
  initialAvatarUrl,
  onClose,
  onSave,
}: {
  initialName: string;
  initialAvatarUrl: string | null;
  onClose: () => void;
  onSave: (patch: { name: string; avatar_url: string | null }) => Promise<void>;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-popover border border-white/10 rounded-2xl p-6 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl">{t("set.identity.modal.title")}</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10"
            aria-label={t("set.modal.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("set.identity.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="mt-1.5 w-full bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("set.identity.chooseAvatar")}
            </label>
            <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-3">
              {PRESET_AVATARS.map((a) => {
                const selected = avatarUrl === a.url;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAvatarUrl(a.url)}
                    className={cn(
                      "relative aspect-square rounded-full overflow-hidden transition-all",
                      "ring-offset-2 ring-offset-popover hover:scale-105 active:scale-95",
                      selected ? "ring-2 ring-primary scale-105" : "ring-1 ring-white/10"
                    )}
                    aria-label={a.label}
                    aria-pressed={selected}
                  >
                    <img
                      src={a.url}
                      alt={a.label}
                      loading="lazy"
                      width={120}
                      height={120}
                      className="w-full h-full object-cover"
                    />
                    {selected && (
                      <div className="absolute inset-0 grid place-items-center bg-primary/30">
                        <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-white/5">
              {t("set.modal.cancel")}
            </button>
            <button
              disabled={saving || !name.trim()}
              onClick={async () => {
                setSaving(true);
                await onSave({ name: name.trim(), avatar_url: avatarUrl });
                setSaving(false);
              }}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {saving ? t("set.modal.saving") : t("set.modal.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============== UI primitives ==============

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 md:p-6">
      {children}
    </section>
  );
}

function Header({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof UserIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold truncate">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "mt-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        value ? "bg-primary" : "bg-white/10"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          value ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
