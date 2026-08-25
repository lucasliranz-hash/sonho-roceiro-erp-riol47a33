import { useFarmStore } from '@/hooks/use-farm-store'
import { useDashboardData } from '@/hooks/use-dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Clock, AlertCircle, Syringe, Package } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

export default function Alertas() {
  const { alerts, markAlertAsRead } = useFarmStore()
  const { attentionAlerts } = useDashboardData()

  const consolidatedAlerts = useMemo(() => {
    const live = (attentionAlerts || []).map((att) => ({
      id: att.id,
      title:
        att.severity === 'critical'
          ? att.message.includes('VENCIDO')
            ? '🚨 Produto Vencido'
            : '⚠️ Alerta Crítico'
          : att.severity === 'warning'
            ? att.message.includes('validade')
              ? '⏳ Validade Próxima'
              : '⚠️ Aviso Importante'
            : 'ℹ️ Notificação',
      description: att.message,
      type: att.type,
      severity: att.severity,
      date: new Date().toISOString().split('T')[0],
      isRead: false,
      link: att.link || '/estoque',
      isLive: true,
    }))

    const stored = (alerts || []).map((a) => ({
      ...a,
      severity: 'warning' as const,
      link: a.modulePath || '/estoque',
      isLive: false,
    }))

    const existingIds = new Set(live.map((l) => l.id))
    const dedupedStored = stored.filter((s) => !existingIds.has(s.id))

    return [...live, ...dedupedStored]
  }, [attentionAlerts, alerts])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-600" /> Central de Alertas
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitoramento em tempo real de produtos vencidos, estoques críticos, vacinações e
          pesagens.
        </p>
      </div>

      <div className="space-y-3">
        {consolidatedAlerts.length === 0 && (
          <Card className="p-8 text-center rounded-3xl bg-white border-border">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-sm text-foreground">Tudo em dia!</p>
            <p className="text-xs text-muted-foreground mt-1">Nenhum alerta pendente no momento.</p>
          </Card>
        )}

        {consolidatedAlerts.map((a) => {
          const isExpired = a.description.includes('VENCIDO')
          const isCritical = a.severity === 'critical'

          return (
            <Card
              key={a.id}
              className={`p-4 rounded-2xl bg-white border-border flex items-center justify-between text-xs transition-all ${
                isExpired
                  ? 'border-rose-400 bg-rose-50/30'
                  : isCritical
                    ? 'border-amber-400 bg-amber-50/20'
                    : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      isExpired
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : isCritical
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {a.title}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{a.date}</span>
                </div>
                <p className="font-semibold text-foreground">{a.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {a.link && (
                  <Link to={a.link}>
                    <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-xl">
                      Ver no Módulo
                    </Button>
                  </Link>
                )}

                {!a.isLive && (
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
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
