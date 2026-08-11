import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { ShoppingCart } from 'lucide-react'

export default function Vendas() {
  const { sales } = useFarmStore()

  const totalRev = sales.reduce((acc, s) => acc + s.totalPrice, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          🛒 Vendas de Ovos e Aves
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Histórico de comercialização para clientes da região.
        </p>
      </div>

      <Card className="p-4 rounded-2xl bg-white border-border">
        <span className="text-xs text-muted-foreground">Faturamento Acumulado</span>
        <p className="text-2xl font-extrabold text-emerald-700">R$ {totalRev.toFixed(2)}</p>
      </Card>

      <div className="space-y-2">
        {sales.map((s) => (
          <Card
            key={s.id}
            className="p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs"
          >
            <div>
              <p className="font-bold text-foreground">{s.customerName}</p>
              <p className="text-muted-foreground">
                {s.product} ({s.quantity} un) • {s.date}
              </p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-emerald-700 text-sm">
                R$ {s.totalPrice.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">{s.paymentMethod}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
