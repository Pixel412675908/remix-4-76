import type { Provider } from "../types";

export const superembedProvider: Provider = {
  id: "superembed",
  label: "Superembed",
  addonId: "core",
  priority: 40,
  capabilities: { movies: true, series: true, anime: true, cartoon: true, live: false },
  resolve: ({ media, episode }) => {
    const url = media.type === "movie"
      ? `https://multiembed.mov/directstream.php?video_id=${media.id}&tmdb=1`
      : `https://multiembed.mov/directstream.php?video_id=${media.id}&tmdb=1&s=${episode?.season ?? 1}&e=${episode?.number ?? 1}`;
    return { url };
  },
};
