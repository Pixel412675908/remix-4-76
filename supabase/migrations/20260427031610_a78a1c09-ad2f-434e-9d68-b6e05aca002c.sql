ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pt-BR';