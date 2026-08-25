-- Migration: Create sanity (sanidade) tables and policies
-- Applies farm_vaccinations, farm_treatments, farm_health_occurrences, farm_health_protocols, farm_protocol_assignments
-- Force schema cache reload and ensure tables exist for sanity module
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'farm_vaccinations',
    'farm_treatments',
    'farm_health_occurrences',
    'farm_health_protocols',
    'farm_protocol_assignments'
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
        deleted_at TIMESTAMPTZ,
        deleted_by UUID
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

    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', tbl || '_set_deleted_by', tbl);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_deleted_by()', tbl || '_set_deleted_by', tbl);
  END LOOP;

  -- Force PostgREST schema cache reload
  NOTIFY pgrst, 'reload schema';
END $$;
