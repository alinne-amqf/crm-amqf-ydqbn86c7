import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row'] & { avatar?: string | null }

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
  if (data?.error) throw new Error(data.error)
  return data
}

export const resendInvite = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('resend-invite', {
    body: { user_id: userId },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export const deactivateUser = async (
  id: string,
  adminId: string,
  ipAddress: string = 'Desconhecido',
) => {
  const { error } = await supabase.from('profiles').update({ status: 'Inativo' }).eq('id', id)
  if (error) throw error

  await supabase.from('audit_logs').insert({
    user_id: adminId,
    action: `user_deactivated - IP Origem: ${ipAddress} - Usuário ID: ${id}`,
  })
}

export const updateUserProfile = async (
  id: string,
  data: {
    name: string
    email: string
    role: Database['public']['Enums']['user_role']
    status: string
  },
  file: File | null,
  adminId: string,
  ipAddress: string = 'Desconhecido',
) => {
  let avatarUrl = undefined

  if (file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${id}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName)

    avatarUrl = publicUrlData.publicUrl
  }

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
    status: data.status,
  }

  if (avatarUrl !== undefined) {
    updateData.avatar = avatarUrl
  }

  const { error } = await supabase.from('profiles').update(updateData).eq('id', id)
  if (error) throw error

  await supabase.from('audit_logs').insert({
    user_id: adminId,
    action: `Atualizou o perfil do usuário (ID: ${id}) - IP Origem: ${ipAddress}`,
  })
}
