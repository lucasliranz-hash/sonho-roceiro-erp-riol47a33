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
import { Textarea } from '@/components/ui/textarea'
import { useFarmStore } from '@/hooks/use-farm-store'
import { computeLotAccumulatedCostPerAnimal } from '@/lib/calculations'
import { SlaughterDestination, Slaughtering } from '@/types/farm'
import { toast } from '@/hooks/use-toast'

interface NovoAbateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingSlaughter?: Slaughtering | null
  onSuccess?: () => void
}

export function NovoAbateDialog({
  open,
  onOpenChange,
  editingSlaughter,
  onSuccess,
}: NovoAbateDialogProps) {
  const {
    lots,
    animals,
    expenses,
    feedLogs,
    vaccinations,
    treatments,
    addSlaughtering,
    updateSlaughtering,
  } = useFarmStore()

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [species, setSpecies] = useState('')
  const [selectedLotId, setSelectedLotId] = useState<string>('')
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('')
  const [quantityAnimals, setQuantityAnimals] = useState<string>('1')
  const [totalLiveWeightKg, setTotalLiveWeightKg] = useState<string>('')
  const [destination, setDestination] = useState<SlaughterDestination>('Consumo próprio')
  const [notes, setNotes] = useState('')

  // Campos adicionais quando destino for "Venda"
  const [saleQuantity, setSaleQuantity] = useState<string>('')
  const [saleTotalValue, setSaleTotalValue] = useState<string>('')
  const [saleCustomer, setSaleCustomer] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtra APENAS lotes ATIVOS (com aves vivas ou que sejam o lote em edição)
  const activeLots = useMemo(() => {
    return lots.filter((l) => {
      if (editingSlaughter && l.id === editingSlaughter.lotId) return true
      return l.status === 'Ativo' && (l.currentQuantity || 0) > 0
    })
  }, [lots, editingSlaughter])

  // Lote selecionado
  const selectedLot = useMemo(() => lots.find((l) => l.id === selectedLotId), [lots, selectedLotId])

  // Animais individualizados ativos vinculados ao lote (se houver) ou avulsos
  const availableAnimals = useMemo(() => {
    return animals.filter((a) => {
      if (editingSlaughter && a.id === editingSlaughter.animalId) return true
      return a.status === 'Ativo'
    })
  }, [animals, editingSlaughter])

  // Popula formulário ao abrir ou alterar editingSlaughter
  useEffect(() => {
    if (open) {
      if (editingSlaughter) {
        setDate(editingSlaughter.date)
        setSpecies(editingSlaughter.species || '')
        setSelectedLotId(editingSlaughter.lotId || '')
        setSelectedAnimalId(editingSlaughter.animalId || '')
        setQuantityAnimals(String(editingSlaughter.quantityAnimals || 1))
        setTotalLiveWeightKg(
          editingSlaughter.totalLiveWeightKg !== undefined &&
            editingSlaughter.totalLiveWeightKg !== null
            ? String(editingSlaughter.totalLiveWeightKg)
            : '',
        )
        setDestination(editingSlaughter.destination || 'Consumo próprio')
        setNotes(editingSlaughter.notes || '')

        const sSimple = editingSlaughter.saleSimple
        const sData = editingSlaughter.sale
        setSaleCustomer(sSimple?.customerName || sData?.customerName || '')
        setSaleDate(sSimple?.saleDate || sData?.saleDate || editingSlaughter.date)
        setSaleQuantity(
          sSimple?.quantitySold !== undefined
            ? String(sSimple.quantitySold)
            : sData?.quantityKg !== undefined
              ? String(sData.quantityKg)
              : String(editingSlaughter.quantityAnimals || 1),
        )
        setSaleTotalValue(
          sSimple?.totalValue !== undefined
            ? String(sSimple.totalValue)
            : sData?.totalPrice !== undefined
              ? String(sData.totalPrice)
              : editingSlaughter.revenue !== undefined
                ? String(editingSlaughter.revenue)
                : '',
        )
      } else {
        // Modo criação
        setDate(new Date().toISOString().split('T')[0])
        const defaultLot = activeLots[0]
        if (defaultLot) {
          setSelectedLotId(defaultLot.id)
          setSpecies(defaultLot.breed || defaultLot.type || 'Frango')
        } else {
          setSelectedLotId('')
          setSpecies('')
        }
        setSelectedAnimalId('')
        setQuantityAnimals('1')
        setTotalLiveWeightKg('')
        setDestination('Consumo próprio')
        setNotes('')
        setSaleCustomer('')
        setSaleDate(new Date().toISOString().split('T')[0])
        setSaleQuantity('1')
        setSaleTotalValue('')
      }
    }
  }, [open, editingSlaughter, activeLots])

  // Atualiza espécie automaticamente quando seleciona o lote (se nova seleção)
  const handleSelectLot = (lotId: string) => {
    setSelectedLotId(lotId)
    const lot = lots.find((l) => l.id === lotId)
    if (lot) {
      setSpecies(lot.breed || lot.type || 'Frango')
    }
  }

  // Se selecionar animal individual, ajusta espécie e peso opcionalmente
  const handleSelectAnimal = (animalId: string) => {
    setSelectedAnimalId(animalId)
    if (animalId) {
      const animal = animals.find((a) => a.id === animalId)
      if (animal) {
        if (animal.breed) setSpecies(animal.breed)
        if (animal.weightKg && !totalLiveWeightKg) {
          setTotalLiveWeightKg(String(animal.weightKg))
        }
      }
      setQuantityAnimals('1')
    }
  }

  // Custo acumulado do Lote usando cálculos já existentes no SR Gestão
  const lotCostCalculation = useMemo(() => {
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

  // Custo unitário de produção por ave viva
  const unitCost = useMemo(() => {
    if (lotCostCalculation) {
      return lotCostCalculation.costPerBirdAlive || 0
    }
    return 0
  }, [lotCostCalculation])

  const parsedQty = Math.max(1, parseInt(quantityAnimals, 10) || 1)

  // Custo total dos animais abatidos (unitCost * quantidade)
  const totalAnimalsCost = useMemo(() => {
    return Number((unitCost * parsedQty).toFixed(2))
  }, [unitCost, parsedQty])

  // Saldo restante no lote após o abate
  const remainingInLot = useMemo(() => {
    if (!selectedLot) return 0
    const baseQty = selectedLot.currentQuantity || 0
    if (editingSlaughter && editingSlaughter.lotId === selectedLot.id) {
      const restored = baseQty + (editingSlaughter.quantityAnimals || 0)
      return Math.max(0, restored - parsedQty)
    }
    return Math.max(0, baseQty - parsedQty)
  }, [selectedLot, editingSlaughter, parsedQty])

  // Saldo máximo permitido para o lote
  const maxAllowedQty = useMemo(() => {
    if (!selectedLot) return 9999
    const baseQty = selectedLot.currentQuantity || 0
    if (editingSlaughter && editingSlaughter.lotId === selectedLot.id) {
      return baseQty + (editingSlaughter.quantityAnimals || 0)
    }
    return baseQty
  }, [selectedLot, editingSlaughter])

  // Resultado da venda (se venda): Valor da Venda - Custo dos Abatidos
  const saleVal = parseFloat(saleTotalValue) || 0
  const saleResult = useMemo(() => {
    if (destination !== 'Venda') return 0
    return Number((saleVal - totalAnimalsCost).toFixed(2))
  }, [destination, saleVal, totalAnimalsCost])

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date) {
      toast({ title: 'Atenção', description: 'Informe a data do abate.', variant: 'destructive' })
      return
    }
    if (!selectedLotId) {
      toast({
        title: 'Atenção',
        description: 'Selecione o lote ativo de origem.',
        variant: 'destructive',
      })
      return
    }
    if (parsedQty <= 0) {
      toast({
        title: 'Atenção',
        description: 'A quantidade deve ser maior que zero.',
        variant: 'destructive',
      })
      return
    }
    if (selectedLot && parsedQty > maxAllowedQty) {
      toast({
        title: 'Quantidade excede o lote',
        description: `O lote possui apenas ${maxAllowedQty} aves vivas disponíveis.`,
        variant: 'destructive',
      })
      return
    }

    if (destination === 'Venda' && saleVal <= 0) {
      toast({
        title: 'Valor da venda obrigatório',
        description: 'Informe o valor total da venda para o abate comercial.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const weightParsed = parseFloat(totalLiveWeightKg)
      const validLiveWeight = !isNaN(weightParsed) && weightParsed > 0 ? weightParsed : undefined

      const selectedAnimal = animals.find((a) => a.id === selectedAnimalId)

      const payload: Omit<Slaughtering, 'id'> = {
        date,
        species: species || selectedLot?.breed || 'Frango',
        lotId: selectedLotId,
        lotName: selectedLot?.name,
        animalId: selectedAnimalId || undefined,
        animalCode: selectedAnimal?.code || undefined,
        quantityAnimals: parsedQty,
        totalLiveWeightKg: validLiveWeight,
        averageLiveWeightKg: validLiveWeight
          ? Number((validLiveWeight / parsedQty).toFixed(2))
          : undefined,
        destination,
        unitProductionCost: unitCost,
        accumulatedProductionCost: totalAnimalsCost,
        totalCost: totalAnimalsCost,
        notes: notes.trim() || undefined,
        revenue: destination === 'Venda' ? saleVal : undefined,
        netProfit: destination === 'Venda' ? saleResult : undefined,
        saleSimple:
          destination === 'Venda'
            ? {
                customerName: saleCustomer.trim() || undefined,
                saleDate: saleDate || date,
                quantitySold: parseFloat(saleQuantity) || parsedQty,
                totalValue: saleVal,
                paymentMethod: 'Pix',
                isPaid: true,
                notes: notes.trim() || undefined,
              }
            : undefined,
      }

      if (editingSlaughter) {
        const { error } = await updateSlaughtering(editingSlaughter.id, payload)
        if (error) {
          toast({
            title: 'Erro ao atualizar abate',
            description: error.message || 'Falha ao salvar dados.',
            variant: 'destructive',
          })
          return
        }
        toast({
          title: 'Abate atualizado com sucesso! 🥩',
          description: `Registro #${editingSlaughter.id} e saldos atualizados.`,
        })
      } else {
        const { error } = await addSlaughtering(payload)
        if (error) {
          toast({
            title: 'Erro ao registrar abate',
            description: error.message || 'Falha ao salvar dados.',
            variant: 'destructive',
          })
          return
        }
        toast({
          title: 'Abate registrado com sucesso! 🥩',
          description:
            destination === 'Venda'
              ? `${parsedQty} ave(s) baixada(s) do lote e receita lançada no financeiro.`
              : `${parsedQty} ave(s) baixada(s) do lote para consumo próprio.`,
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      toast({
        title: 'Erro inesperado',
        description: err.message || 'Falha ao processar operação.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            🥩 {editingSlaughter ? 'Editar Abate' : 'Novo Abate'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
          {/* Lote e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <Label className="text-xs">Lote Ativo de Origem *</Label>
              {activeLots.length === 0 ? (
                <div className="text-[11px] text-rose-600 p-2 rounded-xl bg-rose-50 border border-rose-200 mt-1">
                  Nenhum lote ativo com aves vivas.
                </div>
              ) : (
                <Select value={selectedLotId} onValueChange={handleSelectLot}>
                  <SelectTrigger className="h-9 text-xs rounded-xl mt-1">
                    <SelectValue placeholder="Selecione o lote ativo" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeLots.map((l) => (
                      <SelectItem key={l.id} value={l.id} className="text-xs">
                        {l.code} — {l.name} ({l.currentQuantity} vivas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Espécie e Quantidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Espécie / Categoria</Label>
              <Input
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="Ex: Frango Caipira"
                className="h-9 text-xs rounded-xl mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Quantidade Abatida *</Label>
              <Input
                type="number"
                min="1"
                max={maxAllowedQty || undefined}
                value={quantityAnimals}
                onChange={(e) => setQuantityAnimals(e.target.value)}
                className="h-9 text-xs rounded-xl mt-1 font-bold"
                required
              />
              {selectedLot && (
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Vivas no lote: <strong>{maxAllowedQty}</strong> → ficará com:{' '}
                  <strong className={remainingInLot === 0 ? 'text-amber-600' : 'text-emerald-700'}>
                    {remainingInLot}
                  </strong>
                </span>
              )}
            </div>
          </div>

          {/* Identificação Individual (opcional) & Peso Vivo (opcional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Identificação Individual (Opcional)</Label>
              <Select value={selectedAnimalId} onValueChange={handleSelectAnimal}>
                <SelectTrigger className="h-9 text-xs rounded-xl mt-1">
                  <SelectValue placeholder="Nenhum (baixa por quantidade)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    Nenhum (apenas quantidade)
                  </SelectItem>
                  {availableAnimals.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      #{a.code} — {a.breed} ({a.sex})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Peso Vivo Total (kg) — Opcional</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 5.4"
                value={totalLiveWeightKg}
                onChange={(e) => setTotalLiveWeightKg(e.target.value)}
                className="h-9 text-xs rounded-xl mt-1"
              />
            </div>
          </div>

          {/* Destino: Apenas Consumo Próprio ou Venda */}
          <div>
            <Label className="text-xs">Destino do Abate *</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                type="button"
                variant={destination === 'Consumo próprio' ? 'default' : 'outline'}
                className="h-10 text-xs rounded-xl font-semibold"
                onClick={() => setDestination('Consumo próprio')}
              >
                🍽️ Consumo próprio
              </Button>
              <Button
                type="button"
                variant={destination === 'Venda' ? 'default' : 'outline'}
                className="h-10 text-xs rounded-xl font-semibold"
                onClick={() => setDestination('Venda')}
              >
                💰 Venda
              </Button>
            </div>
          </div>

          {/* Bloco de Custo dos Animais Abatidos (Custo acumulado do lote) */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Custo de Produção por Ave:</span>
              <span className="font-semibold text-foreground">R$ {unitCost.toFixed(2)} / ave</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="font-bold text-foreground">Custo dos Animais Abatidos:</span>
              <strong className="text-sm font-extrabold text-rose-600">
                R$ {totalAnimalsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <p className="text-[10px] text-muted-foreground pt-0.5">
              Calculado pelo custo acumulado de produção do lote ({parsedQty} x R${' '}
              {unitCost.toFixed(2)}). Não gera nova despesa financeira de produção.
            </p>
          </div>

          {/* Se Destino for VENDA: campos mínimos necessários */}
          {destination === 'Venda' && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950">Dados da Venda Comercial</span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Gera receita no Financeiro
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-xs">Valor Total da Venda (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 150.00"
                    value={saleTotalValue}
                    onChange={(e) => setSaleTotalValue(e.target.value)}
                    className="h-9 text-xs rounded-xl mt-1 font-bold bg-white"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-xs">Cliente / Comprador (Opcional)</Label>
                  <Input
                    placeholder="Ex: Restaurante do Zé"
                    value={saleCustomer}
                    onChange={(e) => setSaleCustomer(e.target.value)}
                    className="h-9 text-xs rounded-xl mt-1 bg-white"
                  />
                </div>

                <div>
                  <Label className="text-xs">Qtd. Vendida</Label>
                  <Input
                    type="number"
                    min="1"
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(e.target.value)}
                    className="h-9 text-xs rounded-xl mt-1 bg-white"
                  />
                </div>
              </div>

              {/* Resultado simples = Valor da Venda - Custo dos animais */}
              <div className="p-2.5 rounded-xl bg-white border border-emerald-200/70 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Resultado apurado (Venda − Custo):</span>
                <strong
                  className={`text-sm ${saleResult >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                >
                  R$ {saleResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <Label className="text-xs">Observações (Opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre o abate..."
              className="text-xs rounded-xl mt-1 min-h-[60px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-1/2 rounded-xl h-10 text-xs"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-1/2 rounded-xl h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-white"
              disabled={isSubmitting || activeLots.length === 0}
            >
              {isSubmitting
                ? 'Salvando...'
                : editingSlaughter
                  ? 'Salvar Alterações'
                  : 'Registrar Abate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
export default NovoAbateDialog
