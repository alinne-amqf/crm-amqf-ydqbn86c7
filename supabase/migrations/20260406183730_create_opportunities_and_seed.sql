CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  stage TEXT NOT NULL,
  expected_close_date DATE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Opportunities select policy" ON public.opportunities;
CREATE POLICY "Opportunities select policy" ON public.opportunities
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Gerente')
    )
  );

DROP POLICY IF EXISTS "Opportunities insert policy" ON public.opportunities;
CREATE POLICY "Opportunities insert policy" ON public.opportunities
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Opportunities update policy" ON public.opportunities;
CREATE POLICY "Opportunities update policy" ON public.opportunities
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Gerente')
    )
  );

DROP POLICY IF EXISTS "Opportunities delete policy" ON public.opportunities;
CREATE POLICY "Opportunities delete policy" ON public.opportunities
  FOR DELETE TO authenticated USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Gerente')
    )
  );

-- Seed Data (Idempotent)
DO $$
DECLARE
  v_user_id uuid;
  v_customer_id uuid;
BEGIN
  -- 1. Garante que exista um usuário admin para logar e usar o CRM
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alinne@amooquefaco.com') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'alinne@amooquefaco.com',
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Alinne"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'alinne@amooquefaco.com' LIMIT 1;
  END IF;

  -- Garante perfil
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (v_user_id, 'alinne@amooquefaco.com', 'Alinne', 'Admin')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Garante que exista pelo menos um cliente para vincular as oportunidades
  IF NOT EXISTS (SELECT 1 FROM public.customers LIMIT 1) THEN
    v_customer_id := gen_random_uuid();
    INSERT INTO public.customers (id, user_id, name, email, customer_type, status)
    VALUES (v_customer_id, v_user_id, 'Empresa Parceira B2B', 'parceiro@empresa.com', 'B2B', 'Ativo');
  ELSE
    SELECT id INTO v_customer_id FROM public.customers LIMIT 1;
  END IF;

  -- 3. Cria oportunidades mockadas associadas ao cliente real criado acima
  IF NOT EXISTS (SELECT 1 FROM public.opportunities LIMIT 1) THEN
    INSERT INTO public.opportunities (title, estimated_value, stage, customer_id, user_id)
    VALUES
      ('Consultoria de Processos', 15000, 'Prospecção', v_customer_id, v_user_id),
      ('Implementação de Software CRM', 35000, 'Proposta', v_customer_id, v_user_id),
      ('Renovação de Contrato Anual', 12000, 'Negociação', v_customer_id, v_user_id);
  END IF;
END $$;
