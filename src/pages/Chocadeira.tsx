import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, Thermometer, Droplets, ChevronRight, Egg, Calendar } from 'lucide-react'
import { IncubationDetail } from '@/components/IncubationDetail'

export default function Chocadeira() {
  const { incubations } = useFarmStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = incubations.find((i) => i.id === selectedId) || null

  if (selected) {
    return <IncubationDetail incubation={selected} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-600" /> Chocadeira e Incubações
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Toque em uma incubação para ver detalhes, editar, excluir e registrar ovoscopias.
        </p>
      </div>

      {incubations.length === 0 ? (
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-8 text-center">
          <Flame className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhuma incubação ativa</p>
          <p className="text-xs text-muted-foreground mt-1">
            Inicie uma nova incubação através de "Novo Lançamento".
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incubations.map((inc) => {
            const day = Math.max(
              1,
              Math.floor((Date.now() - new Date(inc.startDate).getTime()) / 86400000) + 1,
            )
            const badgeClass =
              inc.status === 'Em andamento'
                ? 'bg-orange-100 text-orange-800 text-xs'
                : inc.status === 'Concluído'
                  ? 'bg-emerald-100 text-emerald-800 text-xs'
                  : 'bg-gray-100 text-gray-800 text-xs'
            return (
              <Card
                key={inc.id}
                onClick={() => setSelectedId(inc.id)}
                className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all cursor-pointer group"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-sm">
                      {inc.code} • {inc.incubatorName}
                    </span>
                    <Badge className={badgeClass}>{inc.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs bg-secondary/30 p-3 rounded-2xl">
                    <div>
                      <span className="text-muted-foreground block">Ovos</span>
                      <span className="font-bold text-foreground">{inc.eggCount} ovos</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Dia Atual</span>
                      <span className="font-bold text-orange-700">{day} / 21</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Início</span>
                      <span className="font-bold text-foreground">{inc.startDate}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Nascimento Previsto</span>
                      <span className="font-bold text-orange-700">{inc.expectedHatchDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs pt-1">
                    <span className="flex items-center gap-1 text-orange-700">
                      <Thermometer className="w-3.5 h-3.5" /> {inc.targetTemp}°C
                    </span>
                    <span className="flex items-center gap-1 text-blue-700">
                      <Droplets className="w-3.5 h-3.5" /> {inc.targetHumidity}%
                    </span>
                    <span className="ml-auto text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ver detalhes <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
