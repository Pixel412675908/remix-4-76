// Página /profile foi consolidada em /settings.
// Mantemos apenas um redirect para evitar quebrar links antigos.

import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const ProfileRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/settings", { replace: true });
  }, [navigate]);
  return <Navigate to="/settings" replace />;
};

export default ProfileRedirect;
