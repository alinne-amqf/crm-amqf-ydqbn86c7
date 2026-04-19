export type UserRole = 'Admin' | 'Gerente' | 'Vendedor'

export interface Profile {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
  first_login_pending: boolean
  has_accessed: boolean
  temporary_password_hash: string | null
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  status: string
  customerType: 'B2B' | 'B2C'
  document: string | null
  createdAt: string
}

export interface Interaction {
  id: string
  customerId: string
  userId: string
  type: string
  date: string
  description: string
  createdAt: string
}

export type PipelineStage =
  | 'Prospecção'
  | 'Qualificação'
  | 'Proposta'
  | 'Negociação'
  | 'Fechado/Ganho'
  | 'Fechado/Perdido'

export interface Opportunity {
  id: string
  title: string
  estimatedValue: number
  customerNa