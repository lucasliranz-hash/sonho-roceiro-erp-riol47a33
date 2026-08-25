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
import { logAudit } from '@/services/audit'
import { PackagePlus, Sparkles, Syringe, Pill, Info } from 'lucide-react'
import { InventoryItem } from '@/types/farm'

const SANITARY_CATEGORIES = [
  'Vacinas',
  'Medicamentos',
  'Suplementos',
  'Vermífugos',
  'Outros produtos sanitários',
]

const STANDARD_CATEGORIES = [
  'Ração',
  'Milho',
  'Farelos',
  'Vacinas',
  'Medicamentos',
  'Suplementos',
  'Vermífugos',
  'Outros produtos sanitários',
  'Maravalha',
  'Embalagens',
  'Insumos',
  'Outros',
]

const PACKAGING_TYPES = [
  'Frasco',
  'Caixa',
  'Bisnaga',
  'Ampola',
  'Seringa',
  'Envelope',
  'Balde',
  'Saco',
  'Outro',
]

const CONSUMPTION_UNITS = [
  'dose',
  'mL',
  'L',
  'mg',
  'g',
  'comprimido',
  'cápsula',
  'unidade',
  'outra',
]

interface NovoItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem?: InventoryItem | null
}

export function NovoItemDialog({ open, onOpenChange, editingItem }: NovoItemDialogProps) {
  const { addInventoryItem, updateInventory } = useFarmStore()

  // Base state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Vacinas')
  const [brand, setBrand] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [minStock, setMinStock] = useState('10')

  // Standard items state
  const [unit, setUnit] = useState('KG')
  const [currentStock, setCurrentStock] = useState('0')
  const [averageCost, setAverageCost] = useState('0')
  const [packageWeight, setPackageWeight] = useState('')

  // Sanitary specialized fields
  const [packagingType, setPackagingType] = useState('Frasco')
  const [contentPerPackage, setContentPerPackage] = useState('100')
  const [consumptionUnit, setConsumptionUnit] = useState('dose')
  const [customUnit, setCustomUnit] = useState('')
  const [initialPackageQty, setInitialPackageQty] = useState('1')
  const [valuePerPackage, setValuePerPackage] = useState('65')
  const [manufacturerBatch, setManufacturerBatch] = useState('')
  const [manufacturingDate, setManufacturingDate] = useState('')
  const [expirationDate, setExpirationDate] = useState('')

  const isSanitary = SANITARY_CATEGORIES.includes(category)
  const isEditing = Boolean(editingItem)

  // Derived unit for display
  const effectiveConsumptionUnit =
    consumptionUnit === 'outra' ? customUnit || 'un' : consumptionUnit

  // Calculations for sanitary items
  const calcTotalQty = (Number(initialPackageQty) || 0) * (Number(contentPerPackage) || 0)
  const calcTotalValue = (Number(initialPackageQty) || 0) * (Number(valuePerPackage) || 0)
  const calcUnitCost = calcTotalQty > 0 ? calcTotalValue / calcTotalQty : 0

  const resetForm = () => {
    if (editingItem) {
      setName(editingItem.name || '')
      setCategory(editingItem.category || 'Vacinas')
      setBrand(editingItem.brand || '')
      setSupplier(editingItem.supplier || '')
      setNotes(editingItem.notes || '')
      setMinStock(String(editingItem.minStock ?? '10'))
      setUnit(editingItem.unit || 'KG')
      setCurrentStock(String(editingItem.currentStock ?? '0'))
      setAverageCost(String(editingItem.averageCost ?? '0'))
      setPackageWeight(editingItem.packageWeight ? String(editingItem.packageWeight) : '')
      setPackagingType(editingItem.packaging_type || 'Frasco')
      setContentPerPackage(
        editingItem.content_per_package ? String(editingItem.content_per_package) : '100',
      )
      setConsumptionUnit(editingItem.consumption_unit || 'dose')
      setCustomUnit(editingItem.custom_unit || '')
      setManufacturerBatch(editingItem.manufacturer_batch || '')
      setManufacturingDate(editingItem.manufacturing_date || '')
      setExpirationDate(editingItem.expiration_date || '')
      setInitialPackageQty('1')
      setValuePerPackage('0')
    } else {
      setName('')
      setCategory('Vacinas')
      setBrand('')
      setSupplier('')
      setNotes('')
      setMinStock('10')
      setUnit('KG')
      setCurrentStock('0')
      setAverageCost('0')
      setPackageWeight('')
      setPackagingType('Frasco')
      setContentPerPackage('100')
      setConsumptionUnit('dose')
      setCustomUnit('')
      setInitialPackageQty('1')
      setValuePerPackage('65')
      setManufacturerBatch('')
      setManufacturingDate('')
      setExpirationDate('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Preencha o nome do item', variant: 'destructive' })
      return
    }

    if (isSanitary) {
      const content = Number(contentPerPackage) || 1
      const effectiveUnit =
        consumptionUnit === 'outra' ? customUnit.trim() || 'un' : consumptionUnit
      const finalMinStock = Number(minStock) || 0

      if (isEditing && editingItem) {
        const payload: Partial<InventoryItem> = {
          name: name.trim(),
          category,
          unit: effectiveUnit,
          brand: brand.trim() || undefined,
          supplier: supplier.trim() || undefined,
          minStock: finalMinStock,
          notes: notes.trim() || undefined,
          packaging_type: packagingType,
          content_per_package: content,
          consumption_unit: consumptionUnit,
          custom_unit: customUnit.trim() || undefined,
          manufacturer_batch: manufacturerBatch.trim() || undefined,
          manufacturing_date: manufacturingDate || undefined,
          expiration_date: expirationDate || undefined,
          lastUpdated: new Date().toISOString().split('T')[0],
        }

        const { error } = await updateInventory(editingItem.id, payload)
        if (error) {
          toast({
            title: 'Erro ao atualizar item',
            description: error.message,
            variant: 'destructive',
          })
          return
        }
        await logAudit(
          'UPDATE',
          'farm_inventory',
          editingItem.id,
          editingItem as any,
          payload as any,
        )
        toast({ title: 'Item atualizado com sucesso! ✅' })
      } else {
        // Novo item sanitário com cálculo automático
        const totalQty = calcTotalQty
        const unitCost = calcUnitCost

        const payload: Omit<InventoryItem, 'id' | 'lastUpdated'> = {
          name: name.trim(),
          category,
          unit: effectiveUnit,
          currentStock: totalQty,
          minStock: finalMinStock,
          averageCost: Number(unitCost.toFixed(4)),
          brand: brand.trim() || undefined,
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
          packaging_type: packagingType,
          content_per_package: content,
          consumption_unit: consumptionUnit,
          custom_unit: customUnit.trim() || undefined,
          manufacturer_batch: manufacturerBatch.trim() || undefined,
          manufacturing_date: manufacturingDate || undefined,
          expiration_date: expirationDate || undefined,
        }

        const { error } = await addInventoryItem(payload)
        if (error) {
          toast({
            title: 'Erro ao salvar item',
            description: error.message,
            variant: 'destructive',
          })
          return
        }
        await logAudit('INSERT', 'farm_inventory', 'new', null, payload as any)
        toast({
          title: 'Produto sanitário cadastrado! ✨',
          description: `Estoque: ${totalQty} ${effectiveUnit} a R$ ${unitCost.toFixed(2)}/${effectiveUnit}`,
        })
      }
    } else {
      // Itens comuns (Ração, Farelos, etc.)
      const finalUnit = unit
      const finalCurrentStock = Number(currentStock) || 0
      const finalMinStock = Number(minStock) || 0
      const finalAvgCost = Number(averageCost) || 0

      if (isEditing && editingItem) {
        const payload: Partial<InventoryItem> = {
          name: name.trim(),
          category,
          unit: finalUnit,
          currentStock: finalCurrentStock,
          minStock: finalMinStock,
          averageCost: finalAvgCost,
          brand: brand.trim() || undefined,
          supplier: supplier.trim() || undefined,
          packageWeight: Number(packageWeight) || undefined,
          notes: notes.trim() || undefined,
          lastUpdated: new Date().toISOString().split('T')[0],
        }

        const { error } = await updateInventory(editingItem.id, payload)
        if (error) {
          toast({
            title: 'Erro ao atualizar item',
            description: error.message,
            variant: 'destructive',
          })
          return
        }
        await logAudit(
          'UPDATE',
          'farm_inventory',
          editingItem.id,
          editingItem as any,
          payload as any,
        )
        toast({ title: 'Item atualizado com sucesso! ✅' })
      } else {
        const payload: Omit<InventoryItem, 'id' | 'lastUpdated'> = {
          name: name.trim(),
          category,
          unit: finalUnit,
          currentStock: finalCurrentStock,
          minStock: finalMinStock,
          averageCost: finalAvgCost,
          brand: brand.trim() || undefined,
          supplier: supplier.trim() || undefined,
          packageWeight: Number(packageWeight) || undefined,
          notes: notes.trim() || undefined,
        }

        const { error } = await addInventoryItem(payload)
        if (error) {
          toast({
            title: 'Erro ao salvar item',
            description: error.message,
            variant: 'destructive',
          })
          return
        }
        await logAudit('INSERT', 'farm_inventory', 'new', null, payload as any)
        toast({ title: 'Item adicionado com sucesso! ✅' })
      }
    }

    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {isSanitary ? (
              <Syringe className="w-5 h-5 text-emerald-600" />
            ) : (
              <PackagePlus className="w-5 h-5 text-primary" />
            )}
            {isEditing
              ? `Editar Item — ${editingItem?.name}`
              : isSanitary
                ? 'Novo Produto Sanitário / Vacina'
                : 'Novo Item de Estoque'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Categoria */}
          <div>
            <Label className="text-xs">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STANDARD_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome do Item */}
          <div>
            <Label className="text-xs">Nome do Item *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                isSanitary
                  ? 'Ex: Newcastle La Sota, Enrofloxacino 10%, Vitamínico ADE'
                  : 'Ex: Ração Inicial Pintainhas, Milho Moído'
              }
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          {/* ======================================================== */}
          {/* CAMPOS ESPECÍFICOS PARA VACINAS E PRODUTOS SANITÁRIOS   */}
          {/* ======================================================== */}
          {isSanitary ? (
            <div className="space-y-3.5 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Especificações de Embalagem e Dosagem
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo de Embalagem</Label>
                  <Select value={packagingType} onValueChange={setPackagingType}>
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKAGING_TYPES.map((pt) => (
                        <SelectItem key={pt} value={pt}>
                          {pt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Unidade de Consumo</Label>
                  <Select value={consumptionUnit} onValueChange={setConsumptionUnit}>
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSUMPTION_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {consumptionUnit === 'outra' && (
                <div>
                  <Label className="text-xs">Especifique a Unidade Personalizada</Label>
                  <Input
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="Ex: pipeta, sachê"
                    className="h-10 text-xs rounded-xl bg-white"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Conteúdo por {packagingType} *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={contentPerPackage}
                    onChange={(e) => setContentPerPackage(e.target.value)}
                    placeholder="Ex: 100"
                    className="h-10 text-xs rounded-xl bg-white"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    ex: 100 {effectiveConsumptionUnit}s / {packagingType.toLowerCase()}
                  </span>
                </div>

                <div>
                  <Label className="text-xs">Estoque Mínimo ({effectiveConsumptionUnit})</Label>
                  <Input
                    type="number"
                    step="any"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    placeholder="Ex: 20"
                    className="h-10 text-xs rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* Rastreabilidade e Validade */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-200/40">
                <div>
                  <Label className="text-xs">Lote Fabricante</Label>
                  <Input
                    value={manufacturerBatch}
                    onChange={(e) => setManufacturerBatch(e.target.value)}
                    placeholder="Ex: LOTE-894"
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs">Fabricação</Label>
                  <Input
                    type="date"
                    value={manufacturingDate}
                    onChange={(e) => setManufacturingDate(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs">Validade</Label>
                  <Input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* Se for criação, permite entrada inicial calculada */}
              {!isEditing && (
                <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-300/60 space-y-2">
                  <span className="text-xs font-bold text-emerald-950 block">
                    Entrada Inicial no Cadastro
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-emerald-900">Qtd de {packagingType}s</Label>
                      <Input
                        type="number"
                        step="any"
                        value={initialPackageQty}
                        onChange={(e) => setInitialPackageQty(e.target.value)}
                        placeholder="Ex: 1"
                        className="h-9 text-xs rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-emerald-900">
                        Valor por {packagingType} (R$)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={valuePerPackage}
                        onChange={(e) => setValuePerPackage(e.target.value)}
                        placeholder="Ex: 65.00"
                        className="h-9 text-xs rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-emerald-800 block">
                        Estoque Inicial Total:
                      </span>
                      <strong className="text-emerald-950 text-sm">
                        {calcTotalQty} {effectiveConsumptionUnit}s
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-emerald-800 block">Custo Unitário:</span>
                      <strong className="text-emerald-950 text-sm">
                        R$ {calcUnitCost.toFixed(4)} / {effectiveConsumptionUnit}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* CAMPOS PADRÃO (RAÇÃO, GRÃOS, ETC.)                       */
            /* ======================================================== */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Unidade *</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="h-10 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="saco">Saco</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="unid">Unidade</SelectItem>
                      <SelectItem value="ton">Tonelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Peso da Embalagem (KG opcional)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(e.target.value)}
                    placeholder="Ex: 50 (saco de 50kg)"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Estoque Atual ({unit})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Estoque Mínimo ({unit})</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Custo Médio (R$/un)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={averageCost}
                    onChange={(e) => setAverageCost(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Fornecedor e Marca */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Fornecedor</Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Ex: Agropecuária Central"
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Marca / Fabricante</Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Biovet, Zoetis, Campestre"
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Armazenamento refrigerado de 2°C a 8°C, etc."
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-xs font-bold rounded-xl bg-primary text-white mt-2"
          >
            {isEditing ? 'Salvar Alterações' : 'Salvar Item ✨'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
