// Bootstrap do sistema multi-provider.
// Importar este módulo uma única vez registra os providers built-in.

import { registerProvider } from "./registry";
import { vidsrcProvider } from "./builtin/vidsrc";
import { autoembedProvider } from "./builtin/autoembed";
import { twoembedProvider } from "./builtin/twoembed";
import { superembedProvider } from "./builtin/superembed";

let bootstrapped = false;

export function bootstrapProviders() {
  if (bootstrapped) return;
  bootstrapped = true;
  registerProvider(vidsrcProvider);
  registerProvider(autoembedProvider);
  registerProvider(twoembedProvider);
  registerProvider(superembedProvider);
}

// Auto-bootstrap em import (idempotente).
bootstrapProviders();

export * from "./types";
export * from "./registry";
export { reportSuccess, reportFailure, isAvailable, snapshot } from "./health";
