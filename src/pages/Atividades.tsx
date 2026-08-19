import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { usePermissions } from '@/hooks/use-permissions'
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
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog'
import {
  ListTodo,
  Plus,
  Bird,
  Fish,
  PiggyBank,
  Beef,
  PawPrint,
  Wheat,
  HelpCircle,
} from 'lucide-react'
import { Activity, ACTIVITY_TYPES, ActivityType } from '@/types/farm'
import { toast } from '@/hooks/use-toast'

// Mapa de ícones por tipo de atividade (para mobile/PWA fica mais visual)
const TYPE_ICON: Record<ActivityType, any> = {
  Avicultura: Bird,
  Piscicultura: Fish,
  Suinocultura: PiggyBank,
  Bovinocultura: Beef,
  Ovinocultura: PawPrint,
  Caprinocultura: PawPrint,
  Agricultura: Wheat,
  Outra: HelpCircle,
}

interface FormState {
  name: string
  type: ActivityType
  customType: string
  description: string
}

const emptyForm = (): FormState => ({
  name: '',
  type: 'Avicultura',
  customType: '',
  description: '',
})

function toForm(a: Activity): FormState {
  return {
    name: a.name,
    type: a.type,
    customType: a.customType || '',
    description: a.description || '',
  }
}

function displayType(a: Activity): string {
  if (a.type === 'Outra' && a.customType) return a.customType
  return a.type
}

export default function Atividades() {
  const { activities, lots, addActivity, updateActivity, deleteActivity } = useFarmStore()
  const { canEdit, canDelete } = usePermissions()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [deleting, setDeleting] = useState<Activity | null>(null)
  const [details, setDetails] = useState<Activity | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  const openEdit = (a: Activity) => {
    setEditing(a)
    setForm(toForm(a))
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast({ title: 'Informe o nome da atividade', variant: 'destructive' })
      return
    }
    if (form.type === 'Outra' && !form.customType.trim()) {
      toast({
        title: 'Informe o tipo personalizado',
        description: 'Ao escolher "Outra", descreva o tipo da atividade.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        customType: form.type === 'Outra' ? form.customType.trim() : '',
        description: form.description.trim(),
        isActive: true,
      }

      if (editing) {
        const { error } = await updateActivity(editing.id, payload)
        if (error) throw new Error(error.message)
        toast({ title: 'Atividade atualizada! ✅', description: 'Alterações salvas no Supabase.' })
      } else {
        const { error } = await addActivity(payload)
        if (error) throw new Error(error.message)
        toast({ title: 'Atividade criada! 🌱', description: `"${payload.name}" cadastrada.` })
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
      const { error } = await deleteActivity(deleting.id)
      if (error) throw new Error(error.message)
      toast({
        title: 'Atividade desativada! 🗑️',
        description: 'A atividade foi arquivada (soft delete).',
      })
      setDeleting(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao desativar',
        description: err?.message || 'Falha na operação.',
        variant: 'destructive',
      })
    }
  }

  // Lotes vinculados (não deletados) por atividade
  const lotCountByActivity = (activityId: string): number =>
    lots.filter((l) => l.activityId === activityId).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-primary" /> Atividades
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastre as atividades produtivas da propriedade (avicultura, piscicultura, etc.) e
            vincule aos lotes e à precificação.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Atividade
        </Button>
      </div>

      {/* Lista / Cards */}
      {activities.length === 0 ? (
        <Card className="rounded-3xl bg-white border-border shadow-subtle">
          <CardContent className="p-8 text-center">
            <ListTodo className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">
              Nenhuma atividade cadastrada
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em "Nova Atividade" para começar. As atividades organizam lotes, custos e
              precificação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((act) => {
            const Icon = TYPE_ICON[act.type] || ListTodo
            const linkedLots = lotCountByActivity(act.id)
            return (
              <Card
                key={act.id}
                className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          act.isActive
                            ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                            : 'bg-muted text-muted-foreground text-[10px]'
                        }
                      >
                        {act.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <RecordActionMenu
                        onView={() => setDetails(act)}
                        onEdit={canEdit ? () => openEdit(act) : undefined}
                        onDelete={canDelete ? () => setDeleting(act) : undefined}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-foreground">{act.name}</h3>
                    <p className="text-xs text-muted-foreground">{displayType(act)}</p>
                    {act.description && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {act.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Tipo</span>
                      <span className="font-bold text-foreground">{displayType(act)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Lotes vinculados
                      </span>
                      <span className="font-bold text-foreground">{linkedLots}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => !v && (setOpen(false), setEditing(null))}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editing ? 'Editar Atividade' : 'Nova Atividade'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editing
                ? 'Altere os campos e salve. A alteração reflete em todos os lotes vinculados.'
                : 'Cadastre uma atividade produtiva. Lotes e custos podem ser vinculados a ela.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Nome da Atividade *</Label>
              <Input
                placeholder="Ex: Avicultura de Postura"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 text-xs rounded-xl"
                required
                autoFocus
              />
            </div>

            <div>
              <Label className="text-xs">Tipo de Atividade *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as ActivityType })}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.type === 'Outra' && (
              <div>
                <Label className="text-xs">Especifique o tipo *</Label>
                <Input
                  placeholder="Ex: Helicicultura"
                  value={form.customType}
                  onChange={(e) => setForm({ ...form, customType: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
            )}

            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea
                placeholder="Detalhes da atividade..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Criar Atividade'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <RecordDetailsDialog
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
        title={`Atividade — ${details?.name || ''}`}
        badge={
          details
            ? {
                label: details.isActive ? 'Ativa' : 'Inativa',
                className: details.isActive
                  ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                  : 'bg-muted text-muted-foreground text-[10px]',
              }
            : null
        }
        rows={
          details
            ? [
                { label: 'Nome', value: details.name },
                { label: 'Tipo', value: displayType(details) },
                { label: 'Descrição', value: details.description },
                { label: 'Lotes vinculados', value: lotCountByActivity(details.id) },
                { label: 'Status', value: details.isActive ? 'Ativa' : 'Inativa' },
              ]
            : []
        }
      />

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={handleDelete}
        title="Tem certeza que deseja desativar esta atividade?"
        description={
          deleting
            ? (() => {
                const n = lotCountByActivity(deleting.id)
                if (n > 0) {
                  return `Esta atividade possui ${n} lote(s) vinculado(s). Os lotes NÃO serão excluídos, apenas ficarão sem atividade.`
                }
                return 'A atividade será arquivada (soft delete) e não aparecerá nas listagens.'
              })()
            : ''
        }
      />
    </div>
  )
}
