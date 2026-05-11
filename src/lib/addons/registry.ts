// Registry de addons. Persiste estado (enabled/disabled) em localStorage.
// Ao habilitar/desabilitar, propaga para o registry de providers.

import {
  registerProvider,
  setProviderEnabled,
  unregisterProvider,
} from "@/lib/providers/registry";
import type { Addon, AddonState } from "./types";

const STORAGE_KEY = "streamflix:addons-v1";
const addons = new Map<string, Addon>();

function loadStates(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AddonState[];
    return Object.fromEntries(parsed.map((s) => [s.id, s.enabled]));
  } catch {
    return {};
  }
}

function saveStates() {
  try {
    const out: AddonState[] = [...addons.values()].map((a) => ({
      id: a.id,
      enabled: !disabled.has(a.id),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch {
    /* ignore */
  }
}

const disabled = new Set<string>();

export function registerAddon(addon: Addon) {
  addons.set(addon.id, addon);
  const states = loadStates();
  const enabled = states[addon.id] ?? true;
  if (!enabled) disabled.add(addon.id);
  for (const p of addon.providers) {
    registerProvider(p);
    setProviderEnabled(p.id, enabled);
  }
  saveStates();
}

export function setAddonEnabled(id: string, enabled: boolean) {
  const addon = addons.get(id);
  if (!addon) return;
  if (enabled) disabled.delete(id);
  else disabled.add(id);
  for (const p of addon.providers) setProviderEnabled(p.id, enabled);
  saveStates();
}

export function isAddonEnabled(id: string) {
  return addons.has(id) && !disabled.has(id);
}

export function listAddons(): Addon[] {
  return [...addons.values()];
}

export function removeAddon(id: string) {
  const addon = addons.get(id);
  if (!addon || addon.builtin) return;
  for (const p of addon.providers) unregisterProvider(p.id);
  addons.delete(id);
  disabled.delete(id);
  saveStates();
}
