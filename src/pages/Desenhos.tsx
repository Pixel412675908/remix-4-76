import { InfiniteCatalog, ANIMATION_GENRE_OPTIONS } from "@/components/InfiniteCatalog";
import { fetchAnimation, countAnimation } from "@/lib/tmdb";

export default function Desenhos() {
  return (
    <InfiniteCatalog
      title="Desenhos"
      subtitle="Animações ocidentais, clássicos e modernos para toda a família."
      loaders={[{ label: "animation", loader: fetchAnimation }]}
      totalCount={countAnimation}
      genreOptions={ANIMATION_GENRE_OPTIONS}
    />
  );
}
