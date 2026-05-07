import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { Navbar } from "@/components/Navbar";

import { MediaCard } from "@/components/MediaCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { searchMedia, sortMediaForAccount } from "@/lib/api";
import { canWatch } from "@/lib/maturity";
import { useAuth } from "@/hooks/useAuth";
import { Media } from "@/types/media";

const Search = () => {
  const { account, activeProfile } = useAuth();
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const [results, setResults] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<Media | null>(null);

  // Debounce: 300ms
  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      searchMedia(q)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  const visibleResults = sortMediaForAccount(
    results.filter((m) => canWatch(m, activeProfile, account)),
    account
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-flix pt-28 md:pt-32 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <SearchIcon className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl md:text-5xl tracking-wide">
            Resultados para "{q}"
          </h1>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        {!loading && visibleResults.length === 0 ? (
          <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {visibleResults.map((m) => (
              <MediaCard key={m.id} media={m} onPlay={(x) => setPlaying(x)} />
            ))}
          </div>
        )}
      </main>

      <VideoPlayer media={playing} open={!!playing} onClose={() => setPlaying(null)} />
    </div>
  );
};

export default Search;
