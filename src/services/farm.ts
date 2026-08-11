import { supabase } from '@/lib/supabase/client'

export const FARM_TABLES = {
  activities: 'farm_activities',
  lots: 'farm_lots',
  structures: 'farm_structures',
  expenses: 'farm_expenses',
  inventory: 'farm_inventory',
  feedLogs: 'farm_feed_consumption',
  weighings: 'farm_weighings',
  mortality: 'farm_mortality',
  eggs: 'farm_egg_production',
  incubations: 'farm_incubations',
  candlings: 'farm_candlings',
  energyLogs: 'farm_energy',
  animals: 'farm_animals',
  matings: 'farm_matings',
  sales: 'farm_sales',
  customers: 'farm_customers',
  suppliers: 'farm_suppliers',
  assets: 'farm_assets',
  alerts: 'farm_alerts',
} as const

export type FarmTableName = (typeof FARM_TABLES)[keyof typeof FARM_TABLES]

export async function fetchEntity(orgId: string, table: FarmTableName) {
  const { data, error } = await supabase
    .from(table)
    .select('id, data')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error }
  const rows = (data || []).map((r) => ({ id: r.id, ...(r.data as object) }))
  return { data: rows as Record<string, unknown>[], error: null }
}

export async function insertEntity(
  table: FarmTableName,
  orgId: string,
  record: Record<string, unknown>,
) {
  const { error } = await supabase
    .from(table)
    .insert({ id: record.id, organization_id: orgId, data: record })
  return { error }
}

export async function updateEntity(
  table: FarmTableName,
  id: string,
  updates: Record<string, unknown>,
) {
  const { error } = await supabase.rpc('update_farm_record', {
    p_table_name: table,
    p_id: id,
    p_updates: updates,
  })
  return { error }
}

export async function softDeleteEntity(table: FarmTableName, orgId: string, id: string) {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)
  return { error }
}
