import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { CategorySelect } from '@/components/CategorySelect'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import { Building2, Plus, CheckCircle, DollarSign } from 'lucide-react'
import { StructureCost, Expense } from '@/types/farm'

const STRUCTURE_SUGGESTIONS = [
  'Madeira',
  'Tela',
  'Telhado',
  'Piso',
  'Concreto',
  'Alvenaria',
  'Portões',
  'Cerca',
  'Hidráulica',
  'Elétrica',
  "Caixa d'água",
  'Bebedouros',
  'Comedouros',
  'Chocadeira',
  'Equipamentos',
  'Ferramentas',
  'Mão de obra',
  'Transporte',
  'Terraplanagem',
  'Outros',
]

const PAYMENT_METHODS = ['Pix', 'Dinheiro', 'Cartão', 'Boleto', 'Transferência', 'Cheque']
const STATUS_OPTIONS = ['Pago', 'Pendente', 'Parcial']

interface FormState {
  date: string
  category: string
  description: string
  quantity: string
  unit: string
  unitValue: string
  supplier: string
  paymentMethod: string
  center: string
  status: 'Pago' | 'Pendente' | 'Parcial'
  notes: string
  generateCapex: boolean
}

const emptyForm = (): FormState => ({
  date: new Date().toISOString().split('T')[0],
  category: 'Madeira',
  description: '',
  quantity: '1',
  unit: 'unid',
  unitValue: '',
  supplier: '',
  paymentMethod: 'Pix',
  center: '',
  status: 'Pago',
  notes: '',
  generateCapex: true,
})

function toForm(s: StructureCost): FormState {
  return {
    date: s.date,
    category: s.category,
    description: s.description,
    quantity: String(s.quantity),
    unit: s.unit,
    unitValue: String(s.unitValue),
    supplier: s.supplier,
    paymentMethod: s.paymentMethod,
    center: s.center || '',
    status: s.isPaid ? 'Pago' : 'Pendente',
    notes: s.notes || '',
    generateCapex: true,
  }
}

export default function Estrutura() {
  const {
    structures,
    addStructure,
    updateStructure,
    deleteStructure,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<StructureCost | null>(null)
  const [deleting, setDeleting] = useState<StructureCost | null>(null)
  const [details, setDetails] = useState<StructureCost | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)

  const totalInvested = structures.reduce((acc, s) => acc + s.totalValue, 0)
  const totalPaid = structures.filter((s) => s.isPaid).reduce((acc, s) => acc + s.totalValue, 0)
  const byCategory = structures.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + s.totalValue
    return acc
  }, {})

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  const openEdit = (s: StructureCost) => {
    setEditing(s)
    setForm(toForm(s))
    setOpen(true)
  }

  // Find the CAPEX expense linked to a structure (source_type=STRUCTURE, source_id=structure.id)
  const findLinkedExpense = (structureId: string): Expense | undefined =>
    expenses.find((e) => e.source_type === 'STRUCTURE' && e.source_id === structureId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const quantity = Number(form.quantity) || 1
      const unitValue = Number(form.unitValue) || 0
      const totalValue = Number((quantity * unitValue).toFixed(2))
      const isPaid = form.status === 'Pago'

      if (editing) {
        // UPDATE structure
        const updates: Partial<StructureCost> = {
          date: form.date,
          category: form.category,
          description: form.description || `Investimento em ${form.category}`,
          quantity,
          unit: form.unit,
          unitValue,
          totalValue,
          supplier: form.supplier || 'Fornecedor Local',
          paymentMethod: form.paymentMethod,
          center: form.center || 'Galinheiro Principal',
          isPaid,
          notes: form.notes,
        }
        const { error } = await updateStructure(editing.id, updates)
        if (error) throw new Error(error.message)

        // If a linked CAPEX expense exists, update it (don't create another)
        const linked = findLinkedExpense(editing.id)
        if (linked) {
          await updateExpense(linked.id, {
            date: form.date,
            description: updates.description,
            category: form.category as Expense['category'],
            quantity,
            unitValue,
            totalValue,
            isPaid,
          })
        } else if (form.generateCapex) {
          // No linked expense yet but user wants CAPEX — create one
          await addExpense({
            date: form.date,
            category: form.category,
            description: updates.description || `Investimento em ${form.category}`,
            quantity,
            unitValue,
            supplier: form.supplier || 'Fornecedor Local',
            paymentMethod: form.paymentMethod,
            isPaid,
            source_type: 'STRUCTURE',
            source_id: editing.id,
          } as any)
        }

        toast({
          title: 'Investimento atualizado! ✅',
          description: 'Alterações salvas no Supabase.',
        })
      } else {
        // CREATE structure
        const newId = `st-${Date.now()}`
        const record: Omit<StructureCost, 'totalValue'> & { id: string } = {
          id: newId,
          date: form.date,
          category: form.category,
          description: form.description || `Investimento em ${form.category}`,
          quantity,
          unit: form.unit,
          unitValue,
          supplier: form.supplier || 'Fornecedor Local',
          paymentMethod: form.paymentMethod,
          center: form.center || 'Galinheiro Principal',
          isPaid,
          notes: form.notes,
        }
        const { error } = await addStructure(record as any)
        if (error) throw new Error(error.message)

        // Generate CAPEX expense linked to this structure
        if (form.generateCapex) {
          await addExpense({
            date: form.date,
            category: form.category,
            description: record.description,
            quantity,
            unitValue,
            supplier: record.supplier,
            paymentMethod: record.paymentMethod,
            isPaid,
            source_type: 'STRUCTURE',
            source_id: newId,
          } as any)
        }

        toast({
          title: 'Investimento Registrado! 🏗️',
          description: 'Custo de estrutura adicionado ao CAPEX.',
        })
      }
      setOpen(false)
      setEditing(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Falha na operação.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const linked = findLinkedExpense(deleting.id)
      // Soft-delete structure
      const { error } = await deleteStructure(deleting.id)
      if (error) throw new Error(error.message)
      // Remove/soft-delete linked CAPEX expense (no orphans)
      if (linked) {
        await deleteExpense(linked.id)
      }
      await logAudit('DELETE', 'farm_structures', deleting.id, deleting as any)
      toast({
        title: 'Investimento excluído! 🗑️',
        description: 'CAPEX relacionado também removido.',
      })
      setDeleting(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Falha na operação.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Implantação e Estrutura (CAPEX)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Controle de investimentos para construção, telhado, telas e melhorias da propriedade.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-primary text-white text-xs gap-2">
          <Plus className="w-4 h-4" /> Novo Investimento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Total Investido na Estrutura</span>
            <p className="text-2xl font-extrabold text-primary">R$ {totalInvested.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Total Pago</span>
            <p className="text-2xl font-extrabold text-emerald-700">R$ {totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Pendente</span>
            <p className="text-2xl font-extrabold text-amber-600">
              R$ {(totalInvested - totalPaid).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {Object.keys(byCategory).length > 0 && (
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
          <h2 className="text-base font-bold mb-3">Total por Categoria</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byCategory).map(([cat, val]) => (
              <Badge key={cat} className="bg-primary/10 text-primary text-xs py-1.5">
                {cat}: R$ {val.toFixed(2)}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
        <h2 className="text-base font-bold mb-3">Histórico de Estrutura</h2>
        <div className="space-y-2">
          {structures.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum investimento registrado.
            </p>
          )}
          {structures.map((s) => {
            const hasCapex = !!findLinkedExpense(s.id)
            return (
              <div
                key={s.id}
                className="p-3 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{s.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.category} • {s.quantity} {s.unit} x R$ {s.unitValue.toFixed(2)}
                    {s.supplier ? ` • ${s.supplier}` : ''}
                    {hasCapex && ' • CAPEX'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="font-extrabold text-primary">R$ {s.totalValue.toFixed(2)}</p>
                    <span
                      className={`text-[10px] font-semibold flex items-center gap-1 justify-end ${
                        s.isPaid ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {s.isPaid ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Pago
                        </>
                      ) : (
                        'Pendente'
                      )}
                    </span>
                  </div>
                  <RecordActionMenu
                    onViewDetails={() => setDetails(s)}
                    onEdit={() => openEdit(s)}
                    onDelete={() => setDeleting(s)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => !v && (setOpen(false), setEditing(null))}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editing ? 'Editar Investimento' : 'Novo Investimento'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editing
                ? 'Altere os campos e salve. O CAPEX relacionado será atualizado.'
                : 'Registre um investimento de estrutura. Um lançamento CAPEX pode ser gerado automaticamente.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            <CategorySelect
              label="Categoria"
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              storageKey="structure"
              suggestions={STRUCTURE_SUGGESTIONS}
            />

            <div>
              <Label className="text-xs">Descrição do Item</Label>
              <Input
                placeholder="Ex: Telhas onduladas de 2.4m"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Quantidade</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Unidade</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['unid', 'm', 'm²', 'm³', 'KG', 'L', 'saco', 'horas', 'dia'].map((u) => (
                      <SelectItem key={u} value={u} className="text-xs">
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Valor Unit. (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.unitValue}
                  onChange={(e) => setForm({ ...form, unitValue: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Valor Total (R$)</Label>
                <Input
                  value={((Number(form.quantity) || 0) * (Number(form.unitValue) || 0)).toFixed(2)}
                  readOnly
                  className="h-10 text-xs rounded-xl bg-secondary/50 font-bold"
                />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as FormState['status'] })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Fornecedor</Label>
                <Input
                  placeholder="Opcional"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">Forma de Pagamento</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v) => setForm({ ...form, paymentMethod: v })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Local / Centro</Label>
              <Input
                placeholder="Ex: Galinheiro Principal"
                value={form.center}
                onChange={(e) => setForm({ ...form, center: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea
                placeholder="Opcional"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.generateCapex}
                onChange={(e) => setForm({ ...form, generateCapex: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-xs flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Registrar também como despesa CAPEX no
                financeiro
              </span>
            </label>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Salvar Investimento'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!details} onOpenChange={(v) => !v && setDetails(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Detalhes do Investimento</DialogTitle>
          </DialogHeader>
          {details && (
            <div className="space-y-2 text-xs">
              <p>
                <strong>Descrição:</strong> {details.description}
              </p>
              <p>
                <strong>Categoria:</strong> {details.category}
              </p>
              <p>
                <strong>Data:</strong> {details.date}
              </p>
              <p>
                <strong>Quantidade:</strong> {details.quantity} {details.unit}
              </p>
              <p>
                <strong>Valor Unitário:</strong> R$ {details.unitValue.toFixed(2)}
              </p>
              <p>
                <strong>Valor Total:</strong> R$ {details.totalValue.toFixed(2)}
              </p>
              <p>
                <strong>Fornecedor:</strong> {details.supplier || '—'}
              </p>
              <p>
                <strong>Pagamento:</strong> {details.paymentMethod}
              </p>
              <p>
                <strong>Local:</strong> {details.center || '—'}
              </p>
              <p>
                <strong>Status:</strong> {details.isPaid ? 'Pago' : 'Pendente'}
              </p>
              {details.notes && (
                <p>
                  <strong>Observações:</strong> {details.notes}
                </p>
              )}
              <p>
                <strong>CAPEX:</strong>{' '}
                {findLinkedExpense(details.id) ? 'Vinculado ao financeiro' : 'Não vinculado'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
