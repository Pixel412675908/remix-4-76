// Botão "Voltar" fixo, usado nas telas de conteúdo (detalhes/player).

import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: 50,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 999,
        padding: "12px 18px 12px 14px",
        minHeight: 44,
        minWidth: 44,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid rgba(255,255,255,0.08)",
        color: "white",
        fontSize: 14,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
      aria-label="Voltar"
      className="hover:bg-black/80 transition-colors"
    >
      <ChevronLeft className="h-[18px] w-[18px]" />
      Voltar
    </button>
  );
};
