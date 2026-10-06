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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search as SearchIcon, CheckSquare, Square, Filter } from 'lucide-react'
import { IncubationEgg, CandlingResult, EggCandlingRecord } from '@/types/farm'
import { mapCandlingResultToEggStatus } from '@/lib/incubation-service'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  eggs: IncubationEgg[]
  currentDay: number
  incubationStartDate: string
  onSave: (data: {
    appliedEggs: IncubationEgg[]
    candlingSummary: {
      day: number
      date: string
      fertile: number
      infertile: number
      developing: number
      deadEmbryo: number
      discarded: number
      notes?: string
    }
  }) => Promise<{ error?: any } | void>
}

export function OvoscopiaOperacionalDialog({
  open,
  onOpenChange,
  eggs,
  currentDay,
  incubationStartDate,
  onSave,
}: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [day, setDay] = useState(String(currentDay))
  const [selectedResult, setSelectedResult] = useState<CandlingResult>('Desenvolvendo')
  const [selectedEggIds, setSelectedEggIds] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Mapeamento local dos ovos para edição individual/múltipla antes de confirmar
  const [eggsState, setEggsState] = useState<IncubationEgg[]>(eggs)

  // Reset quando abre
  const handleOpenInit = () => {
    setDate(today)
    setDay(String(currentDay))
    setSelectedResult('Desenvolvendo')
    setSelectedEggIds(new Set())
    setSearchFilter('')
    setStatusFilter('todos')
    setNotes('')
    setEggsState(eggs)
  }

  // Sincronizar ovos quando `eggs` muda e diálogo está aberto
  useMemo(() => {
    if (open) {
      setEggsState(eggs)
      setDay(String(currentDay))
    }
  }, [open, eggs, currentDay])

  const filteredEggs = useMemo(() => {
    return eggsState.filter((egg) => {
      const matchSearch =
        egg.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (egg.breed && egg.breed.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (egg.motherCode && egg.motherCode.toLowerCase().includes(searchFilter.toLowerCase()))
      if (!matchSearch) return false

      if (statusFilter === 'todos') return true
      return egg.status === statusFilter
    })
  }, [eggsState, searchFilter, statusFilter])

  const toggleSelectEgg = (id: string) => {
    const next = new Set(selectedEggIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedEggIds(next)
  }

  const toggleSelectAllFiltered = () => {
    if (selectedEggIds.size === filteredEggs.length && filteredEggs.length > 0) {
      setSelectedEggIds(new Set())
    } else {
      const next = new Set<string>()
      filteredEggs.forEach((e) => next.add(e.id))
      setSelectedEggIds(next)
    }
  }

  // Aplica o resultado selecionado para TODOS os ovos marcados
  const handleApplyToSelected = () => {
    if (selectedEggIds.size === 0) return
    const newStatus = mapCandlingResultToEggStatus(selectedResult)
    const currentDayNum = Number(day) || currentDay

    setEggsState((prev) =>
      prev.map((egg) => {
        if (!selectedEggIds.has(egg.id)) return egg

        const newCandlingRecord: EggCandlingRecord = {
          id: `cand-${Date.now()}-${egg.id}`,
          date,
          day: currentDayNum,
          result: selectedResult,
          notes: notes ? notes : undefined,
        }

        const history = egg.candlingHistory ? [...egg.candlingHistory] : []
        history.push(newCandlingRecord)

        return {
          ...egg,
          status: newStatus,
          candlingHistory: history,
        }
      }),
    )

    // Limpar seleção após aplicar
    setSelectedEggIds(new Set())
  }

  // Alteração direta em um ovo específico
  const handleSingleEggChange = (eggId: string, result: CandlingResult) => {
    const newStatus = mapCandlingResultToEggStatus(result)
    const currentDayNum = Number(day) || currentDay

    setEggsState((prev) =>
      prev.map((egg) => {
        if (egg.id !== eggId) return egg

        const newCandlingRecord: EggCandlingRecord = {
          id: `cand-${Date.now()}-${egg.id}`,
          date,
          day: currentDayNum,
          result,
          notes: notes ? notes : undefined,
        }

        const history = egg.candlingHistory ? [...egg.candlingHistory] : []
        history.push(newCandlingRecord)

        return {
          ...egg,
          status: newStatus,
          candlingHistory: history,
        }
      }),
    )
  }

  const handleSave = async () => {
    setSubmitting(true)
    const currentDayNum = Number(day) || currentDay

    // Estatísticas agregadas desta sessão para o histórico em farm_candlings
    let fertile = 0
    let infertile = 0
    let developing = 0
    let deadEmbryo = 0
    let discarded = 0

    eggsState.forEach((e) => {
      if (e.status === 'Desenvolvendo' || e.status === 'Eclodiu') {
        developing++
        fertile++
      } else if (e.status === 'Claro/sem desenvolvimento') {
        infertile++
      } else if (e.status === 'Embrião interrompido' || e.status === 'Não eclodiu') {
        deadEmbryo++
        fertile++ // ovo fertilizado mas embrião parou
      } else if (e.status === 'Descartado' || e.status === 'Quebrado') {
        discarded++
      }
    })

    const summary = {
      day: currentDayNum,
      date,
      fertile,
      infertile,
      developing,
      deadEmbryo,
      discarded,
      notes: notes || undefined,
    }

    try {
      await onSave({
        appliedEggs: eggsState,
        candlingSummary: summary,
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
            <SearchIcon className="w-5 h-5 text-primary" /> Registrar Ovoscopia
          </DialogTitle>
          <DialogDescription className="text-xs">
            Avalie o desenvolvimento dos ovos em lote ou individualmente com histórico completo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Cabeçalho da sessão */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-secondary/40 border border-border/60">
            <div>
              <Label className="text-xs">Data da Ovoscopia</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Dia da Incubação</Label>
              <Input
                type="number"
                min={1}
                max={25}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white"
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-xs">Observação geral</Label>
              <Input
                placeholder="Ex: Ovoscopia do 7º dia"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Barra de ação em massa */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-foreground">
                Classificação em Lote ({selectedEggIds.size} selecionados)
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={toggleSelectAllFiltered}
                className="h-7 text-xs rounded-lg gap-1 text-primary"
              >
                {selectedEggIds.size === filteredEggs.length && filteredEggs.length > 0 ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" /> Desmarcar todos
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" /> Selecionar todos visíveis
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={selectedResult}
                  onValueChange={(v) => setSelectedResult(v as CandlingResult)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Desenvolvendo">
                      🟢 Desenvolvendo (Embrião ativo / vascularizado)
                    </SelectItem>
                    <SelectItem value="Claro/sem desenvolvimento">
                      ⚪ Claro / Sem desenvolvimento (Infértil)
                    </SelectItem>
                    <SelectItem value="Duvidoso">🟡 Duvidoso (Reavaliar depois)</SelectItem>
                    <SelectItem value="Desenvolvimento interrompido">
                      🔴 Embrião interrompido / Morto
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleApplyToSelected}
                disabled={selectedEggIds.size === 0}
                className="h-9 rounded-xl bg-primary text-white text-xs font-semibold px-4"
              >
                Aplicar aos Selecionados
              </Button>
            </div>
          </div>

          {/* Filtros de busca na lista de ovos */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[140px]">
              <Input
                placeholder="Buscar ovo (código, raça, mãe)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white"
              />
            </div>
            <div className="w-[160px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Incubado">Incubado</SelectItem>
                  <SelectItem value="Desenvolvendo">Desenvolvendo</SelectItem>
                  <SelectItem value="Claro/sem desenvolvimento">Claro</SelectItem>
                  <SelectItem value="Duvidoso">Duvidoso</SelectItem>
                  <SelectItem value="Embrião interrompido">Interrompido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista compacta de ovos mobile-first */}
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {filteredEggs.length === 0 ? (
              <div className="text-center p-6 text-xs text-muted-foreground bg-secondary/20 rounded-2xl">
                Nenhum ovo encontrado com os filtros aplicados.
              </div>
            ) : (
              filteredEggs.map((egg) => {
                const isSelected = selectedEggIds.has(egg.id)
                const lastRecord =
                  egg.candlingHistory && egg.candlingHistory.length > 0
                    ? egg.candlingHistory[egg.candlingHistory.length - 1]
                    : null

                const badgeColor =
                  egg.status === 'Desenvolvendo' || egg.status === 'Eclodiu'
                    ? 'bg-emerald-100 text-emerald-800'
                    : egg.status === 'Claro/sem desenvolvimento'
                      ? 'bg-slate-100 text-slate-700'
                      : egg.status === 'Duvidoso'
                        ? 'bg-amber-100 text-amber-800'
                        : egg.status === 'Embrião interrompido' || egg.status === 'Não eclodiu'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-orange-50 text-orange-800'

                return (
                  <div
                    key={egg.id}
                    className={`p-2.5 rounded-2xl border transition-all text-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-primary/5 border-primary shadow-xs'
                        : 'bg-white border-border'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 cursor-pointer flex-1"
                      onClick={() => toggleSelectEgg(egg.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectEgg(egg.id)}
                        className="rounded cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground text-sm">
                            {egg.code}
                          </span>
                          <Badge className={`${badgeColor} text-[10px] py-0 px-2`}>
                            {egg.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {egg.breed || 'Sem raça'}
                          {egg.motherCode ? ` • Matriz: ${egg.motherCode}` : ''}
                          {egg.fatherCode ? ` × ${egg.fatherCode}` : ''}
                        </p>
                        {lastRecord && (
                          <p className="text-[9px] text-primary/80 mt-0.5">
                            Histórico: Dia {lastRecord.day} ({lastRecord.result})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ação individual inline rápida */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSingleEggChange(egg.id, 'Desenvolvendo')}
                        className="h-7 px-2 text-[10px] rounded-lg hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border-emerald-200"
                      >
                        Desenvolve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSingleEggChange(egg.id, 'Claro/sem desenvolvimento')}
                        className="h-7 px-2 text-[10px] rounded-lg hover:bg-slate-100 text-slate-700 border-slate-200"
                      >
                        Claro
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSingleEggChange(egg.id, 'Duvidoso')}
                        className="h-7 px-2 text-[10px] rounded-lg hover:bg-amber-50 text-amber-700 border-amber-200"
                      >
                        Duvidoso
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
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
              className="flex-1 h-11 rounded-xl bg-primary text-white text-xs font-semibold"
            >
              {submitting ? 'Salvando...' : 'Confirmar e Salvar Ovoscopia'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
