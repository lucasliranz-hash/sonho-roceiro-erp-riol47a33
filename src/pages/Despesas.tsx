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
import { DollarSign, Plus } from 'lucide-react'
import { Expense } from '@/types/farm'
import { logAudit } from '@/services/audit'

const EXPENSE_SUGGESTIONS = [
  'Ração',
  'Pintinhos',
  'Medicamentos',
  'Vacinas',
  'Cama',
  'Energia',
  'Água',
  'Transporte',
  'Manutenção',
  'Mão de obra',
  'Abate',
  'Embalagem',
  'Outros',
]

const fields: FormField[] = [
  { key: 'date', label: 'Data', type: 'date', required: true },
  { key: 'description', label: 'Descrição', type: 'text', required: true },
  {
    key: 'category',
    label: 'Categoria',
    type: 'category-select',
    categoryStorageKey: 'expense',
    options: EXPENSE_SUGGESTIONS,
  },
  { key: 'aplicacao', label: 'Aplicar a', type: 'aplicacao', defaultValue: 'propriedade' },
  {
    key: 'activity',
    label: 'Atividade',
    type: 'text',
    placeholder: 'Opcional',
    showWhen: (v) => v.aplicacao === 'atividade' || v.aplicacao === 'lote',
  },
  { key: 'quantity', label: 'Quantidade', type: 'number', defaultValue: '1' },
  { key: 'unitValue', label: 'Valor Unitário (R$)', type: 'number', step: '0.01' },
]

export default function Despesas() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [details, setDetails] = useState<Expense | null>(null)
  const { canEdit, canDelete } = usePermissions()

  const totalExp = expenses.reduce((acc, e) => acc + e.totalValue, 0)

  const handleSubmit = async (values: Record<string, string>) => {
    const aplicacao = (values.aplicacao || 'propriedade') as 'propriedade' | 'atividade' | 'lote'
    const lotId = aplicacao === 'lote' ? values.lotId || '' : ''
    const data = {
      date: values.date,
      description: values.description,
      category: values.category,
      quantity: Number(values.quantity) || 1,
      unitValue: Number(values.unitValue) || 0,
      supplier: 'Geral',
      paymentMethod: 'Pix',
      isPaid: true,
      aplicacao,
      activity: values.activity || '',
      lotId,
      source_type: 'MANUAL',
    }
    if (editing) {
      const { error } = await updateExpense(editing.id, {
        ...data,
        totalValue: Number((data.quantity * data.unitValue).toFixed(2)),
      })
      if (error) throw new Error(error.message)
      await logAudit('UPDATE', 'farm_expenses', editing.id, editing as any, data as any)
      toast({ title: 'Despesa atualizada! ✅' })
    } else {
      const { error } = await addExpense(data as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Despesa registrada! ✅' })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteExpense(deleting.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    toast({ title: 'Despesa excluída! 🗑️' })
    setDeleting(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" /> Despesas Operacionais (OPEX)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gastos do dia a dia com ração, vacinas, manutenção e insumos.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Despesa
        </Button>
      </div>

      <Card className="p-4 rounded-2xl bg-white border-border">
        <span className="text-xs text-muted-foreground">Total em Despesas</span>
        <p className="text-2xl font-extrabold text-rose-600">R$ {totalExp.toFixed(2)}</p>
      </Card>

      <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
        <h2 className="text-base font-bold mb-4">Lista de Despesas</h2>
        <div className="space-y-2">
          {expenses.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma despesa registrada.
            </p>
          )}
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="p-3 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-foreground">{exp.description}</span>
                <p className="text-[11px] text-muted-foreground">
                  Categoria: {exp.category} {exp.lotName ? `• Lote: ${exp.lotName}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-extrabold text-rose-600">R$ {exp.totalValue.toFixed(2)}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">{exp.date}</span>
                </div>
                <RecordActionMenu
                  onView={() => setDetails(exp)}
                  onEdit={
                    canEdit
                      ? () => {
                          setEditing(exp)
                          setOpen(true)
                        }
                      : undefined
                  }
                  onDelete={canDelete ? () => setDeleting(exp) : undefined}
                  sourceType={exp.source_type || 'MANUAL'}
                  sourceLabel={
                    exp.source_type && exp.source_type !== 'MANUAL' ? exp.source_type : undefined
                  }
                  disabled={!canEdit}
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
        title={editing ? 'Editar Despesa' : 'Nova Despesa'}
        fields={fields}
        onSubmit={handleSubmit}
        lotConfig={{ required: false, showWhen: (aplicacao?: string) => aplicacao === 'lote' }}
        initialValues={
          editing
            ? {
                date: editing.date,
                description: editing.description,
                category: editing.category,
                aplicacao: editing.aplicacao || 'propriedade',
                activity: editing.activity || '',
                quantity: String(editing.quantity),
                unitValue: String(editing.unitValue),
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
      <RecordDetailsDialog
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
        title={`Despesa — ${details?.description || ''}`}
        rows={
          details
            ? [
                { label: 'Descrição', value: details.description },
                { label: 'Categoria', value: details.category },
                { label: 'Data', value: details.date },
                { label: 'Quantidade', value: details.quantity },
                { label: 'Valor unitário', value: details.unitValue },
                { label: 'Total', value: `R$ ${details.totalValue.toFixed(2)}` },
                { label: 'Fornecedor', value: details.supplier },
                { label: 'Pagamento', value: details.paymentMethod },
                { label: 'Pago', value: details.isPaid ? 'Sim' : 'Não' },
                { label: 'Lote', value: details.lotName },
                { label: 'Atividade', value: details.activity },
                { label: 'Origem', value: details.source_type },
                { label: 'Observação', value: details.notes },
              ]
            : []
        }
      />
    </div>
  )
}
