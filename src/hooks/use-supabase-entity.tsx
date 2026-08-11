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
      if (data && data.length > 0) {
        setItems(data as T[])
        saveCache(cacheKey, data)
      } else if (!error) {
        const cached = loadCache(cacheKey)
        if (cached.length > 0) {
          setItems(cached as T[])
          cached.forEach((item) => {
            insertEntity(table, orgId, item)
          })
        } else {
          setItems([])
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [orgId, table, cacheKey])

  useEffect(() => {
    saveCache(cacheKey, items)
  }, [cacheKey, items])

  const add = useCallback(
    async (item: T) => {
      if (!orgId) return
      setItems((prev) => [item, ...prev])
      const { error } = await insertEntity(table, orgId, item as unknown as Record<string, unknown>)
      if (error) {
        enqueueOperation({
          table,
          operation: 'insert',
          data: { id: item.id, organization_id: orgId, data: item },
        })
      }
    },
    [orgId, table],
  )

  const update = useCallback(
    async (id: string, updates: Partial<T>) => {
      if (!orgId) return
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
      const { error } = await updateEntity(table, id, updates as unknown as Record<string, unknown>)
      if (error) {
        enqueueOperation({ table, operation: 'update', data: { id, data: updates } })
      }
    },
    [orgId, table],
  )

  const remove = useCallback(
    async (id: string) => {
      if (!orgId) return
      setItems((prev) => prev.filter((i) => i.id !== id))
      const { error } = await softDeleteEntity(table, orgId, id)
      if (error) {
        enqueueOperation({ table, operation: 'delete', data: { id, organization_id: orgId } })
      }
    },
    [orgId, table],
  )

  return { items, setItems, add, update, remove }
}
