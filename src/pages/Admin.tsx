import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Search, Lightbulb, BarChart3 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmptySearchRow {
  id: string;
  term: string;
  count: number;
  email: string | null;
  last_searched_at: string;
}
interface SuggestionRow {
  id: string;
  title: string;
  category: string;
  note: string | null;
  email: string | null;
  created_at: string;
}

const Admin = () => {
  const { user, isAdmin, loading, profileLoading } = useAuth();
  const navigate = useNavigate();

  const [empties, setEmpties] = useState<EmptySearchRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [stats, setStats] = useState({ users: 0, suggestions: 0, empties: 0 });
  const [filter, setFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (!isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin, loading, profileLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: e }, { data: s }, { count: uc }] = await Promise.all([
        supabase
          .from("empty_searches")
          .select("id, term, count, email, last_searched_at")
          .order("count", { ascending: false })
          .limit(500),
        supabase
          .from("title_suggestions")
          .select("id, title, category, note, email, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("accounts").select("id", { count: "exact", head: true }),
      ]);
      setEmpties((e ?? []) as EmptySearchRow[]);
      setSuggestions((s ?? []) as SuggestionRow[]);
      setStats({
        users: uc ?? 0,
        suggestions: (s ?? []).length,
        empties: (e ?? []).reduce((acc, r) => acc + (r.count || 0), 0),
      });
    })();
  }, [isAdmin]);

  const fSuggestions = suggestions.filter(
    (s) =>
      (!filter || s.title.toLowerCase().includes(filter.toLowerCase())) &&
      (!catFilter || s.category === catFilter)
  );
  const categories = Array.from(new Set(suggestions.map((s) => s.category)));

  const topTerms = [...empties].slice(0, 10);
  const topSuggested = Object.entries(
    suggestions.reduce<Record<string, number>>((acc, s) => {
      acc[s.title] = (acc[s.title] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground text-sm">
        Verificando permissões...
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-flix pt-28 md:pt-32 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl tracking-wide">Admin</h1>
        </div>

        <Tabs defaultValue="empty" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="empty" className="gap-2"><Search className="h-4 w-4" /> Buscas sem resultado</TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2"><Lightbulb className="h-4 w-4" /> Sugestões</TabsTrigger>
            <TabsTrigger value="stats" className="gap-2"><BarChart3 className="h-4 w-4" /> Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="empty">
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">Termo</th>
                    <th className="text-left px-4 py-3">Buscas</th>
                    <th className="text-left px-4 py-3">Usuário</th>
                    <th className="text-left px-4 py-3">Último</th>
                  </tr>
                </thead>
                <tbody>
                  {empties.map((r) => (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="px-4 py-3 font-medium">{r.term}</td>
                      <td className="px-4 py-3 text-primary font-bold">{r.count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.email ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(r.last_searched_at).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                  {empties.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum registro.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="suggestions">
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                placeholder="Buscar título..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-surface-elevated border border-white/10 text-sm outline-none focus:border-primary"
              />
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-surface-elevated border border-white/10 text-sm outline-none"
              >
                <option value="">Todas as categorias</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">Título</th>
                    <th className="text-left px-4 py-3">Categoria</th>
                    <th className="text-left px-4 py-3">Observação</th>
                    <th className="text-left px-4 py-3">Usuário</th>
                    <th className="text-left px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {fSuggestions.map((r) => (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="px-4 py-3 font-medium">{r.title}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs">{r.category}</span></td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{r.note ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.email ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                  {fSuggestions.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma sugestão.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label="Usuários" value={stats.users} />
              <StatCard label="Sugestões" value={stats.suggestions} />
              <StatCard label="Buscas sem resultado" value={stats.empties} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RankList title="Top termos buscados sem resultado" items={topTerms.map((t) => [t.term, t.count])} />
              <RankList title="Top títulos sugeridos" items={topSuggested} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-white/10 bg-surface-elevated p-5">
    <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    <div className="text-3xl font-bold text-primary mt-2">{value}</div>
  </div>
);

const RankList = ({ title, items }: { title: string; items: [string, number][] }) => (
  <div className="rounded-xl border border-white/10 bg-surface-elevated p-5">
    <h3 className="font-semibold mb-3">{title}</h3>
    {items.length === 0 ? (
      <p className="text-sm text-muted-foreground">Sem dados.</p>
    ) : (
      <ol className="space-y-2">
        {items.map(([t, c], i) => (
          <li key={`${t}-${i}`} className="flex items-center justify-between text-sm">
            <span className="truncate"><span className="text-muted-foreground mr-2">{i + 1}.</span>{t}</span>
            <span className="text-primary font-bold ml-2">{c}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

export default Admin;
