DO $$
BEGIN
  ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Media';
  ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
END $$;

DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
