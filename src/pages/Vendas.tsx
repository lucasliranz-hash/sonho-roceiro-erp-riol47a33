import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EntityFormDialog, FormField } from '@/components/EntityFormDialog'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import { ShoppingCart, Plus } from 'lucide-react'
import { Sale } from '@/types/farm'

const SALE_SUGGESTIONS = [
  'Ovos',
  'Ovos férteis',
  'Pintinhos',
  'Frangos vivos',
  'Frangos abatidos',
  'Galinhas',
  'Matrizes',
  'Reprodutores',
  'Outros',
]

const fields: FormField[] = [
  { key: 'date', label: 'Data', type: 'date', required: true },
  { key: 'customerName', label: 'Cliente', type: 'text', required: true },
  {
    key: 'product',
    label: 'Produto',
    type: 'category-select',
    categoryStorageKey: 'sale',
    options: SALE_SUGGESTIONS,
  },
  { key: 'quantity', label: 'Quantidade', type: 'number', required: true },
  { key: 'unitPrice', label: 'Preço Unitário (R$)', type: 'number', step: '0.01' },
]

export default function Vendas() {
  const { sales, addSale, updateSale, deleteSale } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Sale | null>(null)
  const [deleting, setDeleting] = useState<Sale | null>(null)

  const totalRev = sales.reduce((acc, s) => acc + s.totalPrice, 0)

  const handleSubmit = async (values: Record<string, string>) => {
    const data = {
      date: values.date,
      customerName: values.customerName,
      product: values.product,
      quantity: Number(values.quantity) || 1,
      unitPrice: Number(values.unitPrice) || 0,
      paymentMethod: 'Pix',
      isPaid: true,
      source_type: 'MANUAL',
    }
    if (editing) {
      const { error } = await updateSale(editing.id, {
        ...data,
        totalPrice: Number((data.quantity * data.unitPrice).toFixed(2)),
      })
      if (error) throw new Error(error.message)
      await logAudit('UPDATE', 'farm_sales', editing.id, editing as any, data as any)
      toast({ title: 'Venda atualizada! ✅' })
    } else {
      const { error } = await addSale(data as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Venda registrada! ✅' })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteSale(deleting.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    await logAudit('DELETE', 'farm_sales', deleting.id, deleting as any, null)
    toast({ title: 'Venda excluída! 🗑️' })
    setDeleting(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            🛒 Vendas de Ovos e Aves
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Histórico de comercialização para clientes da região.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Venda
        </Button>
      </div>

      <Card className="p-4 rounded-2xl bg-white border-border">
        <span className="text-xs text-muted-foreground">Faturamento Acumulado</span>
        <p className="text-2xl font-extrabold text-emerald-700">R$ {totalRev.toFixed(2)}</p>
      </Card>

      <div className="space-y-2">
        {sales.length === 0 && (
          <Card className="p-8 text-center rounded-2xl bg-white border-border">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">Nenhuma venda</p>
          </Card>
        )}
        {sales.map((s) => (
          <Card
            key={s.id}
            className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs"
          >
            <div>
              <p className="font-bold text-foreground">{s.customerName}</p>
              <p className="text-muted-foreground">
                {s.product} ({s.quantity} un) • {s.date}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-extrabold text-emerald-700 text-sm">
                  R$ {s.totalPrice.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">{s.paymentMethod}</p>
              </div>
              <RecordActionMenu
                onEdit={() => {
                  setEditing(s)
                  setOpen(true)
                }}
                onDelete={() => setDeleting(s)}
              />
            </div>
          </Card>
        ))}
      </div>

      <EntityFormDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditing(null)
        }}
        title={editing ? 'Editar Venda' : 'Nova Venda'}
        fields={fields}
        onSubmit={handleSubmit}
        lotConfig={{ required: false }}
        initialValues={
          editing
            ? {
                date: editing.date,
                customerName: editing.customerName,
                product: editing.product,
                quantity: String(editing.quantity),
                unitPrice: String(editing.unitPrice),
                lotId: editing.lotId || '',
              }
            : undefined
        }
      />
      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
