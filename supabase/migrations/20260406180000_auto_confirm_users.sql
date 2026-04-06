-- Auto-confirm existing users to prevent login blocks
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Create a trigger function to auto-confirm new users upon signup
CREATE OR REPLACE FUNCTION public.auto_confirm_new_users()
RETURNS trigger AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger to auth.users
DROP TRIGGER IF EXISTS auto_confirm_users_trigger ON auth.users;
CREATE TRIGGER auto_confirm_users_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_users();
