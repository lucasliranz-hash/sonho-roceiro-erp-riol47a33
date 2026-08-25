import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDashboardData } from '@/hooks/use-dashboard'
import { cn } from '@/lib/utils'
import {
  Bird,
  Layers,
  Flame,
  Sparkles,
  Skull,
  Wheat,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Package,
  Plus,
  Scale,
  ArrowRight,
  Clock,
  Zap,
  Egg,
  TrendingDown,
  Info,
  CheckCircle2,
  HeartPulse,
  Syringe,
  Pill,
} from 'lucide-react'

export default function Dashboard() {
  const {
    propertyName,
    todayFormatted,
    kpis,
    attentionAlerts,
    recentActivities,
    hasActiveIncubations,
    hasMonthlySales,
    financialSummary,
    topActiveLots,
    detailedActiveIncubations,
    detailedCriticalStock,
    vaccinations,
    treatments,
    healthOccurrences,
  } = useDashboardData()

  // Capitalize first letter of todayFormatted (e.g. "Quinta-feira, 14 de agosto de 2025")
  const formattedDateCapitalized = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1)

  // Timeline icon mapper
  const renderActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'mortalidade':
        return <Skull className="w-4 h-4 text-rose-500" />
      case 'racao':
        return <Wheat className="w-4 h-4 text-amber-500" />
      case 'pesagem':
        return <Scale className="w-4 h-4 text-blue-500" />
      case 'producao':
        return <Egg className="w-4 h-4 text-emerald-500" />
      case 'venda':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />
      case 'despesa':
        return <TrendingDown className="w-4 h-4 text-rose-500" />
      case 'energia':
        return <Zap className="w-4 h-4 text-amber-500" />
      case 'lote':
        return <Layers className="w-4 h-4 text-primary" />
      case 'nascimento':
        return <Sparkles className="w-4 h-4 text-amber-500" />
      case 'sanidade':
        return <HeartPulse className="w-4 h-4 text-rose-600" />
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ====================================================
          1. CABEÇALHO
      ==================================================== */}
      <div className="bg-white p-6 rounded-3xl border border-border shadow-subtle space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Hoje em {propertyName}
        </h1>
        <p className="text-xs font-semibold text-primary">{formattedDateCapitalized}</p>
        <p className="text-xs text-muted-foreground pt-1">
          Visão rápida do que está acontecendo na propriedade.
        </p>
      </div>

      {/* ====================================================
          BLOCO SANIDADE HOJE (se houver dados)
      ==================================================== */}
      {(() => {
        const scheduledVacCount = (vaccinations || []).filter(
          (v) => v.status === 'scheduled' || v.status === 'delayed',
        ).length
        const activeTrtCount = (treatments || []).filter((t) => t.status === 'in_progress').length
        const occurrencesCount = (healthOccurrences || []).length

        if (scheduledVacCount === 0 && activeTrtCount === 0 && occurrencesCount === 0) {
          return null
        }

        return (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-50 via-white to-rose-50/40 border border-rose-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Sanidade & Manejo Clínico</h3>
                <p className="text-[11px] text-muted-foreground">
                  Status e alertas em tempo real do plantel
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-rose-100 flex items-center gap-1.5 text-xs shadow-sm">
                <Syringe className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-extrabold text-foreground">{scheduledVacCount}</span>
                <span className="text-muted-foreground text-[11px]">vacinações prog.</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-rose-100 flex items-center gap-1.5 text-xs shadow-sm">
                <Pill className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-extrabold text-foreground">{activeTrtCount}</span>
                <span className="text-muted-foreground text-[11px]">tratamentos ativos</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-rose-100 flex items-center gap-1.5 text-xs shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-extrabold text-foreground">{occurrencesCount}</span>
                <span className="text-muted-foreground text-[11px]">ocorrências</span>
              </div>
              <Link to="/sanidade">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl text-xs font-semibold text-rose-600 border-rose-200 bg-white"
                >
                  Abrir Sanidade
                </Button>
              </Link>
            </div>
          </div>
        )
      })()}

      {/* ====================================================
          3. ATENÇÃO HOJE (Mobile Order #1)
      ==================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-amber-500" />
            <h2 className="text-sm font-bold text-foreground">Atenção hoje</h2>
          </div>
          {attentionAlerts.length > 0 && (
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px]">
              {attentionAlerts.length} {attentionAlerts.length === 1 ? 'aviso' : 'avisos'}
            </Badge>
          )}
        </div>

        {attentionAlerts.length === 0 ? (
          <Card className="rounded-2xl bg-white border-border/80">
            <CardContent className="p-4 flex items-center gap-3 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-xs">Nenhuma atenção necessária no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {attentionAlerts.map((alert) => {
              const bgClass =
                alert.severity === 'critical'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : alert.severity === 'warning'
                    ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                    : 'bg-blue-50/80 border-blue-200 text-blue-950'
              const iconColor =
                alert.severity === 'critical'
                  ? 'text-rose-600'
                  : alert.severity === 'warning'
                    ? 'text-amber-600'
                    : 'text-blue-600'

              const content = (
                <div
                  className={cn(
                    'p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all hover:shadow-xs',
                    bgClass,
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className={cn('w-4 h-4 shrink-0', iconColor)} />
                    <span className="font-medium">{alert.message}</span>
                  </div>
                  {alert.link && (
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1 shrink-0">
                      Ver <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              )

              return alert.link ? (
                <Link key={alert.id} to={alert.link} className="block">
                  {content}
                </Link>
              ) : (
                <div key={alert.id}>{content}</div>
              )
            })}
          </div>
        )}
      </div>

      {/* ====================================================
          2. KPIs PRINCIPAIS (Mobile Order #2)
      ==================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="text-sm font-bold text-foreground">Indicadores operacionais</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Lotes ativos */}
          {kpis.hasLots && (
            <Link to="/lotes">
              <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
                <CardContent className="p-3.5">
                  <div className="p-1.5 rounded-xl bg-primary/10 text-primary inline-block mb-2">
                    <Layers className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Lotes ativos</p>
                  <p className="text-lg font-extrabold text-foreground">{kpis.activeLotsCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">lotes em andamento</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Animais vivos */}
          {kpis.hasLots && kpis.totalBirdsAlive > 0 && (
            <Link to="/lotes">
              <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
                <CardContent className="p-3.5">
                  <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 inline-block mb-2">
                    <Bird className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Animais vivos</p>
                  <p className="text-lg font-extrabold text-foreground">{kpis.totalBirdsAlive}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">aves alojadas</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Incubações em andamento */}
          {kpis.hasIncubations && kpis.activeIncubationsCount > 0 && (
            <Link to="/chocadeira">
              <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
                <CardContent className="p-3.5">
                  <div className="p-1.5 rounded-xl bg-orange-100 text-orange-800 inline-block mb-2">
                    <Flame className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Incubações</p>
                  <p className="text-lg font-extrabold text-foreground">
                    {kpis.activeIncubationsCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">em andamento</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Nascimentos hoje */}
          {kpis.hasBirthsToday && (
            <Link to="/chocadeira">
              <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
                <CardContent className="p-3.5">
                  <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800 inline-block mb-2">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Nascimentos hoje</p>
                  <p className="text-lg font-extrabold text-foreground">{kpis.birthsToday}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">pintinhos nascidos</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Mortalidade hoje */}
          {kpis.hasMortalityToday && (
            <Link to="/mortalidade">
              <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
                <CardContent className="p-3.5">
                  <div className="p-1.5 rounded-xl bg-rose-100 text-rose-800 inline-block mb-2">
                    <Skull className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Mortalidade hoje</p>
                  <p className="text-lg font-extrabold text-rose-600">
                    {kpis.mortalityToday} {kpis.mortalityToday === 1 ? 'ave' : 'aves'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">registrada no dia</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Ração consumida hoje */}
          {kpis.hasFeedConsumedToday && (
            <Link to="/racao">
              <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
                <CardContent className="p-3.5">
                  <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800 inline-block mb-2">
                    <Wheat className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Ração hoje</p>
                  <p className="text-lg font-extrabold text-foreground">
                    {kpis.feedConsumedTodayKg} kg
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">consumida no dia</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Receita do mês */}
          {kpis.hasMonthlySales && (
            <Link to="/vendas">
              <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
                <CardContent className="p-3.5">
                  <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 inline-block mb-2">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Receita do mês</p>
                  <p className="text-lg font-extrabold text-emerald-700">
                    R$ {kpis.monthlyRevenue.toFixed(0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">faturamento mensal</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* OPEX do mês */}
          {kpis.hasMonthlyExpenses && (
            <Link to="/despesas">
              <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
                <CardContent className="p-3.5">
                  <div className="p-1.5 rounded-xl bg-rose-100 text-rose-800 inline-block mb-2">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">OPEX do mês</p>
                  <p className="text-lg font-extrabold text-rose-600">
                    R$ {kpis.monthlyOpex.toFixed(0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">custos operacionais</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Resultado Operacional do mês */}
          {(kpis.hasMonthlySales || kpis.hasMonthlyExpenses) && (
            <Link to="/financeiro">
              <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
                <CardContent className="p-3.5">
                  <div
                    className={cn(
                      'p-1.5 rounded-xl inline-block mb-2',
                      kpis.monthlyOperationalResult >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800',
                    )}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Resultado mensal</p>
                  <p
                    className={cn(
                      'text-lg font-extrabold',
                      kpis.monthlyOperationalResult >= 0 ? 'text-emerald-700' : 'text-rose-600',
                    )}
                  >
                    R$ {kpis.monthlyOperationalResult.toFixed(0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Receita − OPEX</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Estoques críticos */}
          {kpis.hasCriticalStock && (
            <Link to="/estoque">
              <Card className="rounded-2xl bg-white border-border hover:shadow-elevation transition-all cursor-pointer h-full">
                <CardContent className="p-3.5">
                  <div className="p-1.5 rounded-xl bg-blue-100 text-blue-800 inline-block mb-2">
                    <Package className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Estoques críticos</p>
                  <p className="text-lg font-extrabold text-amber-700">{kpis.criticalStockCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">itens no limite</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* ====================================================
          5. AÇÕES RÁPIDAS (Mobile Order #3)
      ==================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="text-sm font-bold text-foreground">Ações rápidas</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {/* Fixas */}
          <Link
            to="/despesas"
            className="p-3 rounded-2xl bg-white border border-border hover:border-primary/50 hover:shadow-subtle transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Nova Despesa</p>
              <p className="text-[10px] text-muted-foreground">Registrar custo</p>
            </div>
          </Link>

          <Link
            to="/racao"
            className="p-3 rounded-2xl bg-white border border-border hover:border-primary/50 hover:shadow-subtle transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Wheat className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Registrar Ração</p>
              <p className="text-[10px] text-muted-foreground">Consumo diário</p>
            </div>
          </Link>

          <Link
            to="/pesagens"
            className="p-3 rounded-2xl bg-white border border-border hover:border-primary/50 hover:shadow-subtle transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Nova Pesagem</p>
              <p className="text-[10px] text-muted-foreground">Controle de peso</p>
            </div>
          </Link>

          <Link
            to="/mortalidade"
            className="p-3 rounded-2xl bg-white border border-border hover:border-primary/50 hover:shadow-subtle transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Skull className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Nova Mortalidade</p>
              <p className="text-[10px] text-muted-foreground">Registrar perda</p>
            </div>
          </Link>

          <Link
            to="/sanidade"
            className="p-3 rounded-2xl bg-white border border-border hover:border-primary/50 hover:shadow-subtle transition-all text-left flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Syringe className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Sanidade</p>
              <p className="text-[10px] text-muted-foreground">Vacinas & Tratamentos</p>
            </div>
          </Link>

          {/* Condicionais */}
          {hasActiveIncubations && (
            <Link
              to="/chocadeira"
              className="p-3 rounded-2xl bg-white border border-border hover:border-primary/50 hover:shadow-subtle transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Nova Incubação</p>
                <p className="text-[10px] text-muted-foreground">Iniciar ciclo</p>
              </div>
            </Link>
          )}

          {hasMonthlySales && (
            <Link
              to="/vendas"
              className="p-3 rounded-2xl bg-white border border-border hover:border-primary/50 hover:shadow-subtle transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Nova Venda</p>
                <p className="text-[10px] text-muted-foreground">Registrar saída</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* ====================================================
          8. RESUMO DE INCUBAÇÕES (Mobile Order #4)
      ==================================================== */}
      {detailedActiveIncubations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-orange-500" />
              <h2 className="text-sm font-bold text-foreground">Incubações em andamento</h2>
            </div>
            <Link
              to="/chocadeira"
              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {detailedActiveIncubations.map((inc) => (
              <Card
                key={inc.id}
                className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-foreground">
                        {inc.code} • {inc.incubatorName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {inc.breed || 'Mista'} • Início: {inc.startDate}
                      </p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-900 border-orange-200 text-[10px] font-bold">
                      Dia {inc.currentDay}/{inc.totalCycle}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-2.5 rounded-2xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Colocados</span>
                      <span className="font-extrabold text-foreground">{inc.eggCount} ovos</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Férteis</span>
                      <span className="font-extrabold text-amber-800">
                        {inc.fertileCount !== undefined ? `${inc.fertileCount} ovos` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Nascidos</span>
                      <span className="font-extrabold text-emerald-700">
                        {inc.hatchedCount}
                        {inc.hatchRate !== undefined ? ` (${inc.hatchRate.toFixed(0)}%)` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/60">
                      <Sparkles className="w-3 h-3 text-orange-600" />
                      {inc.nextMilestone}
                    </span>
                    <Link
                      to="/chocadeira"
                      className="text-primary font-bold text-xs flex items-center gap-0.5 hover:underline"
                    >
                      Detalhes <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================
          7. RESUMO DOS LOTES (Mobile Order #5)
      ==================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-foreground">Seus lotes</h2>
          </div>
          {topActiveLots.length > 0 && (
            <Link
              to="/lotes"
              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {topActiveLots.length === 0 ? (
          <Card className="rounded-3xl bg-white border-border shadow-subtle">
            <CardContent className="p-8 text-center space-y-3">
              <Bird className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Nenhum lote ativo.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cadastre seu primeiro lote para acompanhar animais, alimentação e custos.
                </p>
              </div>
              <Link to="/lotes" className="inline-block">
                <Button className="rounded-xl bg-primary text-white text-xs gap-1.5 font-bold">
                  <Plus className="w-4 h-4" /> Criar primeiro lote
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {topActiveLots.map((lot) => (
              <Card
                key={lot.id}
                className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-foreground">
                        {lot.code} • {lot.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {lot.activityName} • {lot.breed}
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {lot.ageDays} dias
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-2.5 rounded-2xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Vivas</span>
                      <span className="font-extrabold text-foreground">
                        {lot.currentQuantity} / {lot.initialQuantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Mortalidade</span>
                      <span
                        className={cn(
                          'font-extrabold',
                          lot.mortalityPercent > 5 ? 'text-rose-600' : 'text-muted-foreground',
                        )}
                      >
                        {lot.hasMortalityData ? `${lot.mortalityPercent.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Custo Acum.</span>
                      <span className="font-extrabold text-rose-600">
                        {lot.totalAccumulatedCost > 0
                          ? `R$ ${lot.totalAccumulatedCost.toFixed(0)}`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Link to={`/lotes`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-xl text-xs text-primary font-bold hover:bg-primary/5 border-primary/20"
                      >
                        Ver lote <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ====================================================
          9. ESTOQUE CRÍTICO (Mobile Order #6)
      ==================================================== */}
      {detailedCriticalStock.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-foreground">Estoque crítico</h2>
            </div>
            <Link
              to="/estoque"
              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              Ir ao estoque <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {detailedCriticalStock.map((item) => (
              <Card
                key={item.id}
                className="rounded-2xl bg-white border-border shadow-subtle hover:shadow-xs transition-all"
              >
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground truncate">{item.name}</span>
                    <Badge className="bg-rose-100 text-rose-900 border-rose-200 text-[10px]">
                      {item.currentStock} {item.unit}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {item.estimatedDays !== null ? (
                      item.estimatedDays <= 3 ? (
                        <span className="text-rose-600 font-bold">
                          ⚠️ Estimado para ~{item.estimatedDays} dias
                        </span>
                      ) : (
                        <span>Estimado para ~{item.estimatedDays} dias</span>
                      )
                    ) : (
                      <span>Sem registro de consumo recente</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================
          4. ATIVIDADES RECENTES (Mobile Order #7)
      ==================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h2 className="text-sm font-bold text-foreground">Atividades recentes</h2>
          </div>
          <span className="text-[11px] text-muted-foreground">Últimos acontecimentos</span>
        </div>

        {recentActivities.length === 0 ? (
          <Card className="rounded-3xl bg-white border-border shadow-subtle">
            <CardContent className="p-8 text-center">
              <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">
                Nenhuma atividade recente registrada
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Novos registros de despesas, pesagens, mortalidade e ração aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-3xl bg-white border-border shadow-subtle p-4">
            <div className="divide-y divide-border/60 space-y-1">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="pt-2.5 pb-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-secondary/70 flex items-center justify-center shrink-0">
                      {renderActivityIcon(act.iconType)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground truncate">
                          {act.actionLabel}
                        </span>
                        {act.relatedEntity && (
                          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md truncate">
                            {act.relatedEntity}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {act.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                    {act.formattedRelativeDate}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ====================================================
          6. RESUMO FINANCEIRO (Mobile Order #8)
      ==================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-emerald-600" />
            <h2 className="text-sm font-bold text-foreground">Financeiro do mês</h2>
          </div>
          <Link
            to="/financeiro"
            className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
          >
            Ver fluxo completo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <Card className="rounded-3xl bg-white border-border shadow-subtle overflow-hidden">
          <CardContent className="p-5">
            {!financialSummary.hasData ? (
              <div className="text-center py-6">
                <DollarSign className="w-8 h-8 text-muted-foreground/40 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-muted-foreground">
                  Sem registros financeiros este mês
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Receita */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Receita
                  </span>
                  <p className="text-lg font-extrabold text-emerald-700 mt-1">
                    R$ {financialSummary.revenue.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">vendas do mês</p>
                </div>

                {/* OPEX */}
                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                    OPEX
                  </span>
                  <p className="text-lg font-extrabold text-rose-600 mt-1">
                    R$ {financialSummary.opex.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">gastos operacionais</p>
                </div>

                {/* Resultado Operacional */}
                <div
                  className={cn(
                    'p-3.5 rounded-2xl border',
                    financialSummary.operationalResult >= 0
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-rose-50/70 border-rose-200',
                  )}
                >
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider block',
                      financialSummary.operationalResult >= 0
                        ? 'text-emerald-800'
                        : 'text-rose-800',
                    )}
                  >
                    Resultado Operacional
                  </span>
                  <p
                    className={cn(
                      'text-lg font-extrabold mt-1',
                      financialSummary.operationalResult >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-600',
                    )}
                  >
                    R$ {financialSummary.operationalResult.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Receita − OPEX</p>
                </div>

                {/* CAPEX */}
                <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    CAPEX
                  </span>
                  <p className="text-lg font-extrabold text-foreground mt-1">
                    R$ {financialSummary.capex.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">estrutura e bens</p>
                </div>

                {/* Fluxo de Caixa */}
                <div
                  className={cn(
                    'p-3.5 rounded-2xl border',
                    financialSummary.cashFlow >= 0
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-rose-50/70 border-rose-200',
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                    Fluxo de Caixa
                  </span>
                  <p
                    className={cn(
                      'text-lg font-extrabold mt-1',
                      financialSummary.cashFlow >= 0 ? 'text-primary' : 'text-rose-600',
                    )}
                  >
                    R$ {financialSummary.cashFlow.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    entradas − saídas pagas
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
