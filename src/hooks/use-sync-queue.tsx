import { useState, useEffect, useCallback } from 'react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { getPendingCount, processQueue } from '@/lib/sync-queue'

export function useSyncQueue() {
  const isOnline = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)

  const refreshCount = useCallback(() => {
    setPendingCount(getPendingCount())
  }, [])

  useEffect(() => {
    refreshCount()
  }, [refreshCount])

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      processQueue().then(() => refreshCount())
    }
  }, [isOnline, pendingCount, refreshCount])

  return { pendingCount, refreshCount }
}
