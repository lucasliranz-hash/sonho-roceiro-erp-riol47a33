import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Bird } from 'lucide-react'

export default function Matrizes() {
  const { animals } = useFarmStore()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Bird className="w-6 h-6 text-emerald-700" /> Matrizes e Reprodutores
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Registro individual de galos e galinhas reprodutoras da propriedade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {animals.map((an) => (
          <Card key={an.id} className="p-5 rounded-3xl bg-white border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary text-sm">{an.code}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {an.sex}
              </span>
            </div>
            <p className="font-extrabold text-base">{an.breed}</p>
            <p className="text-xs text-muted-foreground">
              Peso Atual: {an.weightKg} KG • Origem: {an.origin}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
