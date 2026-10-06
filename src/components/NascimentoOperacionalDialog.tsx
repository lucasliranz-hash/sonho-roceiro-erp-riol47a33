import { useState, useMemo } from 'react'
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Baby, CheckSquare, Square } from 'lucide-react'
import { IncubationEgg } from '@/types/farm'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  incubationCode: string
  eggs: IncubationEgg[]
  onSave: (data: {
    appliedEggs: IncubationEgg[]
    hatchedCount: number
    unhatchedCount: number
    healthyChicks: number
    deaths: number
  }) => Promise<{ error?: any } | void>
}

interface EggHatchDraft {
  eggId: string
  code: string
  breed?: string
  motherCode?: string
  fatherCode?: string
  hatched: boolean
  birthWeightGrams?: number
  sex: 'Macho' | 'Fêmea' | 'Desconhecido'
  notes?: string
}

export function NascimentoOperacionalDialog({
  open,
  onOpenChange,
  incubationCode,
  eggs,
  onSave,
}: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [hatchDate, setHatchDate] = useState(today)
  const [hatchTime, setHatchTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Lista local para edição rápida dos ovos
  const [drafts, setDrafts] = useState<EggHatchDraft[]>(() =>
    eggs.map((e) => ({
      eggId: e.id,
      code: e.code,
      breed: e.breed,
      motherCode: e.motherCode,
      fatherCode: e.fatherCode,
      hatched: e.status === 'Eclodiu' || e.status === 'Desenvolvendo',
      birthWeightGrams: e.birthWeightGrams || undefined,
      sex: e.sex || 'Desconhecido',
      notes: e.notes,
    })),
  )

  // Atualizar drafts quando abre ou eggs muda
  useMemo(() => {
    if (open) {
      setDrafts(
        eggs.map((e) => ({
          eggId: e.id,
          code: e.code,
          breed: e.breed,
          motherCode: e.motherCode,
          fatherCode: e.fatherCode,
          hatched: e.status === 'Eclodiu' || e.status === 'Desenvolvendo',
          birthWeightGrams: e.birthWeightGrams || undefined,
          sex: e.sex || 'Desconhecido',
          notes: e.notes,
        })),
      )
    }
  }, [open, eggs])

  const hatchedCount = useMemo(() => drafts.filter((d) => d.hatched).length, [drafts])
  const unhatchedCount = useMemo(() => drafts.length - hatchedCount, [drafts, hatchedCount])

  const toggleHatched = (eggId: string) => {
    setDrafts((prev) => prev.map((d) => (d.eggId === eggId ? { ...d, hatched: !d.hatched } : d)))
  }

  const markAllAsHatched = (val: boolean) => {
    setDrafts((prev) => prev.map((d) => ({ ...d, hatched: val })))
  }

  const updateDraft = (eggId: string, updates: Partial<EggHatchDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.eggId === eggId ? { ...d, ...updates } : d)))
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      const updatedEggs: IncubationEgg[] = eggs.map((original) => {
        const d = drafts.find((draft) => draft.eggId === original.id)
        if (!d) return original

        return {
          ...original,
          status: d.hatched ? 'Eclodiu' : 'Não eclodiu',
          hatchedDate: d.hatched ? hatchDate : undefined,
          hatchedTime: d.hatched && hatchTime ? hatchTime : undefined,
          birthWeightGrams: d.birthWeightGrams,
          sex: d.sex,
          notes: d.notes || original.notes,
        }
      })

      await onSave({
        appliedEggs: updatedEggs,
        hatchedCount,
        unhatchedCount,
        healthyChicks: hatchedCount,
        deaths: 0,
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Baby className="w-5 h-5 text-orange-600" /> Registrar Nascimento • {incubationCode}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Indique quais ovos eclodiram e registre peso, sexo e detalhes para manter o vínculo
            permanente do pintinho.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Parâmetros do nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
            <div>
              <Label className="text-xs">Data do Nascimento *</Label>
              <Input
                type="date"
                value={hatchDate}
                onChange={(e) => setHatchDate(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Horário aproximado (opcional)</Label>
              <Input
                type="time"
                value={hatchTime}
                onChange={(e) => setHatchTime(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Resumo da eclosão */}
          <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/60 flex items-center justify-between text-xs text-orange-950">
            <div>
              <span className="font-bold block text-sm">
                🐣 {hatchedCount} pintinhos nascidos / {drafts.length} ovos
              </span>
              <span className="text-[11px] text-orange-800">
                {unhatchedCount} ovos não eclodiram
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => markAllAsHatched(true)}
                className="h-8 text-[11px] rounded-xl bg-white"
              >
                Todos Eclodiram
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => markAllAsHatched(false)}
                className="h-8 text-[11px] rounded-xl"
              >
                Limpar
              </Button>
            </div>
          </div>

          {/* Lista de ovos individual com seleção rápida */}
          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
            {drafts.map((d) => (
              <div
                key={d.eggId}
                className={`p-3 rounded-2xl border transition-all text-xs space-y-2 ${
                  d.hatched ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={d.hatched}
                      onChange={() => toggleHatched(d.eggId)}
                      className="rounded cursor-pointer"
                    />
                    <span className="font-mono font-bold text-sm text-foreground">{d.code}</span>
                    <Badge
                      className={`text-[10px] py-0 px-2 ${
                        d.hatched
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {d.hatched ? 'Eclodiu 🐣' : 'Não Eclodiu 🥚'}
                    </Badge>
                  </label>

                  <span className="text-[10px] text-muted-foreground">
                    {d.breed || 'Genética livre'}
                    {d.motherCode ? ` • Matriz: ${d.motherCode}` : ''}
                    {d.fatherCode ? ` × ${d.fatherCode}` : ''}
                  </span>
                </div>

                {d.hatched && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-emerald-100">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">
                        Peso ao nascer (gramas)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 42.5"
                        value={d.birthWeightGrams ?? ''}
                        onChange={(e) =>
                          updateDraft(d.eggId, {
                            birthWeightGrams:
                              e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                        className="h-8 text-xs rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Sexo</Label>
                      <Select
                        value={d.sex}
                        onValueChange={(v) =>
                          updateDraft(d.eggId, {
                            sex: v as 'Macho' | 'Fêmea' | 'Desconhecido',
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Desconhecido">Desconhecido</SelectItem>
                          <SelectItem value="Macho">Macho</SelectItem>
                          <SelectItem value="Fêmea">Fêmea</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-[10px] text-muted-foreground">Observação</Label>
                      <Input
                        placeholder="Ex: Muito vigoroso"
                        value={d.notes || ''}
                        onChange={(e) => updateDraft(d.eggId, { notes: e.target.value })}
                        className="h-8 text-xs rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
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
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-primary text-white text-xs font-semibold gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              {submitting ? 'Salvando...' : 'Salvar Nascimento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
