import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarmStore, getIncubationTotalCost } from '@/hooks/use-farm-store'
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
  Egg,
  DollarSign,
  TrendingUp,
  Sparkles,
  ExternalLink,
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
  FinalizeData,
} from '@/components/IncubationActionDialogs'
import { toast } from '@/hooks/use-toast'

interface Props {
  incubation: Incubation
  onBack: () => void
}

export function IncubationDetail({ incubation, onBack }: Props) {
  const navigate = useNavigate()
  const { candlings, lots, updateIncubation, deleteIncubation, addCandling, finalizeIncubation } =
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

  // Ovoscopia mais recente para indicadores
  const lastCandling =
    incCandlings.length > 0 ? [...incCandlings].sort((a, b) => b.day - a.day)[0] : null

  const fertileCount = lastCandling ? lastCandling.fertile : null
  const infertileCount = lastCandling ? lastCandling.infertile : null
  const fertilityRate =
    fertileCount !== null && incubation.eggCount > 0
      ? ((fertileCount / incubation.eggCount) * 100).toFixed(1)
      : null

  const hatchRate =
    incubation.eggCount > 0 && incubation.hatchedCount
      ? ((incubation.hatchedCount / incubation.eggCount) * 100).toFixed(1)
      : null

  const totalCost = getIncubationTotalCost(incubation)
  const healthyCount = incubation.healthyChicks || 0
  const costPerHealthyChick = healthyCount > 0 ? totalCost / healthyCount : null
  const theoreticalCostPerEgg = incubation.eggCount > 0 ? totalCost / incubation.eggCount : null

  // Localizar lote resultante, se existir
  const resultingLot = incubation.resultingLotId
    ? lots.find((l) => l.id === incubation.resultingLotId || l.incubationId === incubation.id)
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

  const handleFinalize = async (data: FinalizeData) => {
    const res = await finalizeIncubation(incubation.id, data)
    if (res.error) {
      toast({
        title: 'Erro ao finalizar ❌',
        description: res.error?.message || 'Falha ao finalizar incubação.',
        variant: 'destructive',
      })
      return { error: res.error }
    }

    if (res.lotId) {
      toast({
        title: 'Incubação finalizada com sucesso! 🐣',
        description: `Lote ${res.lotId} criado automaticamente com ${data.healthyChicks} pintinhos! 🐔`,
      })
    } else {
      toast({
        title: 'Incubação finalizada! ✅',
        description: `${incubation.code} marcada como concluída.`,
      })
    }
    return { error: null }
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
      disabled: false,
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

      {/* ========================================================= */}
      {/* SEÇÃO 1: CUSTOS DA INCUBAÇÃO (SEMPRE VISÍVEL) */}
      {/* ========================================================= */}
      <Card className="rounded-2xl bg-white border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold flex items-center gap-1.5 uppercase text-muted-foreground">
            <DollarSign className="w-4 h-4 text-primary" /> Custos da Incubação
          </h3>
          <span className="text-sm font-extrabold text-foreground">
            Total: R$ {totalCost.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Ovos</span>
            <span className="font-bold text-foreground">
              R$ {Number(incubation.eggCost || 0).toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Energia</span>
            <span className="font-bold text-foreground">
              R$ {Number(incubation.energyCost || 0).toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Insumos</span>
            <span className="font-bold text-foreground">
              R$ {Number(incubation.suppliesCost || 0).toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Mão de Obra</span>
            <span className="font-bold text-foreground">
              R$ {Number(incubation.laborCost || 0).toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Outros</span>
            <span className="font-bold text-foreground">
              R$ {Number(incubation.otherCosts || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* SEÇÃO 2: INDICADORES (SEMPRE VISÍVEL) */}
      {/* ========================================================= */}
      <Card className="rounded-2xl bg-white border-border p-4 space-y-3">
        <h3 className="text-xs font-bold flex items-center gap-1.5 uppercase text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-primary" /> Indicadores Zootécnicos
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Ovos colocados</span>
            <span className="font-bold text-foreground">{incubation.eggCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Ovos férteis</span>
            <span className="font-bold text-emerald-700">
              {fertileCount !== null ? fertileCount : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Inférteis</span>
            <span className="font-bold text-rose-600">
              {infertileCount !== null ? infertileCount : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Taxa fertilidade</span>
            <span className="font-bold text-foreground">
              {fertilityRate !== null ? `${fertilityRate}%` : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Taxa eclosão</span>
            <span className="font-bold text-primary">
              {incubation.status === 'Concluído' && hatchRate !== null ? `${hatchRate}%` : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground block">Pintinhos viáveis</span>
            <span className="font-bold text-emerald-700">
              {incubation.healthyChicks !== undefined ? incubation.healthyChicks : '—'}
            </span>
          </div>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* SEÇÃO 3: LOTE GERADO (QUANDO CONCLUÍDO E POSSUI resultingLotId) */}
      {/* ========================================================= */}
      {incubation.status === 'Concluído' && incubation.resultingLotId && (
        <Card className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="text-xs font-bold text-emerald-950">Lote Gerado Automaticamente</h3>
                <p className="text-[11px] text-emerald-800">
                  Esta incubação gerou o lote{' '}
                  <strong className="font-bold">
                    {resultingLot?.code
                      ? `${resultingLot.code} - ${resultingLot.name}`
                      : incubation.resultingLotId}
                  </strong>
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/lotes')}
              className="rounded-xl h-9 text-xs bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100 gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ver lote
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-200/60">
            <span className="text-emerald-900">
              Pintinhos: <strong>{incubation.healthyChicks || 0} aves</strong>
            </span>
            <span className="font-bold text-emerald-950">
              Custo por pintinho:{' '}
              {costPerHealthyChick !== null ? `R$ ${costPerHealthyChick.toFixed(2)}` : '—'}
            </span>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* SEÇÃO 4: RESULTADOS (EXPANDIDO) */}
      {/* ========================================================= */}
      {incubation.status === 'Concluído' && (
        <Card className="rounded-2xl bg-white border-border p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase text-muted-foreground">
            Resultados do Fechamento
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-secondary/30">
              <span className="text-muted-foreground block text-[10px]">Nascidos (eclosão)</span>
              <span className="font-bold text-foreground">{incubation.hatchedCount || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30">
              <span className="text-muted-foreground block text-[10px]">Não eclodidos</span>
              <span className="font-bold text-foreground">{incubation.unhatchedCount || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30">
              <span className="text-muted-foreground block text-[10px]">Pintinhos viáveis</span>
              <span className="font-bold text-emerald-700">{incubation.healthyChicks || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30">
              <span className="text-muted-foreground block text-[10px]">Mortes</span>
              <span className="font-bold text-rose-600">{incubation.deaths || 0}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
            <div className="p-3 rounded-xl bg-secondary/20">
              <span className="text-muted-foreground block text-[11px]">
                Custo total da incubação
              </span>
              <span className="text-base font-extrabold text-foreground">
                R$ {totalCost.toFixed(2)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-emerald-900 block text-[11px]">Custo por pintinho viável</span>
              <span className="text-base font-extrabold text-emerald-700">
                {costPerHealthyChick !== null ? `R$ ${costPerHealthyChick.toFixed(2)}` : '—'}
              </span>
            </div>
          </div>

          {/* Análise de perdas */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900">
            <span className="font-bold block mb-0.5">Análise de perdas e diluição de custos:</span>
            <span>
              Custo teórico com {incubation.eggCount} ovos:{' '}
              <strong>
                {theoreticalCostPerEgg !== null ? `R$ ${theoreticalCostPerEgg.toFixed(2)}` : '—'}
              </strong>{' '}
              por ovo | Custo real com {healthyCount} pintinhos:{' '}
              <strong className="text-amber-950">
                {costPerHealthyChick !== null ? `R$ ${costPerHealthyChick.toFixed(2)}` : '—'}
              </strong>{' '}
              por pintinho viável.
            </span>
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
        incubation={incubation}
        onConfirm={handleFinalize}
        onViewLot={(lotId) => navigate('/lotes')}
      />
    </div>
  )
}
