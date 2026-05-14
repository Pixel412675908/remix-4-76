// Página genérica com scroll infinito a partir de um RowLoader do TMDB.
// Inclui painel lateral de filtro por gênero (e, opcional, por idioma original).

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MediaCard } from "@/components/MediaCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { sortMediaForAccount } from "@/lib/api";
import { canWatch } from "@/lib/maturity";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Media } from "@/types/media";
import type { RowLoader } from "@/lib/tmdb";

export interface GenreFilterOption {
  /** Rótulo exibido (pt-BR) */
  label: string;
  /** Casa se algum genre do TMDB contiver qualquer destes (case-insensitive). */
  matchGenres?: string[];
  /** Opcional: casa se originalLanguage estiver nesta lista. */
  matchLangs?: string[];
  /** Opcional: nega outras langs (ex.: "Internacional" = qualquer ≠ tr/pt-br). */
  excludeLangs?: string[];
}

interface Props {
  title: string;
  subtitle?: string;
  loaders: { label?: string; loader: RowLoader }[];
  maxPages?: number;
  badgeRender?: (m: Media) => React.ReactNode;
  totalCount?: () => Promise<number>;
  genreOptions?: GenreFilterOption[];
}

function matchesOption(m: Media, opt: GenreFilterOption): boolean {
  const lang = (m.originalLanguage || "").toLowerCase();
  // Quando há restrição de idioma, ela é OBRIGATÓRIA (não atalho).
  if (opt.matchLangs && opt.matchLangs.length > 0) {
    if (!opt.matchLangs.includes(lang)) return false;
    if (!opt.matchGenres || opt.matchGenres.length === 0) return true;
  }
  if (opt.excludeLangs && opt.excludeLangs.length > 0) {
    if (opt.excludeLangs.includes(lang)) return false;
    if (!opt.matchGenres || opt.matchGenres.length === 0) return true;
  }
  if (opt.matchGenres && opt.matchGenres.length > 0) {
    const norm = (m.genres ?? []).map((g) => g.toLowerCase().trim());
    for (const needle of opt.matchGenres) {
      const n = needle.toLowerCase().trim();
      if (norm.some((g) => g === n || g.includes(n) || n.includes(g))) return true;
    }
    return false;
  }
  return true;
}

export function InfiniteCatalog({
  title,
  subtitle,
  loaders,
  maxPages = 250,
  badgeRender,
  totalCount,
  genreOptions,
}: Props) {
  const { account, activeProfile } = useAuth();
  const [items, setItems] = useState<Media[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState<Media | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeGenres, setActiveGenres] = useState<Set<string>>(new Set());
  const [pendingGenres, setPendingGenres] = useState<Set<string>>(new Set());
  const sentinel = useRef<HTMLDivElement | null>(null);
  const seen = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!totalCount) return;
    let cancel = false;
    totalCount().then((n) => { if (!cancel) setTotal(n); }).catch(() => {});
    return () => { cancel = true; };
  }, [totalCount]);

  const loadPage = useCallback(
    async (p: number) => {
      if (loading || done || p > maxPages) return;
      setLoading(true);
      try {
        const results = await Promise.all(loaders.map((l) => l.loader(p).catch(() => [] as Media[])));
        const flat = results.flat();
        const fresh = flat.filter((m) => {
          if (seen.current.has(m.id)) return false;
          seen.current.add(m.id);
          return true;
        });
        if (fresh.length === 0) setDone(true);
        setItems((prev) => [...prev, ...fresh]);
      } finally {
        setLoading(false);
      }
    },
    [loaders, loading, done, maxPages]
  );

  useEffect(() => {
    seen.current.clear();
    setItems([]);
    setPage(1);
    setDone(false);
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaders.map((l) => l.label).join("|")]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !done) {
          setPage((p) => {
            const next = p + 1;
            loadPage(next);
            return next;
          });
        }
      },
      { rootMargin: "800px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadPage, loading, done]);

  const allowed = useMemo(
    () => items.filter((m) => canWatch(m, activeProfile, account)),
    [items, activeProfile, account]
  );

  const genreFiltered = useMemo(() => {
    if (!genreOptions || activeGenres.size === 0) return allowed;
    const opts = genreOptions.filter((o) => activeGenres.has(o.label));
    return allowed.filter((m) => opts.some((o) => matchesOption(m, o)));
  }, [allowed, genreOptions, activeGenres]);

  // Ordena por qualidade: rating DESC, ano DESC como desempate.
  // Os melhores títulos da categoria sempre aparecem primeiro.
  const visible = useMemo(() => {
    const accountSorted = sortMediaForAccount(genreFiltered, account);
    return [...accountSorted].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return (b.year ?? 0) - (a.year ?? 0);
    });
  }, [genreFiltered, account]);

  // Auto-load mais páginas quando há filtro ativo e poucos resultados visíveis.
  useEffect(() => {
    if (activeGenres.size === 0) return;
    if (loading || done) return;
    if (visible.length >= 24) return;
    if (page >= maxPages) return;
    const next = page + 1;
    setPage(next);
    loadPage(next);
  }, [activeGenres, visible.length, loading, done, page, maxPages, loadPage]);

  const openFilters = () => {
    setPendingGenres(new Set(activeGenres));
    setFilterOpen(true);
  };
  const apply = () => {
    setActiveGenres(new Set(pendingGenres));
    setFilterOpen(false);
  };
  const clear = () => {
    // Limpa tanto o painel quanto o filtro aplicado imediatamente.
    setPendingGenres(new Set());
    setActiveGenres(new Set());
  };
  const togglePending = (label: string) =>
    setPendingGenres((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-flix pt-28 md:pt-32 pb-20">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-4xl md:text-6xl mb-2 tracking-wide">{title}</h1>
            {(total != null || activeGenres.size > 0) && (
              <p className="text-xs text-muted-foreground/80 mb-2">
                {activeGenres.size > 0
                  ? `${visible.length.toLocaleString("pt-BR")} ${visible.length === 1 ? "título corresponde" : "títulos correspondem"} ao filtro`
                  : `${(total ?? 0).toLocaleString("pt-BR")} títulos disponíveis`}
              </p>
            )}
            {subtitle && <p className="text-muted-foreground mb-8">{subtitle}</p>}
          </div>
          {genreOptions && genreOptions.length > 0 && (
            <button
              onClick={openFilters}
              aria-label="Filtrar por gênero"
              className={cn(
                "shrink-0 mt-2 h-10 w-10 grid place-items-center rounded-full transition-colors",
                activeGenres.size > 0
                  ? "text-primary"
                  : "text-foreground/90 hover:text-foreground"
              )}
            >
              <SlidersHorizontal size={20} strokeWidth={1.75} />
              {activeGenres.size > 0 && (
                <span className="absolute mt-7 ml-7 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {visible.map((m) => (
            <div key={m.id} className="relative">
              {badgeRender?.(m)}
              <MediaCard media={m} onPlay={(x) => setPlaying(x)} />
            </div>
          ))}
        </div>

        <div ref={sentinel} className="h-16 grid place-items-center mt-6">
          {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          {done && items.length > 0 && (
            <p className="text-xs text-muted-foreground">Você chegou ao fim do catálogo.</p>
          )}
        </div>
      </main>

      {filterOpen && genreOptions && (
        <div
          className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
          onClick={() => setFilterOpen(false)}
        >
          <aside
            className="h-full w-[86vw] max-w-[360px] bg-popover/95 backdrop-blur-xl border-l border-white/10 rounded-l-2xl shadow-elevated flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(15,15,15,0.92)" }}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="font-semibold text-base">Filtrar por gênero</h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/5 text-muted-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-wrap gap-2">
                {genreOptions.map((opt) => {
                  const on = pendingGenres.has(opt.label);
                  return (
                    <button
                      key={opt.label}
                      onClick={() => togglePending(opt.label)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs border transition-colors",
                        on
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white/[0.04] border-white/10 text-foreground/80 hover:bg-white/[0.08]"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <footer className="border-t border-white/5 px-5 py-4 flex items-center gap-3">
              <button
                onClick={clear}
                className="flex-1 h-10 rounded-full text-sm font-medium border border-white/10 hover:bg-white/5"
              >
                Limpar
              </button>
              <button
                onClick={apply}
                className="flex-1 h-10 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-glow"
              >
                Aplicar
              </button>
            </footer>
          </aside>
        </div>
      )}

      <VideoPlayer media={playing} open={!!playing} onClose={() => setPlaying(null)} />
    </div>
  );
}

// =================== Presets de filtro por categoria ===================

export const MOVIE_GENRE_OPTIONS: GenreFilterOption[] = [
  { label: "Ação", matchGenres: ["ação", "action"] },
  { label: "Aventura", matchGenres: ["aventura", "adventure"] },
  { label: "Comédia", matchGenres: ["comédia", "comedy"] },
  { label: "Drama", matchGenres: ["drama"] },
  { label: "Romance", matchGenres: ["romance"] },
  { label: "Terror", matchGenres: ["terror", "horror"] },
  { label: "Suspense", matchGenres: ["suspense", "thriller"] },
  { label: "Ficção Científica", matchGenres: ["ficção científica", "science fiction", "sci-fi"] },
  { label: "Animação", matchGenres: ["animação", "animation"] },
  { label: "Documentário", matchGenres: ["documentário", "documentary"] },
  { label: "Fantasia", matchGenres: ["fantasia", "fantasy"] },
  { label: "Crime", matchGenres: ["crime"] },
  { label: "Biografia", matchGenres: ["biografia", "biography", "história"] },
  { label: "Musical", matchGenres: ["música", "musical"] },
  { label: "Guerra", matchGenres: ["guerra", "war"] },
  { label: "Faroeste", matchGenres: ["faroeste", "western"] },
  { label: "Família", matchGenres: ["família", "family"] },
];

export const SERIES_GENRE_OPTIONS: GenreFilterOption[] = [
  { label: "Ação", matchGenres: ["ação", "action"] },
  { label: "Aventura", matchGenres: ["aventura", "adventure"] },
  { label: "Comédia", matchGenres: ["comédia", "comedy"] },
  { label: "Drama", matchGenres: ["drama"] },
  { label: "Romance", matchGenres: ["romance"] },
  { label: "Terror", matchGenres: ["terror", "horror"] },
  { label: "Suspense", matchGenres: ["suspense", "thriller"] },
  { label: "Ficção Científica", matchGenres: ["sci-fi", "ficção científica", "science fiction"] },
  { label: "Fantasia", matchGenres: ["fantasia", "fantasy"] },
  { label: "Crime", matchGenres: ["crime"] },
  { label: "Mistério", matchGenres: ["mistério", "mystery"] },
  { label: "Policial", matchGenres: ["policial", "crime"] },
  { label: "Sobrenatural", matchGenres: ["sci-fi", "fantasia", "fantasy", "sobrenatural"] },
  { label: "Reality Show", matchGenres: ["reality"] },
  { label: "Minissérie", matchGenres: ["minissérie", "miniseries"] },
  { label: "Família", matchGenres: ["família", "family"] },
  { label: "Biografia", matchGenres: ["biografia", "biography", "história"] },
];

export const NOVELA_GENRE_OPTIONS: GenreFilterOption[] = [
  { label: "Romance", matchGenres: ["romance"] },
  { label: "Drama", matchGenres: ["drama", "soap"] },
  { label: "Suspense", matchGenres: ["suspense", "thriller"] },
  { label: "Comédia", matchGenres: ["comédia", "comedy"] },
  { label: "Familiar", matchGenres: ["família", "family"] },
  { label: "Policial", matchGenres: ["crime", "policial"] },
  { label: "Histórica", matchGenres: ["história", "history"] },
  { label: "Religiosa", matchGenres: ["religion", "religiosa", "história"] },
  { label: "Internacional", excludeLangs: ["pt", "tr"] },
  { label: "Turca", matchLangs: ["tr"] },
  { label: "Mexicana", matchLangs: ["es"] },
  { label: "Colombiana", matchLangs: ["es"] },
  { label: "Brasileira", matchLangs: ["pt"] },
];

export const ANIME_GENRE_OPTIONS: GenreFilterOption[] = [
  { label: "Ação", matchGenres: ["ação", "action"] },
  { label: "Aventura", matchGenres: ["aventura", "adventure"] },
  { label: "Comédia", matchGenres: ["comédia", "comedy"] },
  { label: "Romance", matchGenres: ["romance"] },
  { label: "Ecchi", matchGenres: ["ecchi"] },
  { label: "Drama", matchGenres: ["drama"] },
  { label: "Fantasia", matchGenres: ["fantasia", "fantasy"] },
  { label: "Ficção Científica", matchGenres: ["sci-fi", "ficção científica", "science fiction"] },
  { label: "Sobrenatural", matchGenres: ["fantasia", "sci-fi", "sobrenatural"] },
  { label: "Terror", matchGenres: ["terror", "horror"] },
  { label: "Mistério", matchGenres: ["mistério", "mystery"] },
  { label: "Slice of Life", matchGenres: ["slice", "drama", "família"] },
  { label: "Esporte", matchGenres: ["esporte", "sport"] },
  { label: "Culinária", matchGenres: ["comédia", "drama"] },
  { label: "Mecha", matchGenres: ["sci-fi", "ação"] },
  { label: "Isekai", matchGenres: ["fantasia", "fantasy", "sci-fi"] },
  { label: "Shonen", matchGenres: ["ação", "aventura", "comédia"] },
  { label: "Shojo", matchGenres: ["romance", "drama"] },
  { label: "Seinen", matchGenres: ["drama", "ação", "suspense"] },
  { label: "Josei", matchGenres: ["romance", "drama"] },
];

export const ANIMATION_GENRE_OPTIONS: GenreFilterOption[] = [
  { label: "Ação", matchGenres: ["ação", "action"] },
  { label: "Aventura", matchGenres: ["aventura", "adventure"] },
  { label: "Comédia", matchGenres: ["comédia", "comedy"] },
  { label: "Família", matchGenres: ["família", "family"] },
  { label: "Infantil", matchGenres: ["kids", "infantil", "família"] },
  { label: "Super-Heróis", matchGenres: ["ação", "sci-fi", "fantasia"] },
  { label: "Animação Adulta", matchGenres: ["comédia", "drama", "ação"] },
  { label: "Fantasia", matchGenres: ["fantasia", "fantasy"] },
  { label: "Ficção Científica", matchGenres: ["sci-fi", "ficção científica"] },
  { label: "Educativo", matchGenres: ["documentário", "documentary", "infantil"] },
  { label: "Clássico", matchGenres: ["família", "comédia"] },
];
