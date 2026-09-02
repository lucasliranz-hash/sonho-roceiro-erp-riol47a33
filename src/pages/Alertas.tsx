import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlertsManager } from '@/hooks/use-alerts-manager'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Syringe,
  Package,
  Layers,
  Flame,
  Scale,
  DollarSign,
  TrendingDown,
  CheckCheck,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  Building,
  Info,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AlertStatus, FarmAlert } from '@/types/farm'

type FilterTab = 'pendentes' | 'todos' | 'lidos'

export default function Alertas() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterTab>('pendentes')

  const {
    allAlerts,
    pendingAlerts,
    readAlerts,
    unreadCount,
    markAlertAsRead,
    markAlertAsUnread,
    dismissAlert,
    markAllAlertsAsRead,
    dismissAllAlerts,
    handleClickAlert,
  } = useAlertsManager()

  // Lista filtrada de acordo com a aba selecionada
  const displayedAlerts = useMemo(() => {
    if (filter === 'pendentes') {
      return pendingAlerts
    }
    if (filter === 'lidos') {
      return readAlerts
    }
    // Todos: exibe todos (não dispensados ou até dispensados se houver histórico)
    return allAlerts.filter((a) => a.status !== 'dispensado')
  }, [filter, pendingAlerts, readAlerts, allAlerts])

  const handleAlertNavigate = async (alert: FarmAlert) => {
    // 1. Marcar como lido e remover de pendentes
    await handleClickAlert(alert)
    // 2. Navegar para a rota correspondente
    if (alert.modulePath) {
      navigate(alert.modulePath)
    }
  }

  const getAlertIcon = (type: string, severity: string) => {
    if (type === 'sanidade') return <Syringe className="w-5 h-5 text-emerald-600" />
    if (type === 'estoque') return <Package className="w-5 h-5 text-amber-600" />
    if (type === 'incubacao' || type === 'chocadeira')
      return <Flame className="w-5 h-5 text-orange-600" />
    if (type === 'pesagem') return <Scale className="w-5 h-5 text-blue-600" />
    if (type === 'despesa' || type === 'financeiro')
      return <DollarSign className="w-5 h-5 text-rose-600" />
    if (type === 'mortalidade') return <TrendingDown className="w-5 h-5 text-rose-600" />
    if (severity === 'critical') return <AlertTriangle className="w-5 h-5 text-rose-600" />
    return <Info className="w-5 h-5 text-primary" />
  }

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'lido':
        return (
          <Badge
            variant="outline"
            className="text-[11px] bg-slate-100 text-slate-700 border-slate-200"
          >
            <CheckCircle className="w-3 h-3 mr-1 text-slate-500" /> Lido
          </Badge>
        )
      case 'dispensado':
        return (
          <Badge
            variant="outline"
            className="text-[11px] bg-zinc-100 text-zinc-600 border-zinc-200"
          >
            Dispensado
          </Badge>
        )
      case 'nao_lido':
      default:
        return (
          <Badge className="text-[11px] bg-amber-500 hover:bg-amber-600 text-white border-transparent">
            <Clock className="w-3 h-3 mr-1" /> Não lido
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-3xl border border-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Central de Alertas
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-2.5 py-0.5 text-xs font-bold">
                {unreadCount} pendente{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Monitoramento operacional inteligente e ações recomendadas da granja.
          </p>
        </div>

        {/* Ações globais */}
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAlertsAsRead()}
              className="rounded-xl text-xs font-semibold h-9 gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              Marcar todos como lidos
            </Button>
          )}

          {displayedAlerts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => dismissAllAlerts()}
              className="rounded-xl text-xs font-semibold h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5"
              title="Dispensar todos os avisos atuais (não apaga registros do banco)"
            >
              <Trash2 className="w-4 h-4" />
              Limpar avisos
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Filtros: [ Pendentes ] [ Todos ] [ Lidos ] */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Button
          variant={filter === 'pendentes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pendentes')}
          className={cn(
            'rounded-xl text-xs font-semibold h-8.5 gap-1.5',
            filter === 'pendentes' ? 'bg-primary text-white' : 'bg-white text-muted-foreground',
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          Pendentes
          {pendingAlerts.length > 0 && (
            <span
              className={cn(
                'ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold',
                filter === 'pendentes' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800',
              )}
            >
              {pendingAlerts.length}
            </span>
          )}
        </Button>

        <Button
          variant={filter === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('todos')}
          className={cn(
            'rounded-xl text-xs font-semibold h-8.5 gap-1.5',
            filter === 'todos' ? 'bg-primary text-white' : 'bg-white text-muted-foreground',
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Todos
          <span
            className={cn(
              'ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold',
              filter === 'todos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700',
            )}
          >
            {allAlerts.filter((a) => a.status !== 'dispensado').length}
          </span>
        </Button>

        <Button
          variant={filter === 'lidos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('lidos')}
          className={cn(
            'rounded-xl text-xs font-semibold h-8.5 gap-1.5',
            filter === 'lidos' ? 'bg-primary text-white' : 'bg-white text-muted-foreground',
          )}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Lidos
          {readAlerts.length > 0 && (
            <span
              className={cn(
                'ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold',
                filter === 'lidos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700',
              )}
            >
              {readAlerts.length}
            </span>
          )}
        </Button>
      </div>

      {/* Lista de Alertas */}
      {displayedAlerts.length === 0 ? (
        <Card className="rounded-3xl bg-white border-border shadow-subtle">
          <CardContent className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {filter === 'pendentes'
                ? 'Nenhum alerta pendente no momento!'
                : filter === 'lidos'
                  ? 'Nenhum alerta lido arquivado.'
                  : 'Nenhum aviso no sistema.'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {filter === 'pendentes'
                ? 'Tudo em ordem na sua granja. O sistema monitora estoque, sanidade, pesagens e prazos continuamente.'
                : 'Quando condições forem detectadas ou lidas, você poderá consultá-las nesta central.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedAlerts.map((a) => {
            const isCritical = a.severity === 'critical'
            const isUnread = a.status === 'nao_lido' || !a.isRead

            return (
              <Card
                key={a.id}
                className={cn(
                  'rounded-2xl bg-white border transition-all duration-200 overflow-hidden',
                  isUnread
                    ? isCritical
                      ? 'border-rose-300 shadow-sm ring-1 ring-rose-200/50'
                      : 'border-amber-200 shadow-sm ring-1 ring-amber-100'
                    : 'border-border opacity-85 hover:opacity-100',
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Informações principais */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5',
                          isCritical
                            ? 'bg-rose-100 text-rose-700'
                            : a.severity === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700',
                        )}
                      >
                        {getAlertIcon(a.type, a.severity)}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Linha superior de badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider',
                              isCritical
                                ? 'bg-rose-100 text-rose-900 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200',
                            )}
                          >
                            {a.type || 'Operacional'}
                          </Badge>

                          {getStatusBadge(a.status)}

                          {a.propertyName && (
                            <span className="inline-flex items-center text-[11px] text-muted-foreground gap-1">
                              <Building className="w-3 h-3" />
                              {a.propertyName}
                            </span>
                          )}

                          <span className="inline-flex items-center text-[11px] text-muted-foreground gap-1">
                            <Calendar className="w-3 h-3" />
                            {a.date || a.created_at?.split('T')[0]}
                          </span>
                        </div>

                        {/* Título e Descrição */}
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                          {a.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-normal">
                          {a.description}
                        </p>

                        {/* Metadados detalhados: Origem, Referência, Data de Leitura */}
                        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground border-t border-border/40 mt-2">
                          {a.origin && (
                            <span>
                              <strong className="text-foreground/70">Origem:</strong> {a.origin}
                            </span>
                          )}
                          {a.related_entity_type && (
                            <span>
                              <strong className="text-foreground/70">Referência:</strong>{' '}
                              {a.related_entity_type}{' '}
                              {a.related_entity_id ? `(#${a.related_entity_id.slice(0, 8)})` : ''}
                            </span>
                          )}
                          {a.read_at && (
                            <span>
                              <strong className="text-foreground/70">Lido em:</strong>{' '}
                              {new Date(a.read_at).toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                      {a.modulePath && (
                        <Button
                          size="sm"
                          onClick={() => handleAlertNavigate(a)}
                          className="rounded-xl text-xs font-bold h-8.5 bg-primary hover:bg-primary/90 text-white gap-1 w-full md:w-auto"
                        >
                          Ver & Tratar
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      <div className="flex items-center gap-1.5">
                        {isUnread ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAlertAsRead(a.id, a)}
                            className="rounded-xl text-[11px] h-8 text-emerald-700 hover:bg-emerald-50 border-emerald-200 gap-1"
                            title="Marcar como lido"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Lido
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAlertAsUnread(a.id, a)}
                            className="rounded-xl text-[11px] h-8 text-slate-700 hover:bg-slate-50 border-slate-200 gap-1"
                            title="Marcar como não lido"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            Não lido
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissAlert(a.id, a)}
                          className="rounded-xl text-[11px] h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-2.5"
                          title="Dispensar aviso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sr-only">Dispensar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
