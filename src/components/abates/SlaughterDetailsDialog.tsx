import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slaughtering } from '@/types/farm'
import { Pencil } from 'lucide-react'

interface SlaughterDetailsDialogProps {
  slaughter: Slaughtering | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (slaughter: Slaughtering) => void
}

export function SlaughterDetailsDialog({
  slaughter,
  open,
  onOpenChange,
  onEdit,
}: SlaughterDetailsDialogProps) {
  if (!slaughter) return null

  const isVenda = slaughter.destination === 'Venda'
  const saleInfo =
    slaughter.saleSimple ||
    (slaughter.sale
      ? {
          customerName: slaughter.sale.customerName,
          saleDate: slaughter.sale.saleDate,
          quantitySold: slaughter.sale.quantityKg,
          totalValue: slaughter.sale.totalPrice || slaughter.revenue || 0,
          paymentMethod: slaughter.sale.paymentMethod,
          isPaid: slaughter.sale.paymentStatus === 'Pago',
          notes: slaughter.sale.notes,
        }
      : undefined)

  const revenue = isVenda ? saleInfo?.totalValue || slaughter.revenue || 0 : 0
  const totalCost = slaughter.totalCost || slaughter.accumulatedProductionCost || 0
  const result = isVenda ? revenue - totalCost : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              🥩 Detalhes do Abate
            </DialogTitle>
            <Badge
              className={
                isVenda
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs font-semibold'
              }
            >
              {slaughter.destination}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-xs pt-2">
          {/* Dados Principais */}
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground block text-[11px]">Data</span>
                <strong className="text-foreground text-xs">{slaughter.date}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Lote de Origem</span>
                <strong className="text-foreground text-xs">
                  {slaughter.lotName || 'Lote não informado'}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
              <div>
                <span className="text-muted-foreground block text-[11px]">Espécie</span>
                <strong className="text-foreground text-xs">{slaughter.species || '—'}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Quantidade</span>
                <strong className="text-foreground text-xs">
                  {slaughter.quantityAnimals} {slaughter.quantityAnimals === 1 ? 'ave' : 'aves'}
                </strong>
              </div>
            </div>

            {(slaughter.animalCode || slaughter.totalLiveWeightKg) && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                {slaughter.animalCode && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Animal</span>
                    <strong className="text-foreground text-xs">#{slaughter.animalCode}</strong>
                  </div>
                )}
                {slaughter.totalLiveWeightKg ? (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Peso Vivo</span>
                    <strong className="text-foreground text-xs">
                      {slaughter.totalLiveWeightKg} kg
                    </strong>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Custo dos Animais */}
          <div className="p-4 rounded-2xl bg-white border border-border space-y-2">
            <span className="font-bold text-foreground block">Custo de Produção</span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Custo dos animais abatidos:</span>
              <strong className="text-sm text-rose-600 font-bold">
                R${' '}
                {totalCost.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
            {slaughter.unitProductionCost ? (
              <span className="text-[11px] text-muted-foreground block">
                Custo unitário acumulado: R$ {slaughter.unitProductionCost.toFixed(2)} / ave
              </span>
            ) : null}
          </div>

          {/* Se foi Venda Comercial */}
          {isVenda && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
              <span className="font-bold text-emerald-950 block">Dados da Venda</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {saleInfo?.customerName && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Cliente</span>
                    <strong className="text-foreground text-xs">{saleInfo.customerName}</strong>
                  </div>
                )}
                {saleInfo?.saleDate && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Data Venda</span>
                    <strong className="text-foreground text-xs">{saleInfo.saleDate}</strong>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block text-[11px]">Valor da Venda</span>
                  <strong className="text-emerald-700 text-xs">
                    R${' '}
                    {revenue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Resultado</span>
                  <strong
                    className={`text-xs font-bold ${result >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                  >
                    R${' '}
                    {result.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          {slaughter.notes && (
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs text-muted-foreground">
              <span className="font-bold text-foreground block mb-0.5">Observações:</span>
              <p>{slaughter.notes}</p>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(slaughter)
                }}
                className="rounded-xl text-xs gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Button>
            )}
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
export default SlaughterDetailsDialog
