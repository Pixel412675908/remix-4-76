// MediaCard — minimalista, com indicador de bloqueio (explorer + adulto) e coração de favorito

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Play, Plus, Check, Star, Lock, Heart } from "lucide-react";
import { Media } from "@/types/media";
import { useMyList } from "@/hooks/useMyList";
import { useAuth } from "@/hooks/useAuth";
import { useAdultGate } from "@/contexts/AdultGateContext";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  media: Media;
  onPlay?: (m: Media) => void;
}

export const MediaCard = ({ media, onPlay }: MediaCardProps) => {
  const [hover, setHover] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { has, toggle } = useMyList();
  const { isExplorer } = useAuth();
  const { unlocked, requireUnlock } = useAdultGate();
  const inList = has(media.id);
  const explorerLocked = isExplorer && !media.freeForExplorer;
  const adultLocked = !!media.adult && !unlocked;
  const locked = explorerLocked || adultLocked;
  const detailLink = media.type === "tv" ? `/series/${media.id}` : `/movie/${media.id}`;

  const handleClick = (e: React.MouseEvent) => {
    sessionStorage.setItem(`scroll_${location.pathname}${location.search}`, String(window.scrollY));
    if (adultLocked) {
      e.preventDefault();
      requireUnlock(() => navigate(detailLink));
    }
  };

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
        onClick={handleClick}
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
            className={cn("w-full h-full object-cover", adultLocked && "blur-md scale-110")}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent" />

          {/* Coração — Minha Lista */}
          {inList && (
            <div className="absolute top-1.5 right-1.5 z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              <Heart className="h-4 w-4 fill-white text-white" />
            </div>
          )}

          {/* Cadeado central — adulto */}
          {adultLocked && (
            <div className="absolute inset-0 grid place-items-center z-10">
              <div
                className="h-12 w-12 rounded-full grid place-items-center"
                style={{ backgroundColor: "rgba(229,9,20,0.9)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
              >
                <Lock className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

          {/* Cadeado canto — explorer */}
          {explorerLocked && !adultLocked && (
            <div className="absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-background/80 backdrop-blur grid place-items-center">
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
                  if (adultLocked) {
                    requireUnlock(() => onPlay?.(media));
                  } else {
                    onPlay?.(media);
                  }
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
