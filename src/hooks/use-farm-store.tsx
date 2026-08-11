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

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('Todos')
  const [selectedLotId, setSelectedLotId] = useState('todos')

  const addLot = useCallback(
    (lot: Omit<Lot, 'id' | 'code' | 'currentQuantity'>) => {
      lots.add({
        ...lot,
        id: `l-${Date.now()}`,
        code: `L-${String(lots.items.length + 1).padStart(4, '0')}`,
        currentQuantity: lot.initialQuantity,
      })
    },
    [lots],
  )

  const addExpense = useCallback(
    (exp: Omit<Expense, 'id' | 'totalValue'>) => {
      expenses.add({
        ...exp,
        id: `ex-${Date.now()}`,
        totalValue: Number((exp.quantity * exp.unitValue).toFixed(2)),
      })
    },
    [expenses],
  )

  const addStructure = useCallback(
    (st: Omit<StructureCost, 'id' | 'totalValue'>) => {
      structures.add({
        ...st,
        id: `st-${Date.now()}`,
        totalValue: Number((st.quantity * st.unitValue).toFixed(2)),
      })
    },
    [structures],
  )

  const addFeedConsumption = useCallback(
    (feed: Omit<FeedConsumption, 'id' | 'totalCost'>) => {
      const totalCost = Number((feed.quantityKg * feed.costPerKg).toFixed(2))
      feedLogs.add({ ...feed, id: `fc-${Date.now()}`, totalCost })
      if (feed.inventoryItemId) {
        const item = inventory.items.find((i) => i.id === feed.inventoryItemId)
        if (item)
          inventory.update(feed.inventoryItemId, {
            currentStock: Math.max(0, item.currentStock - feed.quantityKg),
            lastUpdated: new Date().toISOString().split('T')[0],
          })
      }
    },
    [feedLogs, inventory],
  )

  const addWeighing = useCallback(
    (w: Omit<Weighing, 'id' | 'averageWeightKg'>) => {
      weighings.add({
        ...w,
        id: `w-${Date.now()}`,
        averageWeightKg: Number((w.totalWeightKg / w.weighedCount).toFixed(2)),
      })
    },
    [weighings],
  )

  const addMortality = useCallback(
    (m: Omit<Mortality, 'id'>) => {
      mortality.add({ ...m, id: `m-${Date.now()}` })
      const lot = lots.items.find((l) => l.id === m.lotId)
      if (lot)
        lots.update(m.lotId, { currentQuantity: Math.max(0, lot.currentQuantity - m.quantity) })
    },
    [mortality, lots],
  )

  const addEggProduction = useCallback(
    (egg: Omit<EggProduction, 'id'>) => {
      eggs.add({ ...egg, id: `egg-${Date.now()}` })
    },
    [eggs],
  )

  const addSale = useCallback(
    (sale: Omit<Sale, 'id' | 'totalPrice'>) => {
      sales.add({
        ...sale,
        id: `sal-${Date.now()}`,
        totalPrice: Number((sale.quantity * sale.unitPrice).toFixed(2)),
      })
    },
    [sales],
  )

  const addIncubation = useCallback(
    (inc: Omit<Incubation, 'id' | 'code' | 'status'>) => {
      incubations.add({
        ...inc,
        id: `inc-${Date.now()}`,
        code: `I-${String(incubations.items.length + 1).padStart(4, '0')}`,
        status: 'Em andamento',
      })
    },
    [incubations],
  )

  const updateIncubation = useCallback(
    (id: string, updates: Partial<Incubation>) => {
      incubations.update(id, updates)
    },
    [incubations],
  )

  const deleteIncubation = useCallback(
    (id: string) => {
      incubations.remove(id)
      candlings.items.forEach((c) => {
        if (c.incubationId === id) candlings.remove(c.id)
      })
    },
    [incubations, candlings],
  )

  const finalizeIncubation = useCallback(
    (
      id: string,
      results: Pick<Incubation, 'hatchedCount' | 'unhatchedCount' | 'healthyChicks' | 'deaths'>,
    ) => {
      incubations.update(id, { ...results, status: 'Concluído' as IncubationStatus })
    },
    [incubations],
  )

  const addCandling = useCallback(
    (candling: Omit<Candling, 'id'>) => {
      candlings.add({ ...candling, id: `cnd-${Date.now()}` })
    },
    [candlings],
  )

  const addInventoryItem = useCallback(
    (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
      inventory.add({
        ...item,
        id: `inv-${Date.now()}`,
        lastUpdated: new Date().toISOString().split('T')[0],
      })
    },
    [inventory],
  )

  const markAlertAsRead = useCallback(
    (id: string) => {
      alerts.update(id, { isRead: true })
    },
    [alerts],
  )

  const addAsset = useCallback(
    (asset: Asset) => {
      assets.add(asset)
    },
    [assets],
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
