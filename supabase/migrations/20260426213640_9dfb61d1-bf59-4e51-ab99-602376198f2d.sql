-- Adiciona níveis de maturidade ao perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS maturity_level text NOT NULL DEFAULT 'adult',
  ADD COLUMN IF NOT EXISTS teen_allow_16 boolean NOT NULL DEFAULT false;

-- Restringir valores válidos
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_maturity_level_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_maturity_level_check
  CHECK (maturity_level IN ('kids', 'teen', 'adult'));

-- Migrar dados existentes
UPDATE public.profiles
SET maturity_level = CASE WHEN is_kid THEN 'kids' ELSE 'adult' END
WHERE maturity_level = 'adult';