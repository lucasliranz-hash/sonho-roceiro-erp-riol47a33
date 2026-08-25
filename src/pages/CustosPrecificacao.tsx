import { useState, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useFarmStore } from '@/hooks/use-farm-store'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Calculator,
  Eye,
  TrendingUp,
  AlertTriangle,
  Wheat,
  Zap,
  Users,
  Skull,
  Egg,
  Scale,
  DollarSign,
  Target,
  Building2,
  Coins,
  Plus,
  PawPrint,
} from 'lucide-react'
import {
  computePriceFromMargin,
  computeMarginFromPrice,
  computePricingScenarios,
} from '@/lib/calculations'
import { Expense } from '@/types/farm'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const PRODUCT_SUGGESTIONS = [
  'Frango vivo',
  'Frango abatido',
  'Kg de frango',
  'Pintinho',
  'Ovo',
  'Dúzia',
  'Bandeja',
  'Matriz',
  'Peixe',
  'Kg de peixe',
  'Filé',
  'Animal',
  'Leitão',
  'Kg de suíno',
]

const UNIT_OPTIONS = [
  'unidade',
  'kg',
  'dúzia',
  'bandeja',
  'animal',
  'caixa',
  'lote',
  'litro',
  'outra',
]

type PeriodPreset =
  | 'Mês atual'
  | 'Mês anterior'
  | 'Últimos 30 dias'
  | 'Ciclo do lote'
  | 'Personalizado'

const PERIOD_PRESETS: PeriodPreset[] = [
  'Mês atual',
  'Mês anterior',
  'Últimos 30 dias',
  'Ciclo do lote',
  'Personalizado',
]

// ---------------------------------------------------------------------------
// Helpers de período
// ---------------------------------------------------------------------------

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function getPeriodDates(
  preset: PeriodPreset,
  customStart: string,
  customEnd: string,
  lotStartDate?: string,
): { start: string; end: string } {
  const today = new Date()
  if (preset === 'Mês atual') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { start: toDateStr(start), end: toDateStr(today) }
  }
  if (preset === 'Mês anterior') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const end = new Date(today.getFullYear(), today.getMonth(), 0)
    return { start: toDateStr(start), end: toDateStr(end) }
  }
  if (preset === 'Últimos 30 dias') {
    const start = new Date(today)
    start.setDate(start.getDate() - 30)
    return { start: toDateStr(start), end: toDateStr(today) }
  }
  if (preset === 'Ciclo do lote') {
    return { start: lotStartDate || toDateStr(today), end: toDateStr(today) }
  }
  // Personalizado
  return {
    start: customStart || toDateStr(today),
    end: customEnd || toDateStr(today),
  }
}

function isInPeriod(date: string, start: string, end: string): boolean {
  if (!date) return false
  return date >= start && date <= end
}

const fmtBRL = (n: number) => `R$ ${n.toFixed(2)}`

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

interface SourceRow {
  date: string
  title: string
  detail?: string
  value?: number
}

interface CostLine {
  value: number
  sources: SourceRow[]
}

interface AcquisitionCostLine {
  /** Valor final exibido (acquisitionCost do lote, sem duplicar com a despesa vinculada) */
  value: number
  /** Custo cadastrado no lote */
  lotAcquisitionCost: number
  /** Despesa financeira vinculada (source_type=LOT_ACQUISITION), se existir */
  linkedExpense?: {
    id: string
    value: number
    date: string
    description?: string
    category?: string
  }
  /** Incubação vinculada, se este lote teve origem em incubação própria */
  linkedIncubation?: {
    id: string
    code: string
    incubatorName?: string
    breed?: string
    eggCost?: number
    energyCost?: number
    totalCost?: number
  }
  /** Se a aquisição está incluída no período atual (false => mostrar aviso) */
  included: boolean
  /** Motivo textual do estado de inclusão (para aviso) */
  exclusionReason?: string
  /** Quantidade de animais usada para cálculo por animal */
  animalCount: number
  /** Custo de aquisição por animal (acquisitionCost / animalCount) */
  costPerAnimal: number | null
}

interface ComputedResult {
  activityName: string
  periodStart: string
  periodEnd: string
  racao: CostLine
  sanidade: CostLine
  outrosDiretos: CostLine
  aquisicao: AcquisitionCostLine | null
  energia: CostLine
  maoDeObra: CostLine
  outrosAtividade: CostLine
  rateioTotal: number
  rateioProporcional: number
  activeActivitiesCount: number
  capex: CostLine
  diretosTotal: number
  atividadeTotal: number
  totalOpex: number
  totalComAquisicao: number
  isEgg: boolean
  isAnimal: boolean
  produced: number | null
  losses: number
  sellable: number
  hasWeights: boolean
  sellableWeightKg: number
  costPerKg: number | null
  costPerUnit: number | null
}

// ---------------------------------------------------------------------------
// Componente: linha de custo com "Ver origem"
// ---------------------------------------------------------------------------

function CostRow({
  icon,
  label,
  value,
  sources,
  dimmed = false,
  emptyHint = 'sem registros',
}: {
  icon: ReactNode
  label: string
  value: number
  sources?: SourceRow[]
  dimmed?: boolean
  emptyHint?: string
}) {
  const [open, setOpen] = useState(false)
  const hasSources = !!sources && sources.length > 0
  return (
    <div className={cn('rounded-2xl border border-border bg-white', dimmed && 'opacity-50')}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between p-3 text-xs gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground shrink-0">{icon}</span>
            <span className="font-medium text-foreground truncate">{label}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('font-bold', dimmed ? 'text-muted-foreground' : 'text-rose-700')}>
              {fmtBRL(value)}
            </span>
            {hasSources ? (
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver origem
                </button>
              </CollapsibleTrigger>
            ) : (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {value === 0 ? emptyHint : ''}
              </span>
            )}
          </div>
        </div>
        {hasSources && (
          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-1">
              {sources!.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[11px] rounded-lg bg-secondary/40 px-2 py-1.5 gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{s.title}</span>
                    {s.detail && <span className="text-muted-foreground"> {s.detail}</span>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-muted-foreground">{s.date}</span>
                    {s.value !== undefined && (
                      <span className="ml-2 font-bold text-rose-700">{fmtBRL(s.value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente: linha de custo de aquisição (com [Ver origem] estrutural)
// ---------------------------------------------------------------------------

function AcquisitionCostRow({ aquisicao }: { aquisicao: AcquisitionCostLine }) {
  const [open, setOpen] = useState(false)
  const hasSources = !!aquisicao.linkedExpense || !!aquisicao.linkedIncubation
  const dimmed = !aquisicao.included
  return (
    <div className={cn('rounded-2xl border border-border bg-white', dimmed && 'opacity-60')}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-muted-foreground shrink-0">
                <PawPrint className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <span className="font-medium text-foreground truncate block">
                  Aquisição dos animais
                </span>
                {aquisicao.linkedIncubation && (
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    Origem: Incubação própria ({aquisicao.linkedIncubation.code})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn('font-bold', dimmed ? 'text-muted-foreground' : 'text-rose-700')}>
                {fmtBRL(aquisicao.value)}
              </span>
              {hasSources ? (
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver origem
                  </button>
                </CollapsibleTrigger>
              ) : (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  sem despesa vinculada
                </span>
              )}
            </div>
          </div>

          {/* Aviso de período */}
          {dimmed && aquisicao.exclusionReason && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>
                O custo de aquisição ({fmtBRL(aquisicao.lotAcquisitionCost)}) não está neste período
                — o lote iniciou em {aquisicao.exclusionReason}. Selecione &lsquo;Ciclo do
                lote&rsquo; para incluí-lo.
              </p>
            </div>
          )}

          {/* Resumo por animal */}
          {aquisicao.costPerAnimal !== null && (
            <p className="text-[10px] text-muted-foreground">
              Custo de aquisição por animal: {fmtBRL(aquisicao.costPerAnimal)} (
              {aquisicao.animalCount} animais)
            </p>
          )}

          {/* Detalhamento da origem */}
          {hasSources && (
            <CollapsibleContent>
              <div className="space-y-2 pt-1">
                {/* Bloco: Origem em Incubação própria */}
                {aquisicao.linkedIncubation && (
                  <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 px-2.5 py-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase text-emerald-800">
                        Origem: Incubação própria ({aquisicao.linkedIncubation.code})
                      </p>
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] text-emerald-800 hover:text-emerald-950 p-0"
                      >
                        <Link to="/chocadeira">Ver incubação</Link>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="text-muted-foreground">
                        {aquisicao.linkedIncubation.incubatorName || 'Chocadeira'} •{' '}
                        {aquisicao.linkedIncubation.breed || 'Galinha caipira'}
                      </span>
                      <span className="font-bold text-emerald-700 shrink-0">
                        {fmtBRL(
                          aquisicao.linkedIncubation.totalCost || aquisicao.lotAcquisitionCost,
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bloco: Custo do lote */}
                <div className="rounded-lg bg-rose-50/60 border border-rose-100 px-2 py-1.5">
                  <p className="text-[10px] font-semibold uppercase text-rose-700">Custo do lote</p>
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="truncate">Aquisição dos animais</span>
                    <span className="font-bold text-rose-700 shrink-0">
                      {fmtBRL(aquisicao.lotAcquisitionCost)}
                    </span>
                  </div>
                </div>

                {/* Bloco: Origem financeira */}
                {aquisicao.linkedExpense && (
                  <div className="rounded-lg bg-blue-50/60 border border-blue-100 px-2 py-1.5">
                    <p className="text-[10px] font-semibold uppercase text-blue-700">
                      Origem financeira
                    </p>
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <div className="min-w-0">
                        <span className="font-medium truncate block">
                          {aquisicao.linkedExpense.description || 'Despesa vinculada'}
                        </span>
                        {aquisicao.linkedExpense.category && (
                          <span className="text-muted-foreground">
                            {aquisicao.linkedExpense.category}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-muted-foreground mr-2">
                          {new Date(aquisicao.linkedExpense.date + 'T00:00:00').toLocaleDateString(
                            'pt-BR',
                          )}
                        </span>
                        <span className="font-bold text-blue-700">
                          {fmtBRL(aquisicao.linkedExpense.value)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Já incluída — não somada novamente.
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          )}
        </div>
      </Collapsible>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente: banner de dados insuficientes
// ---------------------------------------------------------------------------

function InsufficientBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold">Dados insuficientes para calcular.</p>
        <p className="text-amber-700">{message}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function CustosPrecificacao() {
  const {
    activities,
    lots,
    expenses,
    feedLogs,
    energyLogs,
    sales,
    eggs,
    mortality,
    weighings,
    structures,
    incubations,
  } = useFarmStore()

  // Estado local (filtros)
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [selectedLotId, setSelectedLotId] = useState('')
  const [product, setProduct] = useState('')
  const [unit, setUnit] = useState('')
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('Mês atual')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [marginPercent, setMarginPercent] = useState(30)
  const [simulatedPrice, setSimulatedPrice] = useState('')
  const [scenarioMargins, setScenarioMargins] = useState<number[]>([20, 30, 40])
  const [hasCalculated, setHasCalculated] = useState(false)
  const [includeRateio, setIncludeRateio] = useState(false)

  const activeActivities = useMemo(() => activities.filter((a) => a.isActive), [activities])

  const activityLots = useMemo(
    () => lots.filter((l) => l.activityId === selectedActivityId),
    [lots, selectedActivityId],
  )

  // Cálculo principal
  const computed = useMemo<ComputedResult | null>(() => {
    if (!selectedActivityId) return null
    const activity = activities.find((a) => a.id === selectedActivityId)
    if (!activity) return null
    const activityName = activity.name

    const lotForCycle = selectedLotId ? lots.find((l) => l.id === selectedLotId) : activityLots[0]
    const { start, end } = getPeriodDates(
      periodPreset,
      customStart,
      customEnd,
      lotForCycle?.startDate,
    )
    const inPeriod = (d: string) => isInPeriod(d, start, end)

    const isCapex = (e: Expense) => e.source_type === 'STRUCTURE'
    const lotIds = activityLots.map((l) => l.id)
    const lotMatch = (lotId?: string) =>
      selectedLotId ? lotId === selectedLotId : !!lotId && lotIds.includes(lotId)

    // --- Sub-bloco A: CUSTOS DIRETOS ---
    // Ração: feedLogs (não compras) no período e do lote/atividade
    const racaoLogs = feedLogs.filter(
      (f) =>
        (f as any).recordType !== 'purchase' &&
        inPeriod(f.date) &&
        (selectedLotId
          ? f.lotId === selectedLotId
          : lotIds.includes(f.lotId || '') || f.activityId === selectedActivityId),
    )
    const racaoValue = racaoLogs.reduce((a, f) => a + (f.totalCost || 0), 0)

    // Sanidade
    const sanidadeCats = ['medicamento', 'vacina', 'sanidade']
    const sanidadeExp = expenses.filter(
      (e) =>
        !isCapex(e) &&
        inPeriod(e.date) &&
        lotMatch(e.lotId) &&
        sanidadeCats.some((c) => (e.category || '').toLowerCase().includes(c)),
    )
    const sanidadeValue = sanidadeExp.reduce((a, e) => a + e.totalValue, 0)

    // Outros diretos
    const racaoCats = ['ração', 'racao']
    const outrosDiretosExp = expenses.filter(
      (e) =>
        !isCapex(e) &&
        inPeriod(e.date) &&
        lotMatch(e.lotId) &&
        e.aplicacao === 'lote' &&
        !sanidadeCats.some((c) => (e.category || '').toLowerCase().includes(c)) &&
        !racaoCats.some((c) => (e.category || '').toLowerCase().includes(c)),
    )
    const outrosDiretosValue = outrosDiretosExp.reduce((a, e) => a + e.totalValue, 0)

    // --- Aquisição dos animais (linha própria, sem rateio mensal) ---
    // Previne dupla contagem via relacionamento estrutural: se existir uma
    // despesa financeira (farm_expenses) com source_type=LOT_ACQUISITION e
    // source_id = id do lote, ela representa o MESMO custo já lançado.
    const isLotAcquisition = (e: Expense) =>
      (e.source_type || '').toUpperCase() === 'LOT_ACQUISITION'

    // Lotes considerados para aquisição (lote selecionado ou todos os da atividade)
    const acquisitionLots = selectedLotId
      ? lots.filter((l) => l.id === selectedLotId)
      : activityLots

    let aquisicaoLotCostSum = 0
    let aquisicaoAnimalCount = 0
    const aquisicaoLinkedExpenses: Array<{
      id: string
      value: number
      date: string
      description?: string
      category?: string
      lotId?: string
    }> = []

    // Mapa de despesas LOT_ACQUISITION por lotId (quando houver)
    const lotAcquisitionExpenses = expenses.filter((e) => isLotAcquisition(e))

    // Localizar se há incubação vinculada ao lote selecionado ou ao primeiro lote
    let linkedIncubationData: AcquisitionCostLine['linkedIncubation'] = undefined

    for (const lot of acquisitionLots) {
      const lotAcq = Number(lot.acquisitionCost) || 0
      aquisicaoLotCostSum += lotAcq
      aquisicaoAnimalCount += Number(lot.initialQuantity) || 0
      // Despesas vinculadas a este lote específico (source_id === lot.id)
      const linked = lotAcquisitionExpenses.filter((e) => (e.source_id || '') === lot.id)
      for (const e of linked) {
        aquisicaoLinkedExpenses.push({
          id: e.id,
          value: e.totalValue,
          date: e.date,
          description: e.description,
          category: e.category,
          lotId: e.lotId,
        })
      }

      if (lot.incubationId && !linkedIncubationData) {
        const foundInc = incubations.find((i) => i.id === lot.incubationId)
        if (foundInc) {
          const incTot =
            (foundInc.eggCost || 0) +
            (foundInc.energyCost || 0) +
            (foundInc.suppliesCost || 0) +
            (foundInc.laborCost || 0) +
            (foundInc.otherCosts || 0)
          linkedIncubationData = {
            id: foundInc.id,
            code: foundInc.code,
            incubatorName: foundInc.incubatorName,
            breed: foundInc.breed,
            eggCost: foundInc.eggCost,
            energyCost: foundInc.energyCost,
            totalCost: incTot,
          }
        }
      }
    }

    // Regra de período: incluir 100% do acquisitionCost apenas em "Ciclo do lote"
    // ou em qualquer período que contenha o startDate do lote.
    const isCyclePeriod = periodPreset === 'Ciclo do lote'
    // Para "Todos os lotes" verificamos se ao menos um lote tem startDate no período
    const anyLotStartInPeriod = acquisitionLots.some((l) => l.startDate && inPeriod(l.startDate))
    const acquisitionIncluded = isCyclePeriod || anyLotStartInPeriod

    // Quando o período NÃO contém o startDate, exibimos o aviso com a data do(s) lote(s)
    const exclusionLotDates = acquisitionLots.filter((l) => l.startDate).map((l) => l.startDate)
    const exclusionReason =
      !acquisitionIncluded && exclusionLotDates.length > 0
        ? exclusionLotDates
            .map((d) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'))
            .join(', ')
        : undefined

    // Soma das despesas vinculadas (já lançadas no financeiro) — usadas para
    // o "[Ver origem]" e para garantir que NÃO somamos duas vezes.
    const aquisicaoLinkedSum = aquisicaoLinkedExpenses.reduce((a, e) => a + e.value, 0)

    // Valor exibido: o custo cadastrado no lote. Se houver despesa vinculada,
    // ela já representa o mesmo custo (não somamos novamente).
    const aquisicaoDisplayValue = aquisicaoLotCostSum
    // Valor que efetivamente entra no total do lote (respeitando o período)
    const aquisicaoContribution = acquisitionIncluded ? aquisicaoDisplayValue : 0

    const aquisicaoCostPerAnimal =
      aquisicaoAnimalCount > 0 && aquisicaoLotCostSum > 0
        ? aquisicaoLotCostSum / aquisicaoAnimalCount
        : null

    const aquisicao: AcquisitionCostLine | null =
      acquisitionLots.length > 0 && aquisicaoLotCostSum > 0
        ? {
            value: aquisicaoContribution,
            lotAcquisitionCost: aquisicaoLotCostSum,
            linkedExpense:
              aquisicaoLinkedExpenses.length > 0
                ? {
                    id: aquisicaoLinkedExpenses[0].id,
                    value: aquisicaoLinkedSum,
                    date: aquisicaoLinkedExpenses[0].date,
                    description: aquisicaoLinkedExpenses[0].description,
                    category: aquisicaoLinkedExpenses[0].category,
                  }
                : undefined,
            linkedIncubation: linkedIncubationData,
            included: acquisitionIncluded,
            exclusionReason,
            animalCount: aquisicaoAnimalCount,
            costPerAnimal: aquisicaoCostPerAnimal,
          }
        : null

    // --- Sub-bloco B: CUSTOS DA ATIVIDADE ---
    // Energia (measurementType 'Atividade')
    const energiaLogs = energyLogs.filter(
      (e: any) => inPeriod(e.date) && e.measurementType === 'Atividade',
    )
    const energiaValue = energiaLogs.reduce((a: number, e: any) => a + (e.totalCost || 0), 0)

    // Mão de obra
    const modCats = ['mão de obra', 'mao de obra', 'salário', 'salario']
    const modExp = expenses.filter(
      (e) =>
        !isCapex(e) &&
        inPeriod(e.date) &&
        e.aplicacao === 'atividade' &&
        (e.activity || '') === activityName &&
        modCats.some((c) => (e.category || '').toLowerCase().includes(c)),
    )
    const modValue = modExp.reduce((a, e) => a + e.totalValue, 0)

    // Outros da atividade (exclui mão de obra para não double-count)
    const outrosAtivExp = expenses.filter(
      (e) =>
        !isCapex(e) &&
        inPeriod(e.date) &&
        e.aplicacao === 'atividade' &&
        (e.activity || '') === activityName &&
        !modCats.some((c) => (e.category || '').toLowerCase().includes(c)),
    )
    const outrosAtivValue = outrosAtivExp.reduce((a, e) => a + e.totalValue, 0)

    // --- Sub-bloco C: CUSTOS GERAIS (RATEIO) ---
    const rateioExp = expenses.filter(
      (e) =>
        !isCapex(e) &&
        inPeriod(e.date) &&
        (e.aplicacao === 'geral' || e.aplicacao === 'propriedade'),
    )
    const rateioTotal = rateioExp.reduce((a, e) => a + e.totalValue, 0)
    const activeActivitiesCount = activeActivities.length || 1
    const rateioProporcional = rateioTotal / activeActivitiesCount

    // --- Sub-bloco D: CAPEX (separado) ---
    const capexStructures = structures.filter((s) => inPeriod(s.date))
    const capexValue = capexStructures.reduce((a, s) => a + s.totalValue, 0)

    const diretosOperacionais = racaoValue + sanidadeValue + outrosDiretosValue
    const diretosTotal = diretosOperacionais + aquisicaoContribution
    const atividadeTotal = energiaValue + modValue + outrosAtivValue
    const totalOpex =
      diretosOperacionais + atividadeTotal + (includeRateio ? rateioProporcional : 0)
    // Custo total do lote com aquisição: OPEX + aquisição (linha própria, fora do OPEX)
    const totalComAquisicao = totalOpex + aquisicaoContribution

    // --- Produção ---
    const prod = (product || '').toLowerCase()
    const unitL = (unit || '').toLowerCase()
    const isEgg =
      ['ovo', 'dúzia', 'duzia', 'bandeja'].some((k) => prod.includes(k)) ||
      ['dúzia', 'duzia', 'bandeja'].includes(unitL)
    const isAnimal =
      ['frango', 'pintinho', 'animal', 'matriz', 'leitão', 'leito', 'suíno', 'suino', 'peixe'].some(
        (k) => prod.includes(k),
      ) || ['animal', 'unidade'].includes(unitL)

    let produced: number | null = null
    let losses = 0
    if (isEgg) {
      const eggLogs = eggs.filter((e) => inPeriod(e.date) && lotMatch(e.lotId))
      produced = eggLogs.reduce((a, e) => a + (e.collected || 0), 0)
      losses = eggLogs.reduce((a, e) => a + (e.broken || 0) + (e.discarded || 0), 0)
    } else {
      const lotsForProd = selectedLotId ? lots.filter((l) => l.id === selectedLotId) : activityLots
      if (lotsForProd.length > 0) {
        produced = lotsForProd.reduce((a, l) => a + (l.initialQuantity || 0), 0)
        const mortLogs = mortality.filter((m) => inPeriod(m.date) && lotMatch(m.lotId))
        losses = mortLogs.reduce((a, m) => a + (m.quantity || 0), 0)
      } else {
        produced = null
      }
    }
    const sellable = produced !== null ? Math.max(0, produced - losses) : 0

    // Pesos para custo/kg
    const matchedWeighings = weighings.filter((w) => lotMatch(w.lotId))
    const salesWeight = sales
      .filter((s) => inPeriod(s.date) && lotMatch(s.lotId))
      .reduce((a, s) => a + (s.weightKg || 0), 0)
    let avgWeight = 0
    if (matchedWeighings.length > 0) {
      const sorted = [...matchedWeighings].sort((a, b) => (a.date < b.date ? 1 : -1))
      avgWeight = sorted[0].averageWeightKg || 0
    }
    const sellableWeightKg = salesWeight > 0 ? salesWeight : avgWeight * sellable
    const hasWeights = sellableWeightKg > 0
    const costPerKg = hasWeights ? totalOpex / sellableWeightKg : null
    const costPerUnit = sellable > 0 ? totalOpex / sellable : null

    return {
      activityName,
      periodStart: start,
      periodEnd: end,
      racao: {
        value: racaoValue,
        sources: racaoLogs.map((f) => ({
          date: f.date,
          title: f.inventoryItemName || 'Ração',
          detail: `${f.quantityKg} kg`,
          value: f.totalCost,
        })),
      },
      sanidade: {
        value: sanidadeValue,
        sources: sanidadeExp.map((e) => ({
          date: e.date,
          title: e.description,
          detail: e.category,
          value: e.totalValue,
        })),
      },
      outrosDiretos: {
        value: outrosDiretosValue,
        sources: outrosDiretosExp.map((e) => ({
          date: e.date,
          title: e.description,
          detail: e.category,
          value: e.totalValue,
        })),
      },
      energia: {
        value: energiaValue,
        sources: energiaLogs.map((e: any) => ({
          date: e.date,
          title: e.equipment,
          detail: `${e.consumptionKwh} kWh`,
          value: e.totalCost,
        })),
      },
      maoDeObra: {
        value: modValue,
        sources: modExp.map((e) => ({
          date: e.date,
          title: e.description,
          detail: e.category,
          value: e.totalValue,
        })),
      },
      outrosAtividade: {
        value: outrosAtivValue,
        sources: outrosAtivExp.map((e) => ({
          date: e.date,
          title: e.description,
          detail: e.category,
          value: e.totalValue,
        })),
      },
      rateioTotal,
      rateioProporcional,
      activeActivitiesCount,
      capex: {
        value: capexValue,
        sources: capexStructures.map((s) => ({
          date: s.date,
          title: s.description,
          detail: s.category,
          value: s.totalValue,
        })),
      },
      aquisicao,
      diretosTotal,
      atividadeTotal,
      totalOpex,
      totalComAquisicao,
      isEgg,
      isAnimal,
      produced,
      losses,
      sellable,
      hasWeights,
      sellableWeightKg,
      costPerKg,
      costPerUnit,
    }
  }, [
    selectedActivityId,
    selectedLotId,
    product,
    unit,
    periodPreset,
    customStart,
    customEnd,
    includeRateio,
    activities,
    lots,
    activityLots,
    expenses,
    feedLogs,
    energyLogs,
    structures,
    eggs,
    mortality,
    weighings,
    sales,
    activeActivities,
    incubations,
  ])

  // Resultados de precificação (Bloco 5)
  const pricing = useMemo(() => {
    if (!computed || computed.costPerUnit === null) return null
    const res = computePriceFromMargin(computed.costPerUnit, marginPercent)
    return {
      ...res,
      lucroTotal: res.profitPerUnit * computed.sellable,
      receitaPotencial: res.sellingPrice * computed.sellable,
    }
  }, [computed, marginPercent])

  // Cenários (Bloco 6)
  const scenarios = useMemo(() => {
    if (!computed || computed.costPerUnit === null) return []
    return computePricingScenarios(computed.costPerUnit, computed.sellable, scenarioMargins)
  }, [computed, scenarioMargins])

  const closestScenarioIdx = useMemo(() => {
    if (!scenarios.length) return -1
    return (
      scenarios
        .map((s, i) => ({ i, diff: Math.abs(s.margin - marginPercent) }))
        .sort((a, b) => a.diff - b.diff)[0]?.i ?? -1
    )
  }, [scenarios, marginPercent])

  // Simulador reverso (Bloco 6 - Modo B)
  const reverse = useMemo(() => {
    if (!computed || computed.costPerUnit === null) return null
    const price = Number(simulatedPrice)
    if (!Number.isFinite(price) || price <= 0) return null
    const res = computeMarginFromPrice(computed.costPerUnit, price)
    return {
      ...res,
      lucroTotal: res.profitPerUnit * computed.sellable,
      receitaTotal: price * computed.sellable,
      price,
    }
  }, [computed, simulatedPrice])

  const handleCalculate = () => {
    if (!selectedActivityId) return
    setHasCalculated(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" /> Custos e Precificação
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Análise de custos reais (OPEX), CAPEX e precificação por margem. Camada de leitura — nada
          é salvo automaticamente.
        </p>
      </div>

      {/* ============================================================= */}
      {/* BLOCO 1 — Análise (filtros) */}
      {/* ============================================================= */}
      {activeActivities.length === 0 ? (
        <Card className="rounded-3xl bg-white border-border shadow-subtle">
          <CardContent className="p-8 text-center space-y-3">
            <Target className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">
              Nenhuma atividade cadastrada.
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Para precificar, cadastre primeiro uma atividade produtiva (avicultura, piscicultura,
              etc.). As atividades organizam lotes, custos diretos e rateios.
            </p>
            <Button
              asChild
              className="rounded-xl bg-primary text-white font-semibold text-xs gap-2"
            >
              <Link to="/atividades">
                <Plus className="w-4 h-4" /> Cadastrar primeira atividade
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-5 space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Análise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Atividade */}
            <div>
              <Label className="text-xs">Atividade *</Label>
              <Select
                value={selectedActivityId}
                onValueChange={(v) => {
                  setSelectedActivityId(v)
                  setSelectedLotId('')
                }}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar atividade" />
                </SelectTrigger>
                <SelectContent>
                  {activeActivities.map((act) => (
                    <SelectItem key={act.id} value={act.id} className="text-xs">
                      {act.name} — {act.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lote (opcional) */}
            <div>
              <Label className="text-xs">Lote (opcional)</Label>
              <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Todos os lotes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">
                    Todos os lotes
                  </SelectItem>
                  {activityLots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id} className="text-xs">
                      {lot.code} - {lot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Produto */}
            <div>
              <Label className="text-xs">Produto</Label>
              <Input
                list="custos-product-suggestions"
                placeholder="Digite ou selecione o produto"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
              <datalist id="custos-product-suggestions">
                {PRODUCT_SUGGESTIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            {/* Unidade */}
            <div>
              <Label className="text-xs">Unidade</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar unidade" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u} value={u} className="text-xs">
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div>
              <Label className="text-xs">Período</Label>
              <Select
                value={periodPreset}
                onValueChange={(v) => setPeriodPreset(v as PeriodPreset)}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_PRESETS.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Datas personalizadas */}
            {periodPreset === 'Personalizado' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Início</Label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Fim</Label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleCalculate}
            disabled={!selectedActivityId}
            className="w-full h-12 text-sm font-bold rounded-2xl bg-primary text-white gap-2"
          >
            <Calculator className="w-5 h-5" /> Calcular com dados reais
          </Button>
        </Card>
      )}

      {/* ============================================================= */}
      {/* RESULTADOS */}
      {/* ============================================================= */}
      {hasCalculated && computed && (
        <>
          {/* Banner global de dados insuficientes */}
          {computed.totalOpex === 0 && computed.produced === null && (
            <InsufficientBanner message="Não há dados de custos nem de produção registrados para os filtros selecionados no período." />
          )}

          {/* ============================================================= */}
          {/* BLOCO 2 — Composição de Custos */}
          {/* ============================================================= */}
          <Card className="rounded-3xl bg-white border-border shadow-subtle p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-rose-600" /> Composição de Custos
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Período: {computed.periodStart} → {computed.periodEnd}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sub-bloco A: CUSTOS DIRETOS */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">
                  Custos diretos
                </h3>
                <CostRow
                  icon={<Wheat className="w-4 h-4" />}
                  label="Ração"
                  value={computed.racao.value}
                  sources={computed.racao.sources}
                />
                <CostRow
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Sanidade"
                  value={computed.sanidade.value}
                  sources={computed.sanidade.sources}
                />
                <CostRow
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Outros diretos"
                  value={computed.outrosDiretos.value}
                  sources={computed.outrosDiretos.sources}
                />
                {computed.aquisicao && <AcquisitionCostRow aquisicao={computed.aquisicao} />}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 text-xs">
                  <span className="font-medium text-muted-foreground">Subtotal diretos</span>
                  <span className="font-bold text-rose-700">{fmtBRL(computed.diretosTotal)}</span>
                </div>
              </div>

              {/* Sub-bloco B: CUSTOS DA ATIVIDADE */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">
                  Custos da atividade
                </h3>
                <CostRow
                  icon={<Zap className="w-4 h-4" />}
                  label="Energia"
                  value={computed.energia.value}
                  sources={computed.energia.sources}
                />
                <CostRow
                  icon={<Users className="w-4 h-4" />}
                  label="Mão de obra"
                  value={computed.maoDeObra.value}
                  sources={computed.maoDeObra.sources}
                />
                <CostRow
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Outros (atividade)"
                  value={computed.outrosAtividade.value}
                  sources={computed.outrosAtividade.sources}
                />
                <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 text-xs">
                  <span className="font-medium text-muted-foreground">Subtotal atividade</span>
                  <span className="font-bold text-rose-700">{fmtBRL(computed.atividadeTotal)}</span>
                </div>
              </div>

              {/* Sub-bloco C: CUSTOS GERAIS (RATEIO) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">
                  Custos gerais (rateio)
                </h3>
                <div
                  className={cn(
                    'rounded-2xl border border-border bg-white p-3 space-y-2',
                    !includeRateio && 'opacity-60',
                  )}
                >
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Coins className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">
                        Rateio (geral/propriedade)
                      </span>
                    </div>
                    <span
                      className={cn(
                        'font-bold',
                        includeRateio ? 'text-rose-700' : 'text-muted-foreground',
                      )}
                    >
                      {fmtBRL(computed.rateioTotal)}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={includeRateio}
                      onCheckedChange={(v) => setIncludeRateio(v === true)}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Incluir no cálculo (rateio proporcional)
                    </span>
                  </label>
                  {includeRateio && (
                    <p className="text-[10px] text-muted-foreground">
                      Rateio: {fmtBRL(computed.rateioProporcional)} dividido igualmente entre{' '}
                      {computed.activeActivitiesCount} atividade(s) ativa(s).
                    </p>
                  )}
                  {!includeRateio && (
                    <p className="text-[10px] text-muted-foreground">
                      Não incluído no custo operacional.
                    </p>
                  )}
                </div>
              </div>

              {/* Sub-bloco D: CAPEX (separado) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">
                  CAPEX (separado)
                </h3>
                <CostRow
                  icon={<Building2 className="w-4 h-4" />}
                  label="Investimentos / CAPEX do período"
                  value={computed.capex.value}
                  sources={computed.capex.sources}
                />
                <p className="text-[10px] text-muted-foreground px-1">
                  CAPEX não incluído no custo operacional.
                </p>
              </div>
            </div>
            {/* Totais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                <span className="text-xs text-muted-foreground block">
                  Custo total operacional (OPEX)
                </span>
                <p className="text-2xl font-extrabold text-rose-700">
                  {fmtBRL(computed.totalOpex)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Diretos + Atividade{includeRateio ? ' + Rateio' : ' (sem rateio)'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <span className="text-xs text-muted-foreground block">CAPEX do período</span>
                <p className="text-2xl font-extrabold text-blue-700">
                  {fmtBRL(computed.capex.value)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Separado do OPEX</p>
              </div>
              {computed.aquisicao && computed.aquisicao.value > 0 && (
                <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100">
                  <span className="text-xs text-muted-foreground block">
                    Custo total do lote (com aquisição)
                  </span>
                  <p className="text-2xl font-extrabold text-violet-700">
                    {fmtBRL(computed.totalComAquisicao)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    OPEX + Aquisição dos animais ({fmtBRL(computed.aquisicao.value)})
                  </p>
                </div>
              )}
            </div>{' '}
          </Card>

          {/* ============================================================= */}
          {/* BLOCO 3 — Produção */}
          {/* ============================================================= */}
          <Card className="rounded-3xl bg-white border-border shadow-subtle p-5 space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Produção
            </h2>
            {computed.produced === null ? (
              <InsufficientBanner message="Não há produção registrada no período para os filtros selecionados." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Egg className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs text-muted-foreground">Quantidade produzida</span>
                  </div>
                  <p className="text-xl font-extrabold text-emerald-700">
                    {computed.produced.toLocaleString('pt-BR')}{' '}
                    {computed.isEgg ? 'ovos' : 'animais'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Skull className="w-4 h-4 text-rose-700" />
                    <span className="text-xs text-muted-foreground">Perdas</span>
                  </div>
                  <p className="text-xl font-extrabold text-rose-700">
                    {computed.losses.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Scale className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Quantidade vendável</span>
                  </div>
                  <p className="text-xl font-extrabold text-primary">
                    {computed.sellable.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* ============================================================= */}
          {/* BLOCO 4 — Resultado do Custo */}
          {/* ============================================================= */}
          <Card className="rounded-3xl bg-white border-border shadow-subtle p-5 space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Resultado do Custo
            </h2>
            {computed.costPerUnit === null ? (
              <InsufficientBanner message="Dados insuficientes para calcular indicadores unitários (quantidade vendável é zero)." />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <span className="text-[11px] text-muted-foreground block">
                    Custo total operacional
                  </span>
                  <p className="text-lg font-extrabold text-rose-700">
                    {fmtBRL(computed.totalOpex)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <span className="text-[11px] text-muted-foreground block">
                    Custo por {unit || 'unidade'}
                  </span>
                  <p className="text-lg font-extrabold text-amber-700">
                    {fmtBRL(computed.costPerUnit)}
                  </p>
                </div>
                {computed.costPerKg !== null && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <span className="text-[11px] text-muted-foreground block">Custo por kg</span>
                    <p className="text-lg font-extrabold text-blue-700">
                      {fmtBRL(computed.costPerKg)}
                    </p>
                  </div>
                )}
                {computed.isAnimal && unit !== 'kg' && (
                  <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100">
                    <span className="text-[11px] text-muted-foreground block">
                      Custo operacional por animal
                    </span>
                    <p className="text-lg font-extrabold text-violet-700">
                      {fmtBRL(computed.costPerUnit)}
                    </p>
                  </div>
                )}
                {computed.aquisicao &&
                  computed.aquisicao.costPerAnimal !== null &&
                  computed.aquisicao.costPerAnimal > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                      <span className="text-[11px] text-muted-foreground block">
                        Custo de aquisição por animal
                      </span>
                      <p className="text-lg font-extrabold text-amber-700">
                        {fmtBRL(computed.aquisicao.costPerAnimal)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {fmtBRL(computed.aquisicao.lotAcquisitionCost)} ÷{' '}
                        {computed.aquisicao.animalCount} animais (separado do OPEX)
                      </p>
                    </div>
                  )}
                {computed.isEgg && unit === 'dúzia' && (
                  <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
                    <span className="text-[11px] text-muted-foreground block">Custo por dúzia</span>
                    <p className="text-lg font-extrabold text-yellow-700">
                      {fmtBRL(computed.totalOpex / (computed.sellable / 12 || 1))}
                    </p>
                  </div>
                )}
              </div>
            )}
            {computed.costPerUnit !== null && computed.costPerKg === null && unit === 'kg' && (
              <p className="text-[11px] text-amber-700">
                Não há peso final registrado para calcular custo/kg.
              </p>
            )}
          </Card>

          {/* ============================================================= */}
          {/* BLOCO 5 — Precificação */}
          {/* ============================================================= */}
          <Card className="rounded-3xl bg-white border-border shadow-subtle p-5 space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Precificação
            </h2>
            {!pricing ? (
              <InsufficientBanner message="Não há custo unitário disponível para precificar." />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div>
                    <Label className="text-xs">Margem desejada (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        value={marginPercent}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setMarginPercent(Number.isFinite(v) ? Math.min(Math.max(v, 0), 100) : 0)
                        }}
                        className="h-10 text-xs rounded-xl w-28"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                {/* Preço sugerido em destaque */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white">
                  <span className="text-xs text-white/80 block">
                    Preço sugerido com margem de {marginPercent}%
                  </span>
                  <p className="text-3xl font-extrabold mt-1">{fmtBRL(pricing.sellingPrice)}</p>
                  <p className="text-[11px] text-white/70 mt-1">
                    Custo {fmtBRL(pricing.costPerUnit)} ÷ (1 - {marginPercent}%)
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                    <span className="text-[11px] text-muted-foreground block">Preço de custo</span>
                    <p className="text-base font-extrabold text-amber-700">
                      {fmtBRL(pricing.costPerUnit)}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[11px] text-muted-foreground block">Lucro unitário</span>
                    <p className="text-base font-extrabold text-emerald-700">
                      {fmtBRL(pricing.profitPerUnit)}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[11px] text-muted-foreground block">
                      Lucro total estimado
                    </span>
                    <p className="text-base font-extrabold text-emerald-700">
                      {fmtBRL(pricing.lucroTotal)}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                    <span className="text-[11px] text-muted-foreground block">
                      Receita potencial
                    </span>
                    <p className="text-base font-extrabold text-blue-700">
                      {fmtBRL(pricing.receitaPotencial)}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-violet-50 border border-violet-100">
                    <span className="text-[11px] text-muted-foreground block">
                      Margem real (conferência)
                    </span>
                    <p className="text-base font-extrabold text-violet-700">
                      {pricing.marginReal.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* ============================================================= */}
          {/* BLOCO 6 — Cenários */}
          {/* ============================================================= */}
          <Card className="rounded-3xl bg-white border-border shadow-subtle p-5 space-y-5">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" /> Cenários
            </h2>
            {!pricing ? (
              <InsufficientBanner message="Não há custo unitário disponível para simular cenários." />
            ) : (
              <>
                {/* Cards de margem editáveis */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                    Cenários de margem
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {scenarios.map((s, i) => {
                      const isClosest = i === closestScenarioIdx
                      return (
                        <div
                          key={i}
                          className={cn(
                            'p-4 rounded-2xl border-2 transition-colors',
                            isClosest ? 'border-primary bg-primary/5' : 'border-border bg-white',
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-[11px] text-muted-foreground">
                              Margem {i + 1}
                            </Label>
                            {isClosest && (
                              <Badge className="bg-primary text-white text-[9px]">
                                mais próxima
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step="0.5"
                              value={scenarioMargins[i]}
                              onChange={(e) => {
                                const v = Number(e.target.value)
                                setScenarioMargins((prev) => {
                                  const next = [...prev]
                                  next[i] = Number.isFinite(v) ? Math.min(Math.max(v, 0), 100) : 0
                                  return next
                                })
                              }}
                              className="h-9 text-xs rounded-xl w-24"
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Preço</span>
                              <span className="font-bold text-primary">{fmtBRL(s.price)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Lucro unit.</span>
                              <span className="font-bold text-emerald-700">
                                {fmtBRL(s.profitPerUnit)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Lucro total</span>
                              <span className="font-semibold text-emerald-700">
                                {fmtBRL(s.profitTotal)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Receita</span>
                              <span className="font-semibold text-blue-700">
                                {fmtBRL(s.revenue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Simulador reverso (Modo B) */}
                <div className="pt-2 border-t border-border">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                    Simulador reverso (Modo B)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Se eu vender por...</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0,00"
                          value={simulatedPrice}
                          onChange={(e) => setSimulatedPrice(e.target.value)}
                          className="h-10 text-xs rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-2xl bg-violet-50 border border-violet-100">
                        <span className="text-[11px] text-muted-foreground block">Margem real</span>
                        <p className="text-base font-extrabold text-violet-700">
                          {reverse ? `${reverse.marginReal.toFixed(2)}%` : '—'}
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <span className="text-[11px] text-muted-foreground block">
                          Lucro unitário
                        </span>
                        <p className="text-base font-extrabold text-emerald-700">
                          {reverse ? fmtBRL(reverse.profitPerUnit) : '—'}
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <span className="text-[11px] text-muted-foreground block">Lucro total</span>
                        <p className="text-base font-extrabold text-emerald-700">
                          {reverse ? fmtBRL(reverse.lucroTotal) : '—'}
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                        <span className="text-[11px] text-muted-foreground block">
                          Receita total
                        </span>
                        <p className="text-base font-extrabold text-blue-700">
                          {reverse ? fmtBRL(reverse.receitaTotal) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
