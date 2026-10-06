import { useState, useMemo, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  Plus,
  Trash2,
  DollarSign,
  Egg as EggIcon,
  Sparkles,
  Truck,
  Building,
} from 'lucide-react'
import { Incubation, IncubationEgg, IncubationStatus } from '@/types/farm'
import { generateNextIncubationCode, generateEggsBatch } from '@/lib/incubation-service'
import { toast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingIncubations: Incubation[]
  properties: Array<{ id: string; name: string }>
  currentPropertyId?: string
  onSave: (incubation: Partial<Incubation>) => Promise<{ error: any; data?: any }>
}

interface EggBatchDraft {
  id: string
  prefix: string
  quantity: number
  breed: string
  motherCode: string
  fatherCode: string
  origin: string
}

export function NovaChocadaDialog({
  open,
  onOpenChange,
  existingIncubations,
  properties,
  currentPropertyId,
  onSave,
}: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [code, setCode] = useState('')
  const [propertyId, setPropertyId] = useState(currentPropertyId || '')
  const [receivedDate, setReceivedDate] = useState(today)
  const [startDate, setStartDate] = useState(today)
  const [eggsReceivedCount, setEggsReceivedCount] = useState<number | ''>(30)
  const [incubatedCount, setIncubatedCount] = useState<number | ''>(30)
  const [origin, setOrigin] = useState<'Produção própria' | 'Ovos adquiridos' | 'Outra'>(
    'Produção própria',
  )
  const [breed, setBreed] = useState('GSB')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<IncubationStatus>('Em incubação')

  // Ovos adquiridos
  const [supplier, setSupplier] = useState('')
  const [supplierCity, setSupplierCity] = useState('')
  const [supplierState, setSupplierState] = useState('')
  const [eggCost, setEggCost] = useState<number | ''>(0)
  const [freightCost, setFreightCost] = useState<number | ''>(0)
  const [otherAcquisitionCosts, setOtherAcquisitionCosts] = useState<number | ''>(0)

  // Geração de ovos individuais em lotes
  const [createIndividualEggs, setCreateIndividualEggs] = useState(true)
  const [batches, setBatches] = useState<EggBatchDraft[]>([
    {
      id: 'batch-1',
      prefix: 'G',
      quantity: 30,
      breed: 'GSB',
      motherCode: '',
      fatherCode: '',
      origin: 'Produção própria',
    },
  ])

  const [submitting, setSubmitting] = useState(false)

  // Gerar código automático quando abre
  useEffect(() => {
    if (open) {
      const nextCode = generateNextIncubationCode(existingIncubations, startDate)
      setCode(nextCode)
      setPropertyId(currentPropertyId || (properties[0]?.id ?? ''))
      setReceivedDate(today)
      setStartDate(today)
      setEggsReceivedCount(30)
      setIncubatedCount(30)
      setOrigin('Produção própria')
      setBreed('GSB')
      setNotes('')
      setStatus('Em incubação')
      setSupplier('')
      setSupplierCity('')
      setSupplierState('')
      setEggCost(0)
      setFreightCost(0)
      setOtherAcquisitionCosts(0)
      setCreateIndividualEggs(true)
      setBatches([
        {
          id: 'batch-1',
          prefix: 'G',
          quantity: 30,
          breed: 'GSB',
          motherCode: '',
          fatherCode: '',
          origin: 'Produção própria',
        },
      ])
    }
  }, [open, existingIncubations, currentPropertyId, properties, startDate, today])

  const totalBatchEggs = useMemo(() => {
    return batches.reduce((acc, b) => acc + (Number(b.quantity) || 0), 0)
  }, [batches])

  const handleAddBatch = () => {
    const nextIdx = batches.length + 1
    setBatches((prev) => [
      ...prev,
      {
        id: `batch-${Date.now()}`,
        prefix: `P${nextIdx}`,
        quantity: 5,
        breed: breed || 'Mestiça',
        motherCode: '',
        fatherCode: '',
        origin: origin,
      },
    ])
  }

  const handleRemoveBatch = (id: string) => {
    if (batches.length <= 1) return
    setBatches((prev) => prev.filter((b) => b.id !== id))
  }

  const handleUpdateBatch = (id: string, updates: Partial<EggBatchDraft>) => {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  const totalAcquisitionCost =
    (Number(eggCost) || 0) + (Number(freightCost) || 0) + (Number(otherAcquisitionCosts) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code) {
      toast({ title: 'Código obrigatório', variant: 'destructive' })
      return
    }

    const recCount = Number(eggsReceivedCount) || 0
    const incCount = Number(incubatedCount) || 0

    if (incCount <= 0) {
      toast({
        title: 'Quantidade incubada inválida',
        description: 'Informe ao menos 1 ovo incubado.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    // Gerar lista de ovos individuais se marcado
    let generatedEggs: IncubationEgg[] = []
    if (createIndividualEggs) {
      let currentNumber = 1
      for (const b of batches) {
        const qty = Number(b.quantity) || 0
        if (qty > 0) {
          const eggsFromBatch = generateEggsBatch({
            quantity: qty,
            prefix: b.prefix || 'G',
            startIndex: currentNumber,
            origin: b.origin || origin,
            breed: b.breed || breed,
            motherCode: b.motherCode,
            fatherCode: b.fatherCode,
            entryDate: startDate || today,
          })
          generatedEggs = [...generatedEggs, ...eggsFromBatch]
          currentNumber += qty
        }
      }
    }

    const payload: Partial<Incubation> = {
      code,
      propertyId: propertyId || undefined,
      receivedDate,
      startDate,
      eggsReceivedCount: recCount > 0 ? recCount : incCount,
      incubatedCount: incCount,
      eggCount: incCount,
      origin,
      breed,
      notes,
      status,
      incubatorName: 'Chocadeira SR',
      eggCost: totalAcquisitionCost,
      supplier: origin === 'Ovos adquiridos' ? supplier : 'Produção Própria',
      supplierCity: origin === 'Ovos adquiridos' ? supplierCity : undefined,
      supplierState: origin === 'Ovos adquiridos' ? supplierState : undefined,
      freightCost: Number(freightCost) || 0,
      otherAcquisitionCosts: Number(otherAcquisitionCosts) || 0,
      targetTemp: 37.7,
      targetHumidity: 55,
      autoTurning: true,
      expectedHatchDate: new Date(new Date(startDate).getTime() + 21 * 86400000)
        .toISOString()
        .split('T')[0],
      eggs: generatedEggs,
    }

    const res = await onSave(payload)
    setSubmitting(false)

    if (res?.error) {
      toast({
        title: 'Erro ao criar chocada',
        description: res.error.message || 'Falha ao salvar no banco.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Chocada criada com sucesso! 🥚',
      description: `${code} cadastrada com ${incCount} ovos (${generatedEggs.length} ovos rastreados).`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" /> Nova Chocada
          </DialogTitle>
          <DialogDescription className="text-xs">
            Inicie uma nova incubação com controle de origem e geração de ovos individuais.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Identificação Geral */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Dados da Chocada
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Código da Chocada *</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: SR-2610-01"
                  className="h-10 text-xs rounded-xl font-mono font-bold bg-white"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Propriedade</Label>
                <Select value={propertyId} onValueChange={setPropertyId}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                    <SelectValue placeholder="Selecione a propriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Recebimento dos Ovos</Label>
                <Input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white"
                />
              </div>
              <div>
                <Label className="text-xs">Início da Incubação *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Status Inicial</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as IncubationStatus)}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em incubação">Em incubação</SelectItem>
                    <SelectItem value="Aguardando incubação">Aguardando incubação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Ovos Recebidos</Label>
                <Input
                  type="number"
                  min={1}
                  value={eggsReceivedCount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value)
                    setEggsReceivedCount(val)
                    if (incubatedCount === '' || incubatedCount === 0) {
                      setIncubatedCount(val)
                    }
                  }}
                  placeholder="30"
                  className="h-10 text-xs rounded-xl bg-white"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-orange-700">
                  Efetivamente Incubados *
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={incubatedCount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value)
                    setIncubatedCount(val)
                    if (batches.length === 1 && typeof val === 'number') {
                      handleUpdateBatch(batches[0].id, { quantity: val })
                    }
                  }}
                  placeholder="30"
                  className="h-10 text-xs rounded-xl bg-white border-orange-300 font-bold"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Raça / Genética Principal</Label>
                <Input
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="Ex: GSB, Índio Gigante..."
                  className="h-10 text-xs rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 text-amber-900">
              💡 <strong>Regra zootécnica:</strong> A fertilidade real só é apurada durante a
              ovoscopia. Não informe ovos férteis na entrada da chocada.
            </div>
          </div>

          {/* Origem e Custos de Aquisição */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-primary" /> Origem & Custos de Entrada
              </span>
              <Badge variant="outline" className="text-[10px]">
                {origin}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Origem dos Ovos</Label>
                <Select
                  value={origin}
                  onValueChange={(v) =>
                    setOrigin(v as 'Produção própria' | 'Ovos adquiridos' | 'Outra')
                  }
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Produção própria">Produção própria</SelectItem>
                    <SelectItem value="Ovos adquiridos">Ovos adquiridos</SelectItem>
                    <SelectItem value="Outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Fornecedor / Criatório</Label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder={
                    origin === 'Produção própria' ? 'Galinheiro sede' : 'Ex: Criatório Sonho Real'
                  }
                  className="h-10 text-xs rounded-xl bg-white"
                />
              </div>
            </div>

            {origin === 'Ovos adquiridos' && (
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Cidade de Origem</Label>
                    <Input
                      value={supplierCity}
                      onChange={(e) => setSupplierCity(e.target.value)}
                      placeholder="Ex: Guarabira"
                      className="h-10 text-xs rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Estado / UF</Label>
                    <Input
                      value={supplierState}
                      onChange={(e) => setSupplierState(e.target.value)}
                      placeholder="Ex: PB"
                      maxLength={2}
                      className="h-10 text-xs rounded-xl bg-white uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Valor dos Ovos (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={eggCost}
                      onChange={(e) =>
                        setEggCost(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="0,00"
                      className="h-10 text-xs rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Frete (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={freightCost}
                      onChange={(e) =>
                        setFreightCost(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="0,00"
                      className="h-10 text-xs rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Outros Custos (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={otherAcquisitionCosts}
                      onChange={(e) =>
                        setOtherAcquisitionCosts(
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                      placeholder="0,00"
                      className="h-10 text-xs rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs flex justify-between items-center text-emerald-950 font-bold">
                  <span>Custo total de entrada:</span>
                  <span>R$ {totalAcquisitionCost.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Geração de Ovos Individuais da Chocada */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <EggIcon className="w-3.5 h-3.5 text-primary" /> Ovos da Chocada (Rastreabilidade)
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Gere identificadores individuais (G01..G30, P01..P05) com genética e pais.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddBatch}
                className="h-8 text-xs rounded-xl bg-white gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Bloco
              </Button>
            </div>

            <div className="space-y-2.5">
              {batches.map((b, idx) => (
                <div
                  key={b.id}
                  className="p-3 rounded-2xl bg-white border border-border shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-[11px]">Bloco #{idx + 1}</span>
                    {batches.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveBatch(b.id)}
                        className="h-6 w-6 text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Prefixo</Label>
                      <Input
                        value={b.prefix}
                        onChange={(e) =>
                          handleUpdateBatch(b.id, { prefix: e.target.value.toUpperCase() })
                        }
                        placeholder="Ex: G, P, GSB"
                        className="h-8 text-xs rounded-lg font-mono font-bold"
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Quantidade</Label>
                      <Input
                        type="number"
                        min={1}
                        value={b.quantity}
                        onChange={(e) =>
                          handleUpdateBatch(b.id, {
                            quantity: Number(e.target.value) || 0,
                          })
                        }
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px] text-muted-foreground">Genética / Raça</Label>
                      <Input
                        value={b.breed}
                        onChange={(e) => handleUpdateBatch(b.id, { breed: e.target.value })}
                        placeholder="Ex: Mestiça Pintada × GSB"
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">
                        Matriz / Mãe (opcional)
                      </Label>
                      <Input
                        value={b.motherCode}
                        onChange={(e) => handleUpdateBatch(b.id, { motherCode: e.target.value })}
                        placeholder="Ex: Matriz Pintada 03"
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">
                        Reprodutor / Pai (opcional)
                      </Label>
                      <Input
                        value={b.fatherCode}
                        onChange={(e) => handleUpdateBatch(b.id, { fatherCode: e.target.value })}
                        placeholder="Ex: Galo GSB 01"
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-primary/5 border border-primary/20 text-primary">
              <span>Total de ovos individuais a gerar:</span>
              <span className="font-bold">{totalBatchEggs} ovos</span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Observações da Chocada</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações gerais..."
              className="text-xs rounded-xl min-h-[50px] bg-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-xl text-xs"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-primary text-white text-xs font-semibold gap-1.5"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              {submitting ? 'Salvando...' : 'Iniciar Chocada'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
