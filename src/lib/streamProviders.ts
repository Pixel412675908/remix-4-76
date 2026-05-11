// Fachada legada do VideoPlayer.
// A lógica real vive em `src/lib/providers/` (registry + health) e
// `src/lib/addons/` (registro modular). Importar este módulo continua
// funcionando — agora delega ao registry e ainda dispara o bootstrap
// dos addons built-in.

import type { Media } from "@/types/media";
import "@/lib/addons"; // bootstrap (idempotente) — registra core providers
import {
  candidatesFor,
  isProviderEnabled,
  listProviders,
} from "@/lib/providers/registry";
import {
  isAvailable,
  reportFailure,
  reportSuccess,
} from "@/lib/providers/health";
import type { Provider } from "@/lib/providers/types";

export type StreamProviderId = string;

export interface StreamProvider {
  id: StreamProviderId;
  label: string;
  build: (media: Media, ep?: { season?: number; number: number } | null) => string;
}

function adapt(p: Provider): StreamProvider {
  return {
    id: p.id,
    label: p.label,
    build: (media, ep) => p.resolve({ media, episode: ep, preferredAudio: "pt" }).url,
  };
}

/** Snapshot ordenado por prioridade — registrado no bootstrap dos addons. */
export const STREAM_PROVIDERS: StreamProvider[] = listProviders()
  .slice()
  .sort((a, b) => a.priority - b.priority)
  .map(adapt);

export function markUnhealthy(id: StreamProviderId) {
  reportFailure(id);
}

export function isHealthy(id: StreamProviderId) {
  return isProviderEnabled(id) && isAvailable(id);
}

/** Lista ordenada para uma mídia: saudáveis primeiro, doentes ao fim. */
export function orderedProviders(media?: Media): StreamProvider[] {
  const ref: Media = media ?? ({ id: 0, type: "movie" } as Media);
  return candidatesFor({ media: ref }).map(adapt);
}

/** Reportar reprodução bem-sucedida (uso futuro do player). */
export function markHealthy(id: StreamProviderId) {
  reportSuccess(id);
}
