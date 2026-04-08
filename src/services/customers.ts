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
    customerType: d.customer_type || 'B2C',
    document: d.document,
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
    customerType: data.customer_type || 'B2C',
    document: data.document,
    createdAt: data.created_at,
  } as Customer
}

export const updateCustomer = async (
  id: string,
  customer: Partial<Omit<Customer, 'id' | 'createdAt'>>,
) => {
  const updateData: any = { ...customer }
  if (customer.customerType) updateData.customer_type = customer.customerType
  delete updateData.customerType

  const { data, error } = await supabase
    .from('customers')
    .update(updateData)
    .eq('id', id)
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
    customerType: data.customer_type || 'B2C',
    document: data.document,
    createdAt: data.created_at,
  } as Customer
}

export const deleteCustomer = async (id: string) => {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
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
        customer_type: customer.customerType,
        document: customer.document,
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
    customerType: data.customer_type,
    document: data.document,
    createdAt: data.created_at,
  } as Customer
}
