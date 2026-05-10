// Hierarquia de servidores de embed para reprodução de vídeo.
// Ordem oficial: VidSrc -> AutoEmbed -> 2Embed -> Superembed.
// Cada função recebe (tmdbId, season?, episode?) e devolve a URL embed.
// Adicionar novo provedor = empurrar uma entrada nova nesta lista.

import type { Media } from "@/types/media";

export type StreamProviderId = "vidsrc" | "autoembed" | "2embed" | "superembed";

export interface StreamProvider {
  id: StreamProviderId;
  label: string;
  build: (media: Media, ep?: { season?: number; number: number } | null) => string;
}

const isMovie = (m: Media) => m.type === "movie";

export const STREAM_PROVIDERS: StreamProvider[] = [
  {
    id: "vidsrc",
    label: "VidSrc",
    build: (media, ep) =>
      isMovie(media)
        ? `https://vidsrc.xyz/embed/movie?tmdb=${media.id}&ds_lang=pt`
        : `https://vidsrc.xyz/embed/tv?tmdb=${media.id}&season=${ep?.season ?? 1}&episode=${ep?.number ?? 1}&ds_lang=pt`,
  },
  {
    id: "autoembed",
    label: "AutoEmbed",
    build: (media, ep) =>
      isMovie(media)
        ? `https://player.autoembed.cc/embed/movie/${media.id}?lang=pt`
        : `https://player.autoembed.cc/embed/tv/${media.id}/${ep?.season ?? 1}/${ep?.number ?? 1}?lang=pt`,
  },
  {
    id: "2embed",
    label: "2Embed",
    build: (media, ep) =>
      isMovie(media)
        ? `https://www.2embed.cc/embed/${media.id}`
        : `https://www.2embed.cc/embedtv/${media.id}&s=${ep?.season ?? 1}&e=${ep?.number ?? 1}`,
  },
  {
    id: "superembed",
    label: "Superembed",
    build: (media, ep) =>
      isMovie(media)
        ? `https://multiembed.mov/directstream.php?video_id=${media.id}&tmdb=1`
        : `https://multiembed.mov/directstream.php?video_id=${media.id}&tmdb=1&s=${ep?.season ?? 1}&e=${ep?.number ?? 1}`,
  },
];

/** Health-cache simples em memória por sessão. */
const unhealthy = new Map<StreamProviderId, number>(); // providerId -> timestamp ms até quando evitar
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

export function markUnhealthy(id: StreamProviderId) {
  unhealthy.set(id, Date.now() + COOLDOWN_MS);
}

export function isHealthy(id: StreamProviderId) {
  const t = unhealthy.get(id);
  if (!t) return true;
  if (Date.now() > t) {
    unhealthy.delete(id);
    return true;
  }
  return false;
}

/** Retorna provedores na ordem da hierarquia, com os "doentes" no fim. */
export function orderedProviders(): StreamProvider[] {
  const healthy = STREAM_PROVIDERS.filter((p) => isHealthy(p.id));
  const sick = STREAM_PROVIDERS.filter((p) => !isHealthy(p.id));
  return [...healthy, ...sick];
}
