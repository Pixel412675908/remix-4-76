import type { Provider } from "../types";

export const autoembedProvider: Provider = {
  id: "autoembed",
  label: "AutoEmbed",
  addonId: "core",
  priority: 20,
  capabilities: { movies: true, series: true, anime: true, cartoon: true, live: false },
  resolve: ({ media, episode, preferredAudio }) => {
    const lang = preferredAudio ?? "pt";
    const url = media.type === "movie"
      ? `https://player.autoembed.cc/embed/movie/${media.id}?lang=${lang}`
      : `https://player.autoembed.cc/embed/tv/${media.id}/${episode?.season ?? 1}/${episode?.number ?? 1}?lang=${lang}`;
    return { url };
  },
};
