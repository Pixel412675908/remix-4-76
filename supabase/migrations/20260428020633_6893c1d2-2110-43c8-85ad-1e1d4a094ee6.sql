-- ============ USER SETTINGS ============
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  subtitles_enabled BOOLEAN NOT NULL DEFAULT true,
  subtitles_language TEXT NOT NULL DEFAULT 'pt-BR',
  data_saver BOOLEAN NOT NULL DEFAULT false,
  notifications_new_releases BOOLEAN NOT NULL DEFAULT true,
  notifications_continue_watching BOOLEAN NOT NULL DEFAULT true,
  recommendations_enabled BOOLEAN NOT NULL DEFAULT true,
  watch_history_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own settings select" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own settings insert" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own settings update" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER user_settings_touch
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create settings row when a new account is created
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- ============ SUPPORT TICKETS ============
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug','account','content','suggestion','other')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tickets select" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own tickets insert" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE TRIGGER support_tickets_touch
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);

-- ============ USER DEVICES ============
CREATE TABLE public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  platform TEXT,
  ip_address TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_fingerprint)
);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own devices select" ON public.user_devices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own devices insert" ON public.user_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own devices update" ON public.user_devices
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own devices delete" ON public.user_devices
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_devices_user ON public.user_devices(user_id);