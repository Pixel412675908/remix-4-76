// Browse — scroll infinito real para Filmes / Séries / Em Alta.

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { InfiniteCatalog } from "@/components/InfiniteCatalog";
import { fetchAllMovies, fetchAllTv, fetchTrending } from "@/lib/tmdb";

const Browse = () => {
  const { category = "trending" } = useParams();

  const cfg = useMemo(() => {
    if (category === "movies") return { title: "Filmes", loaders: [{ label: "movies", loader: fetchAllMovies }] };
    if (category === "series") return { title: "Séries", loaders: [{ label: "series", loader: fetchAllTv }] };
    return { title: "Em Alta", loaders: [{ label: "trending", loader: fetchTrending }] };
  }, [category]);

  return <InfiniteCatalog key={category} title={cfg.title} loaders={cfg.loaders} maxPages={20} />;
};

export default Browse;
