// Overlay full-screen do StreamWorld — comporta-se como nova "aba" dentro do app.

import { useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useStreamWorld } from "@/hooks/useStreamWorld";

export const StreamWorldOverlay = () => {
  const { isOpen, close, url } = useStreamWorld();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLoaded(false);
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !url) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "black",
        zIndex: 9999,
      }}
    >
      <button
        onClick={close}
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 10000,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderRadius: 999,
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "white",
          fontSize: 14,
        }}
        aria-label="Voltar"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </button>

      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "black",
            zIndex: 1,
          }}
        >
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}

      <iframe
        title="StreamWorld"
        src={url}
        onLoad={() => setLoaded(true)}
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-orientation-lock"
        allow="autoplay; fullscreen; encrypted-media; clipboard-read; clipboard-write"
        allowFullScreen
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
      />
    </div>
  );
};
