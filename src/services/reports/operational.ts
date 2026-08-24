import { supabase } from '@/lib/supabase/client'
import { withDateFilter, fetchProfiles } from './shared'

export interface TaskSummaryItem {
  vendorName: string
  taskType: string
  pendingCount: number
  overdueCount: number
}
export interface AuditLogItem {
  id: string
  tableName: string
  recordId: string
  action: string
  oldData: any
  newData: any
  changedBy: string
  changedAt: string
}

export async function getTaskSummaryByVendor(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<{ items: TaskSummaryItem[]; totalPending: number; totalOverdue: number }> {
  let q = supabase.from('tasks').select('user_id, type, status, due_date')
  q = withDateFilter(q, 'due_date', startDate, endDate)
  if (userId) q = q.eq('user_id', userId)
  const { data, error } = await q
  if (error) throw error
  const profiles = await fetchProfiles()
  const now = new Date()
  const grouped: Record<string, { pending: number; overdue: number }> = {}
  let totalPending = 0,
    totalOverdue = 0
  ;(data || []).forEach((t: any) => {
    if (t.status === 'completed') return
    const key = `${t.user_id}__${t.type}`
    if (!grouped[key]) grouped[key] = { pending: 0, overdue: 0 }
    grouped[key].pending++
    totalPending++
    if (t.due_date && new Date(t.due_date) < now) {
      grouped[key].overdue++
      totalOverdue++
    }
  })
  const items: TaskSummaryItem[] = Object.entries(grouped).map(([key, v]) => {
    const [uid, type] = key.split('__')
    return {
      vendorName: profiles.find((p) => p.id === uid)?.name || 'Desconhecido',
      taskType: type || 'other',
      pendingCount: v.pending,
      overdueCount: v.overdue,
    }
  })
  return { items, totalPending, totalOverdue }
}

export async function getAuditLogs(filters: {
  tableName?: string
  action?: string
  changedBy?: string
  startDate?: string
  endDate?: string
}): Promise<AuditLogItem[]> {
  let q = supabase.from('change_logs').select('*, profiles!change_logs_changed_by_fkey(name)')
  if (filters.tableName) q = q.eq('table_name', filters.tableName)
  if (filters.action) q = q.eq('action', filters.action)
  if (filters.changedBy) q = q.eq('changed_by', filters.changedBy)
  q = withDateFilter(q, 'changed_at', filters.startDate, filters.endDate)
  const { data, error } = await q.order('changed_at', { ascending: false }).limit(500)
  if (error) throw error
  return (data || []).map((l: any) => ({
    id: l.id,
    tableName: l.table_name,
    recordId: l.record_id,
    action: l.action,
    oldData: l.old_data,
    newData: l.new_data,
    changedBy: l.profiles?.name || 'Sistema',
    changedAt: l.changed_at,
  }))
}
