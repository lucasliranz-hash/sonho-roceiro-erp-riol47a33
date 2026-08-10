import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Scale } from 'lucide-react'

export default function Pesagens() {
  const { weighings } = useFarmStore()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-600" /> Pesagens e Curva de Crescimento
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Acompanhe o peso médio e o ganho médio diário (GMD) dos frangos de corte e caipiras.
        </p>
      </div>

      <div className="space-y-3">
        {weighings.map((w) => (
          <Card
            key={w.id}
            className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs"
          >
            <div>
              <p className="font-bold text-sm text-foreground">{w.lotName}</p>
              <p className="text-muted-foreground">
                Amostra: {w.weighedCount} aves | Idade: {w.ageDays} dias
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-blue-700 block">
                {w.averageWeightKg} KG
              </span>
              <span className="text-[11px] text-muted-foreground">
                GMD: +{w.dailyGainGrams || 0}g/dia
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
