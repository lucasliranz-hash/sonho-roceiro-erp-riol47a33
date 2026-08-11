import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Wheat, Scale, Skull, Egg, DollarSign, ShoppingCart, Flame, Package } from 'lucide-react'

interface QuickActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (action: string) => void
}

const shortcuts = [
  { type: 'racao', label: 'Ração', icon: Wheat, color: 'bg-amber-100 text-amber-800' },
  { type: 'pesagem', label: 'Pesagem', icon: Scale, color: 'bg-blue-100 text-blue-800' },
  { type: 'mortalidade', label: 'Mortalidade', icon: Skull, color: 'bg-rose-100 text-rose-800' },
  { type: 'ovos', label: 'Ovos', icon: Egg, color: 'bg-yellow-100 text-yellow-800' },
  { type: 'despesa', label: 'Despesa', icon: DollarSign, color: 'bg-emerald-100 text-emerald-800' },
  { type: 'venda', label: 'Venda', icon: ShoppingCart, color: 'bg-purple-100 text-purple-800' },
  { type: 'chocadeira', label: 'Chocadeira', icon: Flame, color: 'bg-orange-100 text-orange-800' },
  { type: 'estoque', label: 'Estoque', icon: Package, color: 'bg-teal-100 text-teal-800' },
]

export function QuickActionsSheet({ open, onOpenChange, onSelect }: QuickActionsSheetProps) {
  const handleSelect = (action: string) => {
    onOpenChange(false)
    onSelect(action)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-lg font-bold text-foreground">
            ⚡ Novo Lançamento Rápido
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            Escolha uma ação para registrar em segundos
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid grid-cols-4 gap-3 p-4 pb-8">
          {shortcuts.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.type}
                onClick={() => handleSelect(s.type)}
                className="flex flex-col items-center gap-2 p-2 rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">{s.label}</span>
              </button>
            )
          })}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
