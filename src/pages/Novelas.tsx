import { InfiniteCatalog, NOVELA_GENRE_OPTIONS } from "@/components/InfiniteCatalog";
import { fetchNovelas, countNovelas } from "@/lib/tmdb";

export default function Novelas() {
  return (
    <InfiniteCatalog
      title="Novelas"
      subtitle="Novelas internacionais e turcas em destaque."
      loaders={[{ label: "novelas", loader: fetchNovelas }]}
      totalCount={countNovelas}
      genreOptions={NOVELA_GENRE_OPTIONS}
    />
  );
}
