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
import { Plus, Search, Eye, Pencil, Trash2, DollarSign, Scale, RotateCcw } from 'lucide-react'
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
  const [editingSlaughter, setEditingSlaughter] = useState<Slaughtering | null>(null)
  const [detailsSlaughter, setDetailsSlaughter] = useState<Slaughtering | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Slaughtering | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [lotFilter, setLotFilter] = useState('todos')
  const [destinationFilter, setDestinationFilter] = useState<'todos' | SlaughterDestination>(
    'todos',
  )

  // Filtragem simples dos abates
  const filteredSlaughterings = useMemo(() => {
    return slaughterings.filter((s) => {
      // Destino
      if (destinationFilter !== 'todos' && s.destination !== destinationFilter) {
        return false
      }

      // Lote
      if (lotFilter !== 'todos' && s.lotId !== lotFilter) {
        return false
      }

      // Busca simples por lote, espécie, código ou cliente
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchLot = s.lotName?.toLowerCase().includes(query)
        const matchAnimal = s.animalCode?.toLowerCase().includes(query)
        const matchSpecies = s.species?.toLowerCase().includes(query)
        const matchCustomer =
          s.saleSimple?.customerName?.toLowerCase().includes(query) ||
          s.sale?.customerName?.toLowerCase().includes(query)
        if (!matchLot && !matchAnimal && !matchSpecies && !matchCustomer) {
          return false
        }
      }

      return true
    })
  }, [slaughterings, destinationFilter, lotFilter, searchTerm])

  // ==========================================
  // INDICADORES (APENAS 2, CONFORME ESPECIFICAÇÃO)
  // 1. "Animais abatidos: X"
  // 2. "Custo dos abatidos: R$ X"
  // ==========================================
  const indicators = useMemo(() => {
    const totalSlaughtered = slaughterings.reduce((acc, s) => acc + (s.quantityAnimals || 0), 0)
    const totalCost = slaughterings.reduce(
      (acc, s) => acc + (s.totalCost || s.accumulatedProductionCost || 0),
      0,
    )
    return {
      totalSlaughtered,
      totalCost,
    }
  }, [slaughterings])

  // Exclusão / Estorno com devolução ao lote ativo
  const handleDeleteSlaughter = async () => {
    if (!deleteTarget) return
    const { error } = await deleteSlaughtering(deleteTarget.id)
    const targetSnapshot = deleteTarget
    setDeleteTarget(null)

    if (error) {
      toast({
        title: 'Erro ao estornar abate',
        description: error.message || 'Não foi possível estornar o lançamento.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Abate estornado com sucesso! 🔄',
        description: `${targetSnapshot.quantityAnimals} animal(is) devolvido(s) ao lote ativo e custos desfeitos.`,
      })
    }
  }

  const handleOpenEdit = (s: Slaughtering) => {
    setEditingSlaughter(s)
    setNovoAbateOpen(true)
  }

  const handleOpenCreate = () => {
    setEditingSlaughter(null)
    setNovoAbateOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 1. TOPO: Título, descrição e botão "+ Novo Abate" */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            🥩 Abates
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro de animais abatidos e seus custos.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="rounded-2xl gap-2 font-bold shadow-sm h-10 px-4 text-xs"
        >
          <Plus className="w-4 h-4" /> Novo Abate
        </Button>
      </div>

      {/* INDICADORES (APENAS ESTES 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Animais Abatidos */}
        <Card className="rounded-3xl border border-border bg-card/60 backdrop-blur-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Animais abatidos
              <Scale className="w-4 h-4 text-primary" />
            </span>
            <CardTitle className="text-2xl font-extrabold text-foreground mt-1">
              {indicators.totalSlaughtered}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                {indicators.totalSlaughtered === 1 ? 'ave' : 'aves'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Total acumulado de animais retirados dos lotes por abate
          </CardContent>
        </Card>

        {/* Card 2: Custo dos Abatidos */}
        <Card className="rounded-3xl border border-border bg-card/60 backdrop-blur-xs">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Custo dos abatidos
              <DollarSign className="w-4 h-4 text-rose-500" />
            </span>
            <CardTitle className="text-2xl font-extrabold text-rose-600 mt-1">
              R${' '}
              {indicators.totalCost.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Custo acumulado de produção correspondente aos animais abatidos
          </CardContent>
        </Card>
      </div>

      {/* HISTÓRICO SIMPLES COM FILTROS */}
      <Card className="rounded-3xl border border-border">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar lote, espécie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl"
              />
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
          </div>

          {/* TABELA / HISTÓRICO SIMPLES: Data | Lote | Espécie | Quantidade | Destino | Custo | Ações */}
          {filteredSlaughterings.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border">
              <Scale className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-foreground">
                Nenhum registro de abate encontrado
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Utilize o botão "+ Novo Abate" acima para registrar a saída de animais do lote.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground bg-secondary/30">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Lote</th>
                    <th className="py-2.5 px-3">Espécie</th>
                    <th className="py-2.5 px-3 text-right">Quantidade</th>
                    <th className="py-2.5 px-3">Destino</th>
                    <th className="py-2.5 px-3 text-right">Custo</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSlaughterings.map((s) => {
                    const costVal = s.totalCost || s.accumulatedProductionCost || 0
                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                        onClick={() => setDetailsSlaughter(s)}
                      >
                        <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">
                          {s.date}
                        </td>
                        <td className="py-3 px-3 font-semibold text-foreground">
                          {s.lotName || (s.animalCode ? `#${s.animalCode}` : '—')}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                          {s.species || '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold whitespace-nowrap">
                          {s.quantityAnimals} {s.quantityAnimals === 1 ? 'ave' : 'aves'}
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
                          R${' '}
                          {costVal.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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
                              title="Visualizar detalhes"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => handleOpenEdit(s)}
                              title="Editar abate"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => setDeleteTarget(s)}
                              title="Estornar / Excluir abate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NovoAbateDialog
        open={novoAbateOpen}
        onOpenChange={(open) => {
          setNovoAbateOpen(open)
          if (!open) setEditingSlaughter(null)
        }}
        editingSlaughter={editingSlaughter}
        onSuccess={() => setEditingSlaughter(null)}
      />

      <SlaughterDetailsDialog
        slaughter={detailsSlaughter}
        open={!!detailsSlaughter}
        onOpenChange={(open) => !open && setDetailsSlaughter(null)}
        onEdit={(s) => handleOpenEdit(s)}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteSlaughter}
        title="Estornar Lançamento de Abate"
        description={`Tem certeza que deseja estornar o abate de ${deleteTarget?.quantityAnimals} animal(is) do lote ${deleteTarget?.lotName || ''}? Os animais retornarão ao lote ativo como vivos e o lançamento financeiro associado (se houver) será desfeito.`}
      />
    </div>
  )
}
export default Abates
