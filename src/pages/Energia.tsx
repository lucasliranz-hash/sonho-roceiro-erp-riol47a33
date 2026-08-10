import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Zap } from 'lucide-react'

export default function Energia() {
  const { energyLogs } = useFarmStore()

  const totalCost = energyLogs.reduce((acc, e) => acc + e.totalCost, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" /> Controle de Energia
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Acompanhamento do consumo em kWh da chocadeira e campânulas aquecidas.
        </p>
      </div>

      <Card className="p-4 rounded-2xl bg-white border-border">
        <span className="text-xs text-muted-foreground">Custo Total com Energia</span>
        <p className="text-2xl font-extrabold text-yellow-700">R$ {totalCost.toFixed(2)}</p>
      </Card>

      <div className="space-y-2">
        {energyLogs.map((e) => (
          <Card
            key={e.id}
            className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs"
          >
            <div>
              <p className="font-bold">{e.equipment}</p>
              <p className="text-muted-foreground">{e.hours} horas de funcionamento</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-yellow-700">{e.consumptionKwh} kWh</p>
              <p className="text-muted-foreground">R$ {e.totalCost.toFixed(2)}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
