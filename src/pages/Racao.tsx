import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EntityFormDialog, FormField } from '@/components/EntityFormDialog'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { toast } from '@/hooks/use-toast'
import { Wheat, Plus } from 'lucide-react'
import { FeedConsumption } from '@/types/farm'

const fields: FormField[] = [
  { key: 'date', label: 'Data', type: 'date', required: true },
  { key: 'quantityKg', label: 'Quantidade (KG)', type: 'number', required: true, step: '0.1' },
  { key: 'costPerKg', label: 'Custo por KG (R$)', type: 'number', step: '0.01' },
  { key: 'notes', label: 'Observação', type: 'textarea' },
]

export default function Racao() {
  const { feedLogs, addFeedConsumption, updateFeedConsumption, deleteFeedConsumption, lots } =
    useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FeedConsumption | null>(null)
  const [deleting, setDeleting] = useState<FeedConsumption | null>(null)

  const totalKg = feedLogs.reduce((acc, f) => acc + f.quantityKg, 0)
  const totalCost = feedLogs.reduce((acc, f) => acc + f.totalCost, 0)

  const handleSubmit = async (values: Record<string, string>) => {
    const lot = lots.find((l) => l.id === values.lotId)
    const data = {
      date: values.date,
      lotId: values.lotId || '',
      lotName: lot?.name || '',
      quantityKg: Number(values.quantityKg) || 0,
      costPerKg: Number(values.costPerKg) || 0,
      notes: values.notes || '',
    }
    if (editing) {
      const { error } = await updateFeedConsumption(editing.id, data)
      if (error) throw new Error(error.message)
      toast({ title: 'Consumo atualizado! ✅' })
    } else {
      const { error } = await addFeedConsumption(data as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Consumo registrado! ✅' })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteFeedConsumption(deleting.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    toast({ title: 'Registro excluído! 🗑️' })
    setDeleting(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Wheat className="w-6 h-6 text-amber-600" /> Consumo de Ração por Lote
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Registro diário da alimentação e cálculo de conversão alimentar.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Registrar Consumo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Total Consumido</span>
          <p className="text-2xl font-extrabold text-amber-700">{totalKg} KG</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Custo Total de Ração</span>
          <p className="text-2xl font-extrabold text-emerald-700">R$ {totalCost.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="p-5 rounded-3xl bg-white border-border">
        <h2 className="text-base font-bold mb-3">Histórico de Alimentação</h2>
        <div className="space-y-2">
          {feedLogs.map((f) => (
            <div
              key={f.id}
              className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold">{f.lotName}</p>
                <p className="text-muted-foreground">
                  {f.date} • {f.notes}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-bold text-amber-800">{f.quantityKg} KG</p>
                  <p className="text-muted-foreground">R$ {f.totalCost.toFixed(2)}</p>
                </div>
                <RecordActionMenu
                  onEdit={() => {
                    setEditing(f)
                    setOpen(true)
                  }}
                  onDelete={() => setDeleting(f)}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <EntityFormDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditing(null)
        }}
        title={editing ? 'Editar Consumo' : 'Registrar Consumo'}
        fields={fields}
        onSubmit={handleSubmit}
        lotConfig={{ required: true }}
        initialValues={
          editing
            ? {
                date: editing.date,
                quantityKg: String(editing.quantityKg),
                costPerKg: String(editing.costPerKg),
                notes: editing.notes || '',
                lotId: editing.lotId,
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
