import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export default function Alertas() {
  const { alerts, markAlertAsRead } = useFarmStore()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-600" /> Central de Alertas
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Avisos do sistema para lembretes de ovoscopia, estoque baixo e vacinação.
        </p>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => (
          <Card
            key={a.id}
            className={`p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs ${!a.isRead ? 'border-amber-400 bg-amber-50/20' : ''}`}
          >
            <div>
              <p className="font-bold text-sm text-foreground">{a.title}</p>
              <p className="text-muted-foreground">{a.description}</p>
              <span className="text-[10px] text-muted-foreground mt-1 block">{a.date}</span>
            </div>
            <div>
              {!a.isRead ? (
                <Button
                  size="sm"
                  onClick={() => markAlertAsRead(a.id)}
                  className="h-8 text-[11px] rounded-xl bg-primary text-white"
                >
                  Marcar como Lido
                </Button>
              ) : (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Lido
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
