CREATE TABLE IF NOT EXISTS public.invitation_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE public.invitation_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage invitation tokens" ON public.invitation_tokens;
CREATE POLICY "Admins can manage invitation tokens" ON public.invitation_tokens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'::user_role
    )
  );
