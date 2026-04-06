import { supabase } from '@/lib/supabase/client'
import { Customer } from '@/lib/types'

export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    company: d.company,
    status: d.status,
    avatar: d.avatar,
    createdAt: d.created_at,
  })) as Customer[]
}

export const getCustomerById = async (id: string) => {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    status: data.status,
    avatar: data.avatar,
    createdAt: data.created_at,
  } as Customer
}

export const createCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('customers')
    .insert([
      {
        user_id: userData.user.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        status: customer.status,
        avatar: customer.avatar,
      },
    ])
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    status: data.status,
    avatar: data.avatar,
    createdAt: data.created_at,
  } as Customer
}
