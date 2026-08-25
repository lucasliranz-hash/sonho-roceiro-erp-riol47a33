-- Migração pontual para corrigir custo de ração inserido por saco ao invés de por kg
-- 1. Corrige farm_inventory para "Ração inicial 20kg" (ou itens de ração cujo averageCost corresponde ao preço do saco)
-- averageCost = 69.90 / 20 = 3.4950

DO $$
DECLARE
  rec RECORD;
  v_pkg_weight NUMERIC;
  v_avg_cost NUMERIC;
  v_new_avg_cost NUMERIC;
BEGIN
  -- 1. Atualiza farm_inventory onde name é 'Ração inicial 20kg' ou onde packageWeight = 20 e averageCost = 69.90
  FOR rec IN 
    SELECT id, data
    FROM public.farm_inventory
    WHERE deleted_at IS NULL
      AND (
        (data->>'name') ILIKE '%Ração inicial 20kg%'
        OR (data->>'name' ILIKE '%Ração inicial%' AND (data->>'averageCost')::numeric >= 60)
        OR ((data->>'packageWeight')::numeric = 20 AND (data->>'averageCost')::numeric = 69.90)
      )
  LOOP
    v_pkg_weight := COALESCE(NULLIF((rec.data->>'packageWeight')::numeric, 0), 20);
    v_avg_cost := (rec.data->>'averageCost')::numeric;
    v_new_avg_cost := ROUND(v_avg_cost / v_pkg_weight, 4);

    -- Atualiza item do estoque
    UPDATE public.farm_inventory
    SET data = data || jsonb_build_object('averageCost', v_new_avg_cost),
        updated_at = NOW()
    WHERE id = rec.id;

    -- 2. Atualiza todos os consumos vinculados a este item de estoque (sem recordType='purchase')
    UPDATE public.farm_feed_consumption
    SET data = data || jsonb_build_object(
          'costPerKg', v_new_avg_cost,
          'totalCost', ROUND(((data->>'quantityKg')::numeric * v_new_avg_cost), 2)
        ),
        updated_at = NOW()
    WHERE deleted_at IS NULL
      AND (data->>'inventoryItemId') = rec.id
      AND (data->>'recordType' IS NULL OR data->>'recordType' != 'purchase');
  END LOOP;
END $$;
