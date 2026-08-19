import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { usePermissions } from '@/hooks/use-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RecordActionMenu } from '@/components/RecordActionMenu'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog'
import { Layers, Plus, Search, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Lot, LotType, LotStatus } from '@/types/farm'
import { computeLotCosts } from '@/lib/calculations'
import { toast } from '@/hooks/use-toast'
import { logAudit } from '@/services/audit'

const LOT_TYPES: LotType[] = [
  'Poedeiras',
  'Frango de corte',
  'Frango caipira',
  'Pintinhos',
  'Matrizes',
  'Reprodutores',
]
const LOT_STATUSES: LotStatus[] = ['Ativo', 'Finalizado', 'Vendido', 'Abatido', 'Transferido']

export default function Lotes() {
  const { lots, addLot, updateLot, deleteLot, weighings, mortality, expenses, sales, activities } =
    useFarmStore()
  const { canEdit, canDelete } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Lot | null>(null)
  const [deleting, setDeleting] = useState<Lot | null>(null)
  const [details, setDetails] = useState<Lot | null>(null)

  // New lot form states
  const [name, setName] = useState('')
  const [type, setType] = useState<LotType>('Poedeiras')
  const [activityId, setActivityId] = useState<string>('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [origin, setOrigin] = useState('Incubação Própria')
  const [supplier, setSupplier] = useState('Sítio Sonho Roceiro')
  const [breed, setBreed] = useState('Caipira')
  const [initialQuantity, setInitialQuantity] = useState('100')
  const [acquisitionCost, setAcquisitionCost] = useState('500')

  // Edit form states
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'Poedeiras' as LotType,
    activityId: '' as string,
    startDate: new Date().toISOString().split('T')[0],
    origin: '',
    supplier: '',
    breed: '',
    initialQuantity: '1',
    acquisitionCost: '0',
    purpose: 'Criação Rural',
    status: 'Ativo' as LotStatus,
    notes: '',
  })

  const activityName = (id?: string) => activities.find((a) => a.id === id)?.name

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activityId) {
      toast({
        title: 'Selecione a atividade',
        description: 'Cadastre uma atividade antes de criar o lote.',
        variant: 'destructive',
      })
      return
    }
    addLot({
      name,
      type,
      activityId: activityId || undefined,
      startDate,
      origin,
      supplier,
      breed,
      initialQuantity: Number(initialQuantity) || 1,
      initialAgeDays: 1,
      acquisitionCost: Number(acquisitionCost) || 0,
      purpose: 'Criação Rural',
      status: 'Ativo',
    })
    toast({ title: 'Lote criado com sucesso! 🐥', description: `Lote "${name}" foi cadastrado.` })
    setCreateDialogOpen(false)
    setName('')
    setActivityId('')
  }

  const openEdit = (lot: Lot) => {
    setEditing(lot)
    setEditForm({
      name: lot.name,
      type: lot.type,
      activityId: lot.activityId || '',
      startDate: lot.startDate,
      origin: lot.origin,
      supplier: lot.supplier,
      breed: lot.breed,
      initialQuantity: String(lot.initialQuantity),
      acquisitionCost: String(lot.acquisitionCost),
      purpose: lot.purpose,
      status: lot.status,
      notes: lot.notes || '',
    })
    setEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    if (!editForm.activityId) {
      toast({
        title: 'Selecione a atividade',
        description: 'Todo lote deve estar vinculado a uma atividade.',
        variant: 'destructive',
      })
      return
    }
    const updates: Partial<Lot> = {
      name: editForm.name,
      type: editForm.type,
      activityId: editForm.activityId || undefined,
      startDate: editForm.startDate,
      origin: editForm.origin,
      supplier: editForm.supplier,
      breed: editForm.breed,
      initialQuantity: Number(editForm.initialQuantity) || 1,
      acquisitionCost: Number(editForm.acquisitionCost) || 0,
      purpose: editForm.purpose,
      status: editForm.status,
      notes: editForm.notes,
    }
    const { error } = await updateLot(editing.id, updates)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Lote atualizado! ✅' })
    setEditOpen(false)
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!deleting) return
    const { error } = await deleteLot(deleting.id)
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Lote excluído! 🗑️', description: 'Registro arquivado (soft delete).' })
    setDeleting(null)
  }

  const filteredLots = lots.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (selectedLot) {
    const lotWeighings = weighings.filter((w) => w.lotId === selectedLot.id)
    const lotMortality = mortality.filter((m) => m.lotId === selectedLot.id)
    const lotExpenses = expenses.filter((e) => e.lotId === selectedLot.id)
    const lotSales = sales.filter((s) => s.lotId === selectedLot.id)

    const totalExp = lotExpenses.reduce((acc, e) => acc + e.totalValue, 0)
    const totalRev = lotSales.reduce((acc, s) => acc + s.totalPrice, 0)
    const lotCosts = computeLotCosts(selectedLot, expenses, sales)

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedLot(null)}
            className="rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Lotes
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span>{selectedLot.code}</span> • <span>{selectedLot.name}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedLot.breed} • Início: {selectedLot.startDate}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground">Aves Vivas</span>
              <p className="text-2xl font-bold text-foreground">
                {selectedLot.currentQuantity} / {selectedLot.initialQuantity}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground">Despesas Totais</span>
              <p className="text-2xl font-bold text-rose-600">R$ {totalExp.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground">Receitas Totais</span>
              <p className="text-2xl font-bold text-emerald-600">R$ {totalRev.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground">Resultado do Lote</span>
              <p
                className={`text-2xl font-bold ${totalRev - totalExp >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
              >
                R$ {(totalRev - totalExp).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-3">
              <span className="text-[11px] text-muted-foreground">Custo / Ave Alojada</span>
              <p className="text-lg font-bold text-amber-700">
                R$ {lotCosts.costPerBirdHoused.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-3">
              <span className="text-[11px] text-muted-foreground">Custo / Ave Vendida</span>
              <p className="text-lg font-bold text-amber-700">
                R$ {lotCosts.costPerBirdSold.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-3">
              <span className="text-[11px] text-muted-foreground">Custo / KG</span>
              <p className="text-lg font-bold text-amber-700">R$ {lotCosts.costPerKg.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-white border-border">
            <CardContent className="p-3">
              <span className="text-[11px] text-muted-foreground">ROI do Lote</span>
              <p
                className={`text-lg font-bold ${lotCosts.roi >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
              >
                {lotCosts.roi.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-border text-center">
            <span className="text-[11px] text-muted-foreground block">Custo Total</span>
            <span className="text-sm font-bold text-rose-600">
              R$ {lotCosts.totalCost.toFixed(2)}
            </span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-border text-center">
            <span className="text-[11px] text-muted-foreground block">Margem</span>
            <span
              className={`text-sm font-bold ${lotCosts.margin >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
            >
              {lotCosts.margin.toFixed(1)}%
            </span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-border text-center">
            <span className="text-[11px] text-muted-foreground block">Lucro</span>
            <span
              className={`text-sm font-bold ${lotCosts.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
            >
              R$ {lotCosts.profit.toFixed(2)}
            </span>
          </div>
        </div>

        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="bg-white border rounded-2xl p-1">
            <TabsTrigger value="resumo" className="rounded-xl text-xs">
              Resumo
            </TabsTrigger>
            <TabsTrigger value="pesagens" className="rounded-xl text-xs">
              Pesagens
            </TabsTrigger>
            <TabsTrigger value="mortalidade" className="rounded-xl text-xs">
              Mortalidade
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="rounded-xl text-xs">
              Despesas / Vendas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-4">
            <Card className="rounded-2xl bg-white border-border">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Atividade:</span>
                    <p className="font-bold text-foreground">
                      {activityName(selectedLot.activityId) || 'Sem atividade'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-bold text-foreground">{selectedLot.type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fornecedor:</span>
                    <p className="font-bold text-foreground">{selectedLot.supplier}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Custo de Aquisição:</span>
                    <p className="font-bold text-foreground">R$ {selectedLot.acquisitionCost}</p>
                  </div>
                </div>
                {selectedLot.notes && (
                  <div className="p-3 rounded-xl bg-secondary text-xs">
                    <span className="font-bold">Observações:</span> {selectedLot.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pesagens" className="mt-4">
            <Card className="rounded-2xl bg-white border-border p-4">
              {lotWeighings.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma pesagem registrada para este lote ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {lotWeighings.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 text-xs"
                    >
                      <span>Data: {w.date}</span>
                      <span>Amostra: {w.weighedCount} aves</span>
                      <span className="font-bold text-primary">
                        Peso Médio: {w.averageWeightKg} KG
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="mortalidade" className="mt-4">
            <Card className="rounded-2xl bg-white border-border p-4">
              {lotMortality.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma mortalidade registrada para este lote.
                </p>
              ) : (
                <div className="space-y-2">
                  {lotMortality.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-rose-50 text-xs text-rose-800"
                    >
                      <span>{m.date}</span>
                      <span className="font-bold">{m.quantity} aves</span>
                      <span>Causa: {m.cause}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="financeiro" className="mt-4">
            <Card className="rounded-2xl bg-white border-border p-4">
              <h3 className="text-xs font-bold mb-2">Histórico Financeiro do Lote</h3>
              <p className="text-xs text-muted-foreground">
                Despesas vinculadas: {lotExpenses.length} | Vendas vinculadas: {lotSales.length}
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => openEdit(selectedLot)}
            className="rounded-xl text-xs"
          >
            Editar Lote
          </Button>
          <Button
            variant="outline"
            className="rounded-xl text-xs text-rose-600"
            onClick={() => setDeleting(selectedLot)}
          >
            Excluir Lote
          </Button>
        </div>

        {/* Edit dialog (shared with list) */}
        <EditLotDialog
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v)
            if (!v) setEditing(null)
          }}
          editing={editing}
          editForm={editForm}
          setEditForm={setEditForm}
          onSubmit={handleEditSubmit}
          activities={activities}
        />

        <DeleteConfirmDialog
          open={!!deleting}
          onOpenChange={(v) => !v && setDeleting(null)}
          onConfirm={handleDelete}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" /> Lotes de Aves
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie os lotes de poedeiras, frangos de corte e pintinhos da propriedade.
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-2">
              <Plus className="w-4 h-4" /> Novo Lote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Cadastrar Novo Lote</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Nome do Lote</Label>
                <Input
                  placeholder="Ex: Lote Caipira 02"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Atividade *</Label>
                {activities.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground p-2 rounded-xl bg-secondary border border-border">
                    Nenhuma atividade cadastrada.{' '}
                    <Link to="/atividades" className="text-primary font-semibold underline">
                      Cadastre uma atividade primeiro.
                    </Link>
                  </div>
                ) : (
                  <Select value={activityId} onValueChange={setActivityId} required>
                    <SelectTrigger className="h-10 text-xs rounded-xl">
                      <SelectValue placeholder="Selecionar atividade" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((a) => (
                        <SelectItem key={a.id} value={a.id} className="text-xs">
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={type} onValueChange={(v) => setType(v as LotType)}>
                    <SelectTrigger className="h-10 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Qtd Inicial</Label>
                  <Input
                    type="number"
                    value={initialQuantity}
                    onChange={(e) => setInitialQuantity(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs">Custo Aquisição (R$)</Label>
                  <Input
                    type="number"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white mt-2"
              >
                Criar Lote ✨
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Buscar lote por nome ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-10 rounded-2xl bg-white border-border text-xs"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredLots.length === 0 && (
          <Card className="rounded-3xl bg-white border-border shadow-subtle col-span-full">
            <CardContent className="p-8 text-center">
              <Layers className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhum lote cadastrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em "Novo Lote" para começar.
              </p>
            </CardContent>
          </Card>
        )}
        {filteredLots.map((lot) => (
          <Card
            key={lot.id}
            onClick={() => setSelectedLot(lot)}
            className="rounded-3xl bg-white border-border shadow-subtle hover:shadow-elevation transition-all cursor-pointer group"
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-xl bg-primary/10">
                  {lot.code}
                </span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                    {lot.status}
                  </Badge>
                  <RecordActionMenu
                    onView={() => setDetails(lot)}
                    onEdit={canEdit ? () => openEdit(lot) : undefined}
                    onDelete={canDelete ? () => setDeleting(lot) : undefined}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                  {lot.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lot.type} • {lot.breed}
                </p>
                {activityName(lot.activityId) && (
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {activityName(lot.activityId)}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Quantidade Viva</span>
                  <span className="font-bold text-foreground">
                    {lot.currentQuantity} / {lot.initialQuantity}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Data de Início</span>
                  <span className="font-bold text-foreground">{lot.startDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EditLotDialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v)
          if (!v) setEditing(null)
        }}
        editing={editing}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleEditSubmit}
        activities={activities}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={handleDelete}
      />
      <RecordDetailsDialog
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
        title={`Lote — ${details?.code || ''} ${details?.name ? '• ' + details.name : ''}`}
        badge={
          details
            ? { label: details.status, className: 'bg-emerald-100 text-emerald-800 text-[10px]' }
            : null
        }
        rows={
          details
            ? [
                { label: 'Código', value: details.code },
                { label: 'Nome', value: details.name },
                { label: 'Atividade', value: activityName(details.activityId) || 'Sem atividade' },
                { label: 'Tipo', value: details.type },
                { label: 'Raça', value: details.breed },
                { label: 'Data de início', value: details.startDate },
                { label: 'Origem', value: details.origin },
                { label: 'Fornecedor', value: details.supplier },
                { label: 'Qtd. inicial', value: details.initialQuantity },
                { label: 'Qtd. viva', value: details.currentQuantity },
                { label: 'Custo de aquisição (R$)', value: details.acquisitionCost },
                { label: 'Finalidade', value: details.purpose },
                { label: 'Status', value: details.status },
                { label: 'Observações', value: details.notes },
              ]
            : []
        }
      />
    </div>
  )
}

function EditLotDialog({
  open,
  onOpenChange,
  editing,
  editForm,
  setEditForm,
  onSubmit,
  activities,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Lot | null
  editForm: any
  setEditForm: (f: any) => void
  onSubmit: (e: React.FormEvent) => void
  activities: { id: string; name: string }[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editing ? `Editar Lote ${editing.code}` : 'Editar Lote'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Nome do Lote</Label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>
          <div>
            <Label className="text-xs">Atividade *</Label>
            {activities.length === 0 ? (
              <div className="text-[11px] text-muted-foreground p-2 rounded-xl bg-secondary border border-border">
                Nenhuma atividade cadastrada.{' '}
                <Link to="/atividades" className="text-primary font-semibold underline">
                  Cadastre uma atividade primeiro.
                </Link>
              </div>
            ) : (
              <Select
                value={editForm.activityId}
                onValueChange={(v) => setEditForm({ ...editForm, activityId: v })}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Sem atividade" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select
                value={editForm.type}
                onValueChange={(v) => setEditForm({ ...editForm, type: v as LotType })}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v as LotStatus })}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data de Início</Label>
              <Input
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Raça</Label>
              <Input
                value={editForm.breed}
                onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Origem</Label>
              <Input
                value={editForm.origin}
                onChange={(e) => setEditForm({ ...editForm, origin: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Fornecedor</Label>
              <Input
                value={editForm.supplier}
                onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Qtd Inicial</Label>
              <Input
                type="number"
                value={editForm.initialQuantity}
                onChange={(e) => setEditForm({ ...editForm, initialQuantity: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Custo Aquisição (R$)</Label>
              <Input
                type="number"
                value={editForm.acquisitionCost}
                onChange={(e) => setEditForm({ ...editForm, acquisitionCost: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Finalidade</Label>
            <Input
              value={editForm.purpose}
              onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
              className="h-10 text-xs rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="text-xs rounded-xl"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
          >
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
