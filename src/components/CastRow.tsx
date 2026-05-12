// Carrossel horizontal de elenco completo (TMDB credits).

import { useEffect, useState } from "react";
import { fetchCredits, type CastMember } from "@/lib/tmdb";
import { User as UserIcon } from "lucide-react";

interface Props {
  type: "movie" | "tv";
  id: number;
}

export function CastRow({ type, id }: Props) {
  const [cast, setCast] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetchCredits(type, id)
      .then((c) => {
        if (!cancel) setCast(c);
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
      <div className="text-xs text-muted-foreground">Carregando elenco…</div>
    );
  }
  if (cast.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-2xl md:text-3xl tracking-wide mb-4">
        Elenco
      </h2>
      <div
        className="flex gap-3 overflow-x-auto pb-3"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "thin" }}
      >
        {cast.map((c) => (
          <div
            key={`${c.id}-${c.order}`}
            className="shrink-0 w-[120px] md:w-[140px] rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"
          >
            <div className="aspect-[2/3] bg-surface-elevated grid place-items-center overflow-hidden">
              {c.profileUrl ? (
                <img
                  src={c.profileUrl}
                  alt={c.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
            <div className="p-2.5">
              <p className="text-xs font-semibold leading-tight line-clamp-2">
                {c.name}
              </p>
              {c.character && (
                <p className="text-[11px] text-muted-foreground leading-tight mt-1 line-clamp-2">
                  {c.character}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
