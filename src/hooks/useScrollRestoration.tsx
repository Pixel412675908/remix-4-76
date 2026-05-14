// Restaura scroll ao voltar (POP) e salva ao sair (PUSH/REPLACE).
import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const KEY_PREFIX = "scroll_";

export function useScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType(); // "POP" | "PUSH" | "REPLACE"
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname + location.search;

    // 1) Antes de "sair" da rota anterior, salvar a posição atual quando navegação é PUSH.
    // Usamos prevPath ref para saber qual rota está sendo deixada para trás.
    const handler = () => {
      if (prevPath.current) {
        sessionStorage.setItem(KEY_PREFIX + prevPath.current, String(window.scrollY));
      }
    };
    // Ao mudar rota: este efeito roda DEPOIS — salvamos antes via cleanup do efeito anterior.
    return () => {
      handler();
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (navType === "POP") {
      // Voltando — restaurar
      const saved = sessionStorage.getItem(KEY_PREFIX + path);
      if (saved != null) {
        const y = parseInt(saved, 10) || 0;
        // Aguardar pintura do conteúdo
        requestAnimationFrame(() => {
          window.scrollTo(0, y);
          requestAnimationFrame(() => window.scrollTo(0, y));
        });
        sessionStorage.removeItem(KEY_PREFIX + path);
      }
    } else {
      // Nova navegação — começar do topo
      window.scrollTo(0, 0);
    }
    prevPath.current = path;
  }, [location.pathname, location.search, navType]);
}
