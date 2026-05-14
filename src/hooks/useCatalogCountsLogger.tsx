// Loga as contagens reais de cada categoria no console (uma vez por sessão).
import { useEffect } from "react";
import {
  countMovies,
  countSeries,
  countNovelas,
  countAnime,
  countAnimation,
} from "@/lib/tmdb";

const FLAG = "__catalog_counts_logged";

export function useCatalogCountsLogger() {
  useEffect(() => {
    if ((window as any)[FLAG]) return;
    (window as any)[FLAG] = true;
    (async () => {
      const [filmes, series, novelas, animes, desenhos] = await Promise.all([
        countMovies().catch(() => 0),
        countSeries().catch(() => 0),
        countNovelas().catch(() => 0),
        countAnime().catch(() => 0),
        countAnimation().catch(() => 0),
      ]);
      // eslint-disable-next-line no-console
      console.log("=== CONTAGEM DE TÍTULOS ===");
      // eslint-disable-next-line no-console
      console.log("Filmes:", filmes);
      // eslint-disable-next-line no-console
      console.log("Séries:", series);
      // eslint-disable-next-line no-console
      console.log("Novelas:", novelas);
      // eslint-disable-next-line no-console
      console.log("Animes:", animes);
      // eslint-disable-next-line no-console
      console.log("Desenhos:", desenhos);
    })();
  }, []);
}
