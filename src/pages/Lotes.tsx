import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Layers,
  Plus,
  Search,
  Calendar,
  Bird,
  Scale,
  Skull,
  DollarSign,
  ArrowLeft,
} from 'lucide-react'
import { Lot, LotType } from '@/types/farm'
import { toast } from '@/hooks/use-toast'

export default function Lotes() {
  const { lots, addLot, weighings, mortality, expenses, sales } = useFarmStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // New lot form states
  const [name, setName] = useState('')
  const [type, setType] = useState<LotType>('Poedeiras')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [origin, setOrigin] = useState('Incubação Própria')
  const [supplier, setSupplier] = useState('Sítio Sonho Roceiro')
  const [breed, setBreed] = useState('Caipira')
  const [initialQuantity, setInitialQuantity] = useState('100')
  const [acquisitionCost, setAcquisitionCost] = useState('500')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    addLot({
      name,
      type,
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={type} onValueChange={(v) => setType(v as LotType)}>
                    <SelectTrigger className="h-10 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Poedeiras">Poedeiras</SelectItem>
                      <SelectItem value="Frango de corte">Frango de Corte</SelectItem>
                      <SelectItem value="Frango caipira">Frango Caipira</SelectItem>
                      <SelectItem value="Pintinhos">Pintinhos</SelectItem>
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
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                  {lot.status}
                </Badge>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                  {lot.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lot.type} • {lot.breed}
                </p>
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
    </div>
  )
}
