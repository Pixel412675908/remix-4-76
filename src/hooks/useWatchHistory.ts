// Hybrid watch tracking: registers an "opening" when a media page mounts and
// accumulates active-tab seconds, saving every ~15s. Estimates progress using a
// reference duration (45min for tv episode, 90min for movie).
//
// Storage: public.watch_history table on Supabase. RLS ensures privacy.

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";

export type WatchHistoryRow = {
  id: string;
  user_id: string;
  media_id: number;
  media_type: "movie" | "tv";
  episode_number: number | null;
  seconds_watched: number;
  progress_pct: number;
  completed: boolean;
  last_opened_at: string;
  created_at: string;
  updated_at: string;
};

const REFERENCE_SECONDS_TV = 45 * 60;
const REFERENCE_SECONDS_MOVIE = 90 * 60;
const SAVE_INTERVAL_MS = 15_000;

function referenceFor(type: "movie" | "tv") {
  return type === "tv" ? REFERENCE_SECONDS_TV : REFERENCE_SECONDS_MOVIE;
}

function pctFromSeconds(type: "movie" | "tv", seconds: number) {
  return Math.min(100, Math.round((seconds / referenceFor(type)) * 100));
}

/** Reads the current user's watch history (most recent first). */
export function useWatchHistory() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("watch_history" as never)
      .select("*")
      .eq("user_id", user.id)
      .order("last_opened_at", { ascending: false })
      .limit(200);
    setItems((data ?? []) as unknown as WatchHistoryRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const removeItem = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase.from("watch_history" as never).delete().eq("id", id).eq("user_id", user.id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [user]
  );

  const clearAll = useCallback(async () => {
    if (!user) return;
    await supabase.from("watch_history" as never).delete().eq("user_id", user.id);
    setItems([]);
  }, [user]);

  return { items, loading, reload, removeItem, clearAll };
}

/**
 * Tracks an active media page: upserts an opening, then every 15s while the
 * tab is visible, accumulates time and recomputes progress %.
 */
export function useTrackMediaActivity(opts: {
  mediaId: number;
  mediaType: "movie" | "tv";
  episodeNumber?: number | null;
}) {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const enabled = !!user && (settings?.watch_history_enabled ?? true);
  const rowIdRef = useRef<string | null>(null);
  const baseSecondsRef = useRef<number>(0);
  const accumSecondsRef = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());
  const visibleRef = useRef<boolean>(typeof document !== "undefined" ? !document.hidden : true);

  // Initial upsert (opening)
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const ep = opts.episodeNumber ?? null;
      // Try to find existing row
      const { data: existing } = await supabase
        .from("watch_history" as never)
        .select("*")
        .eq("user_id", user!.id)
        .eq("media_id", opts.mediaId)
        .eq("media_type", opts.mediaType)
        .filter("episode_number", ep === null ? "is" : "eq", ep === null ? null : ep)
        .maybeSingle();

      if (cancelled) return;

      if (existing) {
        const row = existing as unknown as WatchHistoryRow;
        rowIdRef.current = row.id;
        baseSecondsRef.current = row.seconds_watched;
        await supabase
          .from("watch_history" as never)
          .update({ last_opened_at: new Date().toISOString() } as never)
          .eq("id", row.id);
      } else {
        const { data: inserted } = await supabase
          .from("watch_history" as never)
          .insert({
            user_id: user!.id,
            media_id: opts.mediaId,
            media_type: opts.mediaType,
            episode_number: ep,
            seconds_watched: 0,
            progress_pct: 1,
            last_opened_at: new Date().toISOString(),
          } as never)
          .select("id, seconds_watched")
          .maybeSingle();
        if (inserted) {
          rowIdRef.current = (inserted as { id: string }).id;
          baseSecondsRef.current = (inserted as { seconds_watched: number }).seconds_watched ?? 0;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, opts.mediaId, opts.mediaType, opts.episodeNumber]);

  // Visibility tracking
  useEffect(() => {
    if (!enabled) return;
    const onVis = () => {
      const now = Date.now();
      if (visibleRef.current && document.hidden) {
        // pause: accumulate elapsed
        accumSecondsRef.current += Math.max(0, Math.floor((now - lastTickRef.current) / 1000));
        visibleRef.current = false;
      } else if (!visibleRef.current && !document.hidden) {
        lastTickRef.current = now;
        visibleRef.current = true;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled]);

  // Periodic save
  useEffect(() => {
    if (!enabled) return;
    lastTickRef.current = Date.now();
    visibleRef.current = !document.hidden;

    const flush = async () => {
      const id = rowIdRef.current;
      if (!id) return;
      const now = Date.now();
      if (visibleRef.current) {
        accumSecondsRef.current += Math.max(0, Math.floor((now - lastTickRef.current) / 1000));
        lastTickRef.current = now;
      }
      const total = baseSecondsRef.current + accumSecondsRef.current;
      const pct = pctFromSeconds(opts.mediaType, total);
      const completed = pct >= 95;
      await supabase
        .from("watch_history" as never)
        .update({
          seconds_watched: total,
          progress_pct: pct,
          completed,
          last_opened_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
    };

    const interval = window.setInterval(flush, SAVE_INTERVAL_MS);
    const onUnload = () => {
      // best-effort sync flush via sendBeacon-less path; just call async, browser may cancel
      flush();
    };
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", onUnload);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, opts.mediaType]);
}
