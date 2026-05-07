// Player real: TMDB + VidSrc/embedstreams. Modo paisagem em mobile via Screen Orientation API.
// Sandbox configurado: bloqueia popups de ads sem quebrar player.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Compass, Tv, Clock, ExternalLink, AlertTriangle } from "lucide-react";
import { Media, Episode } from "@/types/media";
import { useAuth } from "@/hooks/useAuth";
import { buildEmbedUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { checkExplorerAccess, trackExplorerUsage, EXPLORER_LIMITS } from "@/lib/explorer";

interface VideoPlayerProps {
  media: Media | null;
  episode?: Episode | null;
  open: boolean;
  onClose: () => void;
}

export const VideoPlayer = ({ media, episode, open, onClose }: VideoPlayerProps) => {
  const { isExplorer } = useAuth();
  const navigate = useNavigate();
  const [explorerBlock, setExplorerBlock] = useState<{ blocked: boolean; reason?: "movie_limit" | "series_limit" } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const tickRef = useRef<number | null>(null);
  const overlayTimerRef = useRef<number | null>(null);
  const blockTimerRef = useRef<number | null>(null);

  // ESC + body lock + tentar travar landscape em mobile
  useEffect(() => {
    if (!open || !media) {
      setElapsed(0);
      setExplorerBlock(null);
      setIframeLoaded(false);
      setIframeBlocked(false);
      setOverlayVisible(true);
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    // Tenta forçar landscape em mobile
    const orient: any = (screen as any).orientation;
    if (orient && typeof orient.lock === "function") {
      orient.lock("landscape").catch(() => {});
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      if (orient && typeof orient.unlock === "function") {
        try { orient.unlock(); } catch { /* ignore */ }
      }
    };
  }, [open, media, onClose]);

  const showOverlay = () => {
    setOverlayVisible(true);
    if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = window.setTimeout(() => setOverlayVisible(false), 3500);
  };

  useEffect(() => {
    if (!open || !iframeLoaded) return;
    showOverlay();
    return () => {
      if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current);
    };
  }, [open, iframeLoaded]);

  // Detecta bloqueio do iframe (X-Frame-Options/CSP do provedor) — timeout 4s sem load
  useEffect(() => {
    if (!open || !media) return;
    if (blockTimerRef.current) window.clearTimeout(blockTimerRef.current);
    blockTimerRef.current = window.setTimeout(() => {
      if (!iframeLoaded) {
        setIframeBlocked(true);
        // log diagnóstico
        // eslint-disable-next-line no-console
        console.warn("[VideoPlayer] iframe não carregou em 4s — provavelmente bloqueado por X-Frame-Options/CSP do provedor.");
      }
    }, 4000);
    return () => {
      if (blockTimerRef.current) window.clearTimeout(blockTimerRef.current);
    };
  }, [open, media, iframeLoaded]);

  useEffect(() => {
    if (!open || !media || !isExplorer) return;
    if (!media.freeForExplorer) {
      setExplorerBlock({ blocked: true });
      return;
    }
    checkExplorerAccess(media.id, media.type, episode?.number).then(setExplorerBlock);
  }, [open, media, isExplorer, episode]);

  useEffect(() => {
    if (!open || !media || !isExplorer || explorerBlock?.blocked) return;
    if (media.type !== "movie" && episode == null) return;
    tickRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [open, media, isExplorer, episode, explorerBlock]);

  useEffect(() => {
    if (!isExplorer || !media || elapsed === 0) return;
    if (media.type === "movie") {
      if (elapsed >= EXPLORER_LIMITS.movieSeconds) {
        setExplorerBlock({ blocked: true, reason: "movie_limit" });
        if (tickRef.current) window.clearInterval(tickRef.current);
      }
      if (elapsed % 10 === 0) {
        trackExplorerUsage({ mediaId: media.id, mediaType: "movie", seconds: elapsed });
      }
    } else if (episode) {
      if (elapsed === 5) {
        trackExplorerUsage({ mediaId: media.id, mediaType: "tv", episodeNumber: episode.number, seconds: elapsed });
      }
    }
  }, [elapsed, isExplorer, media, episode]);

  if (!open || !media) return null;

  const lockedFree = isExplorer && !media.freeForExplorer;
  const reachedLimit = isExplorer && explorerBlock?.blocked && explorerBlock?.reason;
  const src = buildEmbedUrl(media, episode ?? null);
  const title = episode ? `${media.title} • ${episode.title}` : media.title;
  const noServer = !src;

  const remaining =
    isExplorer && media.type === "movie"
      ? Math.max(0, EXPLORER_LIMITS.movieSeconds - elapsed)
      : null;

  return (
    <div
      className={cn("fixed inset-0 z-[100] bg-black flex flex-col", "animate-player-in")}
      role="dialog"
      aria-modal="true"
      aria-label={`Player: ${title}`}
      onMouseMove={showOverlay}
      onTouchStart={showOverlay}
    >
      {/* Overlay */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 z-20 transition-opacity duration-500",
          overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between p-3 md:p-5 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
          <button
            onClick={onClose}
            aria-label="Voltar"
            className="group flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all duration-200 hover:scale-[1.03] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar</span>
          </button>

          <div className="min-w-0 mx-3 flex-1 text-center hidden sm:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Reproduzindo</p>
            <h2 className="font-display text-base md:text-lg text-white truncate drop-shadow-lg">{title}</h2>
          </div>

          <div className="flex items-center gap-2">
            {remaining != null && !lockedFree && !reachedLimit && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white">
                <Clock className="h-3 w-3" />
                {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
              </div>
            )}
            <div className="w-[88px] sm:hidden" aria-hidden />
          </div>
        </div>
      </div>

      {/* Player */}
      <div className="flex-1 w-full h-full relative bg-black grid place-items-center">
        {lockedFree ? (
          <PlayerMessage
            icon={<Lock className="h-12 w-12" />}
            title="Player bloqueado"
            description="No Modo Explorador você só assiste a uma seleção limitada. Crie uma conta gratuita."
            action={{
              label: "Criar conta",
              icon: <Compass className="h-3.5 w-3.5" />,
              onClick: () => { onClose(); navigate("/signup"); },
            }}
          />
        ) : reachedLimit ? (
          <PlayerMessage
            icon={<Lock className="h-12 w-12" />}
            title={explorerBlock?.reason === "movie_limit" ? "Limite de 20 minutos atingido" : "Limite de 3 episódios atingido"}
            description="Crie sua conta gratuita para continuar assistindo."
            action={{
              label: "Criar conta agora",
              icon: <Compass className="h-3.5 w-3.5" />,
              onClick: () => { onClose(); navigate("/signup"); },
            }}
          />
        ) : noServer ? (
          <PlayerMessage icon={<Tv className="h-12 w-12" />} title="Player indisponível" description="Não foi possível carregar o vídeo no momento." />
        ) : (
          <>
            {!iframeBlocked && (
              <div
                className={cn(
                  "absolute inset-0 z-10 grid place-items-center bg-black transition-opacity duration-500",
                  iframeLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
              >
                <LoadingSpinner label="Carregando conteúdo..." />
              </div>
            )}

            {iframeBlocked && (
              <div className="absolute inset-0 z-30 grid place-items-center bg-black px-6">
                <div className="max-w-md text-center">
                  <div className="mx-auto mb-4 h-16 w-16 grid place-items-center rounded-full bg-amber-500/10 text-amber-400">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-2xl tracking-wide mb-2">Player bloqueado pelo provedor</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    O servidor de vídeo (VidSrc) não permite reprodução dentro do preview do Lovable.
                    Abra em uma nova aba para assistir normalmente — funcionará no app publicado.
                  </p>
                  <a
                    href={src!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir player em nova aba
                  </a>
                </div>
              </div>
            )}

            {/* Container 16:9 — em mobile usa 56.25vw para garantir o vídeo deitado. */}
            <div
              className="relative w-full"
              style={{
                maxWidth: "100vw",
                aspectRatio: "16 / 9",
              }}
            >
              <iframe
                key={src}
                src={src!}
                title={title}
                onLoad={() => {
                  setIframeLoaded(true);
                  setIframeBlocked(false);
                  if (blockTimerRef.current) window.clearTimeout(blockTimerRef.current);
                }}
                referrerPolicy="no-referrer"
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                style={{ border: 0, width: "100%", height: "100%", background: "#000", display: "block" }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const LoadingSpinner = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-5 animate-fade-in">
    <div className="relative h-14 w-14">
      <div className="absolute inset-0 rounded-full border-2 border-white/10" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white border-r-white/60 animate-spin" />
      <div className="absolute inset-2 rounded-full bg-white/5 backdrop-blur-sm" />
    </div>
    <p className="text-sm text-white/70 tracking-wide font-medium">{label}</p>
  </div>
);

const PlayerMessage = ({
  icon, title, description, action,
}: {
  icon: React.ReactNode; title: string; description: string;
  action?: { label: string; icon?: React.ReactNode; onClick: () => void };
}) => (
  <div className="max-w-md text-center px-6 py-10">
    <div className="mx-auto mb-4 h-20 w-20 grid place-items-center rounded-full bg-surface text-muted-foreground">{icon}</div>
    <h3 className="font-display text-2xl tracking-wide mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-5">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow transition-colors"
      >
        {action.icon}
        {action.label}
      </button>
    )}
  </div>
);
