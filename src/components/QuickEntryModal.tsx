import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFarmStore } from '@/hooks/use-farm-store'
import { toast } from '@/hooks/use-toast'
import {
  DollarSign,
  Wheat,
  Scale,
  Skull,
  Egg,
  ShoppingCart,
  Flame,
  Briefcase,
  Package,
} from 'lucide-react'

interface QuickEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialActionType?: string | null
}

type QuickActionType =
  | 'despesa'
  | 'racao'
  | 'pesagem'
  | 'mortalidade'
  | 'ovos'
  | 'venda'
  | 'chocadeira'
  | 'investimento'
  | 'estoque'
  | null

const DRAFT_KEY = 'sonho_roceiro_quick_draft'

export function QuickEntryModal({ open, onOpenChange, initialActionType }: QuickEntryModalProps) {
  const [actionType, setActionType] = useState<QuickActionType>(null)
  const {
    lots,
    inventory,
    addExpense,
    addFeedConsumption,
    addWeighing,
    addMortality,
    addEggProduction,
    addSale,
    addIncubation,
    addStructure,
    addInventoryItem,
  } = useFarmStore()

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedLotId, setSelectedLotId] = useState<string>(lots[0]?.id || '')

  const [expCategory, setExpCategory] = useState<'Ração' | 'Medicamentos' | 'Outros'>('Ração')
  const [expDesc, setExpDesc] = useState('')
  const [expQty, setExpQty] = useState('1')
  const [expUnitVal, setExpUnitVal] = useState('')

  const [feedQty, setFeedQty] = useState('')
  const [feedItemId, setFeedItemId] = useState(inventory[0]?.id || '')

  const [weighQty, setWeighQty] = useState('10')
  const [totalWeight, setTotalWeight] = useState('')

  const [mortQty, setMortQty] = useState('1')
  const [mortCause, setMortCause] = useState('Aparentemente natural')

  const [collected, setCollected] = useState('')
  const [broken, setBroken] = useState('0')

  const [saleProduct, setSaleProduct] = useState<'Ovos' | 'Frangos vivos' | 'Pintinhos'>('Ovos')
  const [saleCustomer, setSaleCustomer] = useState('')
  const [saleQty, setSaleQty] = useState('')
  const [saleUnitPrice, setSaleUnitPrice] = useState('')

  const [incEggCount, setIncEggCount] = useState('30')
  const [incBreed, setIncBreed] = useState('Caipira')

  const [invDescription, setInvDescription] = useState('')
  const [invCategory, setInvCategory] = useState<
    'Equipamentos' | 'Chocadeira' | 'Estruturas' | 'Outros'
  >('Equipamentos')
  const [invValue, setInvValue] = useState('')

  const [stkName, setStkName] = useState('')
  const [stkCategory, setStkCategory] = useState<
    | 'Ração'
    | 'Milho'
    | 'Farelos'
    | 'Medicamentos'
    | 'Vacinas'
    | 'Maravalha'
    | 'Embalagens'
    | 'Insumos'
    | 'Outros'
  >('Ração')
  const [stkUnit, setStkUnit] = useState('KG')
  const [stkQty, setStkQty] = useState('')
  const [stkMinStock, setStkMinStock] = useState('')
  const [stkCost, setStkCost] = useState('')

  const prevOpenRef = useRef(false)

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      if (initialActionType) {
        setActionType(initialActionType as QuickActionType)
      } else {
        try {
          const draft = localStorage.getItem(DRAFT_KEY)
          if (draft) {
            const data = JSON.parse(draft)
            if (data.actionType) {
              setActionType(data.actionType)
              if (data.date) setDate(data.date)
              if (data.selectedLotId) setSelectedLotId(data.selectedLotId)
              if (data.expCategory) setExpCategory(data.expCategory)
              if (data.expDesc) setExpDesc(data.expDesc)
              if (data.expUnitVal) setExpUnitVal(data.expUnitVal)
              if (data.feedQty) setFeedQty(data.feedQty)
              if (data.weighQty) setWeighQty(data.weighQty)
              if (data.totalWeight) setTotalWeight(data.totalWeight)
              if (data.mortQty) setMortQty(data.mortQty)
              if (data.mortCause) setMortCause(data.mortCause)
              if (data.collected) setCollected(data.collected)
              if (data.saleQty) setSaleQty(data.saleQty)
              if (data.saleUnitPrice) setSaleUnitPrice(data.saleUnitPrice)
              if (data.saleCustomer) setSaleCustomer(data.saleCustomer)
              if (data.stkName) setStkName(data.stkName)
              if (data.stkQty) setStkQty(data.stkQty)
              if (data.stkCost) setStkCost(data.stkCost)
            }
          }
        } catch {
          /* ignore */
        }
      }
    }
    prevOpenRef.current = open
  }, [open, initialActionType])

  useEffect(() => {
    if (open && actionType) {
      const draft = {
        actionType,
        date,
        selectedLotId,
        expCategory,
        expDesc,
        expUnitVal,
        feedQty,
        weighQty,
        totalWeight,
        mortQty,
        mortCause,
        collected,
        saleQty,
        saleUnitPrice,
        saleCustomer,
        stkName,
        stkQty,
        stkCost,
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    }
  }, [
    open,
    actionType,
    date,
    selectedLotId,
    expCategory,
    expDesc,
    expUnitVal,
    feedQty,
    weighQty,
    totalWeight,
    mortQty,
    mortCause,
    collected,
    saleQty,
    saleUnitPrice,
    saleCustomer,
    stkName,
    stkQty,
    stkCost,
  ])

  const resetForm = () => {
    setActionType(null)
    setExpDesc('')
    setExpUnitVal('')
    setFeedQty('')
    setTotalWeight('')
    setCollected('')
    setSaleQty('')
    setSaleUnitPrice('')
    setInvDescription('')
    setInvValue('')
    setStkName('')
    setStkQty('')
    setStkCost('')
    localStorage.removeItem(DRAFT_KEY)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetLot = lots.find((l) => l.id === selectedLotId) || lots[0]

    const handleError = (error: any) => {
      if (error) {
        toast({
          title: 'Erro ao salvar ❌',
          description: error?.message || 'Falha na operação. Verifique sua conexão.',
          variant: 'destructive',
        })
        return true
      }
      return false
    }

    switch (actionType) {
      case 'despesa': {
        const { error } = await addExpense({
          date,
          category: expCategory,
          description: expDesc || `Despesa rápida ${expCategory}`,
          lotId: targetLot?.id,
          lotName: targetLot?.name,
          quantity: Number(expQty) || 1,
          unitValue: Number(expUnitVal) || 0,
          supplier: 'Geral',
          paymentMethod: 'Pix',
          isPaid: true,
        })
        if (handleError(error)) return
        toast({
          title: 'Lançado com sucesso! ✅',
          description: 'Despesa registrada no financeiro.',
        })
        break
      }
      case 'racao': {
        const invItem = inventory.find((i) => i.id === feedItemId)
        const { error } = await addFeedConsumption({
          date,
          lotId: targetLot?.id || '',
          lotName: targetLot?.name || '',
          quantityKg: Number(feedQty) || 0,
          inventoryItemId: feedItemId,
          costPerKg: invItem?.averageCost || 3.0,
        })
        if (handleError(error)) return
        toast({
          title: 'Lançado com sucesso! ✅',
          description: 'Consumo de ração computado e estoque reduzido.',
        })
        break
      }
      case 'pesagem': {
        const { error } = await addWeighing({
          date,
          lotId: targetLot?.id || '',
          lotName: targetLot?.name || '',
          weighedCount: Number(weighQty) || 10,
          totalWeightKg: Number(totalWeight) || 0,
          ageDays: 30,
        })
        if (handleError(error)) return
        toast({
          title: 'Lançado com sucesso! ✅',
          description: 'Peso médio e amostragem calculados.',
        })
        break
      }
      case 'mortalidade': {
        const { error } = await addMortality({
          date,
          lotId: targetLot?.id || '',
          lotName: targetLot?.name || '',
          quantity: Number(mortQty) || 1,
          cause: mortCause,
        })
        if (handleError(error)) return
        toast({
          title: 'Lançado com sucesso! ✅',
          description: 'Mortalidade atualizada e lote decrementado.',
        })
        break
      }
      case 'ovos': {
        const { error } = await addEggProduction({
          date,
          lotId: targetLot?.id || '',
          lotName: targetLot?.name || '',
          collected: Number(collected) || 0,
          broken: Number(broken) || 0,
          consumed: 0,
          sold: 0,
          incubated: 0,
          discarded: 0,
        })
        if (handleError(error)) return
        toast({ title: 'Lançado com sucesso! ✅', description: 'Coleta diária de ovos salva.' })
        break
      }
      case 'venda': {
        const { error } = await addSale({
          date,
          customerName: saleCustomer || 'Cliente Avulso',
          product: saleProduct,
          lotId: targetLot?.id,
          lotName: targetLot?.name,
          quantity: Number(saleQty) || 1,
          unitPrice: Number(saleUnitPrice) || 0,
          paymentMethod: 'Pix',
          isPaid: true,
        })
        if (handleError(error)) return
        toast({ title: 'Lançado com sucesso! ✅', description: 'Venda e receita geradas.' })
        break
      }
      case 'chocadeira': {
        const { error } = await addIncubation({
          startDate: date,
          eggCount: Number(incEggCount) || 30,
          origin: 'Produção Própria',
          supplier: 'Galinheiro Principal',
          breed: incBreed,
          eggCost: 45,
          incubatorName: 'Chocadeira Principal',
          targetTemp: 37.7,
          targetHumidity: 55,
          autoTurning: true,
          expectedHatchDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
        })
        if (handleError(error)) return
        toast({
          title: 'Lançado com sucesso! ✅',
          description: 'Nova incubação iniciada (21 dias).',
        })
        break
      }
      case 'investimento': {
        const { error } = await addStructure({
          date,
          category: invCategory,
          description: invDescription || `Investimento em ${invCategory}`,
          quantity: 1,
          unit: 'unid',
          unitValue: Number(invValue) || 0,
          supplier: 'Fornecedor Local',
          paymentMethod: 'Pix',
          isPaid: true,
          center: 'Patrimônio',
        })
        if (handleError(error)) return
        toast({
          title: 'Investimento registrado! 🏗️',
          description: 'Bem patrimonial adicionado ao CAPEX.',
        })
        break
      }
      case 'estoque': {
        const { error } = await addInventoryItem({
          name: stkName || 'Novo Item',
          category: stkCategory,
          unit: stkUnit,
          currentStock: Number(stkQty) || 0,
          minStock: Number(stkMinStock) || 0,
          averageCost: Number(stkCost) || 0,
        })
        if (handleError(error)) return
        toast({ title: 'Item adicionado! 📦', description: 'Novo item registrado no estoque.' })
        break
      }
    }

    handleClose()
  }

  const actions = [
    {
      type: 'despesa' as const,
      label: 'Despesa',
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      type: 'racao' as const,
      label: 'Ração',
      icon: Wheat,
      color: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      type: 'pesagem' as const,
      label: 'Pesagem',
      icon: Scale,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      type: 'mortalidade' as const,
      label: 'Mortalidade',
      icon: Skull,
      color: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      type: 'ovos' as const,
      label: 'Coleta de Ovos',
      icon: Egg,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    {
      type: 'venda' as const,
      label: 'Venda',
      icon: ShoppingCart,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      type: 'chocadeira' as const,
      label: 'Chocadeira',
      icon: Flame,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    {
      type: 'investimento' as const,
      label: 'Investimento',
      icon: Briefcase,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    {
      type: 'estoque' as const,
      label: 'Estoque',
      icon: Package,
      color: 'bg-teal-100 text-teal-800 border-teal-200',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            ✨ Novo Lançamento Rápido
          </DialogTitle>
          <DialogDescription className="text-xs">
            Selecione o tipo de ação para registrar em menos de 20 segundos.
          </DialogDescription>
        </DialogHeader>

        {!actionType ? (
          <div className="grid grid-cols-2 gap-3 my-2">
            {actions.map((act) => {
              const Icon = act.icon
              return (
                <button
                  key={act.type}
                  type="button"
                  onClick={() => setActionType(act.type)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${act.color}`}
                >
                  <div className="p-2 rounded-xl bg-white/80 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold">{act.label}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Lançando: {actionType.toUpperCase()}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActionType(null)}
                className="h-7 text-xs"
              >
                ← Voltar
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Data</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Lote</Label>
                <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Escolha um lote" />
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
            </div>

            {actionType === 'despesa' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Select
                      value={expCategory}
                      onValueChange={(v) => setExpCategory(v as typeof expCategory)}
                    >
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ração">Ração</SelectItem>
                        <SelectItem value="Medicamentos">Medicamentos</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Valor Total (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expUnitVal}
                      onChange={(e) => setExpUnitVal(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Descrição rápida</Label>
                  <Input
                    placeholder="Ex: Compra de vacinas"
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </>
            )}

            {actionType === 'racao' && (
              <>
                <div>
                  <Label className="text-xs">Quantidade Servida (KG)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 12.5"
                    value={feedQty}
                    onChange={(e) => setFeedQty(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Item do Estoque</Label>
                  <Select value={feedItemId} onValueChange={setFeedItemId}>
                    <SelectTrigger className="h-10 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map((i) => (
                        <SelectItem key={i.id} value={i.id} className="text-xs">
                          {i.name} (Atual: {i.currentStock}
                          {i.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {actionType === 'pesagem' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Aves Pesadas</Label>
                  <Input
                    type="number"
                    value={weighQty}
                    onChange={(e) => setWeighQty(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Peso Total (KG)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 14.2"
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
              </div>
            )}

            {actionType === 'mortalidade' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Aves Mortas</Label>
                  <Input
                    type="number"
                    min="1"
                    value={mortQty}
                    onChange={(e) => setMortQty(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Provável Causa</Label>
                  <Input
                    placeholder="Ex: Calor"
                    value={mortCause}
                    onChange={(e) => setMortCause(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
            )}

            {actionType === 'ovos' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-amber-700">Ovos Coletados 🥚</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 85"
                    value={collected}
                    onChange={(e) => setCollected(e.target.value)}
                    className="h-10 text-xs rounded-xl border-amber-300"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Quebrados/Perdidos</Label>
                  <Input
                    type="number"
                    value={broken}
                    onChange={(e) => setBroken(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
            )}

            {actionType === 'venda' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Produto</Label>
                    <Select
                      value={saleProduct}
                      onValueChange={(v) => setSaleProduct(v as typeof saleProduct)}
                    >
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ovos">Ovos</SelectItem>
                        <SelectItem value="Frangos vivos">Frangos Vivos</SelectItem>
                        <SelectItem value="Pintinhos">Pintinhos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Cliente</Label>
                    <Input
                      placeholder="Nome do comprador"
                      value={saleCustomer}
                      onChange={(e) => setSaleCustomer(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      value={saleQty}
                      onChange={(e) => setSaleQty(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Preço Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={saleUnitPrice}
                      onChange={(e) => setSaleUnitPrice(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {actionType === 'chocadeira' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Qtd de Ovos Incubados</Label>
                  <Input
                    type="number"
                    value={incEggCount}
                    onChange={(e) => setIncEggCount(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Raça / Linhagem</Label>
                  <Input
                    value={incBreed}
                    onChange={(e) => setIncBreed(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
            )}

            {actionType === 'investimento' && (
              <>
                <div>
                  <Label className="text-xs">O que foi comprado?</Label>
                  <Input
                    placeholder="Ex: Chocadeira 120 ovos"
                    value={invDescription}
                    onChange={(e) => setInvDescription(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Select
                      value={invCategory}
                      onValueChange={(v) => setInvCategory(v as typeof invCategory)}
                    >
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                        <SelectItem value="Chocadeira">Chocadeira</SelectItem>
                        <SelectItem value="Estruturas">Estruturas</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={invValue}
                      onChange={(e) => setInvValue(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {actionType === 'estoque' && (
              <>
                <div>
                  <Label className="text-xs">Nome do Item</Label>
                  <Input
                    placeholder="Ex: Ração Inicial 25kg"
                    value={stkName}
                    onChange={(e) => setStkName(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Select
                      value={stkCategory}
                      onValueChange={(v) => setStkCategory(v as typeof stkCategory)}
                    >
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ração">Ração</SelectItem>
                        <SelectItem value="Milho">Milho</SelectItem>
                        <SelectItem value="Farelos">Farelos</SelectItem>
                        <SelectItem value="Medicamentos">Medicamentos</SelectItem>
                        <SelectItem value="Vacinas">Vacinas</SelectItem>
                        <SelectItem value="Maravalha">Maravalha</SelectItem>
                        <SelectItem value="Insumos">Insumos</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Unidade</Label>
                    <Select value={stkUnit} onValueChange={setStkUnit}>
                      <SelectTrigger className="h-10 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="unid">unid</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="saco">saco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Qtd Atual</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={stkQty}
                      onChange={(e) => setStkQty(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Estoque Mín</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={stkMinStock}
                      onChange={(e) => setStkMinStock(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Custo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={stkCost}
                      onChange={(e) => setStkCost(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md mt-2"
            >
              Salvar Lançamento ✨
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
