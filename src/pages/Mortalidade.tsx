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
import { Skull, Plus } from 'lucide-react'
import { Mortality } from '@/types/farm'

const fields: FormField[] = [
  { key: 'date', label: 'Data', type: 'date', required: true },
  { key: 'quantity', label: 'Aves Mortas', type: 'number', required: true },
  { key: 'cause', label: 'Causa', type: 'text', required: true },
  { key: 'notes', label: 'Observação', type: 'textarea' },
]

export default function Mortalidade() {
  const { mortality, addMortality, updateMortality, deleteMortality, lots } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Mortality | null>(null)
  const [deleting, setDeleting] = useState<Mortality | null>(null)
  const [details, setDetails] = useState<Mortality | null>(null)
  const { canEdit, canDelete } = usePermissions()

  const handleSubmit = async (values: Record<string, string>) => {
    const lot = lots.find((l) => l.id === values.lotId)
    const data = {
      date: values.date,
      lotId: values.lotId || '',
      lotName: lot?.name || '',
      quantity: Number(values.quantity) || 1,
      cause: values.cause || 'Natural',
      notes: values.notes || '',
    }
    if (editing) {
      const { error } = await updateMortality(editing.id, data)
      if (error) throw new Error(error.message)
      toast({ title: 'Mortalidade atualizada! ✅' })
    } else {
      const { error } = await addMortality(data as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Mortalidade registrada! ✅' })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteMortality(deleting.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    toast({ title: 'Registro excluído! Quantidade restaurada. 🗑️' })
    setDeleting(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Skull className="w-6 h-6 text-rose-600" /> Registro de Mortalidade
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Controle sanitário de perdas por lote.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Registrar Mortalidade
        </Button>
      </div>

      <div className="space-y-3">
        {mortality.map((m) => (
          <Card
            key={m.id}
            className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs border-l-4 border-l-rose-500"
          >
            <div>
              <p className="font-bold text-sm text-foreground">{m.lotName}</p>
              <p className="text-muted-foreground">Causa: {m.cause}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-lg font-extrabold text-rose-600 block">
                  {m.quantity} aves
                </span>
                <span className="text-muted-foreground">{m.date}</span>
              </div>
              <RecordActionMenu
                onView={() => setDetails(m)}
                onEdit={
                  canEdit
                    ? () => {
                        setEditing(m)
                        setOpen(true)
                      }
                    : undefined
                }
                onDelete={canDelete ? () => setDeleting(m) : undefined}
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
        title={editing ? 'Editar Mortalidade' : 'Registrar Mortalidade'}
        fields={fields}
        onSubmit={handleSubmit}
        lotConfig={{ required: true }}
        initialValues={
          editing
            ? {
                date: editing.date,
                quantity: String(editing.quantity),
                cause: editing.cause,
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
        title={`Mortalidade — ${details?.lotName || ''}`}
        rows={
          details
            ? [
                { label: 'Lote', value: details.lotName },
                { label: 'Data', value: details.date },
                { label: 'Quantidade', value: details.quantity },
                { label: 'Causa', value: details.cause },
                { label: 'Observação', value: details.notes },
              ]
            : []
        }
      />
    </div>
  )
}
