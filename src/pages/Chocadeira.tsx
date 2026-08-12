import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { usePermissions } from '@/hooks/use-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  Thermometer,
  Droplets,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Search as SearchIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { IncubationDetail } from '@/components/IncubationDetail'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog'
import {
  DeleteIncubationDialog,
  HatchingDialog,
  FinalizeDialog,
} from '@/components/IncubationActionDialogs'
import { CandlingDialog } from '@/components/CandlingDialog'
import { IncubationEditDialog } from '@/components/IncubationEditDialog'
import { toast } from '@/hooks/use-toast'
import { Incubation } from '@/types/farm'
import { logAudit } from '@/services/audit'

export default function Chocadeira() {
  const { incubations, deleteIncubation, updateIncubation, finalizeIncubation, addCandling } =
    useFarmStore()
  const { canEdit, canDelete } = usePermissions()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Action dialog state
  const [editing, setEditing] = useState<Incubation | null>(null)
  const [deleting, setDeleting] = useState<Incubation | null>(null)
  const [candling, setCandling] = useState<Incubation | null>(null)
  const [hatching, setHatching] = useState<Incubation | null>(null)
  const [finalizing, setFinalizing] = useState<Incubation | null>(null)
  const [details, setDetails] = useState<Incubation | null>(null)

  const selected = incubations.find((i) => i.id === selectedId) || null

  if (selected) {
    return <IncubationDetail incubation={selected} onBack={() => setSelectedId(null)} />
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteIncubation(deleting.id)
    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
      return
    }
    await logAudit('DELETE', 'farm_incubations', deleting.id, deleting as any, null)
    toast({ title: 'Incubação excluída! 🗑️', description: `${deleting.code} foi removida.` })
    setDeleting(null)
  }

  const handleFinalize = async () => {
    if (!finalizing) return
    const { error } = await finalizeIncubation(finalizing.id, {
      hatchedCount: finalizing.hatchedCount || 0,
      unhatchedCount: finalizing.unhatchedCount || 0,
      healthyChicks: finalizing.healthyChicks || 0,
      deaths: finalizing.deaths || 0,
    })
    if (error) {
      toast({ title: 'Erro ao finalizar', variant: 'destructive' })
      return
    }
    toast({
      title: 'Incubação finalizada! ✅',
      description: `${finalizing.code} marcada como concluída.`,
    })
    setFinalizing(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-600" /> Chocadeira e Incubações
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Toque em uma incubação para ver detalhes. Use o menu ⋮ para editar, excluir, registrar
          ovoscopia, nascimento e finalizar.
        </p>
      </div>

      {incubations.length === 0 ? (
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-8 text-center">
          <Flame className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhuma incubação ativa</p>
          <p className="text-xs text-muted-foreground mt-1">
            Inicie uma nova incubação através de "Novo Lançamento".
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incubations.map((inc) => {
            const day = Math.max(
              1,
              Math.floor((Date.now() - new Date(inc.startDate).getTime()) / 86400000) + 1,
            )
            const badgeClass =
              inc.status === 'Em andamento'
                ? 'bg-orange-100 text-orange-800 text-xs'
                : inc.status === 'Concluído'
                  ? 'bg-emerald-100 text-emerald-800 text-xs'
                  : 'bg-gray-100 text-gray-800 text-xs'
            const isActive = inc.status === 'Em andamento'
            return (
              <Card
                key={inc.id}
                onClick={() => setSelectedId(inc.id)}
                className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all cursor-pointer group"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-sm">
                      {inc.code} • {inc.incubatorName}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className={badgeClass}>{inc.status}</Badge>
                      <RecordActionMenu
                        onView={() => setDetails(inc)}
                        onEdit={canEdit ? () => setEditing(inc) : undefined}
                        onDelete={canDelete ? () => setDeleting(inc) : undefined}
                        disabled={!canEdit}
                        extraItems={[
                          {
                            label: 'Registrar ovoscopia',
                            icon: SearchIcon,
                            onClick: () => setCandling(inc),
                            disabled: !canEdit || !isActive,
                          },
                          {
                            label: 'Registrar nascimento',
                            icon: Sparkles,
                            onClick: () => setHatching(inc),
                            disabled: !canEdit || !isActive,
                          },
                          {
                            label: 'Finalizar incubação',
                            icon: CheckCircle2,
                            onClick: () => setFinalizing(inc),
                            disabled: !canEdit || !isActive,
                          },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs bg-secondary/30 p-3 rounded-2xl">
                    <div>
                      <span className="text-muted-foreground block">Ovos</span>
                      <span className="font-bold text-foreground">{inc.eggCount} ovos</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Dia Atual</span>
                      <span className="font-bold text-orange-700">{day} / 21</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Início</span>
                      <span className="font-bold text-foreground">{inc.startDate}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Nascimento Previsto</span>
                      <span className="font-bold text-orange-700">{inc.expectedHatchDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs pt-1">
                    <span className="flex items-center gap-1 text-orange-700">
                      <Thermometer className="w-3.5 h-3.5" /> {inc.targetTemp}°C
                    </span>
                    <span className="flex items-center gap-1 text-blue-700">
                      <Droplets className="w-3.5 h-3.5" /> {inc.targetHumidity}%
                    </span>
                    <span className="ml-auto text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ver detalhes <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit */}
      <IncubationEditDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        incubation={editing || ({} as Incubation)}
        onSave={async (updates) => {
          if (!editing) return { error: null }
          return updateIncubation(editing.id, updates)
        }}
      />

      {/* Delete */}
      <DeleteIncubationDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={handleDelete}
      />

      {/* Candling */}
      <CandlingDialog
        open={!!candling}
        onOpenChange={(v) => !v && setCandling(null)}
        incubationId={candling?.id || ''}
        currentDay={
          candling
            ? Math.max(
                1,
                Math.floor((Date.now() - new Date(candling.startDate).getTime()) / 86400000) + 1,
              )
            : 1
        }
        onSave={async (data) => {
          if (!candling) return
          const { error } = await addCandling({ ...data, incubationId: candling.id })
          if (error) {
            toast({ title: 'Erro ao salvar ovoscopia', variant: 'destructive' })
            return
          }
          toast({ title: 'Ovoscopia registrada! 🔍' })
          setCandling(null)
        }}
      />

      {/* Hatching */}
      <HatchingDialog
        open={!!hatching}
        onOpenChange={(v) => !v && setHatching(null)}
        onSave={async (results) => {
          if (!hatching) return { error: null }
          const { error } = await updateIncubation(hatching.id, results as any)
          if (error) {
            toast({ title: 'Erro ao registrar nascimento', variant: 'destructive' })
            return { error }
          }
          toast({ title: 'Nascimento registrado! 🐥' })
          setHatching(null)
          return { error: null }
        }}
      />

      {/* Finalize */}
      <FinalizeDialog
        open={!!finalizing}
        onOpenChange={(v) => !v && setFinalizing(null)}
        onConfirm={handleFinalize}
      />

      {/* Details */}
      <RecordDetailsDialog
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
        title={`Incubação — ${details?.code || ''}`}
        badge={
          details
            ? { label: details.status, className: 'bg-orange-100 text-orange-800 text-[10px]' }
            : null
        }
        rows={
          details
            ? [
                { label: 'Código', value: details.code },
                { label: 'Incubadora', value: details.incubatorName },
                { label: 'Início', value: details.startDate },
                { label: 'Previsão de nascimento', value: details.expectedHatchDate },
                { label: 'Raça', value: details.breed },
                { label: 'Origem', value: details.origin },
                { label: 'Fornecedor', value: details.supplier },
                { label: 'Ovos', value: details.eggCount },
                { label: 'Custo dos ovos (R$)', value: details.eggCost },
                { label: 'Temperatura alvo (°C)', value: details.targetTemp },
                { label: 'Umidade alvo (%)', value: details.targetHumidity },
                { label: 'Viragem automática', value: details.autoTurning },
                { label: 'Nascidos', value: details.hatchedCount },
                { label: 'Não eclodidos', value: details.unhatchedCount },
                { label: 'Saudáveis', value: details.healthyChicks },
                { label: 'Mortes', value: details.deaths },
                { label: 'Custo de energia (R$)', value: details.energyCost },
                { label: 'Observação', value: details.notes },
              ]
            : []
        }
      />
    </div>
  )
}
