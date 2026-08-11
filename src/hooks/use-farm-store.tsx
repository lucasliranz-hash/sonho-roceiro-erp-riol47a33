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
      })
    },
    [expenses],
  )

  const addStructure = useCallback(
    async (st: Omit<StructureCost, 'id' | 'totalValue'>) => {
      return structures.add({
        ...st,
        id: `st-${Date.now()}`,
        totalValue: Number((st.quantity * st.unitValue).toFixed(2)),
      })
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

  return {
    activities: activities.items,
    setActivities: activities.setItems,
    lots: lots.items,
    setLots: lots.setItems,
    addLot,
    structures: structures.items,
    setStructures: structures.setItems,
    addStructure,
    expenses: expenses.items,
    setExpenses: expenses.setItems,
    addExpense,
    inventory: inventory.items,
    setInventory: inventory.setItems,
    addInventoryItem,
    feedLogs: feedLogs.items,
    addFeedConsumption,
    weighings: weighings.items,
    addWeighing,
    mortality: mortality.items,
    addMortality,
    eggs: eggs.items,
    addEggProduction,
    incubations: incubations.items,
    addIncubation,
    updateIncubation,
    deleteIncubation,
    finalizeIncubation,
    candlings: candlings.items,
    setCandlings: candlings.setItems,
    addCandling,
    energyLogs: energyLogs.items,
    setEnergyLogs: energyLogs.setItems,
    animals: animals.items,
    setAnimals: animals.setItems,
    matings: matings.items,
    setMatings: matings.setItems,
    sales: sales.items,
    addSale,
    customers: customers.items,
    setCustomers: customers.setItems,
    suppliers: suppliers.items,
    setSuppliers: suppliers.setItems,
    assets: assets.items,
    setAssets: assets.setItems,
    addAsset,
    alerts: alerts.items,
    markAlertAsRead,
    stockMovements: stockMovements.items,
    addStockMovement,
    addEnergyLog,
    addAnimal,
    addMating,
    addCustomer,
    addSupplier,
    updateInventory,
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
