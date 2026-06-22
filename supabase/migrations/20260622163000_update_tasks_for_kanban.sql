-- Re-assert policies to ensure authenticated users can insert and select
DROP POLICY IF EXISTS "Tasks insert policy" ON public.tasks;
CREATE POLICY "Tasks insert policy" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Tasks select policy" ON public.tasks;
CREATE POLICY "Tasks select policy" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'Gerente'))
  );
