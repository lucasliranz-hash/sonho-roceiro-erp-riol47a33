DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'farm_activities', 'farm_lots', 'farm_structures', 'farm_expenses',
    'farm_inventory', 'farm_feed_consumption', 'farm_weighings', 'farm_mortality',
    'farm_egg_production', 'farm_incubations', 'farm_candlings', 'farm_energy',
    'farm_animals', 'farm_matings', 'farm_sales', 'farm_customers',
    'farm_suppliers', 'farm_assets', 'farm_alerts'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS public.%I (
        id TEXT PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT ''{}''::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )', tbl
    );
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_org ON public.%I(organization_id) WHERE deleted_at IS NULL', tbl, tbl);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_select', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (organization_id = public.current_user_org_id())', tbl || '_select', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (organization_id = public.current_user_org_id())', tbl || '_insert', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_update', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (organization_id = public.current_user_org_id()) WITH CHECK (organization_id = public.current_user_org_id())', tbl || '_update', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_delete', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (organization_id = public.current_user_org_id())', tbl || '_delete', tbl);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.update_farm_record(
  p_table_name TEXT,
  p_id TEXT,
  p_updates JSONB
) RETURNS void AS $$
BEGIN
  EXECUTE format(
    'UPDATE public.%I SET data = COALESCE(data, ''{}''::jsonb) || $1, updated_at = NOW() WHERE id = $2 AND organization_id = public.current_user_org_id() AND deleted_at IS NULL',
    p_table_name
  ) USING p_updates, p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
