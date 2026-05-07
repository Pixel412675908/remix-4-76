// Mock data foi removido. Mantemos shims vazios para não quebrar imports legados.
// Todo o conteúdo agora vem do TMDB via src/lib/tmdb.ts.

import { ContentRow, Media, Series } from "@/types/media";

export const mockSeries: Series[] = [];
export const mockMovies: Media[] = [];
export const mockRows: ContentRow[] = [];
export const allMedia: Media[] = [];
export const heroPool: Media[] = [];

export function getMockMediaById(_id: number): Media | undefined {
  return undefined;
}
