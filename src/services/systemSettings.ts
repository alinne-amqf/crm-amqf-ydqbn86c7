import { supabase } from '@/lib/supabase/client'

export type SystemSettings = {
  id: string
  system_name: string
  timezone: string
  language: string
}

export const getSystemSettings = async () => {
  const { data, error } = await supabase.from('system_settings').select('*').limit(1).maybeSingle()
  if (error) {
    console.error('Error fetching system settings:', error)
    return null
  }
  return data as SystemSettings | null
}

export const updateSystemSettings = async (id: string, updates: Partial<SystemSettings>) => {
  const { data, error } = await supabase
    .from('system_settings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
