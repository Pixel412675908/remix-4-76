// Lista de coleções/franquias.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { fetchFeaturedCollections, type CollectionInfo } from "@/lib/tmdb";

export default function Colecoes() {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCollections()
      .then((c) => setCollections(c))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-flix pt-28 md:pt-32 pb-20">
        <h1 className="font-display text-4xl md:text-6xl mb-2 tracking-wide">Coleções</h1>
        <p className="text-muted-foreground mb-8">
          Sagas e franquias completas — todos os filmes em um único lugar.
        </p>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((c) => (
              <Link
                key={c.id}
                to={`/colecoes/${c.id}`}
                className="group relative aspect-[16/9] rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02]"
              >
                <img
                  src={c.backdropUrl}
                  alt={c.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-2xl text-shadow-hero">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.count} {c.count === 1 ? "filme" : "filmes"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
