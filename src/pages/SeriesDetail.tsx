import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Play, Plus, Check, Star, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BackButton } from "@/components/BackButton";

import { VideoPlayer } from "@/components/VideoPlayer";
import { fetchSeries, fetchEpisodesForSeason } from "@/lib/api";
import { Series, Episode } from "@/types/media";
import { useMyList } from "@/hooks/useMyList";
import { useTrackMediaActivity } from "@/hooks/useWatchHistory";
import { cn } from "@/lib/utils";

const SeriesDetail = () => {
  const { id } = useParams();
  const [series, setSeries] = useState<Series | null>(null);
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [openSeasons, setOpenSeasons] = useState(false);
  const [playing, setPlaying] = useState<{ episode?: Episode } | null>(null);
  const { has, toggle } = useMyList();
  useTrackMediaActivity({
    mediaId: Number(id) || 0,
    mediaType: "tv",
    episodeNumber: playing?.episode?.number ?? null,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) fetchSeries(Number(id)).then(setSeries);
  }, [id]);

  // Carrega episódios da temporada selecionada se ainda vazia
  useEffect(() => {
    if (!series) return;
    const current = series.seasons.find((s) => s.number === seasonNumber);
    if (current && current.episodes.length === 0) {
      fetchEpisodesForSeason(series.id, seasonNumber).then((eps) => {
        setSeries((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            seasons: prev.seasons.map((s) => (s.number === seasonNumber ? { ...s, episodes: eps } : s)),
          };
        });
      });
    }
  }, [series, seasonNumber]);

  if (!series) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const currentSeason = series.seasons.find((s) => s.number === seasonNumber) ?? series.seasons[0];
  const inList = has(series.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <BackButton />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img
          src={series.backdropUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-hero-side" />

        <div className="relative h-full container-flix flex items-end pb-12">
          <div className="max-w-2xl space-y-4 animate-fade-in-up">
            {series.tags && (
              <div className="flex gap-2">
                {series.tags.map((t) => (
                  <span key={t} className="text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <h1 className="font-display text-5xl md:text-7xl text-shadow-hero">{series.title}</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-primary-glow font-semibold">
                <Star className="h-4 w-4 fill-current" /> {series.rating.toFixed(1)}
              </span>
              <span>{series.year}</span>
              <span>{series.duration}</span>
              {series.ageRating && <span className="px-1.5 py-0.5 border border-border text-xs">{series.ageRating}</span>}
            </div>
            <p className="text-sm md:text-lg text-foreground/90 max-w-xl text-shadow-hero line-clamp-4">
              {series.overview}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => setPlaying({ episode: currentSeason.episodes[0] })}
                className="group inline-flex items-center gap-2.5 pl-5 pr-6 py-3 rounded-full font-semibold text-[15px] text-background
                  bg-gradient-to-b from-white to-white/85
                  shadow-[0_8px_24px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_hsl(0_0%_100%/0.6)]
                  hover:shadow-[0_12px_32px_-8px_hsl(0_0%_0%/0.7),inset_0_1px_0_hsl(0_0%_100%/0.6)]
                  transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="h-[18px] w-[18px] fill-current transition-transform group-hover:translate-x-0.5" />
                Assistir
              </button>
              {/* (Botão Detalhes removido) */}
              <button
                onClick={() => toggle(series.id)}
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
              {series.genres.map((g) => (
                <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-surface-elevated/60 backdrop-blur border border-white/10">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Episódios */}
      <section className="container-flix py-10 md:py-14">
        <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Assista agora</p>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide">Episódios</h2>
          </div>

          {/* Season selector — pílula glass */}
          <div className="relative">
            <button
              onClick={() => setOpenSeasons((v) => !v)}
              className="inline-flex items-center gap-3 pl-5 pr-4 py-2.5 rounded-full
                bg-white/[0.05] backdrop-blur-xl border border-white/10
                hover:bg-white/[0.08] hover:border-white/20
                transition-all min-w-[200px] justify-between
                shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)]"
            >
              <span className="text-sm font-medium">{currentSeason.title}</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", openSeasons && "rotate-180 text-foreground")} />
            </button>
            {openSeasons && (
              <div className="absolute right-0 top-full mt-2 min-w-[220px] rounded-2xl bg-popover/95 backdrop-blur-xl border border-white/10 shadow-elevated overflow-hidden z-20 animate-scale-in p-1.5">
                {series.seasons.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => {
                      setSeasonNumber(s.number);
                      setOpenSeasons(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-sm flex items-center justify-between",
                      s.number === seasonNumber && "bg-white/[0.08] text-foreground font-semibold"
                    )}
                  >
                    <span>{s.title}</span>
                    <span className="text-[11px] text-muted-foreground">{(s.episodes.length || s.episodeCount || 0)} eps</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {currentSeason.episodes.map((ep) => (
            <article
              key={ep.id}
              className={cn(
                "group relative rounded-2xl overflow-hidden",
                "bg-gradient-to-br from-white/[0.03] to-white/[0.01]",
                "border border-white/[0.06] hover:border-white/15",
                "shadow-[0_4px_20px_-8px_hsl(0_0%_0%/0.4)] hover:shadow-[0_12px_40px_-12px_hsl(0_0%_0%/0.6)]",
                "transition-all duration-300"
              )}
            >
              <div className="flex flex-col sm:flex-row gap-0 sm:gap-5 p-3 sm:p-4">
                {/* Thumbnail */}
                <button
                  onClick={() => setPlaying({ episode: ep })}
                  className="relative shrink-0 w-full sm:w-64 md:w-72 aspect-video rounded-xl overflow-hidden bg-surface"
                  aria-label={`Assistir ${ep.title}`}
                >
                  <img
                    src={ep.stillUrl}
                    alt={ep.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="h-14 w-14 rounded-full bg-white/95 grid place-items-center shadow-[0_8px_24px_-4px_hsl(0_0%_0%/0.5)] scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="h-5 w-5 fill-current text-background translate-x-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[11px] font-medium text-white/90">
                    {ep.duration}
                  </div>
                </button>
                {/* Info + ação única (Assistir) */}
                <div className="flex-1 min-w-0 flex flex-col py-2 sm:py-1 px-1 sm:px-0">
                  <div className="flex items-baseline gap-3 mb-1.5">
                    <span className="text-2xl md:text-3xl font-display text-muted-foreground/60 leading-none">
                      {String(ep.number).padStart(2, "0")}
                    </span>
                    <h3 className="font-semibold text-base md:text-lg text-foreground line-clamp-1 flex-1">
                      {ep.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed mb-3 sm:mb-4">
                    {ep.overview}
                  </p>

                  <div className="mt-auto">
                    <button
                      onClick={() => setPlaying({ episode: ep })}
                      className="inline-flex items-center gap-1.5 pl-3 pr-3.5 py-2 rounded-full
                        bg-white text-background text-xs font-semibold
                        hover:bg-white/90 transition-all active:scale-95
                        shadow-[0_4px_12px_-4px_hsl(0_0%_0%/0.5)]"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> Assistir
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <VideoPlayer
        media={series}
        episode={playing?.episode}
        open={!!playing}
        onClose={() => setPlaying(null)}
      />
    </div>
  );
};

export default SeriesDetail;
