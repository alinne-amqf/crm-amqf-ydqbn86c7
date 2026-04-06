import { supabase } from '@/lib/supabase/client'
import { Profile, UserRole } from '@/lib/types'

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
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  })) as Profile[]
}

export const updateProfileRole = async (id: string, role: UserRole) => {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)

  if (error) throw error
}
