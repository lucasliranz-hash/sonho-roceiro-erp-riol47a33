-- Migration: 20261006154500_create_slaughter_and_link_sale.sql
-- Objetivo:
-- 1. Criar o registro real do abate em farm_slaughterings para o lote L-0003 (Pescoço Pelado, id 'l-1786573301309'):
--    - id: 'sla-1791298889000'
--    - data: '2026-10-04'
--    - quantidade: 1 ave viva
--    - destino: 'Venda'
--    - espécie: 'Caipira' (raça do lote)
--    - custo acumulado do lote: R$ 239.72 (aquisição 190 + ração 34.95 + vacina 14.77) / 11 aves = R$ 21.79 por ave
--    - totalCost: 21.79
--    - unitProductionCost: 21.79
--    - accumulatedProductionCost: 21.79
--    - revenue: 30.00
--    - netProfit: 8.21 (30.00 - 21.79)
--    - saleSimple vinculada à venda 'sal-1791298889479'
-- 2. Atualizar farm_lots para o lote 'l-1786573301309':
--    - currentQuantity reduzida de 11 para 10
-- 3. Atualizar a venda existente 'sal-1791298889479' em farm_sales:
--    - vincular slaughterId: 'sla-1791298889000'
--    - vincular lotId: 'l-1786573301309'
--    - lotName: 'Caipira pescoço pelado'
--    - source_type: 'SLAUGHTER'
--    - source_id: 'sla-1791298889000'
--    - birdType: 'SLAUGHTERED'
--    - unitCost: 21.79
--    - totalCost: 21.79
--    - estimatedProfit: 8.21
--    - estimatedMargin: 27.4
--    - Preservar valor R$ 30, cliente 'Cliente Final', produto 'Frangos abatidos', data '2026-10-04', sem criar nova receita.
-- 4. Registrar movimentação de saída produtiva por Abate em farm_stock_movements para rastreabilidade idempotente.

DO $$
DECLARE
  v_org_id uuid := 'ee9d9c59-c168-451b-8e7e-c4618011cb02'::uuid;
  v_slaughter_id text := 'sla-1791298889000';
  v_sale_id text := 'sal-1791298889479';
  v_lot_id text := 'l-1786573301309';
  v_stock_mov_id text := 'sm-sla-1791298889000';
  v_unit_cost numeric := 21.79;
  v_sale_val numeric := 30.00;
  v_net_profit numeric := 8.21;
  v_slaughter_json jsonb;
  v_sale_json jsonb;
  v_lot_json jsonb;
  v_sm_json jsonb;
BEGIN
  -- 1. Inserir ou atualizar farm_slaughterings
  v_slaughter_json := jsonb_build_object(
    'id', v_slaughter_id,
    'date', '2026-10-04',
    'species', 'Caipira',
    'lotId', v_lot_id,
    'lotName', 'Caipira pescoço pelado',
    'quantityAnimals', 1,
    'destination', 'Venda',
    'unitProductionCost', v_unit_cost,
    'accumulatedProductionCost', v_unit_cost,
    'totalCost', v_unit_cost,
    'slaughterOperationalCost', 0,
    'revenue', v_sale_val,
    'netProfit', v_net_profit,
    'marginPercent', 27.4,
    'notes', 'Abate de 1 frango caipira pescoço pelado para venda comercial.',
    'saleSimple', jsonb_build_object(
      'customerName', 'Cliente Final',
      'saleDate', '2026-10-04',
      'quantitySold', 1,
      'totalValue', v_sale_val,
      'paymentMethod', 'Pix',
      'isPaid', true,
      'financialSaleId', v_sale_id,
      'notes', 'Venda de 1 frango abatido referente ao abate #' || v_slaughter_id
    )
  );

  INSERT INTO public.farm_slaughterings (
    id,
    organization_id,
    data,
    created_at,
    updated_at
  ) VALUES (
    v_slaughter_id,
    v_org_id,
    v_slaughter_json,
    '2026-10-04 12:00:00+00',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET data = EXCLUDED.data,
      updated_at = NOW(),
      deleted_at = NULL;

  -- 2. Atualizar o lote l-1786573301309 para currentQuantity = 10
  SELECT data INTO v_lot_json FROM public.farm_lots WHERE id = v_lot_id;
  IF v_lot_json IS NOT NULL THEN
    v_lot_json := jsonb_set(v_lot_json, '{currentQuantity}', '10'::jsonb);
    UPDATE public.farm_lots
    SET data = v_lot_json,
        updated_at = NOW()
    WHERE id = v_lot_id;
  END IF;

  -- 3. Atualizar a venda existente sal-1791298889479
  SELECT data INTO v_sale_json FROM public.farm_sales WHERE id = v_sale_id;
  IF v_sale_json IS NOT NULL THEN
    v_sale_json := jsonb_set(v_sale_json, '{lotId}', to_jsonb(v_lot_id));
    v_sale_json := jsonb_set(v_sale_json, '{lotName}', '"Caipira pescoço pelado"'::jsonb);
    v_sale_json := jsonb_set(v_sale_json, '{slaughterId}', to_jsonb(v_slaughter_id));
    v_sale_json := jsonb_set(v_sale_json, '{source_type}', '"SLAUGHTER"'::jsonb);
    v_sale_json := jsonb_set(v_sale_json, '{source_id}', to_jsonb(v_slaughter_id));
    v_sale_json := jsonb_set(v_sale_json, '{birdType}', '"SLAUGHTERED"'::jsonb);
    v_sale_json := jsonb_set(v_sale_json, '{unitCost}', to_jsonb(v_unit_cost));
    v_sale_json := jsonb_set(v_sale_json, '{totalCost}', to_jsonb(v_unit_cost));
    v_sale_json := jsonb_set(v_sale_json, '{estimatedProfit}', to_jsonb(v_net_profit));
    v_sale_json := jsonb_set(v_sale_json, '{estimatedMargin}', '27.4'::jsonb);

    UPDATE public.farm_sales
    SET data = v_sale_json,
        updated_at = NOW()
    WHERE id = v_sale_id;
  END IF;

  -- 4. Inserir movimentação em farm_stock_movements para saída produtiva por Abate
  v_sm_json := jsonb_build_object(
    'id', v_stock_mov_id,
    'date', '2026-10-04',
    'inventoryItemId', 'item-abate-aves',
    'inventoryItemName', 'Aves Vivas - Lote L-0003',
    'type', 'saida',
    'movementType', 'Abate',
    'quantity', 1,
    'unit', 'cab',
    'balanceAfter', 10,
    'unitValue', v_unit_cost,
    'totalValue', v_unit_cost,
    'lotId', v_lot_id,
    'lotName', 'Caipira pescoço pelado',
    'notes', 'Saída de 1 ave por abate #' || v_slaughter_id
  );

  INSERT INTO public.farm_stock_movements (
    id,
    organization_id,
    data,
    created_at,
    updated_at
  ) VALUES (
    v_stock_mov_id,
    v_org_id,
    v_sm_json,
    '2026-10-04 12:00:00+00',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET data = EXCLUDED.data,
      updated_at = NOW(),
      deleted_at = NULL;

END $$;
