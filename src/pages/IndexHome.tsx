// Home autenticado — TMDB real + scroll infinito por row + filtros +18.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Compass, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";

import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useAuth } from "@/hooks/useAuth";
import { sortMediaForAccount } from "@/lib/api";
import { fetchHeroPool, ALL_ROWS, RowDef } from "@/lib/tmdb";
import { canWatch } from "@/lib/maturity";
import { Media } from "@/types/media";
import { cn } from "@/lib/utils";

const HERO_INTERVAL = 9000;

interface LoadedRow {
  def: RowDef;
  items: Media[];
  page: number;
  loading: boolean;
  done: boolean;
}

const IndexHome = () => {
  const { account, activeProfile, isExplorer } = useAuth();
  const [rows, setRows] = useState<LoadedRow[]>([]);
  const [heroes, setHeroes] = useState<Media[]>([]);
  const [playing, setPlaying] = useState<Media | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [showExplorerBanner, setShowExplorerBanner] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Define rows visíveis baseado em preferências de maturidade
  const visibleRowDefs = useMemo<RowDef[]>(() => {
    return ALL_ROWS.filter((r) => {
      if (!r.audience || r.audience === "all") return true;
      if (r.audience === "mature") return !!account?.allow_adult;
      if (r.audience === "explicit") return !!(account as any)?.allow_explicit;
      return true;
    });
  }, [account]);

  // Carrega página 1 inicial
  useEffect(() => {
    fetchHeroPool().then(setHeroes).catch(() => setHeroes([]));
  }, []);

  useEffect(() => {
    let cancel = false;
    Promise.all(
      visibleRowDefs.map(async (def) => {
        try {
          const items = await def.loader(1);
          return { def, items, page: 1, loading: false, done: items.length === 0 };
        } catch {
          return { def, items: [], page: 1, loading: false, done: true };
        }
      })
    ).then((res) => {
      if (!cancel) setRows(res);
    });
    return () => {
      cancel = true;
    };
  }, [visibleRowDefs]);

  // Filtra por maturidade
  const filteredRows = useMemo(() => {
    return rows
      .map((r) => ({
        ...r,
        items: sortMediaForAccount(
          r.items.filter((m) => canWatch(m, activeProfile, account)),
          account
        ),
      }))
      .filter((r) => r.items.length > 0);
  }, [rows, account, activeProfile]);

  // Heroes filtrados
  const heroCandidates = useMemo<Media[]>(() => {
    const allowed = heroes.filter((m) => canWatch(m, activeProfile, account));
    const ordered = sortMediaForAccount(allowed, account);
    return ordered.length ? ordered : allowed;
  }, [heroes, account, activeProfile]);

  useEffect(() => {
    setHeroIdx(0);
  }, [heroCandidates.length]);

  useEffect(() => {
    if (heroCandidates.length <= 1) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setHeroIdx((i) => (i + 1) % heroCandidates.length);
    }, HERO_INTERVAL);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [heroCandidates]);

  const heroMedia = heroCandidates[heroIdx];

  // Scroll infinito: carrega +1 página em todas as rows incompletas quando sentinel visível
  const loadMore = useCallback(async () => {
    setRows((prev) => {
      const next = prev.map((r) => (r.done || r.loading ? r : { ...r, loading: true }));
      // dispara em paralelo
      next.forEach((r, idx) => {
        if (r.done || prev[idx].loading) return;
        const nextPage = r.page + 1;
        if (nextPage > 5) {
          // limite razoável p/ não estourar quota TMDB
          setRows((curr) => curr.map((cr, i) => (i === idx ? { ...cr, loading: false, done: true } : cr)));
          return;
        }
        r.def
          .loader(nextPage)
          .then((items) => {
            setRows((curr) =>
              curr.map((cr, i) =>
                i === idx
                  ? {
                      ...cr,
                      items: [...cr.items, ...items],
                      page: nextPage,
                      loading: false,
                      done: items.length === 0,
                    }
                  : cr
              )
            );
          })
          .catch(() => {
            setRows((curr) =>
              curr.map((cr, i) => (i === idx ? { ...cr, loading: false, done: true } : cr))
            );
          });
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {heroMedia && <HeroBanner media={heroMedia} onPlay={() => setPlaying(heroMedia)} />}

        {heroCandidates.length > 1 && (
          <div className="container-flix -mt-8 relative z-20 flex items-center gap-1.5">
            {heroCandidates.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                aria-label={`Destaque ${i + 1}`}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === heroIdx ? "w-6 bg-primary" : "w-3 bg-foreground/30 hover:bg-foreground/60"
                )}
              />
            ))}
          </div>
        )}

        {isExplorer && showExplorerBanner && (
          <div className="container-flix mt-6">
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-md border border-primary/30 bg-primary/5">
              <Compass className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Você está no Modo Explorador</p>
                <p className="text-xs text-muted-foreground">
                  Catálogo limitado e player bloqueado. Crie uma conta para liberar tudo.
                </p>
              </div>
              <Link
                to="/signup"
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary-glow transition-colors"
              >
                Criar conta
              </Link>
              <button
                onClick={() => setShowExplorerBanner(false)}
                aria-label="Dispensar"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-1 pb-10">
          {filteredRows.map((row) => (
            <ContentRow
              key={row.def.id}
              title={row.def.title}
              items={row.items}
              onPlay={(m) => setPlaying(m)}
            />
          ))}
          <div ref={sentinelRef} className="h-12" aria-hidden />
        </div>
      </main>

      <VideoPlayer media={playing} open={!!playing} onClose={() => setPlaying(null)} />
    </div>
  );
};

export default IndexHome;
