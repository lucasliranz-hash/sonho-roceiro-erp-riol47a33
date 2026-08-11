import { useState, useEffect, useCallback } from 'react'
import {
  fetchEntity,
  insertEntity,
  updateEntity,
  softDeleteEntity,
  type FarmTableName,
} from '@/services/farm'
import { enqueueOperation } from '@/lib/sync-queue'

function loadCache(key: string): any[] {
  try {
    const item = localStorage.getItem(`sonho_roceiro_cache_${key}`)
    if (item) return JSON.parse(item)
    const oldItem = localStorage.getItem(`sonho_roceiro_${key}`)
    return oldItem ? JSON.parse(oldItem) : []
  } catch {
    return []
  }
}

function saveCache(key: string, data: any[]) {
  try {
    localStorage.setItem(`sonho_roceiro_cache_${key}`, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function useSupabaseEntity<T extends { id: string }>(
  table: FarmTableName,
  orgId: string | undefined,
  cacheKey: string,
) {
  const [items, setItems] = useState<T[]>(() => loadCache(cacheKey))

  useEffect(() => {
    if (!orgId) {
      setItems([])
      return
    }
    let cancelled = false
    fetchEntity(orgId, table).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        console.error('[useSupabaseEntity] fetch error', { table, error })
        return
      }
      const rows = (data || []) as T[]
      setItems(rows)
      saveCache(cacheKey, rows)
    })
    return () => {
      cancelled = true
    }
  }, [orgId, table, cacheKey])

  useEffect(() => {
    saveCache(cacheKey, items)
  }, [cacheKey, items])

  const add = useCallback(
    async (item: T): Promise<{ error: any }> => {
      if (!orgId) {
        console.error('[useSupabaseEntity] add: no orgId', { table })
        return { error: { message: 'Organização não carregada. Tente novamente.' } }
      }

      console.log('[useSupabaseEntity] add: inserting', {
        table,
        orgId,
        itemId: item.id,
        payload: { id: item.id, organization_id: orgId, data: item },
      })

      const { error } = await insertEntity(table, orgId, item as unknown as Record<string, unknown>)

      console.log('[useSupabaseEntity] add: result', {
        table,
        itemId: item.id,
        error,
        success: !error,
      })

      if (error) {
        console.error('[useSupabaseEntity] add: FAILED', { table, itemId: item.id, error })
        enqueueOperation({
          table,
          operation: 'insert',
          data: { id: item.id, organization_id: orgId, data: item },
        })
        return { error }
      }

      setItems((prev) => [item, ...prev])
      return { error: null }
    },
    [orgId, table],
  )

  const update = useCallback(
    async (id: string, updates: Partial<T>): Promise<{ error: any }> => {
      if (!orgId) {
        console.error('[useSupabaseEntity] update: no orgId', { table })
        return { error: { message: 'Organização não carregada.' } }
      }

      console.log('[useSupabaseEntity] update: start', {
        table,
        id,
        updates,
        orgId,
      })

      const { error } = await updateEntity(table, id, updates as unknown as Record<string, unknown>)

      console.log('[useSupabaseEntity] update: result', {
        table,
        id,
        error,
        success: !error,
      })

      if (error) {
        console.error('[useSupabaseEntity] update: FAILED', { table, id, error })
        enqueueOperation({ table, operation: 'update', data: { id, data: updates } })
        return { error }
      }

      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
      return { error: null }
    },
    [orgId, table],
  )

  const remove = useCallback(
    async (id: string): Promise<{ error: any }> => {
      if (!orgId) {
        console.error('[useSupabaseEntity] remove: no orgId', { table })
        return { error: { message: 'Organização não carregada.' } }
      }

      console.log('[useSupabaseEntity] remove: start', { table, id, orgId })

      const { error } = await softDeleteEntity(table, orgId, id)

      console.log('[useSupabaseEntity] remove: result', {
        table,
        id,
        error,
        success: !error,
      })

      if (error) {
        console.error('[useSupabaseEntity] remove: FAILED', { table, id, error })
        enqueueOperation({ table, operation: 'delete', data: { id, organization_id: orgId } })
        return { error }
      }

      setItems((prev) => prev.filter((i) => i.id !== id))
      return { error: null }
    },
    [orgId, table],
  )

  return { items, setItems, add, update, remove }
}
