import { supabase } from '@/lib/supabase/client'
import { withDateFilter, fetchProfiles } from './shared'

export interface SalesRankingItem {
  vendorName: string
  wonCount: number
  totalWonValue: number
}
export interface ActivityByVendorItem {
  vendorName: string
  interactionsCount: number
  completedTasksCount: number
}
export interface IndividualConversionItem {
  vendorName: string
  won: number
  lost: number
  conversionRate: number
}

export async function getSalesRanking(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<SalesRankingItem[]> {
  let q = supabase
    .from('opportunities')
    .select('user_id, estimated_value')
    .eq('stage', 'Fechado/Ganho')
  q = withDateFilter(q, 'created_at', startDate, endDate)
  if (userId) q = q.eq('user_id', userId)
  const { data, error } = await q
  if (error) throw error
  const profiles = await fetchProfiles()
  const grouped: Record<string, { count: number; value: number }> = {}
  ;(data || []).forEach((o: any) => {
    if (!grouped[o.user_id]) grouped[o.user_id] = { count: 0, value: 0 }
    grouped[o.user_id].count++
    grouped[o.user_id].value += Number(o.estimated_value) || 0
  })
  return Object.entries(grouped)
    .map(([uid, v]) => ({
      vendorName: profiles.find((p) => p.id === uid)?.name || 'Desconhecido',
      wonCount: v.count,
      totalWonValue: v.value,
    }))
    .sort((a, b) => b.totalWonValue - a.totalWonValue)
}

export async function getActivitiesByVendor(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<ActivityByVendorItem[]> {
  let iq = supabase.from('interactions').select('user_id')
  iq = withDateFilter(iq, 'created_at', startDate, endDate)
  if (userId) iq = iq.eq('user_id', userId)
  const { data: interactions } = await iq

  let tq = supabase.from('tasks').select('user_id').eq('status', 'completed')
  tq = withDateFilter(tq, 'created_at', startDate, endDate)
  if (userId) tq = tq.eq('user_id', userId)
  const { data: tasks } = await tq

  const profiles = await fetchProfiles()
  const grouped: Record<string, { interactions: number; tasks: number }> = {}
  ;(interactions || []).forEach((i: any) => {
    if (!grouped[i.user_id]) grouped[i.user_id] = { interactions: 0, tasks: 0 }
    grouped[i.user_id].interactions++
  })
  ;(tasks || []).forEach((t: any) => {
    if (!grouped[t.user_id]) grouped[t.user_id] = { interactions: 0, tasks: 0 }
    grouped[t.user_id].tasks++
  })
  return Object.entries(grouped).map(([uid, v]) => ({
    vendorName: profiles.find((p) => p.id === uid)?.name || 'Desconhecido',
    interactionsCount: v.interactions,
    completedTasksCount: v.tasks,
  }))
}

export async function getIndividualConversion(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<IndividualConversionItem[]> {
  let q = supabase
    .from('opportunities')
    .select('user_id, stage')
    .in('stage', ['Fechado/Ganho', 'Fechado/Perdido'])
  q = withDateFilter(q, 'created_at', startDate, endDate)
  if (userId) q = q.eq('user_id', userId)
  const { data, error } = await q
  if (error) throw error
  const profiles = await fetchProfiles()
  const grouped: Record<string, { won: number; lost: number }> = {}
  ;(data || []).forEach((o: any) => {
    if (!grouped[o.user_id]) grouped[o.user_id] = { won: 0, lost: 0 }
    if (o.stage === 'Fechado/Ganho') grouped[o.user_id].won++
    else grouped[o.user_id].lost++
  })
  return Object.entries(grouped).map(([uid, v]) => {
    const total = v.won + v.lost
    return {
      vendorName: profiles.find((p) => p.id === uid)?.name || 'Desconhecido',
      won: v.won,
      lost: v.lost,
      conversionRate: total > 0 ? (v.won / total) * 100 : 0,
    }
  })
}
