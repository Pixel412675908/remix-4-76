// Tipos centrais do sistema multi-provider do StreamFlix.
// Inspirado em arquiteturas modulares de agregadores (AIOStreams / Stremio)
// — adaptado e reduzido ao mínimo necessário para o nosso caso (embeds web).

import type { Media } from "@/types/media";

export type ContentKind = "movie" | "series" | "anime" | "cartoon" | "live";

export interface ProviderCapabilities {
  movies: boolean;
  series: boolean;
  anime: boolean;
  cartoon: boolean;
  live: boolean;
}

export interface MediaRequest {
  media: Media;
  episode?: { season?: number; number: number } | null;
  /** Língua de áudio preferida (ISO 639-1). */
  preferredAudio?: string;
}

export interface ProviderResolveResult {
  /** URL final pronta para o iframe. */
  url: string;
  /** Headers opcionais (futuro, para players nativos). */
  headers?: Record<string, string>;
}

export interface Provider {
  /** Identificador único e estável. */
  id: string;
  /** Nome de exibição. */
  label: string;
  /** Origem do provider (addon que o registrou). */
  addonId: string;
  /** Prioridade base — menor = mais preferido. */
  priority: number;
  capabilities: ProviderCapabilities;
  /** Constrói a URL embed para uma requisição. Lança se não suportar. */
  resolve: (req: MediaRequest) => ProviderResolveResult;
}

export interface ProviderHealthSnapshot {
  id: string;
  /** Score 0..1 — média móvel exponencial das últimas tentativas. */
  score: number;
  /** Timestamp ms até quando o provider está em cooldown (0 = saudável). */
  cooldownUntil: number;
  /** Total de sucessos / falhas recentes registrados. */
  successes: number;
  failures: number;
}
