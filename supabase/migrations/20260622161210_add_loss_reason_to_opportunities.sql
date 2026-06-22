DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'opportunities' 
    AND column_name = 'loss_reason'
  ) THEN
    ALTER TABLE public.opportunities ADD COLUMN loss_reason TEXT;
  END IF;
END $$;
