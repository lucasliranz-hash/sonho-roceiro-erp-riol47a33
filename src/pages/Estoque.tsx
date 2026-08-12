import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EntityFormDialog, FormField } from '@/components/EntityFormDialog'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog'
import { NovoItemDialog } from '@/components/estoque/NovoItemDialog'
import { StockMovementDialog } from '@/components/estoque/StockMovementDialog'
import { usePermissions } from '@/hooks/use-permissions'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import { Package, AlertTriangle, Plus, ArrowDown, ArrowUp } from 'lucide-react'
import { InventoryItem } from '@/types/farm'

const fields: FormField[] = [
  { key: 'name', label: 'Nome', type: 'text', required: true },
  {
    key: 'category',
    label: 'Categoria',
    type: 'select',
    options: [
      'Ração',
      'Milho',
      'Farelos',
      'Medicamentos',
      'Vacinas',
      'Maravalha',
      'Embalagens',
      'Insumos',
      'Outros',
    ],
  },
  { key: 'unit', label: 'Unidade', type: 'select', options: ['KG', 'unid', 'L', 'saco'] },
  { key: 'currentStock', label: 'Estoque Atual', type: 'number', step: '0.1' },
  { key: 'minStock', label: 'Estoque Mínimo', type: 'number', step: '0.1' },
  { key: 'averageCost', label: 'Custo Médio (R$)', type: 'number', step: '0.01' },
]

export default function Estoque() {
  const { inventory, updateInventory, deleteInventory } = useFarmStore()
  const { canEdit, canDelete } = usePermissions()
  const [novoOpen, setNovoOpen] = useState(false)
  const [entradaOpen, setEntradaOpen] = useState(false)
  const [saidaOpen, setSaidaOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState<InventoryItem | null>(null)
  const [details, setDetails] = useState<InventoryItem | null>(null)

  const handleSubmit = async (values: Record<string, string>) => {
    if (!editing) return
    const oldStock = editing.currentStock
    const newStock = Number(values.currentStock) || 0
    const { error } = await updateInventory(editing.id, {
      name: values.name,
      category: values.category as InventoryItem['category'],
      unit: values.unit,
      currentStock: newStock,
      minStock: Number(values.minStock) || 0,
      averageCost: Number(values.averageCost) || 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    })
    if (error) throw new Error(error.message)
    await logAudit('UPDATE', 'farm_inventory', editing.id, editing as any, {
      ...values,
      oldStock,
      newStock,
    })
    toast({ title: 'Item atualizado! ✅' })
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteInventory(deleting.id)
    if (error) {
      toast({ title: 'Erro', variant: 'destructive' })
      return
    }
    await logAudit('DELETE', 'farm_inventory', deleting.id, deleting as any, null)
    toast({ title: 'Item excluído! 🗑️' })
    setDeleting(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" /> Estoque de Insumos e Ração
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Acompanhamento do nível de ração, vacinas e sacos no galpão.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => setNovoOpen(true)}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Item
        </Button>
        <Button
          onClick={() => setEntradaOpen(true)}
          variant="outline"
          className="rounded-xl text-xs gap-2"
        >
          <ArrowDown className="w-4 h-4" /> Entrada
        </Button>
        <Button
          onClick={() => setSaidaOpen(true)}
          variant="outline"
          className="rounded-xl text-xs gap-2"
        >
          <ArrowUp className="w-4 h-4" /> Saída
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {inventory.length === 0 && (
          <Card className="rounded-3xl bg-white border-border shadow-subtle col-span-full">
            <CardContent className="p-8 text-center">
              <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhum item cadastrado</p>
            </CardContent>
          </Card>
        )}
        {inventory.map((item) => {
          const isLow = item.currentStock <= item.minStock
          return (
            <Card
              key={item.id}
              className={`rounded-3xl bg-white border-border shadow-subtle p-5 ${isLow ? 'border-amber-300 bg-amber-50/20' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground">{item.category}</span>
                <div className="flex items-center gap-2">
                  {isLow ? (
                    <Badge className="bg-amber-100 text-amber-800 text-[10px] gap-1">
                      <AlertTriangle className="w-3 h-3" /> Baixo
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Normal</Badge>
                  )}
                  <RecordActionMenu
                    onView={() => setDetails(item)}
                    onEdit={
                      canEdit
                        ? () => {
                            setEditing(item)
                            setEditOpen(true)
                          }
                        : undefined
                    }
                    onDelete={canDelete ? () => setDeleting(item) : undefined}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <h3 className="font-bold text-base text-foreground">{item.name}</h3>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Atual</span>
                  <span className="text-xl font-extrabold text-foreground">
                    {item.currentStock} {item.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">Custo Médio</span>
                  <span className="text-sm font-bold text-primary">
                    R$ {item.averageCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <NovoItemDialog open={novoOpen} onOpenChange={setNovoOpen} />
      <StockMovementDialog open={entradaOpen} onOpenChange={setEntradaOpen} type="entrada" />
      <StockMovementDialog open={saidaOpen} onOpenChange={setSaidaOpen} type="saida" />
      <EntityFormDialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v)
          if (!v) setEditing(null)
        }}
        title="Editar Item"
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={
          editing
            ? {
                name: editing.name,
                category: editing.category,
                unit: editing.unit,
                currentStock: String(editing.currentStock),
                minStock: String(editing.minStock),
                averageCost: String(editing.averageCost),
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
        title={`Estoque — ${details?.name || ''}`}
        badge={
          details
            ? details.currentStock <= details.minStock
              ? { label: 'Baixo', className: 'bg-amber-100 text-amber-800 text-[10px]' }
              : { label: 'Normal', className: 'bg-emerald-100 text-emerald-800 text-[10px]' }
            : null
        }
        rows={
          details
            ? [
                { label: 'Nome', value: details.name },
                { label: 'Categoria', value: details.category },
                { label: 'Unidade', value: details.unit },
                { label: 'Estoque atual', value: details.currentStock },
                { label: 'Estoque mínimo', value: details.minStock },
                { label: 'Custo médio (R$)', value: details.averageCost },
                { label: 'Fornecedor', value: details.supplier || '—' },
                { label: 'Marca', value: details.brand || '—' },
                { label: 'Peso da embalagem', value: details.packageWeight || '—' },
                { label: 'Última atualização', value: details.lastUpdated || '—' },
                { label: 'Observação', value: details.notes || '—' },
              ]
            : []
        }
      />
    </div>
  )
}
