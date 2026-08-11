import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  incubationId: string
  currentDay: number
  onSave: (data: {
    date: string
    day: number
    fertile: number
    infertile: number
    developing: number
    deadEmbryo: number
    discarded: number
    notes?: string
  }) => void
}

export function CandlingDialog({ open, onOpenChange, currentDay, onSave }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [day, setDay] = useState(String(currentDay))
  const [fertile, setFertile] = useState('0')
  const [infertile, setInfertile] = useState('0')
  const [developing, setDeveloping] = useState('0')
  const [deadEmbryo, setDeadEmbryo] = useState('0')
  const [discarded, setDiscarded] = useState('0')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().split('T')[0])
      setDay(String(currentDay))
      setFertile('0')
      setInfertile('0')
      setDeveloping('0')
      setDeadEmbryo('0')
      setDiscarded('0')
      setNotes('')
    }
  }, [open, currentDay])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      date,
      day: Number(day) || currentDay,
      fertile: Number(fertile) || 0,
      infertile: Number(infertile) || 0,
      developing: Number(developing) || 0,
      deadEmbryo: Number(deadEmbryo) || 0,
      discarded: Number(discarded) || 0,
      notes: notes || undefined,
    })
    toast({ title: 'Ovoscopia registrada! 🔬', description: 'Dados da ovoscopia salvos.' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Registrar Ovoscopia 🔬</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Dia</Label>
              <Input
                type="number"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Férteis</Label>
              <Input
                type="number"
                value={fertile}
                onChange={(e) => setFertile(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Inférteis</Label>
              <Input
                type="number"
                value={infertile}
                onChange={(e) => setInfertile(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Em Desenvolvimento</Label>
              <Input
                type="number"
                value={developing}
                onChange={(e) => setDeveloping(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Embriões Mortos</Label>
              <Input
                type="number"
                value={deadEmbryo}
                onChange={(e) => setDeadEmbryo(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Descartados</Label>
            <Input
              type="number"
              value={discarded}
              onChange={(e) => setDiscarded(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl min-h-[60px]"
              placeholder="Notas sobre a ovoscopia..."
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            Salvar Ovoscopia
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
