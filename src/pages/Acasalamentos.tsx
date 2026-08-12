import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import { Dna, Plus } from 'lucide-react'
import { Mating } from '@/types/farm'

const emptyForm = {
  roosterCode: '',
  henCodes: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  goal: '',
  targetTrait: '',
  status: 'Ativo' as 'Ativo' | 'Concluído',
}

export default function Acasalamentos() {
  const { matings, addMating, updateMating, deleteMating } = useFarmStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Mating | null>(null)
  const [deleting, setDeleting] = useState<Mating | null>(null)
  const [details, setDetails] = useState<Mating | null>(null)
  const [form, setForm] = useState(emptyForm)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (m: Mating) => {
    setEditing(m)
    setForm({
      roosterCode: m.roosterCode,
      henCodes: m.henCodes.join(', '),
      startDate: m.startDate,
      endDate: m.endDate || '',
      goal: m.goal,
      targetTrait: m.targetTrait,
      status: m.status,
    })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        roosterCode: form.roosterCode,
        henCodes: form.henCodes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        goal: form.goal,
        targetTrait: form.targetTrait,
        status: form.status,
      }
      if (editing) {
        const { error } = await updateMating(editing.id, data)
        if (error) throw new Error(error.message)
        await logAudit('UPDATE', 'farm_matings', editing.id, editing as any, data as any)
        toast({ title: 'Acasalamento atualizado! ✅' })
      } else {
        const { error } = await addMating({ ...data, id: `mt-${Date.now()}` } as any)
        if (error) throw new Error(error.message)
        toast({ title: 'Acasalamento registrado! ✅' })
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
      const { error } = await deleteMating(deleting.id)
      if (error) throw new Error(error.message)
      await logAudit('DELETE', 'farm_matings', deleting.id, deleting as any, null)
      toast({ title: 'Acasalamento excluído! 🗑️' })
      setDeleting(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Dna className="w-6 h-6 text-purple-600" /> Genética e Acasalamentos
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Planejamento de cruzamentos dirigidos para ganho de peso e rusticidade.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-primary text-white text-xs gap-2">
          <Plus className="w-4 h-4" /> Novo Acasalamento
        </Button>
      </div>

      {matings.length === 0 && (
        <Card className="p-8 text-center rounded-2xl bg-white border-border">
          <Dna className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">
            Nenhum acasalamento registrado
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Clique em "Novo Acasalamento" para começar.
          </p>
        </Card>
      )}

      {matings.map((m) => (
        <Card key={m.id} className="p-5 rounded-3xl bg-white border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm text-primary">Galo: {m.roosterCode}</p>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  m.status === 'Ativo'
                    ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                    : 'bg-gray-100 text-gray-800 text-[10px]'
                }
              >
                {m.status}
              </Badge>
              <RecordActionMenu
                onViewDetails={() => setDetails(m)}
                onEdit={() => openEdit(m)}
                onDelete={() => setDeleting(m)}
              />
            </div>
          </div>
          <p className="text-muted-foreground">Galinhas no grupo: {m.henCodes.join(', ') || '—'}</p>
          <p className="font-semibold text-foreground">Objetivo: {m.goal}</p>
          <p className="text-muted-foreground">
            Início: {m.startDate}
            {m.endDate ? ` • Fim: ${m.endDate}` : ''}
          </p>
        </Card>
      ))}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => !v && (setOpen(false), setEditing(null))}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editing ? 'Editar Acasalamento' : 'Novo Acasalamento'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registro de cruzamento dirigido.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Código do Galo *</Label>
              <Input
                value={form.roosterCode}
                onChange={(e) => setForm({ ...form, roosterCode: e.target.value })}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Códigos das Galinhas (separados por vírgula)</Label>
              <Textarea
                value={form.henCodes}
                onChange={(e) => setForm({ ...form, henCodes: e.target.value })}
                className="text-xs rounded-xl"
                placeholder="Ex: G001, G002, G003"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data de Início</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Data de Fim (opcional)</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Objetivo do Cruzamento</Label>
              <Input
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                className="h-10 text-xs rounded-xl"
                placeholder="Ex: Ganho de peso"
              />
            </div>
            <div>
              <Label className="text-xs">Característica-alvo</Label>
              <Input
                value={form.targetTrait}
                onChange={(e) => setForm({ ...form, targetTrait: e.target.value })}
                className="h-10 text-xs rounded-xl"
                placeholder="Ex: Rusticidade"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as 'Ativo' | 'Concluído' })}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo" className="text-xs">
                    Ativo
                  </SelectItem>
                  <SelectItem value="Concluído" className="text-xs">
                    Concluído
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              {editing ? 'Salvar Alterações' : 'Registrar Acasalamento ✨'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details */}
      <Dialog open={!!details} onOpenChange={(v) => !v && setDetails(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Detalhes do Acasalamento</DialogTitle>
          </DialogHeader>
          {details && (
            <div className="space-y-2 text-xs">
              <p>
                <strong>Galo:</strong> {details.roosterCode}
              </p>
              <p>
                <strong>Galinhas:</strong> {details.henCodes.join(', ') || '—'}
              </p>
              <p>
                <strong>Objetivo:</strong> {details.goal}
              </p>
              <p>
                <strong>Característica-alvo:</strong> {details.targetTrait || '—'}
              </p>
              <p>
                <strong>Início:</strong> {details.startDate}
              </p>
              <p>
                <strong>Fim:</strong> {details.endDate || '—'}
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
