DO $BODY$
BEGIN
  CREATE TABLE IF NOT EXISTS public.opportunity_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    previous_stage TEXT NOT NULL,
    new_stage TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
  );

  ALTER TABLE public.opportunity_stage_history ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "authenticated_select" ON public.opportunity_stage_history;
  CREATE POLICY "authenticated_select" ON public.opportunity_stage_history
      FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS "authenticated_insert" ON public.opportunity_stage_history;
  CREATE POLICY "authenticated_insert" ON public.opportunity_stage_history
      FOR INSERT TO authenticated WITH CHECK (true);
END $BODY$;
