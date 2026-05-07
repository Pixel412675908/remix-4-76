// Em Breve — agrupado por ano (asc), com filtros laterais e modal de indisponível.

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MediaCard } from "@/components/MediaCard";
import { canWatch } from "@/lib/maturity";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  fetchUpcomingMovies,
  fetchUpcomingTv,
  fetchUpcomingAnime,
  fetchUpcomingAnimation,
  type RowLoader,
} from "@/lib/tmdb";
import type { Media } from "@/types/media";

type CatKey = "movie" | "series" | "anime" | "animation";

const CATEGORIES: { key: CatKey; label: string; loader: RowLoader }[] = [
  { key: "movie", label: "Filmes", loader: fetchUpcomingMovies },
  { key: "series", label: "Séries", loader: fetchUpcomingTv },
  { key: "anime", label: "Animes", loader: fetchUpcomingAnime },
  { key: "animation", label: "Desenhos", loader: fetchUpcomingAnimation },
];

const YEAR_OPTIONS = [2026, 2027, 2028, 2029, 2030] as const;
const MAX_PAGES = 6;

function formatBrDate(iso?: string): string {
  if (!iso) return "data a confirmar";
  const [y, m, d] = iso.split("-");
  if (!y) return "data a confirmar";
  return `${d ?? "??"}/${m ?? "??"}/${y}`;
}

export default function EmBreve() {
  const { account, activeProfile } = useAuth();
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeCats, setActiveCats] = useState<Set<CatKey>>(new Set(CATEGORIES.map((c) => c.key)));
  const [activeYears, setActiveYears] = useState<Set<number>>(new Set()); // vazio = todos
  const [pendingCats, setPendingCats] = useState<Set<CatKey>>(activeCats);
  const [pendingYears, setPendingYears] = useState<Set<number>>(activeYears);
  const [unavailable, setUnavailable] = useState<Media | null>(null);
  const seen = useRef<Set<number>>(new Set());

  // Carrega todas categorias x páginas em paralelo
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    seen.current.clear();
    (async () => {
      const tasks: Promise<Media[]>[] = [];
      for (const c of CATEGORIES) {
        for (let p = 1; p <= MAX_PAGES; p++) {
          tasks.push(c.loader(p).catch(() => [] as Media[]));
        }
      }
      const results = (await Promise.all(tasks)).flat();
      if (cancelled) return;
      const dedup: Media[] = [];
      for (const m of results) {
        if (seen.current.has(m.id)) continue;
        seen.current.add(m.id);
        dedup.push(m);
      }
      setItems(dedup);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Aplica filtros + ordena por (ano asc, data asc)
  const grouped = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const filtered = items
      .filter((m) => canWatch(m, activeProfile, account))
      .filter((m) => {
        // categoria
        const isAnime = m.type === "tv" && m.originalLanguage === "ja";
        const isAnimation = m.type === "tv" && m.originalLanguage !== "ja" &&
          (m.genres ?? []).some((g) => /anim/i.test(g));
        let cat: CatKey;
        if (m.type === "movie") cat = "movie";
        else if (isAnime) cat = "anime";
        else if (isAnimation) cat = "animation";
        else cat = "series";
        if (!activeCats.has(cat)) return false;
        if (activeYears.size > 0 && !activeYears.has(m.year)) return false;
        // só futuros
        if (m.releaseDate && m.releaseDate < today) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "");
      });

    const map = new Map<number, Media[]>();
    for (const m of filtered) {
      const arr = map.get(m.year) ?? [];
      arr.push(m);
      map.set(m.year, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [items, activeCats, activeYears, account, activeProfile]);

  const openFilters = () => {
    setPendingCats(new Set(activeCats));
    setPendingYears(new Set(activeYears));
    setFilterOpen(true);
  };

  const apply = () => {
    setActiveCats(new Set(pendingCats));
    setActiveYears(new Set(pendingYears));
    setFilterOpen(false);
  };

  const clear = () => {
    setPendingCats(new Set(CATEGORIES.map((c) => c.key)));
    setPendingYears(new Set());
  };

  const togglePendingCat = (k: CatKey) =>
    setPendingCats((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  const togglePendingYear = (y: number) =>
    setPendingYears((prev) => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-flix pt-28 md:pt-32 pb-20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl md:text-6xl mb-2 tracking-wide">Em Breve</h1>
            <p className="text-muted-foreground mb-8">
              Filmes, séries, animes e desenhos que ainda vão chegar.
            </p>
          </div>
          <button
            onClick={openFilters}
            aria-label="Filtros"
            className="shrink-0 mt-2 h-10 w-10 grid place-items-center text-foreground/90 hover:text-foreground transition-colors"
          >
            <SlidersHorizontal size={20} strokeWidth={1.75} />
          </button>
        </div>

        {loading && (
          <div className="grid place-items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && grouped.length === 0 && (
          <p className="text-center text-muted-foreground py-20">
            Nenhum lançamento encontrado para os filtros selecionados.
          </p>
        )}

        {!loading &&
          grouped.map(([year, list]) => (
            <section key={year} className="mb-12">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-px flex-1 bg-border/60" />
                <h2 className="font-display text-3xl md:text-4xl tracking-wider text-foreground/95 px-2">
                  {year}
                </h2>
                <div className="h-px flex-1 bg-border/60" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {list.map((m) => (
                  <div key={m.id} className="relative">
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-md">
                      {m.releaseDate ? formatBrDate(m.releaseDate) : `Em ${m.year}`}
                    </div>
                    <MediaCard media={m} onPlay={() => setUnavailable(m)} />
                  </div>
                ))}
              </div>
            </section>
          ))}
      </main>

      {/* Painel lateral de filtros */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
          onClick={() => setFilterOpen(false)}
        >
          <aside
            className="h-full w-[86vw] max-w-[340px] bg-popover/95 backdrop-blur-xl border-l border-white/10 rounded-l-2xl shadow-elevated flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(15,15,15,0.92)" }}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="font-semibold text-base">Filtros</h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/5 text-muted-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Tipo</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const on = pendingCats.has(c.key);
                    return (
                      <button
                        key={c.key}
                        onClick={() => togglePendingCat(c.key)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-full text-xs border transition-colors",
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-white/[0.04] border-white/10 text-foreground/80 hover:bg-white/[0.08]"
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Ano</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPendingYears(new Set())}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs border transition-colors",
                      pendingYears.size === 0
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white/[0.04] border-white/10 text-foreground/80 hover:bg-white/[0.08]"
                    )}
                  >
                    Todos
                  </button>
                  {YEAR_OPTIONS.map((y) => {
                    const on = pendingYears.has(y);
                    return (
                      <button
                        key={y}
                        onClick={() => togglePendingYear(y)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-full text-xs border transition-colors",
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-white/[0.04] border-white/10 text-foreground/80 hover:bg-white/[0.08]"
                        )}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
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

      {/* Modal: conteúdo ainda não disponível */}
      {unavailable && (
        <div
          className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm grid place-items-center px-4 animate-fade-in"
          onClick={() => setUnavailable(null)}
        >
          <div
            className="w-full max-w-sm bg-popover border border-white/10 shadow-elevated p-6 text-center animate-scale-in"
            style={{ borderRadius: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-12 w-12 grid place-items-center rounded-full bg-primary/15 border border-primary/30 mb-4">
              <Calendar className="h-5 w-5 text-primary" strokeWidth={1.75} />
            </div>
            <h4 className="font-display text-2xl tracking-wide mb-2">{unavailable.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Este conteúdo ainda não está disponível. Está previsto para lançamento em{" "}
              <span className="text-foreground font-semibold">{formatBrDate(unavailable.releaseDate)}</span>.
              Fique atento às novidades do StreamFlix.
            </p>
            <button
              onClick={() => setUnavailable(null)}
              className="px-8 h-10 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-glow transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
