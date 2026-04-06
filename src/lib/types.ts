export type UserRole = 'Admin' | 'Gerente' | 'Vendedor'

export interface Profile {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  status: string
  avatar: string | null
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
