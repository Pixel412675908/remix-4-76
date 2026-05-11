import type { Provider } from "../types";

export const vidsrcProvider: Provider = {
  id: "vidsrc",
  label: "VidSrc",
  addonId: "core",
  priority: 10,
  capabilities: { movies: true, series: true, anime: true, cartoon: true, live: false },
  resolve: ({ media, episode }) => {
    const url = media.type === "movie"
      ? `https://vidsrc.to/embed/movie/${media.id}`
      : `https://vidsrc.to/embed/tv/${media.id}/${episode?.season ?? 1}/${episode?.number ?? 1}`;
    return { url };
  },
};
