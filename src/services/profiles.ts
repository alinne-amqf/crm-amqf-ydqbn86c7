import { supabase } from '@/lib/supabase/client'

export type UserRole = 'Admin' | 'Gerente' | 'Vendedor' | 'admin' | 'gerente' | 'vendedor' | string

export interface Profile {
  id: string
  email: string
  name: string | null
  role: UserRole
  status: string
  createdAt: string
  updatedAt: string
}

export const getProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map((d: any) => ({
    id: d.id,
    email: d.email,
    name: d.name,
    role: d.role,
    status: d.status || 'Ativo',
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  })) as Profile[]
}

export const updateProfileRole = async (id: string, role: UserRole, targetName: string) => {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: `Alterou o papel do usuário ${targetName || 'Desconhecido'} para ${role}`,
    })
  }
}

export const updateProfileStatus = async (id: string, status: string, targetName: string) => {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: `Alterou o status do usuário ${targetName || 'Desconhecido'} para ${status}`,
    })
  }
}

export const inviteUser = async (email: string, role: UserRole) => {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: { email, role },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}
