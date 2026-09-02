import { useMemo, useCallback } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { useAuth } from '@/hooks/use-auth'
import { FarmAlert, AlertStatus, AlertType } from '@/types/farm'

export interface ConditionAlertSpec {
  deduplicationKey: string
  type: AlertType | string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  origin: string
  related_entity_type?: string
  related_entity_id?: string
  condition_state: string
  modulePath: string
  propertyId?: string
  propertyName?: string
  date: string
}

function getTodayString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTomorrowString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getSevenDaysAgoString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Hook centralizado para gerenciar alertas do SR Gestão:
 * - Calcula condições ativas em tempo real a partir dos dados do farm store
 * - Reconcilia com os registros persistidos em `farm_alerts` no Supabase
 * - Garante deduplicação estável por condição (deduplication_key)
 * - Mantém o estado lido/dispensado/não lido sem recriar alertas dispensados ou lidos para a mesma condição
 * - Se a condição foi resolvida no passado e volta a acontecer, permite gerar novo alerta
 */
export function useAlertsManager() {
  const { currentProperty, organization, user } = useAuth()
  const propertyName = currentProperty?.name || organization?.name || 'Sua Propriedade'
  const propertyId = currentProperty?.id

  const {
    alerts,
    markAlertAsRead,
    markAlertAsUnread,
    dismissAlert,
    markAllAlertsAsRead,
    dismissAllAlerts,
    lots,
    expenses,
    inventory,
    feedLogs,
    weighings,
    mortality,
    incubations,
    vaccinations,
    treatments,
    protocolAssignments,
  } = useFarmStore()

  const todayStr = useMemo(() => getTodayString(), [])
  const tomorrowStr = useMemo(() => getTomorrowString(), [])
  const sevenDaysAgoStr = useMemo(() => getSevenDaysAgoString(), [])

  // Consumo médio de ração 7 dias
  const feedAverageConsumptionLast7DaysByItem = useMemo(() => {
    const recentLogs = feedLogs.filter((f) => f.date >= sevenDaysAgoStr)
    const map: Record<string, number> = {}
    for (const log of recentLogs) {
      if (log.inventoryItemId) {
        map[log.inventoryItemId] = (map[log.inventoryItemId] || 0) + (Number(log.quantityKg) || 0)
      }
    }
    const result: Record<string, number> = {}
    for (const [id, total7] of Object.entries(map)) {
      result[id] = total7 / 7
    }
    return result
  }, [feedLogs, sevenDaysAgoStr])

  const activeLots = useMemo(() => {
    return lots.filter(
      (l) => (l.status as string) !== 'Finalizado' && (l.status as string) !== 'Abatido',
    )
  }, [lots])

  const activeIncubations = useMemo(() => {
    return incubations.filter((i) => i.status === 'Em andamento')
  }, [incubations])

  // 1. Detectar todas as condições ativas no momento
  const activeConditionSpecs = useMemo(() => {
    const specs: ConditionAlertSpec[] = []

    // 0) SANIDADE — Vacinações
    for (const v of vaccinations) {
      const scheduled = v.scheduled_date || ''
      const targetLotName = lots.find((l) => l.id === v.lot_id)?.name || 'Geral'
      if (v.status === 'scheduled' || v.status === 'delayed') {
        if (scheduled === todayStr) {
          specs.push({
            deduplicationKey: `san-vac-today:${v.id}:${scheduled}`,
            type: 'sanidade',
            severity: 'critical',
            title: '💉 Vacinação Programada Hoje',
            description: `Vacinação programada para hoje: ${v.vaccine_name} — Lote ${targetLotName}`,
            origin: 'Sanidade / Vacinação',
            related_entity_type: 'farm_vaccinations',
            related_entity_id: v.id,
            condition_state: `scheduled_${scheduled}`,
            modulePath: '/sanidade',
            propertyId: v.property_id || propertyId,
            propertyName,
            date: todayStr,
          })
        } else if (scheduled === tomorrowStr) {
          specs.push({
            deduplicationKey: `san-vac-tom:${v.id}:${scheduled}`,
            type: 'sanidade',
            severity: 'info',
            title: '💉 Vacinação Amanhã',
            description: `Vacinação programada para amanhã: ${v.vaccine_name} — Lote ${targetLotName}`,
            origin: 'Sanidade / Vacinação',
            related_entity_type: 'farm_vaccinations',
            related_entity_id: v.id,
            condition_state: `scheduled_${scheduled}`,
            modulePath: '/sanidade',
            propertyId: v.property_id || propertyId,
            propertyName,
            date: todayStr,
          })
        } else if (scheduled && scheduled < todayStr) {
          specs.push({
            deduplicationKey: `san-vac-delayed:${v.id}:${scheduled}`,
            type: 'sanidade',
            severity: 'critical',
            title: '🚨 Vacinação Atrasada',
            description: `Vacinação atrasada: ${v.vaccine_name} — Lote ${targetLotName} (programada para ${scheduled})`,
            origin: 'Sanidade / Vacinação',
            related_entity_type: 'farm_vaccinations',
            related_entity_id: v.id,
            condition_state: `delayed_${scheduled}`,
            modulePath: '/sanidade',
            propertyId: v.property_id || propertyId,
            propertyName,
            date: todayStr,
          })
        }
      }
    }

    // SANIDADE — Tratamentos
    for (const t of treatments) {
      const targetLotName = lots.find((l) => l.id === t.lot_id)?.name || 'Geral'
      if (t.status === 'in_progress') {
        specs.push({
          deduplicationKey: `san-trt-prog:${t.id}`,
          type: 'sanidade',
          severity: 'warning',
          title: '💊 Tratamento em Andamento',
          description: `Tratamento em andamento: ${t.medication_name} — Lote ${targetLotName}`,
          origin: 'Sanidade / Tratamentos',
          related_entity_type: 'farm_treatments',
          related_entity_id: t.id,
          condition_state: `in_progress`,
          modulePath: '/sanidade',
          propertyId: t.property_id || propertyId,
          propertyName,
          date: todayStr,
        })
      }

      if (t.withdrawal_period_days && t.withdrawal_period_days > 0 && t.end_date) {
        const endDate = new Date(t.end_date)
        const carDate = new Date(endDate)
        carDate.setDate(carDate.getDate() + t.withdrawal_period_days)
        const carStr = carDate.toISOString().split('T')[0]
        if (carStr >= todayStr) {
          specs.push({
            deduplicationKey: `san-trt-carencia:${t.id}:${carStr}`,
            type: 'sanidade',
            severity: 'critical',
            title: '⛔ Período de Carência Ativo',
            description: `Período de carência ativo: ${t.medication_name} — Lote ${targetLotName} (até ${carStr})`,
            origin: 'Sanidade / Tratamentos',
            related_entity_type: 'farm_treatments',
            related_entity_id: t.id,
            condition_state: `carencia_until_${carStr}`,
            modulePath: '/sanidade',
            propertyId: t.property_id || propertyId,
            propertyName,
            date: todayStr,
          })
        }
      }
    }

    // SANIDADE — Protocolos
    for (const pa of protocolAssignments) {
      const targetLotName = lots.find((l) => l.id === pa.lot_id)?.name || 'Geral'
      for (const [idx, entry] of (pa.generated_entries || []).entries()) {
        if (entry.status === 'pending') {
          if (entry.scheduled_date === todayStr) {
            specs.push({
              deduplicationKey: `san-proto-today:${pa.id}:${idx}:${entry.scheduled_date}`,
              type: 'sanidade',
              severity: 'warning',
              title: '📋 Etapa de Protocolo Hoje',
              description: `Protocolo com etapa pendente: ${pa.protocolName || 'Protocolo'} — Lote ${targetLotName}`,
              origin: 'Sanidade / Protocolos',
              related_entity_type: 'farm_protocol_assignments',
              related_entity_id: pa.id,
              condition_state: `pending_${entry.scheduled_date}`,
              modulePath: '/sanidade',
              propertyId: pa.property_id || propertyId,
              propertyName,
              date: todayStr,
            })
          } else if (entry.scheduled_date && entry.scheduled_date < todayStr) {
            specs.push({
              deduplicationKey: `san-proto-del:${pa.id}:${idx}:${entry.scheduled_date}`,
              type: 'sanidade',
              severity: 'critical',
              title: '🚨 Etapa de Protocolo Atrasada',
              description: `Etapa de protocolo atrasada: ${pa.protocolName || 'Protocolo'} — Lote ${targetLotName}`,
              origin: 'Sanidade / Protocolos',
              related_entity_type: 'farm_protocol_assignments',
              related_entity_id: pa.id,
              condition_state: `delayed_${entry.scheduled_date}`,
              modulePath: '/sanidade',
              propertyId: pa.property_id || propertyId,
              propertyName,
              date: todayStr,
            })
          }
        }
      }
    }

    // INCUBAÇÕES / CHOCADEIRA
    for (const inc of activeIncubations) {
      const startDate = new Date(inc.startDate)
      const diffTime = Date.now() - startDate.getTime()
      const currentDay = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1)
      const totalCycle = 21

      if (currentDay === 18 && totalCycle === 21) {
        specs.push({
          deduplicationKey: `inc-lockdown:${inc.id}:${inc.startDate}`,
          type: 'incubacao',
          severity: 'warning',
          title: '🥚 Chocadeira em Lockdown',
          description: `Chocada ${inc.incubatorName || inc.code} entra em lockdown amanhã`,
          origin: 'Chocadeira',
          related_entity_type: 'farm_incubations',
          related_entity_id: inc.id,
          condition_state: `lockdown_day_${currentDay}`,
          modulePath: '/chocadeira',
          propertyId: propertyId,
          propertyName,
          date: todayStr,
        })
      }

      if (inc.expectedHatchDate === todayStr) {
        specs.push({
          deduplicationKey: `inc-hatch-today:${inc.id}:${inc.expectedHatchDate}`,
          type: 'incubacao',
          severity: 'info',
          title: '🐣 Nascimento Previsto Hoje',
          description: `Nascimento previsto hoje: ${inc.incubatorName || inc.code}`,
          origin: 'Chocadeira',
          related_entity_type: 'farm_incubations',
          related_entity_id: inc.id,
          condition_state: `hatch_today_${inc.expectedHatchDate}`,
          modulePath: '/chocadeira',
          propertyId: propertyId,
          propertyName,
          date: todayStr,
        })
      } else if (inc.expectedHatchDate < todayStr && inc.status === 'Em andamento') {
        specs.push({
          deduplicationKey: `inc-hatch-delayed:${inc.id}:${inc.expectedHatchDate}`,
          type: 'incubacao',
          severity: 'critical',
          title: '🚨 Nascimento Atrasado',
          description: `Nascimento atrasado: ${inc.incubatorName || inc.code}`,
          origin: 'Chocadeira',
          related_entity_type: 'farm_incubations',
          related_entity_id: inc.id,
          condition_state: `hatch_delayed_${inc.expectedHatchDate}`,
          modulePath: '/chocadeira',
          propertyId: propertyId,
          propertyName,
          date: todayStr,
        })
      }
    }

    // ESTOQUE & VALIDADE
    for (const item of inventory) {
      const avgDaily = feedAverageConsumptionLast7DaysByItem[item.id] || 0
      const current = Number(item.currentStock) || 0
      const min = typeof item.minStock === 'number' ? item.minStock : 10

      if (avgDaily > 0) {
        const estimatedDays = current / avgDaily
        if (estimatedDays <= 3) {
          const daysText = estimatedDays < 1 ? 'menos de 1 dia' : `${Math.ceil(estimatedDays)} dias`
          specs.push({
            deduplicationKey: `stock-deplete:${item.id}`,
            type: 'estoque',
            severity: 'critical',
            title: '⚠️ Ração Acabando',
            description: `Ração ${item.name} deve acabar em aproximadamente ${daysText}`,
            origin: 'Estoque',
            related_entity_type: 'farm_inventory',
            related_entity_id: item.id,
            condition_state: `depleting_${current}_avg_${avgDaily.toFixed(1)}`,
            modulePath: '/estoque',
            propertyId: propertyId,
            propertyName,
            date: todayStr,
          })
        }
      }

      if (current <= min) {
        // Se já colocamos alerta de depletion da ração, podemos manter ou diferenciar estoque zerado vs baixo
        const isZero = current <= 0
        specs.push({
          deduplicationKey: `stock-critical:${item.id}`,
          type: 'estoque',
          severity: isZero ? 'critical' : 'warning',
          title: isZero ? '🚨 Estoque Zerado' : '⚠️ Estoque Baixo',
          description: `${item.name}: estoque ${isZero ? 'zerado' : 'abaixo do mínimo'} (${current} ${item.unit || 'un'})`,
          origin: 'Estoque',
          related_entity_type: 'farm_inventory',
          related_entity_id: item.id,
          condition_state: `stock_${current}_min_${min}`,
          modulePath: '/estoque',
          propertyId: propertyId,
          propertyName,
          date: todayStr,
        })
      }

      // Validação de validade para vacinas e medicamentos
      if (item.expiration_date) {
        const expDate = new Date(item.expiration_date)
        const now = new Date()
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
          specs.push({
            deduplicationKey: `stock-expired:${item.id}:${item.expiration_date}`,
            type: 'estoque',
            severity: 'critical',
            title: '🚨 Produto Vencido',
            description: `PRODUTO VENCIDO: ${item.name} venceu em ${item.expiration_date}`,
            origin: 'Estoque / Sanitário',
            related_entity_type: 'farm_inventory',
            related_entity_id: item.id,
            condition_state: `expired_${item.expiration_date}`,
            modulePath: '/estoque',
            propertyId: propertyId,
            propertyName,
            date: todayStr,
          })
        } else if (diffDays <= 30) {
          specs.push({
            deduplicationKey: `stock-expiring:${item.id}:${item.expiration_date}`,
            type: 'estoque',
            severity: 'warning',
            title: '⏳ Validade Próxima',
            description: `Produto próximo da validade: ${item.name} vence em ${diffDays} dia(s) (${item.expiration_date})`,
            origin: 'Estoque / Sanitário',
            related_entity_type: 'farm_inventory',
            related_entity_id: item.id,
            condition_state: `expiring_${diffDays}d_${item.expiration_date}`,
            modulePath: '/estoque',
            propertyId: propertyId,
            propertyName,
            date: todayStr,
          })
        }
      }
    }

    // PESAGENS
    for (const lot of activeLots) {
      const lotWeighings = weighings
        .filter((w) => w.lotId === lot.id)
        .sort((a, b) => b.date.localeCompare(a.date))
      const lastWeighing = lotWeighings[0]

      if (!lastWeighing) {
        const lotStart = new Date(lot.startDate)
        const daysSinceStart = Math.floor((Date.now() - lotStart.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceStart > 7) {
          specs.push({
            deduplicationKey: `weighing-never:${lot.id}`,
            type: 'pesagem',
            severity: 'warning',
            title: '⚖️ Pesagem Pendente',
            description: `Pesagem do lote ${lot.name} está pendente (nenhuma pesagem registrada)`,
            origin: 'Pesagens',
            related_entity_type: 'farm_lots',
            related_entity_id: lot.id,
            condition_state: `never_weighed_days_${daysSinceStart}`,
            modulePath: '/pesagens',
            propertyId: propertyId,
            propertyName,
            date: todayStr,
          })
        }
      } else {
        const lastDate = new Date(lastWeighing.date)
        const daysSinceLast = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceLast > 7) {
          const [y, m, d] = lastWeighing.date.split('-')
          const formattedDate = `${d}/${m}/${y}`
          specs.push({
            deduplicationKey: `weighing-delayed:${lot.id}:${lastWeighing.date}`,
            type: 'pesagem',
            severity: 'warning',
            title: '⚖️ Pesagem Atrasada',
            description: `Pesagem do lote ${lot.name} está atrasada (última: ${formattedDate})`,
            origin: 'Pesagens',
            related_entity_type: 'farm_lots',
            related_entity_id: lot.id,
            condition_state: `delayed_since_${lastWeighing.date}`,
            modulePath: '/pesagens',
            propertyId: propertyId,
            propertyName,
            date: todayStr,
          })
        }
      }
    }

    // MORTALIDADE ACIMA DA MÉDIA
    for (const lot of activeLots) {
      const lotMortalityLast7 = mortality.filter(
        (m) => m.lotId === lot.id && m.date >= sevenDaysAgoStr && m.date < todayStr,
      )
      const totalLast7 = lotMortalityLast7.reduce((acc, m) => acc + (Number(m.quantity) || 0), 0)
      const avgDaily = totalLast7 / 7

      const lotMortalityToday = mortality
        .filter((m) => m.lotId === lot.id && m.date === todayStr)
        .reduce((acc, m) => acc + (Number(m.quantity) || 0), 0)

      if (lotMortalityToday > 0 && avgDaily > 0 && lotMortalityToday > avgDaily * 2) {
        specs.push({
          deduplicationKey: `mortality-spike:${lot.id}:${todayStr}`,
          type: 'mortalidade',
          severity: 'critical',
          title: '🚨 Mortalidade Elevada',
          description: `Mortalidade do lote ${lot.name} subiu acima da média (${lotMortalityToday} hoje vs média ${avgDaily.toFixed(1)}/dia)`,
          origin: 'Mortalidade',
          related_entity_type: 'farm_lots',
          related_entity_id: lot.id,
          condition_state: `spike_${lotMortalityToday}_vs_${avgDaily.toFixed(1)}`,
          modulePath: '/mortalidade',
          propertyId: propertyId,
          propertyName,
          date: todayStr,
        })
      }
    }

    // DESPESAS VENCENDO AMANHÃ
    const expensesDueTomorrow = expenses.filter(
      (e) => (e.date === tomorrowStr || (e as any).due_date === tomorrowStr) && !e.isPaid,
    )
    for (const exp of expensesDueTomorrow) {
      specs.push({
        deduplicationKey: `expense-due:${exp.id}:${tomorrowStr}`,
        type: 'despesa',
        severity: 'info',
        title: '💵 Conta Vencendo Amanhã',
        description: `Conta ${exp.description} vence amanhã (R$ ${Number(exp.totalValue || 0).toFixed(2)})`,
        origin: 'Financeiro / Despesas',
        related_entity_type: 'farm_expenses',
        related_entity_id: exp.id,
        condition_state: `due_${tomorrowStr}_unpaid`,
        modulePath: '/financeiro',
        propertyId: propertyId,
        propertyName,
        date: todayStr,
      })
    }

    return specs
  }, [
    vaccinations,
    treatments,
    protocolAssignments,
    activeIncubations,
    inventory,
    feedAverageConsumptionLast7DaysByItem,
    activeLots,
    weighings,
    mortality,
    expenses,
    todayStr,
    tomorrowStr,
    sevenDaysAgoStr,
    lots,
    propertyId,
    propertyName,
  ])

  // 2. CONSOLIDAR COM O BANCO SUPABASE
  // Mapeamos os alertas persistidos por deduplication_key ou por id
  const consolidatedAlerts = useMemo(() => {
    // Mapa de alertas salvos no banco
    const storedByDedupKey = new Map<string, FarmAlert>()
    const storedById = new Map<string, FarmAlert>()

    for (const stored of alerts) {
      if (stored.deduplication_key) {
        storedByDedupKey.set(stored.deduplication_key, stored)
      }
      storedById.set(stored.id, stored)
    }

    const result: FarmAlert[] = []
    const processedDedupKeys = new Set<string>()

    // Processar todas as condições ativas
    for (const spec of activeConditionSpecs) {
      processedDedupKeys.add(spec.deduplicationKey)
      const stored =
        storedByDedupKey.get(spec.deduplicationKey) || storedById.get(spec.deduplicationKey)

      if (stored) {
        // Se temos registro no banco para esta condição exata:
        // O status respeita o que está salvo no banco (lido, dispensado, nao_lido)
        const isRead = stored.status === 'lido' || stored.isRead === true
        const status: AlertStatus = stored.status || (stored.isRead ? 'lido' : 'nao_lido')

        result.push({
          ...stored,
          title: stored.title || spec.title,
          description: stored.description || spec.description,
          severity: (stored.severity as any) || spec.severity,
          type: stored.type || spec.type,
          origin: stored.origin || spec.origin,
          related_entity_type: stored.related_entity_type || spec.related_entity_type,
          related_entity_id: stored.related_entity_id || spec.related_entity_id,
          modulePath: stored.modulePath || spec.modulePath,
          propertyName: stored.propertyName || spec.propertyName,
          property_id: stored.property_id || spec.propertyId,
          date: stored.date || spec.date,
          condition_active: true,
          condition_state: spec.condition_state,
          deduplication_key: spec.deduplicationKey,
          status,
          isRead,
        })
      } else {
        // Novo alerta virtual ativo (ainda não interagido pelo usuário, estado padrão 'nao_lido')
        result.push({
          id: spec.deduplicationKey,
          type: spec.type,
          severity: spec.severity,
          title: spec.title,
          description: spec.description,
          origin: spec.origin,
          related_entity_type: spec.related_entity_type,
          related_entity_id: spec.related_entity_id,
          deduplication_key: spec.deduplicationKey,
          condition_active: true,
          condition_state: spec.condition_state,
          status: 'nao_lido',
          isRead: false,
          modulePath: spec.modulePath,
          property_id: spec.propertyId,
          propertyName: spec.propertyName,
          date: spec.date,
          created_at: new Date().toISOString(),
        })
      }
    }

    // Incluir alertas persistidos no Supabase cuja condição não está ativa mais ou alertas avulsos manuais
    for (const stored of alerts) {
      const dedupKey = stored.deduplication_key || stored.id
      if (!processedDedupKeys.has(dedupKey)) {
        const isRead = stored.status === 'lido' || stored.isRead === true
        result.push({
          ...stored,
          condition_active: false,
          status: stored.status || (stored.isRead ? 'lido' : 'nao_lido'),
          isRead,
          severity: (stored.severity as any) || 'warning',
          origin: stored.origin || 'Sistema',
          modulePath: stored.modulePath || '/estoque',
          date: stored.date || stored.created_at?.split('T')[0] || todayStr,
        })
      }
    }

    return result
  }, [alerts, activeConditionSpecs, todayStr])

  // Alertas pendentes (status === 'nao_lido' e não dispensados)
  const pendingAlerts = useMemo(() => {
    return consolidatedAlerts.filter((a) => a.status === 'nao_lido' && a.condition_active !== false)
  }, [consolidatedAlerts])

  // Alertas lidos
  const readAlerts = useMemo(() => {
    return consolidatedAlerts.filter((a) => a.status === 'lido')
  }, [consolidatedAlerts])

  // Todos os alertas (não excluídos / ativos ou históricos)
  const allAlerts = useMemo(() => {
    return consolidatedAlerts
  }, [consolidatedAlerts])

  // Badge unread count (somente alertas NÃO LIDOS e com condição ativa)
  const unreadCount = pendingAlerts.length

  // Interação ao clicar no alerta:
  // 1. Marca como lido no Supabase
  // 2. Remove imediatamente dos pendentes
  const handleClickAlert = useCallback(
    async (alert: FarmAlert) => {
      await markAlertAsRead(alert.id, alert)
    },
    [markAlertAsRead],
  )

  return {
    allAlerts,
    pendingAlerts,
    readAlerts,
    unreadCount,
    markAlertAsRead: (id: string, alertData?: Partial<FarmAlert>) => markAlertAsRead(id, alertData),
    markAlertAsUnread: (id: string, alertData?: Partial<FarmAlert>) =>
      markAlertAsUnread(id, alertData),
    dismissAlert: (id: string, alertData?: Partial<FarmAlert>) => dismissAlert(id, alertData),
    markAllAlertsAsRead: () => markAllAlertsAsRead(consolidatedAlerts),
    dismissAllAlerts: () => dismissAllAlerts(consolidatedAlerts),
    handleClickAlert,
  }
}
