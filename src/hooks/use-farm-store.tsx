import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSupabaseEntity } from '@/hooks/use-supabase-entity'
import { FARM_TABLES } from '@/services/farm'
import {
  Activity,
  Lot,
  Expense,
  StructureCost,
  InventoryItem,
  FeedConsumption,
  FeedPurchase,
  Weighing,
  Mortality,
  EggProduction,
  Incubation,
  IncubationStatus,
  Candling,
  Animal,
  Mating,
  Sale,
  Asset,
  FarmAlert,
  StockMovement,
  EnergyMeasurement,
  Customer,
  Supplier,
  PeriodFilter,
} from '@/types/farm'

function useFarmStoreImpl(orgId: string | undefined) {
  const activities = useSupabaseEntity<Activity>(FARM_TABLES.activities, orgId, 'activities')
  const lots = useSupabaseEntity<Lot>(FARM_TABLES.lots, orgId, 'lots')
  const structures = useSupabaseEntity<StructureCost>(FARM_TABLES.structures, orgId, 'structures')
  const expenses = useSupabaseEntity<Expense>(FARM_TABLES.expenses, orgId, 'expenses')
  const inventory = useSupabaseEntity<InventoryItem>(FARM_TABLES.inventory, orgId, 'inventory')
  const feedLogs = useSupabaseEntity<FeedConsumption>(FARM_TABLES.feedLogs, orgId, 'feed')
  const feedPurchases = useSupabaseEntity<FeedPurchase>(
    FARM_TABLES.feedLogs,
    orgId,
    'feedPurchases',
  )
  const weighings = useSupabaseEntity<Weighing>(FARM_TABLES.weighings, orgId, 'weighings')
  const mortality = useSupabaseEntity<Mortality>(FARM_TABLES.mortality, orgId, 'mortality')
  const eggs = useSupabaseEntity<EggProduction>(FARM_TABLES.eggs, orgId, 'eggs')
  const incubations = useSupabaseEntity<Incubation>(FARM_TABLES.incubations, orgId, 'incubations')
  const candlings = useSupabaseEntity<Candling>(FARM_TABLES.candlings, orgId, 'candlings')
  const energyLogs = useSupabaseEntity<any>(FARM_TABLES.energyLogs, orgId, 'energy')
  const animals = useSupabaseEntity<Animal>(FARM_TABLES.animals, orgId, 'animals')
  const matings = useSupabaseEntity<Mating>(FARM_TABLES.matings, orgId, 'matings')
  const sales = useSupabaseEntity<Sale>(FARM_TABLES.sales, orgId, 'sales')
  const customers = useSupabaseEntity<any>(FARM_TABLES.customers, orgId, 'customers')
  const suppliers = useSupabaseEntity<any>(FARM_TABLES.suppliers, orgId, 'suppliers')
  const assets = useSupabaseEntity<Asset>(FARM_TABLES.assets, orgId, 'assets')
  const alerts = useSupabaseEntity<FarmAlert>(FARM_TABLES.alerts, orgId, 'alerts')
  const stockMovements = useSupabaseEntity<StockMovement>(
    FARM_TABLES.stockMovements,
    orgId,
    'stockMovements',
  )

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('Todos')
  const [selectedLotId, setSelectedLotId] = useState('todos')

  const addLot = useCallback(
    async (lot: Omit<Lot, 'id' | 'code' | 'currentQuantity'>) => {
      return lots.add({
        ...lot,
        id: `l-${Date.now()}`,
        code: `L-${String(lots.items.length + 1).padStart(4, '0')}`,
        currentQuantity: lot.initialQuantity,
      })
    },
    [lots],
  )

  const addExpense = useCallback(
    async (exp: Omit<Expense, 'id' | 'totalValue'>) => {
      return expenses.add({
        ...exp,
        id: `ex-${Date.now()}`,
        totalValue: Number((exp.quantity * exp.unitValue).toFixed(2)),
        source_type: exp.source_type || 'MANUAL',
      })
    },
    [expenses],
  )

  const addStructure = useCallback(
    async (st: Omit<StructureCost, 'id' | 'totalValue'> & { id?: string }) => {
      // Preserve the caller-provided id so the linked financial transaction
      // (source_type=STRUCTURE, source_id=<id>) points to the exact structure.
      const id = st.id || `st-${Date.now()}`
      const { error } = await structures.add({
        ...st,
        id,
        totalValue: Number((st.quantity * st.unitValue).toFixed(2)),
      } as any)
      return { error, id }
    },
    [structures],
  )

  const addFeedConsumption = useCallback(
    async (feed: Omit<FeedConsumption, 'id' | 'totalCost'>) => {
      const totalCost = Number((feed.quantityKg * feed.costPerKg).toFixed(2))
      const { error } = await feedLogs.add({ ...feed, id: `fc-${Date.now()}`, totalCost })
      if (error) return { error }
      if (feed.inventoryItemId) {
        const item = inventory.items.find((i) => i.id === feed.inventoryItemId)
        if (item) {
          await inventory.update(feed.inventoryItemId, {
            currentStock: Math.max(0, item.currentStock - feed.quantityKg),
            lastUpdated: new Date().toISOString().split('T')[0],
          })
        }
      }
      return { error: null }
    },
    [feedLogs, inventory],
  )

  // Compra/Entrada de ração: registra compra, atualiza estoque (+=), custo médio, e opcionalmente gera despesa CAPEX/OPEX
  const addFeedPurchase = useCallback(
    async (
      purchase: Omit<FeedPurchase, 'id' | 'totalQuantity' | 'totalValue'> & {
        generateExpense?: boolean
      },
    ) => {
      const totalQuantity = Number(
        ((purchase.packages || 0) * (purchase.weightPerPackage || 0)).toFixed(2),
      )
      const totalValue = Number(
        ((purchase.packages || 0) * (purchase.pricePerPackage || 0)).toFixed(2),
      )
      const purchaseId = `fp-${Date.now()}`
      const record: FeedPurchase = {
        ...purchase,
        id: purchaseId,
        totalQuantity,
        totalValue,
        source_type: 'INVENTORY_PURCHASE',
      }
      const { error } = await feedPurchases.add(record)
      if (error) return { error }

      // Update inventory: stock += totalQuantity, recalc average cost
      const item = inventory.items.find((i) => i.id === purchase.inventoryItemId)
      if (item) {
        const oldStock = item.currentStock || 0
        const oldAvg = item.averageCost || 0
        const newStock = oldStock + totalQuantity
        // weighted average cost
        const newAvg =
          newStock > 0 ? Number(((oldStock * oldAvg + totalValue) / newStock).toFixed(2)) : oldAvg
        await inventory.update(purchase.inventoryItemId, {
          currentStock: newStock,
          averageCost: newAvg,
          lastUpdated: new Date().toISOString().split('T')[0],
        })
      }

      // Optionally generate expense in financeiro
      if (purchase.generateExpense) {
        await expenses.add({
          id: `ex-${Date.now()}`,
          date: purchase.date,
          category: 'Ração',
          description: `Compra de ${purchase.inventoryItemName || 'ração'} (${purchase.packages}x ${purchase.weightPerPackage}kg)`,
          quantity: purchase.packages,
          unitValue: purchase.pricePerPackage,
          totalValue: totalValue,
          supplier: purchase.supplier || 'Fornecedor',
          paymentMethod: purchase.paymentMethod || 'Pix',
          isPaid: true,
          source_type: 'INVENTORY_PURCHASE',
          source_id: purchaseId,
        } as any)
      }
      return { error: null }
    },
    [feedPurchases, inventory, expenses],
  )

  const updateFeedPurchase = useCallback(
    async (id: string, updates: Partial<FeedPurchase>) => {
      return feedPurchases.update(id, updates)
    },
    [feedPurchases],
  )

  const deleteFeedPurchase = useCallback(
    async (id: string) => {
      const p = feedPurchases.items.find((item) => item.id === id)
      const { error } = await feedPurchases.remove(id)
      if (error) return { error }
      // Reverse stock and average cost impact is complex; just remove stock addition
      if (p) {
        const item = inventory.items.find((i) => i.id === p.inventoryItemId)
        if (item) {
          await inventory.update(p.inventoryItemId, {
            currentStock: Math.max(0, item.currentStock - p.totalQuantity),
            lastUpdated: new Date().toISOString().split('T')[0],
          })
        }
        // remove linked expense
        const linked = expenses.items.find(
          (e) => e.source_type === 'INVENTORY_PURCHASE' && e.source_id === id,
        )
        if (linked) await expenses.remove(linked.id)
      }
      return { error: null }
    },
    [feedPurchases, inventory, expenses],
  )

  const addWeighing = useCallback(
    async (w: Omit<Weighing, 'id' | 'averageWeightKg'>) => {
      return weighings.add({
        ...w,
        id: `w-${Date.now()}`,
        averageWeightKg: Number((w.totalWeightKg / w.weighedCount).toFixed(2)),
      })
    },
    [weighings],
  )

  const addMortality = useCallback(
    async (m: Omit<Mortality, 'id'>) => {
      const { error } = await mortality.add({ ...m, id: `m-${Date.now()}` })
      if (error) return { error }
      const lot = lots.items.find((l) => l.id === m.lotId)
      if (lot) {
        await lots.update(m.lotId, {
          currentQuantity: Math.max(0, lot.currentQuantity - m.quantity),
        })
      }
      return { error: null }
    },
    [mortality, lots],
  )

  const addEggProduction = useCallback(
    async (egg: Omit<EggProduction, 'id'>) => {
      return eggs.add({ ...egg, id: `egg-${Date.now()}` })
    },
    [eggs],
  )

  const addSale = useCallback(
    async (sale: Omit<Sale, 'id' | 'totalPrice'>) => {
      return sales.add({
        ...sale,
        id: `sal-${Date.now()}`,
        totalPrice: Number((sale.quantity * sale.unitPrice).toFixed(2)),
        source_type: sale.source_type || 'SALE',
      })
    },
    [sales],
  )

  const addIncubation = useCallback(
    async (inc: Omit<Incubation, 'id' | 'code' | 'status'>) => {
      return incubations.add({
        ...inc,
        id: `inc-${Date.now()}`,
        code: `I-${String(incubations.items.length + 1).padStart(4, '0')}`,
        status: 'Em andamento',
      })
    },
    [incubations],
  )

  const updateIncubation = useCallback(
    async (id: string, updates: Partial<Incubation>) => {
      return incubations.update(id, updates)
    },
    [incubations],
  )

  const deleteIncubation = useCallback(
    async (id: string) => {
      const { error } = await incubations.remove(id)
      if (error) return { error }
      const related = candlings.items.filter((c) => c.incubationId === id)
      for (const c of related) {
        await candlings.remove(c.id)
      }
      return { error: null }
    },
    [incubations, candlings],
  )

  const finalizeIncubation = useCallback(
    async (
      id: string,
      results: Pick<Incubation, 'hatchedCount' | 'unhatchedCount' | 'healthyChicks' | 'deaths'>,
    ) => {
      return incubations.update(id, { ...results, status: 'Concluído' as IncubationStatus })
    },
    [incubations],
  )

  const addCandling = useCallback(
    async (candling: Omit<Candling, 'id'>) => {
      return candlings.add({ ...candling, id: `cnd-${Date.now()}` })
    },
    [candlings],
  )

  const addInventoryItem = useCallback(
    async (item: Omit<InventoryItem, 'id' | 'lastUpdated'> & { id?: string }) => {
      return inventory.add({
        ...item,
        id: item.id || `inv-${Date.now()}`,
        lastUpdated: new Date().toISOString().split('T')[0],
      })
    },
    [inventory],
  )

  const updateInventory = useCallback(
    async (id: string, updates: Partial<InventoryItem>) => {
      return inventory.update(id, updates)
    },
    [inventory],
  )

  const markAlertAsRead = useCallback(
    async (id: string) => {
      return alerts.update(id, { isRead: true })
    },
    [alerts],
  )

  const addAsset = useCallback(
    async (asset: Asset) => {
      return assets.add(asset)
    },
    [assets],
  )

  const addStockMovement = useCallback(
    async (m: Omit<StockMovement, 'id'>) => {
      return stockMovements.add({ ...m, id: `sm-${Date.now()}` })
    },
    [stockMovements],
  )

  const updateStockMovement = useCallback(
    async (id: string, updates: Partial<StockMovement>) => {
      return stockMovements.update(id, updates)
    },
    [stockMovements],
  )

  const deleteStockMovement = useCallback(
    async (id: string) => {
      const m = stockMovements.items.find((item) => item.id === id)
      const { error } = await stockMovements.remove(id)
      if (error) return { error }
      // Recalculate stock: reverse the movement's effect
      if (m && m.inventoryItemId) {
        const item = inventory.items.find((i) => i.id === m.inventoryItemId)
        if (item) {
          const adjust = m.type === 'entrada' ? -m.quantity : m.quantity
          await inventory.update(m.inventoryItemId, {
            currentStock: Math.max(0, item.currentStock + adjust),
            lastUpdated: new Date().toISOString().split('T')[0],
          })
        }
      }
      return { error: null }
    },
    [stockMovements, inventory],
  )

  const addEnergyLog = useCallback(
    async (e: Omit<EnergyMeasurement, 'id'>) => {
      return energyLogs.add({ ...e, id: `en-${Date.now()}` })
    },
    [energyLogs],
  )

  const addAnimal = useCallback(
    async (a: Omit<Animal, 'id'>) => {
      return animals.add({ ...a, id: `an-${Date.now()}` })
    },
    [animals],
  )

  const addMating = useCallback(
    async (m: Omit<Mating, 'id'>) => {
      return matings.add({ ...m, id: `mt-${Date.now()}` })
    },
    [matings],
  )

  const addCustomer = useCallback(
    async (c: Omit<Customer, 'id'>) => {
      return customers.add({ ...c, id: `cus-${Date.now()}` })
    },
    [customers],
  )

  const addSupplier = useCallback(
    async (s: Omit<Supplier, 'id'>) => {
      return suppliers.add({ ...s, id: `sup-${Date.now()}` })
    },
    [suppliers],
  )

  const deleteMortality = useCallback(
    async (id: string) => {
      const m = mortality.items.find((item) => item.id === id)
      const { error } = await mortality.remove(id)
      if (error) return { error }
      if (m) {
        const lot = lots.items.find((l) => l.id === m.lotId)
        if (lot) await lots.update(m.lotId, { currentQuantity: lot.currentQuantity + m.quantity })
      }
      return { error: null }
    },
    [mortality, lots],
  )

  const updateMortalityRecord = useCallback(
    async (id: string, updates: Partial<Mortality>) => {
      const old = mortality.items.find((m) => m.id === id)
      const { error } = await mortality.update(id, updates)
      if (error) return { error }
      if (old && updates.quantity !== undefined && updates.quantity !== old.quantity) {
        const lot = lots.items.find((l) => l.id === old.lotId)
        if (lot) {
          const diff = old.quantity - updates.quantity
          await lots.update(old.lotId, { currentQuantity: Math.max(0, lot.currentQuantity + diff) })
        }
      }
      return { error: null }
    },
    [mortality, lots],
  )

  const deleteFeedConsumption = useCallback(
    async (id: string) => {
      const f = feedLogs.items.find((item) => item.id === id)
      const { error } = await feedLogs.remove(id)
      if (error) return { error }
      // Only restock if it was a consumption record (not a purchase)
      if (f && f.inventoryItemId && (f as any).recordType !== 'purchase') {
        const item = inventory.items.find((i) => i.id === f.inventoryItemId)
        if (item)
          await inventory.update(f.inventoryItemId, {
            currentStock: item.currentStock + f.quantityKg,
          })
      }
      return { error: null }
    },
    [feedLogs, inventory],
  )

  const updateFeedRecord = useCallback(
    async (id: string, updates: Partial<FeedConsumption>) => {
      const old = feedLogs.items.find((f) => f.id === id)
      const { error } = await feedLogs.update(id, updates)
      if (error) return { error }
      if (
        old &&
        updates.quantityKg !== undefined &&
        updates.quantityKg !== old.quantityKg &&
        old.inventoryItemId
      ) {
        const item = inventory.items.find((i) => i.id === old.inventoryItemId)
        if (item) {
          const diff = old.quantityKg - updates.quantityKg
          await inventory.update(old.inventoryItemId, {
            currentStock: Math.max(0, item.currentStock + diff),
          })
        }
      }
      return { error: null }
    },
    [feedLogs, inventory],
  )

  return {
    activities: activities.items,
    setActivities: activities.setItems,
    lots: lots.items,
    setLots: lots.setItems,
    addLot,
    updateLot: lots.update,
    deleteLot: lots.remove,
    structures: structures.items,
    setStructures: structures.setItems,
    addStructure,
    updateStructure: structures.update,
    deleteStructure: structures.remove,
    expenses: expenses.items,
    setExpenses: expenses.setItems,
    addExpense,
    updateExpense: expenses.update,
    deleteExpense: expenses.remove,
    inventory: inventory.items,
    setInventory: inventory.setItems,
    addInventoryItem,
    updateInventory,
    deleteInventory: inventory.remove,
    feedLogs: feedLogs.items,
    addFeedConsumption,
    updateFeedConsumption: updateFeedRecord,
    deleteFeedConsumption,
    feedPurchases: feedPurchases.items,
    addFeedPurchase,
    updateFeedPurchase,
    deleteFeedPurchase,
    weighings: weighings.items,
    addWeighing,
    updateWeighing: weighings.update,
    deleteWeighing: weighings.remove,
    mortality: mortality.items,
    addMortality,
    updateMortality: updateMortalityRecord,
    deleteMortality,
    eggs: eggs.items,
    addEggProduction,
    updateEggProduction: eggs.update,
    deleteEggProduction: eggs.remove,
    incubations: incubations.items,
    addIncubation,
    updateIncubation,
    deleteIncubation,
    finalizeIncubation,
    candlings: candlings.items,
    setCandlings: candlings.setItems,
    addCandling,
    deleteCandling: candlings.remove,
    energyLogs: energyLogs.items,
    setEnergyLogs: energyLogs.setItems,
    addEnergyLog,
    updateEnergyLog: energyLogs.update,
    deleteEnergyLog: energyLogs.remove,
    animals: animals.items,
    setAnimals: animals.setItems,
    addAnimal,
    updateAnimal: animals.update,
    deleteAnimal: animals.remove,
    matings: matings.items,
    setMatings: matings.setItems,
    addMating,
    updateMating: matings.update,
    deleteMating: matings.remove,
    sales: sales.items,
    addSale,
    updateSale: sales.update,
    deleteSale: sales.remove,
    customers: customers.items,
    setCustomers: customers.setItems,
    addCustomer,
    updateCustomer: customers.update,
    deleteCustomer: customers.remove,
    suppliers: suppliers.items,
    setSuppliers: suppliers.setItems,
    addSupplier,
    updateSupplier: suppliers.update,
    deleteSupplier: suppliers.remove,
    assets: assets.items,
    setAssets: assets.setItems,
    addAsset,
    updateAsset: assets.update,
    deleteAsset: assets.remove,
    alerts: alerts.items,
    markAlertAsRead,
    stockMovements: stockMovements.items,
    addStockMovement,
    updateStockMovement,
    deleteStockMovement,
    selectedPeriod,
    setSelectedPeriod,
    selectedLotId,
    setSelectedLotId,
  }
}

const FarmStoreContext = createContext<ReturnType<typeof useFarmStoreImpl> | undefined>(undefined)

export function FarmStoreProvider({ children }: { children: ReactNode }) {
  const { orgMember } = useAuth()
  const value = useFarmStoreImpl(orgMember?.organization_id)
  return <FarmStoreContext.Provider value={value}>{children}</FarmStoreContext.Provider>
}

export function useFarmStore() {
  const ctx = useContext(FarmStoreContext)
  if (!ctx) throw new Error('useFarmStore must be used within FarmStoreProvider')
  return ctx
}
