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
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog'
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
} from '@/types/farm'
import { toast } from '@/hooks/use-toast'

// Helper to extract fields safely from either snake_case, camelCase or generic data
function getVacField(vac: any, keys: string[], defaultVal: any = '') {
  if (!vac) return defaultVal
  for (const k of keys) {
    if (vac[k] !== undefined && vac[k] !== null) return vac[k]
    if (vac.data && vac.data[k] !== undefined && vac.data[k] !== null) return vac.data[k]
  }
  return defaultVal
}

const ACTIVITY_TYPES = ['Avicultura', 'Bovinocultura', 'Suinocultura', 'Piscicultura', 'Outro']

// ====================================================================
// SUB-COMPONENT: DIÁLOGO REGISTRAR APLICAÇÃO (FLUXO PROGRAMADA -> REALIZADA)
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
  const [dosePerAnimal, setDosePerAnimal] = useState('')
  const [doseUnit, setDoseUnit] = useState('mL')
  const [applicationRoute, setApplicationRoute] = useState('água')
  const [responsible, setResponsible] = useState('')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [quantityUsed, setQuantityUsed] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [vialStatus, setVialStatus] = useState<VialStatus | ''>('opened')
  const [discardedQuantity, setDiscardedQuantity] = useState('')
  const [wasteCost, setWasteCost] = useState('')
  const [deductStock, setDeductStock] = useState(true)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill automatically with scheduled data
  useEffect(() => {
    if (!open || !vaccination) return

    const v = vaccination as any
    const aCount = getVacField(
      v,
      ['animal_count', 'animal_quantity', 'animalCount', 'animalQuantity'],
      '',
    )
    const dPerAnimal = getVacField(v, ['dose_per_animal', 'dosePerAnimal', 'dose'], '')
    const dUnit = getVacField(v, ['dose_unit', 'doseUnit', 'unit'], 'mL')
    const appRoute = getVacField(
      v,
      ['application_route', 'administration_route', 'applicationRoute', 'route'],
      'água',
    )
    const resp = getVacField(v, ['responsible'], '')
    const invId = getVacField(v, ['inventory_item_id', 'inventoryItemId'], '')
    const bNum = getVacField(v, ['batch_number', 'manufacturer_batch', 'batchNumber'], '')
    const exp = getVacField(v, ['expiration_date', 'expirationDate'], '')
    const qUsed = getVacField(
      v,
      ['quantity_used', 'consumed_quantity', 'quantityUsed', 'consumedQuantity'],
      '',
    )
    const uCost = getVacField(v, ['unit_cost', 'unitCost'], '')
    const tCost = getVacField(v, ['total_cost', 'totalCost'], '')
    const obs = getVacField(v, ['notes', 'observations'], '')
    const vStat = getVacField(v, ['vial_status', 'vialStatus'], 'opened')
    const discQty = getVacField(v, ['discarded_quantity', 'discardedQuantity'], '')
    const wCost = getVacField(v, ['waste_cost', 'wasteCost'], '')

    setPerformedDate(new Date().toISOString().split('T')[0])
    setAnimalCount(aCount !== '' ? String(aCount) : '')
    setDosePerAnimal(dPerAnimal !== '' ? String(dPerAnimal) : '')
    setDoseUnit(dUnit || 'mL')
    setApplicationRoute(appRoute || 'água')
    setResponsible(resp)
    setInventoryItemId(invId)
    setBatchNumber(bNum)
    setExpirationDate(exp)
    setVialStatus(vStat || 'opened')
    setDiscardedQuantity(discQty !== '' ? String(discQty) : '')
    setWasteCost(wCost !== '' ? String(wCost) : '')
    setDeductStock(true)
    setNotes(obs)

    // Calculate auto consumption if available
    const countNum = Number(aCount) || 0
    const doseNum = Number(dPerAnimal) || 0
    const calculatedQty =
      qUsed !== ''
        ? Number(qUsed)
        : countNum > 0 && doseNum > 0
          ? Number((countNum * doseNum).toFixed(3))
          : 0
    setQuantityUsed(calculatedQty > 0 ? String(calculatedQty) : '')

    // Check inventory item for unit cost
    const itm = inventory.find((i) => i.id === invId)
    const cost = uCost !== '' ? Number(uCost) : itm?.averageCost || 0
    if (cost > 0) {
      setUnitCost(String(cost))
      if (calculatedQty > 0) {
        setTotalCost(String(Number((calculatedQty * cost).toFixed(2))))
      } else {
        setTotalCost(tCost !== '' ? String(tCost) : '')
      }
    } else {
      setUnitCost(uCost !== '' ? String(uCost) : '')
      setTotalCost(tCost !== '' ? String(tCost) : '')
    }
  }, [open, vaccination, inventory])

  const selectedItem = inventory.find((i) => i.id === inventoryItemId)
  const lot = lots.find((l) => l.id === vaccination?.lot_id)

  const handleRecalcQty = (count: number, dose: number, itemOverride?: any) => {
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

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!performedDate) {
      toast({ title: 'Informe a data realizada', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      const qUsed = Number(quantityUsed) || Number(animalCount) * Number(dosePerAnimal) || 0
      const uCost = Number(unitCost) || selectedItem?.averageCost || 0
      const tCost = Number(totalCost) || Number((qUsed * uCost).toFixed(2)) || 0
      const dQty = Number(discardedQuantity) || 0
      const wCost = Number(wasteCost) || Number((dQty * uCost).toFixed(2)) || 0

      const updatedPayload: Partial<Vaccination> = {
        status: 'performed',
        performed_date: performedDate,
        animal_count: animalCount !== '' ? Number(animalCount) : vaccination?.animal_count,
        dose_per_animal:
          dosePerAnimal !== '' ? Number(dosePerAnimal) : vaccination?.dose_per_animal,
        dose_unit: doseUnit || vaccination?.dose_unit,
        application_route: applicationRoute || vaccination?.application_route,
        responsible: responsible.trim() || vaccination?.responsible,
        inventory_item_id: inventoryItemId || vaccination?.inventory_item_id,
        inventory_item_name: selectedItem?.name || vaccination?.inventory_item_name,
        batch_number: batchNumber.trim() || vaccination?.batch_number,
        expiration_date: expirationDate || vaccination?.expiration_date,
        quantity_used: qUsed > 0 ? qUsed : undefined,
        unit_cost: uCost > 0 ? uCost : undefined,
        total_cost: tCost > 0 ? tCost : undefined,
        stock_deducted: deductStock && Boolean(inventoryItemId),
        vial_status: (vialStatus as VialStatus) || undefined,
        discarded_quantity: dQty > 0 ? dQty : undefined,
        waste_cost: wCost > 0 ? wCost : undefined,
        notes: notes.trim() || vaccination?.notes,
      }

      let stockMovement:
        | {
            inventoryItemId: string
            movementPayload: any
            updatePayload?: any
          }
        | undefined = undefined

      if (deductStock && inventoryItemId && selectedItem && qUsed > 0) {
        const newStock = Math.max(0, (selectedItem.currentStock || 0) - qUsed)
        stockMovement = {
          inventoryItemId,
          movementPayload: {
            organization_id: vaccination?.organization_id,
            property_id: vaccination?.property_id,
            inventory_item_id: inventoryItemId,
            type: 'saida',
            quantity: qUsed,
            unit_price: uCost,
            total_price: tCost,
            date: performedDate,
            reason: `Aplicação Sanitária: ${vaccination?.vaccine_name || 'Vacina'} (${lot?.name || 'Lote'})`,
            notes: `Consumo na vacinação do lote ${lot?.name || 'Geral'}. Quantidade: ${qUsed} ${selectedItem.unit || 'un'}.`,
          },
          updatePayload: {
            currentStock: newStock,
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
            {/* Card resumo da programação */}
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
                  <span className="text-muted-foreground block text-[10px]">Via de Aplicação:</span>
                  <strong className="font-semibold capitalize">
                    {vaccination.application_route || 'água'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Confirmação de dados reais executados */}
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Animais Vacinados</Label>
                  <Input
                    type="number"
                    value={animalCount}
                    onChange={(e) => {
                      setAnimalCount(e.target.value)
                      handleRecalcQty(Number(e.target.value), Number(dosePerAnimal))
                    }}
                    className="h-10 text-xs rounded-xl"
                    placeholder="Ex: 4"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Dose Real / Ave</Label>
                  <Input
                    type="number"
                    step="any"
                    value={dosePerAnimal}
                    onChange={(e) => {
                      setDosePerAnimal(e.target.value)
                      handleRecalcQty(Number(animalCount), Number(e.target.value))
                    }}
                    className="h-10 text-xs rounded-xl"
                    placeholder="0.5"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Unidade</Label>
                  <Input
                    value={doseUnit}
                    onChange={(e) => setDoseUnit(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    placeholder="mL"
                    required
                  />
                </div>
              </div>

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
            </div>

            {/* Controle de Frasco Multidose */}
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 space-y-2.5">
              <span className="text-xs font-bold text-foreground block">
                Frascos Multidose & Perdas (Opcional)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Status do Frasco</Label>
                  <Select value={vialStatus} onValueChange={(v) => setVialStatus(v as VialStatus)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opened">Frasco Aberto / Reconstituído</SelectItem>
                      <SelectItem value="closed">Frasco Fechado</SelectItem>
                      <SelectItem value="discarded">
                        Frasco Descartado / Sobra Inutilizada
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {vialStatus === 'discarded' ? (
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Qtd Descartada / Perdida
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={discardedQuantity}
                      onChange={(e) => {
                        setDiscardedQuantity(e.target.value)
                        const dq = Number(e.target.value) || 0
                        const uc = Number(unitCost) || selectedItem?.averageCost || 0
                        if (dq > 0 && uc > 0) {
                          setWasteCost(String(Number((dq * uc).toFixed(2))))
                        }
                      }}
                      className="h-9 text-xs rounded-xl bg-white"
                      placeholder="Doses perdidas"
                    />
                  </div>
                ) : (
                  <div className="flex items-center pt-4 text-[11px] text-muted-foreground">
                    Frasco em uso ou estoque reconstituído.
                  </div>
                )}
              </div>
            </div>

            {/* Estoque e Custos */}
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Baixa de Estoque & Custo do Lote
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Não gera 2ª despesa financeira
                </span>
              </div>

              <div>
                <Label className="text-xs">Item Sanitário no Estoque *</Label>
                <Select value={inventoryItemId} onValueChange={handleInventorySelect}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                    <SelectValue placeholder="Selecione o produto no estoque para dar baixa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum / Não baixar estoque</SelectItem>
                    {inventory.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} — Estoque: {item.currentStock} {item.unit} (R${' '}
                        {(item.averageCost || 0).toFixed(2)}/{item.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedItem && (
                <div className="p-2.5 rounded-xl bg-white/90 border border-border/80 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disponível no Estoque:</span>
                    <strong className="text-foreground">
                      {selectedItem.currentStock} {selectedItem.unit}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo Médio Unitário:</span>
                    <strong className="text-emerald-700 font-bold">
                      R$ {(selectedItem.averageCost || 0).toFixed(4)} / {selectedItem.unit}
                    </strong>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">
                    Qtd Consumida ({selectedItem?.unit || doseUnit || 'doses'})
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={quantityUsed}
                    onChange={(e) => {
                      setQuantityUsed(e.target.value)
                      const q = Number(e.target.value) || 0
                      const uc = Number(unitCost) || selectedItem?.averageCost || 0
                      setTotalCost(String(Number((q * uc).toFixed(2))))
                    }}
                    className="h-10 text-xs rounded-xl bg-white"
                    placeholder="Qtd consumida"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Lote do Fabricante</Label>
                  <Input
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="h-10 text-xs rounded-xl bg-white"
                    placeholder="Ex: VAC-2026-X"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Custo Unitário (R$)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={unitCost}
                    onChange={(e) => {
                      setUnitCost(e.target.value)
                      const uc = Number(e.target.value) || 0
                      const q = Number(quantityUsed) || 0
                      setTotalCost(String(Number((q * uc).toFixed(2))))
                    }}
                    className="h-10 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs">Custo Apropriado ao Lote (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    className="h-10 text-xs rounded-xl bg-white font-bold text-emerald-700"
                  />
                </div>
              </div>

              {inventoryItemId && (
                <div className="flex items-center space-x-2 pt-1 border-t border-border/50">
                  <Checkbox
                    id="applyVacStockDeduct"
                    checked={deductStock}
                    onCheckedChange={(v) => setDeductStock(Boolean(v))}
                  />
                  <label
                    htmlFor="applyVacStockDeduct"
                    className="text-xs font-semibold leading-none cursor-pointer text-foreground"
                  >
                    [✓] Efetuar baixa imediata no estoque ({quantityUsed || '0'}{' '}
                    {selectedItem?.unit || doseUnit})
                  </label>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs">Observações da Aplicação</Label>
              <Textarea
                placeholder="Ex: Aplicação ocorreu sem intercorrências, lote reagiu bem."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white mt-2 gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Confirmando Aplicação...' : 'Confirmar Aplicação de Vacina 💉'}
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
    inventory,
    vaccinations,
    treatments,
    healthOccurrences,
    healthProtocols,
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
    deleteProtocolAssignment,
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
    type: 'vac' | 'trt' | 'occ' | 'proto' | 'assign'
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

    return {
      scheduledVac,
      performedVac,
      delayedVac,
      activeTreatments,
      occurrencesCount,
      protocolsCount,
    }
  }, [vaccinations, treatments, healthOccurrences, healthProtocols])

  // Helper para nome do lote
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
      // 1. Atualiza o registro de vacinação
      await updateVaccination(selectedVacToApply.id, updatedVaccination)

      // 2. Se houver movimentação de estoque para baixa
      if (stockMovement && addStockMovement) {
        await addStockMovement(stockMovement.movementPayload)
        if (stockMovement.updatePayload && updateInventory) {
          await updateInventory(stockMovement.inventoryItemId, stockMovement.updatePayload)
        }
      }

      toast({
        title: 'Aplicação registrada com sucesso! 💉',
        description: stockMovement
          ? 'Status alterado para Realizada e estoque devidamente baixado.'
          : 'Status alterado para Realizada.',
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

        // Se marcou baixa no estoque e é um novo registro
        if (data.stock_deducted && data.inventory_item_id && data.quantity_used) {
          const itm = inventory.find((i) => i.id === data.inventory_item_id)
          if (itm && addStockMovement) {
            const newStock = Math.max(0, (itm.currentStock || 0) - Number(data.quantity_used))
            await addStockMovement({
              organization_id: organization?.id,
              property_id: currentProperty?.id,
              inventory_item_id: itm.id,
              type: 'saida',
              quantity: Number(data.quantity_used),
              unit_price: itm.averageCost || 0,
              total_price: Number(data.quantity_used) * (itm.averageCost || 0),
              date: data.start_date || new Date().toISOString().split('T')[0],
              reason: `Tratamento Veterinário: ${data.medication_name}`,
              notes: `Consumo no tratamento do lote ${data.lotName || 'Geral'}.`,
            })
            if (updateInventory) {
              await updateInventory(itm.id, { currentStock: newStock })
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

      // 1. Cria a vinculação do protocolo
      await addProtocolAssignment({
        organization_id: organization?.id,
        property_id: currentProperty?.id,
        protocol_id: selectedProtocolToAssign.id,
        protocolName: selectedProtocolToAssign.name,
        lot_id: lotId,
        lotName: lot?.name,
        start_date: refDate,
        status: 'active',
      })

      // 2. Cria as vacinações programadas automáticas baseadas nas etapas
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
            notes: `Gerado automaticamente pelo protocolo "${selectedProtocolToAssign.name}" (Dia ${st.day}). ${st.description || ''}`,
          })
        }
      }

      toast({
        title: 'Protocolo vinculado com sucesso! ✨',
        description: `${selectedProtocolToAssign.steps?.length || 0} tarefas programadas criadas no cronograma.`,
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
      } else if (deleteConfirm.type === 'assign') {
        await deleteProtocolAssignment(deleteConfirm.id)
        toast({ title: 'Vínculo de protocolo removido com sucesso' })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setDeleteConfirm({ open: false, id: '', name: '', type: 'vac' })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Syringe className="w-7 h-7 text-emerald-600" />
            Sanidade Animal & Biosseguridade
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manejo preventivo, calendário de vacinação, tratamentos veterinários e rastreabilidade
            sanitária
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <>
              {activeTab === 'vacinacao' && (
                <Button
                  onClick={() => {
                    setEditingVac(null)
                    setVacModalOpen(true)
                  }}
                  className="rounded-xl h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Nova Vacinação
                </Button>
              )}
              {activeTab === 'tratamentos' && (
                <Button
                  onClick={() => {
                    setEditingTrt(null)
                    setTrtModalOpen(true)
                  }}
                  className="rounded-xl h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
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
                  className="rounded-xl h-10 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm"
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
                  className="rounded-xl h-10 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Novo Protocolo
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold">Vacinas Previstas</span>
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-black text-foreground">{stats.scheduledVac}</div>
            <span className="text-[10px] text-muted-foreground">No cronograma</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold">Realizadas</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-emerald-600">{stats.performedVac}</div>
            <span className="text-[10px] text-muted-foreground">Aplicações feitas</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold">Atrasadas</span>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-black text-rose-600">{stats.delayedVac}</div>
            <span className="text-[10px] text-rose-500 font-medium">Requer atenção</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold">Tratamentos Ativos</span>
              <Pill className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-black text-blue-600">{stats.activeTreatments}</div>
            <span className="text-[10px] text-muted-foreground">Em andamento</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold">Ocorrências</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-black text-amber-600">{stats.occurrencesCount}</div>
            <span className="text-[10px] text-muted-foreground">Registros clínicos</span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold">Protocolos</span>
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
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Syringe className="w-3.5 h-3.5" /> Vacinação ({vaccinations?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="tratamentos"
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Pill className="w-3.5 h-3.5" /> Tratamentos ({treatments?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="ocorrencias"
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Ocorrências (
              {healthOccurrences?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="protocolos"
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" /> Protocolos ({healthProtocols?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Barra de Filtros Rápida */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, lote, motivo..."
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
              <h3 className="text-sm font-bold text-foreground">Nenhuma vacinação cadastrada</h3>
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

                          <RecordActionMenu
                            customActions={
                              vac.status === 'scheduled' || isDelayed
                                ? [
                                    {
                                      label: 'Registrar aplicação 💉',
                                      icon: <Syringe className="w-3.5 h-3.5 text-emerald-600" />,
                                      onClick: () => {
                                        setSelectedVacToApply(vac)
                                        setApplyVacModalOpen(true)
                                      },
                                    },
                                  ]
                                : []
                            }
                            onViewDetails={() =>
                              setDetailsRecord({
                                open: true,
                                title: `Vacinação: ${vac.vaccine_name}`,
                                record: {
                                  'Nome da Vacina': vac.vaccine_name,
                                  'Alvo / Doença': vac.disease_target || '—',
                                  'Lote Animal': lotName(vac.lot_id, vac.lotName),
                                  Status: vac.status === 'performed' ? 'Realizada' : 'Programada',
                                  'Data Programada': vac.scheduled_date || '—',
                                  'Data Realizada': vac.performed_date || '—',
                                  'Qtd Animais': vac.animal_count || '—',
                                  'Dose / Ave': `${vac.dose_per_animal || '—'} ${vac.dose_unit || 'mL'}`,
                                  'Via de Aplicação': vac.application_route || '—',
                                  'Status do Frasco': vac.vial_status || '—',
                                  'Qtd Descartada': vac.discarded_quantity || '—',
                                  'Custo de Perda': vac.waste_cost
                                    ? `R$ ${Number(vac.waste_cost).toFixed(2)}`
                                    : '—',
                                  Responsável: vac.responsible || '—',
                                  'Item Estoque Vinculado': vac.inventory_item_name || '—',
                                  'Lote Fabricante': vac.batch_number || '—',
                                  'Qtd Consumida do Estoque': vac.quantity_used
                                    ? `${vac.quantity_used} ${vac.dose_unit || 'un'}`
                                    : '—',
                                  'Custo Total Apropriado': vac.total_cost
                                    ? `R$ ${Number(vac.total_cost).toFixed(2)}`
                                    : '—',
                                  'Baixa em Estoque': vac.stock_deducted ? 'Sim (Efetuada)' : 'Não',
                                  Observações: vac.notes || '—',
                                },
                              })
                            }
                            onEdit={() => {
                              setEditingVac(vac)
                              setVacModalOpen(true)
                            }}
                            onDelete={() =>
                              setDeleteConfirm({
                                open: true,
                                id: vac.id,
                                name: vac.vaccine_name,
                                type: 'vac',
                              })
                            }
                          />
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
                            Dose / Aplicação:
                          </span>
                          <strong className="text-foreground font-semibold">
                            {vac.dose_per_animal || '0.5'} {vac.dose_unit || 'mL'} (
                            {vac.application_route || 'água'})
                          </strong>
                        </div>
                      </div>

                      {/* Detalhes de estoque e custos */}
                      {(vac.quantity_used || vac.total_cost || vac.vial_status) && (
                        <div className="p-2 rounded-xl bg-secondary/40 border border-border/60 text-[11px] space-y-1">
                          {vac.quantity_used && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Consumo do item:</span>
                              <strong className="text-foreground">
                                {vac.quantity_used} {vac.dose_unit || 'doses'}
                              </strong>
                            </div>
                          )}
                          {vac.total_cost && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Custo apropriado:</span>
                              <strong className="text-emerald-700 font-bold">
                                R$ {Number(vac.total_cost).toFixed(2)}
                              </strong>
                            </div>
                          )}
                          {vac.vial_status && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status do frasco:</span>
                              <span className="font-medium capitalize text-foreground">
                                {vac.vial_status === 'opened'
                                  ? 'Aberto/Uso'
                                  : vac.vial_status === 'closed'
                                    ? 'Fechado'
                                    : 'Descartado'}
                              </span>
                            </div>
                          )}
                        </div>
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

                        <RecordActionMenu
                          onViewDetails={() =>
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
                                'Qtd Consumida': trt.quantity_used ? `${trt.quantity_used}` : '—',
                                Observações: trt.notes || '—',
                              },
                            })
                          }
                          onEdit={() => {
                            setEditingTrt(trt)
                            setTrtModalOpen(true)
                          }}
                          onDelete={() =>
                            setDeleteConfirm({
                              open: true,
                              id: trt.id,
                              name: trt.medication_name,
                              type: 'trt',
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Dose / Frequência:
                        </span>
                        <strong className="text-foreground font-semibold">
                          {trt.dosage || '—'} ({trt.frequency || '1x/dia'})
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Carência (Abate/Ovos):
                        </span>
                        <strong className="text-amber-700 font-bold">
                          {trt.withdrawal_period_days || 0} dias
                        </strong>
                      </div>
                    </div>

                    {trt.notes && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 bg-secondary/30 p-2 rounded-xl">
                        {trt.notes}
                      </p>
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
              <h3 className="text-sm font-bold text-foreground">
                Nenhuma ocorrência clínica registrada
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Registre sintomas, suspeitas de enfermidades e ações corretivas no plantel.
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
              {filteredOccurrences.map((occ) => (
                <Card
                  key={occ.id}
                  className="rounded-2xl border border-border/70 hover:border-amber-500/50 transition-all duration-200 bg-card shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground">
                            {occ.occurrence_type === 'other'
                              ? occ.custom_type || 'Outro'
                              : occ.occurrence_type || 'Ocorrência'}
                          </span>
                        </div>
                        <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                          <Layers className="w-3 h-3 text-amber-600" />
                          {lotName(occ.lot_id, occ.lotName)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Badge
                          className={
                            occ.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800 border-rose-200 text-[10px]'
                              : occ.severity === 'high'
                                ? 'bg-orange-100 text-orange-800 border-orange-200 text-[10px]'
                                : 'bg-amber-100 text-amber-800 border-amber-200 text-[10px]'
                          }
                        >
                          {occ.severity === 'critical'
                            ? 'Crítica'
                            : occ.severity === 'high'
                              ? 'Alta'
                              : occ.severity === 'moderate'
                                ? 'Moderada'
                                : 'Baixa'}
                        </Badge>

                        <RecordActionMenu
                          onViewDetails={() =>
                            setDetailsRecord({
                              open: true,
                              title: `Ocorrência Clínica: ${occ.occurrence_type}`,
                              record: {
                                Tipo:
                                  occ.occurrence_type === 'other'
                                    ? occ.custom_type
                                    : occ.occurrence_type,
                                Lote: lotName(occ.lot_id, occ.lotName),
                                Severidade: occ.severity,
                                Data: occ.occurrence_date ? occ.occurrence_date.split('T')[0] : '—',
                                'Aves Afetadas': occ.affected_count || '1',
                                Sintomas: occ.symptoms || '—',
                                Descrição: occ.description || '—',
                                'Ação Tomada': occ.action_taken || '—',
                                Responsável: occ.responsible || '—',
                                Observações: occ.notes || '—',
                              },
                            })
                          }
                          onEdit={() => {
                            setEditingOcc(occ)
                            setOccModalOpen(true)
                          }}
                          onDelete={() =>
                            setDeleteConfirm({
                              open: true,
                              id: occ.id,
                              name: occ.occurrence_type || 'Ocorrência',
                              type: 'occ',
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs pt-1 border-t border-border/50">
                      {occ.symptoms && (
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Sintomas:</span>
                          <p className="text-foreground font-medium line-clamp-1">{occ.symptoms}</p>
                        </div>
                      )}
                      {occ.action_taken && (
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Ação Tomada:
                          </span>
                          <p className="text-emerald-700 font-semibold line-clamp-1">
                            {occ.action_taken}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                      <span>{occ.occurrence_date ? occ.occurrence_date.split('T')[0] : ''}</span>
                      <span>{occ.affected_count || 1} ave(s) afetada(s)</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: PROTOCOLOS SANITÁRIOS */}
        <TabsContent value="protocolos" className="space-y-3 mt-0">
          {filteredProtocols.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50">
              <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-foreground">Nenhum protocolo cadastrado</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Crie planos sanitários reutilizáveis (ex: Programa de Vacinação Inicial de
                Pintainhas) e aplique com 1 clique a qualquer lote.
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
                        <span className="text-[10px] text-purple-700 font-semibold block">
                          {proto.activity_type || 'Geral'} • {proto.steps?.length || 0} Etapas
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <RecordActionMenu
                          customActions={[
                            {
                              label: 'Vincular a um lote 🔗',
                              icon: <Link2 className="w-3.5 h-3.5 text-primary" />,
                              onClick: () => {
                                setSelectedProtocolToAssign(proto)
                                setAssignModalOpen(true)
                              },
                            },
                          ]}
                          onViewDetails={() =>
                            setDetailsRecord({
                              open: true,
                              title: `Protocolo Sanitário: ${proto.name}`,
                              record: {
                                'Nome do Protocolo': proto.name,
                                Tipo: proto.protocol_type || 'Programa de Vacinação',
                                Atividade: proto.activity_type || 'Avicultura',
                                'Faixa Etária': `${proto.age_range_start || 1} a ${proto.age_range_end || 60} dias`,
                                'Qtd de Etapas': proto.steps?.length || 0,
                                Etapas: (proto.steps || [])
                                  .map((s) => `Dia ${s.day}: ${s.action} (${s.description || ''})`)
                                  .join(' | '),
                                Observações: proto.notes || '—',
                              },
                            })
                          }
                          onEdit={() => {
                            setEditingProto(proto)
                            setProtoModalOpen(true)
                          }}
                          onDelete={() =>
                            setDeleteConfirm({
                              open: true,
                              id: proto.id,
                              name: proto.name,
                              type: 'proto',
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Preview de Etapas */}
                    <div className="space-y-1.5 pt-1 border-t border-border/50">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider block">
                        Cronograma de Etapas:
                      </span>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {(proto.steps || []).map((st, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-secondary/40 border border-border/50"
                          >
                            <span className="font-bold text-primary w-12 shrink-0">
                              Dia {st.day}
                            </span>
                            <span className="truncate text-foreground flex-1 font-medium">
                              {st.action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botão para vincular a lote */}
                    {canEdit && (
                      <Button
                        onClick={() => {
                          setSelectedProtocolToAssign(proto)
                          setAssignModalOpen(true)
                        }}
                        size="sm"
                        className="w-full h-8 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-xs"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Vincular a um Lote
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================================================================== */}
      {/* MODAIS E DIÁLOGOS DE EDIÇÃO / CADASTRO */}
      {/* ==================================================================== */}
      <VaccinationDialog
        open={vacModalOpen}
        onOpenChange={(v) => {
          setVacModalOpen(v)
          if (!v) setEditingVac(null)
        }}
        editing={editingVac}
        lots={lots}
        activities={activities}
        inventory={inventory}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={handleSaveVaccination}
      />

      <ApplyVaccinationDialog
        open={applyVacModalOpen}
        onOpenChange={(v) => {
          setApplyVacModalOpen(v)
          if (!v) setSelectedVacToApply(null)
        }}
        vaccination={selectedVacToApply}
        lots={lots}
        inventory={inventory}
        onConfirm={handleApplyVacConfirm}
      />

      <TreatmentDialog
        open={trtModalOpen}
        onOpenChange={(v) => {
          setTrtModalOpen(v)
          if (!v) setEditingTrt(null)
        }}
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
        onOpenChange={(v) => {
          setOccModalOpen(v)
          if (!v) setEditingOcc(null)
        }}
        editing={editingOcc}
        lots={lots}
        activities={activities}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={handleSaveOccurrence}
      />

      <ProtocolDialog
        open={protoModalOpen}
        onOpenChange={(v) => {
          setProtoModalOpen(v)
          if (!v) setEditingProto(null)
        }}
        editing={editingProto}
        inventory={inventory}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onSubmit={handleSaveProtocol}
      />

      <AssignProtocolDialog
        open={assignModalOpen}
        onOpenChange={(v) => {
          setAssignModalOpen(v)
          if (!v) setSelectedProtocolToAssign(null)
        }}
        protocol={selectedProtocolToAssign}
        lots={lots}
        orgId={organization?.id}
        propertyId={currentProperty?.id}
        onAssign={handleAssignProtocolConfirm}
      />

      {/* Detalhes de Registro Genérico */}
      <RecordDetailsDialog
        open={detailsRecord.open}
        onOpenChange={(open) => setDetailsRecord((prev) => ({ ...prev, open }))}
        title={detailsRecord.title}
        record={detailsRecord.record}
      />

      {/* Confirmação de Exclusão */}
      <DeleteConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title={`Excluir ${deleteConfirm.name}`}
        description="Esta ação não poderá ser desfeita. Deseja realmente remover este registro sanitário?"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO VACINAÇÃO
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
  const [animalCount, setAnimalCount] = useState('100')
  const [dosePerAnimal, setDosePerAnimal] = useState('0.5')
  const [doseUnit, setDoseUnit] = useState('mL')
  const [applicationRoute, setApplicationRoute] = useState('água')
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

  // Sync state whenever dialog opens or editing record changes
  useEffect(() => {
    if (!open) return

    if (editing) {
      const e = editing as any
      const vName = getVacField(e, ['vaccine_name', 'vaccineName', 'name'], '')
      const target = getVacField(
        e,
        ['disease_target', 'target_disease', 'targetDisease', 'diseaseTarget'],
        '',
      )
      const actId = getVacField(e, ['activity_id', 'activityId', 'activity'], '')
      const lId = getVacField(e, ['lot_id', 'lotId', 'lot'], '')
      const sDate = getVacField(e, ['scheduled_date', 'scheduledDate'], '')
      const pDate = getVacField(e, ['performed_date', 'performedDate'], '')
      const aCount = getVacField(
        e,
        ['animal_count', 'animal_quantity', 'animalCount', 'animalQuantity'],
        '',
      )
      const dPerAnimal = getVacField(e, ['dose_per_animal', 'dosePerAnimal', 'dose'], '')
      const dUnit = getVacField(e, ['dose_unit', 'doseUnit', 'unit'], 'mL')
      const appRoute = getVacField(
        e,
        ['application_route', 'administration_route', 'applicationRoute', 'route'],
        'água',
      )
      const resp = getVacField(e, ['responsible'], '')
      const invId = getVacField(e, ['inventory_item_id', 'inventoryItemId'], '')
      const bNumber = getVacField(e, ['batch_number', 'manufacturer_batch', 'batchNumber'], '')
      const expDate = getVacField(e, ['expiration_date', 'expirationDate'], '')
      const qUsed = getVacField(
        e,
        ['quantity_used', 'consumed_quantity', 'quantityUsed', 'consumedQuantity'],
        '',
      )
      const uCost = getVacField(e, ['unit_cost', 'unitCost'], '')
      const tCost = getVacField(e, ['total_cost', 'totalCost'], '')
      const sDeducted = Boolean(getVacField(e, ['stock_deducted', 'stockDeducted'], false))
      const st = (getVacField(e, ['status'], 'scheduled') as VaccinationStatus) || 'scheduled'
      const obs = getVacField(e, ['notes', 'observations'], '')
      const vStatus = getVacField(e, ['vial_status', 'vialStatus'], '')
      const discQty = getVacField(e, ['discarded_quantity', 'discardedQuantity'], '')
      const wCost = getVacField(e, ['waste_cost', 'wasteCost'], '')

      setVaccineName(vName)
      setDiseaseTarget(target)
      setActivityId(actId)
      setLotId(lId)
      setScheduledDate(sDate)
      setPerformedDate(pDate)
      setAnimalCount(aCount !== '' ? String(aCount) : '')
      setDosePerAnimal(dPerAnimal !== '' ? String(dPerAnimal) : '')
      setDoseUnit(dUnit || 'mL')
      setApplicationRoute(appRoute || 'água')
      setVialStatus(vStatus || '')
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
      setDosePerAnimal('0.5')
      setDoseUnit('mL')
      setApplicationRoute('água')
      setVialStatus('')
      setDiscardedQuantity('')
      setWasteCost('')
      setResponsible('')
      setInventoryItemId('')
      setBatchNumber('')
      setExpirationDate('')
      setQuantityUsed('50')
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
          title: 'Atenção: Produto Vencido!',
          description: `O item ${selectedItem.name} venceu em ${selectedItem.expiration_date}. Verifique antes de aplicar.`,
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
      dose_unit: doseUnit || undefined,
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
              placeholder="Ex: Newcastle, Gumboro, Marek, Bouba"
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
              <Label className="text-xs">Lote</Label>
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

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Qtd Animais</Label>
              <Input
                type="number"
                value={animalCount}
                onChange={(e) => {
                  setAnimalCount(e.target.value)
                  handleAutoCalcQty(Number(e.target.value), Number(dosePerAnimal))
                }}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Dose / Ave</Label>
              <Input
                type="number"
                step="any"
                value={dosePerAnimal}
                onChange={(e) => {
                  setDosePerAnimal(e.target.value)
                  handleAutoCalcQty(Number(animalCount), Number(e.target.value))
                }}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Unidade</Label>
              <Input
                placeholder="mL, gotas, dose"
                value={doseUnit}
                onChange={(e) => setDoseUnit(e.target.value)}
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

          {/* Frascos multidose */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/50">
            <div>
              <Label className="text-xs">Status do Frasco (Multidose)</Label>
              <Select value={vialStatus} onValueChange={(v) => setVialStatus(v as VialStatus)}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                  <SelectValue placeholder="Padrão / Não especificado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não especificado</SelectItem>
                  <SelectItem value="closed">Frasco Fechado</SelectItem>
                  <SelectItem value="opened">Frasco Aberto / Reconstituído</SelectItem>
                  <SelectItem value="discarded">Frasco Descartado / Perda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {vialStatus === 'discarded' && (
              <div>
                <Label className="text-xs">Qtd Descartada / Perdida</Label>
                <Input
                  type="number"
                  step="any"
                  value={discardedQuantity}
                  onChange={(e) => {
                    setDiscardedQuantity(e.target.value)
                    const dq = Number(e.target.value) || 0
                    const uc = Number(unitCost) || selectedItem?.averageCost || 0
                    if (dq > 0 && uc > 0) {
                      setWasteCost(String(Number((dq * uc).toFixed(2))))
                    }
                  }}
                  className="h-10 text-xs rounded-xl bg-white"
                  placeholder="Doses perdidas"
                />
              </div>
            )}
          </div>

          {/* Estoque e Custos */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
            <span className="text-xs font-bold text-foreground block">
              Vínculo com Estoque & Custos (Rastreabilidade)
            </span>
            <div>
              <Label className="text-xs">Item do Estoque (Vacinas e Insumos)</Label>
              <Select value={inventoryItemId} onValueChange={handleInventorySelect}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                  <SelectValue placeholder="Selecione o frasco/produto do estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum / Não vinculado</SelectItem>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} — Estoque: {item.currentStock} {item.unit} (R${' '}
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
                  <strong className="text-primary">
                    R$ {(selectedItem.averageCost || 0).toFixed(4)} / {selectedItem.unit}
                  </strong>
                </div>
                {selectedItem.expiration_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validade do lote:</span>
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
                <Label className="text-xs">
                  Qtd Total Consumida ({selectedItem?.unit || doseUnit || 'doses'})
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={quantityUsed}
                  onChange={(e) => {
                    setQuantityUsed(e.target.value)
                    const q = Number(e.target.value) || 0
                    const uc = Number(unitCost) || selectedItem?.averageCost || 0
                    setTotalCost(String(Number((q * uc).toFixed(2))))
                  }}
                  className="h-10 text-xs rounded-xl bg-white"
                  placeholder="Calculada automaticamente"
                />
              </div>
              <div>
                <Label className="text-xs">Nº do Lote Fabricante</Label>
                <Input
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white"
                  placeholder="Ex: LOTE-894"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Custo Unitário (R$)</Label>
                <Input
                  type="number"
                  step="any"
                  value={unitCost}
                  onChange={(e) => {
                    setUnitCost(e.target.value)
                    const uc = Number(e.target.value) || 0
                    const q = Number(quantityUsed) || 0
                    setTotalCost(String(Number((q * uc).toFixed(2))))
                  }}
                  className="h-10 text-xs rounded-xl bg-white"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <Label className="text-xs">Custo Total da Aplicação (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white font-bold text-primary"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            {inventoryItemId && status === 'performed' && (
              <div className="flex items-center space-x-2 pt-1 border-t border-border/50">
                <Checkbox
                  id="vacStockDeduct"
                  checked={stockDeducted}
                  onCheckedChange={(v) => setStockDeducted(Boolean(v))}
                />
                <label
                  htmlFor="vacStockDeduct"
                  className="text-xs font-semibold leading-none cursor-pointer text-foreground"
                >
                  [✓] Baixar do estoque e apropriar ao custo econômico do lote
                </label>
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              placeholder="Reações adversas, temperatura da água, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white mt-2"
          >
            {editing ? 'Salvar Alterações' : 'Cadastrar Vacinação ✨'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====================================================================
// SUB-COMPONENT: DIÁLOGO MEDICAMENTO / TRATAMENTO
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

  const resetForm = () => {
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
  }

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

    if (
      selectedItem?.expiration_date &&
      new Date(selectedItem.expiration_date).getTime() < Date.now()
    ) {
      toast({
        title: 'Atenção: Produto Vencido!',
        description: `O medicamento ${selectedItem.name} venceu em ${selectedItem.expiration_date}.`,
        variant: 'destructive',
      })
    }

    const selectedLot = lots.find((l) => l.id === lotId)

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
      quantity_used: Number(quantityUsed) || undefined,
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        onOpenChange(v)
      }}
    >
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
              <Label className="text-xs">Lote</Label>
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
                placeholder="Ex: 7 (dias para abate/consumo)"
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
                placeholder="A cada 12h, 24h"
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
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
            <span className="text-xs font-bold text-foreground block">
              Vínculo com Estoque & Custos (Rastreabilidade)
            </span>
            <div>
              <Label className="text-xs">Item do Estoque (Medicamentos e Insumos)</Label>
              <Select value={inventoryItemId} onValueChange={handleInventorySelect}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                  <SelectValue placeholder="Selecione o frasco/produto do estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum / Não vinculado</SelectItem>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} — Estoque: {item.currentStock} {item.unit} (R${' '}
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
                  <strong className="text-primary">
                    R$ {(selectedItem.averageCost || 0).toFixed(4)} / {selectedItem.unit}
                  </strong>
                </div>
                {selectedItem.expiration_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validade do lote:</span>
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
                placeholder="Quantidade total utilizada (ex: 50 mL ou 20 comprimidos)"
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
                  [✓] Baixar do estoque e apropriar ao custo econômico do lote
                </label>
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              placeholder="Instruções de diluição, reações, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white mt-2"
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
  activities,
  orgId,
  propertyId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: HealthOccurrence | null
  lots: any[]
  activities: any[]
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

  const resetForm = () => {
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
  }

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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        onOpenChange(v)
      }}
    >
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
              <Label className="text-xs">Especifique o Tipo</Label>
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
              <Label className="text-xs">Lote</Label>
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
              <Label className="text-xs">Data da Ocorrência</Label>
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
              placeholder="Ex: Espirro, ronqueira, fezes esbranquiçadas, prostração"
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
              placeholder="Ex: Isolamento das aves, início de antibiótico, desinfecção"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white mt-2"
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
  inventory,
  orgId,
  propertyId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: HealthProtocol | null
  inventory: any[]
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

  const resetForm = () => {
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
  }

  const addStep = () => {
    const nextDay = steps.length > 0 ? steps[steps.length - 1].day + 7 : 1
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        onOpenChange(v)
      }}
    >
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
                  <SelectItem value="vaccination_program">Programa de Vacinação</SelectItem>
                  <SelectItem value="deworming">Vermifugação</SelectItem>
                  <SelectItem value="preventive_treatment">Tratamento Preventivo</SelectItem>
                  <SelectItem value="biosecurity">Biosseguridade</SelectItem>
                  <SelectItem value="cleaning_disinfection">Limpeza & Desinfecção</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Atividade Alvo</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Faixa Etária Inicial (dias)</Label>
              <Input
                type="number"
                value={ageRangeStart}
                onChange={(e) => setAgeRangeStart(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Faixa Etária Final (dias)</Label>
              <Input
                type="number"
                value={ageRangeEnd}
                onChange={(e) => setAgeRangeEnd(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Etapas Dinâmicas */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">Etapas do Protocolo</span>
                <span className="text-[10px] text-muted-foreground">
                  Dia relativo a partir do alojamento
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                className="h-7 text-[11px] rounded-xl text-primary border-primary/20 gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Etapa
              </Button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-secondary/40 border border-border/60 flex items-start gap-2.5 text-xs"
                >
                  <div className="w-20 shrink-0">
                    <Label className="text-[10px] text-muted-foreground">Dia</Label>
                    <Input
                      type="number"
                      value={st.day}
                      onChange={(e) => updateStep(idx, 'day', Number(e.target.value))}
                      className="h-8 text-xs rounded-lg bg-white"
                      placeholder="Dia"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">
                        Ação / Procedimento *
                      </Label>
                      <Input
                        value={st.action}
                        onChange={(e) => updateStep(idx, 'action', e.target.value)}
                        className="h-8 text-xs rounded-lg bg-white"
                        placeholder="Ex: Vacina Newcastle"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        value={st.description || ''}
                        onChange={(e) => updateStep(idx, 'description', e.target.value)}
                        className="h-7 text-[11px] rounded-lg bg-white"
                        placeholder="Detalhes / instruções de diluição"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(idx)}
                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 mt-5"
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
              placeholder="Instruções gerais, cuidados de conservação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white mt-2"
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
  orgId,
  propertyId,
  onAssign,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  protocol: HealthProtocol | null
  lots: any[]
  orgId?: string
  propertyId?: string
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
      toast({ title: 'Selecione o lote', variant: 'destructive' })
      return
    }
    onAssign(selectedLotId, refDate)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Vincular Protocolo a Lote
          </DialogTitle>
        </DialogHeader>

        {protocol && (
          <form onSubmit={handleConfirm} className="space-y-4 mt-2">
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60">
              <span className="text-xs font-bold text-foreground block">{protocol.name}</span>
              <span className="text-[11px] text-muted-foreground block">
                {protocol.steps?.length || 0} etapas serão programadas com base na data de
                alojamento.
              </span>
            </div>

            <div>
              <Label className="text-xs">Lote de Destino *</Label>
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
              <Label className="text-xs">Data de Referência (ex: Data de Alojamento) *</Label>
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
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              Vincular e Gerar Cronograma ✨
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
