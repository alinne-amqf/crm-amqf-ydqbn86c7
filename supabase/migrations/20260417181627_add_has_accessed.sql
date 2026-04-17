ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_accessed BOOLEAN NOT NULL DEFAULT false;

DO $DO$
BEGIN
  UPDATE public.profiles SET has_accessed = true WHERE role = 'Admin';
END $DO$;
