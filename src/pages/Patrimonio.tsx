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
import { Truck, Plus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import { Asset } from '@/types/farm'

const ASSET_SUGGESTIONS = [
  'Chocadeira',
  'Equipamentos',
  'Ferramentas',
  'Bombas',
  'Aeradores',
  'Estruturas',
  'Veículos',
  'Outros',
]

const CONDITIONS = ['Excelente', 'Bom', 'Regular', 'Necessita manutenção']
const STATUSES = ['Em uso', 'Ocioso', 'Em manutenção', 'Descartado']

interface FormState {
  name: string
  category: string
  acquisitionDate: string
  value: string
  usefulLifeYears: string
  condition: Asset['condition']
  location: string
  status: Asset['status']
}

const emptyForm: FormState = {
  name: '',
  category: 'Equipamentos',
  acquisitionDate: new Date().toISOString().split('T')[0],
  value: '',
  usefulLifeYears: '5',
  condition: 'Bom',
  location: '',
  status: 'Em uso',
}

export default function Patrimonio() {
  const { assets, addAsset, updateAsset, deleteAsset, structures } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [deleting, setDeleting] = useState<Asset | null>(null)
  const [details, setDetails] = useState<Asset | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const totalAssetsValue = assets.reduce((acc, a) => acc + a.value, 0)
  const totalStructures = structures.reduce((acc, s) => acc + s.totalValue, 0)
  const grandTotal = totalAssetsValue + totalStructures

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (a: Asset) => {
    setEditing(a)
    setForm({
      name: a.name,
      category: a.category,
      acquisitionDate: a.acquisitionDate,
      value: String(a.value),
      usefulLifeYears: String(a.usefulLifeYears),
      condition: a.condition,
      location: a.location,
      status: a.status,
    })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data: Omit<Asset, 'id'> = {
        name: form.name,
        category: form.category,
        acquisitionDate: form.acquisitionDate,
        value: Number(form.value) || 0,
        usefulLifeYears: Number(form.usefulLifeYears) || 1,
        condition: form.condition,
        location: form.location || 'Não especificado',
        status: form.status,
      }
      if (editing) {
        const { error } = await updateAsset(editing.id, data)
        if (error) throw new Error(error.message)
        await logAudit('UPDATE', 'farm_assets', editing.id, editing as any, data as any)
        toast({ title: 'Bem atualizado! ✅' })
      } else {
        const { error } = await addAsset({ ...data, id: `ast-${Date.now()}` } as any)
        if (error) throw new Error(error.message)
        toast({ title: 'Patrimônio registrado! 🏗️', description: data.name })
      }
      setOpen(false)
      setEditing(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const { error } = await deleteAsset(deleting.id)
      if (error) throw new Error(error.message)
      await logAudit('DELETE', 'farm_assets', deleting.id, deleting as any, null)
      toast({ title: 'Bem excluído! 🗑️' })
      setDeleting(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  const getDepreciation = (asset: Asset) => {
    const yearsElapsed =
      (Date.now() - new Date(asset.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
    const depPerYear = asset.usefulLifeYears > 0 ? asset.value / asset.usefulLifeYears : 0
    const accumulated = Math.min(depPerYear * yearsElapsed, asset.value)
    const netValue = Math.max(0, asset.value - accumulated)
    return { depPerYear, accumulated, netValue }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" /> Patrimônio e Bens
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Inventário de equipamentos, estruturas e investimentos da fazenda.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-primary text-white text-xs gap-2">
          <Plus className="w-4 h-4" /> Novo Bem
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Equipamentos e Bens</span>
            <p className="text-2xl font-extrabold text-primary">R$ {totalAssetsValue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Estruturas (CAPEX)</span>
            <p className="text-2xl font-extrabold text-primary">R$ {totalStructures.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Patrimônio Total</span>
            <p className="text-2xl font-extrabold text-emerald-700">R$ {grandTotal.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((ast) => {
          const dep = getDepreciation(ast)
          return (
            <Card key={ast.id} className="rounded-2xl bg-white border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-foreground">{ast.name}</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    {ast.condition}
                  </Badge>
                  <RecordActionMenu
                    onViewDetails={() => setDetails(ast)}
                    onEdit={() => openEdit(ast)}
                    onDelete={() => setDeleting(ast)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {ast.category} • {ast.location} • {ast.status}
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Valor</span>
                  <span className="font-bold text-foreground">R$ {ast.value.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Dep./ano</span>
                  <span className="font-bold text-amber-700">R$ {dep.depPerYear.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Valor líquido</span>
                  <span className="font-bold text-emerald-700">R$ {dep.netValue.toFixed(0)}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Vida útil: {ast.usefulLifeYears} anos • Aquisição: {ast.acquisitionDate}
              </p>
            </Card>
          )
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => !v && (setOpen(false), setEditing(null))}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editing ? 'Editar Bem' : 'Registrar Novo Bem Patrimonial'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastro de patrimônio. Nenhum lote é necessário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Descrição *</Label>
              <Input
                placeholder="Ex: Chocadeira 120 ovos"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <CategorySelect
              label="Categoria"
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              storageKey="asset"
              suggestions={ASSET_SUGGESTIONS}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data de Aquisição</Label>
                <Input
                  type="date"
                  value={form.acquisitionDate}
                  onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Vida Útil (anos)</Label>
                <Input
                  type="number"
                  value={form.usefulLifeYears}
                  onChange={(e) => setForm({ ...form, usefulLifeYears: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Estado de Conservação</Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) => setForm({ ...form, condition: v as Asset['condition'] })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Local</Label>
                <Input
                  placeholder="Ex: Galinheiro Principal"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as Asset['status'] })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              {editing ? 'Salvar Alterações' : 'Adicionar Patrimônio ✨'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details */}
      <Dialog open={!!details} onOpenChange={(v) => !v && setDetails(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Detalhes do Bem</DialogTitle>
          </DialogHeader>
          {details && (
            <div className="space-y-2 text-xs">
              <p>
                <strong>Nome:</strong> {details.name}
              </p>
              <p>
                <strong>Categoria:</strong> {details.category}
              </p>
              <p>
                <strong>Aquisição:</strong> {details.acquisitionDate}
              </p>
              <p>
                <strong>Valor:</strong> R$ {details.value.toFixed(2)}
              </p>
              <p>
                <strong>Vida útil:</strong> {details.usefulLifeYears} anos
              </p>
              <p>
                <strong>Condição:</strong> {details.condition}
              </p>
              <p>
                <strong>Local:</strong> {details.location}
              </p>
              <p>
                <strong>Status:</strong> {details.status}
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
