
-- ============ 1. accounts: senha adulta ============
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS adult_password_hash text;

-- ============ 2. Roles ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user can read own roles" ON public.user_roles;
CREATE POLICY "user can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger: ao criar conta, se email for o admin alvo, atribui role admin
CREATE OR REPLACE FUNCTION public.assign_admin_on_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
  IF v_email = 'musicai49621086@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_admin_on_account_trg ON public.accounts;
CREATE TRIGGER assign_admin_on_account_trg
AFTER INSERT ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.assign_admin_on_account();

-- Backfill: se já existir o usuário admin, atribuir
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE email = 'musicai49621086@gmail.com'
ON CONFLICT DO NOTHING;

-- ============ 3. title_suggestions ============
CREATE TABLE IF NOT EXISTS public.title_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  title text NOT NULL,
  category text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.title_suggestions TO authenticated;
GRANT ALL ON public.title_suggestions TO service_role;

ALTER TABLE public.title_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own suggestions insert" ON public.title_suggestions;
CREATE POLICY "own suggestions insert" ON public.title_suggestions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own suggestions select" ON public.title_suggestions;
CREATE POLICY "own suggestions select" ON public.title_suggestions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============ 4. empty_searches ============
CREATE TABLE IF NOT EXISTS public.empty_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  term text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  first_searched_at timestamptz NOT NULL DEFAULT now(),
  last_searched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, term)
);

GRANT SELECT, INSERT, UPDATE ON public.empty_searches TO authenticated;
GRANT ALL ON public.empty_searches TO service_role;

ALTER TABLE public.empty_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own empty insert" ON public.empty_searches;
CREATE POLICY "own empty insert" ON public.empty_searches
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own empty update" ON public.empty_searches;
CREATE POLICY "own empty update" ON public.empty_searches
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own empty select" ON public.empty_searches;
CREATE POLICY "own empty select" ON public.empty_searches
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Função RPC para upsert+increment do termo vazio (evita race)
CREATE OR REPLACE FUNCTION public.record_empty_search(_term text, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.empty_searches (user_id, email, term)
  VALUES (auth.uid(), _email, _term)
  ON CONFLICT (user_id, term)
  DO UPDATE SET count = public.empty_searches.count + 1,
                last_searched_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_empty_search(text, text) TO authenticated;
