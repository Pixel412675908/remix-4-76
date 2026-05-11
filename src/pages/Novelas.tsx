import { InfiniteCatalog } from "@/components/InfiniteCatalog";
import { fetchNovelasInternational, fetchNovelasTurkish } from "@/lib/tmdb";

export default function Novelas() {
  return (
    <InfiniteCatalog
      title="Novelas"
      subtitle="400 novelas internacionais + 400 novelas turcas, em ordem de popularidade."
      loaders={[
        { label: "novelas-int", loader: fetchNovelasInternational },
        { label: "novelas-tr", loader: fetchNovelasTurkish },
      ]}
      maxPages={20}
    />
  );
}
