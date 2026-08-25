import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DollarSign, Zap, Egg as EggIcon, Baby, AlertCircle } from 'lucide-react'
import { Incubation, IncubationStatus } from '@/types/farm'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  incubation: Incubation
  onSave: (updates: Partial<Incubation>) => Promise<{ error: any } | void>
}

export function IncubationEditDialog({ open, onOpenChange, incubation, onSave }: Props) {
  const [incubatorName, setIncubatorName] = useState(incubation.incubatorName)
  const [origin, setOrigin] = useState(incubation.origin)
  const [breed, setBreed] = useState(incubation.breed)
  const [supplier, setSupplier] = useState(incubation.supplier)
  const [eggCount, setEggCount] = useState(String(incubation.eggCount ?? ''))
  const [startDate, setStartDate] = useState(incubation.startDate)
  const [targetTemp, setTargetTemp] = useState(String(incubation.targetTemp ?? ''))
  const [targetHumidity, setTargetHumidity] = useState(String(incubation.targetHumidity ?? ''))
  const [autoTurning, setAutoTurning] = useState(incubation.autoTurning)
  const [notes, setNotes] = useState(incubation.notes || '')
  const [status, setStatus] = useState<IncubationStatus>(incubation.status)

  // Campos de eclosão (pós-finalização ou edição)
  const [hatchedCount, setHatchedCount] = useState(
    incubation.hatchedCount !== undefined ? String(incubation.hatchedCount) : '',
  )
  const [healthyChicks, setHealthyChicks] = useState(
    incubation.healthyChicks !== undefined ? String(incubation.healthyChicks) : '',
  )
  const [deaths, setDeaths] = useState(
    incubation.deaths !== undefined ? String(incubation.deaths) : '',
  )
  const [unhatchedCount, setUnhatchedCount] = useState(
    incubation.unhatchedCount !== undefined ? String(incubation.unhatchedCount) : '',
  )
  const [endDate, setEndDate] = useState(incubation.endDate || '')

  // Custos da incubação
  const [eggCost, setEggCost] = useState(String(incubation.eggCost ?? ''))
  const [eggCostPerUnit, setEggCostPerUnit] = useState(
    incubation.eggCostPerUnit !== undefined
      ? String(incubation.eggCostPerUnit)
      : incubation.eggCount && incubation.eggCost
        ? String((incubation.eggCost / incubation.eggCount).toFixed(2))
        : '',
  )
  const [energyStartKwh, setEnergyStartKwh] = useState(
    incubation.energyStartKwh !== undefined ? String(incubation.energyStartKwh) : '',
  )
  const [energyEndKwh, setEnergyEndKwh] = useState(
    incubation.energyEndKwh !== undefined ? String(incubation.energyEndKwh) : '',
  )
  const [energyTotalKwh, setEnergyTotalKwh] = useState(
    incubation.energyTotalKwh !== undefined ? String(incubation.energyTotalKwh) : '',
  )
  const [energyRatePerKwh, setEnergyRatePerKwh] = useState(
    incubation.energyRatePerKwh !== undefined ? String(incubation.energyRatePerKwh) : '',
  )
  const [energyCost, setEnergyCost] = useState(
    incubation.energyCost !== undefined ? String(incubation.energyCost) : '',
  )
  const [suppliesCost, setSuppliesCost] = useState(
    incubation.suppliesCost !== undefined ? String(incubation.suppliesCost) : '',
  )
  const [laborCost, setLaborCost] = useState(
    incubation.laborCost !== undefined ? String(incubation.laborCost) : '',
  )
  const [otherCosts, setOtherCosts] = useState(
    incubation.otherCosts !== undefined ? String(incubation.otherCosts) : '',
  )

  useEffect(() => {
    if (open) {
      setIncubatorName(incubation.incubatorName)
      setOrigin(incubation.origin)
      setBreed(incubation.breed)
      setSupplier(incubation.supplier)
      setEggCount(String(incubation.eggCount ?? ''))
      setStartDate(incubation.startDate)
      setTargetTemp(String(incubation.targetTemp ?? ''))
      setTargetHumidity(String(incubation.targetHumidity ?? ''))
      setAutoTurning(incubation.autoTurning)
      setNotes(incubation.notes || '')
      setStatus(incubation.status)

      // Eclosão
      setHatchedCount(incubation.hatchedCount !== undefined ? String(incubation.hatchedCount) : '')
      setHealthyChicks(
        incubation.healthyChicks !== undefined ? String(incubation.healthyChicks) : '',
      )
      setDeaths(incubation.deaths !== undefined ? String(incubation.deaths) : '')
      setUnhatchedCount(
        incubation.unhatchedCount !== undefined ? String(incubation.unhatchedCount) : '',
      )
      setEndDate(incubation.endDate || '')

      // Custos
      setEggCost(incubation.eggCost !== undefined ? String(incubation.eggCost) : '')
      setEggCostPerUnit(
        incubation.eggCostPerUnit !== undefined
          ? String(incubation.eggCostPerUnit)
          : incubation.eggCount && incubation.eggCost
            ? String((incubation.eggCost / incubation.eggCount).toFixed(2))
            : '',
      )
      setEnergyStartKwh(
        incubation.energyStartKwh !== undefined ? String(incubation.energyStartKwh) : '',
      )
      setEnergyEndKwh(incubation.energyEndKwh !== undefined ? String(incubation.energyEndKwh) : '')
      setEnergyTotalKwh(
        incubation.energyTotalKwh !== undefined ? String(incubation.energyTotalKwh) : '',
      )
      setEnergyRatePerKwh(
        incubation.energyRatePerKwh !== undefined ? String(incubation.energyRatePerKwh) : '',
      )
      setEnergyCost(incubation.energyCost !== undefined ? String(incubation.energyCost) : '')
      setSuppliesCost(incubation.suppliesCost !== undefined ? String(incubation.suppliesCost) : '')
      setLaborCost(incubation.laborCost !== undefined ? String(incubation.laborCost) : '')
      setOtherCosts(incubation.otherCosts !== undefined ? String(incubation.otherCosts) : '')
    }
  }, [open, incubation])

  // Helpers de cálculo interativo para Custo dos Ovos
  const handleEggCountChange = (value: string) => {
    setEggCount(value)
    const count = Number(value) || 0
    const perUnit = Number(eggCostPerUnit) || 0
    if (count > 0 && perUnit > 0) {
      setEggCost(Number((count * perUnit).toFixed(2)).toString())
    } else if (count > 0 && Number(eggCost) > 0) {
      setEggCostPerUnit(Number((Number(eggCost) / count).toFixed(2)).toString())
    }
  }

  const handleEggCostChange = (value: string) => {
    setEggCost(value)
    const total = Number(value)
    const count = Number(eggCount) || 0
    if (count > 0 && !isNaN(total)) {
      setEggCostPerUnit(Number((total / count).toFixed(2)).toString())
    }
  }

  const handleEggCostPerUnitChange = (value: string) => {
    setEggCostPerUnit(value)
    const perUnit = Number(value)
    const count = Number(eggCount) || 0
    if (count > 0 && !isNaN(perUnit)) {
      setEggCost(Number((count * perUnit).toFixed(2)).toString())
    }
  }

  // Helpers de cálculo interativo para Energia
  const handleEnergyStartChange = (value: string) => {
    setEnergyStartKwh(value)
    const start = Number(value)
    const end = Number(energyEndKwh)
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      const diff = Number((end - start).toFixed(2))
      setEnergyTotalKwh(diff.toString())
      const rate = Number(energyRatePerKwh)
      if (!isNaN(rate) && rate > 0) {
        setEnergyCost(Number((diff * rate).toFixed(2)).toString())
      }
    }
  }

  const handleEnergyEndChange = (value: string) => {
    setEnergyEndKwh(value)
    const end = Number(value)
    const start = Number(energyStartKwh)
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      const diff = Number((end - start).toFixed(2))
      setEnergyTotalKwh(diff.toString())
      const rate = Number(energyRatePerKwh)
      if (!isNaN(rate) && rate > 0) {
        setEnergyCost(Number((diff * rate).toFixed(2)).toString())
      }
    }
  }

  const handleEnergyTotalKwhChange = (value: string) => {
    setEnergyTotalKwh(value)
    const total = Number(value)
    const rate = Number(energyRatePerKwh)
    if (!isNaN(total) && !isNaN(rate) && rate > 0) {
      setEnergyCost(Number((total * rate).toFixed(2)).toString())
    }
  }

  const handleEnergyRateChange = (value: string) => {
    setEnergyRatePerKwh(value)
    const rate = Number(value)
    const total = Number(energyTotalKwh)
    if (!isNaN(rate) && !isNaN(total) && total >= 0) {
      setEnergyCost(Number((total * rate).toFixed(2)).toString())
    }
  }

  // Custo total calculado em tempo real
  const totalCalculatedCost = useMemo(() => {
    const egg = Number(eggCost) || 0
    const energy = Number(energyCost) || 0
    const supplies = Number(suppliesCost) || 0
    const labor = Number(laborCost) || 0
    const others = Number(otherCosts) || 0
    return egg + energy + supplies + labor + others
  }, [eggCost, energyCost, suppliesCost, laborCost, otherCosts])

  const isConcluded = status === 'Concluído' || incubation.status === 'Concluído'
  const hasResultingLot = !!incubation.resultingLotId

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const expectedHatchDate = new Date(new Date(startDate).getTime() + 21 * 86400000)
      .toISOString()
      .split('T')[0]

    const parsedHatched = hatchedCount !== '' ? Number(hatchedCount) : undefined
    const parsedHealthy = healthyChicks !== '' ? Number(healthyChicks) : undefined
    const parsedDeaths = deaths !== '' ? Number(deaths) : undefined
    const parsedUnhatched = unhatchedCount !== '' ? Number(unhatchedCount) : undefined

    if (
      parsedHealthy !== undefined &&
      parsedHatched !== undefined &&
      parsedHealthy > parsedHatched
    ) {
      toast({
        title: 'Validação inválida',
        description: 'Pintinhos viáveis não pode ser maior que o total de nascidos.',
        variant: 'destructive',
      })
      return
    }

    const updates: Partial<Incubation> = {
      incubatorName,
      origin,
      breed,
      supplier,
      eggCount: Number(eggCount) || 0,
      startDate,
      targetTemp: Number(targetTemp) || 0,
      targetHumidity: Number(targetHumidity) || 0,
      autoTurning,
      notes,
      status,
      expectedHatchDate,
      eggCost: Number(eggCost) || 0,
      eggCostPerUnit: eggCostPerUnit ? Number(eggCostPerUnit) : undefined,
      energyStartKwh: energyStartKwh ? Number(energyStartKwh) : undefined,
      energyEndKwh: energyEndKwh ? Number(energyEndKwh) : undefined,
      energyTotalKwh: energyTotalKwh ? Number(energyTotalKwh) : undefined,
      energyRatePerKwh: energyRatePerKwh ? Number(energyRatePerKwh) : undefined,
      energyCost: energyCost ? Number(energyCost) : undefined,
      suppliesCost: suppliesCost ? Number(suppliesCost) : undefined,
      laborCost: laborCost ? Number(laborCost) : undefined,
      otherCosts: otherCosts ? Number(otherCosts) : undefined,
      hatchedCount: parsedHatched,
      healthyChicks: parsedHealthy,
      deaths: parsedDeaths,
      unhatchedCount: parsedUnhatched,
      endDate: endDate || undefined,
    }

    const result = (await onSave(updates)) as { error?: any } | void
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      toast({
        title: 'Erro ao salvar ❌',
        description: result.error?.message || 'Falha ao salvar alterações.',
        variant: 'destructive',
      })
      return
    }

    // Auditoria para edição pós-finalização se concluída ou se mudou campos de fechamento
    if (isConcluded || hasResultingLot) {
      await logAudit(
        'Edição pós-finalização',
        'farm_incubations',
        incubation.id,
        {
          hatchedCount: incubation.hatchedCount,
          healthyChicks: incubation.healthyChicks,
          deaths: incubation.deaths,
          unhatchedCount: incubation.unhatchedCount,
          notes: incubation.notes,
          resultingLotId: incubation.resultingLotId,
        },
        {
          hatchedCount: parsedHatched,
          healthyChicks: parsedHealthy,
          deaths: parsedDeaths,
          unhatchedCount: parsedUnhatched,
          notes,
          resultingLotId: incubation.resultingLotId,
        },
      )
    }

    toast({ title: 'Incubação atualizada! ✅', description: 'As alterações foram salvas.' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Editar Incubação {incubation.code}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <Label className="text-xs">Identificação (Chocadeira)</Label>
            <Input
              value={incubatorName}
              onChange={(e) => setIncubatorName(e.target.value)}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Origem</Label>
              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Raça / Genética</Label>
              <Input
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Fornecedor</Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Qtd de Ovos</Label>
              <Input
                type="number"
                value={eggCount}
                onChange={(e) => handleEggCountChange(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEÇÃO: CUSTOS DA INCUBAÇÃO */}
          {/* ========================================================= */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                <DollarSign className="w-4 h-4 text-primary" /> Custos da Incubação
              </h3>
              <span className="text-[11px] font-bold text-primary">
                Total: R$ {totalCalculatedCost.toFixed(2)}
              </span>
            </div>

            {/* Custo dos Ovos */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <EggIcon className="w-3 h-3 text-orange-600" /> Custo dos Ovos
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Valor total ovos (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={eggCost}
                    onChange={(e) => handleEggCostChange(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Valor por ovo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={eggCostPerUnit}
                    onChange={(e) => handleEggCostPerUnitChange(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Energia da Incubação */}
            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Energia
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Inicial (kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={energyStartKwh}
                    onChange={(e) => handleEnergyStartChange(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Final (kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={energyEndKwh}
                    onChange={(e) => handleEnergyEndChange(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Total (kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={energyTotalKwh}
                    onChange={(e) => handleEnergyTotalKwhChange(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Tarifa (R$/kWh)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0,85"
                    value={energyRatePerKwh}
                    onChange={(e) => handleEnergyRateChange(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Total energia (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={energyCost}
                    onChange={(e) => setEnergyCost(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Outros custos */}
            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <span className="text-[11px] font-semibold text-muted-foreground">Outros Custos</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Insumos (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={suppliesCost}
                    onChange={(e) => setSuppliesCost(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Mão obra (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Outros (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data de Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as IncubationStatus)}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Temperatura Alvo (°C)</Label>
              <Input
                type="number"
                step="0.1"
                value={targetTemp}
                onChange={(e) => setTargetTemp(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Umidade Alvo (%)</Label>
              <Input
                type="number"
                value={targetHumidity}
                onChange={(e) => setTargetHumidity(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
            <Label className="text-xs font-medium">Viragem Automática</Label>
            <Switch checked={autoTurning} onCheckedChange={setAutoTurning} />
          </div>
          {/* ========================================================= */}
          {/* SEÇÃO: RESULTADOS DE ECLOSÃO (PÓS-FINALIZAÇÃO OU CONCLUÍDO) */}
          {/* ========================================================= */}
          {(isConcluded || hasResultingLot || hatchedCount !== '' || healthyChicks !== '') && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold flex items-center gap-1.5 text-emerald-950">
                  <Baby className="w-4 h-4 text-emerald-700" /> Resultados de Eclosão & Lote
                </h3>
                {hasResultingLot && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                    Lote Vinculado
                  </span>
                )}
              </div>

              {hasResultingLot && (
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Ao alterar os <strong>pintinhos viáveis</strong>, o lote gerado vinculado (
                    {incubation.resultingLotId}) será atualizado automaticamente sem duplicar o lote
                    e sem alterar o custo total.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Nascidos (eclosão)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={hatchedCount}
                    onChange={(e) => setHatchedCount(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">
                    Pintinhos Viáveis (Saudáveis)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={healthyChicks}
                    onChange={(e) => setHealthyChicks(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white font-bold text-emerald-800"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Mortos ao nascer</Label>
                  <Input
                    type="number"
                    min={0}
                    value={deaths}
                    onChange={(e) => setDeaths(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Ovos não eclodidos</Label>
                  <Input
                    type="number"
                    min={0}
                    value={unhatchedCount}
                    onChange={(e) => setUnhatchedCount(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground">Data Final (Fechamento)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white"
                />
              </div>

              {Number(healthyChicks) > 0 && (
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                  <span className="text-emerald-900 text-[11px]">Novo Custo / Pintinho:</span>
                  <span className="font-extrabold text-emerald-950 text-sm">
                    R$ {(totalCalculatedCost / Number(healthyChicks)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl min-h-[60px]"
              placeholder="Notas sobre esta incubação..."
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
