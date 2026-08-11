import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { useFarmStore } from '@/hooks/use-farm-store'
import { toast } from '@/hooks/use-toast'

const PREDEFINED_CATEGORIES = [
  'Ração',
  'Grãos',
  'Suplementos',
  'Medicamentos',
  'Vacinas',
  'Higiene',
  'Cama/Maravalha',
  'Embalagens',
  'Material de manejo',
  'Outros',
]

export function NovoItemDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { addInventoryItem } = useFarmStore()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Ração')
  const [customCategory, setCustomCategory] = useState('')
  const [unit, setUnit] = useState('KG')
  const [initialStock, setInitialStock] = useState('0')
  const [minStock, setMinStock] = useState('0')
  const [unitValue, setUnitValue] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setName('')
    setCategory('Ração')
    setCustomCategory('')
    setUnit('KG')
    setInitialStock('0')
    setMinStock('0')
    setUnitValue('')
    setSupplier('')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const finalCategory = category === '__custom' ? customCategory : category
    const { error } = await addInventoryItem({
      name,
      category: finalCategory as any,
      unit,
      currentStock: Number(initialStock) || 0,
      minStock: Number(minStock) || 0,
      averageCost: Number(unitValue) || 0,
      supplier,
      notes,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Erro ❌', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Item cadastrado! 📦', description: `${name} adicionado ao estoque.` })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Cadastrar Novo Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Nome *</Label>
            <Input
              placeholder="Ex: Ração Inicial 40kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom" className="text-xs">
                    + Outra categoria...
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Unidade *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="unid">unid</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="saco">saco</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {category === '__custom' && (
            <div>
              <Label className="text-xs">Nova Categoria</Label>
              <Input
                placeholder="Digite o nome da categoria"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Qtd Inicial</Label>
              <Input
                type="number"
                step="0.1"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Estoque Mín</Label>
              <Input
                type="number"
                step="0.1"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Valor Unit (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Fornecedor (opcional)</Label>
            <Input
              placeholder="Nome do fornecedor"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs">Observação</Label>
            <Textarea
              placeholder="Notas sobre o item"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white"
          >
            {saving ? 'Salvando...' : 'Cadastrar Item 📦'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
