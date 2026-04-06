import { supabase } from '@/lib/supabase/client'

export interface SystemSettings {
  id: string
  system_name: string
  timezone: string
  language: string
  updated_at: string
}

export const getSystemSettings = async (): Promise<SystemSettings | null> => {
  const { data, error } = await supabase.from('system_settings').select('*').limit(1).single()

  if (error) {
    console.error('Error fetching system settings:', error)
    return null
  }
  return data as SystemSettings
}

export const updateSystemSettings = async (
  id: string,
  updates: Partial<SystemSettings>,
): Promise<SystemSettings> => {
  const { data, error } = await supabase
    .from('system_settings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating system settings:', error)
    throw error
  }
  return data as SystemSettings
}
