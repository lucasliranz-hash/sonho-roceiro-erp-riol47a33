import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useFarmStore } from '@/hooks/use-farm-store'
import { computeLotLiveQuantity, computeLotAccumulatedCostPerAnimal } from '@/lib/calculations'
import { Sale, BirdSaleType } from '@/types/farm'
import { ShoppingCart, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

export interface SaleFormData {
  date: string
  customerName: string
  product: string
  birdType: BirdSaleType
  lotId?: string
  slaughterId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  paymentMethod: string
  isPaid: boolean
  notes?: string
}

interface NovaVendaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingSale?: Sale | null
  onSubmit: (data: SaleFormData) => Promise<void>
}

const PRODUCTS_LIVE = [
  'Frangos vivos',
  'Galinhas',
  'Pintinhos',
  'Matrizes',
  'Reprodutores',
  'Aves vivas',
]

const PRODUCTS_SLAUGHTERED = [
  'Frangos abatidos',
  'Carne / Carcaça',
  'Cortes de frango',
  'Frango Caipira Abatido',
]

const PRODUCTS_OTHER = ['Ovos', 'Ovos férteis', 'Esterco / Adubo', 'Outros']

export function NovaVendaDialog({
  open,
  onOpenChange,
  editingSale,
  onSubmit,
}: NovaVendaDialogProps) {
  const { lots, mortality, slaughterings, sales, expenses, feedLogs, inventory } = useFarmStore()

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [customerName, setCustomerName] = useState<string>('')
  const [productCategory, setProductCategory] = useState<'LIVE' | 'SLAUGHTERED' | 'OTHER'>('LIVE')
  const [product, setProduct] = useState<string>('Frangos vivos')
  const [lotId, setLotId] = useState<string>('')
  const [slaughterId, setSlaughterId] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('1')
  const [unitPrice, setUnitPrice] = useState<string>('30.00')
  const [paymentMethod, setPaymentMethod] = useState<string>('Pix')
  const [isPaid, setIsPaid] = useState<boolean>(true)
  const [notes, setNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Determinar lotes ativos com aves vivas
  const activeLots = useMemo(() => {
    return lots.filter((l) => {
      const live = computeLotLiveQuantity(l, mortality, slaughterings, sales)
      return (l.status as string) !== 'Finalizado' && (l.status as string) !== 'Abatido' && live > 0
    })
  }, [lots, mortality, slaughterings, sales])

  // Lotes que já tiveram abates ou abates disponíveis
  const availableSlaughters = useMemo(() => {
    return slaughterings.filter((s) => !(s as any).deleted_at)
  }, [slaughterings])

  // Quantidade viva do lote selecionado
  const selectedLot = useMemo(() => {
    return lots.find((l) => l.id === lotId) || null
  }, [lots, lotId])

  const selectedLotLiveQty = useMemo(() => {
    if (!selectedLot) return 0
    const live = computeLotLiveQuantity(selectedLot, mortality, slaughterings, sales)
    // Se estiver editando a mesma venda de ave viva deste lote, repõe a quantidade para cálculo
    if (editingSale && editingSale.lotId === selectedLot.id && editingSale.birdType === 'LIVE') {
      return live + (editingSale.quantity || 0)
    }
    return live
  }, [selectedLot, mortality, slaughterings, sales, editingSale])

  // Abate selecionado
  const selectedSlaughter = useMemo(() => {
    return slaughterings.find((s) => s.id === slaughterId) || null
  }, [slaughterings, slaughterId])

  // Quantidade disponível de carne/carcaça no estoque
  const carneStockItem = useMemo(() => {
    return (
      inventory.find(
        (i) =>
          i.category === 'Carne' ||
          (i.name && i.name.toLowerCase().includes('carcaça')) ||
          (i.name && i.name.toLowerCase().includes('carne')),
      ) || null
    )
  }, [inventory])

  // Preencher quando abrir para edição
  useEffect(() => {
    if (open) {
      setValidationError(null)
      if (editingSale) {
        setDate(editingSale.date || new Date().toISOString().split('T')[0])
        setCustomerName(editingSale.customerName || '')
        setQuantity(String(editingSale.quantity || 1))
        setUnitPrice(String(editingSale.unitPrice || 0))
        setPaymentMethod(editingSale.paymentMethod || 'Pix')
        setIsPaid(editingSale.isPaid ?? true)
        setNotes(editingSale.notes || '')
        setLotId(editingSale.lotId || '')
        setSlaughterId(editingSale.slaughterId || '')

        if (editingSale.birdType === 'LIVE') {
          setProductCategory('LIVE')
          setProduct(editingSale.product || 'Frangos vivos')
        } else if (editingSale.birdType === 'SLAUGHTERED') {
          setProductCategory('SLAUGHTERED')
          setProduct(editingSale.product || 'Frangos abatidos')
        } else {
          // Heurística se não tiver birdType explícito
          const prodLower = (editingSale.product || '').toLowerCase()
          if (prodLower.includes('abatid') || prodLower.includes('carne')) {
            setProductCategory('SLAUGHTERED')
          } else if (
            prodLower.includes('frango') ||
            prodLower.includes('galinha') ||
            prodLower.includes('pint') ||
            prodLower.includes('matriz')
          ) {
            setProductCategory('LIVE')
          } else {
            setProductCategory('OTHER')
          }
          setProduct(editingSale.product || 'Outros')
        }
      } else {
        // Nova venda default
        setDate(new Date().toISOString().split('T')[0])
        setCustomerName('')
        setProductCategory('LIVE')
        setProduct('Frangos vivos')
        setQuantity('1')
        setUnitPrice('35.00')
        setPaymentMethod('Pix')
        setIsPaid(true)
        setNotes('')
        setLotId(activeLots[0]?.id || '')
        setSlaughterId(availableSlaughters[0]?.id || '')
      }
    }
  }, [open, editingSale, activeLots, availableSlaughters])

  // Troca de categoria de produto
  const handleCategoryChange = (cat: 'LIVE' | 'SLAUGHTERED' | 'OTHER') => {
    setProductCategory(cat)
    setValidationError(null)
    if (cat === 'LIVE') {
      setProduct(PRODUCTS_LIVE[0])
      if (!lotId && activeLots.length > 0) setLotId(activeLots[0].id)
    } else if (cat === 'SLAUGHTERED') {
      setProduct(PRODUCTS_SLAUGHTERED[0])
      if (!slaughterId && availableSlaughters.length > 0) {
        setSlaughterId(availableSlaughters[0].id)
        if (availableSlaughters[0].lotId) setLotId(availableSlaughters[0].lotId)
      }
    } else {
      setProduct(PRODUCTS_OTHER[0])
      setLotId('')
      setSlaughterId('')
    }
  }

  // Custo unitário de referência
  const unitCostRef = useMemo(() => {
    if (productCategory === 'LIVE' && selectedLot) {
      const res = computeLotAccumulatedCostPerAnimal(selectedLot, expenses, feedLogs, [])
      return res.costPerBirdAlive
    }
    if (productCategory === 'SLAUGHTERED') {
      if (selectedSlaughter && selectedSlaughter.unitProductionCost) {
        return selectedSlaughter.unitProductionCost
      }
      if (
        selectedSlaughter &&
        selectedSlaughter.totalCost &&
        selectedSlaughter.quantityAnimals > 0
      ) {
        return Number((selectedSlaughter.totalCost / selectedSlaughter.quantityAnimals).toFixed(2))
      }
      if (carneStockItem && carneStockItem.averageCost) {
        return carneStockItem.averageCost
      }
    }
    return 0
  }, [productCategory, selectedLot, selectedSlaughter, carneStockItem, expenses, feedLogs])

  const parsedQty = Math.max(0, Number(quantity) || 0)
  const parsedPrice = Math.max(0, Number(unitPrice) || 0)
  const totalPrice = Number((parsedQty * parsedPrice).toFixed(2))
  const estimatedCost = Number((parsedQty * unitCostRef).toFixed(2))
  const estimatedProfit = Number((totalPrice - estimatedCost).toFixed(2))
  const estimatedMargin =
    totalPrice > 0 ? Number(((estimatedProfit / totalPrice) * 100).toFixed(1)) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!customerName.trim()) {
      setValidationError('Informe o nome do cliente.')
      return
    }

    if (parsedQty <= 0) {
      setValidationError('Informe uma quantidade maior que zero.')
      return
    }

    // Regra 3: Para ave viva, exigir origem de lote ativo e checar saldo
    if (productCategory === 'LIVE') {
      if (!lotId) {
        setValidationError('Para venda de Ave Viva, é obrigatório selecionar o Lote de Origem.')
        return
      }
      if (parsedQty > selectedLotLiveQty) {
        setValidationError(
          `Quantidade solicitada (${parsedQty}) é maior que o saldo disponível no lote (${selectedLotLiveQty} aves).`,
        )
        return
      }
    }

    // Regra 3: Para ave abatida, origem = abate/lote abatido
    if (productCategory === 'SLAUGHTERED') {
      if (!slaughterId && availableSlaughters.length > 0) {
        // se tiver abates registrados, vincular a um abate
        setSlaughterId(availableSlaughters[0].id)
      }
    }

    setSubmitting(true)
    try {
      await onSubmit({
        date,
        customerName: customerName.trim(),
        product,
        birdType:
          productCategory === 'LIVE'
            ? 'LIVE'
            : productCategory === 'SLAUGHTERED'
              ? 'SLAUGHTERED'
              : 'NONE',
        lotId: productCategory === 'LIVE' ? lotId : selectedSlaughter?.lotId || lotId || undefined,
        slaughterId: productCategory === 'SLAUGHTERED' ? slaughterId : undefined,
        quantity: parsedQty,
        unitPrice: parsedPrice,
        totalPrice,
        paymentMethod,
        isPaid,
        notes: notes.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err: any) {
      setValidationError(err.message || 'Erro ao registrar venda.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {editingSale ? 'Editar Venda' : 'Nova Venda'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Tipo de Venda (Diferenciação clara AVE VIVA vs AVE ABATIDA vs OUTROS) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Tipo de Produto *</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCategoryChange('LIVE')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  productCategory === 'LIVE'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-white text-muted-foreground hover:bg-secondary/60'
                }`}
              >
                <span className="block text-sm">🐓</span>
                <span className="text-[11px] block mt-0.5">Ave Viva</span>
                <span className="text-[9px] text-muted-foreground block">(Baixa no Lote)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('SLAUGHTERED')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  productCategory === 'SLAUGHTERED'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-white text-muted-foreground hover:bg-secondary/60'
                }`}
              >
                <span className="block text-sm">🥩</span>
                <span className="text-[11px] block mt-0.5">Ave Abatida</span>
                <span className="text-[9px] text-muted-foreground block">(Sem dupla baixa)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('OTHER')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  productCategory === 'OTHER'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-white text-muted-foreground hover:bg-secondary/60'
                }`}
              >
                <span className="block text-sm">🥚</span>
                <span className="text-[11px] block mt-0.5">Ovos / Outros</span>
                <span className="text-[9px] text-muted-foreground block">(Sem baixa de ave)</span>
              </button>
            </div>
          </div>

          {/* Dados Gerais: Data e Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data da Venda *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs rounded-xl mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Cliente / Comprador *</Label>
              <Input
                placeholder="Ex: Mercado Central"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 text-xs rounded-xl mt-1"
                required
              />
            </div>
          </div>

          {/* Produto específico */}
          <div>
            <Label className="text-xs">Descrição do Produto *</Label>
            <div className="flex gap-2 mt-1">
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger className="h-9 text-xs rounded-xl flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(productCategory === 'LIVE'
                    ? PRODUCTS_LIVE
                    : productCategory === 'SLAUGHTERED'
                      ? PRODUCTS_SLAUGHTERED
                      : PRODUCTS_OTHER
                  ).map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SE AVE VIVA: Exigir lote ativo e mostrar saldo em tempo real */}
          {productCategory === 'LIVE' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700" /> Origem da Ave Viva
                </span>
                <Badge className="bg-amber-200/80 text-amber-900 text-[10px] hover:bg-amber-200/80">
                  Baixa automática no lote
                </Badge>
              </div>

              {activeLots.length === 0 ? (
                <p className="text-[11px] text-rose-600">
                  Nenhum lote ativo com saldo de aves vivas cadastrado.
                </p>
              ) : (
                <div>
                  <Label className="text-[11px] text-amber-900">Selecione o Lote Ativo *</Label>
                  <Select value={lotId} onValueChange={setLotId}>
                    <SelectTrigger className="h-9 text-xs rounded-xl mt-1 bg-white">
                      <SelectValue placeholder="Selecione o lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLots.map((l) => {
                        const live = computeLotLiveQuantity(l, mortality, slaughterings, sales)
                        return (
                          <SelectItem key={l.id} value={l.id} className="text-xs">
                            {l.code} — {l.name} ({live} vivas disponíveis)
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedLot && (
                <div className="pt-1.5 flex items-center justify-between text-[11px] text-amber-950">
                  <span>Disponível no lote:</span>
                  <span className="font-extrabold text-xs">{selectedLotLiveQty} ave(s)</span>
                </div>
              )}
            </div>
          )}

          {/* SE AVE ABATIDA: Exigir origem de abate / carcaça */}
          {productCategory === 'SLAUGHTERED' && (
            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" /> Origem do Produto Abatido
                </span>
                <Badge className="bg-sky-200/80 text-sky-900 text-[10px] hover:bg-sky-200/80">
                  Não baixa ave viva
                </Badge>
              </div>

              <div>
                <Label className="text-[11px] text-sky-900">Abate de Origem (Opcional)</Label>
                <Select
                  value={slaughterId || 'none'}
                  onValueChange={(val) => {
                    const sid = val === 'none' ? '' : val
                    setSlaughterId(sid)
                    const s = slaughterings.find((item) => item.id === sid)
                    if (s?.lotId) setLotId(s.lotId)
                  }}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl mt-1 bg-white">
                    <SelectValue placeholder="Selecione o abate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      Sem vínculo com abate específico (venda avulsa)
                    </SelectItem>
                    {availableSlaughters.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.date} — {s.species} ({s.quantityAnimals} aves){' '}
                        {s.lotName ? `• Lote: ${s.lotName}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {carneStockItem && (
                <div className="pt-1 flex items-center justify-between text-[11px] text-sky-950">
                  <span>Estoque de carne/carcaça disponível:</span>
                  <span className="font-extrabold text-xs">
                    {carneStockItem.currentStock} {carneStockItem.unit}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quantidade e Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Quantidade *</Label>
              <Input
                type="number"
                min="1"
                max={
                  productCategory === 'LIVE' && selectedLotLiveQty > 0
                    ? selectedLotLiveQty
                    : undefined
                }
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-9 text-xs rounded-xl mt-1 font-bold"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Preço Unitário (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="h-9 text-xs rounded-xl mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Valor Total (R$)</Label>
              <div className="h-9 rounded-xl border border-border bg-secondary/30 px-3 flex items-center font-extrabold text-emerald-700 text-sm mt-1">
                R$ {totalPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Apuração Econômica / Custo e Margem estimada */}
          {unitCostRef > 0 && (
            <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Custo acumulado estimado:</span>
                <span>
                  R$ {estimatedCost.toFixed(2)} (R$ {unitCostRef.toFixed(2)}/un)
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <span className="font-bold text-foreground">Resultado Previsto (Lucro):</span>
                <span
                  className={`font-extrabold ${estimatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                >
                  R$ {estimatedProfit.toFixed(2)} ({estimatedMargin}%)
                </span>
              </div>
            </div>
          )}

          {/* Pagamento e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-9 text-xs rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pix" className="text-xs">
                    Pix
                  </SelectItem>
                  <SelectItem value="Dinheiro" className="text-xs">
                    Dinheiro
                  </SelectItem>
                  <SelectItem value="Cartão de Crédito" className="text-xs">
                    Cartão de Crédito
                  </SelectItem>
                  <SelectItem value="Cartão de Débito" className="text-xs">
                    Cartão de Débito
                  </SelectItem>
                  <SelectItem value="Boleto" className="text-xs">
                    Boleto
                  </SelectItem>
                  <SelectItem value="Transferência" className="text-xs">
                    Transferência
                  </SelectItem>
                  <SelectItem value="A Prazo" className="text-xs">
                    A Prazo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status do Recebimento</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button
                  type="button"
                  variant={isPaid ? 'default' : 'outline'}
                  className="h-9 text-xs rounded-xl font-semibold"
                  onClick={() => setIsPaid(true)}
                >
                  Recebido
                </Button>
                <Button
                  type="button"
                  variant={!isPaid ? 'default' : 'outline'}
                  className="h-9 text-xs rounded-xl font-semibold"
                  onClick={() => setIsPaid(false)}
                >
                  Pendente
                </Button>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              placeholder="Notas adicionais sobre a venda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl mt-1 min-h-[50px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-1/2 rounded-xl h-10 text-xs"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-1/2 rounded-xl h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-white"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : editingSale ? 'Salvar Alterações' : 'Registrar Venda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
export default NovaVendaDialog
