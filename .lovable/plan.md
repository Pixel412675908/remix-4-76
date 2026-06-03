## Plano de implementação — StreamFlix (continuação)

Trabalho grande, dividido em 7 frentes. Vou implementar tudo sem quebrar login, cadastro, player, categorias ou TMDB. Design atual (dark, vermelho/branco) mantido.

---

### 1. Banco de dados (migração única)

Nova migração com:

- **`accounts`**: adicionar colunas
  - `adult_password_hash text` (hash bcrypt-like via pgcrypto; nunca recuperável)
  - `is_admin boolean default false`
- **`app_role` enum** (`admin`, `user`) + **`user_roles`** (padrão seguro com `has_role()` security definer). Trigger: ao inserir em `accounts`, se email do auth.users for `musicai49621086@gmail.com` → inserir role admin.
- **`title_suggestions`**: `user_id`, `email`, `title`, `category`, `note`, `created_at`. RLS: usuário insere o seu; admin vê tudo.
- **`empty_searches`**: `term` (normalizado), `user_id`, `email`, `count`, `first_searched_at`, `last_searched_at`. Único por (user_id, term) — incrementa `count` em conflito. RLS: usuário insere/atualiza o seu; admin lê tudo.
- GRANTs explícitos em todas as novas tabelas.

### 2. Senha de conteúdo adulto

- **No cadastro (`AuthForm` signup)**: adicionar etapa extra após senha — "Defina sua senha de conteúdo adulto" com confirmação + aviso "não poderá ser recuperada". Hash client-side com Web Crypto (SHA-256 + salt do user id) e salvo em `accounts.adult_password_hash` logo após signup.
- **Contexto `AdultGateContext`**: estado `unlockedThisSession: boolean`. `requireUnlock()` abre modal centralizado pedindo a senha; valida contra hash; libera só na sessão. Reset no `signOut`.
- **`AdultLockModal`**: dark, vermelho, centralizado, com cadeado.
- **`MediaCard`**: se `media.adult === true` e não desbloqueado → overlay com ícone de cadeado e clique abre modal. Kids: nunca renderiza/abre (já filtrado por `canWatch`).
- Páginas de detalhe (`MovieDetail`, `SeriesDetail`) e Watch: checar gate antes de exibir conteúdo/player.

### 3. Coração de "Minha Lista" no card

- `MediaCard` consome `useMyList()` e renderiza `<Heart fill="white">` no canto superior direito quando o item está salvo. Sem ícone quando não salvo. Atualização instantânea via estado do hook (já reativo). Aplica em todas as páginas porque todas usam `MediaCard`.

### 4. Sugerir Título

- Item "Sugerir Título" no menu de perfil (Navbar dropdown).
- Página `/sugerir-titulo` com form (título, categoria via select, observação opcional) → insere em `title_suggestions` + toast de confirmação.

### 5. Buscas sem resultado

- Em `Search.tsx`, quando a query retornar 0 resultados e tiver ≥3 chars: chamar RPC/upsert em `empty_searches` (debounced; única por user+term, incrementa count). Silencioso para o usuário.

### 6. Categorização asiática (Novelas vs Séries)

- Em `src/lib/tmdb.ts`: na busca de Novelas, incluir doramas românticos coreanos (TMDB `with_origin_country=KR,JP,CN,TW` + `with_genres` Romance/Drama/Soap, excluir Action/Sci-Fi/Horror/Thriller/Crime).
- Em Séries: manter doramas de ação/suspense/terror/ficção (mesma origem, mas gêneros opostos). Sem listas hardcoded de títulos.

### 7. Área Admin

- Detecção: `useAuth` expõe `isAdmin` (consulta `has_role(uid, 'admin')`).
- Item "Admin" no menu de perfil, condicional a `isAdmin`.
- Rota `/admin` protegida (redireciona não-admin). Layout com 3 abas (tabs shadcn):
  1. **Buscas sem resultado** — tabela ordenada por count desc.
  2. **Sugestões** — tabela com filtro por categoria + busca por texto.
  3. **Estatísticas** — cards com totais (users via `accounts` count, suggestions, empty searches, top 10 termos, top 10 sugestões).

---

### Detalhes técnicos

- **Hash de senha adulta**: SHA-256(`${userId}:${password}`) hex — determinístico, não-recuperável, suficiente para gate local (não é segredo de servidor crítico). Comparação no client.
- **Role admin**: trigger em `accounts` insert que checa email via `auth.users` e popula `user_roles`. Backfill imediato para o email alvo se já existir.
- **RLS admin**: políticas usando `public.has_role(auth.uid(), 'admin')` para `SELECT` em `title_suggestions` e `empty_searches`.
- **Tipos TMDB**: campo `adult` já existe em `MediaBase`. Garantir que o mapper de TMDB preserve `adult` real da API.
- **Sem regressões**: nenhuma alteração em `client.ts`, `types.ts`, `VideoPlayer.tsx`, fluxo de auth atual além da etapa extra de signup.

---

### Ordem de execução

1. Migração de banco (aprovação do usuário).
2. Tipos + helpers (`adultPassword.ts`, `AdultGateContext`).
3. Signup com etapa extra.
4. Modal + integração nos cards/detalhes.
5. Coração no `MediaCard`.
6. Sugerir Título (rota + menu).
7. Tracking de buscas vazias.
8. Ajustes TMDB novelas/séries.
9. Painel /admin + role detection.
10. Smoke test final (build).
