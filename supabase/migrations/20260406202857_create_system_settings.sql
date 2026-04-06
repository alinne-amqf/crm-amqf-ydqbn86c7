CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_name TEXT NOT NULL DEFAULT 'CRM AMQF',
    timezone TEXT NOT NULL DEFAULT 'america-sao_paulo',
    language TEXT NOT NULL DEFAULT 'pt-BR',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one row exists
INSERT INTO public.system_settings (system_name, timezone, language)
SELECT 'CRM AMQF', 'america-sao_paulo', 'pt-BR'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.system_settings;
CREATE POLICY "Enable read access for all authenticated users"
    ON public.system_settings FOR SELECT
    TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
CREATE POLICY "Admins can update system settings"
    ON public.system_settings FOR UPDATE
    TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'::user_role
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'::user_role
        )
    );
