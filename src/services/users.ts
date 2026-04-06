import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export const getUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Profile[]
}

export const updateUserStatus = async (id: string, status: string, adminId: string) => {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
  if (error) throw error

  await supabase.from('audit_logs').insert({
    user_id: adminId,
    action: `Alterou o status do usuário (ID: ${id}) para ${status}`,
  })
}

export const updateUserRole = async (
  id: string,
  role: Database['public']['Enums']['user_role'],
  adminId: string,
) => {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) throw error

  await supabase.from('audit_logs').insert({
    user_id: adminId,
    action: `Alterou a permissão do usuário (ID: ${id}) para ${role}`,
  })
}

export const inviteUser = async (email: string, role: string) => {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: { email, role },
  })
  if (error) throw error
  return data
}
