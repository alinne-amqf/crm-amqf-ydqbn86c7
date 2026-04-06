import { supabase } from '@/lib/supabase/client'
import { Opportunity, PipelineStage } from '@/lib/types'

export const opportunitiesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('opportunities' as any)
      .select('*, customer:customers(name)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      estimatedValue: Number(item.estimated_value),
      stage: item.stage as PipelineStage,
      customerId: item.customer_id,
      userId: item.user_id,
      customerName: item.customer?.name || 'Cliente Desconhecido',
      createdAt: item.created_at,
    })) as Opportunity[]
  },

  async updateStage(id: string, stage: PipelineStage) {
    const { error } = await supabase
      .from('opportunities' as any)
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  async create(data: {
    title: string
    estimated_value: number
    stage: PipelineStage
    customer_id: string
    user_id: string
    description?: string
    expected_close_date?: string | null
  }) {
    const { error } = await supabase.from('opportunities' as any).insert([data])

    if (error) throw error
  },

  async getCustomers() {
    const { data, error } = await supabase.from('customers').select('id, name').order('name')

    if (error) throw error

    return (data || []) as { id: string; name: string }[]
  },
}
