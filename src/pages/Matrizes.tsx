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
import { Bird, Plus } from 'lucide-react'
import { Animal } from '@/types/farm'

const fields: FormField[] = [
  { key: 'code', label: 'Código', type: 'text', required: true },
  { key: 'sex', label: 'Sexo', type: 'select', options: ['Macho', 'Fêmea'] },
  { key: 'breed', label: 'Raça', type: 'text', required: true },
  { key: 'lineage', label: 'Linhagem', type: 'text' },
  { key: 'birthDate', label: 'Data de Nascimento', type: 'date' },
  { key: 'origin', label: 'Origem', type: 'text' },
  { key: 'weightKg', label: 'Peso (KG)', type: 'number', step: '0.01' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: ['Ativo', 'Vendido', 'Descartado', 'Morto'],
  },
  { key: 'notes', label: 'Observação', type: 'textarea' },
]

export default function Matrizes() {
  const { animals, addAnimal, updateAnimal, deleteAnimal } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Animal | null>(null)
  const [deleting, setDeleting] = useState<Animal | null>(null)
  const [details, setDetails] = useState<Animal | null>(null)
  const { canEdit, canDelete } = usePermissions()

  const handleSubmit = async (values: Record<string, string>) => {
    const data = {
      code: values.code,
      sex: values.sex as Animal['sex'],
      breed: values.breed,
      lineage: values.lineage || '',
      birthDate: values.birthDate,
      origin: values.origin || '',
      weightKg: Number(values.weightKg) || 0,
      status: values.status as Animal['status'],
      notes: values.notes || '',
    }
    if (editing) {
      const { error } = await updateAnimal(editing.id, data)
      if (error) throw new Error(error.message)
      toast({ title: 'Matriz atualizada! ✅' })
    } else {
      const { error } = await addAnimal(data as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Matriz registrada! ✅' })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteAnimal(deleting.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    toast({ title: 'Matriz excluída! 🗑️' })
    setDeleting(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Bird className="w-6 h-6 text-emerald-700" /> Matrizes e Reprodutores
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Registro individual de galos e galinhas reprodutoras.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Matriz
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {animals.length === 0 && (
          <Card className="p-8 text-center rounded-3xl bg-white border-border">
            <Bird className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">Nenhuma matriz cadastrada</p>
          </Card>
        )}
        {animals.map((an) => (
          <Card key={an.id} className="p-5 rounded-3xl bg-white border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary text-sm">{an.code}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {an.sex}
                </span>
                <RecordActionMenu
                  onView={() => setDetails(an)}
                  onEdit={
                    canEdit
                      ? () => {
                          setEditing(an)
                          setOpen(true)
                        }
                      : undefined
                  }
                  onDelete={canDelete ? () => setDeleting(an) : undefined}
                  disabled={!canEdit}
                />
              </div>
            </div>
            <p className="font-extrabold text-base">{an.breed}</p>
            <p className="text-xs text-muted-foreground">
              Peso: {an.weightKg} KG • Origem: {an.origin}
            </p>
          </Card>
        ))}
      </div>

      <EntityFormDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditing(null)
        }}
        title={editing ? 'Editar Matriz' : 'Nova Matriz'}
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={
          editing
            ? {
                code: editing.code,
                sex: editing.sex,
                breed: editing.breed,
                lineage: editing.lineage,
                birthDate: editing.birthDate,
                origin: editing.origin,
                weightKg: String(editing.weightKg),
                status: editing.status,
                notes: editing.notes || '',
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
        title={`Matriz — ${details?.code || ''}`}
        rows={
          details
            ? [
                { label: 'Código', value: details.code },
                { label: 'Sexo', value: details.sex },
                { label: 'Raça', value: details.breed },
                { label: 'Linhagem', value: details.lineage },
                { label: 'Nascimento', value: details.birthDate },
                { label: 'Origem', value: details.origin },
                { label: 'Peso (kg)', value: details.weightKg },
                { label: 'Status', value: details.status },
                { label: 'Observação', value: details.notes },
              ]
            : []
        }
      />
    </div>
  )
}
