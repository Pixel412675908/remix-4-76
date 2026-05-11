// Bootstrap dos addons built-in.
import { vidsrcProvider } from "@/lib/providers/builtin/vidsrc";
import { autoembedProvider } from "@/lib/providers/builtin/autoembed";
import { twoembedProvider } from "@/lib/providers/builtin/twoembed";
import { superembedProvider } from "@/lib/providers/builtin/superembed";
import { registerAddon } from "./registry";
import type { Addon } from "./types";

const coreAddon: Addon = {
  id: "core",
  name: "StreamFlix Core",
  version: "1.0.0",
  description: "Provedores de embed padrão (VidSrc, AutoEmbed, 2Embed, Superembed) com fallback automático.",
  builtin: true,
  providers: [vidsrcProvider, autoembedProvider, twoembedProvider, superembedProvider],
};

let bootstrapped = false;
export function bootstrapAddons() {
  if (bootstrapped) return;
  bootstrapped = true;
  registerAddon(coreAddon);
}

bootstrapAddons();

export * from "./types";
export * from "./registry";
