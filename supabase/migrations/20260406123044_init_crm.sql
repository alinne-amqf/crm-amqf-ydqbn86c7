DO $$
BEGIN
  -- 1. Create tables
  CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    status TEXT NOT NULL DEFAULT 'Lead',
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- 2. Enable RLS
  ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

  -- 3. Drop existing policies if any
  DROP POLICY IF EXISTS "Users can manage their own customers" ON public.customers;
  DROP POLICY IF EXISTS "Users can manage their own interactions" ON public.interactions;

  -- 4. Create policies
  CREATE POLICY "Users can manage their own customers" ON public.customers
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can manage their own interactions" ON public.interactions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;

-- Seed Data
DO $$
DECLARE
  seed_user_id UUID;
  customer_1_id UUID;
  customer_2_id UUID;
BEGIN
  -- Seed User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alinne@amooquefaco.com') THEN
    seed_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      seed_user_id, '00000000-0000-0000-0000-000000000000', 'alinne@amooquefaco.com',
      crypt('Skip@Pass123', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}', '{"name": "Alinne"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    -- Seed Customers
    customer_1_id := gen_random_uuid();
    INSERT INTO public.customers (id, user_id, name, email, phone, company, status, avatar)
    VALUES 
      (customer_1_id, seed_user_id, 'João Silva', 'joao.silva@exemplo.com', '(11) 98765-4321', 'Tech Solutions', 'Ativo', 'https://img.usecurling.com/ppl/thumbnail?seed=123');
      
    customer_2_id := gen_random_uuid();
    INSERT INTO public.customers (id, user_id, name, email, phone, company, status, avatar)
    VALUES 
      (customer_2_id, seed_user_id, 'Maria Oliveira', 'maria.oliveira@empresa.com.br', '(21) 99876-5432', 'Marketing Pro', 'Lead', 'https://img.usecurling.com/ppl/thumbnail?seed=456');

    -- Seed Interactions
    INSERT INTO public.interactions (customer_id, user_id, type, date, description)
    VALUES 
      (customer_1_id, seed_user_id, 'email', NOW() - INTERVAL '2 days', 'Enviei proposta comercial atualizada.'),
      (customer_1_id, seed_user_id, 'call', NOW() - INTERVAL '1 day', 'Cliente confirmou recebimento e pediu para ligar amanhã.'),
      (customer_2_id, seed_user_id, 'meeting', NOW() - INTERVAL '5 days', 'Reunião de alinhamento inicial. Apresentei o sistema.');

  END IF;
END $$;
