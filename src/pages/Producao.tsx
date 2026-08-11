import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Wheat, Scale, Skull, Egg, TrendingUp } from 'lucide-react'

export default function Producao() {
  const { feedLogs, weighings, mortality, eggs, lots } = useFarmStore()

  const totalFeedKg = feedLogs.reduce((acc, f) => acc + f.quantityKg, 0)
  const totalEggs = eggs.reduce((acc, e) => acc + e.collected, 0)
  const totalMortality = mortality.reduce((acc, m) => acc + m.quantity, 0)
  const avgWeight =
    weighings.length > 0
      ? weighings.reduce((acc, w) => acc + w.averageWeightKg, 0) / weighings.length
      : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Produção Geral
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Visão consolidada da produção de todas as atividades da propriedade.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wheat className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Ração Consumida</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalFeedKg} KG</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Egg className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Ovos Coletados</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalEggs}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Peso Médio</span>
            </div>
            <p className="text-xl font-bold text-foreground">{avgWeight.toFixed(2)} KG</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Skull className="w-4 h-4 text-rose-600" />
              <span className="text-xs text-muted-foreground">Mortalidade</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalMortality} aves</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl bg-white border-border p-5">
        <h2 className="text-base font-bold mb-4">Produção por Lote</h2>
        <div className="space-y-3">
          {lots.map((lot) => {
            const lotFeed = feedLogs.filter((f) => f.lotId === lot.id)
            const lotEggs = eggs.filter((e) => e.lotId === lot.id)
            const lotMort = mortality.filter((m) => m.lotId === lot.id)
            const feedKg = lotFeed.reduce((acc, f) => acc + f.quantityKg, 0)
            const eggCount = lotEggs.reduce((acc, e) => acc + e.collected, 0)
            const mortCount = lotMort.reduce((acc, m) => acc + m.quantity, 0)

            return (
              <div key={lot.id} className="p-4 rounded-2xl bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{lot.name}</span>
                  <span className="text-xs text-muted-foreground">{lot.currentQuantity} aves</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 rounded-xl bg-amber-50">
                    <span className="block text-muted-foreground">Ração</span>
                    <span className="font-bold text-amber-800">{feedKg} KG</span>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-yellow-50">
                    <span className="block text-muted-foreground">Ovos</span>
                    <span className="font-bold text-yellow-800">{eggCount}</span>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-rose-50">
                    <span className="block text-muted-foreground">Perdas</span>
                    <span className="font-bold text-rose-800">{mortCount}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
