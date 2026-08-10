import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Skull } from 'lucide-react'

export default function Mortalidade() {
  const { mortality } = useFarmStore()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Skull className="w-6 h-6 text-rose-600" /> Registro de Mortalidade
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Controle sanitário de perdas por lote para identificação precoce de problemas.
        </p>
      </div>

      <div className="space-y-3">
        {mortality.map((m) => (
          <Card
            key={m.id}
            className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs border-l-4 border-l-rose-500"
          >
            <div>
              <p className="font-bold text-sm text-foreground">{m.lotName}</p>
              <p className="text-muted-foreground">Causa: {m.cause}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-rose-600 block">{m.quantity} aves</span>
              <span className="text-muted-foreground">{m.date}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
