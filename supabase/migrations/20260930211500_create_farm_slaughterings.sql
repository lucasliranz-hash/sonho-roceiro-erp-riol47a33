-- Migration: Create farm_slaughterings table and RLS policies
-- Date: 2026-09-30
-- Description: Tabela para registro de abates integrados com produção, estoque, custos e financeiro

CREATE TABLE IF NOT EXISTS public.farm_slaughterings (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- Index para soft-delete e RLS por organização
CREATE INDEX IF NOT EXISTS idx_farm_slaughterings_org
  ON public.farm_slaughterings (organization_id)
  WHERE deleted_at IS NULL;

-- Triggers para updated_at e deleted_by
DROP TRIGGER IF EXISTS update_farm_slaughterings_updated_at ON public.farm_slaughterings;
CREATE TRIGGER update_farm_slaughterings_updated_at
  BEFORE UPDATE ON public.farm_slaughterings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_farm_slaughterings_deleted_by ON public.farm_slaughterings;
CREATE TRIGGER set_farm_slaughterings_deleted_by
  BEFORE UPDATE ON public.farm_slaughterings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_deleted_by();

-- Habilitar RLS
ALTER TABLE public.farm_slaughterings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS com verificação de organization_id
DROP POLICY IF EXISTS farm_slaughterings_select ON public.farm_slaughterings;
CREATE POLICY farm_slaughterings_select ON public.farm_slaughterings
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_slaughterings_insert ON public.farm_slaughterings;
CREATE POLICY farm_slaughterings_insert ON public.farm_slaughterings
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_slaughterings_update ON public.farm_slaughterings;
CREATE POLICY farm_slaughterings_update ON public.farm_slaughterings
  FOR UPDATE TO authenticated
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

DROP POLICY IF EXISTS farm_slaughterings_delete ON public.farm_slaughterings;
CREATE POLICY farm_slaughterings_delete ON public.farm_slaughterings
  FOR DELETE TO authenticated
  USING (organization_id = public.current_user_org_id());

-- Recarrega cache do schema do PostgREST
NOTIFY pgrst, 'reload schema';
