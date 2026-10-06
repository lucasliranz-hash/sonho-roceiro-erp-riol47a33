import { useState, useMemo } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Flame,
  Plus,
  Thermometer,
  Droplets,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Search as SearchIcon,
  CheckCircle2,
  Sparkles,
  Egg as EggIcon,
  Baby,
  Clock,
  AlertTriangle,
  History,
  Building,
} from 'lucide-react'
import { IncubationDetail } from '@/components/IncubationDetail'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog'
import { useNavigate } from 'react-router-dom'
import { NovaChocadaDialog } from '@/components/NovaChocadaDialog'
import { OvoscopiaOperacionalDialog } from '@/components/OvoscopiaOperacionalDialog'
import { NascimentoOperacionalDialog } from '@/components/NascimentoOperacionalDialog'
import { CriarLotePintinhosDialog } from '@/components/CriarLotePintinhosDialog'
import {
  DeleteIncubationDialog,
  FinalizeDialog,
  FinalizeData,
} from '@/components/IncubationActionDialogs'
import { IncubationEditDialog } from '@/components/IncubationEditDialog'
import { toast } from '@/hooks/use-toast'
import { Incubation, IncubationEgg } from '@/types/farm'
import { logAudit } from '@/services/audit'
import { getIncubationTotalCost } from '@/hooks/use-farm-store'
import {
  computeIncubationStats,
  calculateIncubationDay,
  calculateExpectedHatchDate,
} from '@/lib/incubation-service'

type FilterTab =
  | 'todos'
  | 'em_incubacao'
  | 'aguardando'
  | 'ovoscopias'
  | 'nascimentos'
  | 'finalizadas'

export default function Chocadeira() {
  const navigate = useNavigate()
  const { currentProperty, properties } = useAuth()
  const {
    incubations,
    candlings,
    addIncubation,
    deleteIncubation,
    updateIncubation,
    finalizeIncubation,
    addCandling,
    createLotsFromIncubation,
    lots,
  } = useFarmStore()
  const { canEdit, canDelete } = usePermissions()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>('em_incubacao')
  const [searchQuery, setSearchQuery] = useState('')

  // Diálogos
  const [novaChocadaOpen, setNovaChocadaOpen] = useState(false)
  const [editing, setEditing] = useState<Incubation | null>(null)
  const [deleting, setDeleting] = useState<Incubation | null>(null)
  const [candlingOperacional, setCandlingOperacional] = useState<Incubation | null>(null)
  const [nascimentoOperacional, setNascimentoOperacional] = useState<Incubation | null>(null)
  const [criarLoteModal, setCriarLoteModal] = useState<Incubation | null>(null)
  const [finalizing, setFinalizing] = useState<Incubation | null>(null)
  const [details, setDetails] = useState<Incubation | null>(null)

  const selected = incubations.find((i) => i.id === selectedId) || null

  const todayStr = new Date().toISOString().split('T')[0]

  // Contadores para as abas
  const counts = useMemo(() => {
    let emIncubacao = 0
    let aguardando = 0
    let proxOvoscopias = 0
    let proxNascimentos = 0
    let finalizadas = 0

    incubations.forEach((inc) => {
      const isIncubating = inc.status === 'Em incubação' || inc.status === 'Em andamento'
      const isFinal = inc.status === 'Finalizada' || inc.status === 'Concluído'
      const isWaiting = inc.status === 'Aguardando incubação'

      if (isIncubating) {
        emIncubacao++
        const day = calculateIncubationDay(inc.startDate)
        // Próximas ovoscopias (por volta do dia 6-8 ou 13-15)
        if ((day >= 6 && day <= 8) || (day >= 13 && day <= 15)) {
          proxOvoscopias++
        }
        // Próximos nascimentos (a partir do dia 18 até previsão)
        if (day >= 18 || inc.expectedHatchDate <= todayStr) {
          proxNascimentos++
        }
      } else if (isWaiting) {
        aguardando++
      } else if (isFinal) {
        finalizadas++
      }
    })

    return {
      todos: incubations.length,
      emIncubacao,
      aguardando,
      proxOvoscopias,
      proxNascimentos,
      finalizadas,
    }
  }, [incubations, todayStr])

  // Filtragem das incubações
  const filteredIncubations = useMemo(() => {
    return incubations.filter((inc) => {
      const matchSearch =
        inc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inc.breed && inc.breed.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.origin && inc.origin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.incubatorName && inc.incubatorName.toLowerCase().includes(searchQuery.toLowerCase()))
      if (!matchSearch) return false

      const isIncubating = inc.status === 'Em incubação' || inc.status === 'Em andamento'
      const isFinal = inc.status === 'Finalizada' || inc.status === 'Concluído'
      const isWaiting = inc.status === 'Aguardando incubação'

      const day = calculateIncubationDay(inc.startDate)

      switch (activeTab) {
        case 'em_incubacao':
          return isIncubating
        case 'aguardando':
          return isWaiting
        case 'ovoscopias':
          return isIncubating && ((day >= 6 && day <= 8) || (day >= 13 && day <= 15))
        case 'nascimentos':
          return isIncubating && (day >= 18 || inc.expectedHatchDate <= todayStr)
        case 'finalizadas':
          return isFinal
        case 'todos':
        default:
          return true
      }
    })
  }, [incubations, activeTab, searchQuery, todayStr])

  const handleDelete = async () => {
    if (!deleting) return
    const hasLots =
      deleting.resultingLotId || (deleting.resultingLotIds && deleting.resultingLotIds.length > 0)
    if (hasLots) {
      toast({
        title: 'Operação não permitida',
        description: 'Não é possível excluir uma chocada que já gerou lotes de aves.',
        variant: 'destructive',
      })
      setDeleting(null)
      return
    }

    const { error } = await deleteIncubation(deleting.id)
    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
      return
    }
    await logAudit('DELETE', 'farm_incubations', deleting.id, deleting as any, null)
    toast({ title: 'Chocada excluída! 🗑️', description: `${deleting.code} foi removida.` })
    setDeleting(null)
  }

  const handleFinalize = async (data: FinalizeData) => {
    if (!finalizing) return
    const res = await finalizeIncubation(finalizing.id, data)
    if (res.error) {
      if (finalizing.resultingLotId) {
        toast({
          title: 'Atenção ⚠️',
          description: res.error.message || `Esta chocada já gerou lote.`,
        })
      } else {
        toast({
          title: 'Erro ao finalizar',
          description: res.error.message || 'Falha ao finalizar chocada.',
          variant: 'destructive',
        })
      }
      return { error: res.error }
    }

    toast({
      title: 'Chocada finalizada com sucesso! 🐣',
      description: res.lotId
        ? `Lote ${res.lotId} criado com ${data.healthyChicks} pintinhos!`
        : `${finalizing.code} marcada como Finalizada.`,
    })
    setFinalizing(null)
    return { error: null }
  }

  if (selected) {
    return <IncubationDetail incubation={selected} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Header com Botão + NOVA CHOCADA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-600" /> Chocadeira & Incubações
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fluxo operacional completo: entrada de ovos → ovoscopia → nascimento → criação do lote.
          </p>
        </div>

        <Button
          onClick={() => setNovaChocadaOpen(true)}
          className="rounded-2xl h-11 bg-primary text-white text-xs font-bold gap-2 px-4 shadow-sm hover:opacity-95"
        >
          <Plus className="w-4 h-4" /> + NOVA CHOCADA
        </Button>
      </div>

      {/* Abas / Filtros por status operacional */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        <Button
          variant={activeTab === 'em_incubacao' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('em_incubacao')}
          className="rounded-xl h-9 text-xs whitespace-nowrap"
        >
          Em Incubação ({counts.emIncubacao})
        </Button>
        <Button
          variant={activeTab === 'aguardando' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('aguardando')}
          className="rounded-xl h-9 text-xs whitespace-nowrap"
        >
          Aguardando ({counts.aguardando})
        </Button>
        <Button
          variant={activeTab === 'ovoscopias' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('ovoscopias')}
          className="rounded-xl h-9 text-xs whitespace-nowrap"
        >
          Próximas Ovoscopias ({counts.proxOvoscopias})
        </Button>
        <Button
          variant={activeTab === 'nascimentos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('nascimentos')}
          className="rounded-xl h-9 text-xs whitespace-nowrap"
        >
          Próximos Nascimentos ({counts.proxNascimentos})
        </Button>
        <Button
          variant={activeTab === 'finalizadas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('finalizadas')}
          className="rounded-xl h-9 text-xs whitespace-nowrap"
        >
          Finalizadas ({counts.finalizadas})
        </Button>
        <Button
          variant={activeTab === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('todos')}
          className="rounded-xl h-9 text-xs whitespace-nowrap"
        >
          Todas ({counts.todos})
        </Button>
      </div>

      {/* Barra de Busca rápida */}
      <div className="relative">
        <SearchIcon className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Buscar chocada por código, raça, criatório..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 text-xs rounded-2xl bg-white"
        />
      </div>

      {/* Lista de Chocadas em Cards Mobile-First */}
      {filteredIncubations.length === 0 ? (
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-8 text-center space-y-2">
          <Flame className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-semibold text-foreground">Nenhuma chocada encontrada</p>
          <p className="text-xs text-muted-foreground">
            {activeTab === 'em_incubacao'
              ? 'Nenhuma incubação em andamento no momento.'
              : 'Nenhum registro corresponde aos filtros selecionados.'}
          </p>
          <Button
            size="sm"
            onClick={() => setNovaChocadaOpen(true)}
            className="rounded-xl text-xs mt-2"
          >
            + Criar Nova Chocada
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredIncubations.map((inc) => {
            const incCandlings = candlings.filter((c) => c.incubationId === inc.id)
            const stats = computeIncubationStats(inc, incCandlings)
            const day = calculateIncubationDay(inc.startDate)

            const isIncubating = inc.status === 'Em incubação' || inc.status === 'Em andamento'
            const isFinalized = inc.status === 'Finalizada' || inc.status === 'Concluído'

            const badgeClass = isIncubating
              ? 'bg-orange-100 text-orange-800'
              : isFinalized
                ? 'bg-emerald-100 text-emerald-800'
                : inc.status === 'Aguardando incubação'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'

            return (
              <Card
                key={inc.id}
                className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all overflow-hidden"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-center justify-between">
                    <div className="cursor-pointer flex-1" onClick={() => setSelectedId(inc.id)}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-primary text-base">
                          {inc.code}
                        </span>
                        <Badge className={`${badgeClass} text-[10px] py-0 px-2`}>
                          {inc.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {inc.breed || 'Genética mista'} • {inc.origin || 'Produção própria'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <RecordActionMenu
                        onView={() => setSelectedId(inc.id)}
                        onEdit={canEdit ? () => setEditing(inc) : undefined}
                        onDelete={canDelete ? () => setDeleting(inc) : undefined}
                        disabled={!canEdit}
                        extraItems={[
                          {
                            label: 'Registrar Ovoscopia',
                            icon: SearchIcon,
                            onClick: () => setCandlingOperacional(inc),
                            disabled: !canEdit,
                          },
                          {
                            label: 'Registrar Nascimento',
                            icon: Baby,
                            onClick: () => setNascimentoOperacional(inc),
                            disabled: !canEdit,
                          },
                          {
                            label: 'Finalizar Chocada',
                            icon: CheckCircle2,
                            onClick: () => setFinalizing(inc),
                            disabled: !canEdit || isFinalized,
                          },
                          {
                            label: 'Criar Lote de Pintinhos',
                            icon: Sparkles,
                            onClick: () => setCriarLoteModal(inc),
                            disabled: !canEdit,
                          },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Informações Centrais em Grid Compacto */}
                  <div
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-secondary/35 p-2.5 rounded-2xl cursor-pointer"
                    onClick={() => setSelectedId(inc.id)}
                  >
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Incubados</span>
                      <span className="font-bold text-foreground">{stats.incubatedCount} ovos</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Desenvolvendo</span>
                      <span className="font-bold text-emerald-700">
                        {stats.developingCount} ovos
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Dia Atual</span>
                      <span className="font-bold text-orange-700">
                        {isIncubating ? `${day} / 21` : inc.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Previsão</span>
                      <span className="font-bold text-foreground truncate block">
                        {inc.expectedHatchDate}
                      </span>
                    </div>
                  </div>

                  {/* Indicadores de Clima e Ações Rápidas */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                      <span className="flex items-center gap-1 text-orange-700 font-semibold">
                        <Thermometer className="w-3.5 h-3.5" /> {inc.targetTemp}°C
                      </span>
                      <span className="flex items-center gap-1 text-blue-700 font-semibold">
                        <Droplets className="w-3.5 h-3.5" /> {inc.targetHumidity}%
                      </span>
                      {inc.eggs && inc.eggs.length > 0 && (
                        <span className="text-primary font-semibold">
                          {inc.eggs.length} ovos rastreados
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedId(inc.id)}
                        className="h-8 text-xs text-primary font-semibold hover:bg-primary/5 rounded-xl gap-1 px-2.5"
                      >
                        Ver Detalhes <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Diálogo de Nova Chocada */}
      <NovaChocadaDialog
        open={novaChocadaOpen}
        onOpenChange={setNovaChocadaOpen}
        existingIncubations={incubations}
        properties={properties}
        currentPropertyId={currentProperty?.id}
        onSave={async (incData) => {
          return addIncubation(incData)
        }}
      />

      {/* Diálogo de Edição Geral */}
      <IncubationEditDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        incubation={editing || ({} as Incubation)}
        onSave={async (updates) => {
          if (!editing) return { error: null }
          return updateIncubation(editing.id, updates)
        }}
      />

      {/* Diálogo de Exclusão */}
      <DeleteIncubationDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={handleDelete}
      />

      {/* Diálogo Operacional de Ovoscopia */}
      {candlingOperacional && (
        <OvoscopiaOperacionalDialog
          open={!!candlingOperacional}
          onOpenChange={(v) => !v && setCandlingOperacional(null)}
          eggs={candlingOperacional.eggs || []}
          currentDay={calculateIncubationDay(candlingOperacional.startDate)}
          incubationStartDate={candlingOperacional.startDate}
          onSave={async (data) => {
            const incId = candlingOperacional.id
            await updateIncubation(incId, { eggs: data.appliedEggs })
            await addCandling({
              incubationId: incId,
              day: data.candlingSummary.day,
              date: data.candlingSummary.date,
              fertile: data.candlingSummary.fertile,
              infertile: data.candlingSummary.infertile,
              developing: data.candlingSummary.developing,
              deadEmbryo: data.candlingSummary.deadEmbryo,
              discarded: data.candlingSummary.discarded || 0,
              notes: data.candlingSummary.notes,
            })
            toast({ title: 'Ovoscopia registrada com sucesso! 🔍' })
            setCandlingOperacional(null)
          }}
        />
      )}

      {/* Diálogo Operacional de Nascimento */}
      {nascimentoOperacional && (
        <NascimentoOperacionalDialog
          open={!!nascimentoOperacional}
          onOpenChange={(v) => !v && setNascimentoOperacional(null)}
          incubationCode={nascimentoOperacional.code}
          eggs={nascimentoOperacional.eggs || []}
          onSave={async (data) => {
            await updateIncubation(nascimentoOperacional.id, {
              eggs: data.appliedEggs,
              hatchedCount: data.hatchedCount,
              unhatchedCount: data.unhatchedCount,
              healthyChicks: data.healthyChicks,
              deaths: data.deaths,
            })
            toast({ title: 'Nascimento registrado com sucesso! 🐣' })
            setNascimentoOperacional(null)
          }}
        />
      )}

      {/* Diálogo de Criar Lote com Pintinhos Nascidos */}
      {criarLoteModal && (
        <CriarLotePintinhosDialog
          open={!!criarLoteModal}
          onOpenChange={(v) => !v && setCriarLoteModal(null)}
          incubation={criarLoteModal}
          onConfirm={async (groups) => {
            const res = await createLotsFromIncubation(criarLoteModal.id, groups)
            if (res.error) {
              toast({
                title: 'Erro ao gerar lote',
                description: res.error.message,
                variant: 'destructive',
              })
              return
            }
            toast({
              title: 'Lote(s) criado(s) com sucesso! 🐔',
              description: `${groups.length} lote(s) gerado(s) com apropriação de custos.`,
            })
            setCriarLoteModal(null)
          }}
        />
      )}

      {/* Diálogo de Finalização de Chocada */}
      {finalizing && (
        <FinalizeDialog
          open={!!finalizing}
          onOpenChange={(v) => !v && setFinalizing(null)}
          incubation={finalizing}
          onConfirm={handleFinalize}
          onViewLot={(lotId) => navigate('/lotes')}
        />
      )}

      {/* Diálogo de Detalhes Rápidos */}
      <RecordDetailsDialog
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
        title={`Chocada — ${details?.code || ''}`}
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
                { label: 'Custo Total (R$)', value: getIncubationTotalCost(details).toFixed(2) },
                { label: 'Nascidos', value: details.hatchedCount },
                { label: 'Não eclodidos', value: details.unhatchedCount },
                { label: 'Observação', value: details.notes },
              ]
            : []
        }
      />
    </div>
  )
}
