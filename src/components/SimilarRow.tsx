// Carrossel horizontal de títulos semelhantes — cross-tipo (filme + série).

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSimilarMixed } from "@/lib/tmdb";
import type { Media } from "@/types/media";
import { Star } from "lucide-react";

interface Props {
  type: "movie" | "tv";
  id: number;
}

export function SimilarRow({ type, id }: Props) {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetchSimilarMixed(type, id, 30)
      .then((list) => {
        if (!cancel) setItems(list);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [type, id]);

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground">Carregando semelhantes…</div>
    );
  }
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-2xl md:text-3xl tracking-wide mb-4">
        Semelhantes
      </h2>
      <div
        className="flex gap-3 overflow-x-auto pb-3"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "thin" }}
      >
        {items.map((m) => {
          const path = m.type === "movie" ? `/movie/${m.id}` : `/series/${m.id}`;
          return (
            <Link
              key={`${m.type}-${m.id}`}
              to={path}
              className="shrink-0 w-[140px] md:w-[160px] group"
            >
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-elevated relative">
                {m.posterUrl ? (
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-muted-foreground p-2 text-center">
                    {m.title}
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-black/60 backdrop-blur text-white">
                  {m.type === "movie" ? "Filme" : "Série"}
                </div>
              </div>
              <div className="mt-2 px-0.5">
                <p className="text-xs font-semibold leading-tight line-clamp-2">
                  {m.title}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                  <Star className="h-3 w-3 fill-current text-primary-glow" />
                  {m.rating.toFixed(1)} · {m.year}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
