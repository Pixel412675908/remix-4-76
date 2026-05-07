import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Media } from "@/types/media";
import { MediaCard } from "./MediaCard";
import { cn } from "@/lib/utils";

interface ContentRowProps {
  title: string;
  items: Media[];
  onPlay?: (m: Media) => void;
}

export const ContentRow = ({ title, items, onPlay }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section
      className="relative group/row py-3 md:py-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={title}
    >
      <h2 className="container-flix font-display text-lg md:text-xl mb-2 tracking-wide">{title}</h2>

      <div className="relative">
        <button
          onClick={() => scroll("left")}
          aria-label="Anterior"
          className={cn(
            "hidden md:grid place-items-center absolute left-0 top-0 bottom-0 z-20 w-10 lg:w-12",
            "bg-gradient-to-r from-background via-background/70 to-transparent",
            "transition-opacity duration-200",
            hovered ? "opacity-100" : "opacity-0"
          )}
        >
          <ChevronLeft className="h-6 w-6 hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => scroll("right")}
          aria-label="Próximo"
          className={cn(
            "hidden md:grid place-items-center absolute right-0 top-0 bottom-0 z-20 w-10 lg:w-12",
            "bg-gradient-to-l from-background via-background/70 to-transparent",
            "transition-opacity duration-200",
            hovered ? "opacity-100" : "opacity-0"
          )}
        >
          <ChevronRight className="h-6 w-6 hover:scale-110 transition-transform" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-2.5 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 lg:px-12 pb-6 pt-1"
        >
          {items.map((item, idx) => (
            <MediaCard key={`${item.id}-${idx}`} media={item} onPlay={onPlay} />
          ))}
        </div>
      </div>
    </section>
  );
};
