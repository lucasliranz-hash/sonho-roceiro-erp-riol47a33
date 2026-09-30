import { useState, useMemo, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Scale,
  Sparkles,
  ArrowRight,
  Calculator,
} from 'lucide-react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { computeLotAccumulatedCostPerAnimal } from '@/lib/calculations'
import {
  SlaughterCostCategory,
  SlaughterCostItem,
  SlaughterDestination,
  SlaughterSubproduct,
  SubproductType,
  SubproductDestination,
} from '@/types/farm'
import { toast } from '@/hooks/use-toast'

interface NovoAbateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const COST_CATEGORIES: SlaughterCostCategory[] = [
  'Mão de obra',
  'Abate/frigorífico',
  'Transporte',
  'Taxas',
  'Embalagem',
  'Gelo/refrigeração',
  'Outros custos',
]

const SUBPRODUCT_TYPES: SubproductType[] = [
  'Miúdos',
  'Pés',
  'Cabeça',
  'Pele',
  'Ossos',
  'Vísceras',
  'Outros',
]

const SUBPRODUCT_DESTINATIONS: SubproductDestination[] = [
  'Aproveitamento próprio',
  'Venda',
  'Descarte',
]

const SPECIES_OPTIONS = [
  'Frango Caipira',
  'Frango de Corte',
  'Galinha',
  'Galo',
  'Pato',
  'Peru',
  'Codornas',
  'Suíno',
  'Ovino',
  'Caprino',
  'Outro',
]

export function NovoAbateDialog({ open, onOpenChange }: NovoAbateDialogProps) {
  const { lots, animals, expenses, feedLogs, vaccinations, treatments, addSlaughtering } =
    useFarmStore()

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [species, setSpecies] = useState('Frango Caipira')
  const [sourceMode, setSourceMode] = useState<'lot' | 'animal'>('lot')
  const [selectedLotId, setSelectedLotId] = useState<string>('')
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('')
  const [quantityAnimals, setQuantityAnimals] = useState<string>('1')

  // Pesos
  const [totalLiveWeightKg, setTotalLiveWeightKg] = useState<string>('')
  const [carcassWeightKg, setCarcassWeightKg] = useState<string>('')

  // Destino
  const [destination, setDestination] = useState<SlaughterDestination>('Consumo próprio')

  // Custos do abate
  const [costs, setCosts] = useState<SlaughterCostItem[]>([
    {
      id: 'cost-1',
      description: 'Abate e evisceração',
      category: 'Abate/frigorífico',
      amount: 0,
    },
  ])

  // Subprodutos (opcionais para preparo futuro)
  const [showSubproducts, setShowSubproducts] = useState(false)
  const [subproducts, setSubproducts] = useState<SlaughterSubproduct[]>([])

  // Dados da Venda (se destination === 'Venda')
  const [saleCustomer, setSaleCustomer] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [saleQtyKg, setSaleQtyKg] = useState('')
  const [salePricePerKg, setSalePricePerKg] = useState('')
  const [saleTotalPrice, setSaleTotalPrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Pix')
  const [paymentStatus, setPaymentStatus] = useState<'Pendente' | 'Pago'>('Pago')
  const [saleNotes, setSaleNotes] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')

  // Confirmation view / step
  const [isReviewing, setIsReviewing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Quando seleciona o primeiro lote disponível ao abrir
  useEffect(() => {
    if (open && !selectedLotId && lots.length > 0) {
      const activeLot = lots.find((l) => (l.currentQuantity || 0) > 0) || lots[0]
      setSelectedLotId(activeLot.id)
    }
  }, [open, lots, selectedLotId])

  // Quando muda o peso da carcaça e o destino for venda, sugere a quantidade vendida em kg = carcaça
  useEffect(() => {
    if (carcassWeightKg && destination === 'Venda' && !saleQtyKg) {
      setSaleQtyKg(carcassWeightKg)
    }
  }, [carcassWeightKg, destination, saleQtyKg])

  // Autocalcular total da venda se informado Qtd e Preço por kg
  const handleSaleQtyChange = (val: string) => {
    setSaleQtyKg(val)
    const q = parseFloat(val)
    const p = parseFloat(salePricePerKg)
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setSaleTotalPrice((q * p).toFixed(2))
    }
  }

  const handleSalePriceChange = (val: string) => {
    setSalePricePerKg(val)
    const p = parseFloat(val)
    const q = parseFloat(saleQtyKg)
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setSaleTotalPrice((q * p).toFixed(2))
    }
  }

  // Lote selecionado
  const selectedLot = useMemo(() => lots.find((l) => l.id === selectedLotId), [lots, selectedLotId])

  // Animal selecionado
  const selectedAnimal = useMemo(
    () => animals.find((a) => a.id === selectedAnimalId),
    [animals, selectedAnimalId],
  )

  // Cálculo de custo acumulado do Lote usando a regra de custos já existente no SR Gestão
  const lotAccumulatedCostSummary = useMemo(() => {
    if (!selectedLot) return null

    const sanitaryApps = [
      ...vaccinations
        .filter((v) => v.lot_id === selectedLot.id && v.status === 'performed')
        .map((v) => ({
          id: v.id,
          lot_id: v.lot_id,
          date: v.performed_date || '',
          name: v.vaccine_name,
          type: 'vaccination' as const,
          total_cost: Number(v.total_cost || 0),
          status: v.status,
        })),
      ...treatments
        .filter((t) => t.lot_id === selectedLot.id && t.status === 'completed')
        .map((t) => ({
          id: t.id,
          lot_id: t.lot_id,
          date: t.start_date || '',
          name: t.medication_name,
          type: 'treatment' as const,
          total_cost: Number(t.total_cost || 0),
          status: t.status,
        })),
    ]

    return computeLotAccumulatedCostPerAnimal(selectedLot, expenses, feedLogs, sanitaryApps)
  }, [selectedLot, expenses, feedLogs, vaccinations, treatments])

  // Custo unitário de produção do animal antes do abate (R$)
  const unitProductionCost = useMemo(() => {
    if (sourceMode === 'lot') {
      return lotAccumulatedCostSummary?.costPerBirdAlive || 0
    } else {
      // Se for animal individual, usa o custo registrado ou proporção de peso
      return 0
    }
  }, [sourceMode, lotAccumulatedCostSummary])

  const parsedQtyAnimals = Math.max(1, parseInt(quantityAnimals, 10) || 1)
  const parsedTotalLiveWeight = parseFloat(totalLiveWeightKg) || 0
  const parsedCarcassWeight = parseFloat(carcassWeightKg) || 0

  // Peso vivo médio por animal
  const averageLiveWeight =
    parsedQtyAnimals > 0 && parsedTotalLiveWeight > 0 ? parsedTotalLiveWeight / parsedQtyAnimals : 0

  // Rendimento de carcaça: Peso da carcaça ÷ Peso vivo × 100
  const carcassYieldPercent =
    parsedTotalLiveWeight > 0 && parsedCarcassWeight > 0
      ? (parsedCarcassWeight / parsedTotalLiveWeight) * 100
      : 0

  // Custo operacional do abate = soma dos custos informados
  const slaughterOperationalCost = useMemo(() => {
    return costs.reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  }, [costs])

  // Custo de produção acumulado dos animais abatidos (sem duplicar custos de ração/manutenção)
  const accumulatedProductionCost = useMemo(() => {
    return Number((unitProductionCost * parsedQtyAnimals).toFixed(2))
  }, [unitProductionCost, parsedQtyAnimals])

  // Custo total da carne produzida = custo acumulado + custos do abate
  const totalSlaughterCost = useMemo(() => {
    return Number((accumulatedProductionCost + slaughterOperationalCost).toFixed(2))
  }, [accumulatedProductionCost, slaughterOperationalCost])

  // Custo por kg de carcaça = custo total ÷ peso da carcaça
  const costPerKgCarcass = useMemo(() => {
    return parsedCarcassWeight > 0
      ? Number((totalSlaughterCost / parsedCarcassWeight).toFixed(2))
      : 0
  }, [totalSlaughterCost, parsedCarcassWeight])

  // Resultados econômicos (se venda)
  const saleRevenue = useMemo(() => {
    if (destination !== 'Venda') return 0
    const explicit = parseFloat(saleTotalPrice)
    if (!isNaN(explicit) && explicit > 0) return explicit
    const q = parseFloat(saleQtyKg)
    const p = parseFloat(salePricePerKg)
    if (!isNaN(q) && !isNaN(p)) return Number((q * p).toFixed(2))
    return 0
  }, [destination, saleTotalPrice, saleQtyKg, salePricePerKg])

  const saleNetProfit = useMemo(() => {
    if (destination !== 'Venda') return 0
    return Number((saleRevenue - totalSlaughterCost).toFixed(2))
  }, [destination, saleRevenue, totalSlaughterCost])

  const saleMarginPercent = useMemo(() => {
    if (destination !== 'Venda' || saleRevenue <= 0) return 0
    return Number(((saleNetProfit / saleRevenue) * 100).toFixed(2))
  }, [destination, saleNetProfit, saleRevenue])

  // Funções de manipulação de custos do abate
  const handleAddCost = () => {
    setCosts((prev) => [
      ...prev,
      {
        id: `cost-${Date.now()}`,
        description: '',
        category: 'Outros custos',
        amount: 0,
      },
    ])
  }

  const handleUpdateCost = (id: string, field: keyof SlaughterCostItem, value: any) => {
    setCosts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const handleRemoveCost = (id: string) => {
    setCosts((prev) => prev.filter((c) => c.id !== id))
  }

  // Funções de manipulação de subprodutos
  const handleAddSubproduct = () => {
    setSubproducts((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}`,
        type: 'Miúdos',
        destination: 'Aproveitamento próprio',
        quantityKg: 0,
      },
    ])
  }

  const handleRemoveSubproduct = (id: string) => {
    setSubproducts((prev) => prev.filter((s) => s.id !== id))
  }

  const handleUpdateSubproduct = (id: string, field: keyof SlaughterSubproduct, value: any) => {
    setSubproducts((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  // Validação antes do resumo
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault()

    if (!date) {
      toast({ title: 'Atenção', description: 'Informe a data do abate.', variant: 'destructive' })
      return
    }
    if (sourceMode === 'lot' && !selectedLotId) {
      toast({ title: 'Atenção', description: 'Selecione o lote a abater.', variant: 'destructive' })
      return
    }
    if (parsedQtyAnimals <= 0) {
      toast({
        title: 'Atenção',
        description: 'Quantidade de animais deve ser maior que 0.',
        variant: 'destructive',
      })
      return
    }
    if (parsedTotalLiveWeight <= 0) {
      toast({
        title: 'Atenção',
        description: 'Informe o peso vivo total em kg.',
        variant: 'destructive',
      })
      return
    }
    if (parsedCarcassWeight <= 0) {
      toast({
        title: 'Atenção',
        description: 'Informe o peso da carcaça total em kg.',
        variant: 'destructive',
      })
      return
    }
    if (destination === 'Venda') {
      if (!saleCustomer.trim()) {
        toast({
          title: 'Atenção',
          description: 'Informe o cliente/comprador.',
          variant: 'destructive',
        })
        return
      }
      if (saleRevenue <= 0) {
        toast({
          title: 'Atenção',
          description: 'Informe o valor da venda ou quantidade e preço/kg.',
          variant: 'destructive',
        })
        return
      }
    }

    setIsReviewing(true)
  }

  // Salvar Abate definitivo
  const handleConfirmSlaughter = async () => {
    try {
      setIsSubmitting(true)

      const payload = {
        date,
        species,
        lotId: sourceMode === 'lot' ? selectedLotId : undefined,
        lotName: sourceMode === 'lot' ? selectedLot?.name : undefined,
        animalId: sourceMode === 'animal' ? selectedAnimalId : undefined,
        animalCode: sourceMode === 'animal' ? selectedAnimal?.code : undefined,
        quantityAnimals: parsedQtyAnimals,
        totalLiveWeightKg: parsedTotalLiveWeight,
        averageLiveWeightKg: Number(averageLiveWeight.toFixed(2)),
        carcassWeightKg: parsedCarcassWeight,
        carcassYieldPercent: Number(carcassYieldPercent.toFixed(2)),
        destination,
        costs: costs.filter((c) => Number(c.amount) > 0 || c.description.trim() !== ''),
        slaughterOperationalCost,
        accumulatedProductionCost,
        totalCost: totalSlaughterCost,
        costPerCarcassKg: costPerKgCarcass,
        revenue: destination === 'Venda' ? saleRevenue : undefined,
        netProfit: destination === 'Venda' ? saleNetProfit : undefined,
        marginPercent: destination === 'Venda' ? saleMarginPercent : undefined,
        sale:
          destination === 'Venda'
            ? {
                customerName: saleCustomer.trim(),
                saleDate,
                quantityKg: parseFloat(saleQtyKg) || parsedCarcassWeight,
                pricePerKg:
                  parseFloat(salePricePerKg) ||
                  saleRevenue / (parseFloat(saleQtyKg) || parsedCarcassWeight),
                totalPrice: saleRevenue,
                paymentMethod,
                paymentStatus,
                notes: saleNotes.trim() || undefined,
              }
            : undefined,
        subproducts: subproducts.length > 0 ? subproducts : undefined,
        notes: generalNotes.trim() || undefined,
      }

      const { error } = await addSlaughtering(payload)

      if (error) {
        toast({
          title: 'Erro ao registrar abate ❌',
          description: error.message || 'Falha na persistência dos dados.',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Abate registrado com sucesso! 🥩',
        description:
          destination === 'Venda'
            ? 'Estoque atualizado, carcaça adicionada e venda lançada no financeiro.'
            : 'Estoque do lote baixado e carcaça adicionada para consumo próprio.',
      })

      // Fecha e reseta
      onOpenChange(false)
      setIsReviewing(false)
      resetForm()
    } catch (err: any) {
      toast({
        title: 'Erro inesperado',
        description: err.message || 'Não foi possível salvar o abate.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0])
    setSpecies('Frango Caipira')
    setQuantityAnimals('1')
    setTotalLiveWeightKg('')
    setCarcassWeightKg('')
    setDestination('Consumo próprio')
    setCosts([
      {
        id: 'cost-1',
        description: 'Abate e evisceração',
        category: 'Abate/frigorífico',
        amount: 0,
      },
    ])
    setSubproducts([])
    setShowSubproducts(false)
    setSaleCustomer('')
    setSaleQtyKg('')
    setSalePricePerKg('')
    setSaleTotalPrice('')
    setSaleNotes('')
    setGeneralNotes('')
    setIsReviewing(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            🥩 {isReviewing ? 'Resumo do Abate' : 'Novo Lançamento de Abate'}
          </DialogTitle>
        </DialogHeader>

        {isReviewing ? (
          /* =================== RESUMO DO ABATE ANTES DE SALVAR =================== */
          <div className="space-y-5 animate-fade-in text-xs">
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground">
                  Identificação do Animal / Lote
                </span>
                <Badge
                  className={
                    destination === 'Venda'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }
                >
                  {destination}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-muted-foreground block">Origem</span>
                  <strong className="text-foreground">
                    {sourceMode === 'lot'
                      ? selectedLot
                        ? `${selectedLot.code} - ${selectedLot.name}`
                        : 'Lote não selecionado'
                      : selectedAnimal
                        ? `Animal #${selectedAnimal.code}`
                        : 'Animal avulso'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Espécie</span>
                  <strong className="text-foreground">{species}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Qtd Animais</span>
                  <strong className="text-foreground">{parsedQtyAnimals} aves</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Data do Abate</span>
                  <strong className="text-foreground">{date}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Peso Vivo Total</span>
                  <strong className="text-foreground">{parsedTotalLiveWeight} kg</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Peso Vivo Médio</span>
                  <strong className="text-foreground">{averageLiveWeight.toFixed(2)} kg</strong>
                </div>
              </div>
            </div>

            {/* Rendimento e Carcaça */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-900/70 block">Peso Total da Carcaça</span>
                  <span className="text-xl font-bold text-amber-950">{parsedCarcassWeight} kg</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-amber-900/70 block">Rendimento de Carcaça</span>
                  <span className="text-xl font-bold text-amber-900">
                    {carcassYieldPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-amber-800">
                Fórmula: ({parsedCarcassWeight} kg ÷ {parsedTotalLiveWeight} kg) × 100
              </p>
            </div>

            {/* Composição de Custos */}
            <div className="p-4 rounded-2xl bg-white border border-border space-y-2.5">
              <span className="font-bold text-foreground block">Custos e Formação de Preço</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Custo de Produção Acumulado ({parsedQtyAnimals}x R${' '}
                    {unitProductionCost.toFixed(2)})
                  </span>
                  <span className="font-semibold text-foreground">
                    R$ {accumulatedProductionCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custos Operacionais do Abate</span>
                  <span className="font-semibold text-foreground">
                    R$ {slaughterOperationalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-bold">
                  <span className="text-foreground">CUSTO TOTAL DA CARNE</span>
                  <span className="text-rose-600">R$ {totalSlaughterCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Custo por kg de carcaça</span>
                  <span className="font-bold text-foreground">
                    R$ {costPerKgCarcass.toFixed(2)} / kg
                  </span>
                </div>
              </div>
            </div>

            {/* Se Venda, mostra Resultado Econômico */}
            {destination === 'Venda' && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                <span className="font-bold text-emerald-950 block">
                  Resultado Econômico da Operação
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                    <span className="text-[10px] text-muted-foreground block">Receita Bruta</span>
                    <strong className="text-emerald-700 text-sm">
                      R$ {saleRevenue.toFixed(2)}
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                    <span className="text-[10px] text-muted-foreground block">Custo Total</span>
                    <strong className="text-rose-600 text-sm">
                      R$ {totalSlaughterCost.toFixed(2)}
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                    <span className="text-[10px] text-muted-foreground block">
                      Lucro / Prejuízo
                    </span>
                    <strong
                      className={`text-sm ${saleNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                    >
                      R$ {saleNetProfit.toFixed(2)}
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                    <span className="text-[10px] text-muted-foreground block">Margem Líquida</span>
                    <strong
                      className={`text-sm ${saleMarginPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                    >
                      {saleMarginPercent.toFixed(1)}%
                    </strong>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-900 pt-1">
                  Cliente: <strong>{saleCustomer}</strong> • Pagamento:{' '}
                  <strong>{paymentMethod}</strong> ({paymentStatus})
                </div>
              </div>
            )}

            {/* Aviso de ações automáticas */}
            <div className="p-3 rounded-xl bg-secondary text-[11px] text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-primary" /> Transformação de estoque
                automática:
              </span>
              <p>
                1. <strong>Baixa de {parsedQtyAnimals} animal(is)</strong> no lote{' '}
                {selectedLot?.name || 'selecionado'} (preservando histórico).
              </p>
              <p>
                2. <strong>Entrada de {parsedCarcassWeight} kg de carne</strong> no estoque com
                custo unitário de R$ {costPerKgCarcass.toFixed(2)}/kg.
              </p>
              {destination === 'Venda' ? (
                <p>
                  3. <strong>Registro da receita financeira</strong> de R$ {saleRevenue.toFixed(2)}{' '}
                  no módulo Financeiro e baixa da carne vendida.
                </p>
              ) : (
                <p>
                  3. <strong>Consumo próprio:</strong> nenhuma receita financeira será gerada.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-1/2 rounded-xl h-11 text-xs"
                onClick={() => setIsReviewing(false)}
                disabled={isSubmitting}
              >
                Voltar e Editar
              </Button>
              <Button
                type="button"
                className="w-1/2 rounded-xl h-11 text-xs font-bold bg-primary hover:bg-primary/90 text-white"
                onClick={handleConfirmSlaughter}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Abate ✨'}
              </Button>
            </div>
          </div>
        ) : (
          /* =================== FORMULÁRIO DO NOVO ABATE =================== */
          <form onSubmit={handleProceedToReview} className="space-y-4 text-xs">
            {/* 1. SELEÇÃO DO ANIMAL / LOTE */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">1. Identificação do Lote / Animal</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={sourceMode === 'lot' ? 'default' : 'outline'}
                    className="h-7 text-[11px] rounded-lg"
                    onClick={() => setSourceMode('lot')}
                  >
                    Por Lote
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={sourceMode === 'animal' ? 'default' : 'outline'}
                    className="h-7 text-[11px] rounded-lg"
                    onClick={() => setSourceMode('animal')}
                  >
                    Animal Individual
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Data do Abate *</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-9 text-xs rounded-xl mt-1"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs">Espécie / Produto</Label>
                  <Select value={species} onValueChange={setSpecies}>
                    <SelectTrigger className="h-9 text-xs rounded-xl mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIES_OPTIONS.map((sp) => (
                        <SelectItem key={sp} value={sp} className="text-xs">
                          {sp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sourceMode === 'lot' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Lote de Origem *</Label>
                    <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                      <SelectTrigger className="h-9 text-xs rounded-xl mt-1">
                        <SelectValue placeholder="Selecione o lote" />
                      </SelectTrigger>
                      <SelectContent>
                        {lots.map((l) => (
                          <SelectItem key={l.id} value={l.id} className="text-xs">
                            {l.code} — {l.name} ({l.currentQuantity} aves vivas)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Quantidade de Animais Abatidos *</Label>
                    <Input
                      type="number"
                      min="1"
                      max={selectedLot ? selectedLot.currentQuantity : undefined}
                      value={quantityAnimals}
                      onChange={(e) => setQuantityAnimals(e.target.value)}
                      className="h-9 text-xs rounded-xl mt-1"
                      required
                    />
                    {selectedLot && (
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        Saldo disponível no lote: {selectedLot.currentQuantity} aves
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Identificação do Animal *</Label>
                    <Select value={selectedAnimalId} onValueChange={setSelectedAnimalId}>
                      <SelectTrigger className="h-9 text-xs rounded-xl mt-1">
                        <SelectValue placeholder="Selecione o animal" />
                      </SelectTrigger>
                      <SelectContent>
                        {animals
                          .filter((a) => a.status === 'Ativo')
                          .map((a) => (
                            <SelectItem key={a.id} value={a.id} className="text-xs">
                              #{a.code} — {a.breed} ({a.sex}, {a.weightKg}kg)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      value={quantityAnimals}
                      disabled
                      className="h-9 text-xs rounded-xl mt-1 bg-muted"
                    />
                  </div>
                </div>
              )}

              {/* Informação do custo acumulado do lote lido do sistema */}
              {sourceMode === 'lot' && selectedLot && (
                <div className="p-3 rounded-xl bg-white border border-border/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Custo de Produção Acumulado no Lote
                    </span>
                    <span className="font-bold text-foreground">
                      R$ {(unitProductionCost * parsedQtyAnimals).toFixed(2)} (R${' '}
                      {unitProductionCost.toFixed(2)} / ave)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                    Sem duplicar custos
                  </Badge>
                </div>
              )}
            </div>

            {/* 2. PESAGEM & RENDIMENTO */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
              <span className="font-bold text-foreground block">
                2. Pesagem e Rendimento de Carcaça
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Peso Vivo Total (kg) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 2.80"
                    value={totalLiveWeightKg}
                    onChange={(e) => setTotalLiveWeightKg(e.target.value)}
                    className="h-9 text-xs rounded-xl mt-1"
                    required
                  />
                  {averageLiveWeight > 0 && (
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Média por animal: <strong>{averageLiveWeight.toFixed(2)} kg</strong>
                    </span>
                  )}
                </div>

                <div>
                  <Label className="text-xs">Peso da Carcaça Total (kg) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 2.10"
                    value={carcassWeightKg}
                    onChange={(e) => setCarcassWeightKg(e.target.value)}
                    className="h-9 text-xs rounded-xl mt-1"
                    required
                  />
                  {carcassYieldPercent > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 mt-0.5 block">
                      Rendimento calculado: {carcassYieldPercent.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. DESTINO DO ABATE */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">3. Destino do Abate *</span>
                <span className="text-[10px] text-muted-foreground">Campo obrigatório</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDestination('Consumo próprio')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    destination === 'Consumo próprio'
                      ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-xs'
                      : 'bg-white border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <p className="font-bold text-xs">🍽️ Consumo próprio</p>
                  <p className="text-[10px] mt-1 text-muted-foreground">
                    Carcaça entra no estoque para alimentação interna. Não gera receita.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDestination('Venda')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    destination === 'Venda'
                      ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'bg-white border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <p className="font-bold text-xs">💰 Venda comercial</p>
                  <p className="text-[10px] mt-1 text-muted-foreground">
                    Comercialização direta. Calcula margem, receita e gera venda no financeiro.
                  </p>
                </button>
              </div>
            </div>

            {/* 4. CUSTOS ESPECÍFICOS DO ABATE */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground">4. Custos do Abate</span>
                  <p className="text-[10px] text-muted-foreground">
                    Custos extras operacionais (mão de obra, gelo, transporte, taxas)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCost}
                  className="h-7 text-[11px] rounded-lg gap-1 border-primary/20 text-primary"
                >
                  <Plus className="w-3 h-3" /> Adicionar Custo
                </Button>
              </div>

              <div className="space-y-2">
                {costs.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-white border border-border flex items-center gap-2"
                  >
                    <div className="flex-1">
                      <Input
                        placeholder="Descrição (ex: Taxa do abatedouro)"
                        value={c.description}
                        onChange={(e) => handleUpdateCost(c.id, 'description', e.target.value)}
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                    <div className="w-40">
                      <Select
                        value={c.category}
                        onValueChange={(val) =>
                          handleUpdateCost(c.id, 'category', val as SlaughterCostCategory)
                        }
                      >
                        <SelectTrigger className="h-8 text-[11px] rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COST_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-xs">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="R$ 0,00"
                        value={c.amount || ''}
                        onChange={(e) =>
                          handleUpdateCost(c.id, 'amount', parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-xs rounded-lg font-semibold text-right"
                      />
                    </div>
                    {costs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCost(c.id)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2 px-1 text-xs">
                  <span className="text-muted-foreground">Total dos Custos do Abate:</span>
                  <span className="font-bold text-foreground">
                    R$ {slaughterOperationalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. SE VENDA: DADOS DA VENDA */}
            {destination === 'Venda' && (
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3 animate-fade-in">
                <span className="font-bold text-emerald-950 block">5. Dados da Venda</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Cliente / Comprador *</Label>
                    <Input
                      placeholder="Nome do cliente ou restaurante"
                      value={saleCustomer}
                      onChange={(e) => setSaleCustomer(e.target.value)}
                      className="h-9 text-xs rounded-xl mt-1 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Data da Venda</Label>
                    <Input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="h-9 text-xs rounded-xl mt-1 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[11px]">Qtd Vendida (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="kg"
                      value={saleQtyKg}
                      onChange={(e) => handleSaleQtyChange(e.target.value)}
                      className="h-9 text-xs rounded-xl mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Preço / kg (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="R$/kg"
                      value={salePricePerKg}
                      onChange={(e) => handleSalePriceChange(e.target.value)}
                      className="h-9 text-xs rounded-xl mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-emerald-900">
                      Total da Venda (R$) *
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Total R$"
                      value={saleTotalPrice}
                      onChange={(e) => setSaleTotalPrice(e.target.value)}
                      className="h-9 text-xs rounded-xl mt-1 bg-white font-bold text-emerald-700"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Forma de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-9 text-xs rounded-xl mt-1 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pix">Pix</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                        <SelectItem value="A Prazo">A Prazo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Status do Recebimento</Label>
                    <Select
                      value={paymentStatus}
                      onValueChange={(val: 'Pendente' | 'Pago') => setPaymentStatus(val)}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl mt-1 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pago">Pago / Recebido</SelectItem>
                        <SelectItem value="Pendente">Pendente / A Receber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SUBPRODUTOS (Opcional) */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground">Subprodutos do Abate</span>
                  <p className="text-[10px] text-muted-foreground">
                    Registro opcional de miúdos, pés, cabeça, etc.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubproducts(!showSubproducts)}
                  className="h-7 text-[11px] text-primary"
                >
                  {showSubproducts ? 'Ocultar' : 'Configurar subprodutos'}
                </Button>
              </div>

              {showSubproducts && (
                <div className="space-y-2 pt-2 animate-fade-in">
                  {subproducts.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-2.5 rounded-xl bg-white border border-border flex items-center gap-2"
                    >
                      <div className="w-32">
                        <Select
                          value={sub.type}
                          onValueChange={(v) =>
                            handleUpdateSubproduct(sub.id, 'type', v as SubproductType)
                          }
                        >
                          <SelectTrigger className="h-8 text-[11px] rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBPRODUCT_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-36">
                        <Select
                          value={sub.destination}
                          onValueChange={(v) =>
                            handleUpdateSubproduct(
                              sub.id,
                              'destination',
                              v as SubproductDestination,
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-[11px] rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBPRODUCT_DESTINATIONS.map((d) => (
                              <SelectItem key={d} value={d} className="text-xs">
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="kg"
                          value={sub.quantityKg || ''}
                          onChange={(e) =>
                            handleUpdateSubproduct(
                              sub.id,
                              'quantityKg',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 text-xs rounded-lg text-right"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSubproduct(sub.id)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSubproduct}
                    className="h-7 text-[11px] rounded-lg gap-1 border-dashed"
                  >
                    <Plus className="w-3 h-3" /> Adicionar subproduto
                  </Button>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <Label className="text-xs">Observações Gerais</Label>
              <Textarea
                placeholder="Detalhes sobre o frigorífico, qualidade da carcaça, condições sanitárias, etc."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="text-xs rounded-xl mt-1 resize-none h-16"
              />
            </div>

            {/* Botões do Fluxo */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-1/2 rounded-xl h-11 text-xs"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-1/2 rounded-xl h-11 text-xs font-bold bg-primary hover:bg-primary/90 text-white gap-2"
              >
                <span>Revisar Resultado</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
