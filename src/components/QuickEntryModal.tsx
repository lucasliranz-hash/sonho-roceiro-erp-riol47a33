import { useState } from 'react'
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
import { DollarSign, Wheat, Scale, Skull, Egg, ShoppingCart, Flame, Briefcase } from 'lucide-react'

interface QuickEntryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  | null

export function QuickEntryModal({ open, onOpenChange }: QuickEntryModalProps) {
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
  } = useFarmStore()

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedLotId, setSelectedLotId] = useState<string>(lots[0]?.id || '')

  // Expense states
  const [expCategory, setExpCategory] = useState<'Ração' | 'Medicamentos' | 'Outros'>('Ração')
  const [expDesc, setExpDesc] = useState('')
  const [expQty, setExpQty] = useState('1')
  const [expUnitVal, setExpUnitVal] = useState('')

  // Feed states
  const [feedQty, setFeedQty] = useState('')
  const [feedItemId, setFeedItemId] = useState(inventory[0]?.id || '')

  // Weighing states
  const [weighQty, setWeighQty] = useState('10')
  const [totalWeight, setTotalWeight] = useState('')

  // Mortality states
  const [mortQty, setMortQty] = useState('1')
  const [mortCause, setMortCause] = useState('Aparentemente natural')

  // Egg states
  const [collected, setCollected] = useState('')
  const [broken, setBroken] = useState('0')

  // Sale states
  const [saleProduct, setSaleProduct] = useState<'Ovos' | 'Frangos vivos' | 'Pintinhos'>('Ovos')
  const [saleCustomer, setSaleCustomer] = useState('')
  const [saleQty, setSaleQty] = useState('')
  const [saleUnitPrice, setSaleUnitPrice] = useState('')

  // Incubation states
  const [incEggCount, setIncEggCount] = useState('30')
  const [incBreed, setIncBreed] = useState('Caipira')

  const [invDescription, setInvDescription] = useState('')
  const [invCategory, setInvCategory] = useState<
    'Equipamentos' | 'Chocadeira' | 'Estruturas' | 'Outros'
  >('Equipamentos')
  const [invValue, setInvValue] = useState('')

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
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetLot = lots.find((l) => l.id === selectedLotId) || lots[0]

    if (actionType === 'despesa') {
      addExpense({
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
      toast({ title: 'Lançado com sucesso! ✅', description: 'Despesa registrada no financeiro.' })
    } else if (actionType === 'racao') {
      const invItem = inventory.find((i) => i.id === feedItemId)
      addFeedConsumption({
        date,
        lotId: targetLot?.id || '',
        lotName: targetLot?.name || '',
        quantityKg: Number(feedQty) || 0,
        inventoryItemId: feedItemId,
        costPerKg: invItem?.averageCost || 3.0,
      })
      toast({
        title: 'Lançado com sucesso! ✅',
        description: 'Consumo de ração computado e estoque reduzido.',
      })
    } else if (actionType === 'pesagem') {
      addWeighing({
        date,
        lotId: targetLot?.id || '',
        lotName: targetLot?.name || '',
        weighedCount: Number(weighQty) || 10,
        totalWeightKg: Number(totalWeight) || 0,
        ageDays: 30,
      })
      toast({
        title: 'Lançado com sucesso! ✅',
        description: 'Peso médio e amostragem calculados.',
      })
    } else if (actionType === 'mortalidade') {
      addMortality({
        date,
        lotId: targetLot?.id || '',
        lotName: targetLot?.name || '',
        quantity: Number(mortQty) || 1,
        cause: mortCause,
      })
      toast({
        title: 'Lançado com sucesso! ✅',
        description: 'Mortalidade atualizada e lote decrementado.',
      })
    } else if (actionType === 'ovos') {
      addEggProduction({
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
      toast({ title: 'Lançado com sucesso! ✅', description: 'Coleta diária de ovos salva.' })
    } else if (actionType === 'venda') {
      addSale({
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
      toast({ title: 'Lançado com sucesso! ✅', description: 'Venda e receita geradas.' })
    } else if (actionType === 'chocadeira') {
      addIncubation({
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
      toast({ title: 'Lançado com sucesso! ✅', description: 'Nova incubação iniciada (21 dias).' })
    } else if (actionType === 'investimento') {
      addStructure({
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
      toast({
        title: 'Investimento registrado! 🏗️',
        description: 'Bem patrimonial adicionado ao CAPEX.',
      })
    }

    handleClose()
  }

  const actions = [
    {
      type: 'despesa',
      label: 'Despesa',
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      type: 'racao',
      label: 'Ração',
      icon: Wheat,
      color: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      type: 'pesagem',
      label: 'Pesagem',
      icon: Scale,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      type: 'mortalidade',
      label: 'Mortalidade',
      icon: Skull,
      color: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      type: 'ovos',
      label: 'Coleta de Ovos',
      icon: Egg,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    {
      type: 'venda',
      label: 'Venda',
      icon: ShoppingCart,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      type: 'chocadeira',
      label: 'Chocadeira',
      icon: Flame,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    {
      type: 'investimento',
      label: 'Investimento',
      icon: Briefcase,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl p-6">
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
                  onClick={() => setActionType(act.type as QuickActionType)}
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
                <div className="p-2 rounded-xl bg-emerald-50 text-[11px] text-emerald-800 font-medium">
                  💡 Para qual criação? Selecione o lote acima. Se for um gasto geral, escolha
                  qualquer lote.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Select value={expCategory} onValueChange={(v) => setExpCategory(v as any)}>
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
                  <Label className="text-xs">Peso Total da Amostra (KG)</Label>
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
                  <Label className="text-xs">Quantidade de Aves Mortas</Label>
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
                    placeholder="Ex: Calor / Adaptação"
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
                  <Label className="text-xs font-bold text-amber-700">Ovos Coletados Hoje 🥚</Label>
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
                  <Label className="text-xs">Ovos Quebrados/Perdidos</Label>
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
                    <Select value={saleProduct} onValueChange={(v) => setSaleProduct(v as any)}>
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
                <div className="p-2 rounded-xl bg-indigo-50 text-[11px] text-indigo-800 font-medium">
                  💡 Este é um investimento (CAPEX), não um custo de criação. Será registrado como
                  patrimônio.
                </div>
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
                    <Select value={invCategory} onValueChange={(v) => setInvCategory(v as any)}>
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
