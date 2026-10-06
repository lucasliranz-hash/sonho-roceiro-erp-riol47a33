import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NovaVendaDialog, SaleFormData } from '@/components/vendas/NovaVendaDialog'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog'
import { usePermissions } from '@/hooks/use-permissions'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import { ShoppingCart, Plus, CheckCircle2, Info } from 'lucide-react'
import { Sale } from '@/types/farm'
import { Badge } from '@/components/ui/badge'

export default function Vendas() {
  const { sales, addSale, updateSale, deleteSale, expenses, updateExpense, lots } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Sale | null>(null)
  const [deleting, setDeleting] = useState<Sale | null>(null)
  const [details, setDetails] = useState<Sale | null>(null)
  const { canEdit, canDelete } = usePermissions()

  const totalRev = sales.reduce((acc, s) => acc + s.totalPrice, 0)

  const handleSaleSubmit = async (formData: SaleFormData) => {
    const lotObj = formData.lotId ? lots.find((l) => l.id === formData.lotId) : undefined
    const salePayload = {
      date: formData.date,
      customerName: formData.customerName,
      product: formData.product,
      birdType: formData.birdType,
      lotId: formData.lotId,
      lotName: lotObj?.name,
      slaughterId: formData.slaughterId,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      paymentMethod: formData.paymentMethod,
      isPaid: formData.isPaid,
      notes: formData.notes,
      source_type: 'MANUAL',
    }

    if (editing) {
      const { error } = await updateSale(editing.id, {
        ...salePayload,
        totalPrice: Number((formData.quantity * formData.unitPrice).toFixed(2)),
      })
      if (error) throw new Error(error.message)
      await logAudit('UPDATE', 'farm_sales', editing.id, editing as any, salePayload as any)

      // Atualiza receita vinculada (se houver) — sincroniza com a venda editada
      const linkedRev = expenses.find((e) => e.source_type === 'SALE' && e.source_id === editing.id)
      if (linkedRev) {
        await updateExpense(linkedRev.id, {
          date: formData.date,
          description: `Venda — ${formData.product} (${formData.quantity} un)`,
          quantity: formData.quantity,
          unitValue: formData.unitPrice,
          totalValue: Number((formData.quantity * formData.unitPrice).toFixed(2)),
        })
      }
      toast({ title: 'Venda atualizada com sucesso! ✅' })
    } else {
      const { error } = await addSale(salePayload as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Venda registrada com sucesso! ✅' })
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
        {sales.map((s) => {
          const isLive =
            s.birdType === 'LIVE' ||
            (!s.birdType &&
              (s.product.toLowerCase().includes('vivo') ||
                s.product.toLowerCase().includes('pintinho')))
          const isSlaughtered =
            s.birdType === 'SLAUGHTERED' ||
            (!s.birdType &&
              (s.product.toLowerCase().includes('abatid') ||
                s.product.toLowerCase().includes('carne')))

          return (
            <Card
              key={s.id}
              className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs hover:border-border/80 transition-all shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground text-sm">{s.customerName}</p>
                  {isLive && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-amber-50 text-amber-800 border-amber-200"
                    >
                      🐓 Ave Viva (Baixou lote)
                    </Badge>
                  )}
                  {isSlaughtered && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-sky-50 text-sky-800 border-sky-200"
                    >
                      🥩 Ave Abatida
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <span>
                    {s.product} ({s.quantity} un)
                  </span>
                  <span>•</span>
                  <span>{s.date}</span>
                  {s.lotName && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-foreground">Lote: {s.lotName}</span>
                    </>
                  )}
                </p>
                {s.unitCost && (
                  <p className="text-[10px] text-muted-foreground">
                    Custo/un: R$ {s.unitCost.toFixed(2)}
                    {s.estimatedMargin !== undefined && (
                      <span
                        className={`ml-2 font-medium ${s.estimatedMargin >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                      >
                        Margem: {s.estimatedMargin}%
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-extrabold text-emerald-700 text-sm">
                    R$ {s.totalPrice.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.paymentMethod} • {s.isPaid ? 'Pago' : 'Pendente'}
                  </p>
                </div>
                <RecordActionMenu
                  onView={() => setDetails(s)}
                  onEdit={
                    canEdit
                      ? () => {
                          setEditing(s)
                          setOpen(true)
                        }
                      : undefined
                  }
                  onDelete={canDelete ? () => setDeleting(s) : undefined}
                  disabled={!canEdit}
                />
              </div>
            </Card>
          )
        })}
      </div>

      <NovaVendaDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditing(null)
        }}
        editingSale={editing}
        onSubmit={handleSaleSubmit}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={handleDelete}
      />
      <RecordDetailsDialog
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
        title={`Venda — ${details?.customerName || ''}`}
        rows={
          details
            ? [
                { label: 'Cliente', value: details.customerName },
                { label: 'Data', value: details.date },
                { label: 'Produto', value: details.product },
                {
                  label: 'Tipo de Ave',
                  value:
                    details.birdType === 'LIVE'
                      ? 'Ave Viva (Baixa de lote)'
                      : details.birdType === 'SLAUGHTERED'
                        ? 'Ave Abatida (Origem de Abate)'
                        : 'Outro',
                },
                { label: 'Quantidade', value: details.quantity },
                {
                  label: 'Preço unitário',
                  value: `R$ ${Number(details.unitPrice || 0).toFixed(2)}`,
                },
                { label: 'Total', value: `R$ ${details.totalPrice.toFixed(2)}` },
                {
                  label: 'Custo Unitário Estimado',
                  value: details.unitCost ? `R$ ${details.unitCost.toFixed(2)}` : 'N/D',
                },
                {
                  label: 'Margem Estimada',
                  value:
                    details.estimatedMargin !== undefined ? `${details.estimatedMargin}%` : 'N/D',
                },
                { label: 'Pagamento', value: details.paymentMethod },
                { label: 'Pago', value: details.isPaid ? 'Sim' : 'Não' },
                { label: 'Lote de Origem', value: details.lotName || 'N/A' },
                { label: 'Abate de Origem', value: details.slaughterId || 'N/A' },
                { label: 'Observações', value: details.notes || '—' },
              ]
            : []
        }
      />
    </div>
  )
}
