import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'

export default function Indicadores() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" /> Indicadores por Atividade
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Análise detalhada do custo por kg produzido, custo por ovo e conversão alimentar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 rounded-3xl bg-white border-border space-y-2">
          <h3 className="font-bold text-base text-primary">Poedeiras</h3>
          <p className="text-xs text-muted-foreground">
            Custo Médio por Ovo Produzido:{' '}
            <span className="font-bold text-foreground">R$ 0.32</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Taxa Média de Postura: <span className="font-bold text-emerald-700">84.5%</span>
          </p>
        </Card>

        <Card className="p-5 rounded-3xl bg-white border-border space-y-2">
          <h3 className="font-bold text-base text-primary">Frangos de Corte / Caipira</h3>
          <p className="text-xs text-muted-foreground">
            Conversão Alimentar Estimada:{' '}
            <span className="font-bold text-foreground">2.1 KG / KG</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Custo por KG Vivo: <span className="font-bold text-emerald-700">R$ 7.40</span>
          </p>
        </Card>
      </div>
    </div>
  )
}
