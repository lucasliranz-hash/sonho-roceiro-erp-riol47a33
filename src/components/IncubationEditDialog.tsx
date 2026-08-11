import { useState, useEffect } from 'react'
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
import { Incubation, IncubationStatus } from '@/types/farm'
import { toast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  incubation: Incubation
  onSave: (updates: Partial<Incubation>) => void
}

export function IncubationEditDialog({ open, onOpenChange, incubation, onSave }: Props) {
  const [incubatorName, setIncubatorName] = useState(incubation.incubatorName)
  const [origin, setOrigin] = useState(incubation.origin)
  const [breed, setBreed] = useState(incubation.breed)
  const [supplier, setSupplier] = useState(incubation.supplier)
  const [eggCount, setEggCount] = useState(String(incubation.eggCount))
  const [startDate, setStartDate] = useState(incubation.startDate)
  const [targetTemp, setTargetTemp] = useState(String(incubation.targetTemp))
  const [targetHumidity, setTargetHumidity] = useState(String(incubation.targetHumidity))
  const [autoTurning, setAutoTurning] = useState(incubation.autoTurning)
  const [notes, setNotes] = useState(incubation.notes || '')
  const [status, setStatus] = useState<IncubationStatus>(incubation.status)

  useEffect(() => {
    if (open) {
      setIncubatorName(incubation.incubatorName)
      setOrigin(incubation.origin)
      setBreed(incubation.breed)
      setSupplier(incubation.supplier)
      setEggCount(String(incubation.eggCount))
      setStartDate(incubation.startDate)
      setTargetTemp(String(incubation.targetTemp))
      setTargetHumidity(String(incubation.targetHumidity))
      setAutoTurning(incubation.autoTurning)
      setNotes(incubation.notes || '')
      setStatus(incubation.status)
    }
  }, [open, incubation])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const expectedHatchDate = new Date(new Date(startDate).getTime() + 21 * 86400000)
      .toISOString()
      .split('T')[0]
    onSave({
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
    })
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
                onChange={(e) => setEggCount(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
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
