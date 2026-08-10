import { useState, useEffect } from 'react'
import {
  Lot,
  StructureCost,
  Expense,
  InventoryItem,
  FeedConsumption,
  Weighing,
  Mortality,
  EggProduction,
  Incubation,
  Candling,
  EnergyMeasurement,
  Animal,
  Mating,
  Sale,
  Customer,
  Supplier,
  Asset,
  FarmAlert,
  PeriodFilter,
} from '@/types/farm'
import {
  initialLots,
  initialStructures,
  initialExpenses,
  initialInventory,
  initialFeed,
  initialWeighings,
  initialMortality,
  initialEggs,
  initialIncubations,
  initialCandlings,
  initialEnergy,
  initialAnimals,
  initialMatings,
  initialSales,
  initialCustomers,
  initialSuppliers,
  initialAssets,
  initialAlerts,
} from '@/lib/mock-data'

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`sonho_roceiro_${key}`)
    return item ? JSON.parse(item) : defaultValue
  } catch (e) {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`sonho_roceiro_${key}`, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save to localStorage', e)
  }
}

export function useFarmStore() {
  const [lots, setLots] = useState<Lot[]>(() => loadFromStorage('lots', initialLots))
  const [structures, setStructures] = useState<StructureCost[]>(() =>
    loadFromStorage('structures', initialStructures),
  )
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadFromStorage('expenses', initialExpenses),
  )
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    loadFromStorage('inventory', initialInventory),
  )
  const [feedLogs, setFeedLogs] = useState<FeedConsumption[]>(() =>
    loadFromStorage('feed', initialFeed),
  )
  const [weighings, setWeighings] = useState<Weighing[]>(() =>
    loadFromStorage('weighings', initialWeighings),
  )
  const [mortality, setMortality] = useState<Mortality[]>(() =>
    loadFromStorage('mortality', initialMortality),
  )
  const [eggs, setEggs] = useState<EggProduction[]>(() => loadFromStorage('eggs', initialEggs))
  const [incubations, setIncubations] = useState<Incubation[]>(() =>
    loadFromStorage('incubations', initialIncubations),
  )
  const [candlings, setCandlings] = useState<Candling[]>(() =>
    loadFromStorage('candlings', initialCandlings),
  )
  const [energyLogs, setEnergyLogs] = useState<EnergyMeasurement[]>(() =>
    loadFromStorage('energy', initialEnergy),
  )
  const [animals, setAnimals] = useState<Animal[]>(() => loadFromStorage('animals', initialAnimals))
  const [matings, setMatings] = useState<Mating[]>(() => loadFromStorage('matings', initialMatings))
  const [sales, setSales] = useState<Sale[]>(() => loadFromStorage('sales', initialSales))
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadFromStorage('customers', initialCustomers),
  )
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadFromStorage('suppliers', initialSuppliers),
  )
  const [assets, setAssets] = useState<Asset[]>(() => loadFromStorage('assets', initialAssets))
  const [alerts, setAlerts] = useState<FarmAlert[]>(() => loadFromStorage('alerts', initialAlerts))

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('Todos')
  const [selectedLotId, setSelectedLotId] = useState<string>('todos')

  useEffect(() => saveToStorage('lots', lots), [lots])
  useEffect(() => saveToStorage('structures', structures), [structures])
  useEffect(() => saveToStorage('expenses', expenses), [expenses])
  useEffect(() => saveToStorage('inventory', inventory), [inventory])
  useEffect(() => saveToStorage('feed', feedLogs), [feedLogs])
  useEffect(() => saveToStorage('weighings', weighings), [weighings])
  useEffect(() => saveToStorage('mortality', mortality), [mortality])
  useEffect(() => saveToStorage('eggs', eggs), [eggs])
  useEffect(() => saveToStorage('incubations', incubations), [incubations])
  useEffect(() => saveToStorage('candlings', candlings), [candlings])
  useEffect(() => saveToStorage('energy', energyLogs), [energyLogs])
  useEffect(() => saveToStorage('animals', animals), [animals])
  useEffect(() => saveToStorage('matings', matings), [matings])
  useEffect(() => saveToStorage('sales', sales), [sales])
  useEffect(() => saveToStorage('customers', customers), [customers])
  useEffect(() => saveToStorage('suppliers', suppliers), [suppliers])
  useEffect(() => saveToStorage('assets', assets), [assets])
  useEffect(() => saveToStorage('alerts', alerts), [alerts])

  // Mutation Helper Functions
  const addLot = (lot: Omit<Lot, 'id' | 'code' | 'currentQuantity'>) => {
    const newId = `l-${Date.now()}`
    const code = `L-${String(lots.length + 1).padStart(4, '0')}`
    const newLot: Lot = {
      ...lot,
      id: newId,
      code,
      currentQuantity: lot.initialQuantity,
    }
    setLots((prev) => [newLot, ...prev])
  }

  const addExpense = (exp: Omit<Expense, 'id' | 'totalValue'>) => {
    const totalValue = Number((exp.quantity * exp.unitValue).toFixed(2))
    const newExp: Expense = { ...exp, id: `ex-${Date.now()}`, totalValue }
    setExpenses((prev) => [newExp, ...prev])
  }

  const addStructure = (st: Omit<StructureCost, 'id' | 'totalValue'>) => {
    const totalValue = Number((st.quantity * st.unitValue).toFixed(2))
    const newSt: StructureCost = { ...st, id: `st-${Date.now()}`, totalValue }
    setStructures((prev) => [newSt, ...prev])
  }

  const addFeedConsumption = (feed: Omit<FeedConsumption, 'id' | 'totalCost'>) => {
    const totalCost = Number((feed.quantityKg * feed.costPerKg).toFixed(2))
    const newFeed: FeedConsumption = { ...feed, id: `fc-${Date.now()}`, totalCost }
    setFeedLogs((prev) => [newFeed, ...prev])

    if (feed.inventoryItemId) {
      setInventory((prev) =>
        prev.map((item) => {
          if (item.id === feed.inventoryItemId) {
            const updatedStock = Math.max(0, item.currentStock - feed.quantityKg)
            return {
              ...item,
              currentStock: updatedStock,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          }
          return item
        }),
      )
    }
  }

  const addWeighing = (w: Omit<Weighing, 'id' | 'averageWeightKg'>) => {
    const averageWeightKg = Number((w.totalWeightKg / w.weighedCount).toFixed(2))
    const newW: Weighing = { ...w, id: `w-${Date.now()}`, averageWeightKg }
    setWeighings((prev) => [newW, ...prev])
  }

  const addMortality = (m: Omit<Mortality, 'id'>) => {
    const newM: Mortality = { ...m, id: `m-${Date.now()}` }
    setMortality((prev) => [newM, ...prev])

    setLots((prev) =>
      prev.map((lot) => {
        if (lot.id === m.lotId) {
          return { ...lot, currentQuantity: Math.max(0, lot.currentQuantity - m.quantity) }
        }
        return lot
      }),
    )
  }

  const addEggProduction = (egg: Omit<EggProduction, 'id'>) => {
    const newEgg: EggProduction = { ...egg, id: `egg-${Date.now()}` }
    setEggs((prev) => [newEgg, ...prev])
  }

  const addSale = (sale: Omit<Sale, 'id' | 'totalPrice'>) => {
    const totalPrice = Number((sale.quantity * sale.unitPrice).toFixed(2))
    const newSale: Sale = { ...sale, id: `sal-${Date.now()}`, totalPrice }
    setSales((prev) => [newSale, ...prev])
  }

  const addIncubation = (inc: Omit<Incubation, 'id' | 'code' | 'status'>) => {
    const code = `I-${String(incubations.length + 1).padStart(4, '0')}`
    const newInc: Incubation = {
      ...inc,
      id: `inc-${Date.now()}`,
      code,
      status: 'Em andamento',
    }
    setIncubations((prev) => [newInc, ...prev])
  }

  const markAlertAsRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)))
  }

  return {
    lots,
    setLots,
    addLot,
    structures,
    setStructures,
    addStructure,
    expenses,
    setExpenses,
    addExpense,
    inventory,
    setInventory,
    feedLogs,
    addFeedConsumption,
    weighings,
    addWeighing,
    mortality,
    addMortality,
    eggs,
    addEggProduction,
    incubations,
    addIncubation,
    candlings,
    setCandlings,
    energyLogs,
    setEnergyLogs,
    animals,
    setAnimals,
    matings,
    setMatings,
    sales,
    addSale,
    customers,
    setCustomers,
    suppliers,
    setSuppliers,
    assets,
    setAssets,
    alerts,
    markAlertAsRead,
    selectedPeriod,
    setSelectedPeriod,
    selectedLotId,
    setSelectedLotId,
  }
}
