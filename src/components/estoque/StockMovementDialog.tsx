import { useState, useMemo } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { useFarmStore } from '@/hooks/use-farm-store'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import { ArrowDown, ArrowUp, Calculator, Syringe, Sparkles, AlertTriangle } from 'lucide-react'

const SANITARY_CATEGORIES = [
  'Vacinas',
  'Medicamentos',
  'Suplementos',
  'Vermífugos',
  'Outros produtos sanitários',
]

interface StockMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'entrada' | 'saida'
}

export function StockMovementDialog({ open, onOpenChange, type }: StockMovementDialogProps) {
  const { inventory, addStockMovement, updateInventory } = useFarmStore()

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [movementType, setMovementType] = useState(type === 'entrada' ? 'Compra' : 'Consumo')
  const [quantity, setQuantity] = useState('')
  const [unitValue, setUnitValue] = useState('')
  const [notes, setNotes] = useState('')
  const [supplier, setSupplier] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')

  // Sanitary specialized entry fields
  const [packageQty, setPackageQty] = useState('1')
  const [valPerPackage, setValPerPackage] = useState('')
  const [manufacturerBatch, setManufacturerBatch] = useState('')
  const [manufacturingDate, setManufacturingDate] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])

  const selectedItem = useMemo(
    () => inventory.find((i) => i.id === inventoryItemId),
    [inventory, inventoryItemId],
  )

  const isSanitary = selectedItem ? SANITARY_CATEGORIES.includes(selectedItem.category) : false
  const contentPerPkg = selectedItem?.content_per_package || 1
  const itemUnit = selectedItem?.unit || 'un'
  const pkgType = selectedItem?.packaging_type || 'Frasco'

  // Computed values for sanitary entry
  const computedSanitaryTotalQty = (Number(packageQty) || 0) * contentPerPkg
  const computedSanitaryTotalValue = (Number(packageQty) || 0) * (Number(valPerPackage) || 0)
  const computedSanitaryUnitCost =
    computedSanitaryTotalQty > 0 ? computedSanitaryTotalValue / computedSanitaryTotalQty : 0

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0])
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setInventoryItemId('')
    setMovementType(type === 'entrada' ? 'Compra' : 'Consumo')
    setQuantity('')
    setUnitValue('')
    setNotes('')
    setSupplier('')
    setDocumentNumber('')
    setPackageQty('1')
    setValPerPackage('')
    setManufacturerBatch('')
    setManufacturingDate('')
    setExpirationDate('')
  }

  // Pre-fill item specific data when selection changes
  const handleItemSelect = (id: string) => {
    setInventoryItemId(id)
    const itm = inventory.find((i) => i.id === id)
    if (itm) {
      if (itm.supplier) setSupplier(itm.supplier)
      if (itm.manufacturer_batch) setManufacturerBatch(itm.manufacturer_batch)
      if (itm.expiration_date) setExpirationDate(itm.expiration_date)
      if (itm.manufacturing_date) setManufacturingDate(itm.manufacturing_date)
      if (type === 'saida') {
        setUnitValue(String(itm.averageCost || 0))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inventoryItemId) {
      toast({ title: 'Selecione um item', variant: 'destructive' })
      return
    }

    if (!selectedItem) {
      toast({ title: 'Item não encontrado', variant: 'destructive' })
      return
    }

    let moveQty = 0
    let unitCost = 0
    let totalVal = 0

    if (isSanitary && type === 'entrada') {
      moveQty = computedSanitaryTotalQty
      unitCost = computedSanitaryUnitCost
      totalVal = computedSanitaryTotalValue
    } else {
      moveQty = Number(quantity) || 0
      unitCost = Number(unitValue) || 0
      totalVal = moveQty * unitCost
    }

    if (moveQty <= 0) {
      toast({ title: 'Quantidade deve ser maior que zero', variant: 'destructive' })
      return
    }

    if (type === 'saida' && moveQty > selectedItem.currentStock) {
      toast({
        title: 'Estoque insuficiente',
        description: `Disponível: ${selectedItem.currentStock} ${selectedItem.unit}`,
        variant: 'destructive',
      })
      return
    }

    const currentStock = selectedItem.currentStock || 0
    const currentAvgCost = selectedItem.averageCost || 0
    let newStock = currentStock
    let newAvgCost = currentAvgCost

    if (type === 'entrada') {
      newStock = currentStock + moveQty
      // CUSTO MÉDIO PONDERADO:
      // novo custo médio = (valor estoque atual + valor nova entrada) / (quantidade atual + quantidade nova)
      const currentTotalValue = currentStock * currentAvgCost
      const newTotalValue = totalVal
      newAvgCost = newStock > 0 ? (currentTotalValue + newTotalValue) / newStock : unitCost
    } else {
      newStock = Math.max(0, currentStock - moveQty)
      // Na saída o custo médio unitário permanece o mesmo
    }

    // 1. Gravar movimentação
    const movementPayload = {
      date,
      inventoryItemId: selectedItem.id,
      inventoryItemName: selectedItem.name,
      type,
      movementType,
      quantity: moveQty,
      unit: selectedItem.unit,
      balanceAfter: Number(newStock.toFixed(3)),
      unitValue: Number(unitCost.toFixed(4)),
      totalValue: Number(totalVal.toFixed(2)),
      notes: notes.trim() || undefined,
      supplier: supplier.trim() || undefined,
      documentNumber: documentNumber.trim() || undefined,
      package_quantity:
        isSanitary && type === 'entrada' ? Number(packageQty) || undefined : undefined,
      value_per_package:
        isSanitary && type === 'entrada' ? Number(valPerPackage) || undefined : undefined,
      manufacturer_batch: manufacturerBatch.trim() || undefined,
      manufacturing_date: manufacturingDate || undefined,
      expiration_date: expirationDate || undefined,
      purchase_date: purchaseDate || undefined,
    }

    const { error: moveError } = await addStockMovement(movementPayload)
    if (moveError) {
      toast({
        title: 'Erro ao registrar movimentação',
        description: moveError.message,
        variant: 'destructive',
      })
      return
    }

    // 2. Atualizar estoque do item
    const updatePayload: Partial<typeof selectedItem> = {
      currentStock: Number(newStock.toFixed(3)),
      averageCost: Number(newAvgCost.toFixed(4)),
      lastUpdated: new Date().toISOString().split('T')[0],
    }

    if (isSanitary && type === 'entrada') {
      if (manufacturerBatch.trim()) updatePayload.manufacturer_batch = manufacturerBatch.trim()
      if (expirationDate) updatePayload.expiration_date = expirationDate
      if (manufacturingDate) updatePayload.manufacturing_date = manufacturingDate
      if (supplier.trim()) updatePayload.supplier = supplier.trim()
    }

    const { error: invError } = await updateInventory(selectedItem.id, updatePayload)
    if (invError) {
      toast({
        title: 'Erro ao atualizar saldo do item',
        description: invError.message,
        variant: 'destructive',
      })
      return
    }

    await logAudit('INSERT', 'farm_stock_movements', 'new', null, {
      movement: movementPayload,
      updatedStock: newStock,
      updatedAvgCost: newAvgCost,
    })

    toast({
      title: type === 'entrada' ? 'Entrada registrada! 📥' : 'Saída registrada! 📤',
      description: `Novo saldo: ${newStock.toFixed(2)} ${selectedItem.unit} (Custo médio: R$ ${newAvgCost.toFixed(2)}/${selectedItem.unit})`,
    })

    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {type === 'entrada' ? (
              <ArrowDown className="w-5 h-5 text-emerald-600" />
            ) : (
              <ArrowUp className="w-5 h-5 text-rose-600" />
            )}
            {type === 'entrada' ? 'Registrar Entrada de Estoque' : 'Registrar Saída de Estoque'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data da Operação *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Tipo de Movimento *</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {type === 'entrada' ? (
                    <>
                      <SelectItem value="Compra">Compra / Aquisição</SelectItem>
                      <SelectItem value="Ajuste">Ajuste / Inventário (+)</SelectItem>
                      <SelectItem value="Devolução">Devolução (+)</SelectItem>
                      <SelectItem value="Bonificação">Bonificação / Amostra</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Consumo">Consumo Interno</SelectItem>
                      <SelectItem value="Ajuste">Ajuste / Quebra (-)</SelectItem>
                      <SelectItem value="Perda">Perda / Descarte / Vencido</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Item do Estoque *</Label>
            <Select value={inventoryItemId} onValueChange={handleItemSelect}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Selecione um item..." />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name} ({i.category}) — Saldo: {i.currentStock} {i.unit} (R${' '}
                    {i.averageCost.toFixed(2)}/{i.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ======================================================== */}
          {/* ENTRADA ESPECÍFICA PARA VACINAS E PRODUTOS SANITÁRIOS   */}
          {/* ======================================================== */}
          {isSanitary && type === 'entrada' ? (
            <div className="space-y-3.5 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                <Syringe className="w-4 h-4 text-emerald-600" />
                Cálculo de Frascos & Rastreabilidade do Fabricante
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Qtd de {pkgType}s Comprados *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={packageQty}
                    onChange={(e) => setPackageQty(e.target.value)}
                    placeholder="Ex: 1"
                    className="h-10 text-xs rounded-xl bg-white"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Conteúdo: {contentPerPkg} {itemUnit}s por {pkgType.toLowerCase()}
                  </span>
                </div>

                <div>
                  <Label className="text-xs">Valor por {pkgType} (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valPerPackage}
                    onChange={(e) => setValPerPackage(e.target.value)}
                    placeholder="Ex: 65.00"
                    className="h-10 text-xs rounded-xl bg-white"
                    required
                  />
                </div>
              </div>

              {/* Cálculos em destaque */}
              <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-300/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-emerald-800 block">Qtd Total que entrará:</span>
                  <strong className="text-emerald-950 text-sm">
                    {computedSanitaryTotalQty} {itemUnit}s
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-800 block">
                    Custo Unitário da Entrada:
                  </span>
                  <strong className="text-emerald-950 text-sm">
                    R$ {computedSanitaryUnitCost.toFixed(4)} / {itemUnit}
                  </strong>
                </div>
              </div>

              {/* Rastreabilidade e Lote do Fabricante */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-200/40">
                <div>
                  <Label className="text-xs">Lote Fabricante</Label>
                  <Input
                    value={manufacturerBatch}
                    onChange={(e) => setManufacturerBatch(e.target.value)}
                    placeholder="Ex: LOTE-894"
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs">Fabricação</Label>
                  <Input
                    type="date"
                    value={manufacturingDate}
                    onChange={(e) => setManufacturingDate(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs">Validade</Label>
                  <Input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ENTRADA/SAÍDA PADRÃO OU SAÍDA SANITÁRIA */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">
                    Quantidade ({selectedItem ? selectedItem.unit : 'un'}) *
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    {type === 'entrada' ? 'Valor Unitário (R$)' : 'Custo Unitário (R$)'}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={unitValue}
                    onChange={(e) => setUnitValue(e.target.value)}
                    placeholder="0.00"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              {Number(quantity) > 0 && Number(unitValue) > 0 && (
                <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Valor Total do Movimento:</span>
                  <strong className="text-primary text-sm">
                    R$ {((Number(quantity) || 0) * (Number(unitValue) || 0)).toFixed(2)}
                  </strong>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Fornecedor / Origem</Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Ex: Distribuidora Veterinária"
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Nº Nota / Recibo / Documento</Label>
              <Input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="NF-e 12345"
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais da movimentação..."
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className={`w-full h-11 text-xs font-bold rounded-xl text-white mt-2 ${
              type === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary'
            }`}
          >
            {type === 'entrada' ? 'Confirmar Entrada 📥' : 'Confirmar Saída 📤'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
