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

  if (isLoading && !data) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
        <div className="h-10 w-72 bg-muted rounded-md mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-[350px] w-full rounded-lg" />
          <Skeleton className="h-[350px] w-full rounded-lg" />
          <Skeleton className="h-[350px] w-full rounded-lg" />
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
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
      {/* Header Contextual + Barra de Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{capitalizedDate}</p>
        </div>

        {/* Barra de Ações Rápidas */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            variant="outline"
            className="bg-white border-border shadow-xs hover:border-primary/50 text-foreground"
            onClick={() => setIsCustomerSheetOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4 text-primary" />
            Novo Cliente
          </Button>
          <Button className="shadow-sm" onClick={() => setIsTaskModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 flex flex-col justify-center min-h-[140px] shadow-sm border-l-4 border-l-highlight bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-5 w-5 text-highlight" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Valor no Pipeline
            </h3>
          </div>
          <div className="text-4xl font-bold text-highlight">
            {formatCurrency(data?.pipelineValue || 0)}
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-center min-h-[140px] shadow-sm border-l-4 border-l-action bg-white">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="h-5 w-5 text-action" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Resumo de Tarefas
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div
              role="button"
              tabIndex={0}
              aria-label="Tarefas a fazer"
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-amber-50 border border-amber-200/60 cursor-pointer hover:bg-amber-100/80 transition-all hover:scale-[1.02] shadow-xs select-none"
              onClick={() => navigate('/tarefas?status=pending')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate('/tarefas?status=pending')
                }
              }}
            >
              <span className="text-2xl font-bold text-amber-600">
                {data?.tasksSummary?.pending ?? 0}
              </span>
              <span className="text-xs text-amber-800 font-medium text-center">A fazer</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label="Tarefas em andamento"
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50 border border-blue-200/60 cursor-pointer hover:bg-blue-100/80 transition-all hover:scale-[1.02] shadow-xs select-none"
              onClick={() => navigate('/tarefas?status=in_progress')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate('/tarefas?status=in_progress')
                }
              }}
            >
              <span className="text-2xl font-bold text-blue-600">
                {data?.tasksSummary?.inProgress ?? 0}
              </span>
              <span className="text-xs text-blue-800 font-medium text-center">Em andamento</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label="Tarefas atrasadas"
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-red-50 border border-red-200/60 cursor-pointer hover:bg-red-100/80 transition-all hover:scale-[1.02] shadow-xs select-none"
              onClick={() => navigate('/tarefas?filter=overdue')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate('/tarefas?filter=overdue')
                }
              }}
            >
              <span className="text-2xl font-bold text-red-600">
                {data?.tasksSummary?.overdue ?? 0}
              </span>
              <span className="text-xs text-red-800 font-medium text-center">Atrasadas</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Funil de Vendas</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            {data?.opportunitiesByStage && data.opportunitiesByStage.length > 0 ? (
              <ChartContainer config={chartConfigFunnel} className="h-full w-full min-h-[300px]">
                <BarChart
                  data={data.opportunitiesByStage}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      navigate(`/vendas?stage=${e.activePayload[0].payload.stage}`)
                    }
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                  <XAxis
                    dataKey="stage"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666666', fontSize: 11 }}
                    dy={10}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666666', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    cursor={{ fill: '#F0F2F5' }}
                    content={<ChartTooltipContent className="bg-white" />}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Sem dados de oportunidades.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 flex flex-col shadow-sm bg-white">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Taxa de Conversão</h2>
            </div>
          </div>

          {/* Destaque do percentual calculado */}
          <div className="flex flex-col items-center justify-center pt-2 pb-1">
            <span className="text-4xl font-bold text-foreground tracking-tight">
              {conversionRate}%
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-0.5">
              taxa de fechamento
            </span>
          </div>

          <div className="flex-1 min-h-[260px]">
            {data?.conversionData && data.conversionData.some((d) => d.value > 0) ? (
              <ChartContainer
                config={chartConfigConversion}
                className="h-full w-full min-h-[260px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.conversionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      onClick={(e) => {
                        if (e && e.name) {
                          navigate(`/vendas?status=${e.name}`)
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {data.conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Sem dados de conversão.
              </div>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {data?.conversionData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }}></div>
                <span className="text-sm font-medium">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 flex flex-col shadow-sm bg-white lg:col-span-2">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Clientes por Status</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            {data?.customersByStatus && data.customersByStatus.length > 0 ? (
              <ChartContainer config={chartConfigCustomers} className="h-full w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.customersByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
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
                      {data.customersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
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
