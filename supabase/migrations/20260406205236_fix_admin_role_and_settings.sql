DO $$
BEGIN
  -- Set all users to Ativo if they are not already
  UPDATE public.profiles
  SET status = 'Ativo'
  WHERE status IS NULL;

  -- Ensure alinne is an Admin
  UPDATE public.profiles
  SET role = 'Admin'::public.user_role
  WHERE email = 'alinne@amooquefaco.com';

  -- Seed system_settings if empty
  IF NOT EXISTS (SELECT 1 FROM public.system_settings) THEN
    INSERT INTO public.system_settings (system_name, timezone, language)
    VALUES ('CRM AMQF', 'america-sao_paulo', 'pt-BR');
  END IF;
END $$;
