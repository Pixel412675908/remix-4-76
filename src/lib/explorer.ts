// Modo Explorador — guest_id persistente + tracking de uso no backend

import { supabase } from "@/integrations/supabase/client";

const GUEST_KEY = "streamflix:guest-id";

export const EXPLORER_LIMITS = {
  movieSeconds: 20 * 60, // 20 min
  episodesPerSeries: 3,
};

export function getGuestId(): string {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export interface ExplorerCheck {
  blocked: boolean;
  reason?: "movie_limit" | "series_limit";
  episodesWatched?: number;
  secondsWatched?: number;
}

/** Verifica no backend se o explorador ainda pode reproduzir este conteúdo. */
export async function checkExplorerAccess(
  mediaId: number,
  mediaType: "movie" | "tv",
  episodeNumber?: number
): Promise<ExplorerCheck> {
  const guestId = getGuestId();
  const { data } = await supabase
    .from("explorer_usage")
    .select("episode_number,seconds_watched")
    .eq("guest_id", guestId)
    .eq("media_id", mediaId)
    .eq("media_type", mediaType);

  if (mediaType === "movie") {
    const total = (data ?? []).reduce((s, r) => s + (r.seconds_watched ?? 0), 0);
    if (total >= EXPLORER_LIMITS.movieSeconds) {
      return { blocked: true, reason: "movie_limit", secondsWatched: total };
    }
    return { blocked: false, secondsWatched: total };
  }

  // série
  const distinctEps = new Set(
    (data ?? []).map((r) => r.episode_number).filter((n): n is number => n != null)
  );
  if (
    episodeNumber != null &&
    !distinctEps.has(episodeNumber) &&
    distinctEps.size >= EXPLORER_LIMITS.episodesPerSeries
  ) {
    return { blocked: true, reason: "series_limit", episodesWatched: distinctEps.size };
  }
  return { blocked: false, episodesWatched: distinctEps.size };
}

/** Registra uso (insert ou update). seconds: total acumulado para o item. */
export async function trackExplorerUsage(opts: {
  mediaId: number;
  mediaType: "movie" | "tv";
  episodeNumber?: number;
  seconds: number;
}) {
  const guestId = getGuestId();
  const { mediaId, mediaType, episodeNumber, seconds } = opts;

  // Tenta achar registro existente
  let q = supabase
    .from("explorer_usage")
    .select("id,seconds_watched")
    .eq("guest_id", guestId)
    .eq("media_id", mediaId)
    .eq("media_type", mediaType);
  if (episodeNumber != null) q = q.eq("episode_number", episodeNumber);

  const { data } = await q.limit(1);
  const existing = data?.[0];

  if (existing) {
    await supabase
      .from("explorer_usage")
      .update({ seconds_watched: Math.max(existing.seconds_watched, seconds) })
      .eq("id", existing.id);
  } else {
    await supabase.from("explorer_usage").insert({
      guest_id: guestId,
      media_id: mediaId,
      media_type: mediaType,
      episode_number: episodeNumber ?? null,
      seconds_watched: seconds,
    });
  }
}
