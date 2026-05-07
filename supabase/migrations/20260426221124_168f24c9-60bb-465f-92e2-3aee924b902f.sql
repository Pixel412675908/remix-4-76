ALTER TABLE public.profiles
ADD CONSTRAINT profiles_one_profile_per_account UNIQUE (account_id);