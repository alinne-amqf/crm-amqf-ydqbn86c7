import { supabase } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export const dashboardService = {
  async getMetrics(period: 'month' | 'prev_month' | 'all' = 'month') {
    const now = new Date()
    let startDate: string | undefined
    let endDate: string | undefined
    let prevStartDate: string | undefined
    let prevEndDate: string | undefined

    if (period === 'month') {
      startDate = startOfMonth(now).toISOString()
      endDate = endOfMonth(now).toISOString()
      const prevMonth = subMonths(now, 1)
      prevStartDate = startOfMonth(prevMonth).toISOString()
      prevEndDate = endOfMonth(prevMonth).toISOString()
    } else if (period === 'prev_month') {
      const prevMonth = subMonths(now, 1)
      startDate = startOfMonth(prevMonth).toISOString()
      endDate = endOfMonth(prevMonth).toISOString()
      const prevPrevMonth = subMonths(now, 2)
      prevStartDate = startOfMonth(prevPrevMonth).toISOString()
      prevEndDate = endOfMonth(prevPrevMonth).toISOString()
    }

    const buildQueries = (start?: string, end?: string) => {
      let customersQuery = supabase.from('customers').select('id', { count: 'exact' })
      let oppsQuery = supabase.from('opportunities').select('estimated_value, stage, created_at')
      let tasksQuery = supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')

      if (start && end) {
        customersQuery = customersQuery.gte('created_at', start).lte('created_at', end)
        oppsQuery = oppsQuery.gte('created_at', start).lte('created_at', end)
        tasksQuery = tasksQuery.gte('due_date', start).lte('due_date', end)
      }
      return [customersQuery, oppsQuery, tasksQuery] as const
    }

    const [[customersRes, oppsRes, tasksRes], [prevCustomersRes, prevOppsRes, prevTasksRes]] =
      await Promise.all([
        Promise.all(buildQueries(startDate, endDate)),
        period !== 'all'
          ? Promise.all(buildQueries(prevStartDate, prevEndDate))
          : Promise.resolve([null, null, null]),
      ])

    const calculateValues = (opportunities: any[]) => {
      let pipeline = 0
      let won = 0
      const stages: Record<string, number> = {}

      opportunities.forEach((opp) => {
        const value = Number(opp.estimated_value) || 0
        const stage = (opp.stage || 'Sem Etapa').trim()
        const stageLower = stage.toLowerCase()

        if (
          stageLower.includes('ganho') ||
          stageLower === 'won' ||
          stageLower === 'fechado ganho'
        ) {
          won += value
        } else if (!stageLower.includes('perdid') && !stageLower.includes('lost')) {
          pipeline += value
          stages[stage] = (stages[stage] || 0) + value
        }
      })

      return { pipeline, won, stages }
    }

    const currentData = calculateValues(oppsRes.data || [])
    const prevData =
      period !== 'all' && prevOppsRes
        ? calculateValues(prevOppsRes.data || [])
        : { pipeline: 0, won: 0 }

    const calculateGrowth = (current: number, prev: number) => {
      if (period === 'all') return null
      if (prev === 0) return current > 0 ? 100 : 0
      return Math.round(((current - prev) / prev) * 100)
    }

    const funnelData = Object.keys(currentData.stages)
      .map((stage) => ({
        stage,
        value: currentData.stages[stage],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return {
      totalCustomers: customersRes.count || 0,
      customersGrowth: calculateGrowth(customersRes.count || 0, prevCustomersRes?.count || 0),
      pipelineValue: currentData.pipeline,
      pipelineGrowth: calculateGrowth(currentData.pipeline, prevData.pipeline),
      wonValue: currentData.won,
      wonGrowth: calculateGrowth(currentData.won, prevData.won),
      pendingTasks: tasksRes.count || 0,
      tasksGrowth: calculateGrowth(tasksRes.count || 0, prevTasksRes?.count || 0),
      funnelData,
    }
  },

  async getRecentOpportunities() {
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, title, estimated_value, stage, created_at, customers(name)')
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) {
      console.error('Error fetching recent opportunities:', error)
      return []
    }

    return data || []
  },

  async getUpcomingTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, due_date, type, customers(name)')
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(4)

    if (error) {
      console.error('Error fetching upcoming tasks:', error)
      return []
    }

    return data || []
  },
}
