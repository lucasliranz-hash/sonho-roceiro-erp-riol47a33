import { useFarmStore } from '@/hooks/use-farm-store'
import { GlobalFilterBar } from '@/components/GlobalFilterBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  Bird,
  Egg,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wheat,
  Skull,
  Flame,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export default function Dashboard() {
  const { lots, expenses, sales, eggs, feedLogs, mortality, incubations, alerts } = useFarmStore()

  // Calculate totals
  const totalBirdsAlive = lots.reduce((acc, l) => acc + l.currentQuantity, 0)
  const totalLayingHens = lots
    .filter((l) => l.type === 'Poedeiras')
    .reduce((acc, l) => acc + l.currentQuantity, 0)
  const totalBroilers = lots
    .filter((l) => l.type === 'Frango de corte' || l.type === 'Frango caipira')
    .reduce((acc, l) => acc + l.currentQuantity, 0)
  const totalChicks = lots
    .filter((l) => l.type === 'Pintinhos')
    .reduce((acc, l) => acc + l.currentQuantity, 0)

  const totalRevenueMonth = sales.reduce((acc, s) => acc + s.totalPrice, 0)
  const totalExpensesMonth = expenses.reduce((acc, e) => acc + e.totalValue, 0)
  const monthlyBalance = totalRevenueMonth - totalExpensesMonth

  const eggsCollectedToday = eggs.reduce((acc, e) => acc + e.collected, 0)
  const totalFeedKg = feedLogs.reduce((acc, f) => acc + f.quantityKg, 0)

  const totalMortalityQty = mortality.reduce((acc, m) => acc + m.quantity, 0)
  const mortalityRate =
    totalBirdsAlive > 0
      ? ((totalMortalityQty / (totalBirdsAlive + totalMortalityQty)) * 100).toFixed(1)
      : '0.0'

  // Chart Mock Series
  const finChartData = [
    { day: '01/Fev', Receitas: 120, Despesas: 80 },
    { day: '03/Fev', Receitas: 240, Despesas: 150 },
    { day: '05/Fev', Receitas: 180, Despesas: 210 },
    { day: '07/Fev', Receitas: 320, Despesas: 110 },
    { day: '08/Fev', Receitas: 290, Despesas: 95 },
  ]

  const eggChartData = [
    { day: 'Seg', Ovos: 88 },
    { day: 'Ter', Ovos: 92 },
    { day: 'Qua', Ovos: 85 },
    { day: 'Qui', Ovos: 95 },
    { day: 'Sex', Ovos: 98 },
    { day: 'Sáb', Ovos: 92 },
    { day: 'Dom', Ovos: 98 },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-subtle">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Olá, Produtor 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sítio Sonho Roceiro •{' '}
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/alertas">
            <Badge
              variant="outline"
              className="px-3 py-1.5 rounded-xl border-amber-200 bg-amber-50 text-amber-800 text-xs gap-1.5 font-semibold"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {alerts.length} Avisos Ativos
            </Badge>
          </Link>
        </div>
      </div>

      {/* GLOBAL FILTER */}
      <GlobalFilterBar />

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border shadow-subtle bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Total de Aves Vivas
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Bird className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {totalBirdsAlive}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span>
                  {totalLayingHens} poedeiras • {totalBroilers} corte
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-subtle bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Ovos Hoje</span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Egg className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold tracking-tight text-amber-900">
                {eggsCollectedToday}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>+12% vs média</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-subtle bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Receitas do Mês</span>
              <div className="p-2 rounded-xl bg-green-100 text-green-800">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold tracking-tight text-emerald-700">
                R$ {totalRevenueMonth.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Vendas acumuladas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-subtle bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Resultado Líquido</span>
              <div
                className={`p-2 rounded-xl ${monthlyBalance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
              >
                {monthlyBalance >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <p
                className={`text-2xl font-extrabold tracking-tight ${monthlyBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
              >
                R$ {monthlyBalance.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Receita - Despesa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECONDARY INDICATORS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
            <Wheat className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Consumo Ração</p>
            <p className="text-base font-bold text-foreground">{totalFeedKg} KG</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
            <Skull className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Mortalidade (%)</p>
            <p className="text-base font-bold text-foreground">{mortalityRate}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-orange-50 text-orange-700">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Taxa de Eclosão</p>
            <p className="text-base font-bold text-foreground">86.6%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Custo Médio / Ave</p>
            <p className="text-base font-bold text-foreground">R$ 14.80</p>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-border shadow-subtle bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
              <span>Receitas x Despesas</span>
              <span className="text-xs text-muted-foreground font-normal">Fevereiro 2026</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="Receitas"
                  stroke="#4A7C59"
                  fill="#4A7C59"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Despesas"
                  stroke="#DC2626"
                  fill="#DC2626"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border shadow-subtle bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
              <span>Produção Diária de Ovos</span>
              <span className="text-xs text-muted-foreground font-normal">Últimos 7 dias</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eggChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Ovos" fill="#D6B98C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* QUICK LOTS OVERVIEW */}
      <Card className="rounded-3xl border-border shadow-subtle bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">Resumo dos Lotes Ativos</CardTitle>
          <Link to="/lotes">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
              Ver Todos <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lots.map((lot) => (
              <div
                key={lot.id}
                className="p-4 rounded-2xl border border-border bg-secondary/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">{lot.code}</span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    {lot.status}
                  </Badge>
                </div>
                <p className="font-bold text-sm text-foreground truncate">{lot.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <span>Quantidade:</span>
                  <span className="font-bold text-foreground">
                    {lot.currentQuantity} de {lot.initialQuantity} aves
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
