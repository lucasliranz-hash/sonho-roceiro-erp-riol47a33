import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Microscope,
  Thermometer,
  FileText,
  Baby,
  CheckCircle,
  Flame,
  Calendar,
  Egg,
} from 'lucide-react'
import { Incubation } from '@/types/farm'
import { IncubationEditDialog } from '@/components/IncubationEditDialog'
import { CandlingDialog } from '@/components/CandlingDialog'
import {
  DeleteIncubationDialog,
  ObservationDialog,
  TempHumidityDialog,
  HatchingDialog,
  FinalizeDialog,
} from '@/components/IncubationActionDialogs'
import { toast } from '@/hooks/use-toast'

interface Props {
  incubation: Incubation
  onBack: () => void
}

export function IncubationDetail({ incubation, onBack }: Props) {
  const { candlings, updateIncubation, deleteIncubation, addCandling, finalizeIncubation } =
    useFarmStore()
  const [editOpen, setEditOpen] = useState(false)
  const [candlingOpen, setCandlingOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [obsOpen, setObsOpen] = useState(false)
  const [tempHumOpen, setTempHumOpen] = useState(false)
  const [hatchOpen, setHatchOpen] = useState(false)
  const [finalizeOpen, setFinalizeOpen] = useState(false)

  const incCandlings = candlings.filter((c) => c.incubationId === incubation.id)
  const currentDay = Math.max(
    1,
    Math.floor((Date.now() - new Date(incubation.startDate).getTime()) / 86400000) + 1,
  )
  const isActive = incubation.status === 'Em andamento'
  const hatchRate =
    incubation.eggCount > 0 && incubation.hatchedCount
      ? ((incubation.hatchedCount / incubation.eggCount) * 100).toFixed(1)
      : null

  const handleDelete = async () => {
    const { error } = await deleteIncubation(incubation.id)
    if (error) {
      toast({
        title: 'Erro ao excluir ❌',
        description: error?.message || 'Falha ao excluir incubação.',
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Incubação excluída', description: `${incubation.code} foi removida.` })
    onBack()
  }

  const handleFinalize = async () => {
    const { error } = await finalizeIncubation(incubation.id, {
      hatchedCount: incubation.hatchedCount || 0,
      unhatchedCount: incubation.unhatchedCount || 0,
      healthyChicks: incubation.healthyChicks || 0,
      deaths: incubation.deaths || 0,
    })
    if (error) {
      toast({
        title: 'Erro ao finalizar ❌',
        description: error?.message || 'Falha ao finalizar incubação.',
        variant: 'destructive',
      })
      return
    }
    toast({
      title: 'Incubação finalizada',
      description: `${incubation.code} marcada como concluída.`,
    })
  }

  const actions = [
    { label: 'Editar', icon: Pencil, onClick: () => setEditOpen(true), disabled: false },
    {
      label: 'Ovoscopia',
      icon: Microscope,
      onClick: () => setCandlingOpen(true),
      disabled: !isActive,
    },
    {
      label: 'Temp/Umid',
      icon: Thermometer,
      onClick: () => setTempHumOpen(true),
      disabled: !isActive,
    },
    { label: 'Observação', icon: FileText, onClick: () => setObsOpen(true), disabled: false },
    { label: 'Nascimento', icon: Baby, onClick: () => setHatchOpen(true), disabled: !isActive },
    {
      label: 'Finalizar',
      icon: CheckCircle,
      onClick: () => setFinalizeOpen(true),
      disabled: !isActive,
    },
    { label: 'Excluir', icon: Trash2, onClick: () => setDeleteOpen(true), disabled: false },
  ]

  const statusBadgeClass =
    incubation.status === 'Em andamento'
      ? 'bg-orange-100 text-orange-800'
      : incubation.status === 'Concluído'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-gray-100 text-gray-800'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" /> {incubation.code}
          </h1>
          <p className="text-xs text-muted-foreground">
            {incubation.incubatorName} • {incubation.breed}
          </p>
        </div>
        <Badge className={statusBadgeClass}>{incubation.status}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Dia Atual', value: `${currentDay} / 21` },
          { label: 'Ovos', value: `${incubation.eggCount}` },
          { label: 'Início', value: incubation.startDate },
          { label: 'Previsão', value: incubation.expectedHatchDate },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl bg-white border-border">
            <CardContent className="p-3">
              <span className="text-[11px] text-muted-foreground">{item.label}</span>
              <p className="text-sm font-bold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-border text-center">
          <span className="text-[11px] text-muted-foreground block">Temp. Alvo</span>
          <span className="text-sm font-bold text-orange-700">{incubation.targetTemp}°C</span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-border text-center">
          <span className="text-[11px] text-muted-foreground block">Umidade Alvo</span>
          <span className="text-sm font-bold text-blue-700">{incubation.targetHumidity}%</span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-border text-center">
          <span className="text-[11px] text-muted-foreground block">Viragem</span>
          <span className="text-sm font-bold text-foreground">
            {incubation.autoTurning ? 'Automática' : 'Manual'}
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Linha do Tempo</h4>
        <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
          <div
            className={`p-2 rounded-xl font-bold ${currentDay >= 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary text-muted-foreground'}`}
          >
            Dia 1: Início
          </div>
          <div
            className={`p-2 rounded-xl font-bold ${currentDay >= 7 ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary text-muted-foreground'}`}
          >
            Dia 7: Ovoscopia
          </div>
          <div
            className={`p-2 rounded-xl font-bold ${currentDay >= 14 ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary text-muted-foreground'}`}
          >
            Dia 14: Ovoscopia
          </div>
          <div
            className={`p-2 rounded-xl font-bold ${currentDay >= 18 ? 'bg-amber-100 text-amber-800' : 'bg-secondary text-muted-foreground'}`}
          >
            Dia 18: Lockdown
          </div>
          <div
            className={`p-2 rounded-xl font-bold ${currentDay >= 21 ? 'bg-orange-100 text-orange-800' : 'bg-secondary text-muted-foreground'}`}
          >
            Dia 21: Nascimento
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {actions.map((act) => {
          const Icon = act.icon
          return (
            <Button
              key={act.label}
              variant="outline"
              onClick={act.onClick}
              disabled={act.disabled}
              className="rounded-xl h-16 flex-col gap-1 text-xs"
            >
              <Icon className="w-5 h-5" />
              <span>{act.label}</span>
            </Button>
          )
        })}
      </div>

      <Card className="rounded-2xl bg-white border-border p-4">
        <h3 className="text-xs font-bold mb-2">Ovoscopias Registradas</h3>
        {incCandlings.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma ovoscopia registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {incCandlings.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded-xl bg-secondary/50 text-xs"
              >
                <span>
                  Dia {c.day} • {c.date}
                </span>
                <span className="font-bold text-emerald-700">{c.fertile} férteis</span>
                <span className="text-rose-600">{c.infertile} inférteis</span>
                <span className="text-amber-600">{c.deadEmbryo} mortos</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {incubation.status === 'Concluído' && (
        <Card className="rounded-2xl bg-white border-border p-4">
          <h3 className="text-xs font-bold mb-2">Resultados</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Nascidos: </span>
              <span className="font-bold">{incubation.hatchedCount || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Não eclodidos: </span>
              <span className="font-bold">{incubation.unhatchedCount || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Saudáveis: </span>
              <span className="font-bold text-emerald-700">{incubation.healthyChicks || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Mortes: </span>
              <span className="font-bold text-rose-600">{incubation.deaths || 0}</span>
            </div>
            {hatchRate && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Taxa de Eclosão: </span>
                <span className="font-bold text-primary">{hatchRate}%</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {incubation.notes && (
        <Card className="rounded-2xl bg-white border-border p-4">
          <h3 className="text-xs font-bold mb-1">Observações</h3>
          <p className="text-xs text-muted-foreground">{incubation.notes}</p>
        </Card>
      )}

      <IncubationEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        incubation={incubation}
        onSave={async (updates) => await updateIncubation(incubation.id, updates)}
      />
      <CandlingDialog
        open={candlingOpen}
        onOpenChange={setCandlingOpen}
        incubationId={incubation.id}
        currentDay={currentDay}
        onSave={async (data) => await addCandling({ ...data, incubationId: incubation.id })}
      />
      <DeleteIncubationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
      <ObservationDialog
        open={obsOpen}
        onOpenChange={setObsOpen}
        currentNotes={incubation.notes}
        onSave={async (notes) => await updateIncubation(incubation.id, { notes })}
      />
      <TempHumidityDialog
        open={tempHumOpen}
        onOpenChange={setTempHumOpen}
        currentTemp={incubation.targetTemp}
        currentHumidity={incubation.targetHumidity}
        onSave={async (temp, humidity) =>
          await updateIncubation(incubation.id, { targetTemp: temp, targetHumidity: humidity })
        }
      />
      <HatchingDialog
        open={hatchOpen}
        onOpenChange={setHatchOpen}
        onSave={async (results) => {
          const { error } = await updateIncubation(incubation.id, results)
          if (error) {
            toast({
              title: 'Erro ao salvar ❌',
              description: error?.message || 'Falha ao registrar nascimento.',
              variant: 'destructive',
            })
            return
          }
          toast({ title: 'Nascimento registrado! 🐥', description: 'Resultados salvos.' })
        }}
      />
      <FinalizeDialog
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        onConfirm={handleFinalize}
      />
    </div>
  )
}
