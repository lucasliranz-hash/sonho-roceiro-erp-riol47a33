import { useState } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { Card, CardContent } from '@/components/ui/card'
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
import { Truck, Plus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Asset } from '@/types/farm'

export default function Patrimonio() {
  const { assets, addAsset, structures } = useFarmStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Asset['category']>('Equipamentos')
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0])
  const [value, setValue] = useState('')
  const [usefulLifeYears, setUsefulLifeYears] = useState('5')
  const [condition, setCondition] = useState<Asset['condition']>('Bom')
  const [location, setLocation] = useState('')

  const totalAssetsValue = assets.reduce((acc, a) => acc + a.value, 0)
  const totalStructures = structures.reduce((acc, s) => acc + s.totalValue, 0)
  const grandTotal = totalAssetsValue + totalStructures

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const newAsset: Asset = {
      id: `ast-${Date.now()}`,
      name,
      category,
      acquisitionDate,
      value: Number(value) || 0,
      usefulLifeYears: Number(usefulLifeYears) || 1,
      condition,
      location: location || 'Não especificado',
      status: 'Em uso',
    }
    addAsset(newAsset)
    toast({
      title: 'Patrimônio registrado! 🏗️',
      description: `${name} adicionado aos bens da propriedade.`,
    })
    setDialogOpen(false)
    setName('')
    setValue('')
    setLocation('')
  }

  const getDepreciation = (asset: Asset) => {
    const yearsElapsed =
      (Date.now() - new Date(asset.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
    const depPerYear = asset.usefulLifeYears > 0 ? asset.value / asset.usefulLifeYears : 0
    const accumulated = Math.min(depPerYear * yearsElapsed, asset.value)
    const netValue = Math.max(0, asset.value - accumulated)
    return { depPerYear, accumulated, netValue }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" /> Patrimônio e Bens
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Inventário de equipamentos, estruturas e investimentos da fazenda.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(!dialogOpen)}
          className="rounded-xl bg-primary text-white text-xs gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Bem
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Equipamentos e Bens</span>
            <p className="text-2xl font-extrabold text-primary">R$ {totalAssetsValue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Estruturas (CAPEX)</span>
            <p className="text-2xl font-extrabold text-primary">R$ {totalStructures.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-white border-border">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Patrimônio Total</span>
            <p className="text-2xl font-extrabold text-emerald-700">R$ {grandTotal.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {dialogOpen && (
        <Card className="rounded-3xl bg-white border-border shadow-subtle p-5">
          <h2 className="text-base font-bold mb-3">Registrar Novo Bem Patrimonial</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <Label className="text-xs">Descrição</Label>
              <Input
                placeholder="Ex: Chocadeira 120 ovos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Asset['category'])}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chocadeira">Chocadeira</SelectItem>
                    <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                    <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                    <SelectItem value="Estruturas">Estruturas</SelectItem>
                    <SelectItem value="Bombas">Bombas</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Data de Aquisição</Label>
                <Input
                  type="date"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Vida Útil (anos)</Label>
                <Input
                  type="number"
                  value={usefulLifeYears}
                  onChange={(e) => setUsefulLifeYears(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Estado de Conservação</Label>
                <Select
                  value={condition}
                  onValueChange={(v) => setCondition(v as Asset['condition'])}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excelente">Excelente</SelectItem>
                    <SelectItem value="Bom">Bom</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Necessita manutenção">Necessita manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Local</Label>
                <Input
                  placeholder="Ex: Galinheiro Principal"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
            >
              Adicionar Patrimônio ✨
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((ast) => {
          const dep = getDepreciation(ast)
          return (
            <Card key={ast.id} className="rounded-2xl bg-white border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-foreground">{ast.name}</p>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                  {ast.condition}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {ast.category} • {ast.location} • {ast.status}
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Valor</span>
                  <span className="font-bold text-foreground">R$ {ast.value.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Dep./ano</span>
                  <span className="font-bold text-amber-700">R$ {dep.depPerYear.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Valor líquido</span>
                  <span className="font-bold text-emerald-700">R$ {dep.netValue.toFixed(0)}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Vida útil: {ast.usefulLifeYears} anos • Aquisição: {ast.acquisitionDate}
              </p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
