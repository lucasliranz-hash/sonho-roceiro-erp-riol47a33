import { useState, useEffect } from 'react'
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

interface BaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
}: BaseProps & { currentNotes?: string; onSave: (notes: string) => void }) {
  const [notes, setNotes] = useState(currentNotes || '')
  useEffect(() => {
    if (open) setNotes(currentNotes || '')
  }, [open, currentNotes])
  const handleSave = () => {
    onSave(notes)
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
  onSave: (temp: number, humidity: number) => void
}) {
  const [temp, setTemp] = useState(String(currentTemp))
  const [humidity, setHumidity] = useState(String(currentHumidity))
  useEffect(() => {
    if (open) {
      setTemp(String(currentTemp))
      setHumidity(String(currentHumidity))
    }
  }, [open, currentTemp, currentHumidity])
  const handleSave = () => {
    onSave(Number(temp) || 0, Number(humidity) || 0)
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
  }) => void
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
  const handleSave = () => {
    onSave({
      hatchedCount: Number(hatched) || 0,
      unhatchedCount: Number(unhatched) || 0,
      healthyChicks: Number(healthy) || 0,
      deaths: Number(deaths) || 0,
    })
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
  onConfirm,
}: BaseProps & { onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Finalizar Incubação?</AlertDialogTitle>
          <AlertDialogDescription>
            A incubação será marcada como concluída. Você ainda poderá visualizar todos os dados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Finalizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
