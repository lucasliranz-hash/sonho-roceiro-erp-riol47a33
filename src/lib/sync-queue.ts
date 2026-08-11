const QUEUE_KEY = 'sonho_roceiro_sync_queue'

export interface QueuedOperation {
  id: string
  table: string
  operation: 'insert' | 'update' | 'delete'
  data: Record<string, unknown>
  timestamp: number
}

export function getQueue(): QueuedOperation[] {
  try {
    const item = localStorage.getItem(QUEUE_KEY)
    return item ? JSON.parse(item) : []
  } catch {
    return []
  }
}

export function getPendingCount(): number {
  return getQueue().length
}

export function enqueueOperation(op: Omit<QueuedOperation, 'id' | 'timestamp'>): void {
  const queue = getQueue()
  queue.push({
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    timestamp: Date.now(),
  })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function clearQueue(): void {
  localStorage.setItem(QUEUE_KEY, '[]')
}

export async function processQueue(): Promise<{ processed: number; remaining: number }> {
  const queue = getQueue()
  if (queue.length === 0) return { processed: 0, remaining: 0 }

  let processed = 0
  const remaining: QueuedOperation[] = []

  for (const op of queue) {
    try {
      const { supabase } = await import('@/lib/supabase/client')
      let res
      if (op.operation === 'insert') {
        res = await supabase.from(op.table).insert(op.data)
      } else if (op.operation === 'update') {
        res = await supabase
          .from(op.table)
          .update(op.data)
          .eq('id', op.data.id as string)
      } else if (op.operation === 'delete') {
        res = await supabase
          .from(op.table)
          .delete()
          .eq('id', op.data.id as string)
      }
      if (res && res.error) throw res.error
      processed++
    } catch {
      remaining.push(op)
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  return { processed, remaining: remaining.length }
}
