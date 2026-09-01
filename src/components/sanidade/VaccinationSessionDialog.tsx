import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Syringe, Plus, Trash2, Layers, AlertCircle, Sparkles } from 'lucide-react'
import {
  VaccinationSession,
  VaccinationSessionLotApplication,
  VialDestiny,
  Lot,
  InventoryItem,
  VaccinationRoute,
} from '@/types/farm'
import { toast } from '@/hooks/use-toast'

interface VaccinationSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lots: Lot[]
  inventory: InventoryItem[]
  orgId?: string
  propertyId?: string
  onSaveSession: (
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
  ) => Promise<void>
}

interface LotRow {
  id: string
  lotId: string
  animalCount: number
  dosePerAnimal: number
  volumePerDose: number
  volumeUnit: string
  route: string
  notes?: string
}

export function VaccinationSessionDialog({
  open,
  onOpenChange,
  lots,
  inventory,
  orgId,
  propertyId,
  onSaveSession,
}: VaccinationSessionDialogProps) {
  const [sessionDate, setSessionDate] = useState('')
  const [responsible, setResponsible] = useState('')
  const [vaccineName, setVaccineName] = useState('')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [manufacturerBatch, setManufacturerBatch] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [vialCapacity, setVialCapacity] = useState('100')
  const [vialCost, setVialCost] = useState('65')
  const [vialDestiny, setVialDestiny] = useState<VialDestiny>('discarded')
  const [openedAt, setOpenedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [lotRows, setLotRows] = useState<LotRow[]>([
    {
      id: 'row-1',
      lotId: '',
      animalCount: 0,
      dosePerAnimal: 1,
      volumePerDose: 0.03,
      volumeUnit: 'mL',
      route: 'ocular',
      notes: '',
    },
  ])

  useEffect(() => {
    if (open) {
      setSessionDate(new Date().toISOString().split('T')[0])
      setOpenedAt(new Date().toLocaleTimeString().slice(0, 5))
      setResponsible('')
      setVaccineName('')
      setInventoryItemId('')
      setManufacturerBatch('')
      setExpirationDate('')
      setVialCapacity('100')
      setVialCost('65')
      setVialDestiny('discarded')
      setNotes('')
      setLotRows([
        {
          id: `row-${Date.now()}-1`,
          lotId: lots[0]?.id || '',
          animalCount: lots[0]?.currentQuantity || 10,
          dosePerAnimal: 1,
          volumePerDose: 0.03,
          volumeUnit: 'mL',
          route: 'ocular',
          notes: '',
        },
      ])
    }
  }, [open, lots])

  const selectedItem = inventory.find((i) => i.id === inventoryItemId)
  const canKeepOpenedProduct = Boolean(selectedItem?.can_keep_opened)

  const handleInventorySelect = (id: string) => {
    setInventoryItemId(id)
    const itm = inventory.find((i) => i.id === id)
    if (itm) {
      if (!vaccineName) setVaccineName(itm.name)
      if (itm.manufacturer_batch && !manufacturerBatch) {
        setManufacturerBatch(itm.manufacturer_batch)
      }
      if (itm.expiration_date && !expirationDate) {
        setExpirationDate(itm.expiration_date)
      }
      if (itm.content_per_package) {
        setVialCapacity(String(itm.content_per_package))
      }
      // Calculate vial cost from average cost
      if (itm.averageCost && itm.content_per_package) {
        const fullVialCost = Number((itm.averageCost * itm.content_per_package).toFixed(2))
        setVialCost(String(fullVialCost))
      }
      // Product rules on keeping opened
      if (!itm.can_keep_opened) {
        setVialDestiny('discarded')
      }
    }
  }

  // Totals calculations
  const capacityNum = Math.max(0, Number(vialCapacity) || 100)
  const vialCostNum = Math.max(0, Number(vialCost) || 0)
  const theoreticalUnitCost = capacityNum > 0 ? vialCostNum / capacityNum : 0

  const totalDosesApplied = useMemo(() => {
    return lotRows.reduce((acc, row) => {
      const count = Number(row.animalCount) || 0
      const dpa = Number(row.dosePerAnimal) || 1
      return acc + count * dpa
    }, 0)
  }, [lotRows])

  const dosesRemaining = Math.max(0, capacityNum - totalDosesApplied)

  const totalDosesDiscarded = useMemo(() => {
    if (vialDestiny === 'closed') return 0
    if (vialDestiny === 'kept') return 0
    // If discarded, all remaining doses from the opened vial are discarded
    return dosesRemaining
  }, [vialDestiny, dosesRemaining])

  const totalDownloadedFromStock = useMemo(() => {
    if (vialDestiny === 'closed') {
      return 0
    }
    if (vialDestiny === 'kept') {
      // only doses actually applied are downloaded
      return totalDosesApplied
    }
    // Discarded / whole vial opened & consumed
    return capacityNum
  }, [vialDestiny, totalDosesApplied, capacityNum])

  // Real cost consumed from inventory
  const realCostConsumed = useMemo(() => {
    if (vialDestiny === 'closed') return 0
    if (vialDestiny === 'kept') {
      return Number((totalDosesApplied * theoreticalUnitCost).toFixed(2))
    }
    // Entire vial cost
    return vialCostNum
  }, [vialDestiny, totalDosesApplied, theoreticalUnitCost, vialCostNum])

  // Cost appropriation per lot (proportional rateio or direct)
  const lotAppropriations = useMemo(() => {
    if (totalDosesApplied <= 0) return []
    return lotRows.map((row) => {
      const count = Number(row.animalCount) || 0
      const dpa = Number(row.dosePerAnimal) || 1
      const doses = count * dpa
      const volume = Number((doses * (Number(row.volumePerDose) || 0)).toFixed(3))
      // Rateio do custo real proporcional às doses aplicadas em cada lote
      const propShare = doses / totalDosesApplied
      const lotCost = Number((realCostConsumed * propShare).toFixed(2))
      const lotObj = lots.find((l) => l.id === row.lotId)
      return {
        ...row,
        lotName: lotObj?.name || 'Lote Animal',
        dosesApplied: doses,
        totalVolume: volume,
        lotCost,
      }
    })
  }, [lotRows, totalDosesApplied, realCostConsumed, lots])

  const handleAddLotRow = () => {
    const nextLot = lots.find((l) => !lotRows.some((r) => r.lotId === l.id)) || lots[0]
    setLotRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${prev.length + 1}`,
        lotId: nextLot?.id || '',
        animalCount: nextLot?.currentQuantity || 10,
        dosePerAnimal: 1,
        volumePerDose: 0.03,
        volumeUnit: 'mL',
        route: 'ocular',
        notes: '',
      },
    ])
  }

  const handleRemoveLotRow = (id: string) => {
    if (lotRows.length <= 1) {
      toast({ title: 'A sessão deve ter ao menos 1 lote', variant: 'destructive' })
      return
    }
    setLotRows((prev) => prev.filter((r) => r.id !== id))
  }

  const handleUpdateLotRow = (id: string, updates: Partial<LotRow>) => {
    setLotRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, ...updates }
        if (updates.lotId) {
          const l = lots.find((item) => item.id === updates.lotId)
          if (l && l.currentQuantity) {
            updated.animalCount = l.currentQuantity
          }
        }
        return updated
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vaccineName.trim()) {
      toast({ title: 'Informe o nome da vacina', variant: 'destructive' })
      return
    }
    if (!sessionDate) {
      toast({ title: 'Informe a data da sessão', variant: 'destructive' })
      return
    }
    if (lotRows.some((r) => !r.lotId || r.animalCount <= 0)) {
      toast({
        title: 'Preencha o lote e a quantidade de aves em todas as linhas',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const applications: VaccinationSessionLotApplication[] = lotAppropriations.map((app) => ({
        lot_id: app.lotId,
        lotName: app.lotName,
        animal_count: app.animalCount,
        dose_per_animal: app.dosePerAnimal,
        volume_per_dose: app.volumePerDose,
        volume_unit: app.volumeUnit,
        doses_applied: app.dosesApplied,
        total_volume: app.totalVolume,
        cost: app.lotCost,
        notes: app.notes,
      }))

      const sessionPayload: Omit<VaccinationSession, 'id'> = {
        organization_id: orgId,
        property_id: propertyId,
        session_date: sessionDate,
        vaccine_name: vaccineName.trim(),
        inventory_item_id: inventoryItemId || undefined,
        inventory_item_name: selectedItem?.name,
        manufacturer_batch: manufacturerBatch.trim() || undefined,
        expiration_date: expirationDate || undefined,
        vial_capacity: capacityNum,
        initial_quantity: capacityNum,
        vial_cost: vialCostNum,
        unit_cost: theoreticalUnitCost,
        opened_at: openedAt || undefined,
        responsible: responsible.trim() || undefined,
        vial_destiny: vialDestiny,
        total_applied: totalDosesApplied,
        total_discarded: totalDosesDiscarded,
        total_downloaded: totalDownloadedFromStock,
        total_cost: realCostConsumed,
        applications,
        status: 'completed',
        notes: notes.trim() || undefined,
      }

      // Prepare individual vaccination records for each lot
      const individualVaccinations = lotAppropriations.map((app) => {
        // Rateio de perda técnica se o frasco foi descartado
        const lotDiscardShare =
          totalDosesApplied > 0 ? (app.dosesApplied / totalDosesApplied) * totalDosesDiscarded : 0
        const lotDownloaded = app.dosesApplied + lotDiscardShare

        return {
          lot_id: app.lotId,
          lotName: app.lotName,
          animal_count: app.animalCount,
          dose_per_animal: app.dosePerAnimal,
          volume_per_dose: app.volumePerDose,
          volume_unit: app.volumeUnit,
          doses_applied: app.dosesApplied,
          doses_discarded: Number(lotDiscardShare.toFixed(2)),
          total_downloaded: Number(lotDownloaded.toFixed(2)),
          cost: app.lotCost,
          unit_cost: theoreticalUnitCost,
          route: app.route,
        }
      })

      // Prepare stock movement if inventory item was selected
      let stockMovement:
        | {
            inventoryItemId: string
            movementPayload: any
            updatePayload?: any
          }
        | undefined = undefined

      if (inventoryItemId && selectedItem && totalDownloadedFromStock > 0) {
        const newStock = Math.max(0, (selectedItem.currentStock || 0) - totalDownloadedFromStock)
        const lotsSummary = lotAppropriations
          .map((l) => `${l.lotName}: ${l.dosesApplied}d`)
          .join(', ')

        stockMovement = {
          inventoryItemId,
          movementPayload: {
            organization_id: orgId,
            property_id: propertyId,
            inventory_item_id: inventoryItemId,
            inventoryItemName: selectedItem.name,
            type: 'saida',
            movementType: 'Consumo',
            quantity: totalDownloadedFromStock,
            unit: selectedItem.unit || 'dose',
            balanceAfter: Number(newStock.toFixed(3)),
            unitValue: Number(theoreticalUnitCost.toFixed(4)),
            totalValue: Number(realCostConsumed.toFixed(2)),
            date: sessionDate,
            notes: `Sessão Vacinal: ${vaccineName}. Frasco ${capacityNum} doses (${vialDestiny === 'discarded' ? 'Sobra Descartada' : 'Sobra Guardada'}). Lotes: ${lotsSummary}.`,
            generateExpense: false,
          },
          updatePayload: {
            currentStock: Number(newStock.toFixed(3)),
            lastUpdated: new Date().toISOString().split('T')[0],
          },
        }
      }

      await onSaveSession(sessionPayload, individualVaccinations, stockMovement)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Syringe className="w-5 h-5 text-emerald-600" />
            Nova Sessão de Vacinação / Frasco Aberto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Informações do Frasco e da Sessão */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Dados do Frasco / Ampola
              </span>
              <Badge className="bg-emerald-600 text-white text-[10px]">
                Rateio Seguro entre Lotes
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Item do Estoque (Vacina)</Label>
                <Select value={inventoryItemId} onValueChange={handleInventorySelect}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                    <SelectValue placeholder="Selecione o produto do estoque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum / Manual</SelectItem>
                    {inventory.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} — Saldo: {item.currentStock} {item.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Nome da Vacina *</Label>
                <Input
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  placeholder="Ex: Newcastle La Sota"
                  className="h-10 text-xs rounded-xl bg-white"
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Responsável / Aplicador *</Label>
                <Input
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="Nome do aplicador"
                  className="h-10 text-xs rounded-xl bg-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div>
                <Label className="text-xs">Data da Sessão *</Label>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Hora de Abertura</Label>
                <Input
                  type="time"
                  value={openedAt}
                  onChange={(e) => setOpenedAt(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white"
                />
              </div>
              <div>
                <Label className="text-xs">Lote do Fabricante</Label>
                <Input
                  value={manufacturerBatch}
                  onChange={(e) => setManufacturerBatch(e.target.value)}
                  placeholder="Ex: LOTE-894"
                  className="h-10 text-xs rounded-xl bg-white"
                />
              </div>
              <div>
                <Label className="text-xs">Validade</Label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1 border-t border-emerald-200/50">
              <div>
                <Label className="text-xs">Capacidade do Frasco (Doses) *</Label>
                <Input
                  type="number"
                  step="1"
                  value={vialCapacity}
                  onChange={(e) => setVialCapacity(e.target.value)}
                  placeholder="100"
                  className="h-10 text-xs rounded-xl bg-white font-bold"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Custo Total do Frasco (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={vialCost}
                  onChange={(e) => setVialCost(e.target.value)}
                  placeholder="65.00"
                  className="h-10 text-xs rounded-xl bg-white font-bold"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Custo Teórico Unitário</Label>
                <div className="h-10 px-3 rounded-xl bg-white border border-input flex items-center text-xs font-bold text-emerald-800">
                  R$ {theoreticalUnitCost.toFixed(4)} / dose
                </div>
              </div>
            </div>
          </div>

          {/* Lotes Atendidos nesta Sessão */}
          <div className="space-y-3 p-4 rounded-2xl bg-secondary/40 border border-border/70">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Aplicações por Lote Animal
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Dose (doses/ave) e Volume (mL/dose) são calculados separadamente.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLotRow}
                className="h-8 text-xs font-bold rounded-xl gap-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Lote
              </Button>
            </div>

            <div className="space-y-2.5">
              {lotRows.map((row, idx) => {
                const count = Number(row.animalCount) || 0
                const dpa = Number(row.dosePerAnimal) || 1
                const dosesApplied = count * dpa
                const totalVol = Number(
                  (dosesApplied * (Number(row.volumePerDose) || 0)).toFixed(3),
                )
                const appMatch = lotAppropriations.find((a) => a.id === row.id)

                return (
                  <div
                    key={row.id}
                    className="p-3 rounded-xl bg-white border border-border/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        Lote #{idx + 1}
                      </span>
                      {lotRows.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLotRow(row.id)}
                          className="h-6 w-6 p-0 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      <div className="sm:col-span-2">
                        <Label className="text-[11px]">Lote Animal *</Label>
                        <Select
                          value={row.lotId}
                          onValueChange={(val) => handleUpdateLotRow(row.id, { lotId: val })}
                        >
                          <SelectTrigger className="h-9 text-xs rounded-xl">
                            <SelectValue placeholder="Selecione o lote" />
                          </SelectTrigger>
                          <SelectContent>
                            {lots.map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                {l.code} - {l.name} ({l.currentQuantity} aves)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[11px]">Aves Vacinadas *</Label>
                        <Input
                          type="number"
                          value={row.animalCount || ''}
                          onChange={(e) =>
                            handleUpdateLotRow(row.id, { animalCount: Number(e.target.value) })
                          }
                          placeholder="Ex: 3"
                          className="h-9 text-xs rounded-xl"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-[11px]">Dose / Ave *</Label>
                        <Input
                          type="number"
                          step="any"
                          value={row.dosePerAnimal}
                          onChange={(e) =>
                            handleUpdateLotRow(row.id, { dosePerAnimal: Number(e.target.value) })
                          }
                          placeholder="1"
                          className="h-9 text-xs rounded-xl font-bold"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-[11px]">Volume / Dose</Label>
                        <Input
                          type="number"
                          step="any"
                          value={row.volumePerDose}
                          onChange={(e) =>
                            handleUpdateLotRow(row.id, { volumePerDose: Number(e.target.value) })
                          }
                          placeholder="0.03"
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>

                      <div>
                        <Label className="text-[11px]">Via de Aplicação</Label>
                        <Select
                          value={row.route}
                          onValueChange={(val) =>
                            handleUpdateLotRow(row.id, { route: val as VaccinationRoute })
                          }
                        >
                          <SelectTrigger className="h-9 text-xs rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ocular">Ocular / Nasal</SelectItem>
                            <SelectItem value="água">Água de bebida</SelectItem>
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

                    <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 border-t border-border/40 text-muted-foreground">
                      <div>
                        Doses calculadas:{' '}
                        <strong className="text-foreground">{dosesApplied} doses</strong> • Volume:{' '}
                        <strong className="text-foreground">{totalVol} mL</strong>
                      </div>
                      <div>
                        Custo apropriado ao lote:{' '}
                        <strong className="text-emerald-700 font-bold">
                          R$ {(appMatch?.lotCost || 0).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Destino do Frasco e Perda Técnica */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Destino do Frasco Aberto & Sobras
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-amber-800">
                {dosesRemaining} doses restantes
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Destino das Doses Restantes</Label>
                <Select value={vialDestiny} onValueChange={(v) => setVialDestiny(v as VialDestiny)}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discarded">
                      Descartadas / Perda Técnica (Sobra Inutilizada)
                    </SelectItem>
                    <SelectItem value="kept" disabled={!canKeepOpenedProduct && !!selectedItem}>
                      Mantidas Disponíveis{' '}
                      {!canKeepOpenedProduct && selectedItem
                        ? '(Não permitido para este produto)'
                        : ''}
                    </SelectItem>
                    <SelectItem value="closed">Permanecer Fechado (Não violado)</SelectItem>
                  </SelectContent>
                </Select>
                {!canKeepOpenedProduct && selectedItem && (
                  <p className="text-[10px] text-amber-800 mt-1">
                    ℹ️ O cadastro deste produto não permite estocar sobra reconstituída (ex: vacina
                    viva liofilizada). O descarte é contabilizado automaticamente.
                  </p>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacidade do frasco:</span>
                  <strong className="text-foreground">{capacityNum} doses</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doses aplicadas (total lotes):</span>
                  <strong className="text-emerald-700">{totalDosesApplied} doses</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doses descartadas (perda):</span>
                  <strong className="text-rose-600">{totalDosesDiscarded} doses</strong>
                </div>
                <div className="flex justify-between border-t border-border/40 pt-1 font-bold">
                  <span className="text-foreground">Total baixado do estoque:</span>
                  <span className="text-foreground">{totalDownloadedFromStock} doses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Contábil da Sessão */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 text-white space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">Resumo Contábil da Sessão:</span>
              <span className="text-emerald-400 font-bold">
                Custo Real: R$ {realCostConsumed.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-400 border-t border-zinc-800 pt-1.5">
              <div>
                <span>Aves atendidas:</span>
                <strong className="block text-white">
                  {lotRows.reduce((a, b) => a + (Number(b.animalCount) || 0), 0)} aves
                </strong>
              </div>
              <div>
                <span>Doses aplicadas:</span>
                <strong className="block text-white">{totalDosesApplied} doses</strong>
              </div>
              <div>
                <span>Perda / Descarte:</span>
                <strong className="block text-rose-400">{totalDosesDiscarded} doses</strong>
              </div>
              <div>
                <span>Soma rateio lotes:</span>
                <strong className="block text-emerald-400">
                  R$ {lotAppropriations.reduce((a, b) => a + b.lotCost, 0).toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Observações da Sessão</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações do lote de fabricação, diluente, temperatura de conservação..."
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {isSubmitting ? 'Gravando Sessão...' : 'Concluir Sessão & Gravar Aplicações 💉'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
