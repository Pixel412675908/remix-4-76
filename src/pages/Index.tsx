// Roteador da raiz: visitantes não logados veem a Landing pública;
// usuários autenticados (ou em modo Explorer) entram na home interna.
import { useAuth } from "@/hooks/useAuth";
import Landing from "./Landing";
import IndexHome from "./IndexHome";

const Index = () => {
  const { user, isExplorer, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }
  if (user || isExplorer) return <IndexHome />;
  return <Landing />;
};

export default Index;
