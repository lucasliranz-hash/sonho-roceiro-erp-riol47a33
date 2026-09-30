import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slaughtering } from '@/types/farm'
import { Calendar, Tag, DollarSign, Scale, Layers, ShoppingBag } from 'lucide-react'

interface SlaughterDetailsDialogProps {
  slaughter: Slaughtering | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SlaughterDetailsDialog({
  slaughter,
  open,
  onOpenChange,
}: SlaughterDetailsDialogProps) {
  if (!slaughter) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              🥩 Detalhes do Abate
            </DialogTitle>
            <Badge
              className={
                slaughter.destination === 'Venda'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }
            >
              {slaughter.destination}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-xs pt-2">
          {/* Dados gerais */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <span className="text-muted-foreground block text-[11px]">Data</span>
              <strong className="text-foreground">{slaughter.date}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Espécie</span>
              <strong className="text-foreground">{slaughter.species}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Origem</span>
              <strong className="text-foreground">
                {slaughter.lotName
                  ? `Lote: ${slaughter.lotName}`
                  : slaughter.animalCode
                    ? `Animal: #${slaughter.animalCode}`
                    : 'Não especificado'}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Qtd Animais</span>
              <strong className="text-foreground">{slaughter.quantityAnimals} aves</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Peso Vivo Total</span>
              <strong className="text-foreground">{slaughter.totalLiveWeightKg} kg</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Peso Vivo Médio</span>
              <strong className="text-foreground">{slaughter.averageLiveWeightKg} kg</strong>
            </div>
          </div>

          {/* Carcaça e rendimento */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 grid grid-cols-2 gap-3 text-center">
            <div>
              <span className="text-muted-foreground block text-[11px]">Peso Total Carcaça</span>
              <span className="text-lg font-bold text-amber-950">
                {slaughter.carcassWeightKg} kg
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Rendimento Carcaça</span>
              <span className="text-lg font-bold text-amber-900">
                {slaughter.carcassYieldPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Estrutura de Custos */}
          <div className="p-3.5 rounded-2xl bg-white border border-border space-y-2">
            <span className="font-bold text-foreground block">Composição de Custos</span>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo de Produção Acumulado:</span>
                <span className="font-semibold text-foreground">
                  R$ {slaughter.accumulatedProductionCost?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custos Operacionais do Abate:</span>
                <span className="font-semibold text-foreground">
                  R$ {slaughter.slaughterOperationalCost?.toFixed(2) || '0.00'}
                </span>
              </div>

              {slaughter.costs && slaughter.costs.length > 0 && (
                <div className="pl-3 py-1 border-l-2 border-border space-y-1 text-[11px] text-muted-foreground">
                  {slaughter.costs.map((c) => (
                    <div key={c.id} className="flex justify-between">
                      <span>
                        • {c.description || c.category} ({c.category})
                      </span>
                      <span>R$ {Number(c.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-border font-bold">
                <span className="text-foreground">Custo Total da Carne:</span>
                <span className="text-rose-600">
                  R$ {slaughter.totalCost?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Custo por kg de carcaça:</span>
                <span className="font-bold text-foreground">
                  R$ {slaughter.costPerCarcassKg?.toFixed(2) || '0.00'} / kg
                </span>
              </div>
            </div>
          </div>

          {/* Venda se aplicável */}
          {slaughter.destination === 'Venda' && slaughter.sale && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-950 block">Dados da Venda Realizada</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Cliente</span>
                  <strong className="text-foreground">{slaughter.sale.customerName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Data da Venda</span>
                  <strong className="text-foreground">{slaughter.sale.saleDate}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Qtd Vendida</span>
                  <strong className="text-foreground">{slaughter.sale.quantityKg} kg</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Preço / kg</span>
                  <strong className="text-foreground">
                    R$ {Number(slaughter.sale.pricePerKg).toFixed(2)}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Pagamento</span>
                  <strong className="text-foreground">
                    {slaughter.sale.paymentMethod} ({slaughter.sale.paymentStatus})
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Receita Total</span>
                  <strong className="text-emerald-700">
                    R$ {Number(slaughter.sale.totalPrice).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-emerald-100 flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] text-muted-foreground block">
                    Lucro Líquido Apurado
                  </span>
                  <strong
                    className={`text-sm ${
                      (slaughter.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    R$ {(slaughter.netProfit || 0).toFixed(2)}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Margem</span>
                  <strong
                    className={`text-sm ${
                      (slaughter.marginPercent || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {(slaughter.marginPercent || 0).toFixed(1)}%
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Subprodutos se houver */}
          {slaughter.subproducts && slaughter.subproducts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-2">
              <span className="font-bold text-foreground block">Subprodutos Registrados</span>
              <div className="space-y-1">
                {slaughter.subproducts.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex justify-between items-center text-xs py-1 border-b border-border/50 last:border-0"
                  >
                    <span>
                      {sub.type} ({sub.destination})
                    </span>
                    <span className="font-semibold">{sub.quantityKg} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slaughter.notes && (
            <div className="p-3 rounded-xl bg-secondary/40 text-xs text-muted-foreground">
              <span className="font-bold text-foreground block mb-0.5">Observações:</span>
              <p>{slaughter.notes}</p>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
