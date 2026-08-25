import {
  Lot,
  Expense,
  Sale,
  StructureCost,
  Asset,
  FeedConsumption,
  SanitaryApplication,
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
  const lotFeedLogs = feedLogs.filter((f) => f.lotId === lot.id)
  const lotSanitary = sanitaryApplications.filter((s) => s.lot_id === lot.id)

  const feedCost = lotFeedLogs.reduce((acc, f) => acc + (f.totalCost || 0), 0)
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
