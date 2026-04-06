import { supabase } from '@/lib/supabase/client'

export interface AuditLog {
  id: string
  action: string
  created_at: string
  user_id: string
  profiles: {
    name: string | null
    email: string
  } | null
}

export const getAuditLogs = async () => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      created_at,
      user_id,
      profiles:user_id (name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data as unknown as AuditLog[]
}

export const logAuditAction = async (action: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('audit_logs').insert({
    user_id: user.id,
    action,
  })
  if (error) throw error
}
