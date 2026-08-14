import { Lot, Expense, Sale, StructureCost, Asset } from '@/types/farm'

export interface LotCostSummary {
  totalCost: number
  costPerBirdHoused: number
  costPerBirdSold: number
  costPerKg: number
  revenue: number
  profit: number
  margin: number
  roi: number
  totalSold: number
  totalWeightSoldKg: number
}

export function computeLotCosts(lot: Lot, expenses: Expense[], sales: Sale[]): LotCostSummary {
  const lotExpenses = expenses.filter((e) => e.lotId === lot.id)
  const lotSales = sales.filter((s) => s.lotId === lot.id)

  const opex = lotExpenses.reduce((acc, e) => acc + e.totalValue, 0)
  const totalCost = opex + lot.acquisitionCost
  const revenue = lotSales.reduce((acc, s) => acc + s.totalPrice, 0)
  const totalSold = lotSales.reduce((acc, s) => acc + s.quantity, 0)
  const totalWeightSoldKg = lotSales.reduce((acc, s) => acc + (s.weightKg || 0), 0)

  const costPerBirdHoused = lot.initialQuantity > 0 ? totalCost / lot.initialQuantity : 0
  const costPerBirdSold = totalSold > 0 ? totalCost / totalSold : 0
  const costPerKg = totalWeightSoldKg > 0 ? totalCost / totalWeightSoldKg : 0

  const profit = revenue - totalCost
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0

  return {
    totalCost,
    costPerBirdHoused,
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
