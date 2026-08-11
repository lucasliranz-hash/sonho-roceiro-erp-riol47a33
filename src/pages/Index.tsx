import { useFarmStore } from '@/hooks/use-farm-store'
import { GlobalFilterBar } from '@/components/GlobalFilterBar'
import { BrandLogo } from '@/components/BrandLogo'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import {
  Bird,
  Egg,
  DollarSign,
  Wheat,
  Skull,
  Flame,
  AlertTriangle,
  Package,
  TrendingUp,
  ArrowRight,
  Clock,
  Fish,
} from 'lucide-react'
import { computeFinancialSummary } from '@/lib/calculations'

export default function Dashboard() {
  const {
    lots,
    expenses,
    sales,
    eggs,
    feedLogs,
    mortality,
    incubations,
    alerts,
    inventory,
    activities,
    structures,
    assets,
  } = useFarmStore()

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia!'
    if (h < 18) return 'Boa tarde!'
    return 'Boa noite!'
  })()

  const summary = computeFinancialSummary(sales, expenses, structures, assets)
  const totalBirdsAlive = lots.reduce((acc, l) => acc + l.currentQuantity, 0)
  const eggsCollectedToday = eggs.reduce((acc, e) => acc + e.collected, 0)
  const totalFeedKg = feedLogs.reduce((acc, f) => acc + f.quantityKg, 0)
  const totalMortalityQty = mortality.reduce((acc, m) => acc + m.quantity, 0)
  const unreadAlerts = alerts.filter((a) => !a.isRead)
  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minStock)
  const activeActivities = activities.filter((a) => a.isActive)
  const activeIncubations = incubations.filter((i) => i.status === 'Em andamento')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl border border-border shadow-subtle space-y-2">
        <BrandLogo size="md" showSlogan />
        <div className="pt-2 border-t border-border/60">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{greeting}</h1>
          <p className="text-sm font-semibold text-primary">Sonho Roceiro · Centro de Controle</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <GlobalFilterBar />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="text-sm font-bold text-foreground">Hoje</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Link to="/producao">
            <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
              <CardContent className="p-3">
                <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 inline-block mb-2">
                  <Bird className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-muted-foreground">Produção</p>
                <p className="text-lg font-bold text-foreground">{totalBirdsAlive}</p>
                <p className="text-[10px] text-muted-foreground">aves vivas</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/financeiro">
            <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
              <CardContent className="p-3">
                <div
                  className={cn(
                    'p-1.5 rounded-xl inline-block mb-2',
                    summary.operationalResult >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800',
                  )}
                >
                  <DollarSign className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-muted-foreground">Financeiro</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    summary.operationalResult >= 0 ? 'text-emerald-700' : 'text-rose-600',
                  )}
                >
                  R$ {summary.operationalResult.toFixed(0)}
                </p>
                <p className="text-[10px] text-muted-foreground">resultado operacional</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/alertas">
            <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
              <CardContent className="p-3">
                <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800 inline-block mb-2">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-muted-foreground">Alertas</p>
                <p className="text-lg font-bold text-amber-700">{unreadAlerts.length}</p>
                <p className="text-[10px] text-muted-foreground">não lidos</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/estoque">
            <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
              <CardContent className="p-3">
                <div className="p-1.5 rounded-xl bg-blue-100 text-blue-800 inline-block mb-2">
                  <Package className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-muted-foreground">Estoque</p>
                <p className="text-lg font-bold text-foreground">{lowStockItems.length}</p>
                <p className="text-[10px] text-muted-foreground">itens baixos</p>
              </CardContent>
            </Card>
          </Link>
          <Card className="rounded-2xl bg-white border-border h-full">
            <CardContent className="p-3">
              <div className="p-1.5 rounded-xl bg-purple-100 text-purple-800 inline-block mb-2">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-muted-foreground">Próximas tarefas</p>
              <p className="text-lg font-bold text-foreground">{activeIncubations.length}</p>
              <p className="text-[10px] text-muted-foreground">incubações ativas</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-border flex items-center gap-2">
          <Egg className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-[11px] text-muted-foreground">Ovos Coletados</p>
            <p className="text-sm font-bold text-foreground">{eggsCollectedToday}</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-border flex items-center gap-2">
          <Wheat className="w-5 h-5 text-amber-700" />
          <div>
            <p className="text-[11px] text-muted-foreground">Ração Consumida</p>
            <p className="text-sm font-bold text-foreground">{totalFeedKg} KG</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-border flex items-center gap-2">
          <Skull className="w-5 h-5 text-rose-600" />
          <div>
            <p className="text-[11px] text-muted-foreground">Mortalidade</p>
            <p className="text-sm font-bold text-foreground">{totalMortalityQty} aves</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-border flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-[11px] text-muted-foreground">Incubações</p>
            <p className="text-sm font-bold text-foreground">{incubations.length}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-bold text-foreground">Atividades da Propriedade</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeActivities.length === 0 && (
            <Card className="rounded-3xl bg-white border-border shadow-subtle">
              <CardContent className="p-8 text-center">
                <Bird className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">
                  Nenhuma atividade cadastrada
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cadastre uma atividade para começar a gerenciar sua propriedade.
                </p>
              </CardContent>
            </Card>
          )}
          {activeActivities.map((act) => {
            const actLots = lots.filter((l) => l.activityId === act.id)
            const totalAnimals = actLots.reduce((acc, l) => acc + l.currentQuantity, 0)
            return (
              <Card
                key={act.id}
                className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        {act.type === 'Piscicultura' ? (
                          <Fish className="w-5 h-5 text-primary" />
                        ) : (
                          <Bird className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{act.name}</h3>
                        <p className="text-xs text-muted-foreground">{act.description}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Ativa</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Lotes</span>
                      <span className="font-bold text-foreground">{actLots.length}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Animais</span>
                      <span className="font-bold text-foreground">{totalAnimals}</span>
                    </div>
                  </div>
                  {actLots.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {actLots.map((lot) => (
                        <Link
                          key={lot.id}
                          to="/lotes"
                          className="flex items-center justify-between p-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-all"
                        >
                          <span className="text-xs font-medium text-foreground">
                            {lot.code} - {lot.name}
                          </span>
                          <span className="text-xs font-bold text-primary">
                            {lot.currentQuantity} aves
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {unreadAlerts.length > 0 && (
        <Card className="rounded-3xl bg-white border-border shadow-subtle">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Avisos Importantes
              </h3>
              <Link
                to="/alertas"
                className="text-xs text-primary font-semibold flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {unreadAlerts.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs"
                >
                  <p className="font-bold text-amber-900">{a.title}</p>
                  <p className="text-amber-700">{a.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
