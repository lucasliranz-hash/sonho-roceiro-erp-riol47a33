import { useState, useMemo } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog'
import {
  HeartPulse,
  Syringe,
  Pill,
  AlertTriangle,
  FileText,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowRight,
  Layers,
  Sparkles,
  Link2,
} from 'lucide-react'
import {
  Vaccination,
  VaccinationStatus,
  Treatment,
  TreatmentStatus,
  HealthOccurrence,
  HealthOccurrenceType,
  HealthOccurrenceSeverity,
  HealthProtocol,
  HealthProtocolStep,
  ProtocolAssignment,
  ACTIVITY_TYPES,
} from '@/types/farm'
import { toast } from '@/hooks/use-toast'

export default function Sanidade() {
  const { currentProperty, organization } = useAuth()
  const { canEdit, canDelete } = usePermissions()
  const {
    lots,
    activities,
    inventory,
    vaccinations,
    addVaccination,
    updateVaccination,
    deleteVaccination,
    treatments,
    addTreatment,
    updateTreatment,
    deleteTreatment,
    healthOccurrences,
    addHealthOccurrence,
    updateHealthOccurrence,
    deleteHealthOccurrence,
    healthProtocols,
    addHealthProtocol,
    updateHealthProtocol,
    deleteHealthProtocol,
    protocolAssignments,
    addProtocolAssignment,
    deleteProtocolAssignment,
  } = useFarmStore()

  const [activeTab, setActiveTab] = useState('vacinacao')
  const [searchTerm, setSearchTerm] = useState('')

  // State for Dialogs
  const [vacModalOpen, setVacModalOpen] = useState(false)
  const [editingVac, setEditingVac] = useState<Vaccination | null>(null)
  const [deletingVac, setDeletingVac] = useState<Vaccination | null>(null)
  const [detailsVac, setDetailsVac] = useState<Vaccination | null>(null)

  const [trtModalOpen, setTrtModalOpen] = useState(false)
  const [editingTrt, setEditingTrt] = useState<Treatment | null>(null)
  const [deletingTrt, setDeletingTrt] = useState<Treatment | null>(null)
  const [detailsTrt, setDetailsTrt] = useState<Treatment | null>(null)

  const [occModalOpen, setOccModalOpen] = useState(false)
  const [editingOcc, setEditingOcc] = useState<HealthOccurrence | null>(null)
  const [deletingOcc, setDeletingOcc] = useState<HealthOccurrence | null>(null)
  const [detailsOcc, setDetailsOcc] = useState<HealthOccurrence | null>(null)

  const [protModalOpen, setProtModalOpen] = useState(false)
  const [editingProt, setEditingProt] = useState<HealthProtocol | null>(null)
  const [deletingProt, setDeletingProt] = useState<HealthProtocol | null>(null)
  const [detailsProt, setDetailsProt] = useState<HealthProtocol | null>(null)

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assigningProt, setAssigningProt] = useState<HealthProtocol | null>(null)

  // Calendar filter state
  const [calendarFilter, setCalendarFilter] = useState<'hoje' | '7dias' | '30dias' | 'atrasados'>(
    '7dias',
  )

  // Helpers
  const lotName = (id?: string) => lots.find((l) => l.id === id)?.name || 'Todos/Geral'
  const activityName = (id?: string) => activities.find((a) => a.id === id)?.name || '-'
  const itemName = (id?: string) => inventory.find((i) => i.id === id)?.name || '-'

  // Filtered lists
  const filteredVaccinations = useMemo(() => {
    return vaccinations.filter(
      (v) =>
        v.vaccine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.disease_target?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lotName(v.lot_id).toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [vaccinations, searchTerm, lots])

  const filteredTreatments = useMemo(() => {
    return treatments.filter(
      (t) =>
        t.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.diagnosis_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lotName(t.lot_id).toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [treatments, searchTerm, lots])

  const filteredOccurrences = useMemo(() => {
    return healthOccurrences.filter(
      (o) =>
        o.occurrence_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lotName(o.lot_id).toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [healthOccurrences, searchTerm, lots])

  const filteredProtocols = useMemo(() => {
    return healthProtocols.filter((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [healthProtocols, searchTerm])

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-rose-600" /> Sanidade e Saúde Animal
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gestão completa de vacinações, tratamentos veterinários, ocorrências clínicas e
            protocolos sanitários.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'vacinacao' && (
            <Button
              onClick={() => {
                setEditingVac(null)
                setVacModalOpen(true)
              }}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" /> Nova Vacinação
            </Button>
          )}
          {activeTab === 'tratamentos' && (
            <Button
              onClick={() => {
                setEditingTrt(null)
                setTrtModalOpen(true)
              }}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" /> Novo Tratamento
            </Button>
          )}
          {activeTab === 'ocorrencias' && (
            <Button
              onClick={() => {
                setEditingOcc(null)
                setOccModalOpen(true)
              }}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" /> Registrar Ocorrência
            </Button>
          )}
          {activeTab === 'protocolos' && (
            <Button
              onClick={() => {
                setEditingProt(null)
                setProtModalOpen(true)
              }}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" /> Novo Protocolo
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border rounded-2xl p-1 grid grid-cols-2 sm:grid-cols-5 h-auto gap-1">
          <TabsTrigger
            value="vacinacao"
            className="rounded-xl text-xs py-2 flex items-center gap-1.5"
          >
            <Syringe className="w-3.5 h-3.5 text-emerald-600" /> Vacinação
          </TabsTrigger>
          <TabsTrigger
            value="tratamentos"
            className="rounded-xl text-xs py-2 flex items-center gap-1.5"
          >
            <Pill className="w-3.5 h-3.5 text-blue-600" /> Medicamentos
          </TabsTrigger>
          <TabsTrigger
            value="ocorrencias"
            className="rounded-xl text-xs py-2 flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Ocorrências
          </TabsTrigger>
          <TabsTrigger
            value="protocolos"
            className="rounded-xl text-xs py-2 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" /> Protocolos
          </TabsTrigger>
          <TabsTrigger
            value="calendario"
            className="rounded-xl text-xs py-2 flex items-center gap-1.5 col-span-2 sm:col-span-1"
          >
            <Calendar className="w-3.5 h-3.5 text-primary" /> Calendário
          </TabsTrigger>
        </TabsList>

        {/* Global Search Bar (for lists) */}
        {activeTab !== 'calendario' && (
          <div className="relative mt-4">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, lote, motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-2xl bg-white border-border text-xs"
            />
          </div>
        )}

        {/* ==========================================
            ABA 1: VACINAÇÃO
        ========================================== */}
        <TabsContent value="vacinacao" className="mt-4 space-y-4">
          {filteredVaccinations.length === 0 ? (
            <Card className="rounded-3xl bg-white border-border shadow-subtle">
              <CardContent className="p-8 text-center space-y-3">
                <Syringe className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Nenhuma vacinação cadastrada
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cadastre o plano de imunização e registre aplicações com baixa automática no
                    estoque.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingVac(null)
                    setVacModalOpen(true)
                  }}
                  className="rounded-xl bg-primary text-white text-xs gap-1.5 font-bold"
                >
                  <Plus className="w-4 h-4" /> Criar primeira vacinação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredVaccinations.map((vac) => {
                const isPerformed = vac.status === 'performed'
                const isDelayed = vac.status === 'delayed'
                const isCancelled = vac.status === 'cancelled'

                let badgeClass = 'bg-blue-100 text-blue-900 border-blue-200'
                let badgeLabel = 'Programada'
                if (isPerformed) {
                  badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-200'
                  badgeLabel = 'Realizada'
                } else if (isDelayed) {
                  badgeClass = 'bg-rose-100 text-rose-900 border-rose-200'
                  badgeLabel = 'Atrasada'
                } else if (isCancelled) {
                  badgeClass = 'bg-zinc-100 text-zinc-700 border-zinc-200'
                  badgeLabel = 'Cancelada'
                }

                return (
                  <Card
                    key={vac.id}
                    className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all flex flex-col justify-between"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-[10px] font-bold ${badgeClass}`}>
                          {badgeLabel}
                        </Badge>
                        <RecordActionMenu
                          onView={() => setDetailsVac(vac)}
                          onEdit={
                            canEdit
                              ? () => {
                                  setEditingVac(vac)
                                  setVacModalOpen(true)
                                }
                              : undefined
                          }
                          onDelete={canDelete ? () => setDeletingVac(vac) : undefined}
                          disabled={!canEdit}
                        />
                      </div>

                      <div>
                        <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                          <Syringe className="w-4 h-4 text-emerald-600 shrink-0" />
                          {vac.vaccine_name}
                        </h3>
                        {vac.disease_target && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Alvo: {vac.disease_target}
                          </p>
                        )}
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-foreground">
                          Lote: {lotName(vac.lot_id)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-secondary/30 p-2.5 rounded-2xl text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Data Programada
                          </span>
                          <span className="font-semibold text-foreground">
                            {vac.scheduled_date || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Data Realizada
                          </span>
                          <span className="font-semibold text-foreground">
                            {vac.performed_date || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Animais</span>
                          <span className="font-semibold text-foreground">
                            {vac.animal_count || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Custo Total
                          </span>
                          <span className="font-semibold text-rose-600">
                            {vac.total_cost ? `R$ ${Number(vac.total_cost).toFixed(2)}` : 'R$ 0,00'}
                          </span>
                        </div>
                      </div>

                      {vac.stock_deducted && (
                        <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Baixa realizada no
                          estoque
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ==========================================
            ABA 2: MEDICAMENTOS / TRATAMENTOS
        ========================================== */}
        <TabsContent value="tratamentos" className="mt-4 space-y-4">
          {filteredTreatments.length === 0 ? (
            <Card className="rounded-3xl bg-white border-border shadow-subtle">
              <CardContent className="p-8 text-center space-y-3">
                <Pill className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Nenhum tratamento registrado
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Controle administrações de antibióticos, vermífugos, suplementos e período de
                    carência.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingTrt(null)
                    setTrtModalOpen(true)
                  }}
                  className="rounded-xl bg-primary text-white text-xs gap-1.5 font-bold"
                >
                  <Plus className="w-4 h-4" /> Novo Tratamento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTreatments.map((trt) => {
                let badgeClass = 'bg-blue-100 text-blue-900 border-blue-200'
                let badgeLabel = 'Programado'
                if (trt.status === 'in_progress') {
                  badgeClass = 'bg-amber-100 text-amber-900 border-amber-200'
                  badgeLabel = 'Em andamento'
                } else if (trt.status === 'completed') {
                  badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-200'
                  badgeLabel = 'Concluído'
                } else if (trt.status === 'cancelled') {
                  badgeClass = 'bg-zinc-100 text-zinc-700 border-zinc-200'
                  badgeLabel = 'Cancelado'
                }

                return (
                  <Card
                    key={trt.id}
                    className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all flex flex-col justify-between"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-[10px] font-bold ${badgeClass}`}>
                          {badgeLabel}
                        </Badge>
                        <RecordActionMenu
                          onView={() => setDetailsTrt(trt)}
                          onEdit={
                            canEdit
                              ? () => {
                                  setEditingTrt(trt)
                                  setTrtModalOpen(true)
                                }
                              : undefined
                          }
                          onDelete={canDelete ? () => setDeletingTrt(trt) : undefined}
                          disabled={!canEdit}
                        />
                      </div>

                      <div>
                        <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                          <Pill className="w-4 h-4 text-blue-600 shrink-0" />
                          {trt.medication_name}
                        </h3>
                        {trt.diagnosis_reason && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Motivo: {trt.diagnosis_reason}
                          </p>
                        )}
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-foreground">
                          Lote: {lotName(trt.lot_id)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-secondary/30 p-2.5 rounded-2xl text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Início</span>
                          <span className="font-semibold text-foreground">
                            {trt.start_date || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Fim</span>
                          <span className="font-semibold text-foreground">
                            {trt.end_date || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Posologia</span>
                          <span className="font-semibold text-foreground truncate">
                            {trt.dosage || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Carência</span>
                          <span className="font-semibold text-amber-800">
                            {trt.withdrawal_period_days
                              ? `${trt.withdrawal_period_days} dias`
                              : 'Zero'}
                          </span>
                        </div>
                      </div>

                      {trt.stock_deducted && (
                        <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Baixa realizada no
                          estoque
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ==========================================
            ABA 3: OCORRÊNCIAS
        ========================================== */}
        <TabsContent value="ocorrencias" className="mt-4 space-y-4">
          {filteredOccurrences.length === 0 ? (
            <Card className="rounded-3xl bg-white border-border shadow-subtle">
              <CardContent className="p-8 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Nenhuma ocorrência registrada
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registre sintomas, lesões, doenças ou comportamentos anormais para histórico
                    epidemiológico.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingOcc(null)
                    setOccModalOpen(true)
                  }}
                  className="rounded-xl bg-primary text-white text-xs gap-1.5 font-bold"
                >
                  <Plus className="w-4 h-4" /> Registrar Ocorrência
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredOccurrences.map((occ) => {
                let badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-200'
                let badgeLabel = 'Baixa'
                if (occ.severity === 'moderate') {
                  badgeClass = 'bg-amber-100 text-amber-900 border-amber-200'
                  badgeLabel = 'Moderada'
                } else if (occ.severity === 'high') {
                  badgeClass = 'bg-orange-100 text-orange-900 border-orange-200'
                  badgeLabel = 'Alta'
                } else if (occ.severity === 'critical') {
                  badgeClass = 'bg-rose-100 text-rose-900 border-rose-200'
                  badgeLabel = 'Crítica'
                }

                const occTypeName =
                  occ.occurrence_type === 'other' ? occ.custom_type || 'Outro' : occ.occurrence_type

                return (
                  <Card
                    key={occ.id}
                    className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all flex flex-col justify-between"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-[10px] font-bold ${badgeClass}`}>
                          Severidade: {badgeLabel}
                        </Badge>
                        <RecordActionMenu
                          onView={() => setDetailsOcc(occ)}
                          onEdit={
                            canEdit
                              ? () => {
                                  setEditingOcc(occ)
                                  setOccModalOpen(true)
                                }
                              : undefined
                          }
                          onDelete={canDelete ? () => setDeletingOcc(occ) : undefined}
                          disabled={!canEdit}
                        />
                      </div>

                      <div>
                        <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 capitalize">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          {occTypeName}
                        </h3>
                        {occ.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {occ.description}
                          </p>
                        )}
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-foreground">
                          Lote: {lotName(occ.lot_id)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-secondary/30 p-2.5 rounded-2xl text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Data</span>
                          <span className="font-semibold text-foreground">
                            {occ.occurrence_date ? occ.occurrence_date.split('T')[0] : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Afetados</span>
                          <span className="font-semibold text-foreground">
                            {occ.affected_count || 1} aves
                          </span>
                        </div>
                        {occ.action_taken && (
                          <div className="col-span-2">
                            <span className="text-[10px] text-muted-foreground block">
                              Ação Tomada
                            </span>
                            <span className="font-medium text-foreground text-[11px] truncate block">
                              {occ.action_taken}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ==========================================
            ABA 4: PROTOCOLOS
        ========================================== */}
        <TabsContent value="protocolos" className="mt-4 space-y-4">
          {filteredProtocols.length === 0 ? (
            <Card className="rounded-3xl bg-white border-border shadow-subtle">
              <CardContent className="p-8 text-center space-y-3">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Nenhum protocolo cadastrado
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Crie planos sanitários reutilizáveis (ex: Programa de Vacinação Inicial de
                    Pintinhos) e vincule aos lotes.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingProt(null)
                    setProtModalOpen(true)
                  }}
                  className="rounded-xl bg-primary text-white text-xs gap-1.5 font-bold"
                >
                  <Plus className="w-4 h-4" /> Criar Protocolo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProtocols.map((prot) => {
                const stepCount = prot.steps?.length || 0
                return (
                  <Card
                    key={prot.id}
                    className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all flex flex-col justify-between"
                  >
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-100 text-purple-900 border-purple-200 text-[10px] font-bold">
                          {prot.protocol_type}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAssigningProt(prot)
                              setAssignModalOpen(true)
                            }}
                            className="h-7 text-[11px] rounded-xl text-primary border-primary/20 gap-1"
                          >
                            <Link2 className="w-3.5 h-3.5" /> Vincular a Lote
                          </Button>
                          <RecordActionMenu
                            onView={() => setDetailsProt(prot)}
                            onEdit={
                              canEdit
                                ? () => {
                                    setEditingProt(prot)
                                    setProtModalOpen(true)
                                  }
                                : undefined
                            }
                            onDelete={canDelete ? () => setDeletingProt(prot) : undefined}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-base text-foreground flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                          {prot.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Atividade: {prot.activity_type || 'Todas'} • {stepCount}{' '}
                          {stepCount === 1 ? 'etapa' : 'etapas'}
                        </p>
                      </div>

                      {/* Etapas preview */}
                      <div className="space-y-1.5 bg-secondary/30 p-3 rounded-2xl">
                        <span className="text-[11px] font-bold text-foreground block">
                          Cronograma de Etapas
                        </span>
                        {stepCount === 0 ? (
                          <p className="text-[11px] text-muted-foreground">
                            Nenhuma etapa configurada.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {prot.steps.slice(0, 4).map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0"
                              >
                                <span className="font-semibold text-primary">Dia {step.day}:</span>
                                <span className="text-foreground truncate flex-1 ml-2">
                                  {step.action}
                                </span>
                              </div>
                            ))}
                            {stepCount > 4 && (
                              <p className="text-[10px] text-muted-foreground pt-1">
                                + {stepCount - 4} etapas adicionais...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Vínculos de protocolo existentes */}
          {protocolAssignments.length > 0 && (
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" /> Vínculos Ativos a Lotes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {protocolAssignments.map((pa) => {
                  const prot = healthProtocols.find((p) => p.id === pa.protocol_id)
                  const lot = lots.find((l) => l.id === pa.lot_id)
                  return (
                    <Card key={pa.id} className="rounded-2xl bg-white border-border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">
                          {lot?.name || 'Lote'}
                        </span>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProtocolAssignment(pa.id)}
                            className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-foreground font-semibold">
                        Protocolo: {prot?.name || pa.protocolName || '—'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Data de Ref (Alojamento): {pa.start_date}
                      </p>
                      <div className="text-[10px] text-muted-foreground bg-secondary/50 p-2 rounded-xl">
                        {pa.generated_entries?.length || 0} ações geradas
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==========================================
            ABA 5: CALENDÁRIO & TIMELINE
        ========================================== */}
        <TabsContent value="calendario" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={calendarFilter === 'hoje' ? 'default' : 'outline'}
                onClick={() => setCalendarFilter('hoje')}
                className="h-8 rounded-xl text-xs"
              >
                Hoje
              </Button>
              <Button
                size="sm"
                variant={calendarFilter === '7dias' ? 'default' : 'outline'}
                onClick={() => setCalendarFilter('7dias')}
                className="h-8 rounded-xl text-xs"
              >
                Próximos 7 dias
              </Button>
              <Button
                size="sm"
                variant={calendarFilter === '30dias' ? 'default' : 'outline'}
                onClick={() => setCalendarFilter('30dias')}
                className="h-8 rounded-xl text-xs"
              >
                Próximos 30 dias
              </Button>
              <Button
                size="sm"
                variant={calendarFilter === 'atrasados' ? 'default' : 'outline'}
                onClick={() => setCalendarFilter('atrasados')}
                className="h-8 rounded-xl text-xs text-rose-600"
              >
                Atrasados
              </Button>
            </div>
          </div>

          {/* Consolidated Timeline list */}
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0]
            const d7 = new Date()
            d7.setDate(d7.getDate() + 7)
            const d7Str = d7.toISOString().split('T')[0]

            const d30 = new Date()
            d30.setDate(d30.getDate() + 30)
            const d30Str = d30.toISOString().split('T')[0]

            // Combine vaccinations and treatments
            const items: {
              id: string
              type: 'vacina' | 'tratamento'
              title: string
              lot_name: string
              date: string
              status: string
              isDelayed: boolean
              responsible?: string
            }[] = []

            for (const v of vaccinations) {
              const targetDate = v.scheduled_date || v.performed_date || ''
              const isDelayed = Boolean(
                v.status === 'delayed' ||
                (v.status === 'scheduled' && targetDate && targetDate < todayStr),
              )
              items.push({
                id: v.id,
                type: 'vacina',
                title: `Vacina: ${v.vaccine_name}`,
                lot_name: lotName(v.lot_id),
                date: targetDate,
                status: v.status,
                isDelayed,
                responsible: v.responsible,
              })
            }

            for (const t of treatments) {
              const targetDate = t.start_date || ''
              const isDelayed = Boolean(
                t.status === 'scheduled' && targetDate && targetDate < todayStr,
              )
              items.push({
                id: t.id,
                type: 'tratamento',
                title: `Tratamento: ${t.medication_name}`,
                lot_name: lotName(t.lot_id),
                date: targetDate,
                status: t.status,
                isDelayed,
                responsible: t.responsible,
              })
            }

            // Filter
            const filtered = items.filter((it) => {
              if (calendarFilter === 'atrasados') return it.isDelayed
              if (calendarFilter === 'hoje') return it.date === todayStr
              if (calendarFilter === '7dias') return it.date >= todayStr && it.date <= d7Str
              if (calendarFilter === '30dias') return it.date >= todayStr && it.date <= d30Str
              return true
            })

            // Group by date
            const grouped: Record<string, typeof items> = {}
            for (const it of filtered.sort((a, b) => a.date.localeCompare(b.date))) {
              const key = it.date || 'Sem data definida'
              if (!grouped[key]) grouped[key] = []
              grouped[key].push(it)
            }

            const dates = Object.keys(grouped)

            if (dates.length === 0) {
              return (
                <Card className="rounded-3xl bg-white border-border shadow-subtle p-8 text-center">
                  <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    Nenhum procedimento encontrado para este filtro
                  </p>
                </Card>
              )
            }

            return (
              <div className="space-y-4">
                {dates.map((dateKey) => (
                  <div key={dateKey} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-xs font-bold text-foreground">
                        {dateKey === todayStr ? `Hoje (${dateKey})` : dateKey}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {grouped[dateKey].map((it) => (
                        <div
                          key={it.id}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs bg-white ${
                            it.isDelayed ? 'border-rose-300 bg-rose-50/40' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                              {it.type === 'vacina' ? (
                                <Syringe className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Pill className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{it.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Lote: {it.lot_name}
                                {it.responsible ? ` • Resp: ${it.responsible}` : ''}
                              </p>
                            </div>
                          </div>
                          <div>
                            {it.isDelayed ? (
                              <Badge className="bg-rose-100 text-rose-900 border-rose-200 text-[10px]">
                                Atrasado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {it.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </TabsContent>
      </Tabs>

      {/* ==========================================
          MODAIS E DIÁLOGOS
      ========================================== */}
      <VaccinationDialog
        open={vacModalOpen}
        onOpenChange={setVacModalOpen}
        editing={editingVac}
        lots={lots}
        activities={activities}
        inventory={inventory}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={async (payload) => {
          if (editingVac) {
            await updateVaccination(editingVac.id, payload)
            toast({ title: 'Vacinação atualizada com sucesso! 💉' })
          } else {
            await addVaccination(payload)
            toast({ title: 'Vacinação cadastrada com sucesso! 💉' })
          }
          setVacModalOpen(false)
        }}
      />

      <TreatmentDialog
        open={trtModalOpen}
        onOpenChange={setTrtModalOpen}
        editing={editingTrt}
        lots={lots}
        activities={activities}
        inventory={inventory}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={async (payload) => {
          if (editingTrt) {
            await updateTreatment(editingTrt.id, payload)
            toast({ title: 'Tratamento atualizado com sucesso! 💊' })
          } else {
            await addTreatment(payload)
            toast({ title: 'Tratamento cadastrado com sucesso! 💊' })
          }
          setTrtModalOpen(false)
        }}
      />

      <OccurrenceDialog
        open={occModalOpen}
        onOpenChange={setOccModalOpen}
        editing={editingOcc}
        lots={lots}
        activities={activities}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={async (payload) => {
          if (editingOcc) {
            await updateHealthOccurrence(editingOcc.id, payload)
            toast({ title: 'Ocorrência atualizada! ⚠️' })
          } else {
            await addHealthOccurrence(payload)
            toast({ title: 'Ocorrência registrada com sucesso! ⚠️' })
          }
          setOccModalOpen(false)
        }}
      />

      <ProtocolDialog
        open={protModalOpen}
        onOpenChange={setProtModalOpen}
        editing={editingProt}
        inventory={inventory}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={async (payload) => {
          if (editingProt) {
            await updateHealthProtocol(editingProt.id, payload)
            toast({ title: 'Protocolo atualizado! 📋' })
          } else {
            await addHealthProtocol(payload)
            toast({ title: 'Protocolo criado com sucesso! 📋' })
          }
          setProtModalOpen(false)
        }}
      />

      <AssignProtocolDialog
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        protocol={assigningProt}
        lots={lots}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onAssign={async (lotId, refDate) => {
          if (!assigningProt) return
          const lot = lots.find((l) => l.id === lotId)
          const ref = new Date(refDate)

          const entries = (assigningProt.steps || []).map((st) => {
            const entryDate = new Date(ref)
            entryDate.setDate(entryDate.getDate() + Number(st.day || 0))
            return {
              day_offset: st.day,
              scheduled_date: entryDate.toISOString().split('T')[0],
              action: st.action,
              description: st.description,
              status: 'pending' as const,
            }
          })

          await addProtocolAssignment({
            organization_id: organization?.id,
            property_id: currentProperty?.id,
            lot_id: lotId,
            lotName: lot?.name,
            protocol_id: assigningProt.id,
            protocolName: assigningProt.name,
            assigned_date: new Date().toISOString().split('T')[0],
            start_date: refDate,
            generated_entries: entries,
          })

          toast({
            title: 'Protocolo vinculado ao lote! ✨',
            description: `${entries.length} etapas programadas a partir de ${refDate}.`,
          })
          setAssignModalOpen(false)
        }}
      />

      {/* Delete Dialogs */}
      <DeleteConfirmDialog
        open={!!deletingVac}
        onOpenChange={(v) => !v && setDeletingVac(null)}
        onConfirm={async () => {
          if (deletingVac) {
            await deleteVaccination(deletingVac.id)
            toast({ title: 'Vacinação excluída' })
            setDeletingVac(null)
          }
        }}
      />

      <DeleteConfirmDialog
        open={!!deletingTrt}
        onOpenChange={(v) => !v && setDeletingTrt(null)}
        onConfirm={async () => {
          if (deletingTrt) {
            await deleteTreatment(deletingTrt.id)
            toast({ title: 'Tratamento excluído' })
            setDeletingTrt(null)
          }
        }}
      />

      <DeleteConfirmDialog
        open={!!deletingOcc}
        onOpenChange={(v) => !v && setDeletingOcc(null)}
        onConfirm={async () => {
          if (deletingOcc) {
            await deleteHealthOccurrence(deletingOcc.id)
            toast({ title: 'Ocorrência excluída' })
            setDeletingOcc(null)
          }
        }}
      />

      <DeleteConfirmDialog
        open={!!deletingProt}
        onOpenChange={(v) => !v && setDeletingProt(null)}
        onConfirm={async () => {
          if (deletingProt) {
            await deleteHealthProtocol(deletingProt.id)
            toast({ title: 'Protocolo excluído' })
            setDeletingProt(null)
          }
        }}
      />

      {/* Details View Dialogs */}
      <RecordDetailsDialog
        open={!!detailsVac}
        onOpenChange={(v) => !v && setDetailsVac(null)}
        title={`Vacinação — ${detailsVac?.vaccine_name || ''}`}
        badge={
          detailsVac
            ? { label: detailsVac.status, className: 'bg-emerald-100 text-emerald-800 text-[10px]' }
            : null
        }
        rows={
          detailsVac
            ? [
                { label: 'Vacina', value: detailsVac.vaccine_name },
                { label: 'Doença / Alvo', value: detailsVac.disease_target },
                { label: 'Lote', value: lotName(detailsVac.lot_id) },
                { label: 'Data Programada', value: detailsVac.scheduled_date },
                { label: 'Data Realizada', value: detailsVac.performed_date },
                { label: 'Animais', value: detailsVac.animal_count },
                {
                  label: 'Dose por animal',
                  value: `${detailsVac.dose_per_animal || ''} ${detailsVac.dose_unit || ''}`,
                },
                { label: 'Via de Aplicação', value: detailsVac.application_route },
                { label: 'Item do Estoque', value: itemName(detailsVac.inventory_item_id) },
                { label: 'Qtd Usada', value: detailsVac.quantity_used },
                {
                  label: 'Custo Total',
                  value: detailsVac.total_cost
                    ? `R$ ${Number(detailsVac.total_cost).toFixed(2)}`
                    : 'R$ 0,00',
                },
                { label: 'Baixa no Estoque', value: detailsVac.stock_deducted ? 'Sim' : 'Não' },
                { label: 'Lote do Fabricante', value: detailsVac.batch_number },
                { label: 'Validade', value: detailsVac.expiration_date },
                { label: 'Responsável', value: detailsVac.responsible },
                { label: 'Observações', value: detailsVac.notes },
              ]
            : []
        }
      />

      <RecordDetailsDialog
        open={!!detailsTrt}
        onOpenChange={(v) => !v && setDetailsTrt(null)}
        title={`Tratamento — ${detailsTrt?.medication_name || ''}`}
        badge={
          detailsTrt
            ? { label: detailsTrt.status, className: 'bg-blue-100 text-blue-800 text-[10px]' }
            : null
        }
        rows={
          detailsTrt
            ? [
                { label: 'Medicamento', value: detailsTrt.medication_name },
                { label: 'Diagnóstico / Motivo', value: detailsTrt.diagnosis_reason },
                { label: 'Lote', value: lotName(detailsTrt.lot_id) },
                { label: 'Dosagem', value: detailsTrt.dosage },
                { label: 'Frequência', value: detailsTrt.frequency },
                { label: 'Duração (dias)', value: detailsTrt.duration_days },
                { label: 'Data Início', value: detailsTrt.start_date },
                { label: 'Data Fim', value: detailsTrt.end_date },
                { label: 'Carência (dias)', value: detailsTrt.withdrawal_period_days },
                { label: 'Item do Estoque', value: itemName(detailsTrt.inventory_item_id) },
                { label: 'Qtd Usada', value: detailsTrt.quantity_used },
                {
                  label: 'Custo Total',
                  value: detailsTrt.total_cost
                    ? `R$ ${Number(detailsTrt.total_cost).toFixed(2)}`
                    : 'R$ 0,00',
                },
                { label: 'Responsável', value: detailsTrt.responsible },
                { label: 'Observações', value: detailsTrt.notes },
              ]
            : []
        }
      />

      <RecordDetailsDialog
        open={!!detailsOcc}
        onOpenChange={(v) => !v && setDetailsOcc(null)}
        title={`Ocorrência — ${detailsOcc?.occurrence_type || ''}`}
        badge={
          detailsOcc
            ? {
                label: `Severidade: ${detailsOcc.severity}`,
                className: 'bg-amber-100 text-amber-800 text-[10px]',
              }
            : null
        }
        rows={
          detailsOcc
            ? [
                { label: 'Data', value: detailsOcc.occurrence_date },
                {
                  label: 'Tipo',
                  value:
                    detailsOcc.occurrence_type === 'other'
                      ? detailsOcc.custom_type
                      : detailsOcc.occurrence_type,
                },
                { label: 'Severidade', value: detailsOcc.severity },
                { label: 'Lote', value: lotName(detailsOcc.lot_id) },
                { label: 'Animais Afetados', value: detailsOcc.affected_count },
                { label: 'Sintomas', value: detailsOcc.symptoms },
                { label: 'Descrição', value: detailsOcc.description },
                { label: 'Ação Tomada', value: detailsOcc.action_taken },
                { label: 'Responsável', value: detailsOcc.responsible },
                { label: 'Observações', value: detailsOcc.notes },
              ]
            : []
        }
      />
    </div>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO VACINAÇÃO
// ====================================================================
function VaccinationDialog({
  open,
  onOpenChange,
  editing,
  lots,
  activities,
  inventory,
  orgId,
  propertyId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Vaccination | null
  lots: any[]
  activities: any[]
  inventory: any[]
  orgId?: string
  propertyId?: string
  onSubmit: (data: Omit<Vaccination, 'id'>) => Promise<void>
}) {
  const [vaccineName, setVaccineName] = useState('')
  const [diseaseTarget, setDiseaseTarget] = useState('')
  const [activityId, setActivityId] = useState('')
  const [lotId, setLotId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [performedDate, setPerformedDate] = useState('')
  const [animalCount, setAnimalCount] = useState('100')
  const [dosePerAnimal, setDosePerAnimal] = useState('0.5')
  const [doseUnit, setDoseUnit] = useState('mL')
  const [applicationRoute, setApplicationRoute] = useState('água')
  const [responsible, setResponsible] = useState('')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [quantityUsed, setQuantityUsed] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [stockDeducted, setStockDeducted] = useState(false)
  const [status, setStatus] = useState<VaccinationStatus>('scheduled')
  const [notes, setNotes] = useState('')

  // Sync state when editing opens
  const resetForm = () => {
    if (editing) {
      setVaccineName(editing.vaccine_name || '')
      setDiseaseTarget(editing.disease_target || '')
      setActivityId(editing.activity_id || '')
      setLotId(editing.lot_id || '')
      setScheduledDate(editing.scheduled_date || '')
      setPerformedDate(editing.performed_date || '')
      setAnimalCount(String(editing.animal_count || '100'))
      setDosePerAnimal(String(editing.dose_per_animal || '0.5'))
      setDoseUnit(editing.dose_unit || 'mL')
      setApplicationRoute(editing.application_route || 'água')
      setResponsible(editing.responsible || '')
      setInventoryItemId(editing.inventory_item_id || '')
      setBatchNumber(editing.batch_number || '')
      setExpirationDate(editing.expiration_date || '')
      setQuantityUsed(String(editing.quantity_used || ''))
      setUnitCost(String(editing.unit_cost || ''))
      setTotalCost(String(editing.total_cost || ''))
      setStockDeducted(Boolean(editing.stock_deducted))
      setStatus(editing.status || 'scheduled')
      setNotes(editing.notes || '')
    } else {
      setVaccineName('')
      setDiseaseTarget('')
      setActivityId('')
      setLotId('')
      setScheduledDate(new Date().toISOString().split('T')[0])
      setPerformedDate('')
      setAnimalCount('100')
      setDosePerAnimal('0.5')
      setDoseUnit('mL')
      setApplicationRoute('água')
      setResponsible('')
      setInventoryItemId('')
      setBatchNumber('')
      setExpirationDate('')
      setQuantityUsed('50')
      setUnitCost('')
      setTotalCost('')
      setStockDeducted(false)
      setStatus('scheduled')
      setNotes('')
    }
  }

  // Update calculated quantity used whenever animalCount or dose changes
  const handleAutoCalcQty = (count: number, dose: number) => {
    if (count > 0 && dose > 0) {
      const calc = Number((count * dose).toFixed(3))
      setQuantityUsed(String(calc))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vaccineName.trim()) {
      toast({ title: 'Nome da vacina é obrigatório', variant: 'destructive' })
      return
    }

    const selectedItem = inventory.find((i) => i.id === inventoryItemId)
    const selectedLot = lots.find((l) => l.id === lotId)

    const payload: Omit<Vaccination, 'id'> = {
      organization_id: orgId,
      property_id: propertyId,
      activity_id: activityId || undefined,
      lot_id: lotId || undefined,
      lotName: selectedLot?.name,
      vaccine_name: vaccineName.trim(),
      disease_target: diseaseTarget.trim() || undefined,
      scheduled_date: scheduledDate || undefined,
      performed_date:
        status === 'performed'
          ? performedDate || new Date().toISOString().split('T')[0]
          : performedDate || undefined,
      animal_count: Number(animalCount) || undefined,
      dose_per_animal: Number(dosePerAnimal) || undefined,
      dose_unit: doseUnit || undefined,
      application_route: applicationRoute || undefined,
      responsible: responsible.trim() || undefined,
      inventory_item_id: inventoryItemId || undefined,
      inventory_item_name: selectedItem?.name,
      batch_number: batchNumber.trim() || undefined,
      expiration_date: expirationDate || undefined,
      quantity_used: Number(quantityUsed) || undefined,
      unit_cost: Number(unitCost) || undefined,
      total_cost: Number(totalCost) || undefined,
      stock_deducted: stockDeducted,
      notes: notes.trim() || undefined,
      status,
    }

    onSubmit(payload)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Syringe className="w-5 h-5 text-emerald-600" />
            {editing ? 'Editar Vacinação' : 'Nova Vacinação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div>
            <Label className="text-xs">Nome da Vacina *</Label>
            <Input
              placeholder="Ex: Newcastle, Gumboro, Marek, Bouba"
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Doença / Alvo</Label>
              <Input
                placeholder="Ex: Doença de Newcastle"
                value={diseaseTarget}
                onChange={(e) => setDiseaseTarget(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as VaccinationStatus)
                  if (v === 'performed' && !performedDate) {
                    setPerformedDate(new Date().toISOString().split('T')[0])
                  }
                }}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="performed">Realizada</SelectItem>
                  <SelectItem value="delayed">Atrasada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Lote</Label>
              <Select value={lotId} onValueChange={setLotId}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geral / Sem lote</SelectItem>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Atividade</Label>
              <Select value={activityId} onValueChange={setActivityId}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geral</SelectItem>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data Programada</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Data Realizada</Label>
              <Input
                type="date"
                value={performedDate}
                onChange={(e) => setPerformedDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Qtd Animais</Label>
              <Input
                type="number"
                value={animalCount}
                onChange={(e) => {
                  setAnimalCount(e.target.value)
                  handleAutoCalcQty(Number(e.target.value), Number(dosePerAnimal))
                }}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Dose / Ave</Label>
              <Input
                type="number"
                step="any"
                value={dosePerAnimal}
                onChange={(e) => {
                  setDosePerAnimal(e.target.value)
                  handleAutoCalcQty(Number(animalCount), Number(e.target.value))
                }}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Unidade</Label>
              <Input
                placeholder="mL, gotas, dose"
                value={doseUnit}
                onChange={(e) => setDoseUnit(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Via de Aplicação</Label>
              <Select value={applicationRoute} onValueChange={setApplicationRoute}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="água">Água de bebida</SelectItem>
                  <SelectItem value="ocular">Ocular / Nasal</SelectItem>
                  <SelectItem value="oral">Oral direta</SelectItem>
                  <SelectItem value="intramuscular">Intramuscular</SelectItem>
                  <SelectItem value="subcutânea">Subcutânea</SelectItem>
                  <SelectItem value="spray">Spray</SelectItem>
                  <SelectItem value="ração">Ração</SelectItem>
                  <SelectItem value="outra">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input
                placeholder="Nome do aplicador"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Estoque e Custos */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
            <span className="text-xs font-bold text-foreground block">
              Vínculo com Estoque & Custos
            </span>
            <div>
              <Label className="text-xs">Item do Estoque (opcional)</Label>
              <Select value={inventoryItemId} onValueChange={setInventoryItemId}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                  <SelectValue placeholder="Selecione o frasco/produto do estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Atual: {item.currentStock} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Qtd Total Consumida</Label>
                <Input
                  type="number"
                  step="any"
                  value={quantityUsed}
                  onChange={(e) => setQuantityUsed(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white"
                  placeholder="Calculada automaticamente"
                />
              </div>
              <div>
                <Label className="text-xs">Nº do Lote Fabricante</Label>
                <Input
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white"
                  placeholder="Ex: LOTE-894"
                />
              </div>
            </div>

            {/* Baixa de estoque checkbox - visível se tiver item do estoque e status for realizado */}
            {inventoryItemId && status === 'performed' && (
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="vacStockDeduct"
                  checked={stockDeducted}
                  onCheckedChange={(v) => setStockDeducted(Boolean(v))}
                />
                <label
                  htmlFor="vacStockDeduct"
                  className="text-xs font-semibold leading-none cursor-pointer text-foreground"
                >
                  [✓] Dar baixa no estoque e calcular custo automaticamente
                </label>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              placeholder="Reações adversas, temperatura da água, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white mt-2"
          >
            {editing ? 'Salvar Alterações' : 'Cadastrar Vacinação ✨'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO MEDICAMENTO / TRATAMENTO
// ====================================================================
function TreatmentDialog({
  open,
  onOpenChange,
  editing,
  lots,
  activities,
  inventory,
  orgId,
  propertyId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Treatment | null
  lots: any[]
  activities: any[]
  inventory: any[]
  orgId?: string
  propertyId?: string
  onSubmit: (data: Omit<Treatment, 'id'>) => Promise<void>
}) {
  const [medicationName, setMedicationName] = useState('')
  const [diagnosisReason, setDiagnosisReason] = useState('')
  const [activityId, setActivityId] = useState('')
  const [lotId, setLotId] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('A cada 24 horas')
  const [durationDays, setDurationDays] = useState('5')
  const [administrationRoute, setAdministrationRoute] = useState('Água de bebida')
  const [animalCount, setAnimalCount] = useState('100')
  const [responsible, setResponsible] = useState('')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [quantityUsed, setQuantityUsed] = useState('')
  const [stockDeducted, setStockDeducted] = useState(false)
  const [withdrawalPeriodDays, setWithdrawalPeriodDays] = useState('0')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<TreatmentStatus>('in_progress')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    if (editing) {
      setMedicationName(editing.medication_name || '')
      setDiagnosisReason(editing.diagnosis_reason || '')
      setActivityId(editing.activity_id || '')
      setLotId(editing.lot_id || '')
      setDosage(editing.dosage || '')
      setFrequency(editing.frequency || 'A cada 24 horas')
      setDurationDays(String(editing.duration_days || '5'))
      setAdministrationRoute(editing.administration_route || 'Água de bebida')
      setAnimalCount(String(editing.animal_count || '100'))
      setResponsible(editing.responsible || '')
      setInventoryItemId(editing.inventory_item_id || '')
      setQuantityUsed(String(editing.quantity_used || ''))
      setStockDeducted(Boolean(editing.stock_deducted))
      setWithdrawalPeriodDays(String(editing.withdrawal_period_days || '0'))
      setStartDate(editing.start_date || '')
      setEndDate(editing.end_date || '')
      setStatus(editing.status || 'in_progress')
      setNotes(editing.notes || '')
    } else {
      setMedicationName('')
      setDiagnosisReason('')
      setActivityId('')
      setLotId('')
      setDosage('')
      setFrequency('A cada 24 horas')
      setDurationDays('5')
      setAdministrationRoute('Água de bebida')
      setAnimalCount('100')
      setResponsible('')
      setInventoryItemId('')
      setQuantityUsed('')
      setStockDeducted(false)
      setWithdrawalPeriodDays('0')
      setStartDate(new Date().toISOString().split('T')[0])
      setEndDate('')
      setStatus('in_progress')
      setNotes('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!medicationName.trim()) {
      toast({ title: 'Nome do medicamento é obrigatório', variant: 'destructive' })
      return
    }

    const selectedItem = inventory.find((i) => i.id === inventoryItemId)
    const selectedLot = lots.find((l) => l.id === lotId)

    const payload: Omit<Treatment, 'id'> = {
      organization_id: orgId,
      property_id: propertyId,
      activity_id: activityId || undefined,
      lot_id: lotId || undefined,
      lotName: selectedLot?.name,
      medication_name: medicationName.trim(),
      diagnosis_reason: diagnosisReason.trim() || undefined,
      dosage: dosage.trim() || undefined,
      frequency: frequency.trim() || undefined,
      duration_days: Number(durationDays) || undefined,
      administration_route: administrationRoute || undefined,
      animal_count: Number(animalCount) || undefined,
      responsible: responsible.trim() || undefined,
      inventory_item_id: inventoryItemId || undefined,
      inventory_item_name: selectedItem?.name,
      quantity_used: Number(quantityUsed) || undefined,
      stock_deducted: stockDeducted,
      withdrawal_period_days: Number(withdrawalPeriodDays) || 0,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      notes: notes.trim() || undefined,
      status,
    }

    onSubmit(payload)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            {editing ? 'Editar Tratamento' : 'Novo Tratamento Veterinário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div>
            <Label className="text-xs">Medicamento / Princípio Ativo *</Label>
            <Input
              placeholder="Ex: Enrofloxacino, Vermífugo Ivomec, Complexo Vitamínico"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Diagnóstico / Motivo</Label>
              <Input
                placeholder="Ex: Coriza infecciosa, verminose"
                value={diagnosisReason}
                onChange={(e) => setDiagnosisReason(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TreatmentStatus)}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Lote</Label>
              <Select value={lotId} onValueChange={setLotId}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geral / Sem lote</SelectItem>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Período de Carência (dias)</Label>
              <Input
                type="number"
                value={withdrawalPeriodDays}
                onChange={(e) => setWithdrawalPeriodDays(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="Ex: 7 (dias para abate/consumo)"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Dosagem</Label>
              <Input
                placeholder="Ex: 10 mL / L"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Frequência</Label>
              <Input
                placeholder="A cada 12h, 24h"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Duração (dias)</Label>
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data de Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Data de Término</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Via de Administração</Label>
              <Input
                value={administrationRoute}
                onChange={(e) => setAdministrationRoute(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="Água de bebida, injetável"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="Veterinário / Tratador"
              />
            </div>
          </div>

          {/* Estoque e Custos */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
            <span className="text-xs font-bold text-foreground block">
              Vínculo com Estoque & Custos
            </span>
            <div>
              <Label className="text-xs">Item do Estoque (opcional)</Label>
              <Select value={inventoryItemId} onValueChange={setInventoryItemId}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                  <SelectValue placeholder="Selecione o frasco/produto do estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Atual: {item.currentStock} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Qtd Consumida do Estoque</Label>
              <Input
                type="number"
                step="any"
                value={quantityUsed}
                onChange={(e) => setQuantityUsed(e.target.value)}
                className="h-10 text-xs rounded-xl bg-white"
                placeholder="Quantidade total utilizada (ex: 2 frascos ou 500 mL)"
              />
            </div>

            {inventoryItemId && (status === 'completed' || status === 'in_progress') && (
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="trtStockDeduct"
                  checked={stockDeducted}
                  onCheckedChange={(v) => setStockDeducted(Boolean(v))}
                />
                <label
                  htmlFor="trtStockDeduct"
                  className="text-xs font-semibold leading-none cursor-pointer text-foreground"
                >
                  [✓] Dar baixa no estoque e alocar custo no lote
                </label>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              placeholder="Instruções de diluição, reações, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white mt-2"
          >
            {editing ? 'Salvar Alterações' : 'Registrar Tratamento ✨'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO OCORRÊNCIA CLÍNICA
// ====================================================================
function OccurrenceDialog({
  open,
  onOpenChange,
  editing,
  lots,
  activities,
  orgId,
  propertyId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: HealthOccurrence | null
  lots: any[]
  activities: any[]
  orgId?: string
  propertyId?: string
  onSubmit: (data: Omit<HealthOccurrence, 'id'>) => Promise<void>
}) {
  const [occurrenceType, setOccurrenceType] = useState<HealthOccurrenceType>('disease')
  const [customType, setCustomType] = useState('')
  const [severity, setSeverity] = useState<HealthOccurrenceSeverity>('moderate')
  const [lotId, setLotId] = useState('')
  const [occurrenceDate, setOccurrenceDate] = useState('')
  const [affectedCount, setAffectedCount] = useState('1')
  const [symptoms, setSymptoms] = useState('')
  const [description, setDescription] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [responsible, setResponsible] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    if (editing) {
      setOccurrenceType(editing.occurrence_type || 'disease')
      setCustomType(editing.custom_type || '')
      setSeverity(editing.severity || 'moderate')
      setLotId(editing.lot_id || '')
      setOccurrenceDate(editing.occurrence_date ? editing.occurrence_date.split('T')[0] : '')
      setAffectedCount(String(editing.affected_count || '1'))
      setSymptoms(editing.symptoms || '')
      setDescription(editing.description || '')
      setActionTaken(editing.action_taken || '')
      setResponsible(editing.responsible || '')
      setNotes(editing.notes || '')
    } else {
      setOccurrenceType('disease')
      setCustomType('')
      setSeverity('moderate')
      setLotId('')
      setOccurrenceDate(new Date().toISOString().split('T')[0])
      setAffectedCount('1')
      setSymptoms('')
      setDescription('')
      setActionTaken('')
      setResponsible('')
      setNotes('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedLot = lots.find((l) => l.id === lotId)

    const payload: Omit<HealthOccurrence, 'id'> = {
      organization_id: orgId,
      property_id: propertyId,
      lot_id: lotId || undefined,
      lotName: selectedLot?.name,
      occurrence_date: occurrenceDate || new Date().toISOString(),
      occurrence_type: occurrenceType,
      custom_type: occurrenceType === 'other' ? customType.trim() : undefined,
      severity,
      affected_count: Number(affectedCount) || 1,
      symptoms: symptoms.trim() || undefined,
      description: description.trim() || undefined,
      action_taken: actionTaken.trim() || undefined,
      responsible: responsible.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    onSubmit(payload)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            {editing ? 'Editar Ocorrência' : 'Registrar Ocorrência Clínica'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo de Ocorrência *</Label>
              <Select
                value={occurrenceType}
                onValueChange={(v) => setOccurrenceType(v as HealthOccurrenceType)}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disease">Doença clínica</SelectItem>
                  <SelectItem value="symptom">Sintoma isolado</SelectItem>
                  <SelectItem value="respiratory">Problema respiratório</SelectItem>
                  <SelectItem value="diarrhea">Diarreia / Digestivo</SelectItem>
                  <SelectItem value="locomotor">Problema locomotor / Perna</SelectItem>
                  <SelectItem value="injury">Ferimento / Bicagem</SelectItem>
                  <SelectItem value="parasites">Parasitas (piolho, ácaro)</SelectItem>
                  <SelectItem value="abnormal_behavior">Comportamento anormal</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Severidade *</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as HealthOccurrenceSeverity)}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="moderate">Moderada</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {occurrenceType === 'other' && (
            <div>
              <Label className="text-xs">Especifique o Tipo</Label>
              <Input
                placeholder="Descreva o tipo personalizado"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Lote</Label>
              <Select value={lotId} onValueChange={setLotId}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geral / Sem lote</SelectItem>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data da Ocorrência</Label>
              <Input
                type="date"
                value={occurrenceDate}
                onChange={(e) => setOccurrenceDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nº de Aves Afetadas</Label>
              <Input
                type="number"
                value={affectedCount}
                onChange={(e) => setAffectedCount(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável / Notificador</Label>
              <Input
                placeholder="Nome do tratador"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Sintomas Observados</Label>
            <Input
              placeholder="Ex: Espirro, ronqueira, fezes esbranquiçadas, prostração"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div>
            <Label className="text-xs">Descrição Detalhada</Label>
            <Textarea
              placeholder="Descreva a situação encontrada no aviário..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <div>
            <Label className="text-xs">Ação Tomada</Label>
            <Input
              placeholder="Ex: Isolamento das aves, início de antibiótico, desinfecção"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white mt-2"
          >
            {editing ? 'Salvar Alterações' : 'Salvar Ocorrência ✨'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO PROTOCOLO SANITÁRIO (COM ETAPAS DINÂMICAS)
// ====================================================================
function ProtocolDialog({
  open,
  onOpenChange,
  editing,
  inventory,
  orgId,
  propertyId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: HealthProtocol | null
  inventory: any[]
  orgId?: string
  propertyId?: string
  onSubmit: (data: Omit<HealthProtocol, 'id'>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [protocolType, setProtocolType] =
    useState<HealthProtocol['protocol_type']>('vaccination_program')
  const [activityType, setActivityType] = useState('Avicultura')
  const [ageRangeStart, setAgeRangeStart] = useState('1')
  const [ageRangeEnd, setAgeRangeEnd] = useState('60')
  const [notes, setNotes] = useState('')
  const [steps, setSteps] = useState<HealthProtocolStep[]>([
    { day: 1, action: 'Vacina Marek + Bouba', description: 'Aplicação no incubatório ou 1º dia' },
    { day: 7, action: 'Vacina Newcastle + Gumboro', description: 'Via água de bebida' },
    { day: 14, action: 'Reforço Gumboro', description: 'Via água de bebida' },
  ])

  const resetForm = () => {
    if (editing) {
      setName(editing.name || '')
      setProtocolType(editing.protocol_type || 'vaccination_program')
      setActivityType(editing.activity_type || 'Avicultura')
      setAgeRangeStart(String(editing.age_range_start || '1'))
      setAgeRangeEnd(String(editing.age_range_end || '60'))
      setNotes(editing.notes || '')
      setSteps(editing.steps && editing.steps.length > 0 ? [...editing.steps] : [])
    } else {
      setName('')
      setProtocolType('vaccination_program')
      setActivityType('Avicultura')
      setAgeRangeStart('1')
      setAgeRangeEnd('60')
      setNotes('')
      setSteps([
        { day: 1, action: 'Vacina Marek + Bouba', description: 'Aplicação no 1º dia' },
        { day: 7, action: 'Vacina Newcastle + Gumboro', description: 'Via água de bebida' },
        { day: 14, action: 'Reforço Gumboro', description: 'Via água de bebida' },
      ])
    }
  }

  const addStep = () => {
    const nextDay = steps.length > 0 ? steps[steps.length - 1].day + 7 : 1
    setSteps([...steps, { day: nextDay, action: '', description: '' }])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, field: keyof HealthProtocolStep, val: any) => {
    const next = [...steps]
    next[index] = { ...next[index], [field]: val }
    setSteps(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Nome do protocolo é obrigatório', variant: 'destructive' })
      return
    }

    const payload: Omit<HealthProtocol, 'id'> = {
      organization_id: orgId,
      property_id: propertyId,
      name: name.trim(),
      protocol_type: protocolType,
      activity_type: activityType,
      age_range_start: Number(ageRangeStart) || 1,
      age_range_end: Number(ageRangeEnd) || 60,
      steps: steps.sort((a, b) => Number(a.day) - Number(b.day)),
      notes: notes.trim() || undefined,
      status: 'active',
    }

    onSubmit(payload)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            {editing ? 'Editar Protocolo Sanitário' : 'Novo Protocolo Sanitário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Nome do Protocolo *</Label>
            <Input
              placeholder="Ex: Programa de Imunização Inicial de Pintainhas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo de Protocolo</Label>
              <Select
                value={protocolType}
                onValueChange={(v) => setProtocolType(v as HealthProtocol['protocol_type'])}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaccination_program">Programa de Vacinação</SelectItem>
                  <SelectItem value="deworming">Vermifugação</SelectItem>
                  <SelectItem value="preventive_treatment">Tratamento Preventivo</SelectItem>
                  <SelectItem value="biosecurity">Biosseguridade</SelectItem>
                  <SelectItem value="cleaning_disinfection">Limpeza & Desinfecção</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Atividade Alvo</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Faixa Etária Inicial (dias)</Label>
              <Input
                type="number"
                value={ageRangeStart}
                onChange={(e) => setAgeRangeStart(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Faixa Etária Final (dias)</Label>
              <Input
                type="number"
                value={ageRangeEnd}
                onChange={(e) => setAgeRangeEnd(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Etapas Dinâmicas */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">Etapas do Protocolo</span>
                <span className="text-[10px] text-muted-foreground">
                  Dia relativo a partir do alojamento
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                className="h-7 text-[11px] rounded-xl text-primary border-primary/20 gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Etapa
              </Button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-secondary/40 border border-border/60 flex items-start gap-2.5 text-xs"
                >
                  <div className="w-20 shrink-0">
                    <Label className="text-[10px] text-muted-foreground">Dia</Label>
                    <Input
                      type="number"
                      value={st.day}
                      onChange={(e) => updateStep(idx, 'day', Number(e.target.value))}
                      className="h-8 text-xs rounded-lg bg-white"
                      placeholder="Dia"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">
                        Ação / Procedimento *
                      </Label>
                      <Input
                        value={st.action}
                        onChange={(e) => updateStep(idx, 'action', e.target.value)}
                        className="h-8 text-xs rounded-lg bg-white"
                        placeholder="Ex: Vacina Newcastle"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        value={st.description || ''}
                        onChange={(e) => updateStep(idx, 'description', e.target.value)}
                        className="h-7 text-[11px] rounded-lg bg-white"
                        placeholder="Detalhes / instruções de diluição"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(idx)}
                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 mt-5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Observações do Protocolo</Label>
            <Textarea
              placeholder="Instruções gerais, cuidados de conservação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white mt-2"
          >
            {editing ? 'Salvar Alterações' : 'Salvar Protocolo ✨'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO VINCULAR PROTOCOLO A LOTE
// ====================================================================
function AssignProtocolDialog({
  open,
  onOpenChange,
  protocol,
  lots,
  orgId,
  propertyId,
  onAssign,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  protocol: HealthProtocol | null
  lots: any[]
  orgId?: string
  propertyId?: string
  onAssign: (lotId: string, refDate: string) => Promise<void>
}) {
  const [selectedLotId, setSelectedLotId] = useState('')
  const [refDate, setRefDate] = useState(new Date().toISOString().split('T')[0])

  const handleLotChange = (id: string) => {
    setSelectedLotId(id)
    const lot = lots.find((l) => l.id === id)
    if (lot && lot.startDate) {
      setRefDate(lot.startDate)
    }
  }

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLotId) {
      toast({ title: 'Selecione o lote', variant: 'destructive' })
      return
    }
    onAssign(selectedLotId, refDate)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Vincular Protocolo a Lote
          </DialogTitle>
        </DialogHeader>

        {protocol && (
          <form onSubmit={handleConfirm} className="space-y-4 mt-2">
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60">
              <span className="text-xs font-bold text-foreground block">{protocol.name}</span>
              <span className="text-[11px] text-muted-foreground block">
                {protocol.steps?.length || 0} etapas serão programadas com base na data de
                alojamento.
              </span>
            </div>

            <div>
              <Label className="text-xs">Lote de Destino *</Label>
              <Select value={selectedLotId} onValueChange={handleLotChange} required>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecione o lote" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Data de Referência (ex: Data de Alojamento) *</Label>
              <Input
                type="date"
                value={refDate}
                onChange={(e) => setRefDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              Vincular e Gerar Cronograma ✨
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
