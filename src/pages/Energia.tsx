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
import { logAudit } from '@/services/audit'
import { Zap, Plus } from 'lucide-react'
import { EnergyMeasurement } from '@/types/farm'

const fields: FormField[] = [
  { key: 'date', label: 'Data', type: 'date', required: true },
  {
    key: 'measurementType',
    label: 'Tipo / Aplicação',
    type: 'aplicacao',
    defaultValue: 'propriedade',
  },
  { key: 'equipment', label: 'Equipamento / Local', type: 'text', required: true },
  { key: 'hours', label: 'Horas de Funcionamento', type: 'number', required: true, step: '0.1' },
  { key: 'consumptionKwh', label: 'Consumo (kWh)', type: 'number', required: true, step: '0.01' },
  {
    key: 'ratePerKwh',
    label: 'Tarifa (R$/kWh)',
    type: 'number',
    step: '0.01',
    defaultValue: '0.75',
  },
]

export default function Energia() {
  const { energyLogs, addEnergyLog, updateEnergyLog, deleteEnergyLog } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EnergyMeasurement | null>(null)
  const [deleting, setDeleting] = useState<EnergyMeasurement | null>(null)

  const totalCost = energyLogs.reduce((acc, e) => acc + e.totalCost, 0)

  const handleSubmit = async (values: Record<string, string>) => {
    const data = {
      date: values.date,
      equipment: values.equipment,
      hours: Number(values.hours) || 0,
      consumptionKwh: Number(values.consumptionKwh) || 0,
      ratePerKwh: Number(values.ratePerKwh) || 0.75,
      totalCost: Number(
        ((Number(values.consumptionKwh) || 0) * (Number(values.ratePerKwh) || 0.75)).toFixed(2),
      ),
    }
    if (editing) {
      const { error } = await updateEnergyLog(editing.id, data)
      if (error) throw new Error(error.message)
      toast({ title: 'Leitura atualizada! ✅' })
    } else {
      const { error } = await addEnergyLog(data as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Leitura registrada! ✅' })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteEnergyLog(deleting.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    toast({ title: 'Leitura excluída! 🗑️' })
    setDeleting(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" /> Controle de Energia
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Acompanhamento do consumo em kWh.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Leitura
        </Button>
      </div>

      <Card className="p-4 rounded-2xl bg-white border-border">
        <span className="text-xs text-muted-foreground">Custo Total com Energia</span>
        <p className="text-2xl font-extrabold text-yellow-700">R$ {totalCost.toFixed(2)}</p>
      </Card>

      <div className="space-y-2">
        {energyLogs.map((e) => (
          <Card
            key={e.id}
            className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs"
          >
            <div>
              <p className="font-bold">{e.equipment}</p>
              <p className="text-muted-foreground">{e.hours} horas de funcionamento</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-bold text-yellow-700">{e.consumptionKwh} kWh</p>
                <p className="text-muted-foreground">R$ {e.totalCost.toFixed(2)}</p>
              </div>
              <RecordActionMenu
                onEdit={() => {
                  setEditing(e)
                  setOpen(true)
                }}
                onDelete={() => setDeleting(e)}
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
        title={editing ? 'Editar Leitura' : 'Nova Leitura'}
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={
          editing
            ? {
                date: editing.date,
                equipment: editing.equipment,
                hours: String(editing.hours),
                consumptionKwh: String(editing.consumptionKwh),
                ratePerKwh: String(editing.ratePerKwh),
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
