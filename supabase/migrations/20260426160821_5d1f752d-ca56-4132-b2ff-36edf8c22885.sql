
-- ACCOUNTS: dados extras da conta auth.users
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'adult' CHECK (account_type IN ('adult','kids')),
  allow_adult BOOLEAN NOT NULL DEFAULT false,
  favorite_genres TEXT[] NOT NULL DEFAULT '{}',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own account select" ON public.accounts FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own account insert" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own account update" ON public.accounts FOR UPDATE USING (auth.uid() = id);

-- PROFILES: múltiplos perfis por conta
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_kid BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_profiles_account ON public.profiles(account_id);

CREATE POLICY "own profiles select" ON public.profiles FOR SELECT USING (auth.uid() = account_id);
CREATE POLICY "own profiles insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = account_id);
CREATE POLICY "own profiles update" ON public.profiles FOR UPDATE USING (auth.uid() = account_id);
CREATE POLICY "own profiles delete" ON public.profiles FOR DELETE USING (auth.uid() = account_id);

-- MY_LIST: salvar títulos por perfil
CREATE TABLE public.my_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, media_id)
);
ALTER TABLE public.my_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own list select" ON public.my_list FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.account_id = auth.uid()));
CREATE POLICY "own list insert" ON public.my_list FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.account_id = auth.uid()));
CREATE POLICY "own list delete" ON public.my_list FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.account_id = auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_accounts_updated BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create account on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.accounts (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket para avatares
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars own upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars own update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars own delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
