-- Adiciona colunas de preferências ao accounts
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS content_filters text[] NOT NULL DEFAULT ARRAY['light']::text[],
  ADD COLUMN IF NOT EXISTS content_types text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS era text NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS discovery text NOT NULL DEFAULT 'mixed',
  ADD COLUMN IF NOT EXISTS continuity boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS recommendations boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS intensity text NOT NULL DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 0;

-- Tabela de uso do modo explorador
CREATE TABLE IF NOT EXISTS public.explorer_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id text NOT NULL,
  media_id integer NOT NULL,
  media_type text NOT NULL,
  episode_number integer,
  seconds_watched integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS explorer_usage_guest_idx ON public.explorer_usage(guest_id);
CREATE INDEX IF NOT EXISTS explorer_usage_guest_media_idx ON public.explorer_usage(guest_id, media_id);

ALTER TABLE public.explorer_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "explorer usage public read"
  ON public.explorer_usage FOR SELECT
  USING (true);

CREATE POLICY "explorer usage public insert"
  ON public.explorer_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "explorer usage public update"
  ON public.explorer_usage FOR UPDATE
  USING (true);

CREATE TRIGGER explorer_usage_touch
  BEFORE UPDATE ON public.explorer_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();