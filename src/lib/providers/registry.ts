// Registry central de providers — singleton em memória.
// Permite adicionar/remover providers em runtime (via addons) e
// consultar lista ordenada por (saudável, prioridade, score).

import type { ContentKind, MediaRequest, Provider } from "./types";
import { isAvailable, snapshot } from "./health";

const providers = new Map<string, Provider>();
const disabled = new Set<string>();

export function registerProvider(p: Provider) {
  providers.set(p.id, p);
}

export function unregisterProvider(id: string) {
  providers.delete(id);
  disabled.delete(id);
}

export function setProviderEnabled(id: string, enabled: boolean) {
  if (enabled) disabled.delete(id);
  else disabled.add(id);
}

export function isProviderEnabled(id: string) {
  return providers.has(id) && !disabled.has(id);
}

export function listProviders(): Provider[] {
  return [...providers.values()];
}

function supports(p: Provider, kind: ContentKind): boolean {
  const c = p.capabilities;
  switch (kind) {
    case "movie": return c.movies;
    case "series": return c.series;
    case "anime": return c.anime;
    case "cartoon": return c.cartoon;
    case "live": return c.live;
  }
}

function kindOf(req: MediaRequest): ContentKind {
  // Mapping mínimo — o app só conhece movie/series hoje.
  return req.media.type === "movie" ? "movie" : "series";
}

/**
 * Retorna providers candidatos para uma requisição:
 *  1. precisam estar habilitados
 *  2. precisam suportar o tipo de mídia
 *  3. saudáveis vêm primeiro (priority asc, depois score desc)
 *  4. em cooldown vão pro fim, mas continuam disponíveis como último recurso
 */
export function candidatesFor(req: MediaRequest, exclude: string[] = []): Provider[] {
  const kind = kindOf(req);
  const all = listProviders().filter(
    (p) => isProviderEnabled(p.id) && supports(p, kind) && !exclude.includes(p.id),
  );
  const score = (p: Provider) => snapshot(p.id).score;
  const healthy = all.filter((p) => isAvailable(p.id));
  const sick = all.filter((p) => !isAvailable(p.id));
  const sortFn = (a: Provider, b: Provider) =>
    a.priority - b.priority || score(b) - score(a);
  healthy.sort(sortFn);
  sick.sort(sortFn);
  return [...healthy, ...sick];
}

export function pickBest(req: MediaRequest, exclude: string[] = []): Provider | null {
  return candidatesFor(req, exclude)[0] ?? null;
}
