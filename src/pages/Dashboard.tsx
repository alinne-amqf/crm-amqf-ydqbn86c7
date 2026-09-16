import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ListTodo,
  TrendingUp,
  PieChartIcon,
  Users,
  UserPlus,
  PlusCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { dashboardService } from '@/services/dashboard'
import { createCustomer } from '@/services/customers'
import { useAuth } from '@/hooks/use-auth'
import { Customer } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CustomerForm } from '@/components/CustomerForm'
import { NewTaskModal } from '@/components/NewTaskModal'
import { toast } from 'sonner'

interface DashboardData {
  pipelineValue: number
  opportunitiesByStage: Array<{ stage: string; count: number; fill: string }>
  conversionData: Array<{ name: string; value: number; fill: string }>
  tasksSummary: { pending: number; inProgress: number; overdue: number }
  customersByStatus: Array<{ status: string; count: number; fill: string }>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Modais de Ações Rápidas
  const [isCustomerSheetOpen, setIsCustomerSheetOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const dashboardData = await dashboardService.getDashboardData()
      setData(dashboardData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Saudação contextual
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Bom dia'
    if (hour >= 12 && hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const firstName = profile?.name ? profile.name.trim().split(' ')[0] : 'Usuário'
  const currentDateFormatted = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
  // Deixar a primeira letra da data em maiúsculo (ex: "Sexta-feira, 23 de maio...")
  const capitalizedDate =
    currentDateFormatted.charAt(0).toUpperCase() + currentDateFormatted.slice(1)

  // Cálculo da taxa de conversão
  const wonCount =
    data?.conversionData.find((d) => d.name.toLowerCase().includes('ganho'))?.value || 0
  const lostCount =
    data?.conversionData.find((d) => d.name.toLowerCase().includes('perdido'))?.value || 0
  const totalFinished = wonCount + lostCount
  const conversionRate = totalFinished > 0 ? ((wonCount / totalFinished) * 100).toFixed(1) : '0.0'

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    try {
      const created = await createCustomer(customerData)
      toast.success('Cliente cadastrado com sucesso!', {
        description: `${created.name} foi adicionado à base de clientes.`,
      })
      setIsCustomerSheetOpen(false)
      loadData()
    } catch (error: any) {
      toast.error('Erro ao cadastrar cliente', { description: error.message })
    }
  }

  // Paleta sóbria e clássica para os estágios do funil (gradiente de slate-800 até slate-400)
  const funnelShades = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1']

  const styledFunnelData = data?.opportunitiesByStage?.map((item, index) => ({
    ...item,
    fill: funnelShades[index % funnelShades.length],
  }))

  // Taxa de conversão sóbria: navy discreto para Ganho e slate-300 para Perdido
  const styledConversionData = data?.conversionData?.map((item) => {
    const isWon = item.name.toLowerCase().includes('ganho')
    return {
      ...item,
      fill: isWon ? '#1e3a5f' : '#cbd5e1', // Navy elegante vs Slate neutro claro
    }
  })

  // Clientes por status: tons monocromáticos sóbrios
  const statusColorMap: Record<string, string> = {
    Ativo: '#1e3a5f',
    Lead: '#475569',
    Inativo: '#94a3b8',
  }

  const styledCustomersData = data?.customersByStatus?.map((item, index) => ({
    ...item,
    fill: statusColorMap[item.status] || funnelShades[index % funnelShades.length],
  }))

  if (isLoading && !data) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
        <div className="h-8 w-72 bg-slate-200/80 rounded-md mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-[136px] w-full rounded-lg bg-slate-200/60" />
          <Skeleton className="h-[136px] w-full rounded-lg bg-slate-200/60" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-[360px] w-full rounded-lg bg-slate-200/60" />
          <Skeleton className="h-[360px] w-full rounded-lg bg-slate-200/60" />
          <Skeleton className="h-[360px] w-full rounded-lg bg-slate-200/60 lg:col-span-2" />
        </div>
      </div>
    )
  }

  const chartConfigFunnel = {
    count: { label: 'Oportunidades' },
  }

  const chartConfigConversion = {
    value: { label: 'Oportunidades' },
  }

  const chartConfigCustomers = {
    count: { label: 'Clientes' },
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header Contextual + Barra de Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">{capitalizedDate}</p>
        </div>

        {/* Barra de Ações Rápidas em estilo sóbrio */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            variant="outline"
            className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 shadow-sm transition-colors text-xs sm:text-sm h-9 px-3.5"
            onClick={() => setIsCustomerSheetOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4 text-slate-500" />
            Novo Cliente
          </Button>
          <Button
            className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors text-xs sm:text-sm h-9 px-3.5"
            onClick={() => setIsTaskModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4 text-slate-300" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card Valor no Pipeline */}
        <Card className="p-6 flex flex-col justify-between min-h-[140px] rounded-lg border border-slate-200/90 bg-white shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Valor no Pipeline
              </h3>
            </div>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {formatCurrency(data?.pipelineValue || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Soma de todas as oportunidades ativas
            </p>
          </div>
        </Card>

        {/* Card Resumo de Tarefas */}
        <Card className="p-6 flex flex-col justify-between min-h-[140px] rounded-lg border border-slate-200/90 bg-white shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Resumo de Tarefas
              </h3>
            </div>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-600">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5 mt-1">
            {/* A Fazer */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Tarefas a fazer"
              className="flex flex-col items-center justify-center py-2.5 px-2 rounded-md bg-amber-50/70 border border-amber-200/70 cursor-pointer hover:bg-amber-100/60 transition-colors shadow-2xs select-none"
              onClick={() => navigate('/tarefas?status=pending')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate('/tarefas?status=pending')
                }
              }}
            >
              <span className="text-xl sm:text-2xl font-bold text-amber-900">
                {data?.tasksSummary?.pending ?? 0}
              </span>
              <span className="text-[11px] font-medium text-amber-800 text-center mt-0.5">
                A fazer
              </span>
            </div>

            {/* Em Andamento */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Tarefas em andamento"
              className="flex flex-col items-center justify-center py-2.5 px-2 rounded-md bg-slate-100/80 border border-slate-200 cursor-pointer hover:bg-slate-200/70 transition-colors shadow-2xs select-none"
              onClick={() => navigate('/tarefas?status=in_progress')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate('/tarefas?status=in_progress')
                }
              }}
            >
              <span className="text-xl sm:text-2xl font-bold text-slate-800">
                {data?.tasksSummary?.inProgress ?? 0}
              </span>
              <span className="text-[11px] font-medium text-slate-700 text-center mt-0.5">
                Em andamento
              </span>
            </div>

            {/* Atrasadas - Bordô suave e discreto */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Tarefas atrasadas"
              className="flex flex-col items-center justify-center py-2.5 px-2 rounded-md bg-rose-50/80 border border-rose-200/80 cursor-pointer hover:bg-rose-100/60 transition-colors shadow-2xs select-none"
              onClick={() => navigate('/tarefas?filter=overdue')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate('/tarefas?filter=overdue')
                }
              }}
            >
              <span className="text-xl sm:text-2xl font-bold text-rose-900">
                {data?.tasksSummary?.overdue ?? 0}
              </span>
              <span className="text-[11px] font-medium text-rose-800 text-center mt-0.5">
                Atrasadas
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico: Funil de Vendas */}
        <Card className="p-6 flex flex-col rounded-lg border border-slate-200/90 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <TrendingUp className="h-4 w-4 text-slate-600" />
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
              Funil de Vendas
            </h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            {styledFunnelData && styledFunnelData.length > 0 ? (
              <ChartContainer config={chartConfigFunnel} className="h-full w-full min-h-[300px]">
                <BarChart
                  data={styledFunnelData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 24 }}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      navigate(`/vendas?stage=${e.activePayload[0].payload.stage}`)
                    }
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="stage"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    dy={10}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={
                      <ChartTooltipContent className="bg-white border-slate-200 text-slate-800 shadow-md" />
                    }
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={38}>
                    {styledFunnelData.map((entry, index) => (
                      <Cell key={`funnel-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                Sem dados de oportunidades.
              </div>
            )}
          </div>
        </Card>

        {/* Gráfico: Taxa de Conversão */}
        <Card className="p-6 flex flex-col rounded-lg border border-slate-200/90 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-slate-600" />
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                Taxa de Conversão
              </h2>
            </div>
          </div>

          {/* Destaque sóbrio do percentual calculado */}
          <div className="flex flex-col items-center justify-center pt-1 pb-2">
            <span className="text-4xl font-bold tracking-tight text-slate-900">
              {conversionRate}%
            </span>
            <span className="text-xs font-medium text-slate-500 mt-0.5">taxa de fechamento</span>
          </div>

          <div className="flex-1 min-h-[250px]">
            {styledConversionData && styledConversionData.some((d) => d.value > 0) ? (
              <ChartContainer
                config={chartConfigConversion}
                className="h-full w-full min-h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={styledConversionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={92}
                      paddingAngle={3}
                      dataKey="value"
                      onClick={(e) => {
                        if (e && e.name) {
                          navigate(`/vendas?status=${e.name}`)
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {styledConversionData.map((entry, index) => (
                        <Cell key={`conv-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent className="bg-white border-slate-200 text-slate-800 shadow-md" />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                Sem dados de conversão.
              </div>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-slate-100">
            {styledConversionData?.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-xs font-medium text-slate-600">
                  {d.name} <span className="text-slate-400">({d.value})</span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Gráfico: Clientes por Status */}
        <Card className="p-6 flex flex-col rounded-lg border border-slate-200/90 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Users className="h-4 w-4 text-slate-600" />
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
              Clientes por Status
            </h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            {styledCustomersData && styledCustomersData.length > 0 ? (
              <ChartContainer config={chartConfigCustomers} className="h-full w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={styledCustomersData}
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      dataKey="count"
                      nameKey="status"
                      onClick={(e) => {
                        if (e && e.status) {
                          navigate(`/clientes?status=${e.status}`)
                        }
                      }}
                      className="cursor-pointer"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {styledCustomersData.map((entry, index) => (
                        <Cell key={`cust-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent className="bg-white border-slate-200 text-slate-800 shadow-md" />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                Sem dados de clientes.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal / Sheet de Cadastro de Novo Cliente */}
      <Sheet
        open={isCustomerSheetOpen}
        onOpenChange={(open) => !open && setIsCustomerSheetOpen(false)}
      >
        <SheetContent className="w-full sm:max-w-md border-l overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-h2">Cadastrar Novo Cliente</SheetTitle>
            <SheetDescription className="text-body">
              Preencha os dados abaixo para adicionar um novo cliente ou lead à sua base.
            </SheetDescription>
          </SheetHeader>
          <CustomerForm
            onSubmit={handleSaveCustomer}
            onCancel={() => setIsCustomerSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Modal de Criação de Tarefa */}
      <NewTaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onSuccess={() => {
          loadData()
        }}
      />
    </div>
  )
}
