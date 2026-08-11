ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_property_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS UUID AS $$
SELECT organization_id FROM public.organization_members
WHERE user_id = auth.uid() AND status = 'ativo'
LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
SELECT role FROM public.organization_members
WHERE user_id = auth.uid() AND status = 'ativo'
LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_manage_users()
RETURNS BOOLEAN AS $$
SELECT COALESCE(
  (SELECT role FROM public.organization_members
   WHERE user_id = auth.uid() AND status = 'ativo' LIMIT 1) IN ('OWNER', 'ADMIN'),
  false
);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_access_property(prop_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  member_rec RECORD;
BEGIN
  SELECT * INTO member_rec FROM public.organization_members
  WHERE user_id = auth.uid() AND status = 'ativo' LIMIT 1;

  IF NOT FOUND THEN RETURN false; END IF;
  IF member_rec.role IN ('OWNER', 'ADMIN') THEN RETURN true; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_property_access
    WHERE user_id = auth.uid()
    AND organization_id = member_rec.organization_id
    AND (can_access_all = true OR property_id = prop_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "org_select" ON public.organizations;
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT TO authenticated USING (
    id = public.current_user_org_id()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "org_insert" ON public.organizations;
CREATE POLICY "org_insert" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "org_update" ON public.organizations;
CREATE POLICY "org_update" ON public.organizations
  FOR UPDATE TO authenticated USING (
    id = public.current_user_org_id() AND public.current_user_role() = 'OWNER'
  ) WITH CHECK (
    id = public.current_user_org_id() AND public.current_user_role() = 'OWNER'
  );

DROP POLICY IF EXISTS "org_delete" ON public.organizations;
CREATE POLICY "org_delete" ON public.organizations
  FOR DELETE TO authenticated USING (
    id = public.current_user_org_id() AND public.current_user_role() = 'OWNER'
  );

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (
    id = auth.uid()
    OR id IN (
      SELECT om.user_id FROM public.organization_members om
      WHERE om.organization_id = public.current_user_org_id()
    )
  );

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
CREATE POLICY "org_members_select" ON public.organization_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR invited_email = (auth.jwt() ->> 'email')
    OR organization_id = public.current_user_org_id()
  );

DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
CREATE POLICY "org_members_insert" ON public.organization_members
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
CREATE POLICY "org_members_update" ON public.organization_members
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
    OR invited_email = (auth.jwt() ->> 'email')
    OR public.can_manage_users()
  ) WITH CHECK (
    user_id = auth.uid()
    OR public.can_manage_users()
  );

DROP POLICY IF EXISTS "org_members_delete" ON public.organization_members;
CREATE POLICY "org_members_delete" ON public.organization_members
  FOR DELETE TO authenticated USING (public.can_manage_users());

DROP POLICY IF EXISTS "properties_select" ON public.properties;
CREATE POLICY "properties_select" ON public.properties
  FOR SELECT TO authenticated USING (public.can_access_property(id));

DROP POLICY IF EXISTS "properties_insert" ON public.properties;
CREATE POLICY "properties_insert" ON public.properties
  FOR INSERT TO authenticated WITH CHECK (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('OWNER', 'ADMIN', 'GESTOR')
  );

DROP POLICY IF EXISTS "properties_update" ON public.properties;
CREATE POLICY "properties_update" ON public.properties
  FOR UPDATE TO authenticated USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('OWNER', 'ADMIN', 'GESTOR')
  );

DROP POLICY IF EXISTS "properties_delete" ON public.properties;
CREATE POLICY "properties_delete" ON public.properties
  FOR DELETE TO authenticated USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('OWNER', 'ADMIN')
  );

DROP POLICY IF EXISTS "user_prop_access_select" ON public.user_property_access;
CREATE POLICY "user_prop_access_select" ON public.user_property_access
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.can_manage_users()
  );

DROP POLICY IF EXISTS "user_prop_access_insert" ON public.user_property_access;
CREATE POLICY "user_prop_access_insert" ON public.user_property_access
  FOR INSERT TO authenticated WITH CHECK (public.can_manage_users());

DROP POLICY IF EXISTS "user_prop_access_update" ON public.user_property_access;
CREATE POLICY "user_prop_access_update" ON public.user_property_access
  FOR UPDATE TO authenticated USING (public.can_manage_users());

DROP POLICY IF EXISTS "user_prop_access_delete" ON public.user_property_access;
CREATE POLICY "user_prop_access_delete" ON public.user_property_access
  FOR DELETE TO authenticated USING (public.can_manage_users());

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    organization_id = public.current_user_org_id()
  );

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (
    organization_id = public.current_user_org_id()
    OR organization_id IN (
      SELECT id FROM public.organizations WHERE created_by = auth.uid()
    )
  );
