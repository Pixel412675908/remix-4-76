import { InfiniteCatalog } from "@/components/InfiniteCatalog";
import { fetchAnimation } from "@/lib/tmdb";

export default function Desenhos() {
  return (
    <InfiniteCatalog
      title="Desenhos"
      subtitle="Animações ocidentais, clássicos e modernos para toda a família."
      loaders={[{ label: "animation", loader: fetchAnimation }]}
    />
  );
}
