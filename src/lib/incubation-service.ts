import { Incubation, IncubationEgg, EggStatus, CandlingResult } from '@/types/farm'

/**
 * Gera o próximo código de chocada no formato SR-YYMM-XX (ex: SR-2610-01, SR-2610-02)
 */
export function generateNextIncubationCode(
  existingIncubations: Array<{ code?: string }>,
  referenceDate?: string,
): string {
  const d = referenceDate ? new Date(referenceDate) : new Date()
  const yearShort = String(d.getFullYear()).slice(-2)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const prefix = `SR-${yearShort}${month}-`

  const existingNumbers = existingIncubations
    .map((inc) => inc.code || '')
    .filter((code) => code.startsWith(prefix))
    .map((code) => {
      const suffix = code.replace(prefix, '')
      const num = parseInt(suffix, 10)
      return isNaN(num) ? 0 : num
    })

  const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
  return `${prefix}${String(nextNum).padStart(2, '0')}`
}

/**
 * Gera uma lista de ovos em lote a partir de parâmetros (ex: 5 ovos prefixo 'GSB' → GSB01..GSB05)
 */
export function generateEggsBatch(params: {
  quantity: number
  prefix: string
  startIndex?: number
  origin?: string
  breed?: string
  motherCode?: string
  fatherCode?: string
  entryDate: string
  notes?: string
}): IncubationEgg[] {
  const eggs: IncubationEgg[] = []
  const start = params.startIndex || 1
  const cleanPrefix = params.prefix.trim()

  for (let i = 0; i < params.quantity; i++) {
    const num = start + i
    const padded = String(num).padStart(2, '0')
    const code = cleanPrefix ? `${cleanPrefix}${padded}` : `OVO-${padded}`
    eggs.push({
      id: `egg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${i}`,
      code,
      origin: params.origin,
      breed: params.breed,
      motherCode: params.motherCode ? params.motherCode.trim() : undefined,
      fatherCode: params.fatherCode ? params.fatherCode.trim() : undefined,
      entryDate: params.entryDate,
      status: 'Incubado',
      notes: params.notes,
      candlingHistory: [],
    })
  }

  return eggs
}

/**
 * Indicadores estatísticos e zootécnicos automáticos calculados a partir da chocada e seus ovos
 */
export interface IncubationStats {
  receivedCount: number
  incubatedCount: number
  developingCount: number
  clearCount: number
  doubtfulCount: number
  deadEmbryoCount: number
  hatchedCount: number
  unhatchedCount: number
  brokenCount: number
  discardedCount: number
  evaluatedCount: number
  notEvaluatedCount: number
  apparentFertilityRate: number // desenvolvendo / avaliados
  hatchRateIncubated: number // nascidos / incubados
  hatchRateDeveloping: number // nascidos / desenvolvendo confirmados
  totalCost: number
  costPerIncubatedEgg: number
  costPerHatchedChick: number
}

export function computeIncubationStats(
  incubation: Partial<Incubation>,
  candlingsHistory: Array<{
    fertile?: number
    infertile?: number
    developing?: number
    deadEmbryo?: number
  }> = [],
): IncubationStats {
  const eggs = incubation.eggs || []
  const hasIndividualEggs = eggs.length > 0

  const incubatedCount =
    incubation.incubatedCount !== undefined
      ? incubation.incubatedCount
      : hasIndividualEggs
        ? eggs.length
        : Number(incubation.eggCount || 0)

  const receivedCount =
    incubation.eggsReceivedCount !== undefined ? incubation.eggsReceivedCount : incubatedCount

  let developingCount = 0
  let clearCount = 0
  let doubtfulCount = 0
  let deadEmbryoCount = 0
  let hatchedCount = 0
  let unhatchedCount = 0
  let brokenCount = 0
  let discardedCount = 0
  let notEvaluatedCount = 0

  if (hasIndividualEggs) {
    for (const egg of eggs) {
      switch (egg.status) {
        case 'Desenvolvendo':
          developingCount++
          break
        case 'Claro/sem desenvolvimento':
          clearCount++
          break
        case 'Duvidoso':
          doubtfulCount++
          break
        case 'Embrião interrompido':
          deadEmbryoCount++
          break
        case 'Eclodiu':
          hatchedCount++
          developingCount++ // quem eclodiu desenvolveu
          break
        case 'Não eclodiu':
          unhatchedCount++
          deadEmbryoCount++ // embrião não eclodiu
          break
        case 'Quebrado':
          brokenCount++
          break
        case 'Descartado':
          discardedCount++
          break
        case 'Incubado':
        default:
          notEvaluatedCount++
          break
      }
    }
  } else {
    // Modo compatibilidade com dados legados agregados
    hatchedCount = Number(incubation.hatchedCount || 0)
    unhatchedCount = Number(incubation.unhatchedCount || 0)

    // Pegar última ovoscopia legada se existir
    if (candlingsHistory.length > 0) {
      const last = candlingsHistory[candlingsHistory.length - 1]
      developingCount = Number(last.developing || last.fertile || 0)
      clearCount = Number(last.infertile || 0)
      deadEmbryoCount = Number(last.deadEmbryo || 0)
      discardedCount = Number((last as any).discarded || 0)
      const evaluatedSum = developingCount + clearCount + deadEmbryoCount + discardedCount
      notEvaluatedCount = Math.max(0, incubatedCount - evaluatedSum)
    } else {
      developingCount = hatchedCount
      notEvaluatedCount = Math.max(0, incubatedCount - hatchedCount - unhatchedCount)
    }
  }

  // Avaliados = ovos que já passaram por avaliação (exclui quem ainda está apenas "Incubado" ou "Quebrado" antes de avaliar)
  const evaluatedCount = developingCount + clearCount + doubtfulCount + deadEmbryoCount
  // Taxa aparente de fertilidade/desenvolvimento = desenvolvendo / avaliados
  const apparentFertilityRate = evaluatedCount > 0 ? (developingCount / evaluatedCount) * 100 : 0
  // Taxa de eclosão sobre incubados = nascidos / incubados
  const hatchRateIncubated = incubatedCount > 0 ? (hatchedCount / incubatedCount) * 100 : 0
  // Taxa de eclosão sobre desenvolvidos = nascidos / confirmados desenvolvendo
  const hatchRateDeveloping = developingCount > 0 ? (hatchedCount / developingCount) * 100 : 0

  // Custos totais
  const eggCost = Number(incubation.eggCost || 0)
  const freightCost = Number(incubation.freightCost || 0)
  const acquisitionCosts = Number(incubation.otherAcquisitionCosts || 0)
  const energyCost = Number(incubation.energyCost || 0)
  const suppliesCost = Number(incubation.suppliesCost || 0)
  const laborCost = Number(incubation.laborCost || 0)
  const otherCosts = Number(incubation.otherCosts || 0)

  const totalCost =
    eggCost + freightCost + acquisitionCosts + energyCost + suppliesCost + laborCost + otherCosts

  const costPerIncubatedEgg = incubatedCount > 0 ? totalCost / incubatedCount : 0
  const costPerHatchedChick = hatchedCount > 0 ? totalCost / hatchedCount : 0

  return {
    receivedCount,
    incubatedCount,
    developingCount,
    clearCount,
    doubtfulCount,
    deadEmbryoCount,
    hatchedCount,
    unhatchedCount,
    brokenCount,
    discardedCount,
    evaluatedCount,
    notEvaluatedCount,
    apparentFertilityRate,
    hatchRateIncubated,
    hatchRateDeveloping,
    totalCost,
    costPerIncubatedEgg,
    costPerHatchedChick,
  }
}

/**
 * Mapeia resultado de ovoscopia para status do ovo
 */
export function mapCandlingResultToEggStatus(result: CandlingResult): EggStatus {
  switch (result) {
    case 'Desenvolvendo':
      return 'Desenvolvendo'
    case 'Claro/sem desenvolvimento':
      return 'Claro/sem desenvolvimento'
    case 'Duvidoso':
      return 'Duvidoso'
    case 'Desenvolvimento interrompido':
      return 'Embrião interrompido'
    default:
      return 'Desenvolvendo'
  }
}
