DO $$
BEGIN
  -- 1. Create table
  CREATE TABLE IF NOT EXISTS public.change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- 2. Enable RLS
  ALTER TABLE public.change_logs ENABLE ROW LEVEL SECURITY;

  -- 3. RLS Policies
  DROP POLICY IF EXISTS "allow_select_change_logs" ON public.change_logs;
  CREATE POLICY "allow_select_change_logs" ON public.change_logs
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('Admin'::public.user_role, 'Gerente'::public.user_role)
      )
    );

  DROP POLICY IF EXISTS "allow_insert_change_logs" ON public.change_logs;
  CREATE POLICY "allow_insert_change_logs" ON public.change_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

END $$;

-- 4. Create trigger function
CREATE OR REPLACE FUNCTION public.fn_log_change()
RETURNS trigger AS $$
DECLARE
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
  v_record_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_record_id := OLD.id;
  END IF;

  INSERT INTO public.change_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    v_old_data,
    v_new_data,
    auth.uid()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach triggers
DROP TRIGGER IF EXISTS audit_customers_trigger ON public.customers;
CREATE TRIGGER audit_customers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_change();

DROP TRIGGER IF EXISTS audit_opportunities_trigger ON public.opportunities;
CREATE TRIGGER audit_opportunities_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_change();

DROP TRIGGER IF EXISTS audit_interactions_trigger ON public.interactions;
CREATE TRIGGER audit_interactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_change();

DROP TRIGGER IF EXISTS audit_tasks_trigger ON public.tasks;
CREATE TRIGGER audit_tasks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_change();
