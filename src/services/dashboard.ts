import { supabase } from '@/lib/supabase/client'
import { startOfDay, endOfDay } from 'date-fns'

export const dashboardService = {
  async getMetrics() {
    const todayStart = startOfDay(new Date()).toISOString()
    const todayEnd = endOfDay(new Date()).toISOString()

    const [customersRes, oppsRes, tasksRes] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('opportunities').select('estimated_value, stage'),
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('due_date', todayStart)
        .lte('due_date', todayEnd),
    ])

    const opportunities = oppsRes.data || []

    let pipelineValue = 0
    let wonValue = 0
    const stageCount: Record<string, number> = {}

    opportunities.forEach((opp) => {
      const value = Number(opp.estimated_value) || 0
      const stage = (opp.stage || 'Sem Etapa').trim()
      const stageLower = stage.toLowerCase()

      if (stageLower.includes('ganho') || stageLower === 'won' || stageLower === 'fechado ganho') {
        wonValue += value
      } else if (!stageLower.includes('perdid') && !stageLower.includes('lost')) {
        pipelineValue += value
        stageCount[stage] = (stageCount[stage] || 0) + value
      }
    })

    const funnelData = Object.keys(stageCount)
      .map((stage) => ({
        stage,
        value: stageCount[stage],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return {
      totalCustomers: customersRes.count || 0,
      pipelineValue,
      wonValue,
      pendingTasksToday: tasksRes.count || 0,
      funnelData,
    }
  },

  async getRecentOpportunities() {
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, title, estimated_value, stage, created_at, customers(name, avatar)')
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
