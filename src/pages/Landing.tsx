// Landing pública — design minimalista, orgânico (rounded-full),
// fundo preto absoluto + glow vermelho radial superior, hero centralizado
// e carrossel "Em alta" via TMDB com fallback para mockData.

import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import hero from "@/assets/hero-1.jpg";
import { cn } from "@/lib/utils";

const TMDB_KEY = "6878dca421d0d46297b2e433d48fe964";
const TRENDING_TITLES = [
  "Parasita", "La Casa de Papel", "Breaking Bad", "Interstellar",
  "Cidade de Deus", "Round 6", "Dark", "Peaky Blinders",
  "Narcos", "Money Heist", "Squid Game", "Ozark",
];

interface TrendingItem {
  id: string | number;
  title: string;
  poster: string;
}

async function fetchTmdbPosters(): Promise<TrendingItem[]> {
  try {
    const results = await Promise.all(
      TRENDING_TITLES.map(async (title) => {
        const r = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(
            title
          )}&include_adult=false&page=1`
        );
        if (!r.ok) return null;
        const j = await r.json();
        const hit = (j.results || []).find((x: any) => x.poster_path);
        if (!hit) return null;
        return {
          id: hit.id,
          title: hit.title || hit.name || title,
          poster: `https://image.tmdb.org/t/p/w500${hit.poster_path}`,
        } as TrendingItem;
      })
    );
    return results.filter(Boolean) as TrendingItem[];
  } catch {
    return [];
  }
}

export default function Landing() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [items, setItems] = useState<TrendingItem[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetchTmdbPosters().then((res) => {
      setItems(res);
    });
  }, []);

  return (
    <div className="min-h-screen text-foreground relative" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Glow vermelho radial superior */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[80vh]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(229,9,20,0.15) 0%, transparent 60%)",
        }}
      />
      {/* Noise textura */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Top bar */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-colors",
          scrolled ? "bg-black/70 backdrop-blur-md border-b border-white/5" : "bg-transparent"
        )}
      >
        <div className="container-flix flex items-center h-16">
          <Logo size="md" />
          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="px-5 py-2 rounded-full border text-sm font-medium text-white transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Entrar
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "#E50914" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#B80710")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E50914")}
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-6">
        {/* Collage de imagens desfocadas */}
        <div className="absolute inset-0 overflow-hidden">
          <img src={hero} alt="" className="w-full h-full object-cover opacity-30 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto animate-fade-in">
          <span
            className="inline-block px-4 py-1 rounded-full text-xs uppercase tracking-[0.2em] text-zinc-400 mb-6"
            style={{ border: "1px solid rgba(255,255,255,0.2)" }}
          >
            Em alta agora
          </span>
          <h1 className="font-display font-black text-5xl md:text-7xl text-white leading-[1.05]">
            Assista onde quiser,
            <br />
            <span style={{ color: "#E50914" }}>quando quiser.</span>
          </h1>
          <p className="mt-5 text-zinc-400 text-base md:text-lg max-w-[500px] mx-auto">
            Filmes, séries e muito mais. Tudo gratuito, tudo em um só lugar.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-4 rounded-full font-bold text-white text-base transition-transform hover:scale-[1.03] active:scale-95"
              style={{
                backgroundColor: "#E50914",
                boxShadow: "0 8px 32px rgba(229,9,20,0.4)",
              }}
            >
              Criar conta grátis
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-full font-medium text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Carrossel */}
      <section className="relative py-16 z-10">
        <div className="container-flix">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="uppercase tracking-[0.2em] text-xs text-zinc-500 mb-2">
                Em alta no StreamFlix
              </p>
              <h2 className="font-bold text-2xl text-white">Os mais assistidos da semana</h2>
            </div>
            <button
              onClick={() => scrollerRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
              className="hidden sm:grid place-items-center h-10 w-10 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30"
              aria-label="Próximos"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          >
            {(items.length ? items : Array.from({ length: 8 })).map((m: any, i) => (
              <article
                key={m?.id ?? i}
                className="shrink-0 cursor-pointer rounded-xl overflow-hidden relative group"
                style={{ width: 140, aspectRatio: "2 / 3" }}
              >
                {m?.poster ? (
                  <img
                    src={m.poster}
                    alt={m.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/5 animate-pulse" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent pt-10 pb-3 px-3">
                  <h3 className="text-sm font-medium text-white truncate">{m?.title ?? "—"}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative py-20 z-10">
        <div className="container-flix text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-white">
            Pronto para começar?
          </h2>
          <p className="mt-3 text-zinc-400">
            Crie sua conta gratuita e tenha acesso ao catálogo completo agora mesmo.
          </p>
          <Link
            to="/signup"
            className="inline-flex mt-7 px-8 py-4 rounded-full items-center justify-center font-bold text-white transition-transform hover:scale-[1.03]"
            style={{
              backgroundColor: "#E50914",
              boxShadow: "0 8px 32px rgba(229,9,20,0.4)",
            }}
          >
            Criar conta grátis
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} StreamFlix
      </footer>
    </div>
  );
}
