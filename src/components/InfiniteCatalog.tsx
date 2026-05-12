// Página genérica com scroll infinito a partir de um RowLoader do TMDB.

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MediaCard } from "@/components/MediaCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { sortMediaForAccount } from "@/lib/api";
import { canWatch } from "@/lib/maturity";
import { useAuth } from "@/hooks/useAuth";
import type { Media } from "@/types/media";
import type { RowLoader } from "@/lib/tmdb";

interface Props {
  title: string;
  subtitle?: string;
  loaders: { label?: string; loader: RowLoader }[];
  maxPages?: number;
  badgeRender?: (m: Media) => React.ReactNode;
  totalCount?: () => Promise<number>;
}

export function InfiniteCatalog({ title, subtitle, loaders, maxPages = 250, badgeRender, totalCount }: Props) {
  const { account, activeProfile } = useAuth();
  const [items, setItems] = useState<Media[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState<Media | null>(null);
  const [total, setTotal] = useState<number | null>(null);
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

  const visible = sortMediaForAccount(items.filter((m) => canWatch(m, activeProfile, account)), account);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-flix pt-28 md:pt-32 pb-20">
        <h1 className="font-display text-4xl md:text-6xl mb-2 tracking-wide">{title}</h1>
        {total != null && (
          <p className="text-xs text-muted-foreground/80 mb-2">
            {total.toLocaleString("pt-BR")} títulos disponíveis
          </p>
        )}
        {subtitle && <p className="text-muted-foreground mb-8">{subtitle}</p>}

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
      <VideoPlayer media={playing} open={!!playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
