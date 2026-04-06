import { supabase } from '@/lib/supabase/client'

export const getAuditLogs = async () => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, profiles!audit_logs_user_id_fkey(name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}
