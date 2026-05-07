import { InfiniteCatalog } from "@/components/InfiniteCatalog";
import { fetchUpcomingMovies, fetchUpcomingTv } from "@/lib/tmdb";
import type { Media } from "@/types/media";

function daysUntil(year: number): number {
  // Aproximação: usamos year+release date guessing? Usar Media.year não dá data exata.
  // Renderizamos badge "EM BREVE" + ano.
  return year - new Date().getFullYear();
}

function badge(m: Media) {
  return (
    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-md">
      Em breve {m.year}
    </div>
  );
}

export default function EmBreve() {
  return (
    <InfiniteCatalog
      title="Em Breve"
      subtitle="Lançamentos agendados — filmes e séries que ainda não estrearam."
      loaders={[
        { label: "upcoming-movie", loader: fetchUpcomingMovies },
        { label: "upcoming-tv", loader: fetchUpcomingTv },
      ]}
      badgeRender={badge}
    />
  );
}
