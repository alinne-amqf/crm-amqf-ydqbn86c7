CREATE OR REPLACE FUNCTION public.update_opportunity_stage_atomic(
  p_opportunity_id UUID,
  p_new_stage TEXT,
  p_user_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_loss_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_current_stage TEXT;
BEGIN
  -- 1. Obter o estágio atual da oportunidade
  SELECT stage INTO v_current_stage
  FROM public.opportunities
  WHERE id = p_opportunity_id;

  -- 2. Se não existir, lança exceção
  IF NOT FOUND OR v_current_stage IS NULL THEN
    RAISE EXCEPTION 'Opportunity not found' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Idempotência: se já estiver no estágio de destino, retorna sucesso sem alterar nada
  IF v_current_stage = p_new_stage THEN
    RETURN jsonb_build_object(
      'success', true,
      'opportunity_id', p_opportunity_id,
      'previous_stage', v_current_stage,
      'new_stage', p_new_stage,
      'unchanged', true
    );
  END IF;

  -- 4. Atualizar o estágio da oportunidade
  IF p_new_stage = 'Fechado/Perdido' OR p_new_stage = 'Perdido' THEN
    UPDATE public.opportunities
    SET stage = p_new_stage,
        loss_reason = p_loss_reason,
        updated_at = NOW()
    WHERE id = p_opportunity_id;
  ELSE
    UPDATE public.opportunities
    SET stage = p_new_stage,
        loss_reason = NULL,
        updated_at = NOW()
    WHERE id = p_opportunity_id;
  END IF;

  -- 5. Inserir no histórico de estágios
  INSERT INTO public.opportunity_stage_history (
    opportunity_id,
    previous_stage,
    new_stage,
    user_id,
    notes,
    created_at
  ) VALUES (
    p_opportunity_id,
    v_current_stage,
    p_new_stage,
    p_user_id,
    p_notes,
    NOW()
  );

  -- 6. Inserir audit_log se for marcado como Perdido
  IF (p_new_stage = 'Fechado/Perdido' OR p_new_stage = 'Perdido') AND p_loss_reason IS NOT NULL AND p_user_id IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      status
    ) VALUES (
      p_user_id,
      'Oportunidade movida para Perdida. Motivo: ' || p_loss_reason,
      'success'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'opportunity_id', p_opportunity_id,
    'previous_stage', v_current_stage,
    'new_stage', p_new_stage
  );
END;
$$;

-- Permitir execução por usuários autenticados, anon e service_role
GRANT EXECUTE ON FUNCTION public.update_opportunity_stage_atomic(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated, service_role, anon;
