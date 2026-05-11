import type { Provider } from "../types";

export const autoembedProvider: Provider = {
  id: "autoembed",
  label: "AutoEmbed",
  addonId: "core",
  priority: 40,
  capabilities: { movies: true, series: true, anime: true, cartoon: true, live: false },
  resolve: ({ media, episode }) => {
    const url = media.type === "movie"
      ? `https://autoembed.co/movie/tmdb/${media.id}`
      : `https://autoembed.co/tv/tmdb/${media.id}-${episode?.season ?? 1}-${episode?.number ?? 1}`;
    return { url };
  },
};
