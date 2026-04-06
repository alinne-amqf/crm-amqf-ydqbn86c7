import { supabase } from '@/lib/supabase/client'
import { Interaction } from '@/lib/types'

export const getInteractionsByCustomer = async (customerId: string) => {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('date', { ascending: false })

  if (error) throw error

  return data.map((d: any) => ({
    id: d.id,
    customerId: d.customer_id,
    type: d.type,
    date: d.date,
    description: d.description,
  })) as Interaction[]
}

export const createInteraction = async (interaction: Omit<Interaction, 'id'>) => {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('interactions')
    .insert([
      {
        customer_id: interaction.customerId,
        user_id: userData.user.id,
        type: interaction.type,
        date: interaction.date,
        description: interaction.description,
      },
    ])
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    customerId: data.customer_id,
    type: data.type,
    date: data.date,
    description: data.description,
  } as Interaction
}
