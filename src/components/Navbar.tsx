import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, User as UserIcon, LogOut, Settings as SettingsIcon, Compass, ChevronDown, X, UserCircle2, Lightbulb, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { AssistantPanel } from "@/components/AssistantPanel";
import { useUserAvatar } from "@/contexts/UserAvatarContext";


export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { user, account, activeProfile, isExplorer, isAdmin, signOut } = useAuth();
  const { avatarUrl: ctxAvatar } = useUserAvatar();

  // Esconde a barra de navegação secundária (e a navbar inteira em telas
  // de conteúdo individual) para não atrapalhar a leitura da sinopse.
  const isContentRoute = /^\/(filme|movie|serie|series|titulo|conteudo|watch|player)\/[^/]+/.test(
    location.pathname
  );
  if (isContentRoute) return null;

  const navItems = useMemo(
    () => [
      { label: "Início", to: "/" },
      { label: "Filmes", to: "/browse/movies" },
      { label: "Séries", to: "/browse/series" },
      { label: "Novelas", to: "/novelas" },
      { label: "Animes", to: "/animes" },
      { label: "Desenhos", to: "/desenhos" },
      { label: "Coleções", to: "/colecoes" },
      { label: "Em Breve", to: "/em-breve" },
      { label: "Minha Lista", to: "/my-list" },
    ],
    []
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border"
          : "bg-gradient-to-b from-background/85 to-transparent"
      )}
    >
      <nav className="container-flix flex items-center h-14 md:h-16 gap-2 md:gap-5">
        <Logo size="sm" />

        <ul className="hidden lg:flex items-center gap-5 ml-3 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <li key={item.to} className="shrink-0">
                <Link
                  to={item.to}
                  className={cn(
                    "text-[13px] transition-colors whitespace-nowrap",
                    active ? "text-primary font-bold" : "text-muted-foreground font-medium hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Search — botão simples; expande inline em desktop, full-width drawer em mobile */}
          <form onSubmit={handleSearch} className="flex items-center">
            {searchOpen ? (
              <div className="flex items-center bg-surface-elevated/90 backdrop-blur border border-white/10 rounded-full overflow-hidden h-9 w-[200px] sm:w-64 transition-all">
                <Search className="h-[15px] w-[15px] ml-3 text-muted-foreground shrink-0" strokeWidth={1.75} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("nav.searchPlaceholder")}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm px-2 placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => { setQuery(""); setSearchOpen(false); }}
                  aria-label={t("nav.search")}
                  className="h-9 w-8 grid place-items-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={t("nav.search")}
                className="h-9 w-9 grid place-items-center rounded-full text-foreground/90 hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            )}
          </form>

          {/* User cluster */}
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1 h-9 pl-1 pr-1.5 rounded-full hover:bg-white/5 transition-colors"
                aria-label={t("nav.profileMenu")}
                aria-expanded={menuOpen}
              >
                {(ctxAvatar ?? activeProfile?.avatar_url) ? (
                  <img
                    src={(ctxAvatar ?? activeProfile?.avatar_url) as string}
                    alt={account?.display_name ?? "Avatar"}
                    style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(229,9,20,0.6)", objectFit: "cover" }}
                  />
                ) : (
                  <span className="h-7 w-7 grid place-items-center rounded-full bg-surface-elevated">
                    <UserIcon className="h-[16px] w-[16px] text-foreground" strokeWidth={1.75} />
                  </span>
                )}
                <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", menuOpen && "rotate-180")} strokeWidth={2} />
              </button>

              {menuOpen && (
                <>
                  {/* Overlay leve para clique-fora em mobile, mas não cobre todo o conteúdo */}
                  <div
                    className="fixed inset-0 z-[9998] bg-background/30 backdrop-blur-[2px] lg:hidden"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden
                  />
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1rem)] z-[9999] bg-popover/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-elevated overflow-hidden animate-fade-in"
                  >
                    <div className="p-1.5">
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
                      >
                        <UserCircle2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                        Meu Perfil
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
                      >
                        <SettingsIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                        Configurações
                      </Link>
                      <button
                        onClick={async () => {
                          setMenuOpen(false);
                          await signOut();
                          navigate("/login");
                        }}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                        Sair
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : isExplorer ? (
            <Link
              to="/signup"
              className="flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-glow transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
              {t("auth.signup")}
            </Link>
          ) : (
            <Link
              to="/login"
              className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-glow transition-colors grid place-items-center"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile nav — abaixo do header, compacto */}
      <div className="lg:hidden bg-transparent">
        <ul
          className="flex items-center gap-4 overflow-x-auto scrollbar-hide h-10 px-4"
          style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", WebkitOverflowScrolling: "touch" }}
        >
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <li key={item.to} style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                <Link
                  to={item.to}
                  className={cn(
                    "text-xs transition-colors [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]",
                    active
                      ? "text-primary font-bold"
                      : "text-white/75 font-medium hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </header>
  );
};
