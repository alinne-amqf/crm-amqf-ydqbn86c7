import { supabase } from '@/lib/supabase/client'
import { withDateFilter, withUserFilter } from './shared'

export interface PipelineStageData {
  stage: string
  count: number
  totalValue: number
}
export interface ConversionData {
  won: number
  lost: number
  conversionRate: number
}
export interface LossReasonData {
  lossReason: string
  count: number
}
export interface RevenueForecastItem {
  title: string
  customerName: string
  stage: string
  estimatedValue: number
  expectedCloseDate: string | null
}

export async function getPipelineByPeriod(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<PipelineStageData[]> {
  let q = supabase.from('opportunities').select('stage, estimated_value')
  q = withDateFilter(q, 'created_at', startDate, endDate)
  q = withUserFilter(q, userId)
  const { data, error } = await q
  if (error) throw error
  const grouped: Record<string, PipelineStageData> = {}
  ;(data || []).forEach((o: any) => {
    const s = o.stage || 'Sem Etapa'
    if (!grouped[s]) grouped[s] = { stage: s, count: 0, totalValue: 0 }
    grouped[s].count++
    grouped[s].totalValue += Number(o.estimated_value) || 0
  })
  return Object.values(grouped)
}

export async function getConversionRate(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<ConversionData> {
  let q = supabase.from('opportunities').select('stage')
  q = withDateFilter(q, 'created_at', startDate, endDate)
  q = withUserFilter(q, userId)
  const { data, error } = await q
  if (error) throw error
  let won = 0,
    lost = 0
  ;(data || []).forEach((o: any) => {
    if (o.stage === 'Fechado/Ganho') won++
    else if (o.stage === 'Fechado/Perdido') lost++
  })
  const total = won + lost
  return { won, lost, conversionRate: total > 0 ? (won / total) * 100 : 0 }
}

export async function getLossReasons(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<LossReasonData[]> {
  let q = supabase.from('opportunities').select('loss_reason').eq('stage', 'Fechado/Perdido')
  q = withDateFilter(q, 'created_at', startDate, endDate)
  q = withUserFilter(q, userId)
  const { data, error } = await q
  if (error) throw error
  const grouped: Record<string, number> = {}
  ;(data || []).forEach((o: any) => {
    const r = o.loss_reason || 'Não informado'
    grouped[r] = (grouped[r] || 0) + 1
  })
  return Object.entries(grouped)
    .map(([lossReason, count]) => ({ lossReason, count }))
    .sort((a, b) => b.count - a.count)
}

export async function getRevenueForecast(
  startDate?: string,
  endDate?: string,
  userId?: string,
): Promise<RevenueForecastItem[]> {
  let q = supabase
    .from('opportunities')
    .select('title, stage, estimated_value, expected_close_date, customer:customers(name)')
    .in('stage', ['Negociação', 'Proposta'])
  q = withDateFilter(q, 'expected_close_date', startDate, endDate)
  q = withUserFilter(q, userId)
  const { data, error } = await q
  if (error) throw error
  return (data || []).map((o: any) => ({
    title: o.title,
    customerName: o.customer?.name || 'Desconhecido',
    stage: o.stage,
    estimatedValue: Number(o.estimated_value) || 0,
    expectedCloseDate: o.expected_close_date,
  }))
}
