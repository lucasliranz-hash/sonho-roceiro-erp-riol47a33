import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { GlobalFilterBar } from '@/components/GlobalFilterBar'
import { TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank } from 'lucide-react'
import { computeFinancialSummary } from '@/lib/calculations'

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

      <Card className="rounded-3xl bg-blue-50 border-blue-200 p-5">
        <h3 className="text-sm font-bold text-blue-900 mb-2">💡 Entenda a diferença</h3>
        <div className="space-y-2 text-xs text-blue-800">
          <p>
            <strong>Resultado Operacional</strong> mostra se a atividade está dando lucro ou
            prejuízo no dia a dia. Não inclui investimentos em estruturas e equipamentos.
          </p>
          <p>
            <strong>Fluxo de Caixa</strong> mostra o dinheiro real que saiu do bolso, incluindo
            investimentos (CAPEX). Um investimento na chocadeira não prejudica o resultado do lote,
            mas diminui o caixa.
          </p>
          <div className="mt-3 p-3 rounded-xl bg-white border border-blue-100">
            <p className="font-semibold">Exemplo:</p>
            <p>
              Receita R$ 138 − Despesas R$ 388 = Resultado: <strong>R$ −250</strong>
            </p>
            <p>
              Receita R$ 138 − Despesas R$ 388 − Investimentos R$ 2.860 = Caixa:{' '}
              <strong>R$ −3.110</strong>
            </p>
          </div>
        </div>
      </Card>

      <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
        <h2 className="text-base font-bold mb-3">Despesas por Lote</h2>
        <div className="space-y-2">
          {expenses.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma despesa registrada ainda.
            </p>
          )}
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="p-3 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-foreground">{exp.description}</span>
                <p className="text-[11px] text-muted-foreground">
                  {exp.category} {exp.lotName ? `• Lote: ${exp.lotName}` : '• Geral'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-rose-600">R$ {exp.totalValue.toFixed(2)}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">{exp.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
