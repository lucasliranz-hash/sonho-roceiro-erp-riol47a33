import { supabase } from '@/lib/supabase/client'

export async function logAudit(
  action: string,
  entityType: string,
  entityId?: string | null,
  oldData?: Record<string, unknown> | null,
  newData?: Record<string, unknown> | null,
) {
  try {
    const { error } = await supabase.rpc('log_audit', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId || null,
      p_old_data: oldData || null,
      p_new_data: newData || null,
    })
    if (error) console.error('[audit] logAudit error:', error)
  } catch (e) {
    console.error('[audit] logAudit error:', e)
  }
}
