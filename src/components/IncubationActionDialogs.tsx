import { useState, useEffect, useMemo } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, CheckCircle2, DollarSign, ExternalLink, Sparkles } from 'lucide-react'
import { Incubation } from '@/types/farm'
import { getIncubationTotalCost } from '@/hooks/use-farm-store'

interface BaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface FinalizeData {
  hatchedCount: number
  unhatchedCount: number
  healthyChicks: number
  deaths: number
  endDate: string
  createLot: boolean
  lotName?: string
  notes?: string
}

export function DeleteIncubationDialog({
  open,
  onOpenChange,
  onConfirm,
}: BaseProps & { onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir esta incubação?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os registros vinculados (ovoscopias) também serão removidos. Esta ação não pode
            ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ObservationDialog({
  open,
  onOpenChange,
  currentNotes,
  onSave,
}: BaseProps & {
  currentNotes?: string
  onSave: (notes: string) => Promise<{ error: any } | void>
}) {
  const [notes, setNotes] = useState(currentNotes || '')
  useEffect(() => {
    if (open) setNotes(currentNotes || '')
  }, [open, currentNotes])
  const handleSave = async () => {
    const result = (await onSave(notes)) as { error: any } | undefined
    if (result?.error) return
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Registrar Observação</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anote observações sobre esta incubação..."
              className="text-xs rounded-xl min-h-[100px]"
            />
          </div>
          <Button
            onClick={handleSave}
            className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            Salvar Observação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TempHumidityDialog({
  open,
  onOpenChange,
  currentTemp,
  currentHumidity,
  onSave,
}: BaseProps & {
  currentTemp: number
  currentHumidity: number
  onSave: (temp: number, humidity: number) => Promise<{ error: any } | void>
}) {
  const [temp, setTemp] = useState(String(currentTemp))
  const [humidity, setHumidity] = useState(String(currentHumidity))
  useEffect(() => {
    if (open) {
      setTemp(String(currentTemp))
      setHumidity(String(currentHumidity))
    }
  }, [open, currentTemp, currentHumidity])
  const handleSave = async () => {
    const result = (await onSave(Number(temp) || 0, Number(humidity) || 0)) as
      | { error: any }
      | undefined
    if (result?.error) return
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Ajustar Temperatura e Umidade</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Temperatura Alvo (°C)</Label>
              <Input
                type="number"
                step="0.1"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Umidade Alvo (%)</Label>
              <Input
                type="number"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function HatchingDialog({
  open,
  onOpenChange,
  onSave,
}: BaseProps & {
  onSave: (results: {
    hatchedCount: number
    unhatchedCount: number
    healthyChicks: number
    deaths: number
  }) => Promise<{ error: any } | void>
}) {
  const [hatched, setHatched] = useState('')
  const [unhatched, setUnhatched] = useState('')
  const [healthy, setHealthy] = useState('')
  const [deaths, setDeaths] = useState('')
  useEffect(() => {
    if (open) {
      setHatched('')
      setUnhatched('')
      setHealthy('')
      setDeaths('')
    }
  }, [open])
  const handleSave = async () => {
    const result = (await onSave({
      hatchedCount: Number(hatched) || 0,
      unhatchedCount: Number(unhatched) || 0,
      healthyChicks: Number(healthy) || 0,
      deaths: Number(deaths) || 0,
    })) as { error: any } | undefined
    if (result?.error) return
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Registrar Nascimento 🐥</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nascidos (eclosão)</Label>
              <Input
                type="number"
                value={hatched}
                onChange={(e) => setHatched(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Não eclodidos</Label>
              <Input
                type="number"
                value={unhatched}
                onChange={(e) => setUnhatched(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Pintinhos Saudáveis</Label>
              <Input
                type="number"
                value={healthy}
                onChange={(e) => setHealthy(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Mortes Pós-Nascimento</Label>
              <Input
                type="number"
                value={deaths}
                onChange={(e) => setDeaths(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="0"
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            Salvar Nascimento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function FinalizeDialog({
  open,
  onOpenChange,
  incubation,
  onConfirm,
  onViewLot,
}: BaseProps & {
  incubation: Incubation
  onConfirm: (data: FinalizeData) => Promise<{ error: any; lotId?: string } | void>
  onViewLot?: (lotId: string) => void
}) {
  const [hatched, setHatched] = useState('')
  const [healthy, setHealthy] = useState('')
  const [deaths, setDeaths] = useState('')
  const [unhatched, setUnhatched] = useState('')
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [createLot, setCreateLot] = useState(true)
  const [lotName, setLotName] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const hasAlreadyGeneratedLot = !!incubation?.resultingLotId

  useEffect(() => {
    if (open && incubation) {
      const hCount = incubation.hatchedCount ?? 0
      const hHealthy = incubation.healthyChicks ?? 0
      const dCount = incubation.deaths ?? 0
      const unCount =
        incubation.unhatchedCount ??
        (incubation.eggCount > 0 && hCount > 0 ? Math.max(0, incubation.eggCount - hCount) : 0)

      setHatched(hCount > 0 ? String(hCount) : '')
      setHealthy(hHealthy > 0 ? String(hHealthy) : hCount > 0 ? String(hCount) : '')
      setDeaths(dCount > 0 ? String(dCount) : '')
      setUnhatched(unCount > 0 ? String(unCount) : '')
      setEndDate(incubation.endDate || new Date().toISOString().split('T')[0])
      setCreateLot(!hasAlreadyGeneratedLot)
      setLotName(`Pintinhos - ${incubation.code}`)
      setNotes(incubation.notes || '')
      setValidationError(null)
      setSubmitting(false)
    }
  }, [open, incubation, hasAlreadyGeneratedLot])

  // Custos calculados
  const eggCost = Number(incubation?.eggCost || 0)
  const energyCost = Number(incubation?.energyCost || 0)
  const suppliesCost = Number(incubation?.suppliesCost || 0)
  const laborCost = Number(incubation?.laborCost || 0)
  const otherCosts = Number(incubation?.otherCosts || 0)
  const totalCost = getIncubationTotalCost(incubation)

  const numHatched = Number(hatched) || 0
  const numHealthy = Number(healthy) || 0
  const numUnhatched = Number(unhatched) || 0
  const numDeaths = Number(deaths) || 0
  const eggCount = incubation?.eggCount || 0

  const hatchRate = eggCount > 0 && numHatched > 0 ? (numHatched / eggCount) * 100 : 0
  const costPerHealthyChick = numHealthy > 0 ? totalCost / numHealthy : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    // Validações
    if (numHealthy > numHatched) {
      setValidationError('Pintinhos viáveis/saudáveis não pode ser maior que o total de nascidos.')
      return
    }

    if (createLot && !hasAlreadyGeneratedLot && numHealthy <= 0) {
      setValidationError('Para gerar um lote de pintinhos, informe ao menos 1 pintinho saudável.')
      return
    }

    setSubmitting(true)
    try {
      const res = await onConfirm({
        hatchedCount: numHatched,
        unhatchedCount: numUnhatched,
        healthyChicks: numHealthy,
        deaths: numDeaths,
        endDate: endDate || new Date().toISOString().split('T')[0],
        createLot: !hasAlreadyGeneratedLot && createLot,
        lotName: lotName.trim() || `Pintinhos - ${incubation.code}`,
        notes: notes.trim() || undefined,
      })

      if (res && typeof res === 'object' && res.error) {
        setValidationError(res.error.message || 'Erro ao finalizar incubação.')
        setSubmitting(false)
        return
      }
      onOpenChange(false)
    } catch (err: any) {
      setValidationError(err?.message || 'Erro inesperado ao finalizar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" /> Finalizar Incubação {incubation?.code}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Dados de Fechamento */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Total de nascidos (eclosão) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={hatched}
                  onChange={(e) => setHatched(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Pintinhos viáveis/saudáveis *</Label>
                <Input
                  type="number"
                  min={0}
                  value={healthy}
                  onChange={(e) => setHealthy(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Mortos ao nascer</Label>
                <Input
                  type="number"
                  min={0}
                  value={deaths}
                  onChange={(e) => setDeaths(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs">Ovos não eclodidos</Label>
                <Input
                  type="number"
                  min={0}
                  value={unhatched}
                  onChange={(e) => setUnhatched(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-xs">Data final *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Observações finais</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o fechamento desta incubação..."
                className="text-xs rounded-xl min-h-[60px]"
              />
            </div>
          </div>

          {/* Bloco de Resumo Readonly */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/70 space-y-2.5 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" /> Resumo Financeiro e Zootécnico
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground">Ovos colocados: </span>
                <span className="font-semibold text-foreground">{eggCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Nascidos: </span>
                <span className="font-semibold text-foreground">{numHatched}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Taxa de eclosão: </span>
                <span className="font-bold text-primary">{hatchRate.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Viáveis: </span>
                <span className="font-bold text-emerald-700">{numHealthy}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <div>Custo dos ovos: R$ {eggCost.toFixed(2)}</div>
              <div>Energia: R$ {energyCost.toFixed(2)}</div>
              <div>Insumos: R$ {suppliesCost.toFixed(2)}</div>
              <div>Mão de obra / Outros: R$ {(laborCost + otherCosts).toFixed(2)}</div>
            </div>

            <div className="pt-2 border-t border-border/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                  Custo total da incubação
                </span>
                <span className="text-base font-extrabold text-foreground">
                  R$ {totalCost.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                  Custo por pintinho viável
                </span>
                <span className="text-base font-extrabold text-emerald-700">
                  {costPerHealthyChick !== null ? `R$ ${costPerHealthyChick.toFixed(2)}` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Geração de Lote */}
          {hasAlreadyGeneratedLot ? (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Esta incubação já gerou o lote {incubation.resultingLotId}.</span>
              </div>
              <p className="text-[11px] text-amber-800">
                A criação de lote duplicado foi desabilitada automaticamente.
              </p>
              {onViewLot && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewLot(incubation.resultingLotId!)}
                  className="rounded-xl h-8 text-xs bg-white gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ver lote
                </Button>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={createLot}
                  onCheckedChange={(c) => setCreateLot(c === true)}
                  className="rounded-md"
                />
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Criar lote automaticamente com
                  os pintinhos nascidos
                </span>
              </label>

              {createLot && (
                <div className="space-y-1.5 pl-6">
                  <Label className="text-[11px] text-muted-foreground">Nome do lote</Label>
                  <Input
                    value={lotName}
                    onChange={(e) => setLotName(e.target.value)}
                    placeholder={`Pintinhos - ${incubation?.code}`}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    O lote será criado com {numHealthy} pintinhos e custo inicial de R${' '}
                    {totalCost.toFixed(2)}.
                  </p>
                </div>
              )}
            </div>
          )}

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
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Finalizando...' : 'Confirmar e Finalizar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
