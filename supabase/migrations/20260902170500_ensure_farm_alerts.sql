-- Migration: Ensure farm_alerts table, indexing and RLS consistency for SR Gestão alerts system
-- Date: 2026-09-02

CREATE TABLE IF NOT EXISTS public.farm_alerts (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_farm_alerts_org ON public.farm_alerts(organization_id) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE public.farm_alerts ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS policies org-scoped
DROP POLICY IF EXISTS farm_alerts_select ON public.farm_alerts;
CREATE POLICY farm_alerts_select ON public.farm_alerts
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_alerts_insert ON public.farm_alerts;
CREATE POLICY farm_alerts_insert ON public.farm_alerts
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_alerts_update ON public.farm_alerts;
CREATE POLICY farm_alerts_update ON public.farm_alerts
  FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_alerts_delete ON public.farm_alerts;
CREATE POLICY farm_alerts_delete ON public.farm_alerts
  FOR DELETE TO authenticated
  USING (organization_id = public.current_user_org_id());

-- Triggers
DROP TRIGGER IF EXISTS farm_alerts_set_deleted_by ON public.farm_alerts;
CREATE TRIGGER farm_alerts_set_deleted_by
  BEFORE UPDATE ON public.farm_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_deleted_by();

NOTIFY pgrst, 'reload schema';
