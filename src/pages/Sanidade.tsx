import React, { useState, useMemo, useEffect } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Syringe,
  Pill,
  AlertTriangle,
  FileText,
  Plus,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Link2,
  Trash2,
  MoreVertical,
  Eye,
  Pencil,
} from 'lucide-react'
import {
  Vaccination,
  Treatment,
  HealthOccurrence,
  HealthProtocol,
  VaccinationStatus,
  TreatmentStatus,
  HealthOccurrenceType,
  HealthOccurrenceSeverity,
  HealthProtocolStep,
  VialStatus,
  VialDestiny,
  VaccinationSession,
} from '@/types/farm'
import { VaccinationSessionDialog } from '@/components/sanidade/VaccinationSessionDialog'
import { toast } from '@/hooks/use-toast'

// Helper seguro para ler campos em snake_case, camelCase ou aninhados em data
function getFieldValue(obj: any, keys: string[], defaultVal: any = '') {
  if (!obj) return defaultVal
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k]
    if (obj.data && obj.data[k] !== undefined && obj.data[k] !== null) return obj.data[k]
  }
  return defaultVal
}

const SANITARY_CATEGORIES = [
  'Vacinas',
  'Medicamentos',
  'Suplementos',
  'Desinfetantes',
  'Produtos Veterinários',
]

// ====================================================================
// SUB-COMPONENT: DIÁLOGO REGISTRAR APLICAÇÃO (Programada -> Realizada)
// ====================================================================
interface ApplyVaccinationDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  vaccination: Vaccination | null
  lots: any[]
  inventory: any[]
  onConfirm: (
    updatedVaccination: Partial<Vaccination>,
    stockMovement?: {
      inventoryItemId: string
      movementPayload: any
      updatePayload?: any
    },
  ) => Promise<void>
}

function ApplyVaccinationDialog({
  open,
  onOpenChange,
  vaccination,
  lots,
  inventory,
  onConfirm,
}: ApplyVaccinationDialogProps) {
  const [performedDate, setPerformedDate] = useState('')
  const [animalCount, setAnimalCount] = useState('')
  const [dosePerAnimal, setDosePerAnimal] = useState('1')
  const [volumePerDose, setVolumePerDose] = useState('0.03')
  const [volumeUnit, setVolumeUnit] = useState('mL')
  const [applicationRoute, setApplicationRoute] = useState('ocular')
  const [responsible, setResponsible] = useState('')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [vialStatus, setVialStatus] = useState<VialStatus | ''>('opened')
  const [vialDestiny, setVialDestiny] = useState<VialDestiny>('discarded')
  const [vialCapacity, setVialCapacity] = useState('100')
  const [vialCost, setVialCost] = useState('65')
  const [deductStock, setDeductStock] = useState(true)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Preenchimento automático com dados da programação persistidos no Supabase
  useEffect(() => {
    if (!open || !vaccination) return

    const v = vaccination as any
    const aCount = getFieldValue(
      v,
      ['animal_count', 'animal_quantity', 'animalCount', 'animalQuantity'],
      '',
    )
    const dPerAnimal = getFieldValue(v, ['dose_per_animal', 'dosePerAnimal', 'dose'], '1')
    const vPerDose = getFieldValue(v, ['volume_per_dose', 'volumePerDose'], '0.03')
    const vUnit = getFieldValue(v, ['volume_unit', 'volumeUnit'], 'mL')
    const appRoute = getFieldValue(
      v,
      ['application_route', 'administration_route', 'applicationRoute', 'route'],
      'ocular',
    )
    const resp = getFieldValue(v, ['responsible'], '')
    const invId = getFieldValue(v, ['inventory_item_id', 'inventoryItemId'], '')
    const bNum = getFieldValue(v, ['batch_number', 'manufacturer_batch', 'batchNumber'], '')
    const exp = getFieldValue(v, ['expiration_date', 'expirationDate'], '')
    const obs = getFieldValue(v, ['notes', 'observations'], '')
    const vStat = getFieldValue(v, ['vial_status', 'vialStatus'], 'opened')
    const vDest = getFieldValue(v, ['vial_destiny', 'vialDestiny'], 'discarded')

    setPerformedDate(new Date().toISOString().split('T')[0])
    setAnimalCount(aCount !== '' ? String(aCount) : '')
    setDosePerAnimal(dPerAnimal !== '' ? String(dPerAnimal) : '1')
    setVolumePerDose(vPerDose !== '' ? String(vPerDose) : '0.03')
    setVolumeUnit(vUnit || 'mL')
    setApplicationRoute(appRoute || 'ocular')
    setResponsible(resp)
    setInventoryItemId(invId)
    setBatchNumber(bNum)
    setExpirationDate(exp)
    setVialStatus((vStat as VialStatus) || 'opened')
    setVialDestiny((vDest as VialDestiny) || 'discarded')
    setDeductStock(true)
    setNotes(obs)

    const itm = inventory.find((i) => i.id === invId)
    if (itm) {
      if (itm.content_per_package) setVialCapacity(String(itm.content_per_package))
      if (itm.averageCost && itm.content_per_package) {
        setVialCost(String(Number((itm.averageCost * itm.content_per_package).toFixed(2))))
      }
      if (!itm.can_keep_opened) {
        setVialDestiny('discarded')
      }
    }
  }, [open, vaccination, inventory])

  const selectedItem = inventory.find((i) => i.id === inventoryItemId)
  const lot = lots.find((l) => l.id === vaccination?.lot_id)
  const canKeepOpenedProduct = Boolean(selectedItem?.can_keep_opened)

  const handleInventorySelect = (id: string) => {
    setInventoryItemId(id)
    const itm = inventory.find((i) => i.id === id)
    if (itm) {
      if (itm.manufacturer_batch && !batchNumber) setBatchNumber(itm.manufacturer_batch)
      if (itm.expiration_date && !expirationDate) setExpirationDate(itm.expiration_date)
      if (itm.content_per_package) setVialCapacity(String(itm.content_per_package))
      if (itm.averageCost && itm.content_per_package) {
        setVialCost(String(Number((itm.averageCost * itm.content_per_package).toFixed(2))))
      }
      if (!itm.can_keep_opened) {
        setVialDestiny('discarded')
      }
    }
  }

  // Cálculos de Doses e Volume
  const birdsCount = Math.max(0, Number(animalCount) || 0)
  const dosesPerBird = Math.max(0, Number(dosePerAnimal) || 1)
  const volPerDoseNum = Math.max(0, Number(volumePerDose) || 0)

  // 1. Doses aplicadas = aves × doses por ave
  const dosesApplied = Number((birdsCount * dosesPerBird).toFixed(2))
  // 2. Volume total = doses aplicadas × volume por dose
  const totalVolumeCalculated = Number((dosesApplied * volPerDoseNum).toFixed(3))

  const capacityNum = Math.max(0, Number(vialCapacity) || 100)
  const vialCostNum = Math.max(0, Number(vialCost) || 65)
  const theoreticalUnitCost = capacityNum > 0 ? vialCostNum / capacityNum : 0
  const dosesRemaining = Math.max(0, capacityNum - dosesApplied)

  // Doses descartadas conforme destino
  const dosesDiscarded = useMemo(() => {
    if (vialDestiny === 'closed') return 0
    if (vialDestiny === 'kept') return 0
    return dosesRemaining
  }, [vialDestiny, dosesRemaining])

  // Total baixado do estoque
  const totalDownloaded = useMemo(() => {
    if (vialDestiny === 'closed') return 0
    if (vialDestiny === 'kept') return dosesApplied
    return capacityNum
  }, [vialDestiny, dosesApplied, capacityNum])

  // Custo real apropriado ao lote
  const lotAppropriatedCost = useMemo(() => {
    if (vialDestiny === 'closed') return 0
    if (vialDestiny === 'kept') {
      return Number((dosesApplied * theoreticalUnitCost).toFixed(2))
    }
    // Sobra descartada -> custo total do frasco apropriado
    return vialCostNum
  }, [vialDestiny, dosesApplied, theoreticalUnitCost, vialCostNum])

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!performedDate) {
      toast({ title: 'Informe a data realizada', variant: 'destructive' })
      return
    }
    if (birdsCount <= 0) {
      toast({ title: 'Informe a quantidade de aves vacinadas', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      const updatedPayload: Partial<Vaccination> = {
        status: 'performed',
        performed_date: performedDate,
        animal_count: birdsCount,
        dose_per_animal: dosesPerBird,
        dose_unit: 'dose',
        volume_per_dose: volPerDoseNum,
        volume_unit: volumeUnit,
        application_route: applicationRoute || vaccination?.application_route,
        responsible: responsible.trim() || vaccination?.responsible,
        inventory_item_id: inventoryItemId || vaccination?.inventory_item_id,
        inventory_item_name: selectedItem?.name || vaccination?.inventory_item_name,
        batch_number: batchNumber.trim() || vaccination?.batch_number,
        expiration_date: expirationDate || vaccination?.expiration_date,
        quantity_used: dosesApplied,
        doses_applied: dosesApplied,
        doses_discarded: dosesDiscarded,
        total_downloaded: totalDownloaded,
        unit_cost: theoreticalUnitCost,
        total_cost: lotAppropriatedCost,
        stock_deducted: deductStock && Boolean(inventoryItemId),
        vial_status:
          (vialStatus as VialStatus) ||
          (vialDestiny === 'closed' ? 'closed' : vialDestiny === 'kept' ? 'opened' : 'discarded'),
        vial_destiny: vialDestiny,
        discarded_quantity: dosesDiscarded,
        waste_cost: Number((dosesDiscarded * theoreticalUnitCost).toFixed(2)),
        notes: notes.trim() || vaccination?.notes,
      }

      let stockMovement:
        | {
            inventoryItemId: string
            movementPayload: any
            updatePayload?: any
          }
        | undefined = undefined

      if (deductStock && inventoryItemId && selectedItem && totalDownloaded > 0) {
        const newStock = Math.max(0, (selectedItem.currentStock || 0) - totalDownloaded)
        stockMovement = {
          inventoryItemId,
          movementPayload: {
            organization_id: vaccination?.organization_id,
            property_id: vaccination?.property_id,
            inventory_item_id: inventoryItemId,
            inventoryItemName: selectedItem.name,
            type: 'saida',
            movementType: 'Consumo',
            quantity: totalDownloaded,
            unit: selectedItem.unit || 'dose',
            balanceAfter: Number(newStock.toFixed(3)),
            unitValue: Number(theoreticalUnitCost.toFixed(4)),
            totalValue: Number(lotAppropriatedCost.toFixed(2)),
            date: performedDate,
            lotId: vaccination?.lot_id,
            lotName: lot?.name || vaccination?.lotName,
            notes: `Aplicação Sanitária: ${vaccination?.vaccine_name || 'Vacina'} (${lot?.name || 'Lote'}). Doses aplicadas: ${dosesApplied}, Descartadas: ${dosesDiscarded}, Total baixado: ${totalDownloaded} doses. Custo: R$ ${lotAppropriatedCost.toFixed(2)}.`,
            generateExpense: false,
          },
          updatePayload: {
            currentStock: Number(newStock.toFixed(3)),
            lastUpdated: new Date().toISOString().split('T')[0],
          },
        }
      }

      await onConfirm(updatedPayload, stockMovement)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Syringe className="w-5 h-5 text-emerald-600" />
            Registrar Aplicação de Vacina
          </DialogTitle>
        </DialogHeader>

        {vaccination && (
          <form onSubmit={handleConfirm} className="space-y-4 mt-2">
            {/* Resumo da programação original */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                    Vacinação Programada
                  </span>
                  <h4 className="text-sm font-bold text-emerald-950">{vaccination.vaccine_name}</h4>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  {vaccination.disease_target || 'Sanidade'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-emerald-900 border-t border-emerald-200/50">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Lote Animal:</span>
                  <strong className="font-semibold">
                    {lot?.name || vaccination.lotName || 'Geral'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Data Prevista:</span>
                  <strong className="font-semibold">
                    {vaccination.scheduled_date || 'Não definida'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Via Prevista:</span>
                  <strong className="font-semibold capitalize">
                    {vaccination.application_route || 'água'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Confirmação dos dados reais executados */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-foreground block">
                Dados da Aplicação Efetiva
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Data Realizada *</Label>
                  <Input
                    type="date"
                    value={performedDate}
                    onChange={(e) => setPerformedDate(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Responsável / Aplicador *</Label>
                  <Input
                    placeholder="Nome do aplicador"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <Label className="text-xs">Aves Vacinadas *</Label>
                  <Input
                    type="number"
                    value={animalCount}
                    onChange={(e) => setAnimalCount(e.target.value)}
                    className="h-10 text-xs rounded-xl font-bold"
                    placeholder="Ex: 4"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Doses / Ave *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={dosePerAnimal}
                    onChange={(e) => setDosePerAnimal(e.target.value)}
                    className="h-10 text-xs rounded-xl font-bold"
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Volume / Dose</Label>
                  <Input
                    type="number"
                    step="any"
                    value={volumePerDose}
                    onChange={(e) => setVolumePerDose(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    placeholder="0.03"
                  />
                </div>
                <div>
                  <Label className="text-xs">Unidade Volume</Label>
                  <Input
                    value={volumeUnit}
                    onChange={(e) => setVolumeUnit(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    placeholder="mL"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <span>Doses aplicadas: </span>
                  <strong className="font-bold">{dosesApplied} doses</strong>
                  <span className="text-muted-foreground text-[11px] ml-1">
                    ({birdsCount} aves × {dosesPerBird} dose/ave)
                  </span>
                </div>
                <div>
                  <span>Volume total: </span>
                  <strong className="font-bold">
                    {totalVolumeCalculated} {volumeUnit}
                  </strong>
                  <span className="text-muted-foreground text-[11px] ml-1">
                    ({dosesApplied} doses × {volPerDoseNum} {volumeUnit}/dose)
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs">Via de Aplicação Realizada</Label>
                <Select value={applicationRoute} onValueChange={setApplicationRoute}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ocular">Ocular / Nasal</SelectItem>
                    <SelectItem value="água">Água de bebida</SelectItem>
                    <SelectItem value="oral">Oral direta</SelectItem>
                    <SelectItem value="intramuscular">Intramuscular</SelectItem>
                    <SelectItem value="subcutânea">Subcutânea</SelectItem>
                    <SelectItem value="spray">Spray / Nebulização</SelectItem>
                    <SelectItem value="ração">Ração</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Integração com Estoque & Frasco Multidose */}
              <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Item do Estoque & Frasco Multidose
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Controle de Reconstituição
                  </Badge>
                </div>

                <div>
                  <Label className="text-xs">Item do Estoque</Label>
                  <Select value={inventoryItemId} onValueChange={handleInventorySelect}>
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                      <SelectValue placeholder="Selecione o insumo do estoque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum / Sem baixa automática</SelectItem>
                      {inventory.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} — Saldo: {item.currentStock} {item.unit} (R${' '}
                          {(item.averageCost || 0).toFixed(2)}/{item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItem && (
                  <div className="p-2.5 rounded-xl bg-white/80 border border-border/80 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estoque disponível:</span>
                      <strong className="text-foreground">
                        {selectedItem.currentStock} {selectedItem.unit}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo unitário teórico:</span>
                      <strong className="text-primary font-bold">
                        R$ {theoreticalUnitCost.toFixed(4)} / dose
                      </strong>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <Label className="text-xs">Lote Fabricante</Label>
                    <Input
                      placeholder="Ex: LOTE-894"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Validade</Label>
                    <Input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Capacidade Frasco</Label>
                    <Input
                      type="number"
                      value={vialCapacity}
                      onChange={(e) => setVialCapacity(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-white font-bold"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Custo do Frasco (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={vialCost}
                      onChange={(e) => setVialCost(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-white font-bold"
                      placeholder="65.00"
                    />
                  </div>
                </div>

                {/* Destino do Frasco e Doses Restantes */}
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-950">Destino do Frasco Aberto:</span>
                    <Badge variant="outline" className="bg-white text-amber-800 text-[10px]">
                      {dosesRemaining} doses restantes
                    </Badge>
                  </div>

                  <div>
                    <Select
                      value={vialDestiny}
                      onValueChange={(v) => setVialDestiny(v as VialDestiny)}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discarded">
                          Descartadas / Perda Técnica (Sobra Inutilizada)
                        </SelectItem>
                        <SelectItem value="kept" disabled={!canKeepOpenedProduct && !!selectedItem}>
                          Mantidas Disponíveis{' '}
                          {!canKeepOpenedProduct && selectedItem ? '(Bloqueado no produto)' : ''}
                        </SelectItem>
                        <SelectItem value="closed">Permanecer Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-amber-950 border-t border-amber-200">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Doses Aplicadas:
                      </span>
                      <strong>{dosesApplied} doses</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Doses Descartadas:
                      </span>
                      <strong className="text-rose-600">{dosesDiscarded} doses</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Total Baixado:
                      </span>
                      <strong>{totalDownloaded} doses</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-amber-200 text-xs">
                    <span className="font-semibold text-amber-950">
                      Custo Total Apropriado ao Lote:
                    </span>
                    <strong className="text-emerald-700 font-bold text-sm">
                      R$ {lotAppropriatedCost.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {inventoryItemId && (
                  <div className="flex items-center space-x-2 pt-2 border-t border-border/50">
                    <Checkbox
                      id="applyDeductStock"
                      checked={deductStock}
                      onCheckedChange={(v) => setDeductStock(Boolean(v))}
                    />
                    <label
                      htmlFor="applyDeductStock"
                      className="text-xs font-semibold leading-none cursor-pointer text-foreground"
                    >
                      Dar baixa física no estoque ({totalDownloaded} doses) e apropriar custo de R${' '}
                      {lotAppropriatedCost.toFixed(2)} ao lote
                    </label>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs">Observações da Aplicação</Label>
                <Textarea
                  placeholder="Observações do aplicador, diluição, lote do frasco..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isSubmitting ? 'Gravando Aplicação...' : 'Confirmar Aplicação Realizada 💉'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO VACINAÇÃO (CRIAR / EDITAR)
// ====================================================================
function VaccinationDialog({
  open,
  onOpenChange,
  editing,
  lots,
  activities,
  inventory,
  orgId,
  propertyId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Vaccination | null
  lots: any[]
  activities: any[]
  inventory: any[]
  orgId?: string
  propertyId?: string
  onSubmit: (data: Omit<Vaccination, 'id'>) => Promise<void>
}) {
  const [vaccineName, setVaccineName] = useState('')
  const [diseaseTarget, setDiseaseTarget] = useState('')
  const [activityId, setActivityId] = useState('')
  const [lotId, setLotId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [performedDate, setPerformedDate] = useState('')
  const [animalCount, setAnimalCount] = useState('')
  const [dosePerAnimal, setDosePerAnimal] = useState('1')
  const [doseUnit, setDoseUnit] = useState('dose')
  const [volumePerDose, setVolumePerDose] = useState('0.03')
  const [volumeUnit, setVolumeUnit] = useState('mL')
  const [applicationRoute, setApplicationRoute] = useState('ocular')
  const [vialStatus, setVialStatus] = useState<VialStatus | ''>('')
  const [discardedQuantity, setDiscardedQuantity] = useState('')
  const [wasteCost, setWasteCost] = useState('')
  const [responsible, setResponsible] = useState('')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [quantityUsed, setQuantityUsed] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [stockDeducted, setStockDeducted] = useState(false)
  const [status, setStatus] = useState<VaccinationStatus>('scheduled')
  const [notes, setNotes] = useState('')

  // Sincroniza formulário exatamente com o registro persistido
  useEffect(() => {
    if (!open) return

    if (editing) {
      const e = editing as any
      const vName = getFieldValue(e, ['vaccine_name', 'vaccineName', 'name'], '')
      const target = getFieldValue(
        e,
        ['disease_target', 'target_disease', 'targetDisease', 'diseaseTarget'],
        '',
      )
      const actId = getFieldValue(e, ['activity_id', 'activityId', 'activity'], '')
      const lId = getFieldValue(e, ['lot_id', 'lotId', 'lot'], '')
      const sDate = getFieldValue(e, ['scheduled_date', 'scheduledDate'], '')
      const pDate = getFieldValue(e, ['performed_date', 'performedDate'], '')
      const aCount = getFieldValue(
        e,
        ['animal_count', 'animal_quantity', 'animalCount', 'animalQuantity'],
        '',
      )
      const dPerAnimal = getFieldValue(e, ['dose_per_animal', 'dosePerAnimal', 'dose'], '1')
      const dUnit = getFieldValue(e, ['dose_unit', 'doseUnit', 'unit'], 'dose')
      const vPerDose = getFieldValue(e, ['volume_per_dose', 'volumePerDose'], '0.03')
      const vUnit = getFieldValue(e, ['volume_unit', 'volumeUnit'], 'mL')
      const appRoute = getFieldValue(
        e,
        ['application_route', 'administration_route', 'applicationRoute', 'route'],
        'ocular',
      )
      const resp = getFieldValue(e, ['responsible'], '')
      const invId = getFieldValue(e, ['inventory_item_id', 'inventoryItemId'], '')
      const bNumber = getFieldValue(e, ['batch_number', 'manufacturer_batch', 'batchNumber'], '')
      const expDate = getFieldValue(e, ['expiration_date', 'expirationDate'], '')
      const qUsed = getFieldValue(
        e,
        ['quantity_used', 'consumed_quantity', 'quantityUsed', 'consumedQuantity'],
        '',
      )
      const uCost = getFieldValue(e, ['unit_cost', 'unitCost'], '')
      const tCost = getFieldValue(e, ['total_cost', 'totalCost', 'custo'], '')
      const sDeducted = Boolean(getFieldValue(e, ['stock_deducted', 'stockDeducted'], false))
      const st = (getFieldValue(e, ['status'], 'scheduled') as VaccinationStatus) || 'scheduled'
      const obs = getFieldValue(e, ['notes', 'observations'], '')
      const vStatus = getFieldValue(e, ['vial_status', 'vialStatus'], '')
      const discQty = getFieldValue(e, ['discarded_quantity', 'discardedQuantity'], '')
      const wCost = getFieldValue(e, ['waste_cost', 'wasteCost'], '')

      setVaccineName(vName)
      setDiseaseTarget(target)
      setActivityId(actId)
      setLotId(lId)
      setScheduledDate(sDate)
      setPerformedDate(pDate)
      setAnimalCount(aCount !== '' ? String(aCount) : '')
      setDosePerAnimal(dPerAnimal !== '' ? String(dPerAnimal) : '1')
      setDoseUnit(dUnit || 'dose')
      setVolumePerDose(vPerDose !== '' ? String(vPerDose) : '0.03')
      setVolumeUnit(vUnit || 'mL')
      setApplicationRoute(appRoute || 'ocular')
      setVialStatus((vStatus as VialStatus) || '')
      setDiscardedQuantity(discQty !== '' ? String(discQty) : '')
      setWasteCost(wCost !== '' ? String(wCost) : '')
      setResponsible(resp)
      setInventoryItemId(invId)
      setBatchNumber(bNumber)
      setExpirationDate(expDate)
      setQuantityUsed(qUsed !== '' ? String(qUsed) : '')
      setUnitCost(uCost !== '' ? String(uCost) : '')
      setTotalCost(tCost !== '' ? String(tCost) : '')
      setStockDeducted(sDeducted)
      setStatus(st)
      setNotes(obs)
    } else {
      setVaccineName('')
      setDiseaseTarget('')
      setActivityId('')
      setLotId('')
      setScheduledDate(new Date().toISOString().split('T')[0])
      setPerformedDate('')
      setAnimalCount('100')
      setDosePerAnimal('1')
      setDoseUnit('dose')
      setVolumePerDose('0.03')
      setVolumeUnit('mL')
      setApplicationRoute('ocular')
      setVialStatus('')
      setDiscardedQuantity('')
      setWasteCost('')
      setResponsible('')
      setInventoryItemId('')
      setBatchNumber('')
      setExpirationDate('')
      setQuantityUsed('')
      setUnitCost('')
      setTotalCost('')
      setStockDeducted(false)
      setStatus('scheduled')
      setNotes('')
    }
  }, [open, editing])

  const selectedItem = inventory.find((i) => i.id === inventoryItemId)

  const handleAutoCalcQty = (count: number, dose: number, itemOverride?: any) => {
    if (count > 0 && dose > 0) {
      const calc = Number((count * dose).toFixed(3))
      setQuantityUsed(String(calc))
      const itm = itemOverride || selectedItem
      if (itm && itm.averageCost) {
        setUnitCost(String(itm.averageCost))
        setTotalCost(String(Number((calc * itm.averageCost).toFixed(2))))
      }
    }
  }

  const handleInventorySelect = (id: string) => {
    setInventoryItemId(id)
    const itm = inventory.find((i) => i.id === id)
    if (itm) {
      if (!vaccineName) setVaccineName(itm.name)
      if (itm.unit) setDoseUnit(itm.unit)
      if (itm.manufacturer_batch && !batchNumber) setBatchNumber(itm.manufacturer_batch)
      if (itm.expiration_date && !expirationDate) setExpirationDate(itm.expiration_date)
      if (itm.averageCost) {
        setUnitCost(String(itm.averageCost))
        const qty = Number(quantityUsed) || Number(animalCount) * Number(dosePerAnimal) || 0
        if (qty > 0) {
          setTotalCost(String(Number((qty * itm.averageCost).toFixed(2))))
        }
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vaccineName.trim()) {
      toast({ title: 'Nome da vacina é obrigatório', variant: 'destructive' })
      return
    }

    if (selectedItem?.expiration_date) {
      const exp = new Date(selectedItem.expiration_date)
      const now = new Date()
      if (exp.getTime() < now.getTime()) {
        toast({
          title: 'Atenção: Insumo Vencido!',
          description: `O item ${selectedItem.name} venceu em ${selectedItem.expiration_date}. Verifique antes do uso.`,
          variant: 'destructive',
        })
      }
    }

    const selectedLot = lots.find((l) => l.id === lotId)

    const payload: Omit<Vaccination, 'id'> = {
      organization_id: orgId,
      property_id: propertyId,
      activity_id: activityId || undefined,
      lot_id: lotId || undefined,
      lotName: selectedLot?.name,
      vaccine_name: vaccineName.trim(),
      disease_target: diseaseTarget.trim() || undefined,
      scheduled_date: scheduledDate || undefined,
      performed_date:
        status === 'performed'
          ? performedDate || new Date().toISOString().split('T')[0]
          : performedDate || undefined,
      animal_count: animalCount !== '' ? Number(animalCount) : undefined,
      dose_per_animal: dosePerAnimal !== '' ? Number(dosePerAnimal) : undefined,
      dose_unit: doseUnit || 'dose',
      volume_per_dose: volumePerDose !== '' ? Number(volumePerDose) : undefined,
      volume_unit: volumeUnit || 'mL',
      application_route: applicationRoute || undefined,
      vial_status: (vialStatus as VialStatus) || undefined,
      discarded_quantity: discardedQuantity !== '' ? Number(discardedQuantity) : undefined,
      waste_cost: wasteCost !== '' ? Number(wasteCost) : undefined,
      responsible: responsible.trim() || undefined,
      inventory_item_id: inventoryItemId || undefined,
      inventory_item_name: selectedItem?.name,
      batch_number: batchNumber.trim() || undefined,
      expiration_date: expirationDate || undefined,
      quantity_used: quantityUsed !== '' ? Number(quantityUsed) : undefined,
      unit_cost: unitCost !== '' ? Number(unitCost) : undefined,
      total_cost: totalCost !== '' ? Number(totalCost) : undefined,
      stock_deducted: stockDeducted,
      notes: notes.trim() || undefined,
      status,
    }

    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Syringe className="w-5 h-5 text-emerald-600" />
            {editing ? 'Editar Vacinação' : 'Nova Vacinação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div>
            <Label className="text-xs">Nome da Vacina *</Label>
            <Input
              placeholder="Ex: Newcastle, Gumboro, Bouba Aviária, Marek"
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Doença / Alvo</Label>
              <Input
                placeholder="Ex: Doença de Newcastle"
                value={diseaseTarget}
                onChange={(e) => setDiseaseTarget(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as VaccinationStatus)
                  if (v === 'performed' && !performedDate) {
                    setPerformedDate(new Date().toISOString().split('T')[0])
                  }
                }}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="performed">Realizada</SelectItem>
                  <SelectItem value="delayed">Atrasada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Lote Animal</Label>
              <Select value={lotId} onValueChange={setLotId}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geral / Sem lote</SelectItem>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Atividade</Label>
              <Select value={activityId} onValueChange={setActivityId}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geral</SelectItem>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data Programada</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Data Realizada</Label>
              <Input
                type="date"
                value={performedDate}
                onChange={(e) => setPerformedDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <Label className="text-xs">Qtd Animais</Label>
              <Input
                type="number"
                value={animalCount}
                onChange={(e) => {
                  setAnimalCount(e.target.value)
                  handleAutoCalcQty(Number(e.target.value), Number(dosePerAnimal))
                }}
                className="h-10 text-xs rounded-xl font-bold"
                placeholder="100"
              />
            </div>
            <div>
              <Label className="text-xs">Doses / Ave</Label>
              <Input
                type="number"
                step="any"
                value={dosePerAnimal}
                onChange={(e) => {
                  setDosePerAnimal(e.target.value)
                  handleAutoCalcQty(Number(animalCount), Number(e.target.value))
                }}
                className="h-10 text-xs rounded-xl font-bold"
                placeholder="1"
              />
            </div>
            <div>
              <Label className="text-xs">Volume / Dose</Label>
              <Input
                type="number"
                step="any"
                value={volumePerDose}
                onChange={(e) => setVolumePerDose(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="0.03"
              />
            </div>
            <div>
              <Label className="text-xs">Unidade Volume</Label>
              <Input
                placeholder="mL"
                value={volumeUnit}
                onChange={(e) => setVolumeUnit(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Via de Aplicação</Label>
              <Select value={applicationRoute} onValueChange={setApplicationRoute}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="água">Água de bebida</SelectItem>
                  <SelectItem value="ocular">Ocular / Nasal</SelectItem>
                  <SelectItem value="oral">Oral direta</SelectItem>
                  <SelectItem value="intramuscular">Intramuscular</SelectItem>
                  <SelectItem value="subcutânea">Subcutânea</SelectItem>
                  <SelectItem value="spray">Spray</SelectItem>
                  <SelectItem value="ração">Ração</SelectItem>
                  <SelectItem value="outra">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input
                placeholder="Nome do aplicador"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Vínculo com Estoque & Rastreabilidade */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/70 space-y-3">
            <span className="text-xs font-bold text-foreground block">
              Item do Estoque & Rastreabilidade
            </span>
            <div>
              <Label className="text-xs">Item do Estoque</Label>
              <Select value={inventoryItemId} onValueChange={handleInventorySelect}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                  <SelectValue placeholder="Selecione o frasco/produto do estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum / Não vinculado</SelectItem>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} — Saldo: {item.currentStock} {item.unit} (R${' '}
                      {(item.averageCost || 0).toFixed(2)}/{item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <div className="p-2.5 rounded-xl bg-white/80 border border-border/80 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estoque disponível:</span>
                  <strong className="text-foreground">
                    {selectedItem.currentStock} {selectedItem.unit}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo unitário:</span>
                  <strong className="text-primary font-bold">
                    R$ {(selectedItem.averageCost || 0).toFixed(4)} / {selectedItem.unit}
                  </strong>
                </div>
                {selectedItem.expiration_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validade cadastrada:</span>
                    <strong
                      className={
                        new Date(selectedItem.expiration_date).getTime() < Date.now()
                          ? 'text-rose-600 font-bold'
                          : 'text-foreground'
                      }
                    >
                      {selectedItem.expiration_date}
                    </strong>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Lote do Fabricante</Label>
                <Input
                  placeholder="Ex: LOTE-894"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white"
                />
              </div>
              <div>
                <Label className="text-xs">Data de Validade</Label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Qtd Consumida ({doseUnit || 'un'})</Label>
                <Input
                  type="number"
                  step="any"
                  value={quantityUsed}
                  onChange={(e) => {
                    setQuantityUsed(e.target.value)
                    const q = Number(e.target.value) || 0
                    const u = Number(unitCost) || selectedItem?.averageCost || 0
                    setTotalCost(String(Number((q * u).toFixed(2))))
                  }}
                  className="h-10 text-xs rounded-xl bg-white"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs">Custo Unitário (R$)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={unitCost}
                  onChange={(e) => {
                    setUnitCost(e.target.value)
                    const u = Number(e.target.value) || 0
                    const q = Number(quantityUsed) || 0
                    setTotalCost(String(Number((q * u).toFixed(2))))
                  }}
                  className="h-10 text-xs rounded-xl bg-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="text-xs">Custo Total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white font-bold text-emerald-800"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
              <div>
                <Label className="text-xs">Status do Frasco</Label>
                <Select value={vialStatus} onValueChange={(v) => setVialStatus(v as VialStatus)}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="closed">Fechado</SelectItem>
                    <SelectItem value="opened">Aberto / Em Uso</SelectItem>
                    <SelectItem value="discarded">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Qtd Descartada</Label>
                <Input
                  type="number"
                  step="any"
                  value={discardedQuantity}
                  onChange={(e) => {
                    setDiscardedQuantity(e.target.value)
                    const d = Number(e.target.value) || 0
                    const u = Number(unitCost) || selectedItem?.averageCost || 0
                    setWasteCost(String(Number((d * u).toFixed(2))))
                  }}
                  className="h-10 text-xs rounded-xl bg-white"
                  placeholder="0"
                />
              </div>
            </div>

            {inventoryItemId && status === 'performed' && (
              <div className="flex items-center space-x-2 pt-2 border-t border-border/50">
                <Checkbox
                  id="vacStockDeduct"
                  checked={stockDeducted}
                  onCheckedChange={(v) => setStockDeducted(Boolean(v))}
                />
                <label
                  htmlFor="vacStockDeduct"
                  className="text-xs font-semibold leading-none cursor-pointer text-foreground"
                >
                  Dar baixa no estoque e apropriar custo econômico ao lote
                </label>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              placeholder="Instruções adicionais, reações ou anotações clínicas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
          >
            {editing ? 'Salvar Alterações' : 'Cadastrar Vacinação ✨'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO TRATAMENTO VETERINÁRIO
// ====================================================================
function TreatmentDialog({
  open,
  onOpenChange,
  editing,
  lots,
  activities,
  inventory,
  orgId,
  propertyId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Treatment | null
  lots: any[]
  activities: any[]
  inventory: any[]
  orgId?: string
  propertyId?: string
  onSubmit: (data: Omit<Treatment, 'id'>) => Promise<void>
}) {
  const [medicationName, setMedicationName] = useState('')
  const [diagnosisReason, setDiagnosisReason] = useState('')
  const [activityId, setActivityId] = useState('')
  const [lotId, setLotId] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('A cada 24 horas')
  const [durationDays, setDurationDays] = useState('5')
  const [administrationRoute, setAdministrationRoute] = useState('Água de bebida')
  const [animalCount, setAnimalCount] = useState('100')
  const [responsible, setResponsible] = useState('')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [quantityUsed, setQuantityUsed] = useState('')
  const [stockDeducted, setStockDeducted] = useState(false)
  const [withdrawalPeriodDays, setWithdrawalPeriodDays] = useState('0')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<TreatmentStatus>('in_progress')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return

    if (editing) {
      setMedicationName(editing.medication_name || '')
      setDiagnosisReason(editing.diagnosis_reason || '')
      setActivityId(editing.activity_id || '')
      setLotId(editing.lot_id || '')
      setDosage(editing.dosage || '')
      setFrequency(editing.frequency || 'A cada 24 horas')
      setDurationDays(String(editing.duration_days || '5'))
      setAdministrationRoute(editing.administration_route || 'Água de bebida')
      setAnimalCount(String(editing.animal_count || '100'))
      setResponsible(editing.responsible || '')
      setInventoryItemId(editing.inventory_item_id || '')
      setQuantityUsed(String(editing.quantity_used || ''))
      setStockDeducted(Boolean(editing.stock_deducted))
      setWithdrawalPeriodDays(String(editing.withdrawal_period_days || '0'))
      setStartDate(editing.start_date || '')
      setEndDate(editing.end_date || '')
      setStatus(editing.status || 'in_progress')
      setNotes(editing.notes || '')
    } else {
      setMedicationName('')
      setDiagnosisReason('')
      setActivityId('')
      setLotId('')
      setDosage('')
      setFrequency('A cada 24 horas')
      setDurationDays('5')
      setAdministrationRoute('Água de bebida')
      setAnimalCount('100')
      setResponsible('')
      setInventoryItemId('')
      setQuantityUsed('')
      setStockDeducted(false)
      setWithdrawalPeriodDays('0')
      setStartDate(new Date().toISOString().split('T')[0])
      setEndDate('')
      setStatus('in_progress')
      setNotes('')
    }
  }, [open, editing])

  const selectedItem = inventory.find((i) => i.id === inventoryItemId)

  const handleInventorySelect = (id: string) => {
    setInventoryItemId(id)
    const itm = inventory.find((i) => i.id === id)
    if (itm) {
      if (!medicationName) setMedicationName(itm.name)
      if (itm.expiration_date) {
        const exp = new Date(itm.expiration_date)
        if (exp.getTime() < Date.now()) {
          toast({
            title: 'Atenção: Medicamento Vencido!',
            description: `Validade: ${itm.expiration_date}`,
            variant: 'destructive',
          })
        }
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!medicationName.trim()) {
      toast({ title: 'Nome do medicamento é obrigatório', variant: 'destructive' })
      return
    }

    const selectedLot = lots.find((l) => l.id === lotId)
    const qUsed = Number(quantityUsed) || undefined
    const uCost = selectedItem?.averageCost || undefined
    const tCost = qUsed && uCost ? Number((qUsed * uCost).toFixed(2)) : undefined

    const payload: Omit<Treatment, 'id'> = {
      organization_id: orgId,
      property_id: propertyId,
      activity_id: activityId || undefined,
      lot_id: lotId || undefined,
      lotName: selectedLot?.name,
      medication_name: medicationName.trim(),
      diagnosis_reason: diagnosisReason.trim() || undefined,
      dosage: dosage.trim() || undefined,
      frequency: frequency.trim() || undefined,
      duration_days: Number(durationDays) || undefined,
      administration_route: administrationRoute || undefined,
      animal_count: Number(animalCount) || undefined,
      responsible: responsible.trim() || undefined,
      inventory_item_id: inventoryItemId || undefined,
      inventory_item_name: selectedItem?.name,
      quantity_used: qUsed,
      unit_cost: uCost,
      total_cost: tCost,
      stock_deducted: stockDeducted,
      withdrawal_period_days: Number(withdrawalPeriodDays) || 0,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      notes: notes.trim() || undefined,
      status,
    }

    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            {editing ? 'Editar Tratamento' : 'Novo Tratamento Veterinário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div>
            <Label className="text-xs">Medicamento / Princípio Ativo *</Label>
            <Input
              placeholder="Ex: Enrofloxacino, Vermífugo Ivomec, Complexo Vitamínico"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Diagnóstico / Motivo</Label>
              <Input
                placeholder="Ex: Coriza infecciosa, verminose"
                value={diagnosisReason}
                onChange={(e) => setDiagnosisReason(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TreatmentStatus)}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Lote Animal</Label>
              <Select value={lotId} onValueChange={setLotId}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geral / Sem lote</SelectItem>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Período de Carência (dias)</Label>
              <Input
                type="number"
                value={withdrawalPeriodDays}
                onChange={(e) => setWithdrawalPeriodDays(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Dosagem</Label>
              <Input
                placeholder="Ex: 10 mL / L"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Frequência</Label>
              <Input
                placeholder="A cada 24h"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Duração (dias)</Label>
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
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
              />
            </div>
            <div>
              <Label className="text-xs">Data de Término</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Via de Administração</Label>
              <Input
                value={administrationRoute}
                onChange={(e) => setAdministrationRoute(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="Água de bebida, injetável"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="Veterinário / Tratador"
              />
            </div>
          </div>

          {/* Estoque e Custos */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/70 space-y-3">
            <span className="text-xs font-bold text-foreground block">
              Vínculo com Estoque & Custos Sanitários
            </span>
            <div>
              <Label className="text-xs">Item do Estoque (Medicamentos e Insumos)</Label>
              <Select value={inventoryItemId} onValueChange={handleInventorySelect}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                  <SelectValue placeholder="Selecione o medicamento do estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum / Não vinculado</SelectItem>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} — Saldo: {item.currentStock} {item.unit} (R${' '}
                      {(item.averageCost || 0).toFixed(2)}/{item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <div className="p-2.5 rounded-xl bg-white/80 border border-border/80 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estoque disponível:</span>
                  <strong className="text-foreground">
                    {selectedItem.currentStock} {selectedItem.unit}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo unitário:</span>
                  <strong className="text-primary font-bold">
                    R$ {(selectedItem.averageCost || 0).toFixed(4)} / {selectedItem.unit}
                  </strong>
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs">
                Qtd Consumida do Estoque ({selectedItem?.unit || 'unidades'})
              </Label>
              <Input
                type="number"
                step="any"
                value={quantityUsed}
                onChange={(e) => setQuantityUsed(e.target.value)}
                className="h-10 text-xs rounded-xl bg-white"
                placeholder="Quantidade total utilizada"
              />
            </div>

            {inventoryItemId && (status === 'completed' || status === 'in_progress') && (
              <div className="flex items-center space-x-2 pt-1 border-t border-border/50">
                <Checkbox
                  id="trtStockDeduct"
                  checked={stockDeducted}
                  onCheckedChange={(v) => setStockDeducted(Boolean(v))}
                />
                <label
                  htmlFor="trtStockDeduct"
                  className="text-xs font-semibold leading-none cursor-pointer text-foreground"
                >
                  Baixar do estoque e apropriar ao custo sanitário do lote
                </label>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              placeholder="Instruções de diluição, sintomas observados, reações..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white mt-2"
          >
            {editing ? 'Salvar Alterações' : 'Registrar Tratamento ✨'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO OCORRÊNCIA CLÍNICA
// ====================================================================
function OccurrenceDialog({
  open,
  onOpenChange,
  editing,
  lots,
  orgId,
  propertyId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: HealthOccurrence | null
  lots: any[]
  orgId?: string
  propertyId?: string
  onSubmit: (data: Omit<HealthOccurrence, 'id'>) => Promise<void>
}) {
  const [occurrenceType, setOccurrenceType] = useState<HealthOccurrenceType>('disease')
  const [customType, setCustomType] = useState('')
  const [severity, setSeverity] = useState<HealthOccurrenceSeverity>('moderate')
  const [lotId, setLotId] = useState('')
  const [occurrenceDate, setOccurrenceDate] = useState('')
  const [affectedCount, setAffectedCount] = useState('1')
  const [symptoms, setSymptoms] = useState('')
  const [description, setDescription] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [responsible, setResponsible] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return

    if (editing) {
      setOccurrenceType(editing.occurrence_type || 'disease')
      setCustomType(editing.custom_type || '')
      setSeverity(editing.severity || 'moderate')
      setLotId(editing.lot_id || '')
      setOccurrenceDate(editing.occurrence_date ? editing.occurrence_date.split('T')[0] : '')
      setAffectedCount(String(editing.affected_count || '1'))
      setSymptoms(editing.symptoms || '')
      setDescription(editing.description || '')
      setActionTaken(editing.action_taken || '')
      setResponsible(editing.responsible || '')
      setNotes(editing.notes || '')
    } else {
      setOccurrenceType('disease')
      setCustomType('')
      setSeverity('moderate')
      setLotId('')
      setOccurrenceDate(new Date().toISOString().split('T')[0])
      setAffectedCount('1')
      setSymptoms('')
      setDescription('')
      setActionTaken('')
      setResponsible('')
      setNotes('')
    }
  }, [open, editing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedLot = lots.find((l) => l.id === lotId)

    const payload: Omit<HealthOccurrence, 'id'> = {
      organization_id: orgId,
      property_id: propertyId,
      lot_id: lotId || undefined,
      lotName: selectedLot?.name,
      occurrence_date: occurrenceDate || new Date().toISOString(),
      occurrence_type: occurrenceType,
      custom_type: occurrenceType === 'other' ? customType.trim() : undefined,
      severity,
      affected_count: Number(affectedCount) || 1,
      symptoms: symptoms.trim() || undefined,
      description: description.trim() || undefined,
      action_taken: actionTaken.trim() || undefined,
      responsible: responsible.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            {editing ? 'Editar Ocorrência' : 'Registrar Ocorrência Clínica'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo de Ocorrência *</Label>
              <Select
                value={occurrenceType}
                onValueChange={(v) => setOccurrenceType(v as HealthOccurrenceType)}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disease">Doença clínica</SelectItem>
                  <SelectItem value="symptom">Sintoma isolado</SelectItem>
                  <SelectItem value="respiratory">Problema respiratório</SelectItem>
                  <SelectItem value="diarrhea">Diarreia / Digestivo</SelectItem>
                  <SelectItem value="locomotor">Problema locomotor / Perna</SelectItem>
                  <SelectItem value="injury">Ferimento / Bicagem</SelectItem>
                  <SelectItem value="parasites">Parasitas (piolho, ácaro)</SelectItem>
                  <SelectItem value="abnormal_behavior">Comportamento anormal</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Severidade *</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as HealthOccurrenceSeverity)}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="moderate">Moderada</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {occurrenceType === 'other' && (
            <div>
              <Label className="text-xs">Especifique o Tipo *</Label>
              <Input
                placeholder="Descreva o tipo personalizado"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Lote Animal</Label>
              <Select value={lotId} onValueChange={setLotId}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecionar lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geral / Sem lote</SelectItem>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data da Ocorrência *</Label>
              <Input
                type="date"
                value={occurrenceDate}
                onChange={(e) => setOccurrenceDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nº de Aves Afetadas</Label>
              <Input
                type="number"
                value={affectedCount}
                onChange={(e) => setAffectedCount(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável / Notificador</Label>
              <Input
                placeholder="Nome do tratador"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Sintomas Observados</Label>
            <Input
              placeholder="Ex: Espirro, secreção nasal, fezes esbranquiçadas, prostração"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div>
            <Label className="text-xs">Descrição Detalhada</Label>
            <Textarea
              placeholder="Descreva a situação encontrada no aviário..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <div>
            <Label className="text-xs">Ação Tomada</Label>
            <Input
              placeholder="Ex: Isolamento imediato das aves, desinfecção e início de antibiótico"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white mt-2"
          >
            {editing ? 'Salvar Alterações' : 'Salvar Ocorrência ✨'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO PROTOCOLO SANITÁRIO (COM ETAPAS DINÂMICAS)
// ====================================================================
function ProtocolDialog({
  open,
  onOpenChange,
  editing,
  orgId,
  propertyId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: HealthProtocol | null
  orgId?: string
  propertyId?: string
  onSubmit: (data: Omit<HealthProtocol, 'id'>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [protocolType, setProtocolType] =
    useState<HealthProtocol['protocol_type']>('vaccination_program')
  const [activityType, setActivityType] = useState('Avicultura')
  const [ageRangeStart, setAgeRangeStart] = useState('1')
  const [ageRangeEnd, setAgeRangeEnd] = useState('60')
  const [notes, setNotes] = useState('')
  const [steps, setSteps] = useState<HealthProtocolStep[]>([
    { day: 1, action: 'Vacina Marek + Bouba', description: 'Aplicação no incubatório ou 1º dia' },
    { day: 7, action: 'Vacina Newcastle + Gumboro', description: 'Via água de bebida' },
    { day: 14, action: 'Reforço Gumboro', description: 'Via água de bebida' },
  ])

  useEffect(() => {
    if (!open) return

    if (editing) {
      setName(editing.name || '')
      setProtocolType(editing.protocol_type || 'vaccination_program')
      setActivityType(editing.activity_type || 'Avicultura')
      setAgeRangeStart(String(editing.age_range_start || '1'))
      setAgeRangeEnd(String(editing.age_range_end || '60'))
      setNotes(editing.notes || '')
      setSteps(editing.steps && editing.steps.length > 0 ? [...editing.steps] : [])
    } else {
      setName('')
      setProtocolType('vaccination_program')
      setActivityType('Avicultura')
      setAgeRangeStart('1')
      setAgeRangeEnd('60')
      setNotes('')
      setSteps([
        { day: 1, action: 'Vacina Marek + Bouba', description: 'Aplicação no 1º dia' },
        { day: 7, action: 'Vacina Newcastle + Gumboro', description: 'Via água de bebida' },
        { day: 14, action: 'Reforço Gumboro', description: 'Via água de bebida' },
      ])
    }
  }, [open, editing])

  const addStep = () => {
    const nextDay = steps.length > 0 ? Number(steps[steps.length - 1].day) + 7 : 1
    setSteps([...steps, { day: nextDay, action: '', description: '' }])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, field: keyof HealthProtocolStep, val: any) => {
    const next = [...steps]
    next[index] = { ...next[index], [field]: val }
    setSteps(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Nome do protocolo é obrigatório', variant: 'destructive' })
      return
    }

    const payload: Omit<HealthProtocol, 'id'> = {
      organization_id: orgId,
      property_id: propertyId,
      name: name.trim(),
      protocol_type: protocolType,
      activity_type: activityType,
      age_range_start: Number(ageRangeStart) || 1,
      age_range_end: Number(ageRangeEnd) || 60,
      steps: steps.sort((a, b) => Number(a.day) - Number(b.day)),
      notes: notes.trim() || undefined,
      status: 'active',
    }

    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            {editing ? 'Editar Protocolo Sanitário' : 'Novo Protocolo Sanitário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Nome do Protocolo *</Label>
            <Input
              placeholder="Ex: Programa de Imunização Inicial de Pintainhas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo de Protocolo</Label>
              <Select
                value={protocolType}
                onValueChange={(v) => setProtocolType(v as HealthProtocol['protocol_type'])}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaccination_program">Programa Vacinal</SelectItem>
                  <SelectItem value="deworming">Desverminação</SelectItem>
                  <SelectItem value="preventive_treatment">Tratamento Preventivo</SelectItem>
                  <SelectItem value="biosecurity">Biosseguridade</SelectItem>
                  <SelectItem value="cleaning_disinfection">Limpeza & Desinfecção</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Atividade Produtiva</Label>
              <Input
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="Avicultura, Bovinocultura"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Idade Inicial (Dias)</Label>
              <Input
                type="number"
                value={ageRangeStart}
                onChange={(e) => setAgeRangeStart(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Idade Final (Dias)</Label>
              <Input
                type="number"
                value={ageRangeEnd}
                onChange={(e) => setAgeRangeEnd(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Etapas do Protocolo */}
          <div className="space-y-3 pt-2 border-t border-border/70">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">Etapas e Ações do Protocolo</Label>
                <span className="text-[10px] text-muted-foreground block">
                  Defina o dia de vida da ave e a ação correspondente
                </span>
              </div>
              <Button
                type="button"
                onClick={addStep}
                variant="outline"
                size="sm"
                className="h-7 text-[11px] rounded-lg gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Plus className="w-3 h-3" /> Adicionar Etapa
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-secondary/50 border border-border/60 flex items-start gap-2"
                >
                  <div className="w-20 shrink-0">
                    <Label className="text-[10px] text-muted-foreground">Dia de Vida</Label>
                    <Input
                      type="number"
                      value={st.day}
                      onChange={(e) => updateStep(idx, 'day', Number(e.target.value))}
                      className="h-8 text-xs rounded-lg bg-white"
                      placeholder="1"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Ação / Vacina</Label>
                      <Input
                        value={st.action}
                        onChange={(e) => updateStep(idx, 'action', e.target.value)}
                        className="h-8 text-xs rounded-lg bg-white"
                        placeholder="Ex: Vacina Newcastle (Ocular)"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        value={st.description || ''}
                        onChange={(e) => updateStep(idx, 'description', e.target.value)}
                        className="h-7 text-[11px] rounded-lg bg-white"
                        placeholder="Detalhes ou via de aplicação..."
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => removeStep(idx)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0 mt-3"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Observações do Protocolo</Label>
            <Textarea
              placeholder="Instruções gerais, periodicidade ou recomendações sanitárias..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white mt-2"
          >
            {editing ? 'Salvar Alterações' : 'Salvar Protocolo ✨'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO VINCULAR PROTOCOLO A LOTE
// ====================================================================
function AssignProtocolDialog({
  open,
  onOpenChange,
  protocol,
  lots,
  onAssign,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  protocol: HealthProtocol | null
  lots: any[]
  onAssign: (lotId: string, refDate: string) => Promise<void>
}) {
  const [selectedLotId, setSelectedLotId] = useState('')
  const [refDate, setRefDate] = useState(new Date().toISOString().split('T')[0])

  const handleLotChange = (id: string) => {
    setSelectedLotId(id)
    const lot = lots.find((l) => l.id === id)
    if (lot && lot.startDate) {
      setRefDate(lot.startDate)
    }
  }

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLotId) {
      toast({ title: 'Selecione o lote de destino', variant: 'destructive' })
      return
    }
    onAssign(selectedLotId, refDate)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Link2 className="w-5 h-5 text-purple-600" />
            Vincular Protocolo a Lote
          </DialogTitle>
        </DialogHeader>

        {protocol && (
          <form onSubmit={handleConfirm} className="space-y-4 mt-2">
            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/70">
              <span className="text-xs font-bold text-purple-950 block">{protocol.name}</span>
              <span className="text-[11px] text-purple-800 block mt-0.5">
                {protocol.steps?.length || 0} etapas serão programadas automaticamente na agenda com
                base na data de referência.
              </span>
            </div>

            <div>
              <Label className="text-xs">Lote Animal de Destino *</Label>
              <Select value={selectedLotId} onValueChange={handleLotChange} required>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecione o lote" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Data de Alojamento / Início *</Label>
              <Input
                type="date"
                value={refDate}
                onChange={(e) => setRefDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
            >
              Vincular e Gerar Cronograma ✨
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// COMPONENTE PRINCIPAL: SANIDADE
// ====================================================================
export default function Sanidade() {
  const { currentProperty, organization } = useAuth()
  const { canEdit, canDelete } = usePermissions()
  const {
    lots,
    activities,
    inventory,
    vaccinations,
    treatments,
    healthOccurrences,
    healthProtocols,
    vaccinationSessions,
    addVaccinationSession,
    deleteVaccinationSession,
    addVaccination,
    updateVaccination,
    deleteVaccination,
    addTreatment,
    updateTreatment,
    deleteTreatment,
    addHealthOccurrence,
    updateHealthOccurrence,
    deleteHealthOccurrence,
    addHealthProtocol,
    updateHealthProtocol,
    deleteHealthProtocol,
    addProtocolAssignment,
    addStockMovement,
    updateInventory,
  } = useFarmStore()

  const [activeTab, setActiveTab] = useState('vacinacao')
  const [searchTerm, setSearchTerm] = useState('')
  const [lotFilter, setLotFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modais de Cadastro / Edição
  const [vacModalOpen, setVacModalOpen] = useState(false)
  const [editingVac, setEditingVac] = useState<Vaccination | null>(null)

  const [trtModalOpen, setTrtModalOpen] = useState(false)
  const [editingTrt, setEditingTrt] = useState<Treatment | null>(null)

  const [occModalOpen, setOccModalOpen] = useState(false)
  const [editingOcc, setEditingOcc] = useState<HealthOccurrence | null>(null)

  const [protoModalOpen, setProtoModalOpen] = useState(false)
  const [editingProto, setEditingProto] = useState<HealthProtocol | null>(null)

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedProtocolToAssign, setSelectedProtocolToAssign] = useState<HealthProtocol | null>(
    null,
  )

  // Modal Sessão de Vacinação / Frasco Aberto
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [selectedSessionForSummary, setSelectedSessionForSummary] =
    useState<VaccinationSession | null>(null)

  // Modal Registrar Aplicação (Programada -> Realizada)
  const [applyVacModalOpen, setApplyVacModalOpen] = useState(false)
  const [selectedVacToApply, setSelectedVacToApply] = useState<Vaccination | null>(null)

  // Diálogos de detalhes e exclusão genéricos
  const [detailsRecord, setDetailsRecord] = useState<{
    open: boolean
    title: string
    record: Record<string, any>
  }>({
    open: false,
    title: '',
    record: {},
  })

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    id: string
    name: string
    type: 'vac' | 'trt' | 'occ' | 'proto'
  }>({
    open: false,
    id: '',
    name: '',
    type: 'vac',
  })

  // ==========================================
  // FILTRAGEM DE REGISTROS
  // ==========================================
  const filteredVaccinations = useMemo(() => {
    return (vaccinations || []).filter((v) => {
      const matchSearch =
        !searchTerm ||
        (v.vaccine_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.disease_target || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.lotName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.responsible || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchLot = !lotFilter || v.lot_id === lotFilter
      const matchStatus = !statusFilter || v.status === statusFilter
      return matchSearch && matchLot && matchStatus
    })
  }, [vaccinations, searchTerm, lotFilter, statusFilter])

  const filteredTreatments = useMemo(() => {
    return (treatments || []).filter((t) => {
      const matchSearch =
        !searchTerm ||
        (t.medication_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.diagnosis_reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.lotName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.responsible || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchLot = !lotFilter || t.lot_id === lotFilter
      const matchStatus = !statusFilter || t.status === statusFilter
      return matchSearch && matchLot && matchStatus
    })
  }, [treatments, searchTerm, lotFilter, statusFilter])

  const filteredOccurrences = useMemo(() => {
    return (healthOccurrences || []).filter((o) => {
      const matchSearch =
        !searchTerm ||
        (o.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.symptoms || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.lotName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.responsible || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchLot = !lotFilter || o.lot_id === lotFilter
      return matchSearch && matchLot
    })
  }, [healthOccurrences, searchTerm, lotFilter])

  const filteredProtocols = useMemo(() => {
    return (healthProtocols || []).filter((p) => {
      const matchSearch =
        !searchTerm ||
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.activity_type || '').toLowerCase().includes(searchTerm.toLowerCase())
      return matchSearch
    })
  }, [healthProtocols, searchTerm])

  // ==========================================
  // KPI METRICS
  // ==========================================
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const scheduledVac = (vaccinations || []).filter((v) => v.status === 'scheduled').length
    const performedVac = (vaccinations || []).filter((v) => v.status === 'performed').length
    const delayedVac = (vaccinations || []).filter(
      (v) => v.status === 'scheduled' && v.scheduled_date && v.scheduled_date < today,
    ).length
    const activeTreatments = (treatments || []).filter((t) => t.status === 'in_progress').length
    const occurrencesCount = (healthOccurrences || []).length
    const protocolsCount = (healthProtocols || []).length
    const sessionsCount = (vaccinationSessions || []).length

    return {
      scheduledVac,
      performedVac,
      delayedVac,
      activeTreatments,
      occurrencesCount,
      protocolsCount,
      sessionsCount,
    }
  }, [vaccinations, treatments, healthOccurrences, healthProtocols, vaccinationSessions])

  const lotName = (lotId?: string, fallback?: string) => {
    if (!lotId) return fallback || 'Geral'
    const l = lots.find((item) => item.id === lotId)
    return l ? `${l.code} - ${l.name}` : fallback || 'Lote não identificado'
  }

  // ==========================================
  // HANDLERS: VACINAÇÃO
  // ==========================================
  const handleSaveVaccination = async (data: Omit<Vaccination, 'id'>) => {
    try {
      if (editingVac) {
        await updateVaccination(editingVac.id, data)
        toast({ title: 'Vacinação atualizada com sucesso!' })
      } else {
        await addVaccination(data)
        toast({ title: 'Vacinação cadastrada com sucesso!' })
      }
      setVacModalOpen(false)
      setEditingVac(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar vacinação',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      })
    }
  }

  const handleApplyVacConfirm = async (
    updatedVaccination: Partial<Vaccination>,
    stockMovement?: {
      inventoryItemId: string
      movementPayload: any
      updatePayload?: any
    },
  ) => {
    if (!selectedVacToApply) return
    try {
      await updateVaccination(selectedVacToApply.id, updatedVaccination)

      if (stockMovement && addStockMovement) {
        await addStockMovement(stockMovement.movementPayload as any)
        if (stockMovement.updatePayload && updateInventory) {
          await updateInventory(stockMovement.inventoryItemId, stockMovement.updatePayload)
        }
      }

      toast({
        title: 'Aplicação registrada com sucesso! 💉',
        description: stockMovement
          ? 'Status atualizado para Realizada e estoque devidamente baixado.'
          : 'Status atualizado para Realizada.',
      })

      setApplyVacModalOpen(false)
      setSelectedVacToApply(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar aplicação',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      })
    }
  }

  // Handler para salvar Sessão de Vacinação com rateio entre lotes
  const handleSaveVaccinationSession = async (
    sessionData: Omit<VaccinationSession, 'id'>,
    individualVaccinations: Array<{
      lot_id: string
      lotName: string
      animal_count: number
      dose_per_animal: number
      volume_per_dose?: number
      volume_unit?: string
      doses_applied: number
      doses_discarded: number
      total_downloaded: number
      cost: number
      unit_cost: number
      route: string
    }>,
    stockMovement?: {
      inventoryItemId: string
      movementPayload: any
      updatePayload?: any
    },
  ) => {
    try {
      const createdSessionId = `session-${Date.now()}`
      if (addVaccinationSession) {
        await addVaccinationSession({
          ...sessionData,
          id: createdSessionId,
        } as any)
      }

      // Cria os registros de vacinação para cada lote participante da sessão
      for (const vac of individualVaccinations) {
        await addVaccination({
          organization_id: organization?.id,
          property_id: currentProperty?.id,
          lot_id: vac.lot_id,
          lotName: vac.lotName,
          vaccine_name: sessionData.vaccine_name,
          disease_target: 'Sessão Vacinal / Frasco Multidose',
          scheduled_date: sessionData.session_date,
          performed_date: sessionData.session_date,
          animal_count: vac.animal_count,
          dose_per_animal: vac.dose_per_animal,
          dose_unit: 'dose',
          volume_per_dose: vac.volume_per_dose,
          volume_unit: vac.volume_unit || 'mL',
          application_route: vac.route,
          responsible: sessionData.responsible,
          inventory_item_id: sessionData.inventory_item_id,
          inventory_item_name: sessionData.inventory_item_name,
          batch_number: sessionData.manufacturer_batch,
          expiration_date: sessionData.expiration_date,
          quantity_used: vac.doses_applied,
          doses_applied: vac.doses_applied,
          doses_discarded: vac.doses_discarded,
          total_downloaded: vac.total_downloaded,
          unit_cost: vac.unit_cost,
          total_cost: vac.cost,
          stock_deducted: Boolean(stockMovement),
          vial_status:
            sessionData.vial_destiny === 'closed'
              ? 'closed'
              : sessionData.vial_destiny === 'kept'
                ? 'opened'
                : 'discarded',
          vial_destiny: sessionData.vial_destiny,
          discarded_quantity: vac.doses_discarded,
          waste_cost: Number((vac.doses_discarded * vac.unit_cost).toFixed(2)),
          session_id: createdSessionId,
          status: 'performed',
          notes: `Sessão Vacinal (Frasco ${sessionData.vial_capacity} doses). Destino da sobra: ${sessionData.vial_destiny === 'discarded' ? 'Descarte/Perda Técnica' : sessionData.vial_destiny === 'kept' ? 'Mantido' : 'Fechado'}. Custo rateado: R$ ${vac.cost.toFixed(2)}.`,
        })
      }

      // Efetua a baixa agregada do estoque se houver
      if (stockMovement && addStockMovement) {
        await addStockMovement(stockMovement.movementPayload as any)
        if (stockMovement.updatePayload && updateInventory) {
          await updateInventory(stockMovement.inventoryItemId, stockMovement.updatePayload)
        }
      }

      toast({
        title: 'Sessão Vacinal concluída com sucesso! 💉✨',
        description: `${individualVaccinations.length} lotes atendidos. Custo total apropriado: R$ ${sessionData.total_cost.toFixed(2)}.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar sessão de vacinação',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      })
      throw err
    }
  }

  // ==========================================
  // HANDLERS: TRATAMENTO
  // ==========================================
  const handleSaveTreatment = async (data: Omit<Treatment, 'id'>) => {
    try {
      if (editingTrt) {
        await updateTreatment(editingTrt.id, data)
        toast({ title: 'Tratamento atualizado com sucesso!' })
      } else {
        await addTreatment(data)

        if (data.stock_deducted && data.inventory_item_id && data.quantity_used) {
          const itm = inventory.find((i) => i.id === data.inventory_item_id)
          if (itm && addStockMovement) {
            const newStock = Math.max(0, (itm.currentStock || 0) - Number(data.quantity_used))
            await addStockMovement({
              property_id: currentProperty?.id,
              inventory_item_id: itm.id,
              inventoryItemName: itm.name,
              type: 'saida',
              movementType: 'Consumo',
              quantity: Number(data.quantity_used),
              unit: itm.unit || 'un',
              balanceAfter: Number(newStock.toFixed(3)),
              unitValue: Number((itm.averageCost || 0).toFixed(4)),
              totalValue: Number((Number(data.quantity_used) * (itm.averageCost || 0)).toFixed(2)),
              date: data.start_date || new Date().toISOString().split('T')[0],
              lotId: data.lot_id,
              lotName: data.lotName,
              notes: `Tratamento Veterinário: ${data.medication_name}`,
              generateExpense: false,
            } as any)
            if (updateInventory) {
              await updateInventory(itm.id, {
                currentStock: Number(newStock.toFixed(3)),
                lastUpdated: new Date().toISOString().split('T')[0],
              })
            }
          }
        }

        toast({ title: 'Tratamento cadastrado com sucesso!' })
      }
      setTrtModalOpen(false)
      setEditingTrt(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar tratamento',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      })
    }
  }

  // ==========================================
  // HANDLERS: OCORRÊNCIA CLÍNICA
  // ==========================================
  const handleSaveOccurrence = async (data: Omit<HealthOccurrence, 'id'>) => {
    try {
      if (editingOcc) {
        await updateHealthOccurrence(editingOcc.id, data)
        toast({ title: 'Ocorrência atualizada com sucesso!' })
      } else {
        await addHealthOccurrence(data)
        toast({ title: 'Ocorrência cadastrada com sucesso!' })
      }
      setOccModalOpen(false)
      setEditingOcc(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar ocorrência',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      })
    }
  }

  // ==========================================
  // HANDLERS: PROTOCOLO SANITÁRIO
  // ==========================================
  const handleSaveProtocol = async (data: Omit<HealthProtocol, 'id'>) => {
    try {
      if (editingProto) {
        await updateHealthProtocol(editingProto.id, data)
        toast({ title: 'Protocolo sanitário atualizado com sucesso!' })
      } else {
        await addHealthProtocol(data)
        toast({ title: 'Protocolo sanitário criado com sucesso!' })
      }
      setProtoModalOpen(false)
      setEditingProto(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar protocolo',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      })
    }
  }

  const handleAssignProtocolConfirm = async (lotId: string, refDate: string) => {
    if (!selectedProtocolToAssign) return
    try {
      const lot = lots.find((l) => l.id === lotId)

      await addProtocolAssignment({
        organization_id: organization?.id,
        property_id: currentProperty?.id,
        protocol_id: selectedProtocolToAssign.id,
        protocolName: selectedProtocolToAssign.name,
        lot_id: lotId,
        lotName: lot?.name,
        start_date: refDate,
        assigned_date: new Date().toISOString().split('T')[0],
        generated_entries: [],
      })

      if (selectedProtocolToAssign.steps && selectedProtocolToAssign.steps.length > 0) {
        for (const st of selectedProtocolToAssign.steps) {
          const d = new Date(refDate)
          d.setDate(d.getDate() + (Number(st.day) || 0))
          const scheduledDate = d.toISOString().split('T')[0]

          await addVaccination({
            organization_id: organization?.id,
            property_id: currentProperty?.id,
            lot_id: lotId,
            lotName: lot?.name,
            vaccine_name: st.action,
            disease_target: selectedProtocolToAssign.name,
            scheduled_date: scheduledDate,
            dose_per_animal: 0.5,
            dose_unit: 'mL',
            application_route: 'água',
            animal_count: lot?.initialQuantity || 100,
            status: 'scheduled',
            notes: `Gerado pelo protocolo "${selectedProtocolToAssign.name}" (Dia ${st.day}). ${st.description || ''}`,
          })
        }
      }

      toast({
        title: 'Protocolo vinculado com sucesso! ✨',
        description: `${selectedProtocolToAssign.steps?.length || 0} vacinações programadas criadas no cronograma.`,
      })

      setAssignModalOpen(false)
      setSelectedProtocolToAssign(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao vincular protocolo',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      })
    }
  }

  // ==========================================
  // CONFIRMAÇÃO DE EXCLUSÃO
  // ==========================================
  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.type === 'vac') {
        await deleteVaccination(deleteConfirm.id)
        toast({ title: 'Vacinação removida com sucesso' })
      } else if (deleteConfirm.type === 'trt') {
        await deleteTreatment(deleteConfirm.id)
        toast({ title: 'Tratamento removido com sucesso' })
      } else if (deleteConfirm.type === 'occ') {
        await deleteHealthOccurrence(deleteConfirm.id)
        toast({ title: 'Ocorrência removida com sucesso' })
      } else if (deleteConfirm.type === 'proto') {
        await deleteHealthProtocol(deleteConfirm.id)
        toast({ title: 'Protocolo sanitário removido com sucesso' })
      }
      setDeleteConfirm({ open: false, id: '', name: '', type: 'vac' })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir registro',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Syringe className="w-7 h-7 text-emerald-600" />
            Sanidade Animal & Biosseguridade
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cronograma vacinal, controle de carências, tratamentos e rastreabilidade de frascos.
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'vacinacao' && (
              <>
                <Button
                  onClick={() => setSessionModalOpen(true)}
                  className="rounded-xl h-9 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm"
                >
                  <Layers className="w-4 h-4" /> Nova Sessão / Frasco Aberto
                </Button>
                <Button
                  onClick={() => {
                    setEditingVac(null)
                    setVacModalOpen(true)
                  }}
                  className="rounded-xl h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Nova Vacinação
                </Button>
              </>
            )}
            {activeTab === 'tratamentos' && (
              <Button
                onClick={() => {
                  setEditingTrt(null)
                  setTrtModalOpen(true)
                }}
                className="rounded-xl h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Novo Tratamento
              </Button>
            )}
            {activeTab === 'ocorrencias' && (
              <Button
                onClick={() => {
                  setEditingOcc(null)
                  setOccModalOpen(true)
                }}
                className="rounded-xl h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Nova Ocorrência
              </Button>
            )}
            {activeTab === 'protocolos' && (
              <Button
                onClick={() => {
                  setEditingProto(null)
                  setProtoModalOpen(true)
                }}
                className="rounded-xl h-9 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Novo Protocolo
              </Button>
            )}
          </div>
        )}
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="rounded-2xl bg-white border border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">Programadas</span>
              <Clock className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-black text-foreground">{stats.scheduledVac}</div>
            <span className="text-[10px] text-muted-foreground">Vacinas na agenda</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white border border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">Atrasadas</span>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div
              className={`text-xl font-black ${stats.delayedVac > 0 ? 'text-rose-600' : 'text-foreground'}`}
            >
              {stats.delayedVac}
            </div>
            <span className="text-[10px] text-muted-foreground">Requerem atenção</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white border border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">Realizadas</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-emerald-600">{stats.performedVac}</div>
            <span className="text-[10px] text-muted-foreground">Aplicações feitas</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white border border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">Tratamentos</span>
              <Pill className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-black text-blue-600">{stats.activeTreatments}</div>
            <span className="text-[10px] text-muted-foreground">Em andamento</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white border border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">Ocorrências</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-black text-amber-600">{stats.occurrencesCount}</div>
            <span className="text-[10px] text-muted-foreground">Registros clínicos</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white border border-border/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">Protocolos</span>
              <FileText className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-black text-purple-600">{stats.protocolsCount}</div>
            <span className="text-[10px] text-muted-foreground">Modelos padrão</span>
          </CardContent>
        </Card>
      </div>

      {/* ABAS & FILTROS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <TabsList className="bg-secondary/60 p-1 rounded-xl">
            <TabsTrigger
              value="vacinacao"
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
            >
              <Syringe className="w-3.5 h-3.5" /> Vacinação ({vaccinations?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="tratamentos"
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
            >
              <Pill className="w-3.5 h-3.5" /> Tratamentos ({treatments?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="ocorrencias"
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Ocorrências (
              {healthOccurrences?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="protocolos"
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" /> Protocolos ({healthProtocols?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Barra de Filtros Rápida */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, lote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl"
              />
            </div>

            <Select value={lotFilter} onValueChange={setLotFilter}>
              <SelectTrigger className="h-9 text-xs rounded-xl w-36">
                <SelectValue placeholder="Todos os Lotes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os Lotes</SelectItem>
                {lots.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.code} - {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(activeTab === 'vacinacao' || activeTab === 'tratamentos') && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs rounded-xl w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {activeTab === 'vacinacao' ? (
                    <>
                      <SelectItem value="scheduled">Programada</SelectItem>
                      <SelectItem value="performed">Realizada</SelectItem>
                      <SelectItem value="delayed">Atrasada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="scheduled">Programado</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* TAB 1: VACINAÇÃO */}
        <TabsContent value="vacinacao" className="space-y-3 mt-0">
          {filteredVaccinations.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50">
              <Syringe className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-foreground">Nenhuma vacinação encontrada</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Planeje as vacinas preventivas dos seus lotes ou registre aplicações com baixa no
                estoque.
              </p>
              {canEdit && (
                <Button
                  onClick={() => {
                    setEditingVac(null)
                    setVacModalOpen(true)
                  }}
                  className="rounded-xl h-9 text-xs font-bold mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Cadastrar Primeira Vacinação
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredVaccinations.map((vac) => {
                const isDelayed =
                  vac.status === 'scheduled' &&
                  vac.scheduled_date &&
                  vac.scheduled_date < new Date().toISOString().split('T')[0]

                return (
                  <Card
                    key={vac.id}
                    className="rounded-2xl border border-border/70 hover:border-emerald-500/50 transition-all duration-200 bg-card shadow-xs overflow-hidden flex flex-col justify-between"
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {vac.vaccine_name}
                            </span>
                            {vac.disease_target && (
                              <span className="text-[10px] text-muted-foreground">
                                • {vac.disease_target}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                            <Layers className="w-3 h-3 text-emerald-600" />
                            {lotName(vac.lot_id, vac.lotName)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {vac.status === 'performed' && (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[10px] gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Realizada
                            </Badge>
                          )}
                          {vac.status === 'scheduled' && !isDelayed && (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200 text-[10px] gap-1">
                              <Clock className="w-3 h-3" /> Programada
                            </Badge>
                          )}
                          {isDelayed && (
                            <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border border-rose-200 text-[10px] gap-1">
                              <AlertCircle className="w-3 h-3" /> Atrasada
                            </Badge>
                          )}
                          {vac.status === 'cancelled' && (
                            <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border border-zinc-200 text-[10px] gap-1">
                              <XCircle className="w-3 h-3" /> Cancelada
                            </Badge>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                              {(vac.status === 'scheduled' || isDelayed) && canEdit && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedVacToApply(vac)
                                    setApplyVacModalOpen(true)
                                  }}
                                  className="text-xs font-semibold text-emerald-700 cursor-pointer gap-2"
                                >
                                  <Syringe className="w-3.5 h-3.5" /> 💉 Registrar aplicação
                                </DropdownMenuItem>
                              )}
                              {vac.session_id && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    const session = (vaccinationSessions || []).find(
                                      (s) => s.id === vac.session_id,
                                    )
                                    if (session) {
                                      setSelectedSessionForSummary(session)
                                    } else {
                                      // Fallback se a sessão não estiver carregada na lista completa
                                      const sessionVacList = (vaccinations || []).filter(
                                        (v) => v.session_id === vac.session_id,
                                      )
                                      const totalApp = sessionVacList.reduce(
                                        (acc, curr) =>
                                          acc +
                                          Number(curr.doses_applied || curr.quantity_used || 0),
                                        0,
                                      )
                                      const totalCost = sessionVacList.reduce(
                                        (acc, curr) => acc + Number(curr.total_cost || 0),
                                        0,
                                      )
                                      const syntheticSession: VaccinationSession = {
                                        id: vac.session_id,
                                        vaccine_name: vac.vaccine_name,
                                        session_date:
                                          vac.performed_date || vac.scheduled_date || '',
                                        vial_capacity: 100,
                                        initial_quantity: 100,
                                        vial_cost: totalCost,
                                        unit_cost: totalCost > 0 ? totalCost / 100 : 0,
                                        vial_destiny: vac.vial_destiny || 'discarded',
                                        total_applied: totalApp,
                                        total_discarded: Math.max(0, 100 - totalApp),
                                        total_downloaded: 100,
                                        total_cost: totalCost,
                                        status: 'completed',
                                        responsible: vac.responsible,
                                        inventory_item_name: vac.inventory_item_name,
                                        manufacturer_batch: vac.batch_number,
                                        applications: sessionVacList.map((sv) => ({
                                          lot_id: sv.lot_id,
                                          lotName: lotName(sv.lot_id, sv.lotName),
                                          animal_count: sv.animal_count,
                                          dose_per_animal: sv.dose_per_animal,
                                          volume_per_dose: sv.volume_per_dose,
                                          volume_unit: sv.volume_unit,
                                          doses_applied: Number(
                                            sv.doses_applied || sv.quantity_used || 0,
                                          ),
                                          cost: Number(sv.total_cost || 0),
                                        })),
                                      }
                                      setSelectedSessionForSummary(syntheticSession)
                                    }
                                  }}
                                  className="text-xs font-semibold text-purple-700 cursor-pointer gap-2"
                                >
                                  <Layers className="w-3.5 h-3.5" /> Ver Sessão / Frasco
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  setDetailsRecord({
                                    open: true,
                                    title: `Vacinação: ${vac.vaccine_name}`,
                                    record: {
                                      'Nome da Vacina': vac.vaccine_name,
                                      'Alvo / Doença': vac.disease_target || '—',
                                      'Lote Animal': lotName(vac.lot_id, vac.lotName),
                                      Status:
                                        vac.status === 'performed' ? 'Realizada' : 'Programada',
                                      'Data Programada': vac.scheduled_date || '—',
                                      'Data Realizada': vac.performed_date || '—',
                                      'Aves Vacinadas': vac.animal_count || '—',
                                      'Dose por Ave': `${vac.dose_per_animal ?? 1} dose`,
                                      'Volume por Dose': vac.volume_per_dose
                                        ? `${vac.volume_per_dose} ${vac.volume_unit || 'mL'}`
                                        : '—',
                                      'Via de Aplicação': vac.application_route || '—',
                                      'Doses Aplicadas':
                                        vac.doses_applied ?? vac.quantity_used ?? '—',
                                      'Custo Apropriado ao Lote': vac.total_cost
                                        ? `R$ ${Number(vac.total_cost).toFixed(2)}`
                                        : '—',
                                      ...(vac.session_id
                                        ? { 'Sessão Vinculada': vac.session_id }
                                        : {}),
                                      Responsável: vac.responsible || '—',
                                      'Item Estoque Vinculado': vac.inventory_item_name || '—',
                                      'Lote Fabricante': vac.batch_number || '—',
                                      'Baixa em Estoque': vac.stock_deducted
                                        ? 'Sim (Efetuada)'
                                        : 'Não',
                                      Observações: vac.notes || '—',
                                    },
                                  })
                                }
                                className="text-xs cursor-pointer gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" /> Ver Detalhes
                              </DropdownMenuItem>
                              {canEdit && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingVac(vac)
                                    setVacModalOpen(true)
                                  }}
                                  className="text-xs cursor-pointer gap-2"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Editar
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      id: vac.id,
                                      name: vac.vaccine_name,
                                      type: 'vac',
                                    })
                                  }
                                  className="text-xs text-rose-600 focus:text-rose-600 cursor-pointer gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Informações centrais */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            {vac.status === 'performed' ? 'Realizada em:' : 'Prevista para:'}
                          </span>
                          <strong className="text-foreground flex items-center gap-1 font-semibold">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {vac.status === 'performed'
                              ? vac.performed_date || vac.scheduled_date
                              : vac.scheduled_date || 'A definir'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Dose / Via:
                          </span>
                          <strong className="text-foreground font-semibold">
                            {vac.dose_per_animal ?? 1} dose ({vac.application_route || 'ocular'})
                          </strong>
                          {vac.volume_per_dose && (
                            <span className="text-[10px] text-muted-foreground block">
                              Vol: {vac.volume_per_dose} {vac.volume_unit || 'mL'}/dose
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Detalhes de vacinação realizada */}
                      {vac.status === 'performed' ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] space-y-1">
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Aves vacinadas:</span>
                              <strong className="text-foreground">{vac.animal_count ?? '—'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Dose por ave:</span>
                              <strong className="text-foreground">
                                {vac.dose_per_animal ?? 1} dose
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Doses aplicadas:</span>
                              <strong className="text-emerald-700 font-bold">
                                {vac.doses_applied ?? vac.quantity_used ?? '—'}
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Via:</span>
                              <span className="capitalize font-medium text-foreground">
                                {vac.application_route || 'ocular'}
                              </span>
                            </div>
                            <div className="flex justify-between col-span-2">
                              <span className="text-muted-foreground">Volume por dose:</span>
                              <span className="font-medium text-foreground">
                                {vac.volume_per_dose
                                  ? `${vac.volume_per_dose} ${vac.volume_unit || 'mL'}`
                                  : '—'}
                              </span>
                            </div>
                          </div>
                          {vac.total_cost !== undefined && (
                            <div className="flex justify-between items-center border-t border-emerald-200 pt-1 mt-1 font-bold">
                              <span className="text-emerald-950">Custo apropriado:</span>
                              <span className="text-emerald-800 text-xs">
                                R$ {Number(vac.total_cost).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {vac.session_id && (
                            <div className="pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                              <span className="text-[10px] text-emerald-900/70">
                                Sessão Frasco Multidose
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const session = (vaccinationSessions || []).find(
                                    (s) => s.id === vac.session_id,
                                  )
                                  if (session) {
                                    setSelectedSessionForSummary(session)
                                  } else {
                                    const sessionVacList = (vaccinations || []).filter(
                                      (v) => v.session_id === vac.session_id,
                                    )
                                    const totalApp = sessionVacList.reduce(
                                      (acc, curr) =>
                                        acc + Number(curr.doses_applied || curr.quantity_used || 0),
                                      0,
                                    )
                                    const totalCost = sessionVacList.reduce(
                                      (acc, curr) => acc + Number(curr.total_cost || 0),
                                      0,
                                    )
                                    const syntheticSession: VaccinationSession = {
                                      id: vac.session_id,
                                      vaccine_name: vac.vaccine_name,
                                      session_date: vac.performed_date || vac.scheduled_date || '',
                                      vial_capacity: 100,
                                      initial_quantity: 100,
                                      vial_cost: totalCost,
                                      unit_cost: totalCost > 0 ? totalCost / 100 : 0,
                                      vial_destiny: vac.vial_destiny || 'discarded',
                                      total_applied: totalApp,
                                      total_discarded: Math.max(0, 100 - totalApp),
                                      total_downloaded: 100,
                                      total_cost: totalCost,
                                      status: 'completed',
                                      responsible: vac.responsible,
                                      inventory_item_name: vac.inventory_item_name,
                                      manufacturer_batch: vac.batch_number,
                                      applications: sessionVacList.map((sv) => ({
                                        lot_id: sv.lot_id,
                                        lotName: lotName(sv.lot_id, sv.lotName),
                                        animal_count: sv.animal_count,
                                        dose_per_animal: sv.dose_per_animal,
                                        volume_per_dose: sv.volume_per_dose,
                                        volume_unit: sv.volume_unit,
                                        doses_applied: Number(
                                          sv.doses_applied || sv.quantity_used || 0,
                                        ),
                                        cost: Number(sv.total_cost || 0),
                                      })),
                                    }
                                    setSelectedSessionForSummary(syntheticSession)
                                  }
                                }}
                                className="h-6 px-2 text-[10px] font-bold text-purple-700 hover:text-purple-900 hover:bg-purple-100/60 rounded-md gap-1"
                              >
                                <Layers className="w-3 h-3 text-purple-600" /> Ver sessão
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        (vac.quantity_used || vac.total_cost || vac.vial_status) && (
                          <div className="p-2 rounded-xl bg-secondary/40 border border-border/60 text-[11px] space-y-1">
                            {vac.quantity_used && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Previsão consumo:</span>
                                <strong className="text-foreground">
                                  {vac.quantity_used} {vac.dose_unit || 'doses'}
                                </strong>
                              </div>
                            )}
                            {vac.total_cost && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Custo previsto:</span>
                                <strong className="text-emerald-700 font-bold">
                                  R$ {Number(vac.total_cost).toFixed(2)}
                                </strong>
                              </div>
                            )}
                          </div>
                        )
                      )}

                      {/* Botão de Ação Rápida para Programadas */}
                      {canEdit && (vac.status === 'scheduled' || isDelayed) && (
                        <Button
                          onClick={() => {
                            setSelectedVacToApply(vac)
                            setApplyVacModalOpen(true)
                          }}
                          size="sm"
                          className="w-full h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                        >
                          <Syringe className="w-3.5 h-3.5" /> Registrar Aplicação
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: TRATAMENTOS */}
        <TabsContent value="tratamentos" className="space-y-3 mt-0">
          {filteredTreatments.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50">
              <Pill className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-foreground">Nenhum tratamento registrado</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Controle medicamentos, períodos de carência de ovos/carne e dosagens por lote.
              </p>
              {canEdit && (
                <Button
                  onClick={() => {
                    setEditingTrt(null)
                    setTrtModalOpen(true)
                  }}
                  className="rounded-xl h-9 text-xs font-bold mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Tratamento
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTreatments.map((trt) => (
                <Card
                  key={trt.id}
                  className="rounded-2xl border border-border/70 hover:border-blue-500/50 transition-all duration-200 bg-card shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground">
                            {trt.medication_name}
                          </span>
                          {trt.diagnosis_reason && (
                            <span className="text-[10px] text-muted-foreground">
                              • {trt.diagnosis_reason}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-blue-800 font-semibold flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-600" />
                          {lotName(trt.lot_id, trt.lotName)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {trt.status === 'in_progress' && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200 text-[10px] gap-1">
                            <Clock className="w-3 h-3" /> Em Andamento
                          </Badge>
                        )}
                        {trt.status === 'completed' && (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[10px] gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Concluído
                          </Badge>
                        )}
                        {trt.status === 'scheduled' && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200 text-[10px] gap-1">
                            <Clock className="w-3 h-3" /> Programado
                          </Badge>
                        )}
                        {trt.status === 'cancelled' && (
                          <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border border-zinc-200 text-[10px] gap-1">
                            <XCircle className="w-3 h-3" /> Cancelado
                          </Badge>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuItem
                              onClick={() =>
                                setDetailsRecord({
                                  open: true,
                                  title: `Tratamento: ${trt.medication_name}`,
                                  record: {
                                    Medicamento: trt.medication_name,
                                    'Motivo / Diagnóstico': trt.diagnosis_reason || '—',
                                    Lote: lotName(trt.lot_id, trt.lotName),
                                    Status: trt.status,
                                    Dosagem: trt.dosage || '—',
                                    Frequência: trt.frequency || '—',
                                    Duração: `${trt.duration_days || '—'} dias`,
                                    'Período de Carência': `${trt.withdrawal_period_days || 0} dias`,
                                    'Data Início': trt.start_date || '—',
                                    'Data Término': trt.end_date || '—',
                                    Responsável: trt.responsible || '—',
                                    'Item de Estoque': trt.inventory_item_name || '—',
                                    'Qtd Consumida': trt.quantity_used
                                      ? `${trt.quantity_used}`
                                      : '—',
                                    Observações: trt.notes || '—',
                                  },
                                })
                              }
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" /> Ver Detalhes
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingTrt(trt)
                                  setTrtModalOpen(true)
                                }}
                                className="text-xs cursor-pointer gap-2"
                              >
                                <Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setDeleteConfirm({
                                    open: true,
                                    id: trt.id,
                                    name: trt.medication_name,
                                    type: 'trt',
                                  })
                                }
                                className="text-xs text-rose-600 focus:text-rose-600 cursor-pointer gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Período de Uso:
                        </span>
                        <strong className="text-foreground flex items-center gap-1 font-semibold">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {trt.start_date || 'Início não inf.'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Carência Abate/Ovos:
                        </span>
                        <strong className="text-amber-700 font-semibold">
                          {trt.withdrawal_period_days
                            ? `${trt.withdrawal_period_days} dias`
                            : '0 dias'}
                        </strong>
                      </div>
                    </div>

                    {trt.dosage && (
                      <div className="p-2 rounded-xl bg-secondary/40 border border-border/60 text-[11px] flex justify-between">
                        <span className="text-muted-foreground">Posologia:</span>
                        <span className="font-semibold text-foreground">
                          {trt.dosage} ({trt.frequency || '24h'})
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: OCORRÊNCIAS CLÍNICAS */}
        <TabsContent value="ocorrencias" className="space-y-3 mt-0">
          {filteredOccurrences.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50">
              <AlertTriangle className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-foreground">Nenhuma ocorrência clínica</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Cadastre notificações de sintomas, doenças, ferimentos e medidas corretivas tomadas.
              </p>
              {canEdit && (
                <Button
                  onClick={() => {
                    setEditingOcc(null)
                    setOccModalOpen(true)
                  }}
                  className="rounded-xl h-9 text-xs font-bold mt-4 bg-amber-600 hover:bg-amber-700 text-white gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Ocorrência
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredOccurrences.map((occ) => {
                const isCritical = occ.severity === 'critical' || occ.severity === 'high'
                return (
                  <Card
                    key={occ.id}
                    className={`rounded-2xl border transition-all duration-200 bg-card shadow-xs overflow-hidden flex flex-col justify-between ${
                      isCritical
                        ? 'border-rose-300/80 hover:border-rose-500'
                        : 'border-border/70 hover:border-amber-500/50'
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-foreground block">
                            {occ.occurrence_type === 'other'
                              ? occ.custom_type || 'Ocorrência Geral'
                              : occ.occurrence_type === 'respiratory'
                                ? 'Problema Respiratório'
                                : occ.occurrence_type === 'diarrhea'
                                  ? 'Diarreia / Digestivo'
                                  : occ.occurrence_type === 'locomotor'
                                    ? 'Problema Locomotor'
                                    : occ.occurrence_type === 'parasites'
                                      ? 'Parasitas'
                                      : occ.occurrence_type === 'injury'
                                        ? 'Ferimento / Bicagem'
                                        : occ.occurrence_type === 'disease'
                                          ? 'Doença Clínica'
                                          : 'Sintoma Clínico'}
                          </span>
                          <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                            <Layers className="w-3 h-3 text-amber-600" />
                            {lotName(occ.lot_id, occ.lotName)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {occ.severity === 'critical' && (
                            <Badge className="bg-rose-600 text-white text-[10px]">Crítica</Badge>
                          )}
                          {occ.severity === 'high' && (
                            <Badge className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px]">
                              Alta
                            </Badge>
                          )}
                          {occ.severity === 'moderate' && (
                            <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">
                              Moderada
                            </Badge>
                          )}
                          {occ.severity === 'low' && (
                            <Badge className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px]">
                              Baixa
                            </Badge>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                              <DropdownMenuItem
                                onClick={() =>
                                  setDetailsRecord({
                                    open: true,
                                    title: 'Ocorrência Clínica',
                                    record: {
                                      Tipo: occ.occurrence_type,
                                      Severidade: occ.severity,
                                      Lote: lotName(occ.lot_id, occ.lotName),
                                      'Data Notificada': occ.occurrence_date
                                        ? occ.occurrence_date.split('T')[0]
                                        : '—',
                                      'Aves Afetadas': occ.affected_count || 1,
                                      Sintomas: occ.symptoms || '—',
                                      Descrição: occ.description || '—',
                                      'Ação Tomada': occ.action_taken || '—',
                                      Responsável: occ.responsible || '—',
                                      Observações: occ.notes || '—',
                                    },
                                  })
                                }
                                className="text-xs cursor-pointer gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" /> Ver Detalhes
                              </DropdownMenuItem>
                              {canEdit && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingOcc(occ)
                                    setOccModalOpen(true)
                                  }}
                                  className="text-xs cursor-pointer gap-2"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Editar
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      id: occ.id,
                                      name: occ.symptoms || occ.description || 'Ocorrência',
                                      type: 'occ',
                                    })
                                  }
                                  className="text-xs text-rose-600 focus:text-rose-600 cursor-pointer gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Data:</span>
                          <strong className="text-foreground flex items-center gap-1 font-semibold">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {occ.occurrence_date ? occ.occurrence_date.split('T')[0] : '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Aves Afetadas:
                          </span>
                          <strong className="text-foreground font-semibold">
                            {occ.affected_count || 1} aves
                          </strong>
                        </div>
                      </div>

                      {occ.symptoms && (
                        <p className="text-xs text-muted-foreground bg-secondary/40 p-2 rounded-xl">
                          <strong className="text-foreground">Sintomas:</strong> {occ.symptoms}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: PROTOCOLOS SANITÁRIOS */}
        <TabsContent value="protocolos" className="space-y-3 mt-0">
          {filteredProtocols.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50">
              <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-foreground">
                Nenhum protocolo sanitário criado
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Padronize cronogramas vacinais e de manejo sanitário para aplicar a novos lotes com
                1 clique.
              </p>
              {canEdit && (
                <Button
                  onClick={() => {
                    setEditingProto(null)
                    setProtoModalOpen(true)
                  }}
                  className="rounded-xl h-9 text-xs font-bold mt-4 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Criar Primeiro Protocolo
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredProtocols.map((proto) => (
                <Card
                  key={proto.id}
                  className="rounded-2xl border border-border/70 hover:border-purple-500/50 transition-all duration-200 bg-card shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground block">
                          {proto.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {proto.activity_type || 'Avicultura'} • {proto.steps?.length || 0} etapas
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Badge className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px]">
                          {proto.protocol_type === 'vaccination_program'
                            ? 'Vacinal'
                            : proto.protocol_type === 'deworming'
                              ? 'Vermífugo'
                              : 'Sanitário'}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            {canEdit && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProtocolToAssign(proto)
                                  setAssignModalOpen(true)
                                }}
                                className="text-xs font-semibold text-purple-700 cursor-pointer gap-2"
                              >
                                <Link2 className="w-3.5 h-3.5" /> Vincular a Lote 🔗
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                setDetailsRecord({
                                  open: true,
                                  title: `Protocolo: ${proto.name}`,
                                  record: {
                                    Nome: proto.name,
                                    Tipo: proto.protocol_type,
                                    Atividade: proto.activity_type || 'Avicultura',
                                    'Faixa de Idade': `${proto.age_range_start || 1} a ${proto.age_range_end || 60} dias`,
                                    'Total de Etapas': proto.steps?.length || 0,
                                    Etapas: (proto.steps || [])
                                      .map((s) => `Dia ${s.day}: ${s.action}`)
                                      .join(' | '),
                                    Observações: proto.notes || '—',
                                  },
                                })
                              }
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" /> Ver Detalhes
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingProto(proto)
                                  setProtoModalOpen(true)
                                }}
                                className="text-xs cursor-pointer gap-2"
                              >
                                <Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setDeleteConfirm({
                                    open: true,
                                    id: proto.id,
                                    name: proto.name,
                                    type: 'proto',
                                  })
                                }
                                className="text-xs text-rose-600 focus:text-rose-600 cursor-pointer gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Lista prévia das primeiras etapas */}
                    {proto.steps && proto.steps.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-border/50">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Etapas Programadas:
                        </span>
                        <div className="space-y-1">
                          {proto.steps.slice(0, 3).map((st, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] flex items-center justify-between p-1.5 rounded-lg bg-secondary/50 text-foreground"
                            >
                              <span className="font-semibold text-purple-900">Dia {st.day}</span>
                              <span className="truncate max-w-[180px] text-muted-foreground text-[10px]">
                                {st.action}
                              </span>
                            </div>
                          ))}
                          {proto.steps.length > 3 && (
                            <span className="text-[10px] text-purple-600 font-semibold block text-center pt-0.5">
                              + {proto.steps.length - 3} outras etapas
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {canEdit && (
                      <Button
                        onClick={() => {
                          setSelectedProtocolToAssign(proto)
                          setAssignModalOpen(true)
                        }}
                        size="sm"
                        className="w-full h-8 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-xs mt-1"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Vincular a Lote
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DIÁLOGOS E MODAIS */}
      <ApplyVaccinationDialog
        open={applyVacModalOpen}
        onOpenChange={setApplyVacModalOpen}
        vaccination={selectedVacToApply}
        lots={lots}
        inventory={inventory}
        onConfirm={handleApplyVacConfirm}
      />

      <VaccinationSessionDialog
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        lots={lots}
        inventory={inventory}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSaveSession={handleSaveVaccinationSession}
      />

      <VaccinationDialog
        open={vacModalOpen}
        onOpenChange={setVacModalOpen}
        editing={editingVac}
        lots={lots}
        activities={activities}
        inventory={inventory}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={handleSaveVaccination}
      />

      <TreatmentDialog
        open={trtModalOpen}
        onOpenChange={setTrtModalOpen}
        editing={editingTrt}
        lots={lots}
        activities={activities}
        inventory={inventory}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={handleSaveTreatment}
      />

      <OccurrenceDialog
        open={occModalOpen}
        onOpenChange={setOccModalOpen}
        editing={editingOcc}
        lots={lots}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={handleSaveOccurrence}
      />

      <ProtocolDialog
        open={protoModalOpen}
        onOpenChange={setProtoModalOpen}
        editing={editingProto}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={handleSaveProtocol}
      />

      <AssignProtocolDialog
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        protocol={selectedProtocolToAssign}
        lots={lots}
        onAssign={handleAssignProtocolConfirm}
      />

      {/* Diálogo Resumo da Sessão / Frasco Aberto */}
      <Dialog
        open={Boolean(selectedSessionForSummary)}
        onOpenChange={(open) => {
          if (!open) setSelectedSessionForSummary(null)
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Syringe className="w-5 h-5 text-emerald-600" />
              Resumo da Sessão de Vacinação
            </DialogTitle>
          </DialogHeader>

          {selectedSessionForSummary &&
            (() => {
              const session = selectedSessionForSummary
              const sessionVacList = (vaccinations || []).filter((v) => v.session_id === session.id)

              // Resolve applications: use session.applications if non-empty, otherwise derive from sessionVacList
              const apps =
                session.applications && session.applications.length > 0
                  ? session.applications
                  : sessionVacList.map((v) => ({
                      lot_id: v.lot_id,
                      lotName: lotName(v.lot_id, v.lotName),
                      animal_count: v.animal_count,
                      dose_per_animal: v.dose_per_animal ?? 1,
                      volume_per_dose: v.volume_per_dose,
                      volume_unit: v.volume_unit || 'mL',
                      doses_applied: Number(v.doses_applied ?? v.quantity_used ?? 0),
                      cost: Number(v.total_cost ?? 0),
                      notes: v.notes,
                    }))

              const totalApplied =
                session.total_applied ??
                apps.reduce((acc, a) => acc + (Number(a.doses_applied) || 0), 0)
              const vialCapacity = session.vial_capacity || 100
              const totalDiscarded =
                session.total_discarded ?? Math.max(0, vialCapacity - totalApplied)
              const totalDownloaded = session.total_downloaded ?? vialCapacity
              const totalCost = Number(
                session.total_cost ?? apps.reduce((acc, a) => acc + (Number(a.cost) || 0), 0),
              )
              const totalBirds = apps.reduce((acc, a) => acc + (Number(a.animal_count) || 0), 0)
              const totalLots = apps.length

              return (
                <div className="space-y-4 mt-2">
                  {/* Cabeçalho da sessão */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                          Vacina / Produto
                        </span>
                        <h4 className="text-sm font-bold text-emerald-950">
                          {session.vaccine_name}
                        </h4>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        {session.status === 'completed' ? 'Concluída' : 'Realizada'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-emerald-900 border-t border-emerald-200/50">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">
                          Data da Sessão:
                        </span>
                        <strong className="font-semibold">{session.session_date || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">
                          Responsável:
                        </span>
                        <strong className="font-semibold">{session.responsible || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">
                          Lote Fabricante:
                        </span>
                        <strong className="font-semibold">
                          {session.manufacturer_batch || '—'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Métricas do Frasco & Estoque */}
                  <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/70 space-y-2">
                    <span className="text-xs font-bold text-foreground block">
                      Balanço do Frasco & Estoque
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block">Frasco</span>
                        <strong className="text-foreground font-bold text-sm">
                          {vialCapacity} doses
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block">
                          Doses aplicadas
                        </span>
                        <strong className="text-emerald-700 font-bold text-sm">
                          {totalApplied} doses
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block">
                          Doses descartadas / perda
                        </span>
                        <strong className="text-rose-600 font-bold text-sm">
                          {totalDiscarded} doses
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block">
                          Total baixado estoque
                        </span>
                        <strong className="text-foreground font-bold text-sm">
                          {totalDownloaded} doses
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block">
                          Custo total consumido
                        </span>
                        <strong className="text-emerald-700 font-bold text-sm">
                          R$ {totalCost.toFixed(2)}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                        <span className="text-[10px] text-muted-foreground block">
                          Lotes / Aves
                        </span>
                        <strong className="text-foreground font-bold text-sm">
                          {totalLots} lotes ({totalBirds} aves)
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Distribuição por lote */}
                  <div className="p-3.5 rounded-2xl bg-white border border-border/80 space-y-2.5">
                    <span className="text-xs font-bold text-foreground block">
                      Distribuição & Apropriação por Lote
                    </span>
                    <div className="divide-y divide-border/50 text-xs">
                      {apps.map((app, idx) => {
                        const lName = app.lotName || lotName(app.lot_id)
                        return (
                          <div
                            key={idx}
                            className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <span className="font-semibold text-foreground flex items-center gap-1">
                                <Layers className="w-3 h-3 text-emerald-600" />
                                {lName}
                              </span>
                              <span className="text-[11px] text-muted-foreground block">
                                {app.animal_count ?? '—'} aves • {app.dose_per_animal ?? 1} dose/ave
                                {app.volume_per_dose
                                  ? ` • ${app.volume_per_dose} ${app.volume_unit || 'mL'}/dose`
                                  : ''}
                              </span>
                            </div>
                            <div className="text-right space-y-0.5">
                              <strong className="text-emerald-700 font-bold block">
                                {app.doses_applied} doses
                              </strong>
                              <span className="text-[11px] text-muted-foreground block font-medium">
                                R$ {Number(app.cost || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Totais de fechamento da sessão */}
                    <div className="pt-2.5 border-t border-border/80 space-y-1 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total aplicado:</span>
                        <strong className="text-emerald-700 font-bold">
                          {totalApplied} doses aplicadas
                        </strong>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Perda técnica / descarte:</span>
                        <strong className="text-rose-600 font-bold">{totalDiscarded} doses</strong>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total consumido:</span>
                        <strong className="text-foreground font-bold">
                          {totalDownloaded} doses
                        </strong>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-border/50 text-xs font-bold">
                        <span className="text-foreground">Custo total:</span>
                        <span className="text-emerald-700 text-sm font-black">
                          R$ {totalCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {session.notes && (
                    <p className="text-[11px] text-muted-foreground bg-secondary/30 p-2.5 rounded-xl border border-border/50">
                      <strong className="text-foreground">Obs:</strong> {session.notes}
                    </p>
                  )}
                </div>
              )
            })()}
        </DialogContent>
      </Dialog>

      {/* Detalhes e Exclusão */}
      <Dialog
        open={detailsRecord.open}
        onOpenChange={(open) => setDetailsRecord((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {detailsRecord.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {Object.entries(detailsRecord.record).map(([k, v]) => (
              <div
                key={k}
                className="flex items-start justify-between py-1.5 border-b border-border/40 text-xs gap-4"
              >
                <span className="text-muted-foreground font-medium shrink-0">{k}:</span>
                <span className="text-foreground font-semibold text-right break-words">
                  {String(v ?? '—')}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir "${deleteConfirm.name}"? Esta ação removerá o registro do sistema.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
