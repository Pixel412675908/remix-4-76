// HeroBanner — botões premium estilo streaming (sem botão Detalhes)
// Assistir (gradiente sutil), + Minha Lista (circular)
// Clique no banner inteiro abre detalhes via overlay; CTAs principais são Assistir e + Lista.

import { Play, Plus, Check, Star, Lock, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Media } from "@/types/media";
import { useMyList } from "@/hooks/useMyList";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  media: Media;
  onPlay: () => void;
}

export const HeroBanner = ({ media, onPlay }: HeroBannerProps) => {
  const { has, toggle } = useMyList();
  const { isExplorer } = useAuth();
  const inList = has(media.id);
  const locked = isExplorer && !media.freeForExplorer;

  return (
    <section
      className="relative w-full h-[78vh] min-h-[460px] max-h-[760px] overflow-hidden"
      style={{ maxWidth: "100vw" }}
      aria-label={`Em destaque: ${media.title}`}
      key={media.id}
    >
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center animate-ken-burns"
        style={{
          backgroundImage: `url(${media.backdropUrl})`,
          width: "100%",
          height: "100%",
        }}
        role="img"
        aria-label=""
      />

      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-hero-side pointer-events-none" />

      <div className="relative h-full container-flix flex items-end md:items-center pb-16 md:pb-0">
        <div className="max-w-xl space-y-3 md:space-y-4 animate-fade-in-up">
          {media.tags && (
            <div className="flex items-center gap-1.5">
              {media.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm bg-primary/15 text-primary border border-primary/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-none text-shadow-hero">
            {media.title}
          </h1>

          <div className="flex items-center gap-3 text-xs md:text-sm text-foreground/80">
            <span className="flex items-center gap-1 text-primary-glow font-semibold">
              <Star className="h-3.5 w-3.5 fill-current" />
              {media.rating.toFixed(1)}
            </span>
            <span>•</span>
            <span>{media.year}</span>
            {media.ageRating && (
              <>
                <span>•</span>
                <span className="px-1 border border-border text-[10px]">{media.ageRating}</span>
              </>
            )}
            {media.duration && (
              <>
                <span>•</span>
                <span>{media.duration}</span>
              </>
            )}
          </div>

          <p className="text-sm md:text-base text-foreground/85 max-w-lg line-clamp-3 text-shadow-hero">
            {media.overview}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {/* Assistir — principal com gradiente sutil */}
            <button
              onClick={onPlay}
              className={cn(
                "group inline-flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full text-sm font-semibold",
                "bg-gradient-to-b from-white to-white/85 text-background",
                "shadow-[0_8px_22px_-8px_hsl(0_0%_0%/0.55),inset_0_1px_0_hsl(0_0%_100%/0.6)]",
                "hover:shadow-[0_12px_28px_-8px_hsl(0_0%_0%/0.7),inset_0_1px_0_hsl(0_0%_100%/0.6)]",
                "transition-all duration-300 hover:scale-[1.02] active:scale-[0.97]"
              )}
            >
              {locked ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current transition-transform group-hover:translate-x-0.5" />}
              Assistir
            </button>

            {/* Detalhes — glass premium */}
            <Link
              to={media.type === "tv" ? `/series/${media.id}` : `/movie/${media.id}`}
              className={cn(
                "group inline-flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full text-sm font-medium",
                "bg-white/[0.07] backdrop-blur-xl border border-white/15 text-foreground",
                "shadow-[0_6px_18px_-8px_hsl(0_0%_0%/0.55),inset_0_1px_0_hsl(0_0%_100%/0.08)]",
                "hover:bg-white/[0.12] hover:border-white/25",
                "transition-all duration-300 hover:scale-[1.02] active:scale-[0.97]"
              )}
            >
              <Info className="h-4 w-4 transition-transform group-hover:rotate-6" strokeWidth={1.85} />
              Detalhes
            </Link>

            {/* + Minha Lista — circular minimalista */}
            <button
              onClick={() => toggle(media.id)}
              aria-label={inList ? "Remover da Minha Lista" : "Adicionar à Minha Lista"}
              className={cn(
                "group h-10 w-10 grid place-items-center rounded-full border backdrop-blur-xl transition-all duration-300 active:scale-90",
                inList
                  ? "bg-primary/90 border-primary/60 text-primary-foreground shadow-[0_8px_18px_-6px_hsl(var(--primary)/0.5)]"
                  : "bg-white/[0.06] border-white/15 text-foreground hover:bg-white/[0.12] hover:border-white/25"
              )}
            >
              <span className="transition-transform duration-300 group-active:scale-75">
                {inList ? <Check className="h-4 w-4" strokeWidth={2.25} /> : <Plus className="h-4 w-4" strokeWidth={2.25} />}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
