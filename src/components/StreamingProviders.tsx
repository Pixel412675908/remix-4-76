// Mini-cards mostrando em quais plataformas o conteúdo está disponível.
// Lista vazia = nada renderizado (não polui a UI).

import { useEffect, useState } from "react";
import { fetchWatchProviders, type ProviderInfo } from "@/lib/tmdb";

interface Props {
  type: "movie" | "tv";
  id: number;
  className?: string;
}

export function StreamingProviders({ type, id, className }: Props) {
  const [providers, setProviders] = useState<ProviderInfo[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchWatchProviders(type, id).then((p) => {
      if (alive) setProviders(p);
    });
    return () => {
      alive = false;
    };
  }, [type, id]);

  if (!providers || providers.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-2">
        Disponível em
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {providers.slice(0, 8).map((p) => (
          <div
            key={p.id}
            title={p.name}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/[0.06] backdrop-blur border border-white/10 hover:border-white/20 transition-colors"
          >
            <img
              src={p.logoUrl}
              alt={p.name}
              loading="lazy"
              className="h-7 w-7 rounded-full object-cover"
            />
            <span className="text-xs font-medium text-foreground/90">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
