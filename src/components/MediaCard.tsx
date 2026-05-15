// MediaCard — minimalista, menor, com indicador de bloqueio para explorer

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Play, Plus, Check, Star, Lock } from "lucide-react";
import { Media } from "@/types/media";
import { useMyList } from "@/hooks/useMyList";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  media: Media;
  onPlay?: (m: Media) => void;
}

export const MediaCard = ({ media, onPlay }: MediaCardProps) => {
  const [hover, setHover] = useState(false);
  const location = useLocation();
  const { has, toggle } = useMyList();
  const { isExplorer } = useAuth();
  const inList = has(media.id);
  const locked = isExplorer && !media.freeForExplorer;
  const detailLink = media.type === "tv" ? `/series/${media.id}` : `/movie/${media.id}`;

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "group relative shrink-0",
        "w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px]",
        "aspect-[2/3]"
      )}
    >
      <Link
        to={detailLink}
        className="block w-full h-full"
        onClick={() => sessionStorage.setItem(`scroll_${location.pathname}${location.search}`, String(window.scrollY))}
      >
        <div
          className={cn(
            "relative w-full h-full rounded-xl overflow-hidden",
            "ring-1 ring-white/5",
            "transition-all duration-300 ease-out will-change-transform",
            "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]",
            hover && "scale-[1.04] z-30 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)] ring-white/20"
          )}
        >
          <img
            src={media.posterUrl}
            alt={media.title}
            loading="lazy"
            width={500}
            height={750}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent" />

          {locked && (
            <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/80 backdrop-blur grid place-items-center">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          )}

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 p-2 transition-opacity duration-200",
              hover ? "opacity-0" : "opacity-100"
            )}
          >
            <h3 className="font-medium text-xs md:text-sm line-clamp-1 text-shadow-hero">
              {media.title}
            </h3>
          </div>

          <div
            className={cn(
              "absolute inset-0 bg-gradient-overlay flex flex-col justify-end p-2.5",
              "transition-opacity duration-200",
              hover ? "opacity-100" : "opacity-0"
            )}
          >
            <h3 className="font-display text-base leading-tight mb-1.5">{media.title}</h3>

            <div className="flex items-center gap-1.5 text-[10px] text-foreground/80 mb-2">
              <span className="flex items-center gap-0.5 text-primary-glow font-semibold">
                <Star className="h-2.5 w-2.5 fill-current" />
                {media.rating.toFixed(1)}
              </span>
              <span>•</span>
              <span>{media.year}</span>
              {media.ageRating && (
                <>
                  <span>•</span>
                  <span className="px-1 border border-border">{media.ageRating}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onPlay?.(media);
                }}
                aria-label="Reproduzir"
                className="h-7 w-7 grid place-items-center rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {locked ? <Lock className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggle(media.id);
                }}
                aria-label={inList ? "Remover da lista" : "Adicionar à lista"}
                className={cn(
                  "h-7 w-7 grid place-items-center rounded-full border transition-colors",
                  inList
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-foreground/50 hover:border-foreground"
                )}
              >
                {inList ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};
