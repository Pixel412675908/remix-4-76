import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Play, Plus, Check, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BackButton } from "@/components/BackButton";

import { VideoPlayer } from "@/components/VideoPlayer";
import { StreamingProviders } from "@/components/StreamingProviders";
import { fetchMedia } from "@/lib/api";
import { Media } from "@/types/media";
import { useMyList } from "@/hooks/useMyList";
import { useTrackMediaActivity } from "@/hooks/useWatchHistory";
import { cn } from "@/lib/utils";
import { LANG_LABEL } from "@/lib/languages";

const MovieDetail = () => {
  const { id } = useParams();
  const [media, setMedia] = useState<Media | null>(null);
  const [playing, setPlaying] = useState(false);
  const { has, toggle } = useMyList();
  useTrackMediaActivity({ mediaId: Number(id) || 0, mediaType: "movie" });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) fetchMedia(Number(id)).then(setMedia);
  }, [id]);

  if (!media) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const inList = has(media.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <BackButton />
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden w-full" style={{ maxWidth: "100vw" }}>
        <div
          className="absolute inset-0 bg-no-repeat bg-cover bg-center animate-ken-burns"
          style={{ backgroundImage: `url(${media.backdropUrl})`, backgroundPosition: "center top" }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-hero-side" />

        <div className="relative h-full container-flix flex items-end pb-16">
          <div className="max-w-2xl space-y-5 animate-fade-in-up">
            <h1 className="font-display text-5xl md:text-7xl text-shadow-hero">{media.title}</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-primary-glow font-semibold">
                <Star className="h-4 w-4 fill-current" /> {media.rating.toFixed(1)}
              </span>
              <span>{media.year}</span>
              <span>{media.duration}</span>
              {media.ageRating && <span className="px-1.5 py-0.5 border border-border text-xs">{media.ageRating}</span>}
            </div>
            <p className="text-sm md:text-lg text-foreground/90 max-w-xl text-shadow-hero line-clamp-4">{media.overview}</p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {/* Assistir — destaque principal com leve gradiente */}
              <button
                onClick={() => setPlaying(true)}
                className="group inline-flex items-center gap-2.5 pl-5 pr-6 py-3 rounded-full font-semibold text-[15px] text-background
                  bg-gradient-to-b from-white to-white/85
                  shadow-[0_8px_24px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_hsl(0_0%_100%/0.6)]
                  hover:shadow-[0_12px_32px_-8px_hsl(0_0%_0%/0.7),inset_0_1px_0_hsl(0_0%_100%/0.6)]
                  transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="h-[18px] w-[18px] fill-current transition-transform group-hover:translate-x-0.5" />
                Assistir
              </button>

              {/* (Botão Detalhes removido — já estamos na página de detalhes) */}

              {/* + Lista — circular minimalista */}
              <button
                onClick={() => toggle(media.id)}
                aria-label={inList ? "Remover da minha lista" : "Adicionar à minha lista"}
                className={cn(
                  "group relative h-[46px] w-[46px] grid place-items-center rounded-full",
                  "border backdrop-blur-xl transition-all duration-300 active:scale-90",
                  inList
                    ? "bg-primary/90 border-primary/60 text-primary-foreground shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.45)]"
                    : "bg-white/[0.06] border-white/15 text-foreground hover:bg-white/[0.12] hover:border-white/25"
                )}
              >
                <span className="transition-transform duration-300 group-active:scale-75">
                  {inList ? <Check className="h-[18px] w-[18px]" strokeWidth={2.25} /> : <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />}
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-3">
              {media.genres.map((g) => (
                <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-surface-elevated/60 backdrop-blur border border-white/10">{g}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-flix py-8 space-y-6">
        <StreamingProviders type="movie" id={media.id} />
        {(media.audioLanguages?.length || media.subtitleLanguages?.length) ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {media.audioLanguages && media.audioLanguages.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Áudio</p>
                <div className="flex flex-wrap gap-1.5">
                  {media.audioLanguages.map((c) => (
                    <span key={c} className="text-xs px-2 py-1 rounded-md bg-white/[0.05] border border-white/10">{LANG_LABEL[c] ?? c.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            )}
            {media.subtitleLanguages && media.subtitleLanguages.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-2">Legendas</p>
                <div className="flex flex-wrap gap-1.5">
                  {media.subtitleLanguages.slice(0, 24).map((c) => (
                    <span key={c} className="text-xs px-2 py-1 rounded-md bg-white/[0.05] border border-white/10">{LANG_LABEL[c] ?? c.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>
      
      <VideoPlayer media={media} open={playing} onClose={() => setPlaying(false)} />
    </div>
  );
};

export default MovieDetail;
