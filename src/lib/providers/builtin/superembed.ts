import type { Provider } from "../types";

export const superembedProvider: Provider = {
  id: "superembed",
  label: "SuperEmbed",
  addonId: "core",
  priority: 30,
  capabilities: { movies: true, series: true, anime: true, cartoon: true, live: false },
  resolve: ({ media, episode }) => {
    const base = `https://multiembed.mov/?video_id=${media.id}&tmdb=1`;
    const url = media.type === "movie"
      ? base
      : `${base}&s=${episode?.season ?? 1}&e=${episode?.number ?? 1}`;
    return { url };
  },
};
