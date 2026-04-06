CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL DEFAULT 'other',
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_customer_id_idx ON public.tasks(customer_id);
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);

-- RLS Policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tasks select policy" ON public.tasks;
CREATE POLICY "Tasks select policy" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Gerente'))
  );

DROP POLICY IF EXISTS "Tasks insert policy" ON public.tasks;
CREATE POLICY "Tasks insert policy" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Tasks update policy" ON public.tasks;
CREATE POLICY "Tasks update policy" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Gerente'))
  );

DROP POLICY IF EXISTS "Tasks delete policy" ON public.tasks;
CREATE POLICY "Tasks delete policy" ON public.tasks
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Gerente'))
  );
