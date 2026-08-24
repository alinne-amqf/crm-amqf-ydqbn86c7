import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SalesPipeline from '@/pages/SalesPipeline'
import { opportunitiesService } from '@/services/opportunities'
import { getCustomers } from '@/services/customers'
import { createTask } from '@/services/tasks'

// Mock useAuth
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'vendedor@amqf.com' },
    profile: { id: 'user-1', name: 'João Silva', role: 'Vendedor' },
    isAuthenticated: true,
  }),
}))

// Mock opportunities service
vi.mock('@/services/opportunities', () => ({
  opportunitiesService: {
    getAll: vi.fn(),
    updateStage: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getHistory: vi.fn(),
    getCustomers: vi.fn(),
  },
}))

// Mock customers service
vi.mock('@/services/customers', () => ({
  getCustomers: vi.fn(),
}))

// Mock tasks service
vi.mock('@/services/tasks', () => ({
  createTask: vi.fn(),
}))

// Mock Supabase client calls used inside SalesPipeline
vi.mock('@/lib/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { id: 'user-1', name: 'João Silva' },
                { id: 'user-2', name: 'Maria Santos' },
              ],
              error: null,
            }),
          }
        }
        if (table === 'tasks') {
          return {
            select: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({
                data: [{ id: 'task-1', customer_id: 'cust-1', status: 'pending' }],
                error: null,
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      }),
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: 'mock-token' } },
        }),
      },
    },
  }
})

describe('SalesPipeline Integration Tests (Fluxo Kanban)', () => {
  const mockOpportunities = [
    {
      id: 'op-1',
      title: 'Contrato Solar ABC',
      estimatedValue: 15000,
      stage: 'Prospecção',
      customerId: 'cust-1',
      userId: 'user-1',
      customerName: 'Empresa Solar ABC',
      createdAt: '2025-01-01T10:00:00Z',
      description: 'Proposta inicial de painéis',
      expectedCloseDate: '2025-06-01',
      lossReason: null,
    },
    {
      id: 'op-2',
      title: 'Consultoria Energética XYZ',
      estimatedValue: 28000,
      stage: 'Qualificação',
      customerId: 'cust-2',
      userId: 'user-1',
      customerName: 'Indústria XYZ',
      createdAt: '2025-01-02T10:00:00Z',
      description: 'Diagnóstico de eficiência',
      expectedCloseDate: '2025-07-01',
      lossReason: null,
    },
    {
      id: 'op-3',
      title: 'Instalação Comercial Beta',
      estimatedValue: 50000,
      stage: 'Proposta',
      customerId: 'cust-1',
      userId: 'user-2',
      customerName: 'Empresa Solar ABC',
      createdAt: '2025-01-03T10:00:00Z',
      description: 'Apresentação enviada',
      expectedCloseDate: '2025-08-01',
      lossReason: null,
    },
  ]

  const mockCustomersList = [
    {
      id: 'cust-1',
      name: 'Empresa Solar ABC',
      customerType: 'B2B',
      company: 'Solar ABC Ltda',
    },
    {
      id: 'cust-2',
      name: 'Indústria XYZ',
      customerType: 'B2B',
      company: 'XYZ Manufatura',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(opportunitiesService.getAll).mockResolvedValue(mockOpportunities as any)
    vi.mocked(getCustomers).mockResolvedValue(mockCustomersList as any)
  })

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <SalesPipeline />
      </MemoryRouter>,
    )
  }

  // Cenário 1: Renderização inicial das colunas do Kanban
  it('1. Deve renderizar todas as colunas do Kanban corretamente (Prospecção, Qualificação, Proposta, Negociação, Fechado/Ganho, Fechado/Perdido)', async () => {
    renderComponent()

    // Aguardar o carregamento terminar
    await waitFor(() => {
      expect(screen.getByText('Prospecção')).toBeInTheDocument()
    })

    expect(screen.getByText('Prospecção')).toBeInTheDocument()
    expect(screen.getByText('Qualificação')).toBeInTheDocument()
    expect(screen.getByText('Proposta')).toBeInTheDocument()
    expect(screen.getByText('Negociação')).toBeInTheDocument()
    expect(screen.getByText('Fechado/Ganho')).toBeInTheDocument()
    expect(screen.getByText('Fechado/Perdido')).toBeInTheDocument()
  })

  // Cenário 2: Carregamento de oportunidades e exibição dos cards
  it('2. Deve carregar oportunidades do serviço e exibir os cards nas colunas corretas', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Contrato Solar ABC')).toBeInTheDocument()
    })

    expect(screen.getByText('Consultoria Energética XYZ')).toBeInTheDocument()
    expect(screen.getByText('Instalação Comercial Beta')).toBeInTheDocument()

    // Verificar exibição do nome do cliente nos cards
    expect(screen.getAllByText('Empresa Solar ABC').length).toBeGreaterThan(0)
    expect(screen.getByText('Indústria XYZ')).toBeInTheDocument()

    // Verificar se as chamadas de serviço foram feitas
    expect(opportunitiesService.getAll).toHaveBeenCalledTimes(1)
    expect(getCustomers).toHaveBeenCalledTimes(1)
  })

  // Cenário 3: Modal de perda ao mover uma oportunidade para "Fechado/Perdido"
  it('3. Deve exibir o modal de motivo de perda com as opções corretas ao mover oportunidade para "Fechado/Perdido"', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Contrato Solar ABC')).toBeInTheDocument()
    })

    // Localizar a coluna de Fechado/Perdido para simular o drop
    const perdidoColumnTitle = screen.getByText('Fechado/Perdido')
    const columnContainer =
      perdidoColumnTitle.closest('.flex-col') || perdidoColumnTitle.parentElement!

    // Simular drag and drop de op-1 para "Fechado/Perdido"
    const dataTransfer = {
      data: { opportunityId: 'op-1' },
      setData: vi.fn((key: string, val: string) => {
        dataTransfer.data[key] = val
      }),
      getData: vi.fn((key: string) => dataTransfer.data[key]),
    }

    fireEvent.drop(columnContainer, {
      dataTransfer,
    })

    // Verificar se o modal abriu com título Mudar Estágio
    await waitFor(() => {
      expect(screen.getByText('Mudar Estágio')).toBeInTheDocument()
    })

    // Verificar se o campo Motivo da Perda é exibido
    expect(screen.getByText(/Motivo da Perda \*/i)).toBeInTheDocument()

    // Verificar opções de motivo de perda: Preço, Concorrência, Timing, Budget Insuficiente, Falta de Fit, Outro
    expect(screen.getByLabelText('Preço')).toBeInTheDocument()
    expect(screen.getByLabelText('Concorrência')).toBeInTheDocument()
    expect(screen.getByLabelText('Timing')).toBeInTheDocument()
    expect(screen.getByLabelText('Budget Insuficiente')).toBeInTheDocument()
    expect(screen.getByLabelText('Falta de Fit')).toBeInTheDocument()
    expect(screen.getByLabelText('Outro')).toBeInTheDocument()
  })

  // Cenário 4: Criação de tarefa inline a partir do card do Kanban
  it('4. Deve abrir modal de Nova Tarefa ao clicar no botão "Tarefa" do card com os campos corretos', async () => {
    const user = userEvent.setup()
    vi.mocked(createTask).mockResolvedValue({
      id: 'task-new',
      title: 'Ligar para alinhar proposta',
      description: 'Follow-up comercial',
      due_date: '2025-06-15T10:00:00Z',
      type: 'call',
      priority: 'Media',
      status: 'pending',
      customer_id: 'cust-1',
      user_id: 'user-1',
      created_at: '2025-06-01T10:00:00Z',
      updated_at: '2025-06-01T10:00:00Z',
    } as any)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Contrato Solar ABC')).toBeInTheDocument()
    })

    // Clicar no botão "+ Tarefa" do primeiro card
    const taskButtons = screen.getAllByRole('button', { name: /Tarefa/i })
    await user.click(taskButtons[0])

    // Verificar se o modal de Nova Tarefa foi aberto
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nova Tarefa' })).toBeInTheDocument()
    })

    // Verificar a presença dos campos: Título, Tipo, Vencimento, Descrição
    expect(screen.getByLabelText(/Título da tarefa \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tipo de tarefa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Vencimento \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Descrição/i)).toBeInTheDocument()

    // Preencher o formulário
    await user.type(screen.getByLabelText(/Título da tarefa \*/i), 'Ligar para alinhar proposta')
    await user.type(screen.getByLabelText(/Vencimento \*/i), '2025-06-15T10:00')
    await user.type(screen.getByLabelText(/Descrição/i), 'Follow-up comercial')

    // Submeter o formulário
    const submitBtn = screen.getByRole('button', { name: 'Salvar' })
    await user.click(submitBtn)

    // Verificar se a chamada de criação de tarefa foi realizada com os parâmetros esperados
    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ligar para alinhar proposta',
          description: 'Follow-up comercial',
          type: 'call',
          customer_id: 'cust-1',
          status: 'pending',
          priority: 'Media',
        }),
        'Criar Tarefa (via Kanban)',
      )
    })
  })
})
