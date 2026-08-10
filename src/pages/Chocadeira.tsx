import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

export default function Chocadeira() {
  const { incubations, candlings } = useFarmStore()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-600" /> Chocadeira e Incubações
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Linha do tempo de 21 dias, controle de ovoscopia e taxa de eclosão.
        </p>
      </div>

      {incubations.map((inc) => (
        <Card key={inc.id} className="rounded-3xl bg-white border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary text-sm">
              {inc.code} • {inc.incubatorName}
            </span>
            <Badge className="bg-orange-100 text-orange-800 text-xs">{inc.status}</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-secondary/30 p-3 rounded-2xl">
            <div>
              <span className="text-muted-foreground block">Ovos Colocados</span>
              <span className="font-bold text-foreground">{inc.eggCount} ovos</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Início</span>
              <span className="font-bold text-foreground">{inc.startDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Nascimento Previsto</span>
              <span className="font-bold text-orange-700">{inc.expectedHatchDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Temperatura Alvo</span>
              <span className="font-bold text-foreground">{inc.targetTemp}°C</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">
              Linha do Tempo de 21 Dias
            </h4>
            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                Dia 1: Início
              </div>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                Dia 7: Ovoscopia 1
              </div>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 font-bold">
                Dia 14: Ovoscopia 2
              </div>
              <div className="p-2 rounded-xl bg-secondary text-muted-foreground">
                Dia 18: Lockdown
              </div>
              <div className="p-2 rounded-xl bg-secondary text-muted-foreground">
                Dia 21: Nascimento
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
