import { InfiniteCatalog } from "@/components/InfiniteCatalog";
import { fetchAnime } from "@/lib/tmdb";

export default function Animes() {
  return (
    <InfiniteCatalog
      title="Animes"
      subtitle="Os melhores animes japoneses, em ordem de popularidade."
      loaders={[{ label: "anime", loader: fetchAnime }]}
    />
  );
}
