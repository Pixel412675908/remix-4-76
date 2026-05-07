// Detecta se o app está rodando em modo standalone (PWA instalado)
import { useEffect, useState } from "react";

export function useIsStandalone() {
  const [standalone, setStandalone] = useState(() => detect());
  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    const handler = () => setStandalone(detect());
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);
  return standalone;
}

function detect(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari
  // @ts-expect-error - non-standard
  if (window.navigator.standalone === true) return true;
  return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
}
