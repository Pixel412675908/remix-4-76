// Health tracker para providers de streaming.
// Mantém score EWMA + cooldown temporário ("blacklist suave").
// Sem dependências externas — vive em memória durante a sessão.

import type { ProviderHealthSnapshot } from "./types";

const COOLDOWN_MS = 5 * 60 * 1000; // 5 min
const EWMA_ALPHA = 0.35; // peso da última amostra

interface InternalHealth {
  score: number;
  cooldownUntil: number;
  successes: number;
  failures: number;
}

const map = new Map<string, InternalHealth>();

function ensure(id: string): InternalHealth {
  let h = map.get(id);
  if (!h) {
    h = { score: 1, cooldownUntil: 0, successes: 0, failures: 0 };
    map.set(id, h);
  }
  return h;
}

export function reportSuccess(id: string) {
  const h = ensure(id);
  h.successes += 1;
  h.score = h.score * (1 - EWMA_ALPHA) + 1 * EWMA_ALPHA;
  if (h.cooldownUntil && Date.now() > h.cooldownUntil) h.cooldownUntil = 0;
}

export function reportFailure(id: string, opts?: { cooldown?: boolean }) {
  const h = ensure(id);
  h.failures += 1;
  h.score = h.score * (1 - EWMA_ALPHA) + 0 * EWMA_ALPHA;
  if (opts?.cooldown !== false) h.cooldownUntil = Date.now() + COOLDOWN_MS;
}

export function isAvailable(id: string): boolean {
  const h = map.get(id);
  if (!h) return true;
  if (h.cooldownUntil && Date.now() < h.cooldownUntil) return false;
  return true;
}

export function snapshot(id: string): ProviderHealthSnapshot {
  const h = ensure(id);
  return { id, score: h.score, cooldownUntil: h.cooldownUntil, successes: h.successes, failures: h.failures };
}

export function reset(id?: string) {
  if (id) map.delete(id);
  else map.clear();
}
