import { useState, useEffect } from 'react'
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
import { useFarmStore } from '@/hooks/use-farm-store'
import { toast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  type: 'entrada' | 'saida'
}

export function StockMovementDialog({ open, onOpenChange, type }: Props) {
  const { inventory, addStockMovement, updateInventory } = useFarmStore()
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setItemId(inventory[0]?.id || '')
      setQuantity('')
      setNotes('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const item = inventory.find((i) => i.id === itemId)
    if (!item) return
    const qty = Number(quantity) || 0
    const newStock =
      type === 'entrada' ? item.currentStock + qty : Math.max(0, item.currentStock - qty)
    const { error } = await addStockMovement({
      date: new Date().toISOString().split('T')[0],
      inventoryItemId: itemId,
      inventoryItemName: item.name,
      type,
      movementType: type === 'entrada' ? 'Compra' : 'Consumo',
      quantity: qty,
      unit: item.unit,
      balanceAfter: newStock,
      unitValue: item.averageCost,
      totalValue: Number((qty * item.averageCost).toFixed(2)),
      notes,
    })
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    await updateInventory(itemId, {
      currentStock: newStock,
      lastUpdated: new Date().toISOString().split('T')[0],
    })
    toast({ title: type === 'entrada' ? 'Entrada registrada! 📥' : 'Saída registrada! 📤' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {type === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Item</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Selecionar item" />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((i) => (
                  <SelectItem key={i.id} value={i.id} className="text-xs">
                    {i.name} (Atual: {i.currentStock} {i.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Quantidade</Label>
            <Input
              type="number"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>
          <div>
            <Label className="text-xs">Observação</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-xs rounded-xl"
              placeholder="Opcional"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-primary text-white text-xs font-bold"
          >
            Confirmar {type === 'entrada' ? 'Entrada' : 'Saída'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
