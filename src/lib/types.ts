export type CustomerStatus = 'Ativo' | 'Lead' | 'Inativo'
export type InteractionType = 'email' | 'call' | 'meeting' | 'note'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: CustomerStatus
  avatar?: string
  createdAt: string
}

export interface Interaction {
  id: string
  customerId: string
  type: InteractionType
  date: string
  description: string
}
