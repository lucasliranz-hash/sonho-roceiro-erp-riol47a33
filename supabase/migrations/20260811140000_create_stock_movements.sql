CREATE TABLE IF NOT EXISTS public.farm_stock_movements (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_farm_stock_movements_org
  ON public.farm_stock_movements(organization_id) WHERE deleted_at IS NULL;

ALTER TABLE public.farm_stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS farm_stock_movements_select ON public.farm_stock_movements;
CREATE POLICY farm_stock_movements_select ON public.farm_stock_movements
  FOR SELECT TO authenticated USING (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_stock_movements_insert ON public.farm_stock_movements;
CREATE POLICY farm_stock_movements_insert ON public.farm_stock_movements
  FOR INSERT TO authenticated WITH CHECK (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_stock_movements_update ON public.farm_stock_movements;
CREATE POLICY farm_stock_movements_update ON public.farm_stock_movements
  FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_stock_movements_delete ON public.farm_stock_movements;
CREATE POLICY farm_stock_movements_delete ON public.farm_stock_movements
  FOR DELETE TO authenticated USING (organization_id = public.current_user_org_id());
