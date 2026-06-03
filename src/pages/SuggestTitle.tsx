import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Filme",
  "Série",
  "Anime",
  "Dorama",
  "Novela",
  "Desenho",
  "Documentário",
  "Reality Show",
  "Outro",
];

const SuggestTitle = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || saving) return;
    setSaving(true);
    const { error } = await supabase.from("title_suggestions").insert({
      user_id: user.id,
      email: user.email ?? null,
      title: title.trim().slice(0, 200),
      category,
      note: note.trim().slice(0, 500) || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Sugestão enviada!", description: "Obrigado pela contribuição." });
    setTitle("");
    setNote("");
    setCategory(CATEGORIES[0]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-flix pt-28 md:pt-32 pb-20 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-2">Sugerir Título</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Não encontrou um filme, série ou anime? Sugira e adicionamos ao catálogo.
        </p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Nome do título
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="Ex.: Cidade de Deus"
              className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-white/10 text-white text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-white/10 text-white text-sm outline-none focus:border-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Observação (opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Detalhes adicionais — ano, diretor, plataforma..."
              className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-white/10 text-white text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary-glow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
            {saving ? "Enviando..." : "Enviar Sugestão"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default SuggestTitle;
