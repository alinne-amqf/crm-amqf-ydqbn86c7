import { supabase } from '@/lib/supabase/client'
import { withDateFilter, withUserFilter } from './shared'

export interface StatusDistribution {
  status: string
  count: number
}
export interface TypeDistribution {
  type: string
  count: number
}
export interface StatusEvolution {
  month: string
  leads: number
  clients: number
}
export interface ConversionTimeItem {
  customerName: string
  leadDate: string
  clientDate: string
  daysToConvert: number
}

export async function getStatusDistribution(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<StatusDistribution[]> {
  let q = supabase.from('customers').select('status')
  q = withDateFilter(q, 'created_at', startDate, endDate)
  q = withUserFilter(q, userId)
  const { data, error } = await q
  if (error) throw error
  const grouped: Record<string, number> = {}
  ;(data || []).forEach((c: any) => {
    const s = c.status || 'Sem Status'
    grouped[s] = (grouped[s] || 0) + 1
  })
  return Object.entries(grouped).map(([status, count]) => ({ status, count }))
}

export async function getTypeDistribution(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<TypeDistribution[]> {
  let q = supabase.from('customers').select('customer_type')
  q = withDateFilter(q, 'created_at', startDate, endDate)
  q = withUserFilter(q, userId)
  const { data, error } = await q
  if (error) throw error
  const grouped: Record<string, number> = {}
  ;(data || []).forEach((c: any) => {
    const t = c.customer_type || 'B2C'
    grouped[t] = (grouped[t] || 0) + 1
  })
  return Object.entries(grouped).map(([type, count]) => ({ type, count }))
}

export async function getStatusEvolution(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<StatusEvolution[]> {
  let q = supabase.from('customers').select('status, created_at')
  q = withDateFilter(q, 'created_at', startDate, endDate)
  q = withUserFilter(q, userId)
  const { data, error } = await q
  if (error) throw error
  const grouped: Record<string, { leads: number; clients: number }> = {}
  ;(data || []).forEach((c: any) => {
    const month = c.created_at?.substring(0, 7)
    if (!month) return
    if (!grouped[month]) grouped[month] = { leads: 0, clients: 0 }
    if (c.status === 'Lead') grouped[month].leads++
    else if (c.status === 'Cliente' || c.status === 'Ativo') grouped[month].clients++
  })
  return Object.entries(grouped)
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export async function getAvgConversionTime(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<{ items: ConversionTimeItem[]; avgDays: number }> {
  let cq = supabase
    .from('change_logs')
    .select('record_id, old_data, new_data, changed_at')
    .eq('table_name', 'customers')
  cq = withDateFilter(cq, 'changed_at', startDate, endDate)
  const { data: logs, error } = await cq
  if (error) throw error

  const conversions = (logs || []).filter((l: any) => {
    const oldData = l.old_data
    const newData = l.new_data
    if (typeof oldData !== 'object' || oldData === null) return false
    if (typeof newData !== 'object' || newData === null) return false
    return oldData.status === 'Lead' && newData.status && newData.status !== 'Lead'
  })

  if (conversions.length === 0) return { items: [], avgDays: 0 }

  const recordIds = [...new Set(conversions.map((c: any) => c.record_id))]
  let custQ = supabase.from('customers').select('id, name, created_at, user_id').in('id', recordIds)
  if (userId) custQ = custQ.eq('user_id', userId)
  const { data: customers } = await custQ

  const customerMap: Record<string, any> = {}
  ;(customers || []).forEach((c: any) => {
    customerMap[c.id] = c
  })

  const items: ConversionTimeItem[] = []
  conversions.forEach((conv: any) => {
    const customer = customerMap[conv.record_id]
    if (!customer) return
    const leadDate = customer.created_at
    const clientDate = conv.changed_at
    const days = Math.round(
      (new Date(clientDate).getTime() - new Date(leadDate).getTime()) / (1000 * 60 * 60 * 24),
    )
    items.push({
      customerName: customer.name || 'Desconhecido',
      leadDate,
      clientDate,
      daysToConvert: days,
    })
  })

  const avgDays =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.daysToConvert, 0) / items.length)
      : 0
  return { items, avgDays }
}
