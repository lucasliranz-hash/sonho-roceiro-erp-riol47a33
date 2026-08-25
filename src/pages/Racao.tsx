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
import { Wheat, Plus, ArrowDown, Package, DollarSign } from 'lucide-react'
import { FeedConsumption, FeedPurchase, InventoryItem } from '@/types/farm'

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
  const [consumptionForm, setConsumptionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    inventoryItemId: '',
    quantityKg: '',
    destinationType: 'geral' as 'lote' | 'atividade' | 'geral',
    lotId: '',
    activityId: '',
    notes: '',
  })

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
    setConsumptionForm({
      date: new Date().toISOString().split('T')[0],
      inventoryItemId: racaoItems[0]?.id || '',
      quantityKg: '',
      destinationType: 'geral',
      lotId: '',
      activityId: '',
      notes: '',
    })
    setConsumptionOpen(true)
  }

  const openConsumptionEdit = (c: FeedConsumption) => {
    setConsumptionEditing(c)
    setConsumptionForm({
      date: c.date,
      inventoryItemId: c.inventoryItemId || racaoItems[0]?.id || '',
      quantityKg: String(c.quantityKg),
      destinationType: (c.destinationType as any) || (c.lotId ? 'lote' : 'geral'),
      lotId: c.lotId || '',
      activityId: c.activityId || '',
      notes: c.notes || '',
    })
    setConsumptionOpen(true)
  }

  const handleConsumptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const item = racaoItems.find((i) => i.id === consumptionForm.inventoryItemId)
      const lot = lots.find((l) => l.id === consumptionForm.lotId)
      const activity = activities.find((a) => a.id === consumptionForm.activityId)
      const qty = Number(consumptionForm.quantityKg) || 0
      const costPerKg = item?.averageCost || 0

      const data: any = {
        date: consumptionForm.date,
        lotId: consumptionForm.destinationType === 'lote' ? consumptionForm.lotId : '',
        lotName: consumptionForm.destinationType === 'lote' && lot ? lot.name : '',
        activityId:
          consumptionForm.destinationType === 'atividade' ||
          consumptionForm.destinationType === 'lote'
            ? consumptionForm.activityId
            : '',
        activityName: activity ? activity.name : '',
        destinationType: consumptionForm.destinationType,
        quantityKg: qty,
        inventoryItemId: consumptionForm.inventoryItemId,
        inventoryItemName: item?.name || '',
        costPerKg,
        notes: consumptionForm.notes,
      }

      if (consumptionEditing) {
        const { error } = await updateFeedConsumption(consumptionEditing.id, data)
        if (error) throw new Error(error.message)
        toast({ title: 'Consumo atualizado! ✅', description: 'Estoque recalculado.' })
      } else {
        const { error } = await addFeedConsumption(data)
        if (error) throw new Error(error.message)
        toast({ title: 'Consumo registrado! ✅', description: `Estoque -${qty} kg` })
      }
      setConsumptionOpen(false)
      setConsumptionEditing(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
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
          <h2 className="text-base font-bold mb-3">Histórico de Consumo</h2>
          <div className="space-y-2">
            {consumptions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum consumo registrado.
              </p>
            )}
            {consumptions.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold">{f.inventoryItemName || f.lotName || 'Consumo'}</p>
                  <p className="text-muted-foreground">
                    {f.date} •{' '}
                    {f.destinationType === 'lote'
                      ? `Lote: ${f.lotName}`
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
                      R$ {f.totalCost.toFixed(2)}{' '}
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
            ))}
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
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {consumptionEditing ? 'Editar Consumo' : 'Registrar Consumo'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              O destino pode ser Lote, Atividade ou Uso geral.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConsumptionSubmit} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={consumptionForm.date}
                onChange={(e) => setConsumptionForm({ ...consumptionForm, date: e.target.value })}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Ração</Label>
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
                      {i.name} (Atual: {i.currentStock} {i.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Quantidade consumida (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 12"
                value={consumptionForm.quantityKg}
                onChange={(e) =>
                  setConsumptionForm({ ...consumptionForm, quantityKg: e.target.value })
                }
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Destino</Label>
              <Select
                value={consumptionForm.destinationType}
                onValueChange={(v) =>
                  setConsumptionForm({
                    ...consumptionForm,
                    destinationType: v as typeof consumptionForm.destinationType,
                  })
                }
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral" className="text-xs">
                    Uso geral / Outro
                  </SelectItem>
                  <SelectItem value="atividade" className="text-xs">
                    Atividade
                  </SelectItem>
                  <SelectItem value="lote" className="text-xs">
                    Lote
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(consumptionForm.destinationType === 'lote' ||
              consumptionForm.destinationType === 'atividade') && (
              <div>
                <Label className="text-xs">Atividade</Label>
                <Select
                  value={consumptionForm.activityId}
                  onValueChange={(v) => setConsumptionForm({ ...consumptionForm, activityId: v })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Selecionar atividade (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {consumptionForm.destinationType === 'lote' && (
              <div>
                <Label className="text-xs">Lote *</Label>
                <Select
                  value={consumptionForm.lotId}
                  onValueChange={(v) => setConsumptionForm({ ...consumptionForm, lotId: v })}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Selecionar lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((l) => (
                      <SelectItem key={l.id} value={l.id} className="text-xs">
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Observação</Label>
              <Input
                value={consumptionForm.notes}
                onChange={(e) => setConsumptionForm({ ...consumptionForm, notes: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              {consumptionEditing ? 'Salvar Alterações' : 'Registrar Consumo'}
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
