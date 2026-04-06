DO $DO$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alinne@amooquefaco.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'alinne@amooquefaco.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Alinne"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    -- Force the profile to be Admin
    UPDATE public.profiles
    SET role = 'Admin'::user_role
    WHERE id = new_user_id;

    -- Fallback in case the trigger didn't handle it yet
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (new_user_id, 'alinne@amooquefaco.com', 'Alinne', 'Admin'::user_role)
    ON CONFLICT (id) DO UPDATE SET role = 'Admin'::user_role;
  ELSE
    -- Ensure the existing user is an Admin
    UPDATE public.profiles
    SET role = 'Admin'::user_role
    WHERE email = 'alinne@amooquefaco.com';
  END IF;
END $DO$;
