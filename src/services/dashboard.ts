import { supabase } from '@/lib/supabase/client'

export const dashboardService = {
  async getDashboardData() {
    const [oppsRes, tasksRes, customersRes] = await Promise.all([
      supabase.from('opportunities').select('id, stage, estimated_value'),
      supabase.from('tasks').select('id, status, due_date'),
      supabase.from('customers').select('id, status'),
    ])

    const opps = oppsRes.data || []
    const tasks = tasksRes.data || []
    const customers = customersRes.data || []

    let pipelineValue = 0
    const stageCounts: Record<string, number> = {}
    let won = 0
    let lost = 0

    opps.forEach((o) => {
      const stage = o.stage || 'Sem Etapa'
      stageCounts[stage] = (stageCounts[stage] || 0) + 1

      if (stage === 'Fechado/Ganho') {
        won++
      } else if (stage === 'Fechado/Perdido') {
        lost++
      } else {
        pipelineValue += Number(o.estimated_value) || 0
      }
    })

    const opportunitiesByStage = Object.entries(stageCounts).map(([stage, count]) => ({
      stage,
      count,
      fill: 'hsl(var(--primary))',
    }))

    const conversionData = [
      { name: 'Ganho', value: won, fill: '#10b981' },
      { name: 'Perdido', value: lost, fill: '#ef4444' },
    ]

    const now = new Date()
    let pendingCount = 0
    let overdueCount = 0

    tasks.forEach((t) => {
      if (t.status !== 'completed') {
        pendingCount++
        if (new Date(t.due_date) < now) {
          overdueCount++
        }
      }
    })

    const tasksSummary = { pending: pendingCount, overdue: overdueCount }

    const statusCounts: Record<string, number> = {}
    customers.forEach((c) => {
      const status = c.status || 'Sem Status'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    const statusColors: Record<string, string> = {
      Ativo: '#10b981',
      Lead: '#6366f1',
      Inativo: '#94a3b8',
    }

    const customersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      fill: statusColors[status] || '#cbd5e1',
    }))

    return {
      pipelineValue,
      opportunitiesByStage,
      conversionData,
      tasksSummary,
      customersByStatus,
    }
  },
}
