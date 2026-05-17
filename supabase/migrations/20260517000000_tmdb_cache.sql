CREATE TABLE IF NOT EXISTS public.tmdb_cache (
  cache_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tmdb_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tmdb cache public read" ON public.tmdb_cache;
DROP POLICY IF EXISTS "tmdb cache public write" ON public.tmdb_cache;

CREATE POLICY "tmdb cache public read" ON public.tmdb_cache
  FOR SELECT TO anon, authenticated USING (expires_at > now());

CREATE POLICY "tmdb cache public write" ON public.tmdb_cache
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "tmdb cache public update" ON public.tmdb_cache
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_tmdb_cache_expires_at ON public.tmdb_cache(expires_at);
