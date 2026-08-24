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
    previousStage?: PipelineStage,
    notes?: string | null,
  ) {
    const { error } = await supabase
      .from('opportunities' as any)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    if (data.stage && previousStage && data.stage !== previousStage && userId) {
      await supabase.from('opportunity_stage_history' as any).insert([
        {
          opportunity_id: id,
          previous_stage: previousStage,
          new_stage: data.stage,
          user_id: userId,
          notes: notes || null,
        },
      ])
    }

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

  async updateStage(
    id: string,
    stage: PipelineStage,
    previousStage?: PipelineStage,
    lossReason?: string | null,
    notes?: string | null,
    _userId?: string,
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token = session?.access_token
    if (!token) {
      throw new Error('Sessão expirada ou usuário não autenticado.')
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL || 'https://eozovkvzulvytxypyqpe.supabase.co'}/functions/v1/update-opportunity-stage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          opportunity_id: id,
          new_stage: stage,
          notes: notes || undefined,
          loss_reason: stage === 'Fechado/Perdido' ? lossReason || undefined : undefined,
        }),
      },
    )

    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      const errorMessage =
        result?.error || `Erro ao atualizar estágio da oportunidade (${response.status})`
      throw new Error(errorMessage)
    }

    return result
  },

  async getHistory(opportunityId: string) {
    const { data, error } = await supabase
      .from('opportunity_stage_history' as any)
      .select('*, user:profiles(name)')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((item: any) => ({
      id: item.id,
      opportunityId: item.opportunity_id,
      previousStage: item.previous_stage,
      newStage: item.new_stage,
      userId: item.user_id,
      userName: item.user?.name || 'Sistema',
      createdAt: item.created_at,
      notes: item.notes,
    }))
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
