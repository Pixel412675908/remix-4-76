// Sistema de addons modular do StreamFlix.
// Um addon agrupa providers e/ou catálogos. Pode ser ativado/desativado
// pelo usuário e persiste localmente. Inspirado no modelo do Stremio.

import type { Provider } from "@/lib/providers/types";

export interface Addon {
  id: string;
  name: string;
  version: string;
  description?: string;
  /** true = built-in, não pode ser removido (apenas desabilitado). */
  builtin?: boolean;
  /** Providers que este addon contribui ao registry. */
  providers: Provider[];
}

export interface AddonState {
  id: string;
  enabled: boolean;
}
