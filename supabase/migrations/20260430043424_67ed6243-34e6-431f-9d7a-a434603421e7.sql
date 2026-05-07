-- 1. Adicionar avatar_url em accounts (display_name e language já existem)
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Criar nova tabela my_list_v2 ligada à conta
CREATE TABLE IF NOT EXISTS public.my_list_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL,
  media_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (account_id, media_id)
);

ALTER TABLE public.my_list_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own list v2 select" ON public.my_list_v2
  FOR SELECT USING (auth.uid() = account_id);
CREATE POLICY "own list v2 insert" ON public.my_list_v2
  FOR INSERT WITH CHECK (auth.uid() = account_id);
CREATE POLICY "own list v2 delete" ON public.my_list_v2
  FOR DELETE USING (auth.uid() = account_id);

-- 3. Migrar dados: pegar lista do perfil ATIVO de cada conta (ou primeiro perfil se nenhum ativo)
INSERT INTO public.my_list_v2 (account_id, media_id, created_at)
SELECT DISTINCT ON (p.account_id, ml.media_id)
  p.account_id, ml.media_id, ml.created_at
FROM public.my_list ml
JOIN public.profiles p ON p.id = ml.profile_id
ORDER BY p.account_id, ml.media_id, p.is_active DESC, p.created_at ASC
ON CONFLICT (account_id, media_id) DO NOTHING;

-- 4. Migrar avatar do perfil ativo para a conta (se conta ainda não tiver)
UPDATE public.accounts a
SET avatar_url = p.avatar_url
FROM public.profiles p
WHERE p.account_id = a.id
  AND p.is_active = true
  AND a.avatar_url IS NULL
  AND p.avatar_url IS NOT NULL;

-- 5. Dropar tabela antiga my_list e renomear v2
DROP TABLE public.my_list;
ALTER TABLE public.my_list_v2 RENAME TO my_list;

-- 6. Dropar tabela profiles
DROP TABLE public.profiles;