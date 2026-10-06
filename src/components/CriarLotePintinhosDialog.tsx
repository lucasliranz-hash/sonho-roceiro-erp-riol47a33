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
import { Plus, Trash2, Sparkles, Layers, DollarSign } from 'lucide-react'
import { Incubation, IncubationEgg } from '@/types/farm'
import { getIncubationTotalCost } from '@/hooks/use-farm-store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  incubation: Incubation
  onConfirm: (
    groups: Array<{
      name: string
      breed?: string
      eggIds: string[]
      chicksCount: number
      allocatedCost: number
    }>,
  ) => Promise<{ error?: any; lotIds?: string[] } | void>
}

interface LotSplitGroup {
  id: string
  name: string
  breed: string
  selectedEggIds: string[]
}

export function CriarLotePintinhosDialog({ open, onOpenChange, incubation, onConfirm }: Props) {
  const hatchedEggs = useMemo(() => {
    return (incubation.eggs || []).filter((e) => e.status === 'Eclodiu')
  }, [incubation.eggs])

  const totalHealthyCount =
    hatchedEggs.length > 0
      ? hatchedEggs.length
      : Number(incubation.healthyChicks || incubation.hatchedCount || 0)

  const totalCost = getIncubationTotalCost(incubation)

  // Modo: Único Lote OU Múltiplos Lotes
  const [mode, setMode] = useState<'single' | 'split'>('single')
  const [singleLotName, setSingleLotName] = useState(`Pintinhos - ${incubation.code}`)
  const [singleBreed, setSingleBreed] = useState(incubation.breed || 'Mista')

  // Grupos no modo split
  const [groups, setGroups] = useState<LotSplitGroup[]>([
    {
      id: 'grp-1',
      name: `Lote 1 - ${incubation.code}`,
      breed: incubation.breed || 'GSB',
      selectedEggIds: [],
    },
  ])

  const [submitting, setSubmitting] = useState(false)

  const handleAddGroup = () => {
    const nextIdx = groups.length + 1
    setGroups((prev) => [
      ...prev,
      {
        id: `grp-${Date.now()}`,
        name: `Lote ${nextIdx} - ${incubation.code}`,
        breed: incubation.breed || '',
        selectedEggIds: [],
      },
    ])
  }

  const handleRemoveGroup = (id: string) => {
    if (groups.length <= 1) return
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }

  const toggleEggInGroup = (groupId: string, eggId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) {
          // Remover do outro grupo para não duplicar ovo entre lotes
          return { ...g, selectedEggIds: g.selectedEggIds.filter((id) => id !== eggId) }
        }
        const has = g.selectedEggIds.includes(eggId)
        return {
          ...g,
          selectedEggIds: has
            ? g.selectedEggIds.filter((id) => id !== eggId)
            : [...g.selectedEggIds, eggId],
        }
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (mode === 'single') {
        const payload = [
          {
            name: singleLotName.trim() || `Pintinhos - ${incubation.code}`,
            breed: singleBreed || incubation.breed,
            eggIds: hatchedEggs.map((e) => e.id),
            chicksCount: totalHealthyCount,
            allocatedCost: totalCost,
          },
        ]
        await onConfirm(payload)
      } else {
        // Modo dividido por grupos
        const payload = groups.map((g) => {
          const count = g.selectedEggIds.length
          const proportion = totalHealthyCount > 0 ? count / totalHealthyCount : 1 / groups.length
          const allocated = Number((totalCost * proportion).toFixed(2))

          return {
            name: g.name.trim() || `Pintinhos - ${incubation.code}`,
            breed: g.breed || incubation.breed,
            eggIds: g.selectedEggIds,
            chicksCount: count,
            allocatedCost: allocated,
          }
        })
        await onConfirm(payload)
      }

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
            <Sparkles className="w-5 h-5 text-emerald-600" /> Criar Lote com os Pintinhos Nascidos
          </DialogTitle>
          <DialogDescription className="text-xs">
            Transfira as aves para o módulo Lotes como lote ativo com apropriação do custo real da
            incubação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Informações de Custo e Total */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Pintinhos Válidos</span>
              <span className="text-sm font-bold text-emerald-700">{totalHealthyCount} aves</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">
                Custo Total Apropriado
              </span>
              <span className="text-sm font-bold text-foreground">R$ {totalCost.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">
                Custo Médio / Pintinho
              </span>
              <span className="text-sm font-bold text-foreground">
                R$ {totalHealthyCount > 0 ? (totalCost / totalHealthyCount).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Atenção Contábil:</strong> O custo é transferido ao lote como apropriação de
              custo inicial. NENHUMA nova despesa financeira é criada para não duplicar custos.
            </span>
          </div>

          {/* Escolha do Modo */}
          {hatchedEggs.length > 1 && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('single')}
                className="flex-1 rounded-xl text-xs h-9"
              >
                Lote Único (Todos os Pintinhos)
              </Button>
              <Button
                type="button"
                variant={mode === 'split' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('split')}
                className="flex-1 rounded-xl text-xs h-9"
              >
                Múltiplos Lotes (Separar por Genética)
              </Button>
            </div>
          )}

          {mode === 'single' ? (
            <div className="p-4 rounded-2xl bg-white border border-border space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome do Lote *</Label>
                  <Input
                    value={singleLotName}
                    onChange={(e) => setSingleLotName(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Raça / Genética</Label>
                  <Input
                    value={singleBreed}
                    onChange={(e) => setSingleBreed(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Origem: Chocadeira • Chocada: {incubation.code} • Quantidade: {totalHealthyCount}{' '}
                aves.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" /> Grupos de Destino
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddGroup}
                  className="h-7 text-xs rounded-xl bg-white gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Outro Lote
                </Button>
              </div>

              {groups.map((grp, idx) => (
                <div
                  key={grp.id}
                  className="p-3.5 rounded-2xl bg-white border border-border space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">Grupo #{idx + 1}</span>
                    {groups.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveGroup(grp.id)}
                        className="h-6 w-6 text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Nome do Lote</Label>
                      <Input
                        value={grp.name}
                        onChange={(e) =>
                          setGroups((prev) =>
                            prev.map((g) => (g.id === grp.id ? { ...g, name: e.target.value } : g)),
                          )
                        }
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Raça / Genética</Label>
                      <Input
                        value={grp.breed}
                        onChange={(e) =>
                          setGroups((prev) =>
                            prev.map((g) =>
                              g.id === grp.id ? { ...g, breed: e.target.value } : g,
                            ),
                          )
                        }
                        className="h-8 text-xs rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Seleção de quais pintinhos vão para este lote */}
                  <div>
                    <Label className="text-[10px] block mb-1 font-semibold text-muted-foreground">
                      Selecione os pintinhos deste lote ({grp.selectedEggIds.length} selecionados):
                    </Label>
                    <div className="max-h-[140px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 rounded-xl bg-secondary/30">
                      {hatchedEggs.map((egg) => {
                        const isSelectedInThisGroup = grp.selectedEggIds.includes(egg.id)
                        return (
                          <label
                            key={egg.id}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer text-[11px] border select-none ${
                              isSelectedInThisGroup
                                ? 'bg-primary/10 border-primary font-bold'
                                : 'bg-white border-border/70'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelectedInThisGroup}
                              onChange={() => toggleEggInGroup(grp.id, egg.id)}
                              className="rounded cursor-pointer"
                            />
                            <span>{egg.code}</span>
                            <span className="text-[9px] text-muted-foreground truncate">
                              ({egg.breed || 'Mista'})
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
              type="submit"
              disabled={submitting || totalHealthyCount <= 0}
              className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              {submitting ? 'Criando Lote...' : 'Criar Lote de Pintinhos'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
