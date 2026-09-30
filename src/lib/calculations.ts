import {
  Lot,
  Expense,
  Sale,
  StructureCost,
  Asset,
  FeedConsumption,
  SanitaryApplication,
  Mortality,
  Slaughtering,
} from '@/types/farm'

export interface PriceFromMarginResult {
  costPerUnit: number
  sellingPrice: number
  profitPerUnit: number
  marginReal: number
}

export interface MarginFromPriceResult {
  profitPerUnit: number
  marginReal: number
}

export interface PricingScenarioItem {
  margin: number
  price: number
  profitPerUnit: number
  profitTotal: number
  revenue: number
}

const round2 = (n: number): number => Number(Math.round((n + Number.EPSILON) * 100) / 100)

/**
 * Calcula preço de venda a partir de margem desejada (markup sobre preço).
 * Fórmula: Preço = Custo / (1 - Margem/100)
 * Ex.: Custo=100, Margem=30% => Preço = 142.86
 */
export function computePriceFromMargin(
  costPerUnit: number,
  marginPercent: number,
): PriceFromMarginResult {
  const cost = Number.isFinite(costPerUnit) ? costPerUnit : 0
  const margin = Number.isFinite(marginPercent) ? Math.min(Math.max(marginPercent, 0), 100) : 0
  const denominator = 1 - margin / 100
  const sellingPrice = denominator > 0 ? cost / denominator : 0
  const profitPerUnit = sellingPrice - cost
  const marginReal = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0
  return {
    costPerUnit: round2(cost),
    sellingPrice: round2(sellingPrice),
    profitPerUnit: round2(profitPerUnit),
    marginReal: round2(marginReal),
  }
}

/**
 * Calcula a margem real a partir do preço de venda informado.
 * Fórmula: Margem = (Lucro / Preço) * 100, onde Lucro = Preço - Custo
 * Ex.: Custo=100, Preço=130 => Margem = 23.08%
 */
export function computeMarginFromPrice(
  costPerUnit: number,
  sellingPrice: number,
): MarginFromPriceResult {
  const cost = Number.isFinite(costPerUnit) ? costPerUnit : 0
  const price = Number.isFinite(sellingPrice) ? sellingPrice : 0
  const profitPerUnit = price - cost
  const marginReal = price > 0 ? (profitPerUnit / price) * 100 : 0
  return {
    profitPerUnit: round2(profitPerUnit),
    marginReal: round2(marginReal),
  }
}

/**
 * Gera cenários de precificação para uma lista de margens.
 * Retorna, para cada margem: preço, lucro unitário, lucro total e receita.
 */
export function computePricingScenarios(
  costPerUnit: number,
  quantity: number,
  margins: number[],
): PricingScenarioItem[] {
  const cost = Number.isFinite(costPerUnit) ? costPerUnit : 0
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 0
  return margins.map((m) => {
    const res = computePriceFromMargin(cost, m)
    const profitTotal = res.profitPerUnit * qty
    const revenue = res.sellingPrice * qty
    return {
      margin: round2(m),
      price: res.sellingPrice,
      profitPerUnit: res.profitPerUnit,
      profitTotal: round2(profitTotal),
      revenue: round2(revenue),
    }
  })
}

export interface LotCostSummary {
  totalCost: number
  feedCost: number
  acquisitionCost: number
  opexCost: number
  sanitaryCost: number
  costPerBirdHoused: number
  costPerBirdAlive: number
  costPerBirdSold: number
  costPerKg: number
  revenue: number
  profit: number
  margin: number
  roi: number
  totalSold: number
  totalWeightSoldKg: number
}

export function computeLotCosts(
  lot: Lot,
  expenses: Expense[],
  sales: Sale[],
  feedLogs: FeedConsumption[] = [],
  sanitaryApplications: SanitaryApplication[] = [],
): LotCostSummary {
  const lotExpenses = expenses.filter((e) => e.lotId === lot.id)
  const lotSales = sales.filter((s) => s.lotId === lot.id)
  const lotSanitary = sanitaryApplications.filter((s) => s.lot_id === lot.id)
  // Considera tanto consumo direto para o lote quanto rateios que contemplem este lote
  // Ignora registros de compras (recordType === 'purchase')
  const validFeedLogs = feedLogs.filter((f) => (f as any).recordType !== 'purchase')
  const feedCost = validFeedLogs.reduce((acc, f) => {
    if (f.allocations && Array.isArray(f.allocations) && f.allocations.length > 0) {
      const match = f.allocations.find((a) => a.lotId === lot.id)
      return acc + (match ? Number(match.cost || 0) : 0)
    }
    if (f.lotId === lot.id) {
      return acc + Number(f.totalCost || 0)
    }
    return acc
  }, 0)
  const sanitaryCost = lotSanitary.reduce((acc, s) => acc + (s.total_cost || 0), 0)
  const opexCost = lotExpenses.reduce((acc, e) => acc + (e.totalValue || 0), 0)
  const acquisitionCost = lot.acquisitionCost || 0
  const totalCost = opexCost + feedCost + acquisitionCost + sanitaryCost
  const revenue = lotSales.reduce((acc, s) => acc + s.totalPrice, 0)
  const totalSold = lotSales.reduce((acc, s) => acc + s.quantity, 0)
  const totalWeightSoldKg = lotSales.reduce((acc, s) => acc + (s.weightKg || 0), 0)

  const costPerBirdHoused = lot.initialQuantity > 0 ? totalCost / lot.initialQuantity : 0
  const costPerBirdAlive = lot.currentQuantity > 0 ? totalCost / lot.currentQuantity : 0
  const costPerBirdSold = totalSold > 0 ? totalCost / totalSold : 0
  const costPerKg = totalWeightSoldKg > 0 ? totalCost / totalWeightSoldKg : 0

  const profit = revenue - totalCost
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0

  return {
    totalCost,
    feedCost,
    acquisitionCost,
    opexCost,
    sanitaryCost,
    costPerBirdHoused,
    costPerBirdAlive,
    costPerBirdSold,
    costPerKg,
    revenue,
    profit,
    margin,
    roi,
    totalSold,
    totalWeightSoldKg,
  }
}

export interface LotAccumulatedCostResult {
  totalCost: number
  feedCost: number
  acquisitionCost: number
  opexCost: number
  sanitaryCost: number
  currentQuantity: number
  costPerBirdAlive: number
}

/**
 * Calcula o custo acumulado de um lote respeitando a metodologia do SR Gestão:
 * Custos de aquisição + Ração consumida + Despesas vinculadas ao lote + Aplicações sanitárias.
 * Retorna o custo por ave viva para que seja multiplicado pela quantidade de animais abatidos,
 * garantindo NÃO duplicar custos de produção no momento do abate.
 */
export function computeLotAccumulatedCostPerAnimal(
  lot: Lot,
  expenses: Expense[],
  feedLogs: FeedConsumption[] = [],
  sanitaryApplications: SanitaryApplication[] = [],
): LotAccumulatedCostResult {
  const lotExpenses = expenses.filter((e) => e.lotId === lot.id)
  const lotSanitary = sanitaryApplications.filter((s) => s.lot_id === lot.id)

  // Considera tanto consumo direto para o lote quanto rateios que contemplem este lote
  // Ignora registros de compras (recordType === 'purchase')
  const validFeedLogs = feedLogs.filter((f) => (f as any).recordType !== 'purchase')
  const feedCost = validFeedLogs.reduce((acc, f) => {
    if (f.allocations && Array.isArray(f.allocations) && f.allocations.length > 0) {
      const match = f.allocations.find((a) => a.lotId === lot.id)
      return acc + (match ? Number(match.cost || 0) : 0)
    }
    if (f.lotId === lot.id) {
      return acc + Number(f.totalCost || 0)
    }
    return acc
  }, 0)
  const sanitaryCost = lotSanitary.reduce((acc, s) => acc + (s.total_cost || 0), 0)
  const opexCost = lotExpenses.reduce((acc, e) => acc + (e.totalValue || 0), 0)
  const acquisitionCost = lot.acquisitionCost || 0
  const totalCost = opexCost + feedCost + acquisitionCost + sanitaryCost

  // Se o lote tiver aves vivas, divide por elas. Se não, usa a quantidade inicial como fallback seguro
  const effectiveLive =
    lot.currentQuantity !== undefined && lot.currentQuantity > 0
      ? lot.currentQuantity
      : lot.initialQuantity > 0
        ? lot.initialQuantity
        : 1
  const costPerBirdAlive = round2(totalCost / effectiveLive)

  return {
    totalCost: round2(totalCost),
    feedCost: round2(feedCost),
    acquisitionCost: round2(acquisitionCost),
    opexCost: round2(opexCost),
    sanitaryCost: round2(sanitaryCost),
    currentQuantity: lot.currentQuantity ?? effectiveLive,
    costPerBirdAlive,
  }
}

export interface LotAnimalMovementBreakdown {
  initialQuantity: number
  entries: number
  mortality: number
  slaughter: number
  otherExits: number
  liveQuantity: number
}

/**
 * Calcula a Quantidade Viva de um lote e o detalhamento de movimentações de animais:
 * Quantidade Viva = Quantidade Inicial + Entradas − Mortalidades − Abates − Outras Saídas Válidas
 * Derivada EXCLUSIVAMENTE dos eventos de quantidade de animais registrados:
 * - farm_mortality (mortalidade)
 * - farm_slaughterings (abates, respeitando soft delete)
 * - farm_sales (vendas de animais vivos vinculadas ao lote se houver)
 * NUNCA usa custo, ração, estoque, peso ou financeiro.
 */
export function computeLotAnimalMovement(
  lot: Lot,
  mortalityList: Mortality[] = [],
  slaughterList: Slaughtering[] = [],
  salesList: Sale[] = [],
): LotAnimalMovementBreakdown {
  const initialQuantity = Math.max(0, Number(lot.initialQuantity) || 0)

  // 1. Entradas adicionais (se houver, por padrão 0 a não ser eventos explícitos)
  const entries = 0

  // 2. Mortalidades vinculadas ao lote
  const lotMortality = mortalityList.filter(
    (m) =>
      (m.lotId === lot.id || (lot.code && (m as any).lotCode === lot.code)) &&
      !(m as any).deleted_at,
  )
  const totalMortality = lotMortality.reduce((acc, m) => acc + (Number(m.quantity) || 0), 0)

  // 3. Abates vinculados ao lote (respeitando soft-delete)
  const lotSlaughter = slaughterList.filter(
    (s) =>
      (s.lotId === lot.id || (lot.code && (s as any).lotCode === lot.code)) &&
      !(s as any).deleted_at,
  )
  const totalSlaughter = lotSlaughter.reduce((acc, s) => acc + (Number(s.quantityAnimals) || 0), 0)

  // 4. Outras saídas válidas (vendas de animais vivos vinculadas ao lote)
  // Atenção: abates que geram venda têm source_type === 'SLAUGHTER' — NÃO duplicar!
  // Apenas vendas manuais com produto de ave viva ("Frangos vivos", "Galinhas", "Reprodutores", "Matrizes", "Pintinhos")
  const LIVE_BIRD_PRODUCTS = [
    'frangos vivos',
    'galinhas',
    'reprodutores',
    'matrizes',
    'pintinhos',
    'aves vivas',
    'ave viva',
  ]
  const lotSales = salesList.filter((s) => {
    if (s.lotId !== lot.id) return false
    if (s.source_type === 'SLAUGHTER') return false // Já contabilizado em abates
    const prod = (s.product || '').toLowerCase().trim()
    return LIVE_BIRD_PRODUCTS.some((p) => prod.includes(p))
  })
  const otherExits = lotSales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0)

  const totalExits = totalMortality + totalSlaughter + otherExits
  const liveQuantity = Math.max(0, initialQuantity + entries - totalExits)

  return {
    initialQuantity,
    entries,
    mortality: totalMortality,
    slaughter: totalSlaughter,
    otherExits,
    liveQuantity,
  }
}

/**
 * Retorna a quantidade viva centralizada do lote.
 */
export function computeLotLiveQuantity(
  lot: Lot,
  mortalityList: Mortality[] = [],
  slaughterList: Slaughtering[] = [],
  salesList: Sale[] = [],
): number {
  return computeLotAnimalMovement(lot, mortalityList, slaughterList, salesList).liveQuantity
}

export interface FinancialSummary {
  operationalRevenue: number
  operationalExpenses: number
  operationalResult: number
  capex: number
  cashFlow: number
  accumulatedBalance: number
}

export function computeFinancialSummary(
  sales: Sale[],
  expenses: Expense[],
  structures: StructureCost[],
  assets: Asset[],
): FinancialSummary {
  const operationalRevenue = sales.reduce((acc, s) => acc + s.totalPrice, 0)
  // CAPEX/structure expenses already appear as linked rows in `expenses`
  // (source_type=STRUCTURE). Count them as CAPEX, not as operational OPEX,
  // so the same value is never counted twice.
  const isCapexExpense = (e: Expense) => e.source_type === 'STRUCTURE'
  const operationalExpenses = expenses
    .filter((e) => !isCapexExpense(e))
    .reduce((acc, e) => acc + e.totalValue, 0)
  const operationalResult = operationalRevenue - operationalExpenses

  // CAPEX = structures (source of truth) — each structure maps to exactly one
  // linked expense, so summing structures avoids double counting.
  const capex = structures.reduce((acc, st) => acc + st.totalValue, 0)

  const paidInflows = sales.filter((s) => s.isPaid).reduce((acc, s) => acc + s.totalPrice, 0)
  // OPEX excludes CAPEX-linked expenses (counted below as capex).
  const paidOpex = expenses
    .filter((e) => e.isPaid && !isCapexExpense(e))
    .reduce((acc, e) => acc + e.totalValue, 0)
  const paidCapex = structures.filter((st) => st.isPaid).reduce((acc, st) => acc + st.totalValue, 0)

  const cashFlow = paidInflows - paidOpex - paidCapex
  const accumulatedBalance = cashFlow

  return {
    operationalRevenue,
    operationalExpenses,
    operationalResult,
    capex,
    cashFlow,
    accumulatedBalance,
  }
}
