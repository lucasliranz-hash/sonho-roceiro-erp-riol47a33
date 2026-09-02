-- Migration: Fix Newcastle Vaccination Data (One-Time Idempotent Transactional Fix)
-- Description: Reconcile Newcastle vaccination session, 5 lot applications, inventory 100 doses deduction, soft-delete 9 duplicate tests.

DO $$
DECLARE
  v_org_id UUID;
  v_property_id TEXT := 'e90f0297-36d0-4c70-ac69-ce13b779133e';
  v_activity_id TEXT := 'act-1787173152879';
  v_inv_id TEXT := 'inv-1787668664848';
  v_session_id TEXT;
  v_stock_movement_id TEXT;
  v_existing_session_id TEXT;
  v_existing_movement_id TEXT;
  v_inv_data JSONB;
BEGIN
  -- 1. Obter organization_id do item de estoque ou do lote
  SELECT organization_id INTO v_org_id
  FROM public.farm_inventory
  WHERE id = v_inv_id;

  IF v_org_id IS NULL THEN
    SELECT organization_id INTO v_org_id
    FROM public.farm_lots
    WHERE id = 'l-1786493661836';
  END IF;

  -- 2. Soft-delete dos 9 registros de teste programados duplicados
  UPDATE public.farm_vaccinations
  SET deleted_at = COALESCE(deleted_at, NOW()),
      updated_at = NOW()
  WHERE id IN (
    'vac-1787667479317',
    'vac-1787666406572',
    'vac-1787666379686',
    'vac-1787665293819',
    'vac-1787664915431',
    'vac-1787664625997',
    'vac-1787664610627',
    'vac-1787663704845',
    'vac-1787662791976'
  );

  -- 3. Identificar ou criar a sessão em farm_vaccination_sessions (idempotente)
  SELECT id INTO v_existing_session_id
  FROM public.farm_vaccination_sessions
  WHERE deleted_at IS NULL
    AND (
      data->>'inventory_item_id' = v_inv_id
      OR data->>'vaccine_name' ILIKE '%newcastle%'
    )
    AND data->>'session_date' = '2026-09-01'
  LIMIT 1;

  IF v_existing_session_id IS NOT NULL THEN
    v_session_id := v_existing_session_id;
  ELSE
    v_session_id := 'session-1788281743000';
  END IF;

  INSERT INTO public.farm_vaccination_sessions (id, organization_id, data, created_at, updated_at, deleted_at)
  VALUES (
    v_session_id,
    v_org_id,
    jsonb_build_object(
      'id', v_session_id,
      'organization_id', v_org_id,
      'property_id', v_property_id,
      'activity_id', v_activity_id,
      'session_date', '2026-09-01',
      'vaccine_name', 'NewCastle',
      'inventory_item_id', v_inv_id,
      'inventory_item_name', 'NewCastle',
      'manufacturer_batch', 'lote 0008/25',
      'expiration_date', '2026-08-25',
      'vial_capacity', 100,
      'initial_quantity', 100,
      'vial_cost', 65,
      'unit_cost', 0.65,
      'opened_at', '08:00',
      'responsible', 'Lucas',
      'vial_destiny', 'discarded',
      'total_applied', 22,
      'total_discarded', 78,
      'total_downloaded', 100,
      'total_cost', 65,
      'status', 'completed',
      'notes', 'Sessão Vacinal Newcastle La Sota (Frasco 100 doses). Abertura única, 22 aves vacinadas nos 5 lotes ativos (1 dose/ave, 0,03 mL/dose via ocular). Sobra de 78 doses descartada (perda técnica). Custo total R$ 65,00 rateado proporcionalmente.',
      'applications', jsonb_build_array(
        jsonb_build_object('lot_id', 'l-1786493661836', 'lotName', 'Caipira', 'animal_count', 5, 'dose_per_animal', 1, 'volume_per_dose', 0.03, 'volume_unit', 'mL', 'doses_applied', 5, 'total_volume', 0.15, 'cost', 14.77, 'notes', 'Rateio 5/22 (R$ 14,77)'),
        jsonb_build_object('lot_id', 'l-1786493773590', 'lotName', 'Podedeira', 'animal_count', 5, 'dose_per_animal', 1, 'volume_per_dose', 0.03, 'volume_unit', 'mL', 'doses_applied', 5, 'total_volume', 0.15, 'cost', 14.77, 'notes', 'Rateio 5/22 (R$ 14,77)'),
        jsonb_build_object('lot_id', 'l-1786573301309', 'lotName', 'Caipira pescoço pelado', 'animal_count', 5, 'dose_per_animal', 1, 'volume_per_dose', 0.03, 'volume_unit', 'mL', 'doses_applied', 5, 'total_volume', 0.15, 'cost', 14.77, 'notes', 'Rateio 5/22 (R$ 14,77)'),
        jsonb_build_object('lot_id', 'l-1786573405524', 'lotName', 'Label Ruje ', 'animal_count', 3, 'dose_per_animal', 1, 'volume_per_dose', 0.03, 'volume_unit', 'mL', 'doses_applied', 3, 'total_volume', 0.09, 'cost', 8.86, 'notes', 'Rateio 3/22 (R$ 8,86)'),
        jsonb_build_object('lot_id', 'l-1787621594708', 'lotName', 'Indio Gigante I-001', 'animal_count', 4, 'dose_per_animal', 1, 'volume_per_dose', 0.03, 'volume_unit', 'mL', 'doses_applied', 4, 'total_volume', 0.12, 'cost', 11.83, 'notes', 'Rateio 4/22 com ajuste centavos (R$ 11,83)')
      )
    ),
    NOW(),
    NOW(),
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    data = EXCLUDED.data,
    deleted_at = NULL,
    updated_at = NOW();

  -- 4. Atualizar registro 1 existente (Indio Gigante I-001): vac-1787667497202
  UPDATE public.farm_vaccinations
  SET
    deleted_at = NULL,
    updated_at = NOW(),
    data = jsonb_build_object(
      'id', 'vac-1787667497202',
      'organization_id', v_org_id,
      'property_id', v_property_id,
      'activity_id', v_activity_id,
      'lot_id', 'l-1787621594708',
      'lotName', 'Indio Gigante I-001',
      'vaccine_name', 'NewCastle',
      'disease_target', 'Sessão Vacinal / Frasco Multidose',
      'scheduled_date', '2026-08-28',
      'performed_date', '2026-09-01',
      'animal_count', 4,
      'dose_per_animal', 1,
      'dose_unit', 'dose',
      'volume_per_dose', 0.03,
      'volume_unit', 'mL',
      'application_route', 'ocular',
      'responsible', 'Lucas',
      'inventory_item_id', v_inv_id,
      'inventory_item_name', 'NewCastle',
      'batch_number', 'lote 0008/25',
      'expiration_date', '2026-08-25',
      'quantity_used', 4,
      'doses_applied', 4,
      'doses_discarded', 14.18,
      'total_downloaded', 18.18,
      'unit_cost', 0.65,
      'total_cost', 11.83,
      'stock_deducted', true,
      'vial_status', 'discarded',
      'vial_destiny', 'discarded',
      'discarded_quantity', 14.18,
      'waste_cost', 9.23,
      'session_id', v_session_id,
      'status', 'performed',
      'notes', 'Sessão Vacinal Newcastle (Frasco 100 doses). Destino da sobra: Descarte/Perda Técnica. Custo rateado: R$ 11.83.'
    )
  WHERE id = 'vac-1787667497202';

  -- 5. Atualizar registro 2 existente (Label Ruje): vac-1788281743735
  UPDATE public.farm_vaccinations
  SET
    deleted_at = NULL,
    updated_at = NOW(),
    data = jsonb_build_object(
      'id', 'vac-1788281743735',
      'organization_id', v_org_id,
      'property_id', v_property_id,
      'activity_id', v_activity_id,
      'lot_id', 'l-1786573405524',
      'lotName', 'Label Ruje ',
      'vaccine_name', 'NewCastle',
      'disease_target', 'Sessão Vacinal / Frasco Multidose',
      'scheduled_date', '2026-09-01',
      'performed_date', '2026-09-01',
      'animal_count', 3,
      'dose_per_animal', 1,
      'dose_unit', 'dose',
      'volume_per_dose', 0.03,
      'volume_unit', 'mL',
      'application_route', 'ocular',
      'responsible', 'Lucas',
      'inventory_item_id', v_inv_id,
      'inventory_item_name', 'NewCastle',
      'batch_number', 'lote 0008/25',
      'expiration_date', '2026-08-25',
      'quantity_used', 3,
      'doses_applied', 3,
      'doses_discarded', 10.64,
      'total_downloaded', 13.64,
      'unit_cost', 0.65,
      'total_cost', 8.86,
      'stock_deducted', true,
      'vial_status', 'discarded',
      'vial_destiny', 'discarded',
      'discarded_quantity', 10.64,
      'waste_cost', 6.92,
      'session_id', v_session_id,
      'status', 'performed',
      'notes', 'Sessão Vacinal Newcastle (Frasco 100 doses). Destino da sobra: Descarte/Perda Técnica. Custo rateado: R$ 8.86.'
    )
  WHERE id = 'vac-1788281743735';

  -- 6. Inserir ou atualizar Registro 3 (Caipira - L-0001)
  INSERT INTO public.farm_vaccinations (id, organization_id, data, created_at, updated_at, deleted_at)
  VALUES (
    'vac-newcastle-l-0001',
    v_org_id,
    jsonb_build_object(
      'id', 'vac-newcastle-l-0001',
      'organization_id', v_org_id,
      'property_id', v_property_id,
      'activity_id', v_activity_id,
      'lot_id', 'l-1786493661836',
      'lotName', 'Caipira',
      'vaccine_name', 'NewCastle',
      'disease_target', 'Sessão Vacinal / Frasco Multidose',
      'scheduled_date', '2026-09-01',
      'performed_date', '2026-09-01',
      'animal_count', 5,
      'dose_per_animal', 1,
      'dose_unit', 'dose',
      'volume_per_dose', 0.03,
      'volume_unit', 'mL',
      'application_route', 'ocular',
      'responsible', 'Lucas',
      'inventory_item_id', v_inv_id,
      'inventory_item_name', 'NewCastle',
      'batch_number', 'lote 0008/25',
      'expiration_date', '2026-08-25',
      'quantity_used', 5,
      'doses_applied', 5,
      'doses_discarded', 17.73,
      'total_downloaded', 22.73,
      'unit_cost', 0.65,
      'total_cost', 14.77,
      'stock_deducted', true,
      'vial_status', 'discarded',
      'vial_destiny', 'discarded',
      'discarded_quantity', 17.73,
      'waste_cost', 11.53,
      'session_id', v_session_id,
      'status', 'performed',
      'notes', 'Sessão Vacinal Newcastle (Frasco 100 doses). Destino da sobra: Descarte/Perda Técnica. Custo rateado: R$ 14.77.'
    ),
    NOW(),
    NOW(),
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    data = EXCLUDED.data,
    deleted_at = NULL,
    updated_at = NOW();

  -- 7. Inserir ou atualizar Registro 4 (Podedeira - L-0002)
  INSERT INTO public.farm_vaccinations (id, organization_id, data, created_at, updated_at, deleted_at)
  VALUES (
    'vac-newcastle-l-0002',
    v_org_id,
    jsonb_build_object(
      'id', 'vac-newcastle-l-0002',
      'organization_id', v_org_id,
      'property_id', v_property_id,
      'activity_id', v_activity_id,
      'lot_id', 'l-1786493773590',
      'lotName', 'Podedeira',
      'vaccine_name', 'NewCastle',
      'disease_target', 'Sessão Vacinal / Frasco Multidose',
      'scheduled_date', '2026-09-01',
      'performed_date', '2026-09-01',
      'animal_count', 5,
      'dose_per_animal', 1,
      'dose_unit', 'dose',
      'volume_per_dose', 0.03,
      'volume_unit', 'mL',
      'application_route', 'ocular',
      'responsible', 'Lucas',
      'inventory_item_id', v_inv_id,
      'inventory_item_name', 'NewCastle',
      'batch_number', 'lote 0008/25',
      'expiration_date', '2026-08-25',
      'quantity_used', 5,
      'doses_applied', 5,
      'doses_discarded', 17.73,
      'total_downloaded', 22.73,
      'unit_cost', 0.65,
      'total_cost', 14.77,
      'stock_deducted', true,
      'vial_status', 'discarded',
      'vial_destiny', 'discarded',
      'discarded_quantity', 17.73,
      'waste_cost', 11.53,
      'session_id', v_session_id,
      'status', 'performed',
      'notes', 'Sessão Vacinal Newcastle (Frasco 100 doses). Destino da sobra: Descarte/Perda Técnica. Custo rateado: R$ 14.77.'
    ),
    NOW(),
    NOW(),
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    data = EXCLUDED.data,
    deleted_at = NULL,
    updated_at = NOW();

  -- 8. Inserir ou atualizar Registro 5 (Caipira pescoço pelado - L-0003)
  INSERT INTO public.farm_vaccinations (id, organization_id, data, created_at, updated_at, deleted_at)
  VALUES (
    'vac-newcastle-l-0003',
    v_org_id,
    jsonb_build_object(
      'id', 'vac-newcastle-l-0003',
      'organization_id', v_org_id,
      'property_id', v_property_id,
      'activity_id', v_activity_id,
      'lot_id', 'l-1786573301309',
      'lotName', 'Caipira pescoço pelado',
      'vaccine_name', 'NewCastle',
      'disease_target', 'Sessão Vacinal / Frasco Multidose',
      'scheduled_date', '2026-09-01',
      'performed_date', '2026-09-01',
      'animal_count', 5,
      'dose_per_animal', 1,
      'dose_unit', 'dose',
      'volume_per_dose', 0.03,
      'volume_unit', 'mL',
      'application_route', 'ocular',
      'responsible', 'Lucas',
      'inventory_item_id', v_inv_id,
      'inventory_item_name', 'NewCastle',
      'batch_number', 'lote 0008/25',
      'expiration_date', '2026-08-25',
      'quantity_used', 5,
      'doses_applied', 5,
      'doses_discarded', 17.73,
      'total_downloaded', 22.73,
      'unit_cost', 0.65,
      'total_cost', 14.77,
      'stock_deducted', true,
      'vial_status', 'discarded',
      'vial_destiny', 'discarded',
      'discarded_quantity', 17.73,
      'waste_cost', 11.53,
      'session_id', v_session_id,
      'status', 'performed',
      'notes', 'Sessão Vacinal Newcastle (Frasco 100 doses). Destino da sobra: Descarte/Perda Técnica. Custo rateado: R$ 14.77.'
    ),
    NOW(),
    NOW(),
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    data = EXCLUDED.data,
    deleted_at = NULL,
    updated_at = NOW();

  -- 9. Estoque: Movimentação única de saída de 100 doses (Consumo)
  SELECT id INTO v_existing_movement_id
  FROM public.farm_stock_movements
  WHERE deleted_at IS NULL
    AND (
      data->>'inventoryItemId' = v_inv_id
      OR data->>'inventory_item_id' = v_inv_id
      OR data->>'itemId' = v_inv_id
    )
    AND data->>'type' = 'saida'
    AND data->>'date' = '2026-09-01'
  LIMIT 1;

  IF v_existing_movement_id IS NOT NULL THEN
    v_stock_movement_id := v_existing_movement_id;
  ELSE
    v_stock_movement_id := 'mov-newcastle-session-100';
  END IF;

  INSERT INTO public.farm_stock_movements (id, organization_id, data, created_at, updated_at, deleted_at)
  VALUES (
    v_stock_movement_id,
    v_org_id,
    jsonb_build_object(
      'id', v_stock_movement_id,
      'organization_id', v_org_id,
      'property_id', v_property_id,
      'inventoryItemId', v_inv_id,
      'inventory_item_id', v_inv_id,
      'inventoryItemName', 'NewCastle',
      'type', 'saida',
      'movementType', 'Consumo',
      'quantity', 100,
      'unit', 'dose',
      'balanceAfter', 0,
      'unitValue', 0.65,
      'totalValue', 65.00,
      'date', '2026-09-01',
      'notes', 'Sessão Vacinal: NewCastle. Frasco 100 doses (Sobra Descartada). Lotes: Caipira: 5d, Podedeira: 5d, Caipira pescoço pelado: 5d, Label Ruje: 3d, Indio Gigante I-001: 4d. Total aplicado: 22 doses, Perda: 78 doses.',
      'generateExpense', false
    ),
    NOW(),
    NOW(),
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    data = EXCLUDED.data,
    deleted_at = NULL,
    updated_at = NOW();

  -- 10. Atualizar currentStock do item para 0
  SELECT data INTO v_inv_data
  FROM public.farm_inventory
  WHERE id = v_inv_id;

  IF v_inv_data IS NOT NULL THEN
    v_inv_data := v_inv_data || jsonb_build_object(
      'currentStock', 0,
      'lastUpdated', '2026-09-01'
    );

    UPDATE public.farm_inventory
    SET
      data = v_inv_data,
      updated_at = NOW()
    WHERE id = v_inv_id;
  END IF;

END $$;
