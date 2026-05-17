// Restaura scroll ao voltar (POP) e salva ao sair (PUSH/REPLACE).
// Funciona em todas as páginas de catálogo e detalhe.
import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const KEY_PREFIX = "scroll_";
const MAX_WAIT_MS = 15000; // espera listas infinitas grandes crescerem

export function useScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Salva continuamente a posição da rota atual (não só no unmount),
  // assim o valor mais recente está sempre disponível para POP.
  useEffect(() => {
    const path = location.pathname + location.search;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        sessionStorage.setItem(KEY_PREFIX + path, String(window.scrollY));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      // garante o último valor salvo no momento da troca de rota
      sessionStorage.setItem(KEY_PREFIX + path, String(window.scrollY));
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (navType === "POP") {
      const saved = sessionStorage.getItem(KEY_PREFIX + path);
      if (saved != null) {
        const targetY = parseInt(saved, 10) || 0;
        const start = performance.now();
        const tryRestore = () => {
          const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
          // Espera o conteúdo crescer o suficiente para alcançar o targetY.
          if (maxScrollable + window.innerHeight < targetY && performance.now() - start < MAX_WAIT_MS) {
            requestAnimationFrame(tryRestore);
            return;
          }
          window.scrollTo(0, Math.min(targetY, maxScrollable));
          if (Math.abs(window.scrollY - Math.min(targetY, maxScrollable)) > 4 && performance.now() - start < MAX_WAIT_MS) {
            requestAnimationFrame(tryRestore);
          } else {
            sessionStorage.removeItem(KEY_PREFIX + path);
          }
        };
        requestAnimationFrame(tryRestore);
      }
    } else {
      window.scrollTo(0, 0);
    }
    prevPath.current = path;
  }, [location.pathname, location.search, navType]);
}
