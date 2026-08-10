import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Truck } from 'lucide-react'

export default function Patrimonio() {
  const { assets } = useFarmStore()

  const totalAssetsValue = assets.reduce((acc, a) => acc + a.value, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Truck className="w-6 h-6 text-primary" /> Patrimônio e Bens
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Inventário de equipamentos, chocadeiras e ferramentas da fazenda.
        </p>
      </div>

      <Card className="p-4 rounded-2xl bg-white border-border">
        <span className="text-xs text-muted-foreground">Valor Total do Patrimônio</span>
        <p className="text-2xl font-extrabold text-primary">R$ {totalAssetsValue.toFixed(2)}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((ast) => (
          <Card key={ast.id} className="p-4 rounded-2xl bg-white border-border space-y-1 text-xs">
            <p className="font-bold text-sm text-foreground">{ast.name}</p>
            <p className="text-muted-foreground">
              Categoria: {ast.category} • Estado: {ast.condition}
            </p>
            <p className="font-bold text-primary">Valor: R$ {ast.value.toFixed(2)}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
