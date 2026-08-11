CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_property_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id, property_id, user_id, action, entity_type, entity_id, old_data, new_data
  ) VALUES (
    public.current_user_org_id(),
    p_property_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
