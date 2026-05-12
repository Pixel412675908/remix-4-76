import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";

import { MediaCard } from "@/components/MediaCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useMyList } from "@/hooks/useMyList";
import { fetchMedia } from "@/lib/api";
import { Media } from "@/types/media";
import { Bookmark } from "lucide-react";

const MyList = () => {
  const { ids } = useMyList();
  const [items, setItems] = useState<Media[]>([]);
  const [playing, setPlaying] = useState<Media | null>(null);

  useEffect(() => {
    Promise.all(ids.map((id) => fetchMedia(id))).then((res) =>
      setItems(res.filter((m): m is Media => !!m))
    );
  }, [ids]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-flix pt-28 md:pt-32 pb-20">
        <h1 className="font-display text-4xl md:text-6xl mb-2 tracking-wide">Minha Lista</h1>
        <p className="text-muted-foreground mb-10">
          {items.length} {items.length === 1 ? "título salvo" : "títulos salvos"}
        </p>

        {items.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-16 text-center">
            <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              Você ainda não adicionou nenhum título à sua lista.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {items.map((m) => (
              <MediaCard key={m.id} media={m} onPlay={(x) => setPlaying(x)} />
            ))}
          </div>
        )}
      </main>
      
      <VideoPlayer media={playing} open={!!playing} onClose={() => setPlaying(null)} />
    </div>
  );
};

export default MyList;
