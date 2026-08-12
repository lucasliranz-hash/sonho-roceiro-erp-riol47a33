import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { EntityFormDialog, FormField } from '@/components/EntityFormDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import { TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { Expense, Sale } from '@/types/farm'

interface Txn {
  id: string
  recordType: 'expense' | 'sale' | 'structure' | 'asset'
  description: string
  amount: number
  date: string
  source_type: string
  category: string
  isPositive: boolean
  raw: any
}

const EXPENSE_SUGGESTIONS = [
  'Ração',
  'Medicamentos',
  'Vacinas',
  'Energia',
  'Água',
  'Transporte',
  'Manutenção',
  'Mão de obra',
  'Outros',
]

const EXPENSE_FIELDS: FormField[] = [
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

const SALE_FIELDS: FormField[] = [
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

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  SALE: 'Venda',
  STRUCTURE: 'Estrutura',
  ASSET: 'Patrimônio',
  INVENTORY_PURCHASE: 'Estoque',
  OTHER: 'Outros',
}
const SOURCE_ROUTES: Record<string, string> = {
  SALE: '/vendas',
  STRUCTURE: '/estrutura',
  ASSET: '/patrimonio',
  INVENTORY_PURCHASE: '/estoque',
}

export function FinanceiroTransactionList() {
  const {
    expenses,
    sales,
    structures,
    assets,
    addExpense,
    updateExpense,
    deleteExpense,
    addSale,
    updateSale,
    deleteSale,
  } = useFarmStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Txn | null>(null)
  const [deleting, setDeleting] = useState<Txn | null>(null)
  const [details, setDetails] = useState<Txn | null>(null)
  const [createType, setCreateType] = useState<'expense' | 'sale' | null>(null)

  const transactions = useMemo<Txn[]>(() => {
    const exp = expenses.map((e: Expense) => ({
      id: e.id,
      recordType: 'expense' as const,
      description: e.description,
      amount: e.totalValue,
      date: e.date,
      source_type: e.source_type || 'MANUAL',
      category: e.category,
      isPositive: false,
      raw: e,
    }))
    const sal = sales.map((s: Sale) => ({
      id: s.id,
      recordType: 'sale' as const,
      description: `${s.product} - ${s.customerName}`,
      amount: s.totalPrice,
      date: s.date,
      source_type: s.source_type || 'SALE',
      category: s.product,
      isPositive: true,
      raw: s,
    }))
    const str = structures.map((s) => ({
      id: s.id,
      recordType: 'structure' as const,
      description: s.description,
      amount: s.totalValue,
      date: s.date,
      source_type: 'STRUCTURE',
      category: s.category,
      isPositive: false,
      raw: s,
    }))
    const ast = assets.map((a) => ({
      id: a.id,
      recordType: 'asset' as const,
      description: a.name,
      amount: a.value,
      date: a.acquisitionDate,
      source_type: 'ASSET',
      category: a.category,
      isPositive: false,
      raw: a,
    }))
    return [...exp, ...sal, ...str, ...ast].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [expenses, sales, structures, assets])

  const isManual = (t: Txn) => !t.source_type || t.source_type === 'MANUAL'

  const handleCreate = async (values: Record<string, string>) => {
    if (createType === 'expense') {
      const aplicacao = (values.aplicacao || 'propriedade') as 'propriedade' | 'atividade' | 'lote'
      const lotId = aplicacao === 'lote' ? values.lotId || '' : ''
      const { error } = await addExpense({
        date: values.date,
        description: values.description,
        category: values.category,
        quantity: Number(values.quantity) || 1,
        unitValue: Number(values.unitValue) || 0,
        totalValue: Number(
          ((Number(values.quantity) || 1) * (Number(values.unitValue) || 0)).toFixed(2),
        ),
        supplier: 'Geral',
        paymentMethod: 'Pix',
        isPaid: true,
        aplicacao,
        activity: values.activity || '',
        lotId,
        source_type: 'MANUAL',
      } as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Despesa criada! ✅' })
    } else if (createType === 'sale') {
      const { error } = await addSale({
        date: values.date,
        customerName: values.customerName,
        product: values.product,
        quantity: Number(values.quantity) || 1,
        unitPrice: Number(values.unitPrice) || 0,
        totalPrice: Number(
          ((Number(values.quantity) || 1) * (Number(values.unitPrice) || 0)).toFixed(2),
        ),
        paymentMethod: 'Pix',
        isPaid: true,
        source_type: 'MANUAL',
      } as any)
      if (error) throw new Error(error.message)
      toast({ title: 'Receita criada! ✅' })
    }
    setCreateType(null)
  }

  const handleEdit = async (values: Record<string, string>) => {
    if (!editing) return
    if (editing.recordType === 'expense') {
      const aplicacao = (values.aplicacao || 'propriedade') as 'propriedade' | 'atividade' | 'lote'
      const lotId = aplicacao === 'lote' ? values.lotId || '' : ''
      const { error } = await updateExpense(editing.id, {
        date: values.date,
        description: values.description,
        category: values.category,
        quantity: Number(values.quantity) || 1,
        unitValue: Number(values.unitValue) || 0,
        totalValue: Number(
          ((Number(values.quantity) || 1) * (Number(values.unitValue) || 0)).toFixed(2),
        ),
        aplicacao,
        activity: values.activity || '',
        lotId,
      })
      if (error) throw new Error(error.message)
      await logAudit('UPDATE', 'farm_expenses', editing.id, editing.raw, { ...values })
      toast({ title: 'Despesa atualizada! ✅' })
    } else if (editing.recordType === 'sale') {
      const { error } = await updateSale(editing.id, {
        date: values.date,
        customerName: values.customerName,
        product: values.product,
        quantity: Number(values.quantity) || 1,
        unitPrice: Number(values.unitPrice) || 0,
        totalPrice: Number(
          ((Number(values.quantity) || 1) * (Number(values.unitPrice) || 0)).toFixed(2),
        ),
      })
      if (error) throw new Error(error.message)
      await logAudit('UPDATE', 'farm_sales', editing.id, editing.raw, { ...values })
      toast({ title: 'Venda atualizada! ✅' })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    if (deleting.recordType === 'expense') {
      const { error } = await deleteExpense(deleting.id)
      if (error) {
        toast({ title: 'Erro', variant: 'destructive' })
        return
      }
      await logAudit('DELETE', 'farm_expenses', deleting.id, deleting.raw, null)
    } else if (deleting.recordType === 'sale') {
      const { error } = await deleteSale(deleting.id)
      if (error) {
        toast({ title: 'Erro', variant: 'destructive' })
        return
      }
      await logAudit('DELETE', 'farm_sales', deleting.id, deleting.raw, null)
    } else {
      return
    }
    toast({ title: 'Registro excluído! 🗑️' })
    setDeleting(null)
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => setCreateType('expense')}
          variant="outline"
          className="rounded-xl text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Despesa
        </Button>
        <Button
          onClick={() => setCreateType('sale')}
          className="rounded-xl text-xs gap-2 bg-primary text-white"
        >
          <Plus className="w-4 h-4" /> Nova Receita
        </Button>
      </div>
      <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
        <h2 className="text-base font-bold mb-3">Todas as Transações Financeiras</h2>
        <div className="space-y-2">
          {transactions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma transação registrada.
            </p>
          )}
          {transactions.map((t) => {
            const manual = isManual(t)
            const route = SOURCE_ROUTES[t.source_type]
            const Icon = t.isPositive ? TrendingUp : TrendingDown
            return (
              <div
                key={`${t.recordType}-${t.id}`}
                className="p-3 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${t.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-foreground truncate block">
                      {t.description}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">
                        {t.category} • {t.date}
                      </span>
                      {!manual && (
                        <Badge className="bg-blue-100 text-blue-800 text-[9px] py-0">
                          Gerado por {SOURCE_LABELS[t.source_type]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p
                    className={`font-extrabold ${t.isPositive ? 'text-emerald-700' : 'text-rose-600'}`}
                  >
                    {t.isPositive ? '+' : '−'} R$ {t.amount.toFixed(2)}
                  </p>
                  <RecordActionMenu
                    onEdit={manual ? () => setEditing(t) : undefined}
                    onDelete={manual ? () => setDeleting(t) : undefined}
                    onViewDetails={() => setDetails(t)}
                    onViewOrigin={!manual && route ? () => navigate(route) : undefined}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Dialog open={!!details} onOpenChange={(v) => !v && setDetails(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Detalhes da Transação</DialogTitle>
          </DialogHeader>
          {details && (
            <div className="space-y-2 text-xs">
              <p>
                <strong>Descrição:</strong> {details.description}
              </p>
              <p>
                <strong>Valor:</strong> R$ {details.amount.toFixed(2)}
              </p>
              <p>
                <strong>Data:</strong> {details.date}
              </p>
              <p>
                <strong>Categoria:</strong> {details.category}
              </p>
              <p>
                <strong>Origem:</strong>{' '}
                {isManual(details)
                  ? 'Manual'
                  : SOURCE_LABELS[details.source_type] || details.source_type}
              </p>
              {!isManual(details) && (
                <p className="text-blue-600">
                  Gerado automaticamente por {SOURCE_LABELS[details.source_type]} #{details.id}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editing && (
        <EntityFormDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          title={editing.recordType === 'expense' ? 'Editar Despesa' : 'Editar Venda'}
          fields={editing.recordType === 'expense' ? EXPENSE_FIELDS : SALE_FIELDS}
          onSubmit={handleEdit}
          lotConfig={
            editing.recordType === 'expense'
              ? { required: false, showWhen: (aplicacao?: string) => aplicacao === 'lote' }
              : undefined
          }
          initialValues={
            editing.recordType === 'expense'
              ? {
                  date: editing.raw.date,
                  description: editing.raw.description,
                  category: editing.raw.category,
                  aplicacao: editing.raw.aplicacao || 'propriedade',
                  activity: editing.raw.activity || '',
                  quantity: String(editing.raw.quantity),
                  unitValue: String(editing.raw.unitValue),
                  lotId: editing.raw.lotId || '',
                }
              : {
                  date: editing.raw.date,
                  customerName: editing.raw.customerName,
                  product: editing.raw.product,
                  quantity: String(editing.raw.quantity),
                  unitPrice: String(editing.raw.unitPrice),
                }
          }
        />
      )}

      {createType && (
        <EntityFormDialog
          open={!!createType}
          onOpenChange={(v) => !v && setCreateType(null)}
          title={createType === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
          fields={createType === 'expense' ? EXPENSE_FIELDS : SALE_FIELDS}
          onSubmit={handleCreate}
          lotConfig={
            createType === 'expense'
              ? { required: false, showWhen: (aplicacao?: string) => aplicacao === 'lote' }
              : undefined
          }
        />
      )}

      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}
