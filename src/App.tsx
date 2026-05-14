import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { I18nProvider } from "@/lib/i18n";
import { UserAvatarProvider } from "@/contexts/UserAvatarContext";
import { ReactNode } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import RecoverPassword from "./pages/RecoverPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import SeriesDetail from "./pages/SeriesDetail.tsx";
import MovieDetail from "./pages/MovieDetail.tsx";
import MyList from "./pages/MyList.tsx";
import Search from "./pages/Search.tsx";
import Browse from "./pages/Browse.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";
import Animes from "./pages/Animes.tsx";
import Novelas from "./pages/Novelas.tsx";
import Desenhos from "./pages/Desenhos.tsx";
import EmBreve from "./pages/EmBreve.tsx";
import Colecoes from "./pages/Colecoes.tsx";
import CollectionDetail from "./pages/CollectionDetail.tsx";

import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { useCatalogCountsLogger } from "@/hooks/useCatalogCountsLogger";

const queryClient = new QueryClient();

function GlobalEffects() {
  useScrollRestoration();
  useCatalogCountsLogger();
  return null;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isExplorer, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }
  if (!user && !isExplorer) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RedirectAuthed({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <UserAvatarProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<RedirectAuthed><Login /></RedirectAuthed>} />
                <Route path="/signup" element={<RedirectAuthed><Signup /></RedirectAuthed>} />
                <Route path="/cadastro" element={<RedirectAuthed><Signup /></RedirectAuthed>} />
                <Route path="/recuperar-senha" element={<RecoverPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/series/:id" element={<RequireAuth><SeriesDetail /></RequireAuth>} />
                <Route path="/movie/:id" element={<RequireAuth><MovieDetail /></RequireAuth>} />
                <Route path="/browse/:category" element={<RequireAuth><Browse /></RequireAuth>} />
                <Route path="/my-list" element={<RequireAuth><MyList /></RequireAuth>} />
                <Route path="/animes" element={<RequireAuth><Animes /></RequireAuth>} />
                <Route path="/novelas" element={<RequireAuth><Novelas /></RequireAuth>} />
                <Route path="/desenhos" element={<RequireAuth><Desenhos /></RequireAuth>} />
                <Route path="/em-breve" element={<RequireAuth><EmBreve /></RequireAuth>} />
                <Route path="/colecoes" element={<RequireAuth><Colecoes /></RequireAuth>} />
                <Route path="/colecoes/:collection_id" element={<RequireAuth><CollectionDetail /></RequireAuth>} />
                <Route path="/search" element={<RequireAuth><Search /></RequireAuth>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </UserAvatarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
