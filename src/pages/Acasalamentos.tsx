import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Dna } from 'lucide-react'

export default function Acasalamentos() {
  const { matings } = useFarmStore()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Dna className="w-6 h-6 text-purple-600" /> Genética e Acasalamentos
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Planejamento de cruzamentos dirigidos para ganho de peso e rusticidade.
        </p>
      </div>

      {matings.map((m) => (
        <Card key={m.id} className="p-5 rounded-3xl bg-white border-border space-y-2 text-xs">
          <p className="font-bold text-sm text-primary">Galo: {m.roosterCode}</p>
          <p className="text-muted-foreground">Galinhas no grupo: {m.henCodes.join(', ')}</p>
          <p className="font-semibold text-foreground">Objetivo: {m.goal}</p>
        </Card>
      ))}
    </div>
  )
}
