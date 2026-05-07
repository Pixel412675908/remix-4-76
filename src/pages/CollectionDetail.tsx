// Página de uma coleção: lista todos os filmes em ordem cronológica.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Play, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BackButton } from "@/components/BackButton";
import { fetchCollection, type CollectionInfo } from "@/lib/tmdb";

export default function CollectionDetail() {
  const { collection_id } = useParams();
  const [info, setInfo] = useState<CollectionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collection_id) return;
    setLoading(true);
    fetchCollection(Number(collection_id))
      .then(setInfo)
      .finally(() => setLoading(false));
  }, [collection_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-muted-foreground">Coleção não encontrada.</p>
      </div>
    );
  }

  const firstYear = info.parts[0]?.year;
  const lastYear = info.parts[info.parts.length - 1]?.year;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <BackButton />

      <section className="relative h-[55vh] min-h-[360px] overflow-hidden">
        <img src={info.backdropUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-hero-side" />
        <div className="relative h-full container-flix flex items-end pb-10">
          <div className="max-w-2xl space-y-3 animate-fade-in-up">
            <h1 className="font-display text-4xl md:text-6xl text-shadow-hero">{info.name}</h1>
            <p className="text-sm text-muted-foreground">
              {info.count} {info.count === 1 ? "filme" : "filmes"}
              {firstYear && lastYear && firstYear !== lastYear && ` • ${firstYear} – ${lastYear}`}
            </p>
            {info.overview && (
              <p className="text-sm md:text-base text-foreground/90 line-clamp-3 text-shadow-hero">
                {info.overview}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container-flix py-10 space-y-3">
        {info.parts.map((m, idx) => (
          <Link
            key={m.id}
            to={`/movie/${m.id}`}
            className="group flex flex-col sm:flex-row gap-4 p-3 rounded-2xl border border-white/[0.06] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
          >
            <img
              src={m.posterUrl}
              alt={m.title}
              loading="lazy"
              className="w-full sm:w-32 md:w-36 aspect-[2/3] object-cover rounded-lg shrink-0"
            />
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-2xl font-display text-muted-foreground/60">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="font-semibold text-base md:text-lg">{m.title}</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="inline-flex items-center gap-1 text-primary-glow">
                  <Star className="h-3 w-3 fill-current" /> {m.rating.toFixed(1)}
                </span>
                <span>{m.year}</span>
                {m.duration && <span>{m.duration}</span>}
              </div>
              <p className="text-sm text-muted-foreground/90 line-clamp-2 mb-3">{m.overview}</p>
              <div className="mt-auto">
                <span className="inline-flex items-center gap-1.5 pl-3 pr-3.5 py-1.5 rounded-full bg-white text-background text-xs font-semibold">
                  <Play className="h-3 w-3 fill-current" /> Assistir
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
