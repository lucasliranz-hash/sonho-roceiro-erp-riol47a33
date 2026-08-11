import { useOnlineStatus } from '@/hooks/use-online-status'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white text-center py-1.5 text-[11px] font-semibold flex items-center justify-center gap-2 animate-fade-in-down">
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Sem conexão — Seus lançamentos serão sincronizados quando voltar online</span>
    </div>
  )
}
