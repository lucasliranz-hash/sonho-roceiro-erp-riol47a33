import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Plus, DollarSign, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Estrutura() {
  const { structures, addStructure } = useFarmStore()

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState<any>('Madeira')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('unid')
  const [unitValue, setUnitValue] = useState('')
  const [supplier, setSupplier] = useState('')

  const totalInvested = structures.reduce((acc, s) => acc + s.totalValue, 0)
  const totalPaid = structures.filter((s) => s.isPaid).reduce((acc, s) => acc + s.totalValue, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addStructure({
      date,
      category,
      description: description || `Investimento em ${category}`,
      quantity: Number(quantity) || 1,
      unit,
      unitValue: Number(unitValue) || 0,
      supplier: supplier || 'Fornecedor Local',
      paymentMethod: 'Pix',
      isPaid: true,
      center: 'Galinheiro Principal',
    })
    toast({
      title: 'Investimento Registrado! 🏗️',
      description: 'Custo de estrutura adicionado ao CAPEX.',
    })
    setDescription('')
    setUnitValue('')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" /> Implantação e Estrutura (CAPEX)
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Controle de investimentos para construção, telhado, telas e melhorias da propriedade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Total Investido na Estrutura</span>
            <p className="text-2xl font-extrabold text-primary">R$ {totalInvested.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Total Pago</span>
            <p className="text-2xl font-extrabold text-emerald-700">R$ {totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Pendente</span>
            <p className="text-2xl font-extrabold text-amber-600">
              R$ {(totalInvested - totalPaid).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
          <h2 className="text-base font-bold mb-3">Lançar Custo de Estrutura</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
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
              <Label className="text-xs">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Madeira">Madeira / Eucalipto</SelectItem>
                  <SelectItem value="Telhado">Telhado / Telhas</SelectItem>
                  <SelectItem value="Tela">Tela de Proteção</SelectItem>
                  <SelectItem value="Bebedouros">Bebedouros / Comedouros</SelectItem>
                  <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                  <SelectItem value="Mão de obra">Mão de Obra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Descrição do Item</Label>
              <Input
                placeholder="Ex: Telhas onduladas de 2.4m"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Quantidade</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Valor Unitário (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={unitValue}
                  onChange={(e) => setUnitValue(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              Salvar Investimento ✨
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2 rounded-3xl bg-white border-border shadow-subtle p-5">
          <h2 className="text-base font-bold mb-3">Histórico de Estrutura</h2>
          <div className="space-y-2">
            {structures.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-foreground">{s.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.category} • {s.quantity} {s.unit} x R$ {s.unitValue}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-primary">R$ {s.totalValue.toFixed(2)}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                    <CheckCircle className="w-3 h-3" /> Pago
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
