import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'

const OnlineStatusContext = createContext<boolean>(true)

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return <OnlineStatusContext.Provider value={isOnline}>{children}</OnlineStatusContext.Provider>
}

export function useOnlineStatus() {
  return useContext(OnlineStatusContext)
}
