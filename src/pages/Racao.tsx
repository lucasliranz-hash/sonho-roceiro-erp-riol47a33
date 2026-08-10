import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Wheat } from 'lucide-react'

export default function Racao() {
  const { feedLogs } = useFarmStore()

  const totalKg = feedLogs.reduce((acc, f) => acc + f.quantityKg, 0)
  const totalCost = feedLogs.reduce((acc, f) => acc + f.totalCost, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Wheat className="w-6 h-6 text-amber-600" /> Consumo de Ração por Lote
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Registro diário da alimentação e cálculo de conversão alimentar.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Total Consumido</span>
          <p className="text-2xl font-extrabold text-amber-700">{totalKg} KG</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Custo Total de Ração</span>
          <p className="text-2xl font-extrabold text-emerald-700">R$ {totalCost.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="p-5 rounded-3xl bg-white border-border">
        <h2 className="text-base font-bold mb-3">Histórico de Alimentação</h2>
        <div className="space-y-2">
          {feedLogs.map((f) => (
            <div
              key={f.id}
              className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold">{f.lotName}</p>
                <p className="text-muted-foreground">
                  {f.date} • {f.notes}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-800">{f.quantityKg} KG</p>
                <p className="text-muted-foreground">R$ {f.totalCost.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
