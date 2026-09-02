import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Menu, Bell, PlusCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useAlertsManager } from '@/hooks/use-alerts-manager'
import { QuickEntryModal } from '@/components/QuickEntryModal'
import { QuickActionsSheet } from '@/components/QuickActionsSheet'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { BrandLogo } from '@/components/BrandLogo'
import { PropertySwitcher } from '@/components/PropertySwitcher'
import { navGroups } from '@/lib/nav-config'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { roleLabels } from '@/types/auth'

const BUILD_TIME = new Date().toISOString()
const SUPABASE_PROJECT_REF = 'qqhah...bvqq'
const APP_VERSION = 'v0.0.59'

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const { unreadCount } = useAlertsManager()
  const unreadAlertsCount = unreadCount
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(navGroups.map((g) => [g.label, true])),
  )

  const toggle = (label: string) => setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))

  return (
    <nav className="flex-1 overflow-y-auto p-3 space-y-1">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-1">
          {group.items.length > 1 ? (
            <button
              onClick={() => toggle(group.label)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{group.label}</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform',
                  expanded[group.label] ? '' : '-rotate-90',
                )}
              />
            </button>
          ) : (
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </div>
          )}
          {expanded[group.label] && (
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    <Icon
                      className={cn('w-4 h-4', isActive ? 'text-white' : 'text-muted-foreground')}
                    />
                    <span>{item.label}</span>
                    {item.path === '/alertas' && unreadAlertsCount > 0 && (
                      <Badge className="ml-auto bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0">
                        {unreadAlertsCount}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

export default function Layout() {
  const { unreadCount } = useAlertsManager()
  const { profile, orgMember } = useAuth()
  const [quickModalOpen, setQuickModalOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [quickActionType, setQuickActionType] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const unreadAlertsCount = unreadCount

  const handleQuickActionSelect = (action: string) => {
    setQuickActionType(action)
    setTimeout(() => setQuickModalOpen(true), 150)
  }

  const handleQuickModalChange = (open: boolean) => {
    setQuickModalOpen(open)
    if (!open) setTimeout(() => setQuickActionType(null), 200)
  }

  const handleDesktopNewEntry = () => {
    setQuickActionType(null)
    setQuickModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col md:flex-row font-sans antialiased text-foreground">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border min-h-screen sticky top-0 h-screen z-30 shadow-subtle">
        <div className="p-4 border-b border-border">
          <BrandLogo size="md" showSlogan />
        </div>
        <PropertySwitcher />
        <NavLinks />
        <div className="p-4 border-t border-border bg-sand/20">
          <Link
            to="/minha-conta"
            className="flex items-center gap-3 hover:bg-secondary/50 rounded-xl p-1 -m-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <span>{(profile?.full_name || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-bold text-foreground truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {orgMember ? roleLabels[orgMember.role] : 'SR Gestão'}
              </p>
            </div>
          </Link>
          <div className="text-[10px] text-muted-foreground/70 text-center mt-2 space-y-0.5">
            <p className="font-medium text-foreground/70">{APP_VERSION}</p>
            <p className="font-mono text-[9px] text-muted-foreground/60">{SUPABASE_PROJECT_REF}</p>
            <p className="text-[9px] text-muted-foreground/50 truncate" title={BUILD_TIME}>
              {BUILD_TIME}
            </p>
          </div>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border px-4 py-2.5 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-2">
          <BrandLogo size="sm" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg hidden sm:inline-block">
            Sonho Roceiro
          </span>
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
              <SheetHeader className="p-4 border-b border-border text-left space-y-0">
                <SheetTitle className="text-base font-bold">
                  <BrandLogo size="sm" showSlogan />
                </SheetTitle>
              </SheetHeader>
              <PropertySwitcher />
              <NavLinks onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      <div className="hidden lg:block fixed bottom-6 right-8 z-50">
        <Button
          onClick={handleDesktopNewEntry}
          className="h-13 px-5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold shadow-elevation flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <PlusCircle className="w-5 h-5 text-white" />
          <span>Novo Lançamento</span>
        </Button>
      </div>

      <div className="lg:hidden fixed bottom-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center">
        <span className="text-[9px] text-muted-foreground/60 font-mono">
          {APP_VERSION} • {SUPABASE_PROJECT_REF}
        </span>
      </div>
      <MobileBottomNav
        onNewEntry={() => setQuickActionsOpen(true)}
        onMore={() => setMobileMenuOpen(true)}
      />

      <QuickActionsSheet
        open={quickActionsOpen}
        onOpenChange={setQuickActionsOpen}
        onSelect={handleQuickActionSelect}
      />

      <QuickEntryModal
        open={quickModalOpen}
        onOpenChange={handleQuickModalChange}
        initialActionType={quickActionType}
      />
    </div>
  )
}
