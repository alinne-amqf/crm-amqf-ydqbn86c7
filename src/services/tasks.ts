import { supabase } from '@/lib/supabase/client'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'Alta' | 'Media' | 'Baixa'
export type TaskType = 'call' | 'email' | 'meeting' | 'other'

export interface Task {
  id: string
  title: string
  description?: string | null
  due_date: string
  status: TaskStatus
  type: TaskType
  priority: TaskPriority
  customer_id: string
  user_id: string
  created_at: string
  updated_at: string
  customers?: {
    name: string
    company?: string | null
  }
}

const logAudit = async (action: string) => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      await supabase.from('audit_logs').insert([
        {
          user_id: userData.user.id,
          action,
          status: 'success',
        },
      ])
    }
  } catch (error) {
    console.error('Failed to log audit:', error)
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

  await logAudit(`Criou a tarefa: ${task.title}`)
  return data as any
}

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const { data: oldData } = await supabase
    .from('tasks')
    .select('title, status')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (oldData && oldData.status !== 'completed' && updates.status === 'completed') {
    await logAudit(`Concluiu a tarefa: ${data.title}`)
  } else {
    await logAudit(`Editou a tarefa: ${data.title}`)
  }

  return data as any
}

export const deleteTask = async (id: string): Promise<void> => {
  const { data: oldData } = await supabase.from('tasks').select('title').eq('id', id).single()

  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error

  if (oldData) {
    await logAudit(`Excluiu a tarefa: ${oldData.title}`)
  }
}
