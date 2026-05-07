// API layer — agora 100% TMDB (sem mocks). Mantém shape esperado pelo restante do app.

import { Media, Series, ContentRow, Account, Episode } from "@/types/media";
import {
  fetchHomeRowsTmdb,
  fetchMediaUnknown,
  fetchMovieDetail,
  fetchTvDetail,
  fetchSeasonEpisodes,
  searchTmdb,
  buildPlayerUrl,
} from "./tmdb";

/** URL do player. episodeId aqui na verdade é o NUMBER do episódio quando passado.
 *  Aceita opcionalmente um startSeconds (ignorado pelos provedores VidSrc). */
export function buildEmbedUrl(media: Media, episode?: Episode | { number: number; season?: number } | null, _startSeconds?: number): string {
  if (!episode) return buildPlayerUrl(media);
  const ep = episode as any;
  // tenta encontrar a season do episódio dentro da série
  let season: number | undefined = ep.season;
  if (!season && media.type === "tv") {
    const s = (media as Series).seasons.find((ss) => ss.episodes.some((e) => e.id === ep.id || e.number === ep.number));
    if (s) season = s.number;
  }
  return buildPlayerUrl(media, { number: ep.number, season });
}

export async function fetchHomeRows(): Promise<ContentRow[]> {
  return fetchHomeRowsTmdb();
}

export async function fetchSeries(id: number): Promise<Series | null> {
  return fetchTvDetail(id);
}

export async function fetchMedia(id: number): Promise<Media | null> {
  return fetchMediaUnknown(id);
}

export async function fetchEpisodesForSeason(tvId: number, season: number) {
  return fetchSeasonEpisodes(tvId, season);
}

export async function searchMedia(query: string): Promise<Media[]> {
  return searchTmdb(query);
}

export function sortMediaForAccount(items: Media[], account: Account | null): Media[] {
  if (!account) return items;
  const genreSet = new Set(account.favorite_genres);
  const recentThreshold = new Date().getFullYear() - 2;
  const scored = items.map((media, index) => {
    let score = media.rating * 10;
    if (account.recommendations) {
      score += media.genres.filter((g) => genreSet.has(g)).length * 18;
    }
    if (account.era === "recent" && media.year >= recentThreshold) score += 12;
    if (account.era === "classics" && media.year < 2000) score += 12;
    if (account.continuity && media.type === "tv") score += 6;
    if (!account.continuity && media.type === "movie") score += 6;
    return { media, index, score };
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map(({ media }) => media);
}
