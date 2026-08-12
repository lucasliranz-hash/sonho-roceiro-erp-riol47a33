import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EntityFormDialog, FormField } from '@/components/EntityFormDialog'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog'
import { usePermissions } from '@/hooks/use-permissions'
import { toast } from '@/hooks/use-toast'
import { Scale, Plus } from 'lucide-react'
import { Weighing } from '@/types/farm'

const fields: FormField[] = [
  { key: 'date', label: 'Data', type: 'date', required: true },
  { key: 'weighedCount', label: 'Aves Pesadas', type: 'number', required: true },
  { key: 'totalWeightKg', label: 'Peso Total (KG)', type: 'number', required: true, step: '0.01' },
  { key: 'ageDays', label: 'Idade (dias)', type: 'number' },
  { key: 'notes', label: 'Observação', type: 'textarea' },
]

export default function Pesagens() {
  const { weighings, addWeighing, updateWeighing, deleteWeighing, lots } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Weighing | null>(null)
  const [deleting, setDeleting] = useState<Weighing | null>(null)
  const [details, setDetails] = useState<Weighing | null>(null)
  const { canEdit, canDelete } = usePermissions()

  const handleSubmit = async (values: Record<string, string>) => {
    const lot = lots.find((l) => l.id === values.lotId)
    const data = {
      date: values.date,
      lotId: values.lotId || '',
      lotName: lot?.name || '',
      weighedCount: Number(values.weighedCount) || 0,
      totalWeightKg: Number(values.totalWeightKg) || 0,
      ageDays: Number(values.ageDays) || 0,
      notes: values.notes || '',
    }
    if (editing) {
      const { error } = await updateWeighing(editing.id, data)
      if (error) throw new Error(error.message)
      toast({ title: 'Pesagem atualizada! ✅' })
    } else {
      const { error } = await addWeighing(data as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Pesagem registrada! ✅' })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteWeighing(deleting.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    toast({ title: 'Pesagem excluída! 🗑️' })
    setDeleting(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-600" /> Pesagens e Curva de Crescimento
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Acompanhe o peso médio e o ganho médio diário (GMD).
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Pesagem
        </Button>
      </div>

      <div className="space-y-3">
        {weighings.map((w) => (
          <Card
            key={w.id}
            className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs"
          >
            <div>
              <p className="font-bold text-sm text-foreground">{w.lotName}</p>
              <p className="text-muted-foreground">
                Amostra: {w.weighedCount} aves | Idade: {w.ageDays} dias
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-lg font-extrabold text-blue-700 block">
                  {w.averageWeightKg} KG
                </span>
                <span className="text-[11px] text-muted-foreground">
                  GMD: +{w.dailyGainGrams || 0}g/dia
                </span>
              </div>
              <RecordActionMenu
                onView={() => setDetails(w)}
                onEdit={
                  canEdit
                    ? () => {
                        setEditing(w)
                        setOpen(true)
                      }
                    : undefined
                }
                onDelete={canDelete ? () => setDeleting(w) : undefined}
                disabled={!canEdit}
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
        title={editing ? 'Editar Pesagem' : 'Nova Pesagem'}
        fields={fields}
        onSubmit={handleSubmit}
        lotConfig={{ required: true }}
        initialValues={
          editing
            ? {
                date: editing.date,
                weighedCount: String(editing.weighedCount),
                totalWeightKg: String(editing.totalWeightKg),
                ageDays: String(editing.ageDays),
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
      <RecordDetailsDialog
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
        title={`Pesagem — ${details?.lotName || ''}`}
        rows={
          details
            ? [
                { label: 'Lote', value: details.lotName },
                { label: 'Data', value: details.date },
                { label: 'Idade (dias)', value: details.ageDays },
                { label: 'Aves pesadas', value: details.weighedCount },
                { label: 'Peso total (kg)', value: details.totalWeightKg },
                { label: 'Peso médio (kg)', value: details.averageWeightKg },
                { label: 'GMD (g/dia)', value: details.dailyGainGrams },
                { label: 'Observação', value: details.notes },
              ]
            : []
        }
      />
    </div>
  )
}
