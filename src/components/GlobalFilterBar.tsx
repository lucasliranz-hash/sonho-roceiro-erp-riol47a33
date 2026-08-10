import { useFarmStore } from '@/hooks/use-farm-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Layers } from 'lucide-react'
import { PeriodFilter } from '@/types/farm'

export function GlobalFilterBar() {
  const { selectedPeriod, setSelectedPeriod, selectedLotId, setSelectedLotId, lots } =
    useFarmStore()

  const periods: PeriodFilter[] = [
    'Hoje',
    '7 dias',
    'Este mês',
    'Últimos 30 dias',
    'Este ano',
    'Todos',
  ]

  return (
    <div className="bg-white/80 backdrop-blur border border-border/80 rounded-2xl p-3 shadow-subtle mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary">
          <Calendar className="w-4 h-4 text-primary" />
          <span>Filtro Geral:</span>
        </div>

        <Select
          value={selectedPeriod}
          onValueChange={(val) => setSelectedPeriod(val as PeriodFilter)}
        >
          <SelectTrigger className="w-[140px] h-9 text-xs font-medium rounded-xl border-border">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p} value={p} className="text-xs">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLotId} onValueChange={setSelectedLotId}>
          <SelectTrigger className="w-[180px] h-9 text-xs font-medium rounded-xl border-border">
            <div className="flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue placeholder="Selecione o Lote" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos" className="text-xs font-medium">
              Todos os lotes
            </SelectItem>
            {lots.map((lot) => (
              <SelectItem key={lot.id} value={lot.id} className="text-xs">
                {lot.code} - {lot.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Sincronizado e Atualizado
      </div>
    </div>
  )
}
