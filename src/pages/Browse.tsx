// Browse — scroll infinito real para Filmes / Séries / Em Alta.

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { InfiniteCatalog } from "@/components/InfiniteCatalog";
import { fetchAllMovies, fetchAllTv, fetchTrending, countMovies, countSeries } from "@/lib/tmdb";

const Browse = () => {
  const { category = "trending" } = useParams();

  const cfg = useMemo(() => {
    if (category === "movies")
      return { title: "Filmes", loaders: [{ label: "movies", loader: fetchAllMovies }], totalCount: countMovies };
    if (category === "series")
      return { title: "Séries", loaders: [{ label: "series", loader: fetchAllTv }], totalCount: countSeries };
    return { title: "Em Alta", loaders: [{ label: "trending", loader: fetchTrending }], totalCount: undefined };
  }, [category]);

  return <InfiniteCatalog key={category} title={cfg.title} loaders={cfg.loaders} maxPages={20} totalCount={cfg.totalCount} />;
};

export default Browse;

