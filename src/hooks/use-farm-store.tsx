import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
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

  // ===== Atividades =====
  // addActivity gera o id; update/remove (activities.update/activities.remove)
  // já registram audit internamente via useSupabaseEntity, seguindo o mesmo
  // padrão de addLot/addExpense.
  const addActivity = useCallback(
    async (activity: Omit<Activity, 'id'>) => {
      const id = `act-${Date.now()}`
      return activities.add({ ...activity, id })
    },
    [activities],
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

      // Update inventory: stock += totalQuantity, recalc average cost (sempre custo por kg)
      const item = inventory.items.find((i) => i.id === purchase.inventoryItemId)
      if (item) {
        const oldStock = item.currentStock || 0
        const oldAvg = item.averageCost || 0
        const newStock = oldStock + totalQuantity
        // Se for a primeira compra / estoque zerado, recalcula averageCost direto como totalValue / totalQuantity por kg
        // Caso contrário, calcula a média ponderada por kg
        let newAvg = oldAvg
        if (oldStock <= 0) {
          newAvg = totalQuantity > 0 ? Number((totalValue / totalQuantity).toFixed(4)) : 0
        } else if (newStock > 0) {
          newAvg = Number(((oldStock * oldAvg + totalValue) / newStock).toFixed(4))
        }

        await inventory.update(purchase.inventoryItemId, {
          currentStock: newStock,
          averageCost: Number(newAvg.toFixed(2)),
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
      const oldInc = incubations.items.find((i) => i.id === id)
      const res = await incubations.update(id, updates)
      if (res.error) return res

      // Se a incubação estiver concluída e possuir lote resultante vinculado
      const resultingLotId = updates.resultingLotId || oldInc?.resultingLotId
      if (oldInc && resultingLotId) {
        // Se healthyChicks foi atualizado
        if (updates.healthyChicks !== undefined && updates.healthyChicks !== oldInc.healthyChicks) {
          const lot = lots.items.find((l) => l.id === resultingLotId || l.incubationId === id)
          if (lot) {
            const oldQty = lot.initialQuantity
            const diff = updates.healthyChicks - (oldInc.healthyChicks || 0)
            const newCurrent = Math.max(0, lot.currentQuantity + diff)
            // Atualiza initialQuantity do lote para o novo healthyChicks e ajusta currentQuantity
            await lots.update(lot.id, {
              initialQuantity: updates.healthyChicks,
              currentQuantity: newCurrent,
            })
          }
        }
      }

      return res
    },
    [incubations, lots],
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
      results: {
        hatchedCount: number
        unhatchedCount: number
        healthyChicks: number
        deaths: number
        endDate: string
        createLot: boolean
        lotName?: string
        notes?: string
      },
    ): Promise<{ error: any; lotId?: string }> => {
      const inc = incubations.items.find((i) => i.id === id)
      if (!inc) {
        return { error: { message: 'Incubação não encontrada' } }
      }

      // Se createLot solicitado mas resultingLotId já existe, avisar e não duplicar lote
      if (results.createLot && inc.resultingLotId) {
        return {
          error: { message: `Esta incubação já gerou o lote ${inc.resultingLotId}.` },
          lotId: inc.resultingLotId,
        }
      }

      // 1. Atualizar a incubação com status Concluído, endDate e resultados
      const incubationUpdates: Partial<Incubation> = {
        hatchedCount: results.hatchedCount,
        unhatchedCount: results.unhatchedCount,
        healthyChicks: results.healthyChicks,
        deaths: results.deaths,
        endDate: results.endDate,
        notes: results.notes ?? inc.notes,
        status: 'Concluído' as IncubationStatus,
      }

      let generatedLotId: string | undefined = undefined

      // 2. Se createLot === true E incubation.resultingLotId ainda não existe:
      if (results.createLot && !inc.resultingLotId) {
        const totalCost = getIncubationTotalCost(inc)
        const supplierName = inc.supplier || 'Incubação própria'

        const newLotData: Omit<Lot, 'id' | 'code' | 'currentQuantity'> = {
          name: results.lotName?.trim() || `Pintinhos - ${inc.code}`,
          type: 'Pintinhos',
          activityId: inc.activityId,
          startDate: results.endDate || new Date().toISOString().split('T')[0],
          origin: 'Incubação própria',
          supplier: supplierName,
          breed: inc.breed,
          initialQuantity: results.healthyChicks,
          initialAgeDays: 1,
          acquisitionCost: totalCost,
          purpose: 'Recria / Produção',
          status: 'Ativo',
          notes: `Lote gerado automaticamente da incubação ${inc.code}.`,
          incubationId: inc.id,
        }

        const addLotRes = await addLot(newLotData)
        if (addLotRes.error) {
          return { error: addLotRes.error }
        }

        // Recupera o ID do lote recém-criado (retornado ou gerado)
        generatedLotId = (addLotRes as any)?.data?.[0]?.id || (addLotRes as any)?.id

        // Se por ventura addLot não retornar id explicitamente no payload, podemos encontrá-lo
        if (!generatedLotId) {
          // fallback
          generatedLotId = `l-inc-${inc.id}-${Date.now()}`
        }

        incubationUpdates.resultingLotId = generatedLotId
      }

      const updateRes = await incubations.update(id, incubationUpdates)
      if (updateRes.error) {
        return { error: updateRes.error }
      }

      return { error: null, lotId: generatedLotId }
    },
    [incubations, addLot],
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

  // Auto-correção de registros legados de ração (garante que averageCost seja por KG e não por saco)
  const isMigratingRef = useRef(false)
  useEffect(() => {
    if (!orgId || isMigratingRef.current) return
    if (
      inventory.items.length === 0 &&
      feedPurchases.items.length === 0 &&
      feedLogs.items.length === 0
    )
      return

    const runAutoCorrection = async () => {
      isMigratingRef.current = true
      try {
        const purchasesList = feedPurchases.items.filter(
          (p) => (p as any).recordType === 'purchase',
        )
        const consumptionList = feedLogs.items.filter((f) => (f as any).recordType !== 'purchase')

        for (const item of inventory.items) {
          const itemPurchases = purchasesList.filter((p) => p.inventoryItemId === item.id)
          const pkgWeight = Number((item as any).packageWeight) || 0
          let targetAvgCost = item.averageCost || 0
          let needsUpdate = false

          if (itemPurchases.length > 0) {
            const sumValue = itemPurchases.reduce((acc, p) => acc + (p.totalValue || 0), 0)
            const sumQty = itemPurchases.reduce((acc, p) => acc + (p.totalQuantity || 0), 0)
            if (sumQty > 0) {
              const calcAvg = Number((sumValue / sumQty).toFixed(2))
              // Se o averageCost atual for muito maior que o calculado (ex: > 2x ou > 5x)
              if (item.averageCost > 0 && item.averageCost > calcAvg * 1.5) {
                targetAvgCost = calcAvg
                needsUpdate = true
              } else if (item.averageCost === 0 && calcAvg > 0) {
                targetAvgCost = calcAvg
                needsUpdate = true
              }
            }
          } else if (pkgWeight > 1 && item.averageCost > 0) {
            // Se não houver compras registradas mas packageWeight > 1 e o custo for suspeito (ex: > R$ 25/kg)
            // indicando que foi inserido o valor do saco inteiro (ex: R$ 69,90)
            if (item.averageCost > 20) {
              targetAvgCost = Number((item.averageCost / pkgWeight).toFixed(2))
              needsUpdate = true
            }
          }

          if (needsUpdate && targetAvgCost > 0) {
            await inventory.update(item.id, {
              averageCost: targetAvgCost,
            })
          }

          // Corrigir consumos vinculados a este item se o costPerKg estiver errado
          const itemConsumptions = consumptionList.filter((c) => c.inventoryItemId === item.id)
          const effectiveCostPerKg = targetAvgCost > 0 ? targetAvgCost : item.averageCost

          for (const c of itemConsumptions) {
            if (effectiveCostPerKg > 0) {
              // Se o costPerKg do consumo for desproporcional ao effectiveCostPerKg (ex: > 1.5x) ou desatualizado
              const isCostSuspect =
                c.costPerKg > effectiveCostPerKg * 1.5 ||
                (pkgWeight > 1 && c.costPerKg > 20 && effectiveCostPerKg <= 20)

              if (isCostSuspect) {
                const correctedCostPerKg = effectiveCostPerKg
                const correctedTotalCost = Number((c.quantityKg * correctedCostPerKg).toFixed(2))
                await feedLogs.update(c.id, {
                  costPerKg: correctedCostPerKg,
                  totalCost: correctedTotalCost,
                })
              }
            }
          }
        }
      } catch (err) {
        console.error('[useFarmStore] Error running feed auto-correction:', err)
      }
    }

    runAutoCorrection()
  }, [orgId, inventory.items, feedPurchases.items, feedLogs.items, inventory, feedLogs])

  return {
    activities: activities.items,
    setActivities: activities.setItems,
    addActivity,
    updateActivity: activities.update,
    deleteActivity: activities.remove,
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

export function getIncubationTotalCost(inc: Partial<Incubation> | null | undefined): number {
  if (!inc) return 0
  return (
    Number(inc.eggCost || 0) +
    Number(inc.energyCost || 0) +
    Number(inc.suppliesCost || 0) +
    Number(inc.laborCost || 0) +
    Number(inc.otherCosts || 0)
  )
}

export function useFarmStore() {
  const ctx = useContext(FarmStoreContext)
  if (!ctx) throw new Error('useFarmStore must be used within FarmStoreProvider')
  return ctx
}
