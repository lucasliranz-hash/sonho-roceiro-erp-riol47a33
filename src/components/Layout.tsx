import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Home,
  Layers,
  PlusCircle,
  Package,
  Menu,
  Bell,
  Building2,
  DollarSign,
  Wheat,
  Scale,
  Skull,
  Egg,
  Flame,
  Zap,
  Bird,
  Dna,
  ShoppingCart,
  Users,
  Truck,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  Settings,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useFarmStore } from '@/hooks/use-farm-store'
import { QuickEntryModal } from '@/components/QuickEntryModal'

export default function Layout() {
  const location = useLocation()
  const { alerts } = useFarmStore()
  const [quickModalOpen, setQuickModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length

  const mainNav = [
    { label: 'Início', path: '/', icon: Home },
    { label: 'Lotes', path: '/lotes', icon: Layers },
    { label: 'Estrutura', path: '/estrutura', icon: Building2 },
    { label: 'Despesas', path: '/despesas', icon: DollarSign },
    { label: 'Estoque', path: '/estoque', icon: Package },
    { label: 'Ração', path: '/racao', icon: Wheat },
    { label: 'Pesagens', path: '/pesagens', icon: Scale },
    { label: 'Mortalidade', path: '/mortalidade', icon: Skull },
    { label: 'Ovos', path: '/ovos', icon: Egg },
    { label: 'Chocadeira', path: '/chocadeira', icon: Flame },
    { label: 'Energia', path: '/energia', icon: Zap },
    { label: 'Matrizes', path: '/matrizes', icon: Bird },
    { label: 'Acasalamentos', path: '/acasalamentos', icon: Dna },
    { label: 'Vendas', path: '/vendas', icon: ShoppingCart },
    { label: 'Clientes & Fornecedores', path: '/parceiros', icon: Users },
    { label: 'Financeiro', path: '/financeiro', icon: TrendingUp },
    { label: 'Indicadores', path: '/indicadores', icon: Briefcase },
    { label: 'Patrimônio', path: '/patrimonio', icon: Truck },
    { label: 'Alertas', path: '/alertas', icon: AlertTriangle },
    { label: 'Configurações', path: '/configuracoes', icon: Settings },
  ]

  const mobileBottomNav = [
    { label: 'Início', path: '/', icon: Home },
    { label: 'Lotes', path: '/lotes', icon: Layers },
    { label: 'Estoque', path: '/estoque', icon: Package },
    { label: 'Financeiro', path: '/financeiro', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col md:flex-row font-sans antialiased text-foreground">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border min-h-screen sticky top-0 h-screen z-30 shadow-subtle">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md">
            🐓
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-primary leading-tight">
              Sonho Roceiro
            </h1>
            <p className="text-[11px] font-medium text-muted-foreground">ERP Avícola Rural</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
                {item.path === '/alertas' && unreadAlertsCount > 0 && (
                  <Badge className="ml-auto bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0">
                    {unreadAlertsCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border bg-secondary/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center">
              SR
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-bold text-foreground truncate">Sítio Sonho Roceiro</p>
              <p className="text-[10px] text-muted-foreground truncate">Produtor Rural</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP HEADER */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-xs">
            🐓
          </div>
          <span className="font-bold text-sm tracking-tight text-primary">Sonho Roceiro ERP</span>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/alertas" className="relative p-2 rounded-xl bg-secondary text-foreground">
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadAlertsCount}
              </span>
            )}
          </Link>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl border-border">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 flex flex-col">
              <SheetHeader className="p-4 border-b border-border text-left">
                <SheetTitle className="text-base font-bold flex items-center gap-2">
                  <span>🌾 Menu Completo</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {mainNav.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 pb-24 lg:pb-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-18 lg:bottom-6 right-4 lg:right-8 z-50">
        <Button
          onClick={() => setQuickModalOpen(true)}
          className="h-13 px-5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold shadow-elevation flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <PlusCircle className="w-5 h-5 text-white" />
          <span>➕ Novo Lançamento</span>
        </Button>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border px-3 py-2 flex items-center justify-around shadow-elevation">
        {mobileBottomNav.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground font-medium'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 text-muted-foreground font-medium"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Mais</span>
        </button>
      </nav>

      {/* QUICK ENTRY MODAL */}
      <QuickEntryModal open={quickModalOpen} onOpenChange={setQuickModalOpen} />
    </div>
  )
}
