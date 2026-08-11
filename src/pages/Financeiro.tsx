import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { GlobalFilterBar } from '@/components/GlobalFilterBar'
import { TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank } from 'lucide-react'
import { computeFinancialSummary } from '@/lib/calculations'
import { FinanceiroTransactionList } from '@/components/FinanceiroTransactionList'

export default function Financeiro() {
  const { expenses, sales, structures, assets } = useFarmStore()
  const summary = computeFinancialSummary(sales, expenses, structures, assets)

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

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-bold text-foreground">Resultado Operacional</h2>
          <span className="text-xs text-muted-foreground">(Receitas − Despesas do dia a dia)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Receita Operacional</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-700">
                R$ {summary.operationalRevenue.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Vendas de ovos, aves e produtos
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Despesas Operacionais (OPEX)</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-extrabold text-rose-600">
                R$ {summary.operationalExpenses.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Ração, medicamentos, energia, etc.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Resultado Operacional</span>
                <DollarSign
                  className={`w-4 h-4 ${summary.operationalResult >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                />
              </div>
              <p
                className={`text-2xl font-extrabold ${summary.operationalResult >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
              >
                R$ {summary.operationalResult.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Receita − Despesas operacionais
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-blue-500" />
          <h2 className="text-sm font-bold text-foreground">Fluxo de Caixa</h2>
          <span className="text-xs text-muted-foreground">
            (Dinheiro que entrou − Dinheiro que saiu, incluindo investimentos)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Investimentos (CAPEX)</span>
                <PiggyBank className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-extrabold text-primary">R$ {summary.capex.toFixed(2)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Estruturas, equipamentos e benfeitorias
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Fluxo de Caixa</span>
                <Wallet
                  className={`w-4 h-4 ${summary.cashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                />
              </div>
              <p
                className={`text-2xl font-extrabold ${summary.cashFlow >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
              >
                R$ {summary.cashFlow.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Entradas − Saídas (incluindo CAPEX)
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Saldo Acumulado</span>
                <Wallet
                  className={`w-4 h-4 ${summary.accumulatedBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                />
              </div>
              <p
                className={`text-2xl font-extrabold ${summary.accumulatedBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
              >
                R$ {summary.accumulatedBalance.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Caixa atual da propriedade</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <FinanceiroTransactionList />
    </div>
  )
}
