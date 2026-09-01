-- Migration: Create farm_vaccination_sessions table and RLS policies
-- Date: 2026-09-01

CREATE TABLE IF NOT EXISTS public.farm_vaccination_sessions (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- Index for soft delete queries scoped by organization
CREATE INDEX IF NOT EXISTS idx_farm_vaccination_sessions_org
  ON public.farm_vaccination_sessions (organization_id)
  WHERE deleted_at IS NULL;

-- Triggers for updated_at and deleted_by
DROP TRIGGER IF EXISTS update_farm_vaccination_sessions_updated_at ON public.farm_vaccination_sessions;
CREATE TRIGGER update_farm_vaccination_sessions_updated_at
  BEFORE UPDATE ON public.farm_vaccination_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_farm_vaccination_sessions_deleted_by ON public.farm_vaccination_sessions;
CREATE TRIGGER set_farm_vaccination_sessions_deleted_by
  BEFORE UPDATE ON public.farm_vaccination_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_deleted_by();

-- Enable RLS
ALTER TABLE public.farm_vaccination_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS farm_vaccination_sessions_select ON public.farm_vaccination_sessions;
CREATE POLICY farm_vaccination_sessions_select ON public.farm_vaccination_sessions
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_vaccination_sessions_insert ON public.farm_vaccination_sessions;
CREATE POLICY farm_vaccination_sessions_insert ON public.farm_vaccination_sessions
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_vaccination_sessions_update ON public.farm_vaccination_sessions;
CREATE POLICY farm_vaccination_sessions_update ON public.farm_vaccination_sessions
  FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_vaccination_sessions_delete ON public.farm_vaccination_sessions;
CREATE POLICY farm_vaccination_sessions_delete ON public.farm_vaccination_sessions
  FOR DELETE TO authenticated
  USING (organization_id = public.current_user_org_id());

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
