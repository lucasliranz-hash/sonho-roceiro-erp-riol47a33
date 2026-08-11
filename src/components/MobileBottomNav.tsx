import { Link, useLocation } from 'react-router-dom'
import { Home, TrendingUp, PlusCircle, Bell, Menu } from 'lucide-react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  onNewEntry: () => void
  onMore: () => void
}

export function MobileBottomNav({ onNewEntry, onMore }: MobileBottomNavProps) {
  const location = useLocation()
  const { alerts } = useFarmStore()
  const unreadCount = alerts.filter((a) => !a.isRead).length

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex items-end justify-around px-2 py-1.5 shadow-elevation">
      <Link
        to="/"
        className={cn(
          'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px]',
          location.pathname === '/' ? 'text-primary font-bold' : 'text-muted-foreground',
        )}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Início</span>
      </Link>

      <Link
        to="/producao"
        className={cn(
          'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px]',
          location.pathname === '/producao' ? 'text-primary font-bold' : 'text-muted-foreground',
        )}
      >
        <TrendingUp className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Produção</span>
      </Link>

      <button
        onClick={onNewEntry}
        className="flex flex-col items-center justify-center -mt-5 min-w-[56px]"
      >
        <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-elevation border-4 border-white transition-transform hover:scale-105 active:scale-95">
          <PlusCircle className="w-6 h-6" />
        </div>
        <span className="text-[10px] mt-0.5 font-bold text-primary">Novo</span>
      </button>

      <Link
        to="/alertas"
        className={cn(
          'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] relative',
          location.pathname === '/alertas' ? 'text-primary font-bold' : 'text-muted-foreground',
        )}
      >
        <div className="relative">
          <Bell className="w-5 h-5 mb-0.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px]">Alertas</span>
      </Link>

      <button
        onClick={onMore}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-muted-foreground min-w-[56px]"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Mais</span>
      </button>
    </nav>
  )
}
