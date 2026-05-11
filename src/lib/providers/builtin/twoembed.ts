import type { Provider } from "../types";

export const twoembedProvider: Provider = {
  id: "2embed",
  label: "2Embed",
  addonId: "core",
  priority: 20,
  capabilities: { movies: true, series: true, anime: true, cartoon: true, live: false },
  resolve: ({ media, episode }) => {
    const url = media.type === "movie"
      ? `https://www.2embed.cc/embed/${media.id}`
      : `https://www.2embed.cc/embedtv/${media.id}&s=${episode?.season ?? 1}&e=${episode?.number ?? 1}`;
    return { url };
  },
};
