import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Egg } from 'lucide-react'

export default function Ovos() {
  const { eggs } = useFarmStore()

  const totalCollected = eggs.reduce((acc, e) => acc + e.collected, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Egg className="w-6 h-6 text-amber-600" /> Produção e Coleta de Ovos
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Acompanhamento diário da taxa de postura e estoque de ovos para venda e incubação.
        </p>
      </div>

      <Card className="p-5 rounded-3xl bg-amber-500/10 border-amber-200">
        <span className="text-xs font-bold text-amber-800">
          Quantos ovos foram coletados hoje? 🥚
        </span>
        <p className="text-3xl font-extrabold text-amber-900 mt-1">
          {totalCollected} Ovos Coletados
        </p>
      </Card>

      <div className="space-y-2">
        {eggs.map((e) => (
          <Card
            key={e.id}
            className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs"
          >
            <div>
              <p className="font-bold text-foreground">{e.lotName}</p>
              <p className="text-muted-foreground">{e.date}</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-amber-800 text-base">{e.collected} Ovos</p>
              <p className="text-[10px] text-muted-foreground">Quebrados: {e.broken}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
