import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { GlobalFilterBar } from '@/components/GlobalFilterBar'
import { TrendingUp, DollarSign, TrendingDown } from 'lucide-react'

export default function Financeiro() {
  const { expenses, sales, structures } = useFarmStore()

  const totalRev = sales.reduce((acc, s) => acc + s.totalPrice, 0)
  const totalOpex = expenses.reduce((acc, e) => acc + e.totalValue, 0)
  const totalCapex = structures.reduce((acc, st) => acc + st.totalValue, 0)

  const netBalance = totalRev - totalOpex

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Financeiro e Fluxo de Caixa
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Demonstrativo de receitas, despesas operacionais e investimentos.
        </p>
      </div>

      <GlobalFilterBar />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Receita Operacional</span>
          <p className="text-2xl font-extrabold text-emerald-700">R$ {totalRev.toFixed(2)}</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Despesas Operacionais (OPEX)</span>
          <p className="text-2xl font-extrabold text-rose-600">R$ {totalOpex.toFixed(2)}</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Investimentos em Estrutura (CAPEX)</span>
          <p className="text-2xl font-extrabold text-primary">R$ {totalCapex.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="p-6 rounded-3xl bg-white border-border shadow-subtle">
        <h2 className="text-base font-bold mb-2">Resultado Operacional Líquido</h2>
        <p
          className={`text-3xl font-extrabold ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
        >
          R$ {netBalance.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Margem Operacional: {totalRev > 0 ? ((netBalance / totalRev) * 100).toFixed(1) : 0}%
        </p>
      </Card>
    </div>
  )
}
