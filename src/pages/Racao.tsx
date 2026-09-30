import { useState, useMemo } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { CategorySelect } from '@/components/CategorySelect'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'
import {
  Wheat,
  Plus,
  ArrowDown,
  Package,
  DollarSign,
  Trash2,
  Split,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  FeedConsumption,
  FeedPurchase,
  InventoryItem,
  FeedAllocationItem,
  FeedAllocationMethod,
} from '@/types/farm'

const RACAO_SUGGESTIONS = [
  'Ração Inicial',
  'Ração Crescimento',
  'Ração Postura',
  'Ração Acabamento',
  'Ração Frango Caipira',
  'Milho',
  'Farelo',
  'Suplemento',
  'Outros',
]

const PAYMENT_METHODS = ['Pix', 'Dinheiro', 'Cartão', 'Boleto', 'Transferência']

function isPurchase(r: any): boolean {
  return r && r.recordType === 'purchase'
}

export default function Racao() {
  const {
    feedLogs,
    feedPurchases,
    inventory,
    lots,
    activities,
    addFeedConsumption,
    updateFeedConsumption,
    deleteFeedConsumption,
    addFeedPurchase,
    deleteFeedPurchase,
    addInventoryItem,
    updateInventory,
    deleteInventory,
  } = useFarmStore()

  const [tab, setTab] = useState<'estoque' | 'compras' | 'consumo'>('estoque')

  // Cadastro de ração (sem lote)
  const [racaoOpen, setRacaoOpen] = useState(false)
  const [racaoEditing, setRacaoEditing] = useState<InventoryItem | null>(null)
  const [racaoForm, setRacaoForm] = useState({
    name: '',
    category: 'Ração Inicial',
    unit: 'KG',
    packageWeight: '',
    brand: '',
    supplier: '',
    minStock: '',
    notes: '',
  })

  // Compra/Entrada
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    inventoryItemId: '',
    packages: '',
    weightPerPackage: '',
    pricePerPackage: '',
    supplier: '',
    paymentMethod: 'Pix',
    notes: '',
    generateExpense: true,
  })

  // Consumo
  const [consumptionOpen, setConsumptionOpen] = useState(false)
  const [consumptionEditing, setConsumptionEditing] = useState<FeedConsumption | null>(null)
  const [allocationMode, setAllocationMode] = useState<'single' | 'multi'>('single')
  const [allocationMethod, setAllocationMethod] = useState<FeedAllocationMethod>('manual')
  const [consumptionForm, setConsumptionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    inventoryItemId: '',
    quantityKg: '',
    destinationType: 'lote' as 'lote' | 'rateio' | 'atividade' | 'geral',
    lotId: '',
    activityId: '',
    notes: '',
  })
  const [lotAllocations, setLotAllocations] = useState<
    Array<{
      lotId: string
      lotName: string
      quantityKg: string
      notes?: string
    }>
  >([])
  const [expandedAllocationHistoryId, setExpandedAllocationHistoryId] = useState<string | null>(
    null,
  )

  const [deletingConsumption, setDeletingConsumption] = useState<FeedConsumption | null>(null)
  const [deletingPurchase, setDeletingPurchase] = useState<FeedPurchase | null>(null)
  const [deletingRacao, setDeletingRacao] = useState<InventoryItem | null>(null)
  const [details, setDetails] = useState<any>(null)

  // Itens de ração = inventory items cuja categoria inclui "ração" ou todos (permite qualquer item)
  const racaoItems = useMemo(() => inventory, [inventory])

  // Compras = feedPurchases com recordType === 'purchase'
  const purchases = useMemo(
    () => feedPurchases.filter((p) => isPurchase(p)) as FeedPurchase[],
    [feedPurchases],
  )

  // Consumos = feedLogs sem recordType === 'purchase'
  const consumptions = useMemo(
    () => feedLogs.filter((f) => !isPurchase(f)) as FeedConsumption[],
    [feedLogs],
  )

  const totalStockKg = racaoItems.reduce((acc, i) => acc + (i.currentStock || 0), 0)
  const totalStockValue = racaoItems.reduce(
    (acc, i) => acc + (i.currentStock || 0) * (i.averageCost || 0),
    0,
  )
  const totalConsumedKg = consumptions.reduce((acc, f) => acc + f.quantityKg, 0)
  const totalConsumedCost = consumptions.reduce((acc, f) => acc + f.totalCost, 0)
  const totalPurchasedKg = purchases.reduce((acc, p) => acc + p.totalQuantity, 0)
  const totalPurchasedValue = purchases.reduce((acc, p) => acc + p.totalValue, 0)

  // ===== Cadastro de ração =====
  const openRacaoCreate = () => {
    setRacaoEditing(null)
    setRacaoForm({
      name: '',
      category: 'Ração Inicial',
      unit: 'KG',
      packageWeight: '',
      brand: '',
      supplier: '',
      minStock: '',
      notes: '',
    })
    setRacaoOpen(true)
  }

  const openRacaoEdit = (item: InventoryItem) => {
    setRacaoEditing(item)
    setRacaoForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      packageWeight: String((item as any).packageWeight || ''),
      brand: (item as any).brand || '',
      supplier: item.supplier || '',
      minStock: String(item.minStock || ''),
      notes: item.notes || '',
    })
    setRacaoOpen(true)
  }

  const handleRacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data: any = {
        name: racaoForm.name,
        category: racaoForm.category,
        unit: racaoForm.unit,
        packageWeight: Number(racaoForm.packageWeight) || 0,
        brand: racaoForm.brand,
        supplier: racaoForm.supplier,
        minStock: Number(racaoForm.minStock) || 0,
        notes: racaoForm.notes,
      }
      if (racaoEditing) {
        const { error } = await updateInventory(racaoEditing.id, data)
        if (error) throw new Error(error.message)
        toast({ title: 'Ração atualizada! ✅' })
      } else {
        const { error } = await addInventoryItem({
          ...data,
          currentStock: 0,
          averageCost: 0,
        } as any)
        if (error) throw new Error(error.message)
        toast({ title: 'Ração cadastrada! 🌾', description: 'Nenhum lote necessário.' })
      }
      setRacaoOpen(false)
      setRacaoEditing(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  // ===== Compra/Entrada =====
  const openPurchase = () => {
    setPurchaseForm({
      date: new Date().toISOString().split('T')[0],
      inventoryItemId: racaoItems[0]?.id || '',
      packages: '',
      weightPerPackage: '',
      pricePerPackage: '',
      supplier: '',
      paymentMethod: 'Pix',
      notes: '',
      generateExpense: true,
    })
    setPurchaseOpen(true)
  }

  const purchaseTotalQty =
    (Number(purchaseForm.packages) || 0) * (Number(purchaseForm.weightPerPackage) || 0)
  const purchaseTotalValue =
    (Number(purchaseForm.packages) || 0) * (Number(purchaseForm.pricePerPackage) || 0)
  const purchaseCostPerKg = purchaseTotalQty > 0 ? purchaseTotalValue / purchaseTotalQty : 0

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const item = racaoItems.find((i) => i.id === purchaseForm.inventoryItemId)
      if (!item) throw new Error('Selecione uma ração')
      const { error } = await addFeedPurchase({
        date: purchaseForm.date,
        inventoryItemId: purchaseForm.inventoryItemId,
        inventoryItemName: item.name,
        packages: Number(purchaseForm.packages) || 0,
        weightPerPackage: Number(purchaseForm.weightPerPackage) || 0,
        pricePerPackage: Number(purchaseForm.pricePerPackage) || 0,
        supplier: purchaseForm.supplier,
        paymentMethod: purchaseForm.paymentMethod,
        notes: purchaseForm.notes,
        generateExpense: purchaseForm.generateExpense,
        recordType: 'purchase',
      } as any)
      if (error) throw new Error(error.message)
      toast({
        title: 'Entrada registrada! 📥',
        description: `Estoque +${purchaseTotalQty} kg • R$ ${purchaseTotalValue.toFixed(2)}`,
      })
      setPurchaseOpen(false)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  const handleDeletePurchase = async () => {
    if (!deletingPurchase) return
    try {
      const { error } = await deleteFeedPurchase(deletingPurchase.id)
      if (error) throw new Error(error.message)
      await logAudit(
        'DELETE',
        'farm_feed_consumption',
        deletingPurchase.id,
        deletingPurchase as any,
      )
      toast({ title: 'Compra excluída! 🗑️', description: 'Estoque e financeiro ajustados.' })
      setDeletingPurchase(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  // ===== Consumo =====
  const openConsumptionCreate = () => {
    setConsumptionEditing(null)
    setAllocationMode('single')
    setAllocationMethod('manual')
    setConsumptionForm({
      date: new Date().toISOString().split('T')[0],
      inventoryItemId: racaoItems[0]?.id || '',
      quantityKg: '',
      destinationType: 'lote',
      lotId: lots[0]?.id || '',
      activityId: '',
      notes: '',
    })
    setLotAllocations([])
    setConsumptionOpen(true)
  }

  const openConsumptionEdit = (c: FeedConsumption) => {
    setConsumptionEditing(c)
    const hasAllocations = Boolean(c.allocations && c.allocations.length > 0)
    setAllocationMode(hasAllocations ? 'multi' : 'single')
    setAllocationMethod(c.allocation_method || 'manual')
    setConsumptionForm({
      date: c.date,
      inventoryItemId: c.inventoryItemId || racaoItems[0]?.id || '',
      quantityKg: String(c.quantityKg),
      destinationType: hasAllocations
        ? 'rateio'
        : (c.destinationType as any) || (c.lotId ? 'lote' : 'geral'),
      lotId: c.lotId || '',
      activityId: c.activityId || '',
      notes: c.notes || '',
    })
    if (hasAllocations && c.allocations) {
      setLotAllocations(
        c.allocations.map((a) => ({
          lotId: a.lotId,
          lotName: a.lotName,
          quantityKg: String(a.quantityKg),
          notes: a.notes,
        })),
      )
    } else {
      setLotAllocations([])
    }
    setConsumptionOpen(true)
  }

  // Adicionar linha de lote no rateio
  const handleAddLotAllocation = () => {
    const unselectedLot = lots.find((l) => !lotAllocations.some((a) => a.lotId === l.id)) || lots[0]
    if (!unselectedLot) return
    setLotAllocations((prev) => [
      ...prev,
      {
        lotId: unselectedLot.id,
        lotName: unselectedLot.name,
        quantityKg: '',
      },
    ])
  }

  const handleRemoveLotAllocation = (index: number) => {
    setLotAllocations((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateLotAllocation = (
    index: number,
    field: 'lotId' | 'quantityKg' | 'percentage',
    val: string,
  ) => {
    setLotAllocations((prev) => {
      const next = [...prev]
      if (field === 'lotId') {
        const found = lots.find((l) => l.id === val)
        next[index] = {
          ...next[index],
          lotId: val,
          lotName: found ? found.name : next[index].lotName,
        }
      } else if (field === 'quantityKg') {
        next[index] = {
          ...next[index],
          quantityKg: val,
        }
      } else if (field === 'percentage') {
        const pct = Number(val) || 0
        const totalKg = Number(consumptionForm.quantityKg) || 0
        const calcKg = totalKg > 0 ? Number(((totalKg * pct) / 100).toFixed(2)) : 0
        next[index] = {
          ...next[index],
          quantityKg: calcKg > 0 ? String(calcKg) : '',
        }
      }
      return next
    })
  }

  const totalAllocatedKg = useMemo(() => {
    return lotAllocations.reduce((acc, a) => acc + (Number(a.quantityKg) || 0), 0)
  }, [lotAllocations])

  const handleConsumptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const item = racaoItems.find((i) => i.id === consumptionForm.inventoryItemId)
      if (!item) throw new Error('Selecione um item de ração')

      const totalQty = Number(consumptionForm.quantityKg) || 0
      if (totalQty <= 0) {
        throw new Error('A quantidade consumida deve ser maior que zero')
      }

      // Validar saldo em estoque (apenas ao criar, ou verificar diferença ao editar)
      const currentStock = item.currentStock || 0
      const prevQty = consumptionEditing ? consumptionEditing.quantityKg : 0
      if (totalQty - prevQty > currentStock) {
        throw new Error(
          `Estoque insuficiente. Disponível: ${currentStock} ${item.unit}. Solicitado: ${totalQty} ${item.unit}`,
        )
      }

      const costPerKg = Number(item.averageCost || 0)
      const totalCost = Number((totalQty * costPerKg).toFixed(2))

      let finalAllocations: FeedAllocationItem[] | undefined = undefined
      let finalLotId = ''
      let finalLotName = ''

      if (allocationMode === 'single') {
        if (consumptionForm.destinationType === 'lote') {
          const lot = lots.find((l) => l.id === consumptionForm.lotId)
          if (!lot) throw new Error('Selecione o lote de destino')
          finalLotId = lot.id
          finalLotName = lot.name
          finalAllocations = [
            {
              lotId: lot.id,
              lotName: lot.name,
              quantityKg: totalQty,
              percentage: 100,
              cost: totalCost,
              animalCount: lot.currentQuantity || lot.initialQuantity || undefined,
            },
          ]
        }
      } else {
        // Modo distribuído entre vários lotes
        if (lotAllocations.length === 0) {
          throw new Error('Adicione ao menos um lote para distribuição')
        }

        // Validação da soma das quantidades (com tolerância de arredondamento de 0.001)
        const diff = Math.abs(totalAllocatedKg - totalQty)
        if (diff > 0.01) {
          throw new Error(
            `A quantidade distribuída entre os lotes precisa totalizar ${totalQty} kg.`,
          )
        }

        finalAllocations = lotAllocations.map((a) => {
          const lot = lots.find((l) => l.id === a.lotId)
          const lotKg = Number(a.quantityKg) || 0
          const pct = totalQty > 0 ? Number(((lotKg / totalQty) * 100).toFixed(1)) : 0
          const allocCost = Number((lotKg * costPerKg).toFixed(2))
          return {
            lotId: a.lotId,
            lotName: lot ? lot.name : a.lotName,
            quantityKg: lotKg,
            percentage: pct,
            cost: allocCost,
            animalCount: lot ? lot.currentQuantity || lot.initialQuantity : undefined,
            notes: a.notes,
          }
        })
      }

      const activity = activities.find((a) => a.id === consumptionForm.activityId)

      const payload: any = {
        date: consumptionForm.date,
        destinationType: allocationMode === 'multi' ? 'rateio' : consumptionForm.destinationType,
        lotId: finalLotId || undefined,
        lotName: finalLotName || undefined,
        activityId: consumptionForm.activityId || undefined,
        activityName: activity ? activity.name : undefined,
        quantityKg: totalQty,
        inventoryItemId: item.id,
        inventoryItemName: item.name,
        costPerKg,
        totalCost,
        notes: consumptionForm.notes || undefined,
        allocation_method: allocationMethod,
        allocations: finalAllocations,
      }

      if (consumptionEditing) {
        const { error } = await updateFeedConsumption(consumptionEditing.id, payload)
        if (error) throw new Error(error.message)
        toast({
          title: 'Consumo atualizado! ✅',
          description: `Estoque e rateio entre lotes recalculados (R$ ${totalCost.toFixed(2)}).`,
        })
      } else {
        const { error } = await addFeedConsumption(payload)
        if (error) throw new Error(error.message)
        toast({
          title: 'Consumo registrado! ✅',
          description: `Estoque -${totalQty} kg • Custo total apropriado: R$ ${totalCost.toFixed(2)}`,
        })
      }

      setConsumptionOpen(false)
      setConsumptionEditing(null)
      setLotAllocations([])
    } catch (err: any) {
      toast({ title: 'Erro na validação', description: err?.message, variant: 'destructive' })
    }
  }

  const handleDeleteConsumption = async () => {
    if (!deletingConsumption) return
    try {
      const { error } = await deleteFeedConsumption(deletingConsumption.id)
      if (error) throw new Error(error.message)
      await logAudit(
        'DELETE',
        'farm_feed_consumption',
        deletingConsumption.id,
        deletingConsumption as any,
      )
      toast({ title: 'Consumo excluído! 🗑️', description: 'Quantidade devolvida ao estoque.' })
      setDeletingConsumption(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  const handleDeleteRacao = async () => {
    if (!deletingRacao) return
    try {
      const { error } = await deleteInventory(deletingRacao.id)
      if (error) throw new Error(error.message)
      await logAudit('DELETE', 'farm_inventory', deletingRacao.id, deletingRacao as any)
      toast({
        title: 'Ração excluída! 🗑️',
        description: 'O cadastro foi removido do estoque.',
      })
      setDeletingRacao(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Wheat className="w-6 h-6 text-amber-600" /> Ração
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Controle de estoque, compras e consumo de ração — sem depender de lote.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openPurchase} variant="outline" className="rounded-xl text-xs gap-2">
            <ArrowDown className="w-4 h-4" /> Entrada / Compra
          </Button>
          <Button
            onClick={openConsumptionCreate}
            className="rounded-xl bg-primary text-white text-xs gap-2"
          >
            <Plus className="w-4 h-4" /> Registrar Consumo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Estoque Atual</span>
          <p className="text-2xl font-extrabold text-amber-700">{totalStockKg.toFixed(1)} kg</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Valor em Estoque</span>
          <p className="text-2xl font-extrabold text-emerald-700">
            R$ {totalStockValue.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Total Comprado</span>
          <p className="text-xl font-extrabold text-blue-700">{totalPurchasedKg.toFixed(1)} kg</p>
          <p className="text-[11px] text-muted-foreground">R$ {totalPurchasedValue.toFixed(2)}</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-white border-border">
          <span className="text-xs text-muted-foreground">Total Consumido</span>
          <p className="text-xl font-extrabold text-rose-700">{totalConsumedKg.toFixed(1)} kg</p>
          <p className="text-[11px] text-muted-foreground">R$ {totalConsumedCost.toFixed(2)}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(
          [
            ['estoque', 'Estoque de Ração'],
            ['compras', 'Compras'],
            ['consumo', 'Consumo'],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            variant={tab === key ? 'default' : 'outline'}
            onClick={() => setTab(key)}
            className="rounded-xl text-xs"
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === 'estoque' && (
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Rações Cadastradas</h2>
            <Button
              onClick={openRacaoCreate}
              variant="outline"
              className="rounded-xl text-xs gap-2"
            >
              <Plus className="w-4 h-4" /> Cadastrar Ração
            </Button>
          </div>
          <div className="space-y-2">
            {racaoItems.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma ração cadastrada. Clique em "Cadastrar Ração".
              </p>
            )}
            {racaoItems.map((item) => {
              const isLow = item.currentStock <= item.minStock
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-muted-foreground">
                      {item.category} • Custo médio: R$ {item.averageCost.toFixed(2)}/kg
                      {(item as any).brand ? ` • ${(item as any).brand}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-extrabold text-amber-800">
                        {item.currentStock} {item.unit}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        R$ {item.averageCost.toFixed(2)}/kg
                      </p>
                      {isLow && (
                        <Badge className="bg-amber-100 text-amber-800 text-[9px]">Baixo</Badge>
                      )}
                    </div>
                    <RecordActionMenu
                      onEdit={() => openRacaoEdit(item)}
                      onViewDetails={() => setDetails(item)}
                      onDelete={() => setDeletingRacao(item)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {tab === 'compras' && (
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
          <h2 className="text-base font-bold mb-3">Histórico de Compras</h2>
          <div className="space-y-2">
            {purchases.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma compra registrada.
              </p>
            )}
            {purchases.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold">{p.inventoryItemName}</p>
                  <p className="text-muted-foreground">
                    {p.date} • {p.packages} x {p.weightPerPackage}kg = {p.totalQuantity}kg
                    {p.supplier ? ` • ${p.supplier}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-bold text-emerald-700">R$ {p.totalValue.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      R$ {p.pricePerPackage.toFixed(2)}/saco
                      {p.totalQuantity > 0
                        ? ` (R$ ${(p.totalValue / p.totalQuantity).toFixed(2)}/kg)`
                        : ''}
                    </p>
                  </div>
                  <RecordActionMenu
                    onViewDetails={() => setDetails(p)}
                    onDelete={() => setDeletingPurchase(p)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'consumo' && (
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Histórico de Consumo & Rateio</h2>
            <span className="text-xs text-muted-foreground">
              Apropriação direta de custos aos lotes
            </span>
          </div>
          <div className="space-y-2.5">
            {consumptions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum consumo registrado.
              </p>
            )}
            {consumptions.map((f) => {
              const hasAllocations = Boolean(f.allocations && f.allocations.length > 0)
              const isExpanded = expandedAllocationHistoryId === f.id
              return (
                <div
                  key={f.id}
                  className="p-3 rounded-2xl bg-secondary/30 border border-border text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{f.inventoryItemName || 'Ração'}</p>
                        {hasAllocations && (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                            Rateio ({f.allocations?.length} lotes)
                          </Badge>
                        )}
                        {!hasAllocations && f.destinationType === 'lote' && (
                          <Badge variant="outline" className="text-[10px]">
                            Lote único
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        {f.date} •{' '}
                        {hasAllocations
                          ? `Rateio distribuído entre ${f.allocations?.length} lotes`
                          : f.destinationType === 'lote'
                            ? `Lote: ${f.lotName || '—'}`
                            : f.destinationType === 'atividade'
                              ? `Atividade: ${f.activityName || '—'}`
                              : 'Uso geral'}
                        {f.notes ? ` • ${f.notes}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold text-amber-800">{f.quantityKg} kg</p>
                        <p className="text-muted-foreground">
                          R$ {Number(f.totalCost || 0).toFixed(2)}{' '}
                          <span className="text-[10px]">
                            (R$ {Number(f.costPerKg || 0).toFixed(2)}/kg)
                          </span>
                        </p>
                      </div>
                      <RecordActionMenu
                        onEdit={() => openConsumptionEdit(f)}
                        onViewDetails={() => setDetails(f)}
                        onDelete={() => setDeletingConsumption(f)}
                      />
                    </div>
                  </div>

                  {/* Detalhes de rateio quando existirem */}
                  {hasAllocations && (
                    <div className="pt-1 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => setExpandedAllocationHistoryId(isExpanded ? null : f.id)}
                        className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> Ocultar rateio entre lotes
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> Ver composição do rateio (
                            {f.allocations?.length} lotes)
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-2.5 rounded-xl bg-white/70 border border-border/60 space-y-1.5 animate-fade-in text-[11px]">
                          <div className="grid grid-cols-12 font-semibold text-muted-foreground pb-1 border-b border-border/40">
                            <span className="col-span-5">Lote</span>
                            <span className="col-span-3 text-right">Qtd (kg)</span>
                            <span className="col-span-4 text-right">Custo Apropriado</span>
                          </div>
                          {f.allocations?.map((a, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-12 items-center py-0.5 border-b border-border/20 last:border-b-0"
                            >
                              <span className="col-span-5 font-medium text-foreground">
                                {a.lotName}
                                {a.percentage ? ` (${a.percentage}%)` : ''}
                              </span>
                              <span className="col-span-3 text-right text-amber-900 font-semibold">
                                {a.quantityKg} kg
                              </span>
                              <span className="col-span-4 text-right text-emerald-800 font-bold">
                                R$ {Number(a.cost || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          <div className="grid grid-cols-12 pt-1 font-bold text-foreground border-t border-border/60">
                            <span className="col-span-5">Total Rateado:</span>
                            <span className="col-span-3 text-right text-amber-900">
                              {f.quantityKg} kg
                            </span>
                            <span className="col-span-4 text-right text-emerald-800">
                              R$ {Number(f.totalCost || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Cadastro de Ração Dialog */}
      <Dialog
        open={racaoOpen}
        onOpenChange={(v) => !v && (setRacaoOpen(false), setRacaoEditing(null))}
      >
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {racaoEditing ? 'Editar Ração' : 'Cadastrar Ração'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastro do produto. Nenhum lote é necessário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRacaoSubmit} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input
                placeholder="Ex: Ração Inicial 40kg"
                value={racaoForm.name}
                onChange={(e) => setRacaoForm({ ...racaoForm, name: e.target.value })}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <CategorySelect
              label="Categoria / Tipo"
              value={racaoForm.category}
              onChange={(v) => setRacaoForm({ ...racaoForm, category: v })}
              storageKey="inventory"
              suggestions={RACAO_SUGGESTIONS}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Unidade</Label>
                <Select
                  value={racaoForm.unit}
                  onValueChange={(v) => setRacaoForm({ ...racaoForm, unit: v })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['KG', 'saco', 'unid', 'L'].map((u) => (
                      <SelectItem key={u} value={u} className="text-xs">
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Peso da embalagem (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Opcional"
                  value={racaoForm.packageWeight}
                  onChange={(e) => setRacaoForm({ ...racaoForm, packageWeight: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Marca</Label>
                <Input
                  placeholder="Opcional"
                  value={racaoForm.brand}
                  onChange={(e) => setRacaoForm({ ...racaoForm, brand: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">Fornecedor</Label>
                <Input
                  placeholder="Opcional"
                  value={racaoForm.supplier}
                  onChange={(e) => setRacaoForm({ ...racaoForm, supplier: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Estoque mínimo</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={racaoForm.minStock}
                onChange={(e) => setRacaoForm({ ...racaoForm, minStock: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea
                value={racaoForm.notes}
                onChange={(e) => setRacaoForm({ ...racaoForm, notes: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              {racaoEditing ? 'Salvar Alterações' : 'Cadastrar Ração'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compra/Entrada Dialog */}
      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Entrada / Compra de Ração</DialogTitle>
            <DialogDescription className="text-xs">
              Nenhum lote necessário. Estoque e custo médio serão recalculados.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePurchaseSubmit} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={purchaseForm.date}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Produto (Ração)</Label>
              <Select
                value={purchaseForm.inventoryItemId}
                onValueChange={(v) => setPurchaseForm({ ...purchaseForm, inventoryItemId: v })}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar ração" />
                </SelectTrigger>
                <SelectContent>
                  {racaoItems.map((i) => (
                    <SelectItem key={i.id} value={i.id} className="text-xs">
                      {i.name} (Atual: {i.currentStock} {i.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {racaoItems.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">
                  Cadastre uma ração primeiro na aba "Estoque de Ração".
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Qtd. de embalagens</Label>
                <Input
                  type="number"
                  placeholder="Ex: 5"
                  value={purchaseForm.packages}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, packages: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Peso por embalagem (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 40"
                  value={purchaseForm.weightPerPackage}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, weightPerPackage: e.target.value })
                  }
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Quantidade total (calculada)</Label>
              <Input
                value={`${purchaseTotalQty.toFixed(2)} kg`}
                readOnly
                className="h-10 text-xs rounded-xl bg-secondary/50 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Valor por embalagem (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 110"
                  value={purchaseForm.pricePerPackage}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, pricePerPackage: e.target.value })
                  }
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Valor total (calculado)</Label>
                <Input
                  value={`R$ ${purchaseTotalValue.toFixed(2)}`}
                  readOnly
                  className="h-10 text-xs rounded-xl bg-secondary/50 font-bold"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Custo por kg (calculado)</Label>
              <Input
                value={`Custo por kg: R$ ${purchaseCostPerKg.toFixed(2)}/kg`}
                readOnly
                className="h-10 text-xs rounded-xl bg-secondary/50 font-semibold text-emerald-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Fornecedor</Label>
                <Input
                  placeholder="Opcional"
                  value={purchaseForm.supplier}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">Forma de pagamento</Label>
                <Select
                  value={purchaseForm.paymentMethod}
                  onValueChange={(v) => setPurchaseForm({ ...purchaseForm, paymentMethod: v })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Observação</Label>
              <Input
                value={purchaseForm.notes}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={purchaseForm.generateExpense}
                onChange={(e) =>
                  setPurchaseForm({ ...purchaseForm, generateExpense: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-xs flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Registrar também como despesa no financeiro
              </span>
            </label>
            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              Confirmar Entrada
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Consumo Dialog */}
      <Dialog
        open={consumptionOpen}
        onOpenChange={(v) => !v && (setConsumptionOpen(false), setConsumptionEditing(null))}
      >
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Wheat className="w-5 h-5 text-amber-600" />
              {consumptionEditing ? 'Editar Consumo de Ração' : 'Registrar Consumo de Ração'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Baixa física do estoque e apropriação direta de custo aos lotes de produção (sem gerar
              nova despesa financeira).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConsumptionSubmit} className="space-y-3.5 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data do Consumo *</Label>
                <Input
                  type="date"
                  value={consumptionForm.date}
                  onChange={(e) => setConsumptionForm({ ...consumptionForm, date: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Ração do Estoque *</Label>
                <Select
                  value={consumptionForm.inventoryItemId}
                  onValueChange={(v) =>
                    setConsumptionForm({ ...consumptionForm, inventoryItemId: v })
                  }
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Selecionar ração" />
                  </SelectTrigger>
                  <SelectContent>
                    {racaoItems.map((i) => (
                      <SelectItem key={i.id} value={i.id} className="text-xs">
                        {i.name} (Saldo: {i.currentStock} {i.unit} • R$ {i.averageCost.toFixed(2)}
                        /kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quantidade consumida e custo unitário automático */}
            {(() => {
              const selectedItem = racaoItems.find((i) => i.id === consumptionForm.inventoryItemId)
              const avgCost = selectedItem?.averageCost || 0
              const totalKg = Number(consumptionForm.quantityKg) || 0
              const totalCost = Number((totalKg * avgCost).toFixed(2))

              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Quantidade Total Consumida (kg) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 40"
                        value={consumptionForm.quantityKg}
                        onChange={(e) =>
                          setConsumptionForm({ ...consumptionForm, quantityKg: e.target.value })
                        }
                        className="h-10 text-xs rounded-xl font-bold"
                        required
                      />
                      {selectedItem && (
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          Saldo em estoque: {selectedItem.currentStock} {selectedItem.unit}
                        </span>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Custo Médio do Estoque</Label>
                      <Input
                        value={`R$ ${avgCost.toFixed(2)} / kg`}
                        readOnly
                        className="h-10 text-xs rounded-xl bg-secondary/50 font-semibold text-emerald-800"
                      />
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Custo real apurado pelo estoque
                      </span>
                    </div>
                  </div>

                  {totalKg > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
                      <span className="text-amber-900 font-medium">
                        Custo total a ser apropriado:
                      </span>
                      <strong className="text-amber-950 text-sm font-extrabold">
                        R$ {totalCost.toFixed(2)}
                      </strong>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* SELEÇÃO DO MODO DE DESTINO: LOTE ÚNICO vs DISTRIBUIR ENTRE LOTES vs OUTROS */}
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-3">
              <Label className="text-xs font-bold text-foreground block">
                Destino do Consumo & Apropriação de Custo
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={allocationMode === 'single' ? 'default' : 'outline'}
                  onClick={() => {
                    setAllocationMode('single')
                    setConsumptionForm((prev) => ({ ...prev, destinationType: 'lote' }))
                  }}
                  className="rounded-xl text-xs h-9 justify-center"
                >
                  Opção A: Lote Único
                </Button>
                <Button
                  type="button"
                  variant={allocationMode === 'multi' ? 'default' : 'outline'}
                  onClick={() => {
                    setAllocationMode('multi')
                    setConsumptionForm((prev) => ({ ...prev, destinationType: 'rateio' }))
                    if (lotAllocations.length === 0 && lots.length > 0) {
                      setLotAllocations([
                        { lotId: lots[0]?.id || '', lotName: lots[0]?.name || '', quantityKg: '' },
                      ])
                    }
                  }}
                  className="rounded-xl text-xs h-9 justify-center gap-1.5"
                >
                  <Split className="w-3.5 h-3.5" /> Distribuir entre Lotes
                </Button>
              </div>

              {/* OPÇÃO A: LOTE ÚNICO */}
              {allocationMode === 'single' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <Label className="text-xs">Lote de Destino (100% do custo) *</Label>
                    <Select
                      value={consumptionForm.lotId}
                      onValueChange={(v) => setConsumptionForm({ ...consumptionForm, lotId: v })}
                    >
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                        <SelectValue placeholder="Selecione o lote..." />
                      </SelectTrigger>
                      <SelectContent>
                        {lots.map((l) => (
                          <SelectItem key={l.id} value={l.id} className="text-xs">
                            {l.code} • {l.name} ({l.currentQuantity} aves vivas)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(() => {
                    const selectedLot = lots.find((l) => l.id === consumptionForm.lotId)
                    const selectedItem = racaoItems.find(
                      (i) => i.id === consumptionForm.inventoryItemId,
                    )
                    const totalKg = Number(consumptionForm.quantityKg) || 0
                    const costKg = selectedItem?.averageCost || 0
                    const lotCost = Number((totalKg * costKg).toFixed(2))

                    if (!selectedLot || totalKg <= 0) return null
                    return (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1 text-emerald-950">
                        <p className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Apropriação Integral:
                        </p>
                        <p className="text-[11px] text-emerald-900">
                          O lote <strong>{selectedLot.name}</strong> receberá imediatamente +{' '}
                          <strong>R$ {lotCost.toFixed(2)}</strong> no seu custo acumulado de ração.
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* OPÇÃO B: DISTRIBUIR ENTRE VÁRIOS LOTES */}
              {allocationMode === 'multi' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-foreground">
                        Rateio entre Múltiplos Lotes
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Informe os kg de cada lote (ou % proporcional).
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddLotAllocation}
                      className="rounded-xl text-xs h-7 gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Lote
                    </Button>
                  </div>

                  {/* Linhas de lotes */}
                  <div className="space-y-2">
                    {lotAllocations.length === 0 && (
                      <p className="text-xs text-amber-700 p-2 rounded-xl bg-amber-50">
                        Clique em "Adicionar Lote" para começar a ratear os{' '}
                        {consumptionForm.quantityKg || 0} kg.
                      </p>
                    )}

                    {lotAllocations.map((alloc, idx) => {
                      const totalKg = Number(consumptionForm.quantityKg) || 0
                      const allocKg = Number(alloc.quantityKg) || 0
                      const pct = totalKg > 0 ? Number(((allocKg / totalKg) * 100).toFixed(1)) : 0
                      const selectedItem = racaoItems.find(
                        (i) => i.id === consumptionForm.inventoryItemId,
                      )
                      const costKg = selectedItem?.averageCost || 0
                      const allocCost = Number((allocKg * costKg).toFixed(2))

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white border border-border/80 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <Label className="text-[10px] text-muted-foreground">Lote</Label>
                              <Select
                                value={alloc.lotId}
                                onValueChange={(v) => handleUpdateLotAllocation(idx, 'lotId', v)}
                              >
                                <SelectTrigger className="h-8 text-xs rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {lots.map((l) => (
                                    <SelectItem key={l.id} value={l.id} className="text-xs">
                                      {l.name} ({l.currentQuantity} aves)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLotAllocation(idx)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 self-end"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                              <Label className="text-[10px] text-muted-foreground">
                                Qtd (kg) *
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="kg"
                                value={alloc.quantityKg}
                                onChange={(e) =>
                                  handleUpdateLotAllocation(idx, 'quantityKg', e.target.value)
                                }
                                className="h-8 text-xs rounded-lg font-bold"
                              />
                            </div>
                            <div className="col-span-3">
                              <Label className="text-[10px] text-muted-foreground">
                                % (opcional)
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="%"
                                value={pct > 0 ? String(pct) : ''}
                                onChange={(e) =>
                                  handleUpdateLotAllocation(idx, 'percentage', e.target.value)
                                }
                                className="h-8 text-xs rounded-lg text-muted-foreground"
                              />
                            </div>
                            <div className="col-span-4 text-right">
                              <Label className="text-[10px] text-muted-foreground block">
                                Custo (R$)
                              </Label>
                              <span className="text-xs font-bold text-emerald-800 block pt-1">
                                R$ {allocCost.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Resumo e validação da soma */}
                  {(() => {
                    const totalTargetKg = Number(consumptionForm.quantityKg) || 0
                    const diff = Number((totalAllocatedKg - totalTargetKg).toFixed(2))
                    const isExact = Math.abs(diff) < 0.01 && totalTargetKg > 0
                    const selectedItem = racaoItems.find(
                      (i) => i.id === consumptionForm.inventoryItemId,
                    )
                    const costKg = selectedItem?.averageCost || 0
                    const totalAllocatedCost = Number((totalAllocatedKg * costKg).toFixed(2))

                    return (
                      <div
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          isExact
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-rose-50 border-rose-300 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Total Distribuído:</span>
                          <span>
                            {totalAllocatedKg.toFixed(2)} / {totalTargetKg.toFixed(2)} kg (R${' '}
                            {totalAllocatedCost.toFixed(2)})
                          </span>
                        </div>
                        {isExact ? (
                          <p className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Quantidade distribuída 100%
                            compatível com a baixa do estoque.
                          </p>
                        ) : (
                          <p className="text-[11px] text-rose-700 font-semibold">
                            ⚠️ A quantidade distribuída entre os lotes precisa totalizar{' '}
                            {totalTargetKg} kg. (Diferença: {diff > 0 ? `+${diff}` : diff} kg)
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs">Observações do Consumo</Label>
              <Input
                placeholder="Opcional"
                value={consumptionForm.notes}
                onChange={(e) => setConsumptionForm({ ...consumptionForm, notes: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              {consumptionEditing
                ? 'Salvar Alterações do Consumo'
                : 'Confirmar Consumo & Apropriar aos Lotes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!details} onOpenChange={(v) => !v && setDetails(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Detalhes</DialogTitle>
          </DialogHeader>
          {details && (
            <div className="space-y-2 text-xs">
              {Object.entries(details).map(([k, v]) => (
                <p key={k}>
                  <strong>{k}:</strong> {String(v)}
                </p>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deletingConsumption}
        onOpenChange={(v) => !v && setDeletingConsumption(null)}
        onConfirm={handleDeleteConsumption}
        title="Excluir lançamento de ração?"
        description="Esta ação removerá este lançamento e ajustará o estoque relacionado, quando aplicável."
      />
      <DeleteConfirmDialog
        open={!!deletingPurchase}
        onOpenChange={(v) => !v && setDeletingPurchase(null)}
        onConfirm={handleDeletePurchase}
        title="Excluir lançamento de ração?"
        description="Esta ação removerá este lançamento e ajustará o estoque relacionado, quando aplicável."
      />
      <DeleteConfirmDialog
        open={!!deletingRacao}
        onOpenChange={(v) => !v && setDeletingRacao(null)}
        onConfirm={handleDeleteRacao}
        title="Excluir lançamento de ração?"
        description="Esta ação removerá este lançamento e ajustará o estoque relacionado, quando aplicável."
      />
    </div>
  )
}
