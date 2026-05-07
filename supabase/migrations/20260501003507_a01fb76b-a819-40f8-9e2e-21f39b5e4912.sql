
CREATE TABLE public.watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id integer NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('movie', 'tv')),
  episode_number integer,
  seconds_watched integer NOT NULL DEFAULT 0,
  progress_pct integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  last_opened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id, media_type, episode_number)
);

CREATE INDEX idx_watch_history_user_recent ON public.watch_history (user_id, last_opened_at DESC);

ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own watch_history select" ON public.watch_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own watch_history insert" ON public.watch_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own watch_history update" ON public.watch_history
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own watch_history delete" ON public.watch_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER touch_watch_history
  BEFORE UPDATE ON public.watch_history
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
