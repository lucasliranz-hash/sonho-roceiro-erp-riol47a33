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
import { Egg, Plus } from 'lucide-react'
import { EggProduction } from '@/types/farm'
import { logAudit } from '@/services/audit'

const fields: FormField[] = [
  { key: 'date', label: 'Data', type: 'date', required: true },
  { key: 'collected', label: 'Ovos Coletados', type: 'number', required: true },
  { key: 'broken', label: 'Quebrados', type: 'number', defaultValue: '0' },
  { key: 'consumed', label: 'Consumidos', type: 'number', defaultValue: '0' },
  { key: 'sold', label: 'Vendidos', type: 'number', defaultValue: '0' },
  { key: 'incubated', label: 'Incubados', type: 'number', defaultValue: '0' },
  { key: 'notes', label: 'Observação', type: 'textarea' },
]

export default function Ovos() {
  const { eggs, addEggProduction, updateEggProduction, deleteEggProduction, lots } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EggProduction | null>(null)
  const [deleting, setDeleting] = useState<EggProduction | null>(null)
  const [details, setDetails] = useState<EggProduction | null>(null)
  const { canEdit, canDelete } = usePermissions()

  const totalCollected = eggs.reduce((acc, e) => acc + e.collected, 0)

  const handleSubmit = async (values: Record<string, string>) => {
    const lot = lots.find((l) => l.id === values.lotId)
    const data = {
      date: values.date,
      lotId: values.lotId || '',
      lotName: lot?.name || '',
      collected: Number(values.collected) || 0,
      broken: Number(values.broken) || 0,
      consumed: Number(values.consumed) || 0,
      sold: Number(values.sold) || 0,
      incubated: Number(values.incubated) || 0,
      discarded: 0,
      notes: values.notes || '',
    }
    if (editing) {
      const { error } = await updateEggProduction(editing.id, data)
      if (error) throw new Error(error.message)
      toast({ title: 'Produção atualizada! ✅' })
    } else {
      const { error } = await addEggProduction(data as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Produção registrada! ✅' })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteEggProduction(deleting.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    await logAudit('DELETE', 'farm_egg_production', deleting.id, deleting as any, null)
    toast({ title: 'Registro excluído! 🗑️' })
    setDeleting(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Egg className="w-6 h-6 text-amber-600" /> Produção e Coleta de Ovos
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Acompanhamento diário da taxa de postura.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Registrar Produção
        </Button>
      </div>

      <Card className="p-5 rounded-3xl bg-amber-500/10 border-amber-200">
        <span className="text-xs font-bold text-amber-800">
          Quantos ovos foram coletados hoje? 🥚
        </span>
        <p className="text-3xl font-extrabold text-amber-900 mt-1">
          {totalCollected} Ovos Coletados
        </p>
      </Card>

      <div className="space-y-2">
        {eggs.map((e) => (
          <Card
            key={e.id}
            className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs"
          >
            <div>
              <p className="font-bold text-foreground">{e.lotName}</p>
              <p className="text-muted-foreground">{e.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-extrabold text-amber-800 text-base">{e.collected} Ovos</p>
                <p className="text-[10px] text-muted-foreground">Quebrados: {e.broken}</p>
              </div>
              <RecordActionMenu
                onView={() => setDetails(e)}
                onEdit={
                  canEdit
                    ? () => {
                        setEditing(e)
                        setOpen(true)
                      }
                    : undefined
                }
                onDelete={canDelete ? () => setDeleting(e) : undefined}
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
        title={editing ? 'Editar Produção' : 'Registrar Produção'}
        fields={fields}
        onSubmit={handleSubmit}
        lotConfig={{ required: true }}
        initialValues={
          editing
            ? {
                date: editing.date,
                collected: String(editing.collected),
                broken: String(editing.broken),
                consumed: String(editing.consumed),
                sold: String(editing.sold),
                incubated: String(editing.incubated),
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
        title={`Produção de Ovos — ${details?.lotName || ''}`}
        rows={
          details
            ? [
                { label: 'Lote', value: details.lotName },
                { label: 'Data', value: details.date },
                { label: 'Coletados', value: details.collected },
                { label: 'Quebrados', value: details.broken },
                { label: 'Consumidos', value: details.consumed },
                { label: 'Vendidos', value: details.sold },
                { label: 'Incubados', value: details.incubated },
                { label: 'Observação', value: details.notes },
              ]
            : []
        }
      />
    </div>
  )
}
