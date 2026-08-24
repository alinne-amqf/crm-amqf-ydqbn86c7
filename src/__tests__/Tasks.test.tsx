import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import TasksPage from '@/pages/Tasks'
import { getTasks, createTask, updateTask, deleteTask, Task } from '@/services/tasks'

// Mock useAuth
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'vendedor@amqf.com' },
    profile: { id: 'user-1', name: 'João Silva', role: 'Vendedor' },
    isAuthenticated: true,
  }),
}))

// Mock tasks service
vi.mock('@/services/tasks', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'customers') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'cust-1',
                  name: 'Empresa Solar ABC',
                  company: 'Solar ABC Ltda',
                  email: 'solar@abc.com',
                  phone: '1199999999',
                  status: 'ativo',
                  customer_type: 'B2B',
                  document: '12345678000100',
                  created_at: '2025-01-01T00:00:00Z',
                },
                {
                  id: 'cust-2',
                  name: 'Indústria XYZ',
                  company: 'XYZ Manufatura',
                  email: 'xyz@ind.com',
                  phone: '1188888888',
                  status: 'ativo',
                  customer_type: 'B2B',
                  document: '98765432000199',
                  created_at: '2025-01-02T00:00:00Z',
                },
              ],
              error: null,
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }
    }),
  },
}))

describe('TasksPage Integration Tests (Fluxo Tarefas)', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Ligar para Cliente Solar',
      description: 'Alinhar detalhes do orçamento técnico',
      due_date: '2025-12-31T14:00:00.000Z',
      type: 'call',
      priority: 'Alta',
      status: 'pending',
      customer_id: 'cust-1',
      user_id: 'user-1',
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      customers: {
        name: 'Empresa Solar ABC',
        company: 'Solar ABC Ltda',
      },
    },
    {
      id: 'task-2',
      title: 'Reunião de Apresentação Técnica',
      description: 'Apresentar escopo da consultoria',
      due_date: '2025-12-30T10:00:00.000Z',
      type: 'meeting',
      priority: 'Media',
      status: 'in_progress',
      customer_id: 'cust-2',
      user_id: 'user-1',
      created_at: '2025-01-02T10:00:00Z',
      updated_at: '2025-01-02T10:00:00Z',
      customers: {
        name: 'Indústria XYZ',
        company: 'XYZ Manufatura',
      },
    },
    {
      id: 'task-3',
      title: 'Enviar Contrato Assinado',
      description: 'Contrato fechado com Solar ABC',
      due_date: '2025-01-10T09:00:00.000Z',
      type: 'proposta',
      priority: 'Baixa',
      status: 'completed',
      customer_id: 'cust-1',
      user_id: 'user-1',
      created_at: '2025-01-03T10:00:00Z',
      updated_at: '2025-01-03T10:00:00Z',
      customers: {
        name: 'Empresa Solar ABC',
        company: 'Solar ABC Ltda',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTasks).mockResolvedValue(mockTasks)
  })

  const renderComponent = (initialEntries = ['/tarefas']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/tarefas" element={<TasksPage />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  // Cenário 1: Renderização inicial
  it('1. Deve renderizar a lista de tarefas com os itens iniciais', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Ligar para Cliente Solar')).toBeInTheDocument()
    })

    expect(screen.getByText('Reunião de Apresentação Técnica')).toBeInTheDocument()
    expect(screen.getByText('Enviar Contrato Assinado')).toBeInTheDocument()
    expect(screen.getByText('3 tarefas encontradas')).toBeInTheDocument()
    expect(getTasks).toHaveBeenCalledTimes(1)
  })

  // Cenário 2: Filtros de busca, status e cliente
  it('2. Deve filtrar tarefas por termo de busca', async () => {
    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Ligar para Cliente Solar')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Buscar tarefas...')
    await user.type(searchInput, 'Reunião')

    // Deve mostrar apenas a tarefa compatível
    expect(screen.getByText('Reunião de Apresentação Técnica')).toBeInTheDocument()
    expect(screen.queryByText('Ligar para Cliente Solar')).not.toBeInTheDocument()
    expect(screen.queryByText('Enviar Contrato Assinado')).not.toBeInTheDocument()
    expect(screen.getByText('1 tarefa encontrada')).toBeInTheDocument()

    // Limpar busca
    await user.clear(searchInput)
    expect(screen.getByText('3 tarefas encontradas')).toBeInTheDocument()
  })

  // Cenário 3: Query params automáticos (/tarefas?status=pending)
  it('3. Deve aplicar filtro de status automaticamente quando acessado via query param /tarefas?status=pending', async () => {
    renderComponent(['/tarefas?status=pending'])

    await waitFor(() => {
      expect(screen.getByText('Ligar para Cliente Solar')).toBeInTheDocument()
    })

    // Deve exibir apenas a tarefa com status "pending"
    expect(screen.queryByText('Reunião de Apresentação Técnica')).not.toBeInTheDocument()
    expect(screen.queryByText('Enviar Contrato Assinado')).not.toBeInTheDocument()
    expect(screen.getByText('1 tarefa encontrada')).toBeInTheDocument()
  })

  // Cenário 4: Modal de criação/edição com campos corretos
  it('4. Deve abrir modal de criação com todos os campos necessários (título, descrição, cliente, prioridade, status, tipo, data/hora)', async () => {
    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Tarefas')).toBeInTheDocument()
    })

    const novaTarefaBtn = screen.getByRole('button', { name: /Nova Tarefa/i })
    await user.click(novaTarefaBtn)

    // Modal aberto
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nova Tarefa' })).toBeInTheDocument()
    })

    // Verificar campos do formulário
    expect(screen.getByLabelText(/Título \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Descrição/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cliente Vinculado \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Prioridade/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tipo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Data e Hora \*/i)).toBeInTheDocument()

    // Fechar modal
    const cancelarBtn = screen.getByRole('button', { name: 'Cancelar' })
    await user.click(cancelarBtn)
  })

  // Cenário 5: Ação de concluir tarefa
  it('5. Deve permitir concluir uma tarefa pendente clicando no ícone de conclusão', async () => {
    const updatedMockTask: Task = {
      ...mockTasks[0],
      status: 'completed',
    }
    vi.mocked(updateTask).mockResolvedValue(updatedMockTask)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Ligar para Cliente Solar')).toBeInTheDocument()
    })

    // Localizar o botão de conclusão associado ao primeiro item (que tem Circle icon / não concluído)
    // O container da primeira tarefa contém os botões de ação
    const firstTaskItem = screen.getByText('Ligar para Cliente Solar').closest('.group')!
    const completeButton = firstTaskItem.querySelector(
      'button:not([aria-haspopup="menu"])',
    ) as HTMLButtonElement

    expect(completeButton).toBeInTheDocument()
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith('task-1', { status: 'completed' })
    })
  })

  // Cenário 6: Exclusão com diálogo de confirmação
  it('6. Deve exibir diálogo de confirmação antes de excluir uma tarefa', async () => {
    vi.mocked(deleteTask).mockResolvedValue()

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Ligar para Cliente Solar')).toBeInTheDocument()
    })

    // Localizar menu da primeira tarefa
    const firstTaskItem = screen.getByText('Ligar para Cliente Solar').closest('.group')!
    const menuTrigger = firstTaskItem.querySelector(
      'button[aria-haspopup="menu"]',
    ) as HTMLButtonElement

    fireEvent.click(menuTrigger)

    // O menu dropdown deve se abrir
    await waitFor(() => {
      expect(screen.getByText('Excluir tarefa')).toBeInTheDocument()
    })

    // Clicar em "Excluir tarefa"
    fireEvent.click(screen.getByText('Excluir tarefa'))

    // Deve abrir o AlertDialog de confirmação
    await waitFor(() => {
      expect(
        screen.getByText(
          'Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.',
        ),
      ).toBeInTheDocument()
    })

    // Confirmar exclusão
    const confirmButton = screen.getByRole('button', { name: 'Excluir' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(deleteTask).toHaveBeenCalledWith('task-1')
    })
  })
})
