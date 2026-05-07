import { Link } from "react-router-dom";
import { Film, Github, Twitter, Instagram } from "lucide-react";
import { useIsStandalone } from "@/hooks/usePwa";

export const Footer = () => {
  const standalone = useIsStandalone();
  if (standalone) return null;
  return (
  <footer className="border-t border-border bg-background mt-20">
    <div className="container-flix py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="col-span-2 md:col-span-1">
        <Link to="/" className="flex items-center gap-2 mb-4">
          <Film className="h-6 w-6 text-primary" />
          <span className="font-display text-2xl tracking-wider text-primary">
            STREAM<span className="text-foreground">FLIX</span>
          </span>
        </Link>
        <p className="text-sm text-muted-foreground max-w-xs">
          Streaming premium em qualidade cinematográfica. Filmes, séries e exclusivos.
        </p>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-sm">Navegar</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-foreground transition-colors">Início</Link></li>
          <li><Link to="/browse/series" className="hover:text-foreground transition-colors">Séries</Link></li>
          <li><Link to="/browse/movies" className="hover:text-foreground transition-colors">Filmes</Link></li>
          <li><Link to="/my-list" className="hover:text-foreground transition-colors">Minha Lista</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-sm">Conta</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link></li>
          <li><Link to="/signup" className="hover:text-foreground transition-colors">Criar conta</Link></li>
          <li><Link to="/profile" className="hover:text-foreground transition-colors">Perfis</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-sm">Conecte-se</h4>
        <div className="flex gap-3">
          <a href="#" aria-label="Twitter" className="p-2 rounded-full bg-surface-elevated hover:bg-primary transition-colors">
            <Twitter className="h-4 w-4" />
          </a>
          <a href="#" aria-label="Instagram" className="p-2 rounded-full bg-surface-elevated hover:bg-primary transition-colors">
            <Instagram className="h-4 w-4" />
          </a>
          <a href="#" aria-label="GitHub" className="p-2 rounded-full bg-surface-elevated hover:bg-primary transition-colors">
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>

    <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} StreamFlix. Todos os direitos reservados.
    </div>
  </footer>
  );
};

