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
      description: item.description,
      expectedCloseDate: item.expected_close_date,
      lossReason: item.loss_reason,
    })) as Opportunity[]
  },

  async update(
    id: string,
    data: Partial<{
      title: string
      estimated_value: number
      stage: PipelineStage
      customer_id: string
      description?: string
      expected_close_date?: string | null
      loss_reason?: string | null
    }>,
    userId?: string,
  ) {
    const { error } = await supabase
      .from('opportunities' as any)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    if (data.stage === 'Fechado/Perdido' && data.loss_reason && userId) {
      await supabase.from('audit_logs').insert([
        {
          user_id: userId,
          action: `Oportunidade marcada como Perdida. Motivo: ${data.loss_reason}`,
          status: 'success',
        },
      ])
    }
  },

  async updateStage(id: string, stage: PipelineStage, lossReason?: string | null, userId?: string) {
    const updateData: any = { stage, updated_at: new Date().toISOString() }
    if (stage === 'Fechado/Perdido' && lossReason) {
      updateData.loss_reason = lossReason
    } else if (stage !== 'Fechado/Perdido') {
      updateData.loss_reason = null
    }

    const { error } = await supabase
      .from('opportunities' as any)
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    if (stage === 'Fechado/Perdido' && lossReason && userId) {
      await supabase.from('audit_logs').insert([
        {
          user_id: userId,
          action: `Oportunidade movida para Perdida. Motivo: ${lossReason}`,
          status: 'success',
        },
      ])
    }
  },

  async create(data: {
    title: string
    estimated_value: number
    stage: PipelineStage
    customer_id: string
    user_id: string
    description?: string
    expected_close_date?: string | null
    loss_reason?: string | null
  }) {
    const { error } = await supabase.from('opportunities' as any).insert([data])

    if (error) throw error

    if (data.stage === 'Fechado/Perdido' && data.loss_reason) {
      await supabase.from('audit_logs').insert([
        {
          user_id: data.user_id,
          action: `Oportunidade criada como Perdida. Motivo: ${data.loss_reason}`,
          status: 'success',
        },
      ])
    }
  },

  async getCustomers() {
    const { data, error } = await supabase.from('customers').select('id, name').order('name')

    if (error) throw error

    return (data || []) as { id: string; name: string }[]
  },
}
