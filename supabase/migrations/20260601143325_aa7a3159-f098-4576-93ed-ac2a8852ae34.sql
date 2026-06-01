
-- ===== accounts =====
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'adult',
  allow_adult BOOLEAN NOT NULL DEFAULT false,
  allow_explicit BOOLEAN NOT NULL DEFAULT false,
  favorite_genres TEXT[] NOT NULL DEFAULT '{}',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  content_filters TEXT[] NOT NULL DEFAULT '{}',
  content_types TEXT[] NOT NULL DEFAULT '{}',
  format TEXT NOT NULL DEFAULT 'both',
  era TEXT NOT NULL DEFAULT 'both',
  language TEXT NOT NULL DEFAULT 'pt-BR',
  origin TEXT NOT NULL DEFAULT 'both',
  discovery TEXT NOT NULL DEFAULT 'mixed',
  continuity BOOLEAN NOT NULL DEFAULT true,
  recommendations BOOLEAN NOT NULL DEFAULT true,
  intensity TEXT NOT NULL DEFAULT 'moderate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own account select" ON public.accounts
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own account insert" ON public.accounts
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own account update" ON public.accounts
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own account delete" ON public.accounts
  FOR DELETE TO authenticated USING (id = auth.uid());

-- Trigger: cria a conta automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.accounts (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== my_list =====
CREATE TABLE IF NOT EXISTS public.my_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  media_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, media_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_list TO authenticated;
GRANT ALL ON public.my_list TO service_role;

ALTER TABLE public.my_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own list select" ON public.my_list
  FOR SELECT TO authenticated USING (account_id = auth.uid());
CREATE POLICY "own list insert" ON public.my_list
  FOR INSERT TO authenticated WITH CHECK (account_id = auth.uid());
CREATE POLICY "own list delete" ON public.my_list
  FOR DELETE TO authenticated USING (account_id = auth.uid());

-- ===== explorer_usage =====
CREATE TABLE IF NOT EXISTS public.explorer_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id TEXT NOT NULL,
  media_id BIGINT NOT NULL,
  media_type TEXT NOT NULL,
  episode_number INTEGER,
  seconds_watched INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_explorer_usage_lookup
  ON public.explorer_usage(guest_id, media_id, media_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.explorer_usage TO anon, authenticated;
GRANT ALL ON public.explorer_usage TO service_role;

ALTER TABLE public.explorer_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "explorer public read" ON public.explorer_usage
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "explorer public insert" ON public.explorer_usage
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "explorer public update" ON public.explorer_usage
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ===== tmdb_cache =====
CREATE TABLE IF NOT EXISTS public.tmdb_cache (
  cache_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tmdb_cache_expires_at ON public.tmdb_cache(expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tmdb_cache TO anon, authenticated;
GRANT ALL ON public.tmdb_cache TO service_role;

ALTER TABLE public.tmdb_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tmdb cache public read" ON public.tmdb_cache
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tmdb cache public insert" ON public.tmdb_cache
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "tmdb cache public update" ON public.tmdb_cache
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
