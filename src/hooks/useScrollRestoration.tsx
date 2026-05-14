// Restaura scroll ao voltar (POP) e salva ao sair (PUSH/REPLACE).
// Funciona em todas as páginas de catálogo e detalhe.
import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const KEY_PREFIX = "scroll_";
const MAX_RETRIES = 60; // ~1s a 16ms por frame

export function useScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType(); // "POP" | "PUSH" | "REPLACE"
  const prevPath = useRef<string | null>(null);

  // Desativa o restore nativo do navegador para termos controle total.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Salva a posição da rota anterior antes de mudar para a nova.
  useEffect(() => {
    return () => {
      if (prevPath.current) {
        sessionStorage.setItem(KEY_PREFIX + prevPath.current, String(window.scrollY));
      }
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (navType === "POP") {
      const saved = sessionStorage.getItem(KEY_PREFIX + path);
      if (saved != null) {
        const targetY = parseInt(saved, 10) || 0;
        let attempts = 0;
        const tryRestore = () => {
          window.scrollTo(0, targetY);
          // Se o conteúdo ainda não cresceu o suficiente, tenta de novo no próximo frame.
          if (Math.abs(window.scrollY - targetY) > 4 && attempts < MAX_RETRIES) {
            attempts += 1;
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
