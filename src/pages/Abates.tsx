import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  Layers,
  Scale,
  DollarSign,
  TrendingUp,
  Package,
  ShoppingBag,
} from 'lucide-react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Slaughtering, SlaughterDestination } from '@/types/farm'
import { NovoAbateDialog } from '@/components/abates/NovoAbateDialog'
import { SlaughterDetailsDialog } from '@/components/abates/SlaughterDetailsDialog'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { toast } from '@/hooks/use-toast'

export function Abates() {
  const { slaughterings, lots, deleteSlaughtering } = useFarmStore()

  // Modals state
  const [novoAbateOpen, setNovoAbateOpen] = useState(false)
  const [detailsSlaughter, setDetailsSlaughter] = useState<Slaughtering | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Slaughtering | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState<'todos' | '7dias' | '30dias' | 'mesAtual'>(
    'todos',
  )
  const [speciesFilter, setSpeciesFilter] = useState('todos')
  const [lotFilter, setLotFilter] = useState('todos')
  const [destinationFilter, setDestinationFilter] = useState<'todos' | SlaughterDestination>(
    'todos',
  )

  // Espécies disponíveis nos registros
  const availableSpecies = useMemo(() => {
    const set = new Set<string>()
    slaughterings.forEach((s) => {
      if (s.species) set.add(s.species)
    })
    return Array.from(set)
  }, [slaughterings])

  // Filtragem dos abates
  const filteredSlaughterings = useMemo(() => {
    const now = new Date()

    return slaughterings.filter((s) => {
      // Destino
      if (destinationFilter !== 'todos' && s.destination !== destinationFilter) {
        return false
      }

      // Espécie
      if (speciesFilter !== 'todos' && s.species !== speciesFilter) {
        return false
      }

      // Lote
      if (lotFilter !== 'todos' && s.lotId !== lotFilter) {
        return false
      }

      // Período
      if (periodFilter !== 'todos') {
        const itemDate = new Date(s.date)
        if (periodFilter === '7dias') {
          const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24)
          if (diffDays > 7 || diffDays < 0) return false
        } else if (periodFilter === '30dias') {
          const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24)
          if (diffDays > 30 || diffDays < 0) return false
        } else if (periodFilter === 'mesAtual') {
          if (
            itemDate.getMonth() !== now.getMonth() ||
            itemDate.getFullYear() !== now.getFullYear()
          ) {
            return false
          }
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchLot = s.lotName?.toLowerCase().includes(query)
        const matchAnimal = s.animalCode?.toLowerCase().includes(query)
        const matchSpecies = s.species?.toLowerCase().includes(query)
        const matchCustomer = s.sale?.customerName?.toLowerCase().includes(query)
        if (!matchLot && !matchAnimal && !matchSpecies && !matchCustomer) {
          return false
        }
      }

      return true
    })
  }, [slaughterings, destinationFilter, speciesFilter, lotFilter, periodFilter, searchTerm])

  // ==========================================
  // INDICADORES GERAIS E SEGMENTADOS
  // ==========================================
  const indicators = useMemo(() => {
    const totalSlaughtered = slaughterings.reduce((acc, s) => acc + (s.quantityAnimals || 0), 0)
    const totalLiveWeight = slaughterings.reduce((acc, s) => acc + (s.totalLiveWeightKg || 0), 0)
    const totalCarcassWeight = slaughterings.reduce((acc, s) => acc + (s.carcassWeightKg || 0), 0)
    const totalCosts = slaughterings.reduce((acc, s) => acc + (s.totalCost || 0), 0)
    const averageYield = totalLiveWeight > 0 ? (totalCarcassWeight / totalLiveWeight) * 100 : 0
    const averageCostPerKg = totalCarcassWeight > 0 ? totalCosts / totalCarcassWeight : 0

    // Vendas
    const salesSlaughterings = slaughterings.filter((s) => s.destination === 'Venda')
    const totalSalesRevenue = salesSlaughterings.reduce((acc, s) => acc + (s.revenue || 0), 0)
    const totalSalesProfit = salesSlaughterings.reduce((acc, s) => acc + (s.netProfit || 0), 0)
    const totalSalesCarcassKg = salesSlaughterings.reduce(
      (acc, s) => acc + (s.carcassWeightKg || 0),
      0,
    )
    const totalSalesAnimals = salesSlaughterings.reduce(
      (acc, s) => acc + (s.quantityAnimals || 0),
      0,
    )

    // Consumo Próprio
    const ownConsumptionSlaughterings = slaughterings.filter(
      (s) => s.destination === 'Consumo próprio',
    )
    const totalOwnCarcassKg = ownConsumptionSlaughterings.reduce(
      (acc, s) => acc + (s.carcassWeightKg || 0),
      0,
    )
    const totalOwnCosts = ownConsumptionSlaughterings.reduce(
      (acc, s) => acc + (s.totalCost || 0),
      0,
    )
    const totalOwnAnimals = ownConsumptionSlaughterings.reduce(
      (acc, s) => acc + (s.quantityAnimals || 0),
      0,
    )

    return {
      totalSlaughtered,
      totalLiveWeight,
      totalCarcassWeight,
      totalCosts,
      averageYield,
      averageCostPerKg,
      // Segmentado Venda
      totalSalesRevenue,
      totalSalesProfit,
      totalSalesCarcassKg,
      totalSalesAnimals,
      // Segmentado Consumo
      totalOwnCarcassKg,
      totalOwnCosts,
      totalOwnAnimals,
    }
  }, [slaughterings])

  // Exclusão de abate
  const handleDeleteSlaughter = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const { error } = await deleteSlaughtering(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir o lançamento.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Abate excluído',
        description: 'Lançamento removido e saldos restaurados com sucesso.',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            🥩 Gestão de Abates
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro de abates, rendimento de carcaça, custos acumulados e resultados de venda
          </p>
        </div>
        <Button
          onClick={() => setNovoAbateOpen(true)}
          className="rounded-2xl gap-2 font-bold shadow-sm h-10 px-4 text-xs"
        >
          <Plus className="w-4 h-4" /> Novo Abate
        </Button>
      </div>

      {/* 9. INDICADORES NO TOPO: GERAIS + SEGMENTADOS (CONSUMO PRÓPRIO E VENDA) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Animais Abatidos */}
        <Card className="rounded-3xl border border-border bg-card/60 backdrop-blur-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
              Total Abatido
              <Package className="w-4 h-4 text-primary" />
            </span>
            <CardTitle className="text-xl font-extrabold text-foreground">
              {indicators.totalSlaughtered}{' '}
              <span className="text-xs font-normal text-muted-foreground">aves</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Peso Vivo: <strong>{indicators.totalLiveWeight.toFixed(1)} kg</strong>
          </CardContent>
        </Card>

        {/* Card 2: Carcaça & Rendimento */}
        <Card className="rounded-3xl border border-border bg-card/60 backdrop-blur-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
              Carcaça Produzida
              <Scale className="w-4 h-4 text-amber-500" />
            </span>
            <CardTitle className="text-xl font-extrabold text-foreground">
              {indicators.totalCarcassWeight.toFixed(1)}{' '}
              <span className="text-xs font-normal text-muted-foreground">kg</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Rendimento Médio:{' '}
            <strong className="text-amber-700">{indicators.averageYield.toFixed(1)}%</strong>
          </CardContent>
        </Card>

        {/* Card 3: Custos Totais & Médio */}
        <Card className="rounded-3xl border border-border bg-card/60 backdrop-blur-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
              Custo Total Abates
              <DollarSign className="w-4 h-4 text-rose-500" />
            </span>
            <CardTitle className="text-xl font-extrabold text-rose-600">
              R${' '}
              {indicators.totalCosts.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Custo Médio: <strong>R$ {indicators.averageCostPerKg.toFixed(2)}/kg</strong>
          </CardContent>
        </Card>

        {/* Card 4: Receita & Resultado de Vendas */}
        <Card className="rounded-3xl border border-border bg-card/60 backdrop-blur-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
              Resultado das Vendas
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </span>
            <CardTitle className="text-xl font-extrabold text-emerald-700">
              R${' '}
              {indicators.totalSalesProfit.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Receita: <strong>R$ {indicators.totalSalesRevenue.toFixed(2)}</strong>
          </CardContent>
        </Card>
      </div>

      {/* Segmentação dos Indicadores (Consumo Próprio vs Venda) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/70 flex items-center justify-between">
          <div>
            <span className="font-bold text-blue-900 block flex items-center gap-1.5">
              🍽️ Destino: Consumo Próprio
            </span>
            <span className="text-muted-foreground text-[11px]">
              {indicators.totalOwnAnimals} animais abatidos •{' '}
              {indicators.totalOwnCarcassKg.toFixed(1)} kg de carne
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block">Custo Gerencial Total</span>
            <strong className="text-blue-900 text-sm">
              R${' '}
              {indicators.totalOwnCosts.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 flex items-center justify-between">
          <div>
            <span className="font-bold text-emerald-950 block flex items-center gap-1.5">
              💰 Destino: Venda Comercial
            </span>
            <span className="text-muted-foreground text-[11px]">
              {indicators.totalSalesAnimals} animais comercializados •{' '}
              {indicators.totalSalesCarcassKg.toFixed(1)} kg vendidos
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block">Lucro Líquido Acumulado</span>
            <strong className="text-emerald-700 text-sm">
              R${' '}
              {indicators.totalSalesProfit.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>
      </div>

      {/* 8. HISTÓRICO DE ABATES — FILTROS */}
      <Card className="rounded-3xl border border-border">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {/* Search */}
            <div className="relative sm:col-span-2 md:col-span-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar lote, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl"
              />
            </div>

            {/* Período */}
            <div>
              <Select value={periodFilter} onValueChange={(val: any) => setPeriodFilter(val)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="mesAtual">Mês atual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Destino */}
            <div>
              <Select
                value={destinationFilter}
                onValueChange={(val: any) => setDestinationFilter(val)}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os destinos</SelectItem>
                  <SelectItem value="Consumo próprio">🍽️ Consumo próprio</SelectItem>
                  <SelectItem value="Venda">💰 Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Espécie */}
            <div>
              <Select value={speciesFilter} onValueChange={(val) => setSpeciesFilter(val)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Espécie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as espécies</SelectItem>
                  {availableSpecies.map((sp) => (
                    <SelectItem key={sp} value={sp}>
                      {sp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lote */}
            <div>
              <Select value={lotFilter} onValueChange={(val) => setLotFilter(val)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os lotes</SelectItem>
                  {lots.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TABELA / LISTA DE LANÇAMENTOS */}
          {filteredSlaughterings.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border">
              <Scale className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-foreground">
                Nenhum registro de abate encontrado
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Utilize o botão "Novo Abate" acima para registrar o abate de um lote ou animal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground bg-secondary/30">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Animal / Lote</th>
                    <th className="py-2.5 px-3">Espécie</th>
                    <th className="py-2.5 px-3 text-right">Peso Vivo</th>
                    <th className="py-2.5 px-3 text-right">Carcaça</th>
                    <th className="py-2.5 px-3 text-right">Rendimento</th>
                    <th className="py-2.5 px-3">Destino</th>
                    <th className="py-2.5 px-3 text-right">Custo Total</th>
                    <th className="py-2.5 px-3 text-right">Venda</th>
                    <th className="py-2.5 px-3 text-right">Resultado</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSlaughterings.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                      onClick={() => setDetailsSlaughter(s)}
                    >
                      <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">
                        {s.date}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-foreground">
                          {s.lotName || (s.animalCode ? `#${s.animalCode}` : '—')}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {s.quantityAnimals} {s.quantityAnimals === 1 ? 'ave' : 'aves'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                        {s.species}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-medium">{s.totalLiveWeightKg} kg</div>
                        <span className="text-[10px] text-muted-foreground">
                          méd: {s.averageLiveWeightKg}kg
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold whitespace-nowrap">
                        {s.carcassWeightKg} kg
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="font-bold border-amber-300 text-amber-800 bg-amber-50 text-[10px]"
                        >
                          {s.carcassYieldPercent.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          className={
                            s.destination === 'Venda'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px]'
                          }
                        >
                          {s.destination}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-rose-600 whitespace-nowrap">
                        R$ {s.totalCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-foreground whitespace-nowrap">
                        {s.destination === 'Venda' && s.revenue ? (
                          `R$ ${s.revenue.toFixed(2)}`
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {s.destination === 'Venda' && s.netProfit !== undefined ? (
                          <span
                            className={`font-bold ${
                              s.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            R$ {s.netProfit.toFixed(2)}
                            {s.marginPercent !== undefined && (
                              <span className="text-[10px] font-normal block">
                                ({s.marginPercent.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td
                        className="py-3 px-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => setDetailsSlaughter(s)}
                            title="Ver detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => setDeleteTarget(s)}
                            title="Excluir abate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NovoAbateDialog open={novoAbateOpen} onOpenChange={setNovoAbateOpen} />
      <SlaughterDetailsDialog
        slaughter={detailsSlaughter}
        open={!!detailsSlaughter}
        onOpenChange={(open) => !open && setDetailsSlaughter(null)}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteSlaughter}
        title="Excluir Lançamento de Abate"
        description={`Tem certeza que deseja excluir o abate de ${deleteTarget?.quantityAnimals} animal(is) do lote ${deleteTarget?.lotName || ''}? Os animais retornarão ao lote e a venda associada (se houver) será removida.`}
      />
    </div>
  )
}
export default Abates
