import { supabase } from '@/lib/supabase/client'

export type TaskStatus = 'pending' | 'completed'
export type TaskType = 'call' | 'email' | 'meeting' | 'other'

export interface Task {
  id: string
  title: string
  description?: string | null
  due_date: string
  status: TaskStatus
  type: TaskType
  customer_id: string
  user_id: string
  created_at: string
  updated_at: string
  customers?: {
    name: string
    company?: string | null
  }
}

export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      customers (name, company)
    `)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data as any
}

export const getTasksByCustomer = async (customerId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('customer_id', customerId)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data as any
}

export const createTask = async (task: Partial<Task>): Promise<Task> => {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...task, user_id: userData.user.id }])
    .select()
    .single()

  if (error) throw error
  return data as any
}

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as any
}

export const deleteTask = async (id: string): Promise<void> => {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
