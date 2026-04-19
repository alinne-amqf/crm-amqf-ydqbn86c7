DO $$
BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_login_pending BOOLEAN NOT NULL DEFAULT true;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

UPDATE public.profiles SET first_login_pending = false WHERE first_login_pending = true;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  invited_role public.user_role;
BEGIN
  BEGIN
    invited_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    invited_role := 'Vendedor'::public.user_role;
  END;

  IF invited_role IS NULL THEN
    invited_role := 'Vendedor'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, name, role, first_login_pending)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 
    invited_role,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;
