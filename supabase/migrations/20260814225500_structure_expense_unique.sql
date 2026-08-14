-- BUG 2: impedir duplicidade de transações financeiras geradas por Estrutura.
-- Cada registro de Estrutura deve gerar UMA E SOMENTE UMA transação financeira
-- (source_type = 'STRUCTURE' + source_id = ID da estrutura) entre os registros ativos.

-- 1) Saneamento de duplicados existentes: para cada (source_type, source_id)
--    com mais de uma transação ativa, mantemos a MAIS ANTIGA (legítima) e
--    aplicamos soft-delete nas demais. Antes de alterar, registramos auditoria.
DO $$
DECLARE
  dup_row RECORD;
  keep_id text;
BEGIN
  FOR dup_row IN
    SELECT (e.data->>'source_type') AS source_type,
           (e.data->>'source_id')   AS source_id
    FROM public.farm_expenses e
    WHERE e.deleted_at IS NULL
      AND e.data->>'source_type' IS NOT NULL
      AND e.data->>'source_id' IS NOT NULL
      AND e.data->>'source_id' <> ''
    GROUP BY (e.data->>'source_type'), (e.data->>'source_id')
    HAVING count(*) > 1
  LOOP
    -- Mantém a transação mais antiga (legítima), remove as duplicadas mais novas.
    SELECT id INTO keep_id
    FROM public.farm_expenses
    WHERE deleted_at IS NULL
      AND data->>'source_type' = dup_row.source_type
      AND data->>'source_id'   = dup_row.source_id
    ORDER BY created_at ASC
    LIMIT 1;

    -- Auditoria das duplicadas que serão removidas (soft-delete).
    INSERT INTO public.audit_logs (
      organization_id, user_id, action, entity_type, entity_id, old_data, new_data
    )
    SELECT
      e.organization_id,
      NULL,
      'DELETE',
      'farm_expenses',
      e.id,
      e.data,
      jsonb_build_object('reason', 'duplicate_structure_expense_cleanup', 'kept', keep_id)
    FROM public.farm_expenses e
    WHERE e.deleted_at IS NULL
      AND e.id <> keep_id
      AND e.data->>'source_type' = dup_row.source_type
      AND e.data->>'source_id'   = dup_row.source_id;

    -- Soft-delete das duplicadas.
    UPDATE public.farm_expenses
    SET deleted_at = now(),
        updated_at = now()
    WHERE deleted_at IS NULL
      AND id <> keep_id
      AND data->>'source_type' = dup_row.source_type
      AND data->>'source_id'   = dup_row.source_id;
  END LOOP;
END $$;

-- 2) Índice único parcial: impede, no banco, mais de uma transação ativa para
--    a mesma combinação (source_type, source_id). Soft-deletes (deleted_at NOT NULL)
--    ficam de fora, então é seguro recriar/excluir/recriar registros.
--    Apenas aplica quando ambos os campos existem e não estão vazios.
CREATE UNIQUE INDEX IF NOT EXISTS uq_farm_expenses_active_source
  ON public.farm_expenses (
    (data->>'source_type'),
    (data->>'source_id')
  )
  WHERE deleted_at IS NULL
    AND data->>'source_type' IS NOT NULL
    AND data->>'source_id' IS NOT NULL
    AND data->>'source_type' <> ''
    AND data->>'source_id' <> '';
