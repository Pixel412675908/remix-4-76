ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS autoplay_next boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS resume_playback boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS skip_intro_auto boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS skip_intro_seconds integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS performance_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discovery_mode boolean NOT NULL DEFAULT false;