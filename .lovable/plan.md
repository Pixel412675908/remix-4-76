## Refatoração Final — StreamFlix nível Netflix/Disney+

Plano completo baseado no diagnóstico que você confirmou + referências visuais Netflix mobile enviadas.

---

### 1. Migração de banco — personalização do cartão

Adicionar à tabela `profiles`:
- `card_color text default '#E50914'` — cor do cartão de login salvo, escolhida pelo usuário

---

### 2. Auto-confirm de email (resolve "tela preta após cadastro")

Configurar Supabase Auth com `email_confirm: false` para que `signUp` crie sessão imediata. Sem isso, o `Onboarding.tsx` redireciona de volta a `/signup` porque `!user`.

---

### 3. Login 1-clique de verdade — `src/components/AuthForm.tsx`

Reescrever o fluxo:

- **Ao montar**: se `supabase.auth.getSession()` retorna sessão válida → redireciona automaticamente para `/profile`. Usuário nem vê a tela de login.
- **Sem sessão**: mostra os cartões salvos (avatar circular, nome, cor personalizada).
- **Clique no cartão**: tenta `refreshSession()` silenciosamente.
  - Sucesso → entra direto, sem campo de senha.
  - Falha (refresh token expirado) → expande **apenas** o input de senha daquele cartão, com toast discreto "Sessão expirada, digite sua senha".
- **Botão "Entrar com outra conta"** sempre visível → abre formulário manual completo (email + senha).
- Não pré-preencher email no card selecionado (a identidade já está no card).

---

### 4. Cadastro silencioso → Onboarding

- Remover o toast "Conta criada com sucesso!" do `AuthForm`.
- Após `signUp` OK → navegar direto para `/onboarding` sem celebração.
- Único toast de sucesso permanece **ao final das 11 etapas** do onboarding ("Conta personalizada com sucesso!").

---

### 5. Cards de conta salva — visual premium estilo Netflix

- `rounded-2xl` (fim do quadradão).
- Avatar `rounded-full` com borda fina na cor do card.
- Fundo: gradiente sutil `from-{cardColor}/15 via-surface to-surface` + borda `border border-{cardColor}/30`.
- Hover: `scale-[1.02]` + sombra `shadow-2xl`.
- Botão "X" para remover: opacity-0, aparece em hover.

---

### 6. Personalizar cor do cartão — `src/pages/Profile.tsx`

No editor de perfil, adicionar paleta de 8 cores predefinidas:
- `#E50914` Netflix Red (default)
- `#1E88E5` Azul
- `#43A047` Verde
- `#8E24AA` Roxo
- `#FB8C00` Laranja
- `#EC407A` Rosa
- `#FFB300` Dourado
- `#00ACC1` Ciano

Salva em `profiles.card_color`. `savedAccounts.ts` passa a guardar `cardColor` junto com email/nome/avatar.

---

### 7. Paleta global mais sóbria — `src/index.css`

- `--primary`: `357 99% 45%` (vermelho Netflix exato `#E50914`).
- Reduzir `primary-glow` em fundos amplos — vermelho fica só em CTAs principais (botão Entrar, logo, perfil ativo, badge "TOP 10").
- Substituir vermelhos decorativos por `surface-elevated` e cinzas neutros.

---

### 8. Logo responsivo — `src/components/Logo.tsx`

- Tracking adaptativo: `tracking-[0.12em] md:tracking-[0.18em]`.
- Tamanhos menores: `sm: text-base md:text-lg`, `md: text-lg md:text-xl`, `lg: text-2xl md:text-3xl`.
- `whitespace-nowrap` para nunca quebrar "STREAMFLIX".

---

### 9. Remover rodapé do app inteiro

Remover `<Footer />` + import de:
- `src/pages/Index.tsx`
- `src/pages/Browse.tsx`
- `src/pages/MyList.tsx`
- `src/pages/MovieDetail.tsx`
- `src/pages/SeriesDetail.tsx`
- `src/pages/Search.tsx`
- `src/pages/Profile.tsx`

Manter o arquivo `Footer.tsx` no projeto (não deletar, caso volte a ser útil).

---

### 10. PWA instalável (sem service worker)

Conforme regra interna do Lovable — só manifest, sem SW (evita problemas no preview).

- `public/manifest.webmanifest`:
  ```json
  {
    "name": "StreamFlix",
    "short_name": "StreamFlix",
    "display": "standalone",
    "background_color": "#0b0b0b",
    "theme_color": "#0b0b0b",
    "start_url": "/",
    "scope": "/",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
- Gerar `public/icon-192.png` e `public/icon-512.png` (logo branco/vermelho sobre fundo `#0b0b0b`).
- `index.html`: `<link rel="manifest" href="/manifest.webmanifest">`, `<meta name="theme-color" content="#0b0b0b">`, `<link rel="apple-touch-icon" href="/icon-192.png">`.

Resultado: usuário pode "Adicionar à tela inicial" no Android/iOS e abrir como app standalone.

---

### 11. Polimento visual login/cadastro (referência: screenshots Netflix)

- **Background**: gradiente radial escuro do centro para preto profundo + textura noise SVG sutil + vinheta nas bordas.
- **Card central**: `backdrop-blur-2xl`, borda `border border-white/5`, sombra em camadas `shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]`.
- **Inputs**: `rounded-xl`, foco com `ring-1 ring-primary/40`, fundo `bg-white/5`.
- **Botão Entrar**: gradiente `from-[#E50914] to-[#B00710]`, `rounded-xl`, hover `scale-[1.01]`.
- **Tipografia**: títulos `text-2xl md:text-3xl` (atual `text-3xl md:text-4xl` é grande demais no mobile).
- Espaçamento mais generoso entre elementos, hierarquia visual clara.

---

### Fora do escopo desta etapa

- **Stripe / planos pagos** — você disse "futuramente", deixo para próxima rodada.
- **Service worker / offline** — PWA agora é só instalável (manifest), sem cache offline.

---

### Resultado esperado

✅ Cartão salvo → 1 clique entra direto (se sessão válida); só pede senha se expirou de verdade
✅ Cadastro insere nome/email/senha → vai direto ao onboarding sem toast prematuro → toast só ao concluir 11 etapas
✅ Cards arredondados, coloridos, cor personalizável por usuário
✅ Sem rodapé em lugar nenhum
✅ Logo "STREAMFLIX" nunca corta
✅ App instalável como PWA no celular/desktop
✅ Login com profundidade visual, textura, identidade própria — não parece IA genérico

---

## Arquitetura Multi-Provider + Addons (em produção)

Inspirada em AIOStreams, Stremio Web e Stremio Addons List — extraído **só o essencial**, sem copiar branding nem código pesado.

```
src/lib/providers/
  types.ts         — Provider, MediaRequest, capabilities, health snapshot
  registry.ts      — register/list/candidatesFor — ordena por (saúde, prioridade, score)
  health.ts        — EWMA + cooldown 5min (blacklist suave) + reportSuccess/Failure
  builtin/
    vidsrc.ts      — priority 10
    autoembed.ts   — priority 20
    twoembed.ts    — priority 30
    superembed.ts  — priority 40
  index.ts         — bootstrap idempotente

src/lib/addons/
  types.ts         — Addon { id, name, version, providers[], builtin }
  registry.ts      — registerAddon/setAddonEnabled persiste em localStorage
  index.ts         — registra "core" addon com os 4 builtins
```

- `src/lib/streamProviders.ts` virou fachada fina sobre o registry — `VideoPlayer` continua funcionando sem mudança de API.
- O player agora reporta `markHealthy()` quando o iframe carrega, alimentando o EWMA do health tracker.
- Adicionar um novo provedor = criar um arquivo em `providers/builtin/` e registrar via `registerProvider()` ou empacotar num novo `Addon`.
- Próximo passo natural: UI em `Settings` para listar/ativar addons e providers individualmente.
