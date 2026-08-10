import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, CheckCircle } from 'lucide-react'

export default function Despesas() {
  const { expenses } = useFarmStore()

  const totalExp = expenses.reduce((acc, e) => acc + e.totalValue, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" /> Despesas Operacionais (OPEX)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gastos do dia a dia com ração, vacinas, manutenção e insumos.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl bg-white border-border p-4">
        <span className="text-xs text-muted-foreground">Total em Despesas Registradas</span>
        <p className="text-2xl font-extrabold text-rose-600">R$ {totalExp.toFixed(2)}</p>
      </Card>

      <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
        <h2 className="text-base font-bold mb-4">Lista de Despesas Operacionais</h2>
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="p-3 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-foreground">{exp.description}</span>
                <p className="text-[11px] text-muted-foreground">
                  Categoria: {exp.category} {exp.lotName ? `• Lote: ${exp.lotName}` : ''}
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
