-- 1. Add Column to users Table (profiles)
-- Note: has_accessed was already added in a previous migration, but we ensure it here per instructions.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_accessed BOOLEAN NOT NULL DEFAULT false;

-- 2. Update Trigger for First Login
-- Supabase restricts user-defined triggers on auth.audit_log_entries.
-- As requested, this is documented here: "has_accessed" will be set manually by the application on first successful login.
-- In this project, it is handled via the <MarkAccessed /> component in App.tsx.

-- 3. Update Existing Users
-- For any existing users, set has_accessed = true if they have signed in (last_sign_in_at IS NOT NULL)
DO $DO$
BEGIN
  UPDATE public.profiles p
  SET has_accessed = true
  FROM auth.users u
  WHERE p.id = u.id AND u.last_sign_in_at IS NOT NULL;
END $DO$;
