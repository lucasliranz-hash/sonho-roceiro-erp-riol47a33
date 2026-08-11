import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle } from 'lucide-react'

export default function Estoque() {
  const { inventory } = useFarmStore()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" /> Estoque de Insumos e Ração
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Acompanhamento automático do nível de ração, vacinas e sacos no galpão.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {inventory.length === 0 && (
          <Card className="rounded-3xl bg-white border-border shadow-subtle col-span-full">
            <CardContent className="p-8 text-center">
              <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhum item cadastrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use "Novo Lançamento" para adicionar itens ao estoque.
              </p>
            </CardContent>
          </Card>
        )}
        {inventory.map((item) => {
          const isLow = item.currentStock <= item.minStock
          return (
            <Card
              key={item.id}
              className={`rounded-3xl bg-white border-border shadow-subtle p-5 ${isLow ? 'border-amber-300 bg-amber-50/20' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground">{item.category}</span>
                {isLow ? (
                  <Badge className="bg-amber-100 text-amber-800 text-[10px] gap-1">
                    <AlertTriangle className="w-3 h-3" /> Estoque Baixo
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Normal</Badge>
                )}
              </div>
              <h3 className="font-bold text-base text-foreground">{item.name}</h3>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Quantidade Atual</span>
                  <span className="text-xl font-extrabold text-foreground">
                    {item.currentStock} {item.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">Custo Médio</span>
                  <span className="text-sm font-bold text-primary">
                    R$ {item.averageCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
