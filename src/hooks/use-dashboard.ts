import { useMemo } from 'react'
import { useFarmStore } from '@/hooks/use-farm-store'
import { useAuth } from '@/hooks/use-auth'
import { Lot, Incubation, InventoryItem, FeedConsumption } from '@/types/farm'

export interface DashboardAlert {
  id: string
  type: 'incubacao' | 'estoque' | 'pesagem' | 'mortalidade' | 'despesa'
  severity: 'warning' | 'critical' | 'info'
  message: string
  link?: string
}

export interface ActivityTimelineItem {
  id: string
  iconType:
    | 'mortalidade'
    | 'racao'
    | 'pesagem'
    | 'producao'
    | 'venda'
    | 'despesa'
    | 'energia'
    | 'lote'
    | 'nascimento'
  actionLabel: string
  description: string
  relatedEntity?: string
  date: string // ISO string or YYYY-MM-DD
  formattedRelativeDate: string
  timestamp: number
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

function getStartOfMonthString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

function getSevenDaysAgoString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatRelativeActivityDate(dateStr: string, timeStr?: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number)
  if (!year || !month || !day) return dateStr

  const targetDate = new Date(year, month - 1, day)
  const today = new Date()
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.round((todayZero.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))

  const timePart = dateStr.includes('T') ? dateStr.split('T')[1].slice(0, 5) : timeStr || ''

  const timeSuffix = timePart ? ` ${timePart}` : ''

  if (diffDays === 0) {
    return `Hoje${timeSuffix}`
  }
  if (diffDays === 1) {
    return `Ontem${timeSuffix}`
  }
  if (diffDays > 1 && diffDays < 7) {
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    return `${daysOfWeek[targetDate.getDay()]}${timeSuffix}`
  }

  const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
  return `${formattedDate}${timeSuffix}`
}

export function useDashboardData() {
  const { currentProperty, organization } = useAuth()
  const propertyName = currentProperty?.name || organization?.name || 'Sua Propriedade'

  const {
    lots,
    expenses,
    sales,
    eggs,
    feedLogs,
    mortality,
    incubations,
    candlings,
    inventory,
    weighings,
    energyLogs,
    activities,
    structures,
    vaccinations,
    treatments,
    healthOccurrences,
    protocolAssignments,
  } = useFarmStore()

  const todayStr = useMemo(() => getTodayString(), [])
  const tomorrowStr = useMemo(() => getTomorrowString(), [])
  const startOfMonthStr = useMemo(() => getStartOfMonthString(), [])
  const sevenDaysAgoStr = useMemo(() => getSevenDaysAgoString(), [])

  // 1. LOTES ATIVOS
  const activeLots = useMemo(() => {
    return lots.filter(
      (l) => (l.status as string) !== 'Finalizado' && (l.status as string) !== 'Abatido',
    )
  }, [lots])

  const totalBirdsAlive = useMemo(() => {
    return activeLots.reduce((acc, l) => acc + (Number(l.currentQuantity) || 0), 0)
  }, [activeLots])

  // 2. INCUBAÇÕES EM ANDAMENTO
  const activeIncubations = useMemo(() => {
    return incubations.filter((i) => i.status === 'Em andamento')
  }, [incubations])

  // 3. NASCIMENTOS HOJE
  const birthsToday = useMemo(() => {
    // Check incubations hatched today or with expectedHatchDate = today
    // Also consider hatchedCount of incubations updated today if available
    const hatchingTodayCount = incubations
      .filter(
        (i) =>
          (i.expectedHatchDate === todayStr || i.startDate === todayStr) &&
          (i.hatchedCount || 0) > 0,
      )
      .reduce((acc, i) => acc + (i.hatchedCount || 0), 0)
    return hatchingTodayCount
  }, [incubations, todayStr])

  // 4. MORTALIDADE HOJE
  const mortalityToday = useMemo(() => {
    return mortality
      .filter((m) => m.date === todayStr)
      .reduce((acc, m) => acc + (Number(m.quantity) || 0), 0)
  }, [mortality, todayStr])

  const hasMortalityTodayRecords = useMemo(() => {
    return mortality.some((m) => m.date === todayStr)
  }, [mortality, todayStr])

  // 5. RAÇÃO CONSUMIDA HOJE (KG)
  const feedConsumedTodayKg = useMemo(() => {
    return feedLogs
      .filter((f) => f.date === todayStr)
      .reduce((acc, f) => acc + (Number(f.quantityKg) || 0), 0)
  }, [feedLogs, todayStr])

  const hasFeedConsumedTodayRecords = useMemo(() => {
    return feedLogs.some((f) => f.date === todayStr)
  }, [feedLogs, todayStr])

  // 6. FINANCEIRO DO MÊS
  const monthlySales = useMemo(() => {
    return sales.filter((s) => s.date >= startOfMonthStr)
  }, [sales, startOfMonthStr])

  const monthlyRevenue = useMemo(() => {
    return monthlySales.reduce((acc, s) => acc + (Number(s.totalPrice) || 0), 0)
  }, [monthlySales])

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => e.date >= startOfMonthStr)
  }, [expenses, startOfMonthStr])

  const isCapex = (e: { source_type?: string }) => e.source_type === 'STRUCTURE'

  const monthlyOpex = useMemo(() => {
    return monthlyExpenses
      .filter((e) => !isCapex(e))
      .reduce((acc, e) => acc + (Number(e.totalValue) || 0), 0)
  }, [monthlyExpenses])

  const monthlyCapexFromStructures = useMemo(() => {
    return structures
      .filter((s) => s.date >= startOfMonthStr)
      .reduce((acc, s) => acc + (Number(s.totalValue) || 0), 0)
  }, [structures, startOfMonthStr])

  const monthlyOperationalResult = useMemo(() => {
    return monthlyRevenue - monthlyOpex
  }, [monthlyRevenue, monthlyOpex])

  const monthlyCashFlow = useMemo(() => {
    const paidRevenue = monthlySales
      .filter((s) => s.isPaid)
      .reduce((acc, s) => acc + (Number(s.totalPrice) || 0), 0)
    const paidOpex = monthlyExpenses
      .filter((e) => e.isPaid && !isCapex(e))
      .reduce((acc, e) => acc + (Number(e.totalValue) || 0), 0)
    const paidCapex = structures
      .filter((s) => s.isPaid && s.date >= startOfMonthStr)
      .reduce((acc, s) => acc + (Number(s.totalValue) || 0), 0)
    return paidRevenue - paidOpex - paidCapex
  }, [monthlySales, monthlyExpenses, structures, startOfMonthStr])

  // 7. CONSUMO MÉDIO DIÁRIO DE RAÇÃO NOS ÚLTIMOS 7 DIAS
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

  // 8. ESTOQUE CRÍTICO
  const criticalStockItems = useMemo(() => {
    return inventory.filter((item) => {
      const min = typeof item.minStock === 'number' && !isNaN(item.minStock) ? item.minStock : 10
      return (Number(item.currentStock) || 0) <= min
    })
  }, [inventory])

  // 9. ATENÇÃO HOJE (ALERTAS DINÂMICOS BASEADOS EM DADOS REAIS)
  const attentionAlerts = useMemo(() => {
    const list: DashboardAlert[] = []

    // 0) SANIDADE (Vacinações, Tratamentos, Carência, Protocolos)
    for (const v of vaccinations) {
      const scheduled = v.scheduled_date || ''
      const targetLotName = lots.find((l) => l.id === v.lot_id)?.name || 'Geral'
      if (v.status === 'scheduled' || v.status === 'delayed') {
        if (scheduled === todayStr) {
          list.push({
            id: `vac-today-${v.id}`,
            type: 'sanidade' as any,
            severity: 'critical',
            message: `Vacinação programada para hoje: ${v.vaccine_name} — Lote ${targetLotName}`,
            link: '/sanidade',
          })
        } else if (scheduled === tomorrowStr) {
          list.push({
            id: `vac-tom-${v.id}`,
            type: 'sanidade' as any,
            severity: 'info',
            message: `Vacinação programada para amanhã: ${v.vaccine_name} — Lote ${targetLotName}`,
            link: '/sanidade',
          })
        } else if (scheduled && scheduled < todayStr) {
          list.push({
            id: `vac-del-${v.id}`,
            type: 'sanidade' as any,
            severity: 'critical',
            message: `Vacinação atrasada: ${v.vaccine_name} — Lote ${targetLotName} (programada para ${scheduled})`,
            link: '/sanidade',
          })
        }
      }
    }

    for (const t of treatments) {
      const targetLotName = lots.find((l) => l.id === t.lot_id)?.name || 'Geral'
      if (t.status === 'in_progress') {
        list.push({
          id: `trt-prog-${t.id}`,
          type: 'sanidade' as any,
          severity: 'warning',
          message: `Tratamento em andamento: ${t.medication_name} — Lote ${targetLotName}`,
          link: '/sanidade',
        })
      }

      if (t.withdrawal_period_days && t.withdrawal_period_days > 0 && t.end_date) {
        const endDate = new Date(t.end_date)
        const carDate = new Date(endDate)
        carDate.setDate(carDate.getDate() + t.withdrawal_period_days)
        const carStr = carDate.toISOString().split('T')[0]
        if (carStr >= todayStr) {
          list.push({
            id: `trt-car-${t.id}`,
            type: 'sanidade' as any,
            severity: 'critical',
            message: `Período de carência ativo: ${t.medication_name} — Lote ${targetLotName} (até ${carStr})`,
            link: '/sanidade',
          })
        }
      }
    }

    for (const pa of protocolAssignments) {
      const targetLotName = lots.find((l) => l.id === pa.lot_id)?.name || 'Geral'
      for (const [idx, entry] of (pa.generated_entries || []).entries()) {
        if (entry.status === 'pending') {
          if (entry.scheduled_date === todayStr) {
            list.push({
              id: `prot-tod-${pa.id}-${idx}`,
              type: 'sanidade' as any,
              severity: 'warning',
              message: `Protocolo com etapa pendente: ${pa.protocolName || 'Protocolo'} — Lote ${targetLotName}`,
              link: '/sanidade',
            })
          } else if (entry.scheduled_date && entry.scheduled_date < todayStr) {
            list.push({
              id: `prot-del-${pa.id}-${idx}`,
              type: 'sanidade' as any,
              severity: 'critical',
              message: `Etapa de protocolo atrasada: ${pa.protocolName || 'Protocolo'} — Lote ${targetLotName}`,
              link: '/sanidade',
            })
          }
        }
      }
    }

    // a) INCUBAÇÕES
    for (const inc of activeIncubations) {
      const startDate = new Date(inc.startDate)
      const diffTime = Date.now() - startDate.getTime()
      const currentDay = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1)
      const totalCycle = 21

      if (currentDay === 18 && totalCycle === 21) {
        list.push({
          id: `inc-lockdown-${inc.id}`,
          type: 'incubacao',
          severity: 'warning',
          message: `Chocada ${inc.incubatorName || inc.code} entra em lockdown amanhã`,
          link: '/chocadeira',
        })
      }

      if (inc.expectedHatchDate === todayStr) {
        list.push({
          id: `inc-hatch-today-${inc.id}`,
          type: 'incubacao',
          severity: 'info',
          message: `Nascimento previsto hoje: ${inc.incubatorName || inc.code}`,
          link: '/chocadeira',
        })
      } else if (inc.expectedHatchDate < todayStr && inc.status === 'Em andamento') {
        list.push({
          id: `inc-hatch-delayed-${inc.id}`,
          type: 'incubacao',
          severity: 'critical',
          message: `Nascimento atrasado: ${inc.incubatorName || inc.code}`,
          link: '/chocadeira',
        })
      }
    }

    // b) ESTOQUE E VALIDADE DE PRODUTOS SANITÁRIOS
    for (const item of inventory) {
      const avgDaily = feedAverageConsumptionLast7DaysByItem[item.id] || 0
      const current = Number(item.currentStock) || 0
      const min = typeof item.minStock === 'number' ? item.minStock : 10

      if (avgDaily > 0) {
        const estimatedDays = current / avgDaily
        if (estimatedDays <= 3) {
          const daysText = estimatedDays < 1 ? 'menos de 1 dia' : `${Math.ceil(estimatedDays)} dias`
          list.push({
            id: `stock-deplete-${item.id}`,
            type: 'estoque',
            severity: 'critical',
            message: `Ração ${item.name} deve acabar em aproximadamente ${daysText}`,
            link: '/estoque',
          })
        }
      }

      if (current <= min) {
        if (!list.some((a) => a.id === `stock-deplete-${item.id}`)) {
          list.push({
            id: `stock-critical-${item.id}`,
            type: 'estoque',
            severity: 'warning',
            message: `${item.name}: estoque abaixo do mínimo (${current} ${item.unit || 'un'})`,
            link: '/estoque',
          })
        }
      }

      // Validação de validade para vacinas e medicamentos
      if (item.expiration_date) {
        const expDate = new Date(item.expiration_date)
        const now = new Date()
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
          list.push({
            id: `stock-expired-${item.id}`,
            type: 'estoque',
            severity: 'critical',
            message: `PRODUTO VENCIDO: ${item.name} venceu em ${item.expiration_date}`,
            link: '/estoque',
          })
        } else if (diffDays <= 30) {
          list.push({
            id: `stock-expiring-${item.id}`,
            type: 'estoque',
            severity: 'warning',
            message: `Produto próximo da validade: ${item.name} vence em ${diffDays} dia(s) (${item.expiration_date})`,
            link: '/estoque',
          })
        }
      }
    }

    // c) PESAGEM ATRASADA (> 7 dias para lotes ativos)
    for (const lot of activeLots) {
      const lotWeighings = weighings
        .filter((w) => w.lotId === lot.id)
        .sort((a, b) => b.date.localeCompare(a.date))
      const lastWeighing = lotWeighings[0]

      if (!lastWeighing) {
        const lotStart = new Date(lot.startDate)
        const daysSinceStart = Math.floor((Date.now() - lotStart.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceStart > 7) {
          list.push({
            id: `weighing-never-${lot.id}`,
            type: 'pesagem',
            severity: 'warning',
            message: `Pesagem do lote ${lot.name} está pendente (nenhuma pesagem registrada)`,
            link: '/pesagens',
          })
        }
      } else {
        const lastDate = new Date(lastWeighing.date)
        const daysSinceLast = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceLast > 7) {
          const [y, m, d] = lastWeighing.date.split('-')
          const formattedDate = `${d}/${m}/${y}`
          list.push({
            id: `weighing-delayed-${lot.id}`,
            type: 'pesagem',
            severity: 'warning',
            message: `Pesagem do lote ${lot.name} está atrasada (última: ${formattedDate})`,
            link: '/pesagens',
          })
        }
      }
    }

    // d) MORTALIDADE ACIMA DA MÉDIA
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
        list.push({
          id: `mortality-spike-${lot.id}`,
          type: 'mortalidade',
          severity: 'critical',
          message: `Mortalidade do lote ${lot.name} subiu acima da média (${lotMortalityToday} hoje vs média ${avgDaily.toFixed(1)}/dia)`,
          link: '/mortalidade',
        })
      }
    }

    // e) DESPESAS VENCENDO AMANHÃ
    const expensesDueTomorrow = expenses.filter(
      (e) => (e.date === tomorrowStr || (e as any).due_date === tomorrowStr) && !e.isPaid,
    )
    for (const exp of expensesDueTomorrow) {
      list.push({
        id: `expense-due-${exp.id}`,
        type: 'despesa',
        severity: 'info',
        message: `Conta ${exp.description} vence amanhã (R$ ${Number(exp.totalValue || 0).toFixed(2)})`,
        link: '/financeiro',
      })
    }

    return list
  }, [
    activeIncubations,
    todayStr,
    inventory,
    feedAverageConsumptionLast7DaysByItem,
    activeLots,
    weighings,
    mortality,
    sevenDaysAgoStr,
    expenses,
    tomorrowStr,
    vaccinations,
    treatments,
    protocolAssignments,
    lots,
  ])

  // 10. ATIVIDADES RECENTES (TIMELINE CONSOLIDADA, MÁXIMO 15 ITENS)
  const recentActivities = useMemo(() => {
    const timeline: ActivityTimelineItem[] = []

    // farm_mortality
    for (const m of mortality) {
      const ts = new Date(m.date).getTime()
      timeline.push({
        id: `mort-${m.id}`,
        iconType: 'mortalidade',
        actionLabel: 'Mortalidade',
        description: `${m.quantity} ave(s) — ${m.cause || 'Não especificada'}`,
        relatedEntity: m.lotName ? `Lote ${m.lotName}` : undefined,
        date: m.date,
        formattedRelativeDate: formatRelativeActivityDate(m.date),
        timestamp: isNaN(ts) ? 0 : ts,
      })
    }

    // farm_feed_consumption
    for (const f of feedLogs) {
      const ts = new Date(f.date).getTime()
      timeline.push({
        id: `feed-${f.id}`,
        iconType: 'racao',
        actionLabel: 'Consumo de ração',
        description: `${f.quantityKg} kg${f.inventoryItemName ? ` (${f.inventoryItemName})` : ''}`,
        relatedEntity: f.lotName
          ? `Lote ${f.lotName}`
          : f.activityName
            ? `Atividade ${f.activityName}`
            : undefined,
        date: f.date,
        formattedRelativeDate: formatRelativeActivityDate(f.date),
        timestamp: isNaN(ts) ? 0 : ts,
      })
    }

    // farm_weighings
    for (const w of weighings) {
      const ts = new Date(w.date).getTime()
      const weightGrams = Math.round(Number(w.averageWeightKg || 0) * 1000)
      timeline.push({
        id: `weigh-${w.id}`,
        iconType: 'pesagem',
        actionLabel: 'Pesagem',
        description: `${weightGrams}g média (${w.weighedCount} aves)`,
        relatedEntity: w.lotName ? `Lote ${w.lotName}` : undefined,
        date: w.date,
        formattedRelativeDate: formatRelativeActivityDate(w.date),
        timestamp: isNaN(ts) ? 0 : ts,
      })
    }

    // farm_egg_production
    for (const eg of eggs) {
      const ts = new Date(eg.date).getTime()
      timeline.push({
        id: `egg-${eg.id}`,
        iconType: 'producao',
        actionLabel: 'Produção',
        description: `${eg.collected} ovos coletados`,
        relatedEntity: eg.lotName ? `Lote ${eg.lotName}` : undefined,
        date: eg.date,
        formattedRelativeDate: formatRelativeActivityDate(eg.date),
        timestamp: isNaN(ts) ? 0 : ts,
      })
    }

    // farm_sales
    for (const s of sales) {
      const ts = new Date(s.date).getTime()
      timeline.push({
        id: `sale-${s.id}`,
        iconType: 'venda',
        actionLabel: 'Venda',
        description: `R$ ${Number(s.totalPrice || 0).toFixed(2)} — ${s.product || 'Produto'}`,
        relatedEntity: s.customerName || undefined,
        date: s.date,
        formattedRelativeDate: formatRelativeActivityDate(s.date),
        timestamp: isNaN(ts) ? 0 : ts,
      })
    }

    // farm_expenses
    for (const exp of expenses) {
      const ts = new Date(exp.date).getTime()
      timeline.push({
        id: `exp-${exp.id}`,
        iconType: 'despesa',
        actionLabel: 'Despesa',
        description: `R$ ${Number(exp.totalValue || 0).toFixed(2)} — ${exp.description}`,
        relatedEntity: exp.lotName ? `Lote ${exp.lotName}` : exp.category || undefined,
        date: exp.date,
        formattedRelativeDate: formatRelativeActivityDate(exp.date),
        timestamp: isNaN(ts) ? 0 : ts,
      })
    }

    // farm_energy
    for (const en of energyLogs) {
      const ts = new Date(en.date).getTime()
      timeline.push({
        id: `en-${en.id}`,
        iconType: 'energia',
        actionLabel: 'Leitura de energia',
        description: `${en.consumptionKwh || 0} kWh (${en.equipment || 'Geral'})`,
        relatedEntity: en.equipment || undefined,
        date: en.date,
        formattedRelativeDate: formatRelativeActivityDate(en.date),
        timestamp: isNaN(ts) ? 0 : ts,
      })
    }

    // farm_lots
    for (const lot of lots) {
      const ts = new Date(lot.startDate).getTime()
      const originInc = lot.incubationId ? incubations.find((i) => i.id === lot.incubationId) : null
      const desc = originInc
        ? `🐔 Lote ${lot.code} criado de ${originInc.code} (${lot.initialQuantity} aves)`
        : `${lot.code} - ${lot.name} (${lot.initialQuantity} aves)`

      timeline.push({
        id: `lot-${lot.id}`,
        iconType: 'lote',
        actionLabel: originInc ? 'Lote de Incubação' : 'Novo lote',
        description: desc,
        relatedEntity: lot.breed || undefined,
        date: lot.startDate,
        formattedRelativeDate: formatRelativeActivityDate(lot.startDate),
        timestamp: isNaN(ts) ? 0 : ts,
      })
    }

    // farm_incubations
    for (const inc of incubations) {
      if ((inc.hatchedCount || 0) > 0) {
        const isFinalized = inc.status === 'Concluído'
        const incDate = inc.endDate || inc.expectedHatchDate || inc.startDate
        const ts = new Date(incDate).getTime()
        const desc = isFinalized
          ? `🐣 ${inc.healthyChicks || inc.hatchedCount} pintinhos nasceram — ${inc.code}`
          : `${inc.hatchedCount} pintinhos nascidos`

        timeline.push({
          id: `inc-hatch-${inc.id}`,
          iconType: 'nascimento',
          actionLabel: isFinalized ? 'Incubação Finalizada' : 'Nascimento',
          description: desc,
          relatedEntity: inc.incubatorName || inc.code,
          date: incDate,
          formattedRelativeDate: formatRelativeActivityDate(incDate),
          timestamp: isNaN(ts) ? 0 : ts,
        })
      }
    }

    // farm_vaccinations
    for (const vac of vaccinations) {
      if (vac.status === 'performed') {
        const dateStr = vac.performed_date || vac.scheduled_date || todayStr
        const ts = new Date(dateStr).getTime()
        const lot = lots.find((l) => l.id === vac.lot_id)
        timeline.push({
          id: `vac-${vac.id}`,
          iconType: 'sanidade' as any,
          actionLabel: '💉 Vacinação realizada',
          description: `${vac.vaccine_name}${vac.disease_target ? ` (${vac.disease_target})` : ''}`,
          relatedEntity: lot ? `Lote ${lot.name}` : undefined,
          date: dateStr,
          formattedRelativeDate: formatRelativeActivityDate(dateStr),
          timestamp: isNaN(ts) ? 0 : ts,
        })
      }
    }

    // farm_treatments
    for (const trt of treatments) {
      const dateStr = trt.start_date || todayStr
      const ts = new Date(dateStr).getTime()
      const lot = lots.find((l) => l.id === trt.lot_id)
      timeline.push({
        id: `trt-${trt.id}`,
        iconType: 'sanidade' as any,
        actionLabel: `💊 Tratamento ${trt.status === 'completed' ? 'concluído' : 'iniciado'}`,
        description: `${trt.medication_name}${trt.diagnosis_reason ? ` — ${trt.diagnosis_reason}` : ''}`,
        relatedEntity: lot ? `Lote ${lot.name}` : undefined,
        date: dateStr,
        formattedRelativeDate: formatRelativeActivityDate(dateStr),
        timestamp: isNaN(ts) ? 0 : ts,
      })
    }

    // farm_health_occurrences
    for (const occ of healthOccurrences) {
      const dateStr = occ.occurrence_date ? occ.occurrence_date.split('T')[0] : todayStr
      const ts = new Date(dateStr).getTime()
      const lot = lots.find((l) => l.id === occ.lot_id)
      const typeDesc =
        occ.occurrence_type === 'other' ? occ.custom_type || 'Outro' : occ.occurrence_type
      timeline.push({
        id: `occ-${occ.id}`,
        iconType: 'sanidade' as any,
        actionLabel: '⚠️ Ocorrência registrada',
        description: `${typeDesc} (${occ.affected_count || 1} aves)`,
        relatedEntity: lot ? `Lote ${lot.name}` : undefined,
        date: dateStr,
        formattedRelativeDate: formatRelativeActivityDate(dateStr),
        timestamp: isNaN(ts) ? 0 : ts,
      })
    }

    // Sort descending by timestamp / date
    timeline.sort((a, b) => b.timestamp - a.timestamp || b.date.localeCompare(a.date))
    return timeline.slice(0, 15)
  }, [
    mortality,
    feedLogs,
    weighings,
    eggs,
    sales,
    expenses,
    energyLogs,
    lots,
    incubations,
    vaccinations,
    treatments,
    healthOccurrences,
    todayStr,
  ])

  // 11. RESUMO DOS LOTES (ATÉ 5 ATIVOS)
  const topActiveLots = useMemo(() => {
    return activeLots.slice(0, 5).map((lot) => {
      const act = activities.find((a) => a.id === lot.activityId)
      const startDate = new Date(lot.startDate)
      const ageDays = Math.max(
        0,
        Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) +
          (lot.initialAgeDays || 0),
      )

      const lotMortalityList = mortality.filter((m) => m.lotId === lot.id)
      const totalMortality = lotMortalityList.reduce((acc, m) => acc + (Number(m.quantity) || 0), 0)
      const initialQty = Number(lot.initialQuantity) || 0
      const mortalityPercent = initialQty > 0 ? (totalMortality / initialQty) * 100 : 0

      const lotExpenses = expenses.filter((e) => e.lotId === lot.id)
      const expCost = lotExpenses.reduce((acc, e) => acc + (Number(e.totalValue) || 0), 0)

      const lotFeed = feedLogs.filter((f) => f.lotId === lot.id)
      const feedCost = lotFeed.reduce((acc, f) => acc + (Number(f.totalCost) || 0), 0)

      const totalAccumulatedCost = expCost + feedCost + (Number(lot.acquisitionCost) || 0)

      return {
        ...lot,
        activityName: act?.name || 'Sem atividade',
        ageDays,
        hasMortalityData: lotMortalityList.length > 0,
        mortalityPercent,
        totalAccumulatedCost,
      }
    })
  }, [activeLots, activities, mortality, expenses, feedLogs])

  // 12. RESUMO DE INCUBAÇÕES ATIVAS
  const detailedActiveIncubations = useMemo(() => {
    return activeIncubations.map((inc) => {
      const startDate = new Date(inc.startDate)
      const diffTime = Date.now() - startDate.getTime()
      const currentDay = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1)
      const totalCycle = 21

      // Candling / Fertile eggs
      const incCandlings = candlings.filter((c) => c.incubationId === inc.id)
      const lastCandling = incCandlings.sort((a, b) => b.day - a.day)[0]
      const fertileCount = lastCandling ? lastCandling.fertile : undefined

      const hatchedCount = inc.hatchedCount || 0
      const hatchRate =
        fertileCount && fertileCount > 0
          ? (hatchedCount / fertileCount) * 100
          : inc.eggCount > 0
            ? (hatchedCount / inc.eggCount) * 100
            : undefined

      let nextMilestone = 'Em desenvolvimento'
      if (currentDay >= 18 && currentDay < 21) {
        nextMilestone = currentDay === 18 ? 'Lockdown hoje' : 'Em lockdown'
      } else if (currentDay >= 21 || inc.expectedHatchDate <= todayStr) {
        nextMilestone = `Nascimento previsto: ${inc.expectedHatchDate}`
      } else {
        nextMilestone = `Nascimento em ${inc.expectedHatchDate}`
      }

      return {
        ...inc,
        currentDay,
        totalCycle,
        fertileCount,
        hatchedCount,
        hatchRate,
        nextMilestone,
      }
    })
  }, [activeIncubations, candlings, todayStr])

  // 13. ESTOQUE CRÍTICO DETALHADO
  const detailedCriticalStock = useMemo(() => {
    return criticalStockItems.map((item) => {
      const avgDaily = feedAverageConsumptionLast7DaysByItem[item.id] || 0
      const current = Number(item.currentStock) || 0
      const estimatedDays = avgDaily > 0 ? Math.ceil(current / avgDaily) : null
      return {
        ...item,
        avgDaily,
        estimatedDays,
      }
    })
  }, [criticalStockItems, feedAverageConsumptionLast7DaysByItem])

  return {
    propertyName,
    todayFormatted: new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    // KPIs data
    kpis: {
      activeLotsCount: activeLots.length,
      hasLots: lots.length > 0,
      totalBirdsAlive,
      activeIncubationsCount: activeIncubations.length,
      hasIncubations: incubations.length > 0,
      birthsToday,
      hasBirthsToday: birthsToday > 0,
      mortalityToday,
      hasMortalityToday: hasMortalityTodayRecords,
      feedConsumedTodayKg,
      hasFeedConsumedToday: hasFeedConsumedTodayRecords,
      monthlyRevenue,
      hasMonthlySales: monthlySales.length > 0,
      monthlyOpex,
      hasMonthlyExpenses: monthlyExpenses.length > 0,
      monthlyOperationalResult,
      criticalStockCount: criticalStockItems.length,
      hasCriticalStock: criticalStockItems.length > 0,
    },
    attentionAlerts,
    recentActivities,
    // Conditional actions
    hasActiveIncubations: activeIncubations.length > 0,
    hasMonthlySales: monthlySales.length > 0,
    // Financial Summary
    financialSummary: {
      revenue: monthlyRevenue,
      opex: monthlyOpex,
      operationalResult: monthlyOperationalResult,
      capex: monthlyCapexFromStructures,
      cashFlow: monthlyCashFlow,
      hasData: monthlySales.length > 0 || monthlyExpenses.length > 0 || structures.length > 0,
    },
    // Sections
    topActiveLots,
    hasLotsData: lots.length > 0,
    detailedActiveIncubations,
    detailedCriticalStock,
    vaccinations,
    treatments,
    healthOccurrences,
  }
}
