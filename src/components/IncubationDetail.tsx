import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarmStore, getIncubationTotalCost } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Egg as EggIcon,
  DollarSign,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Layers,
  Search,
  Plus,
  History,
} from 'lucide-react'
import { Incubation, IncubationEgg } from '@/types/farm'
import { computeIncubationStats, calculateIncubationDay } from '@/lib/incubation-service'
import { IncubationEditDialog } from '@/components/IncubationEditDialog'
import { OvoscopiaOperacionalDialog } from '@/components/OvoscopiaOperacionalDialog'
import { NascimentoOperacionalDialog } from '@/components/NascimentoOperacionalDialog'
import { CriarLotePintinhosDialog } from '@/components/CriarLotePintinhosDialog'
import {
  DeleteIncubationDialog,
  ObservationDialog,
  TempHumidityDialog,
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
  const {
    candlings,
    lots,
    updateIncubation,
    deleteIncubation,
    addCandling,
    finalizeIncubation,
    createLotsFromIncubation,
  } = useFarmStore()

  const [activeTab, setActiveTab] = useState<'ovos' | 'ovoscopias' | 'indicadores' | 'custos'>(
    'ovos',
  )
  const [eggSearch, setEggSearch] = useState('')
  const [eggStatusFilter, setEggStatusFilter] = useState('todos')

  // Diálogos operacionais
  const [editOpen, setEditOpen] = useState(false)
  const [candlingOperacionalOpen, setCandlingOperacionalOpen] = useState(false)
  const [nascimentoOperacionalOpen, setNascimentoOperacionalOpen] = useState(false)
  const [criarLoteOpen, setCriarLoteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [obsOpen, setObsOpen] = useState(false)
  const [tempHumOpen, setTempHumOpen] = useState(false)
  const [finalizeOpen, setFinalizeOpen] = useState(false)

  const incCandlings = candlings.filter((c) => c.incubationId === incubation.id)
  const currentDay = calculateIncubationDay(incubation.startDate)
  const isFinalized = incubation.status === 'Concluído' || incubation.status === 'Finalizada'
  const isCanceled = incubation.status === 'Cancelado'
  const canOperate = !isFinalized && !isCanceled

  const eggs = incubation.eggs || []
  const stats = useMemo(
    () => computeIncubationStats(incubation, incCandlings),
    [incubation, incCandlings],
  )

  const filteredEggs = useMemo(() => {
    return eggs.filter((e) => {
      const matchText =
        e.code.toLowerCase().includes(eggSearch.toLowerCase()) ||
        (e.breed && e.breed.toLowerCase().includes(eggSearch.toLowerCase())) ||
        (e.motherCode && e.motherCode.toLowerCase().includes(eggSearch.toLowerCase())) ||
        (e.fatherCode && e.fatherCode.toLowerCase().includes(eggSearch.toLowerCase()))
      if (!matchText) return false
      if (eggStatusFilter === 'todos') return true
      return e.status === eggStatusFilter
    })
  }, [eggs, eggSearch, eggStatusFilter])

  // Lotes resultantes
  const resultingLots = useMemo(() => {
    const ids = Array.from(
      new Set(
        [incubation.resultingLotId, ...(incubation.resultingLotIds || [])].filter(
          Boolean,
        ) as string[],
      ),
    )
    return lots.filter((l) => ids.includes(l.id) || l.incubationId === incubation.id)
  }, [lots, incubation.resultingLotId, incubation.resultingLotIds, incubation.id])

  const handleDelete = async () => {
    if (resultingLots.length > 0) {
      toast({
        title: 'Não é possível excluir',
        description:
          'Esta chocada já possui lote de pintinhos gerado. Operação bloqueada por segurança.',
        variant: 'destructive',
      })
      return
    }
    const { error } = await deleteIncubation(incubation.id)
    if (error) {
      toast({
        title: 'Erro ao excluir ❌',
        description: error?.message || 'Falha ao excluir chocada.',
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Chocada excluída', description: `${incubation.code} foi removida.` })
    onBack()
  }

  const handleFinalize = async (data: FinalizeData) => {
    const res = await finalizeIncubation(incubation.id, data)
    if (res.error) {
      toast({
        title: 'Erro ao finalizar ❌',
        description: res.error?.message || 'Falha ao finalizar chocada.',
        variant: 'destructive',
      })
      return { error: res.error }
    }

    toast({
      title: 'Chocada finalizada com sucesso! 🐣',
      description: res.lotId
        ? `Lote ${res.lotId} criado automaticamente com ${data.healthyChicks} pintinhos!`
        : `${incubation.code} marcada como Finalizada.`,
    })
    return { error: null }
  }

  const handleSaveOvoscopia = async (data: {
    appliedEggs: IncubationEgg[]
    candlingSummary: {
      day: number
      date: string
      fertile: number
      infertile: number
      developing: number
      deadEmbryo: number
      discarded: number
      notes?: string
    }
  }) => {
    // 1. Atualizar ovos na chocada
    const updateRes = await updateIncubation(incubation.id, {
      eggs: data.appliedEggs,
    })
    if (updateRes.error) {
      toast({
        title: 'Erro ao salvar ovos',
        description: updateRes.error.message,
        variant: 'destructive',
      })
      return
    }

    // 2. Salvar histórico da ovoscopia agregada
    await addCandling({
      incubationId: incubation.id,
      day: data.candlingSummary.day,
      date: data.candlingSummary.date,
      fertile: data.candlingSummary.fertile,
      infertile: data.candlingSummary.infertile,
      developing: data.candlingSummary.developing,
      deadEmbryo: data.candlingSummary.deadEmbryo,
      discarded: data.candlingSummary.discarded || 0,
      notes: data.candlingSummary.notes,
    })

    toast({
      title: 'Ovoscopia registrada com sucesso! 🔍',
      description: `Avaliação do Dia ${data.candlingSummary.day} concluída com histórico preservado.`,
    })
  }

  const handleSaveNascimento = async (data: {
    appliedEggs: IncubationEgg[]
    hatchedCount: number
    unhatchedCount: number
    healthyChicks: number
    deaths: number
  }) => {
    const updateRes = await updateIncubation(incubation.id, {
      eggs: data.appliedEggs,
      hatchedCount: data.hatchedCount,
      unhatchedCount: data.unhatchedCount,
      healthyChicks: data.healthyChicks,
      deaths: data.deaths,
    })

    if (updateRes.error) {
      toast({
        title: 'Erro ao registrar nascimento',
        description: updateRes.error.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Nascimento registrado! 🐣',
      description: `${data.hatchedCount} pintinhos marcados como eclodidos e rastreados!`,
    })
  }

  const handleCreateLots = async (
    groups: Array<{
      name: string
      breed?: string
      eggIds: string[]
      chicksCount: number
      allocatedCost: number
    }>,
  ) => {
    const res = await createLotsFromIncubation(incubation.id, groups)
    if (res.error) {
      toast({
        title: 'Erro ao criar lote',
        description: res.error.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Lote(s) criado(s) com sucesso! 🐔',
      description: `${groups.length} lote(s) gerado(s) com rastreabilidade ovo→pintinho e apropriação de custos.`,
    })
  }

  const statusBadgeColor =
    incubation.status === 'Em incubação' || incubation.status === 'Em andamento'
      ? 'bg-orange-100 text-orange-800'
      : incubation.status === 'Finalizada' || incubation.status === 'Concluído'
        ? 'bg-emerald-100 text-emerald-800'
        : incubation.status === 'Aguardando incubação'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-rose-100 text-rose-800'

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Topo / Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl h-9">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-600" /> {incubation.code}
            </h1>
            <p className="text-xs text-muted-foreground">
              {incubation.breed || 'Genética mista'} • {incubation.origin || 'Produção própria'}
              {incubation.supplier ? ` (${incubation.supplier})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`${statusBadgeColor} text-xs font-semibold px-2.5 py-1`}>
            {incubation.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
            className="rounded-xl h-9 w-9 text-muted-foreground"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteOpen(true)}
            className="rounded-xl h-9 w-9 text-rose-600 hover:text-rose-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Dia da Incubação
            </span>
            <p className="text-base font-extrabold text-foreground">{currentDay} / 21 dias</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Ovos Incubados
            </span>
            <p className="text-base font-extrabold text-orange-700">{stats.incubatedCount} ovos</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Desenvolvendo
            </span>
            <p className="text-base font-extrabold text-emerald-700">
              {stats.developingCount} confirmados
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Previsão Nascimento
            </span>
            <p className="text-base font-extrabold text-foreground">
              {incubation.expectedHatchDate}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ações Rápidas */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => setCandlingOperacionalOpen(true)}
          className="rounded-xl h-10 bg-primary text-white text-xs font-semibold gap-1.5 shadow-xs"
        >
          <Microscope className="w-4 h-4" /> Registrar Ovoscopia
        </Button>

        <Button
          variant="outline"
          onClick={() => setNascimentoOperacionalOpen(true)}
          className="rounded-xl h-10 text-xs font-semibold gap-1.5 bg-white border-orange-200 text-orange-800 hover:bg-orange-50"
        >
          <Baby className="w-4 h-4 text-orange-600" /> Registrar Nascimento
        </Button>

        {!isFinalized && (
          <Button
            variant="outline"
            onClick={() => setFinalizeOpen(true)}
            className="rounded-xl h-10 text-xs font-semibold gap-1.5 bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Finalizar Chocada
          </Button>
        )}

        {isFinalized && (
          <Button
            onClick={() => setCriarLoteOpen(true)}
            className="rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Sparkles className="w-4 h-4" /> Criar Lote de Pintinhos
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setTempHumOpen(true)}
          className="rounded-xl h-10 text-xs bg-white text-muted-foreground"
        >
          <Thermometer className="w-4 h-4 mr-1 text-blue-600" /> Clima
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setObsOpen(true)}
          className="rounded-xl h-10 text-xs bg-white text-muted-foreground"
        >
          <FileText className="w-4 h-4 mr-1 text-slate-600" /> Notas
        </Button>
      </div>

      {/* Banner se houver lote já gerado */}
      {resultingLots.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold text-emerald-950 block">
                Lote(s) de Pintinhos Ativo(s) no SR Gestão:
              </span>
              <span className="text-emerald-800 text-[11px]">
                {resultingLots
                  .map((l) => `${l.code || 'Lote'} (${l.initialQuantity} aves)`)
                  .join(' • ')}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/lotes')}
            className="h-8 text-xs bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100 gap-1 rounded-xl"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Ir para Lotes
          </Button>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex border-b border-border/70 space-x-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'ovos', label: `Ovos da Chocada (${eggs.length})`, icon: EggIcon },
          {
            id: 'ovoscopias',
            label: `Histórico Ovoscopias (${incCandlings.length})`,
            icon: Microscope,
          },
          { id: 'indicadores', label: 'Indicadores Zootécnicos', icon: TrendingUp },
          { id: 'custos', label: `Custos (R$ ${stats.totalCost.toFixed(2)})`, icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* CONTEÚDO DA ABA SELECIONADA */}

      {/* ABA 1: OVOS DA CHOCADA */}
      {activeTab === 'ovos' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex-1 min-w-[200px] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar ovo, genética, matriz..."
                  value={eggSearch}
                  onChange={(e) => setEggSearch(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl bg-white"
                />
              </div>
              <select
                value={eggStatusFilter}
                onChange={(e) => setEggStatusFilter(e.target.value)}
                className="h-9 text-xs rounded-xl border border-input bg-white px-2.5 text-foreground"
              >
                <option value="todos">Todos os status</option>
                <option value="Incubado">Incubado</option>
                <option value="Desenvolvendo">Desenvolvendo</option>
                <option value="Claro/sem desenvolvimento">Claro</option>
                <option value="Duvidoso">Duvidoso</option>
                <option value="Embrião interrompido">Interrompido</option>
                <option value="Eclodiu">Eclodiu</option>
                <option value="Não eclodiu">Não eclodiu</option>
              </select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCandlingOperacionalOpen(true)}
              className="h-9 text-xs rounded-xl bg-white gap-1"
            >
              <Microscope className="w-3.5 h-3.5" /> Avaliar Ovos
            </Button>
          </div>

          {eggs.length === 0 ? (
            <Card className="rounded-2xl p-6 text-center bg-white border-border space-y-2">
              <EggIcon className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs text-muted-foreground">
                Nenhum ovo individual registrado nesta chocada ainda.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="rounded-xl text-xs"
              >
                Editar Chocada e Gerar Ovos
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredEggs.map((egg) => {
                const badgeColor =
                  egg.status === 'Desenvolvendo' || egg.status === 'Eclodiu'
                    ? 'bg-emerald-100 text-emerald-800'
                    : egg.status === 'Claro/sem desenvolvimento'
                      ? 'bg-slate-100 text-slate-700'
                      : egg.status === 'Duvidoso'
                        ? 'bg-amber-100 text-amber-800'
                        : egg.status === 'Embrião interrompido' || egg.status === 'Não eclodiu'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-orange-50 text-orange-800'

                const lastCand =
                  egg.candlingHistory && egg.candlingHistory.length > 0
                    ? egg.candlingHistory[egg.candlingHistory.length - 1]
                    : null

                return (
                  <div
                    key={egg.id}
                    className="p-3 rounded-2xl bg-white border border-border shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {egg.code}
                      </span>
                      <Badge className={`${badgeColor} text-[10px] py-0 px-2`}>{egg.status}</Badge>
                    </div>

                    <div className="space-y-0.5 text-[11px] text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Genética:</strong>{' '}
                        {egg.breed || incubation.breed || '—'}
                      </p>
                      {(egg.motherCode || egg.fatherCode) && (
                        <p>
                          <strong className="text-foreground">Pais:</strong>{' '}
                          {egg.motherCode || 'Matriz'} × {egg.fatherCode || 'Reprodutor'}
                        </p>
                      )}
                      {egg.origin && (
                        <p>
                          <strong className="text-foreground">Origem:</strong> {egg.origin}
                        </p>
                      )}
                      {egg.birthWeightGrams && (
                        <p>
                          <strong className="text-emerald-700">Peso ao nascer:</strong>{' '}
                          {egg.birthWeightGrams}g ({egg.sex || 'Desconhecido'})
                        </p>
                      )}
                    </div>

                    {lastCand && (
                      <div className="pt-1 border-t border-border/50 text-[10px] text-primary flex items-center justify-between">
                        <span>Última ovoscopia:</span>
                        <span className="font-semibold">
                          Dia {lastCand.day} ({lastCand.result})
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: HISTÓRICO DE OVOSCOPIAS */}
      {activeTab === 'ovoscopias' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-muted-foreground">
              Histórico Completo das Sessões
            </h3>
            <Button
              size="sm"
              onClick={() => setCandlingOperacionalOpen(true)}
              className="rounded-xl h-8 text-xs bg-primary text-white gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Ovoscopia
            </Button>
          </div>

          {incCandlings.length === 0 ? (
            <Card className="rounded-2xl p-6 text-center bg-white border-border">
              <Microscope className="w-8 h-8 text-muted-foreground mx-auto opacity-40 mb-1" />
              <p className="text-xs text-muted-foreground">
                Nenhuma ovoscopia registrada para esta chocada.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {incCandlings
                .slice()
                .sort((a, b) => b.day - a.day)
                .map((c) => (
                  <Card key={c.id} className="rounded-2xl bg-white border-border p-3.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-foreground">
                          Dia {c.day} da Incubação
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-2">
                          Data: {c.date}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {c.notes || 'Rotina de ovoscopia'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 mt-2 border-t border-border/60">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-950">
                        <span className="text-[10px] text-emerald-800 block">Desenvolvendo</span>
                        <span className="font-bold text-sm">{c.developing || c.fertile} ovos</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                        <span className="text-[10px] text-slate-600 block">Claros (Infértil)</span>
                        <span className="font-bold text-sm">{c.infertile} ovos</span>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-50 text-rose-950">
                        <span className="text-[10px] text-rose-800 block">Interrompidos</span>
                        <span className="font-bold text-sm">{c.deadEmbryo || 0} ovos</span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-950">
                        <span className="text-[10px] text-amber-800 block">
                          Fertilidade Aparente
                        </span>
                        <span className="font-bold text-sm">
                          {Number(c.developing || c.fertile) + Number(c.infertile) > 0
                            ? `${(
                                (Number(c.developing || c.fertile) /
                                  (Number(c.developing || c.fertile) + Number(c.infertile))) *
                                100
                              ).toFixed(1)}%`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: INDICADORES ZOOTÉCNICOS */}
      {activeTab === 'indicadores' && (
        <div className="space-y-4">
          <Card className="rounded-2xl bg-white border-border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" /> Taxas Calculadas Automaticamente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[11px] text-emerald-900 block font-semibold">
                  Taxa Aparente de Fertilidade
                </span>
                <span className="text-2xl font-black text-emerald-800">
                  {stats.apparentFertilityRate.toFixed(1)}%
                </span>
                <p className="text-[10px] text-emerald-700 mt-1">
                  Desenvolvendo ({stats.developingCount}) / Avaliados ({stats.evaluatedCount})
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200">
                <span className="text-[11px] text-orange-950 block font-semibold">
                  Eclosão sobre Incubados
                </span>
                <span className="text-2xl font-black text-orange-700">
                  {stats.hatchRateIncubated.toFixed(1)}%
                </span>
                <p className="text-[10px] text-orange-800 mt-1">
                  Nascidos ({stats.hatchedCount}) / Total Incubado ({stats.incubatedCount})
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
                <span className="text-[11px] text-blue-950 block font-semibold">
                  Eclosão sobre Desenvolvidos
                </span>
                <span className="text-2xl font-black text-blue-700">
                  {stats.hatchRateDeveloping.toFixed(1)}%
                </span>
                <p className="text-[10px] text-blue-800 mt-1">
                  Nascidos ({stats.hatchedCount}) / Desenvolvendo ({stats.developingCount})
                </p>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground bg-secondary/30 p-2.5 rounded-xl">
              💡 <strong>Regra:</strong> Ovos ainda não avaliados ({stats.notEvaluatedCount}) não
              são contabilizados como inférteis, garantindo precisão zootécnica durante todo o
              ciclo.
            </div>
          </Card>

          <Card className="rounded-2xl bg-white border-border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-muted-foreground">
              Balanço Físico de Ovos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Recebidos</span>
                <span className="font-bold text-foreground">{stats.receivedCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Incubados</span>
                <span className="font-bold text-orange-700">{stats.incubatedCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Desenvolveram</span>
                <span className="font-bold text-emerald-700">{stats.developingCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Claros (Infértil)</span>
                <span className="font-bold text-rose-600">{stats.clearCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Duvidosos</span>
                <span className="font-bold text-amber-700">{stats.doubtfulCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Interrompidos</span>
                <span className="font-bold text-rose-700">{stats.deadEmbryoCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Eclodiram 🐣</span>
                <span className="font-bold text-emerald-700">{stats.hatchedCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Não Eclodiram</span>
                <span className="font-bold text-slate-700">{stats.unhatchedCount}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ABA 4: CUSTOS DA CHOCADA */}
      {activeTab === 'custos' && (
        <div className="space-y-4">
          <Card className="rounded-2xl bg-white border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-primary" /> Detalhamento de Custos
              </h3>
              <span className="text-sm font-extrabold text-foreground">
                Total: R$ {stats.totalCost.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Compra dos Ovos</span>
                <span className="font-bold text-foreground">
                  R$ {Number(incubation.eggCost || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Frete</span>
                <span className="font-bold text-foreground">
                  R$ {Number(incubation.freightCost || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Outros Aquisição</span>
                <span className="font-bold text-foreground">
                  R$ {Number(incubation.otherAcquisitionCosts || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Energia Elétrica</span>
                <span className="font-bold text-foreground">
                  R$ {Number(incubation.energyCost || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40">
                <span className="text-[10px] text-muted-foreground block">Insumos Chocadeira</span>
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
                <span className="text-[10px] text-muted-foreground block">Outros Custos</span>
                <span className="font-bold text-foreground">
                  R$ {Number(incubation.otherCosts || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
              <div className="p-3.5 rounded-2xl bg-secondary/30">
                <span className="text-[11px] text-muted-foreground block">
                  Custo por Ovo Incubado ({stats.incubatedCount} ovos)
                </span>
                <span className="text-xl font-bold text-foreground">
                  R$ {stats.costPerIncubatedEgg.toFixed(2)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-900 block font-semibold">
                  Custo Real por Pintinho Nascido ({stats.hatchedCount} aves)
                </span>
                <span className="text-xl font-bold text-emerald-700">
                  {stats.hatchedCount > 0
                    ? `R$ ${stats.costPerHatchedChick.toFixed(2)}`
                    : 'Aguardando nascimentos'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900">
              📌 <strong>Apropriação Contábil:</strong> Ao gerar o lote no módulo Lotes, este custo
              total é apropriado como valor inicial de formação do lote de aves. Não há lançamento
              financeiro duplicado.
            </div>
          </Card>
        </div>
      )}

      {/* DIÁLOGOS CONECTADOS */}
      <IncubationEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        incubation={incubation}
        onSave={async (updates) => await updateIncubation(incubation.id, updates)}
      />

      <OvoscopiaOperacionalDialog
        open={candlingOperacionalOpen}
        onOpenChange={setCandlingOperacionalOpen}
        eggs={eggs}
        currentDay={currentDay}
        incubationStartDate={incubation.startDate}
        onSave={handleSaveOvoscopia}
      />

      <NascimentoOperacionalDialog
        open={nascimentoOperacionalOpen}
        onOpenChange={setNascimentoOperacionalOpen}
        incubationCode={incubation.code}
        eggs={eggs}
        onSave={handleSaveNascimento}
      />

      <CriarLotePintinhosDialog
        open={criarLoteOpen}
        onOpenChange={setCriarLoteOpen}
        incubation={incubation}
        onConfirm={handleCreateLots}
      />

      <FinalizeDialog
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        incubation={incubation}
        onConfirm={handleFinalize}
        onViewLot={(lotId) => navigate('/lotes')}
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
    </div>
  )
}
