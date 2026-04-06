export type CustomerStatus = 'Ativo' | 'Lead' | 'Inativo'

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
