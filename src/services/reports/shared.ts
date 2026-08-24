import { supabase } from '@/lib/supabase/client'

export interface ProfileInfo {
  id: string
  name: string | null
}

export async function fetchProfiles(): Promise<ProfileInfo[]> {
  const { data, error } = await supabase.from('profiles').select('id, name')
  if (error) throw error
  return data || []
}

export function withDateFilter(query: any, column: string, startDate?: string, endDate?: string) {
  if (startDate) query = query.gte(column, startDate)
  if (endDate) query = query.lte(column, endDate + 'T23:59:59.999Z')
  return query
}

export function withUserFilter(query: any, userId?: string) {
  if (userId) return query.eq('user_id', userId)
  return query
}
