UPDATE public.farm_expenses
SET data = COALESCE(data, '{}'::jsonb) || jsonb_build_object('source_type', 'MANUAL'),
    updated_at = NOW()
WHERE NOT (COALESCE(data, '{}'::jsonb) ? 'source_type');

UPDATE public.farm_sales
SET data = COALESCE(data, '{}'::jsonb) || jsonb_build_object('source_type', 'SALE'),
    updated_at = NOW()
WHERE NOT (COALESCE(data, '{}'::jsonb) ? 'source_type');
