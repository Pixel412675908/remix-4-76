import type { Provider } from "../types";

export const vidsrcProvider: Provider = {
  id: "vidsrc",
  label: "VidSrc",
  addonId: "core",
  priority: 10,
  capabilities: { movies: true, series: true, anime: true, cartoon: true, live: false },
  resolve: ({ media, episode, preferredAudio }) => {
    const lang = preferredAudio ?? "pt";
    const url = media.type === "movie"
      ? `https://vidsrc.xyz/embed/movie?tmdb=${media.id}&ds_lang=${lang}`
      : `https://vidsrc.xyz/embed/tv?tmdb=${media.id}&season=${episode?.season ?? 1}&episode=${episode?.number ?? 1}&ds_lang=${lang}`;
    return { url };
  },
};
