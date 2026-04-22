import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Briefcase,
  CheckCircle2,
  ListTodo,
  ArrowUpRight,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Plus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'

import { dashboardService } from '@/services/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DashboardData {
  metrics: {
    totalCustomers: number
    customersGrowth: number | null
    pipelineValue: number
    pipelineGrowth: number | null
    wonValue: number
    wonGrowth: number | null
    pendingTasks: number
    tasksGrowth: number | null
    funnelData: Array<{ stage: string; value: number }>
  }
  recentOpportunities: any[]
  upcomingTasks: any[]
}

type Period = 'month' | 'prev_month' | 'all'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const [metrics, recentOpportunities, upcomingTasks] = await Promise.all([
          dashboardService.getMetrics(period),
          dashboardService.getRecentOpportunities(),
          dashboardService.getUpcomingTasks(),
        ])
        setData({ metrics, recentOpportunities, upcomingTasks })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [period])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const CARD_STYLES = [
    'bg-primary text-white shadow-md shadow-primary/20',
    'bg-success text-white shadow-md shadow-success/20',
    'bg-[#1B1B1B] text-white shadow-md shadow-black/20',
    'bg-warning text-[#1B1B1B] shadow-md shadow-warning/20',
    'bg-card text-card-foreground border shadow-sm',
    'bg-card text-card-foreground border shadow-sm',
  ]

  const GrowthIndicator = ({
    value,
    label = 'em relação ao período anterior',
  }: {
    value: number | null
    label?: string
  }) => {
    if (value === null)
      return <p className="text-[12px] text-muted-foreground mt-2 opacity-0">Sem comparação</p>
    const isPositive = value >= 0
    return (
      <div
        className={cn(
          'flex items-center text-[12px] mt-2',
          isPositive ? 'text-success font-medium' : 'text-destructive font-medium',
        )}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        {Math.abs(value)}% <span className="text-muted-foreground font-normal ml-1">{label}</span>
      </div>
    )
  }

  const chartConfig = {
    value: {
      label: 'Valor',
      color: 'hsl(var(--primary))',
    },
  }

  if (isLoading && !data) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-[20px] animate-pulse pb-10">
        <div className="flex justify-between items-center mb-[24px]">
          <div className="h-[32px] w-48 bg-muted rounded-[4px]"></div>
          <div className="h-[40px] w-32 bg-muted rounded-[4px]"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-lg bg-[#F0F2F5]" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg bg-[#F0F2F5] mt-[20px]" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-10">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-foreground leading-tight">Dashboard</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Resumo das suas atividades e métricas importantes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[160px] bg-muted border-border text-[12px] px-[12px] focus:border-primary focus:bg-white h-[36px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês Atual</SelectItem>
              <SelectItem value="prev_month">Mês Anterior</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
          <Button
            asChild
            variant="outline"
            className="shadow-[0_1px_3px_rgba(0,0,0,0.12)] px-[16px] py-[8px] text-[14px] font-semibold"
          >
            <Link to="/tarefas">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Link>
          </Button>
          <Button
            asChild
            className="bg-primary hover:bg-secondary text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] px-[16px] py-[8px] text-[14px] font-semibold border-none"
          >
            <Link to="/vendas">
              <Plus className="h-4 w-4 mr-2" />
              Nova Oportunidade
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-border border-l-4 border-l-primary hover:bg-muted hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              Clientes no Período
            </h3>
          </div>
          <div>
            <div className="text-[28px] font-bold text-primary leading-none">
              {data?.metrics.totalCustomers}
            </div>
            <GrowthIndicator value={data?.metrics.customersGrowth ?? null} />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-border border-l-4 border-l-highlight hover:bg-muted hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-4 w-4 text-highlight" />
            <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              Valor em Pipeline
            </h3>
          </div>
          <div>
            <div className="text-[28px] font-bold text-highlight leading-none">
              {formatCurrency(data?.metrics.pipelineValue || 0)}
            </div>
            <GrowthIndicator value={data?.metrics.pipelineGrowth ?? null} />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-border border-l-4 border-l-success hover:bg-muted hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              Valor Ganho
            </h3>
          </div>
          <div>
            <div className="text-[28px] font-bold text-success leading-none">
              {formatCurrency(data?.metrics.wonValue || 0)}
            </div>
            <GrowthIndicator value={data?.metrics.wonGrowth ?? null} />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-border border-l-4 border-l-action hover:bg-muted hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="h-4 w-4 text-action" />
            <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              Tarefas no Período
            </h3>
          </div>
          <div>
            <div className="text-[28px] font-bold text-action leading-none">
              {data?.metrics.pendingTasks}
            </div>
            <GrowthIndicator value={data?.metrics.tasksGrowth ?? null} />
          </div>
        </Card>
      </div>

      <div className="bg-transparent space-y-8 mt-[20px]">
        <Card className="p-[20px] border border-border shadow-sm bg-white rounded-lg">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-[20px] w-[20px] text-primary" />
              <h2 className="text-[18px] font-semibold text-foreground">Oportunidades Recentes</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-[14px] px-[12px] py-[8px] text-primary border-border hover:bg-muted font-medium"
              asChild
            >
              <Link to="/vendas">Ver Todas</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.recentOpportunities?.map((opp, index) => {
              return (
                <div
                  key={opp.id}
                  className="p-4 rounded-md border border-border bg-white flex flex-col justify-between min-h-[140px] hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[12px] text-muted-foreground font-medium">
                      {format(new Date(opp.created_at), 'd MMM', { locale: ptBR })}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[11px] font-normal bg-accent border-border text-foreground"
                    >
                      {opp.stage}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[16px] text-foreground leading-tight mb-1 line-clamp-1">
                      {opp.title}
                    </h3>
                    <p className="text-[12px] text-muted-foreground mb-4 line-clamp-1">
                      {opp.customers?.name || 'Cliente'}
                    </p>

                    <div className="flex items-end justify-between mt-auto">
                      <span className="text-[18px] font-bold text-primary">
                        {formatCurrency(Number(opp.estimated_value))}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {(!data?.recentOpportunities || data.recentOpportunities.length === 0) && (
              <div className="col-span-full py-[20px] flex flex-col items-center justify-center text-center">
                <Briefcase className="h-[48px] w-[48px] text-[#D3D3D3] mb-2" />
                <p className="text-[16px] font-semibold text-muted-foreground">
                  Nenhuma oportunidade recente encontrada.
                </p>
                <p className="text-[14px] text-text-tertiary mb-4">
                  Suas novas oportunidades aparecerão aqui.
                </p>
                <Button
                  asChild
                  className="bg-primary text-white hover:bg-secondary px-[12px] py-[8px] font-semibold"
                >
                  <Link to="/vendas">Criar Oportunidade</Link>
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-[20px] border border-border shadow-sm bg-white rounded-lg flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-[20px] w-[20px] text-primary" />
                <h2 className="text-[18px] font-semibold text-foreground">Funil de Vendas</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-[14px] px-[12px] py-[8px] text-primary border-border hover:bg-muted font-medium"
                asChild
              >
                <Link to="/vendas">Detalhes</Link>
              </Button>
            </div>

            <div className="mb-6">
              <span className="text-[24px] font-bold tracking-tight text-primary">
                {formatCurrency(data?.metrics.pipelineValue || 0)}
              </span>
              <p className="text-[12px] text-muted-foreground mt-1">
                Total em Pipeline (
                {period === 'month'
                  ? 'Mês Atual'
                  : period === 'prev_month'
                    ? 'Mês Anterior'
                    : 'Todo o Período'}
                )
              </p>
            </div>

            <div className="flex-1 min-h-[200px] w-full mt-auto">
              {data?.metrics?.funnelData && data.metrics.funnelData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-full w-full min-h-[250px]">
                  <BarChart
                    data={data.metrics.funnelData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                    <XAxis
                      dataKey="stage"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666666', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666666', fontSize: 12 }}
                      tickFormatter={(val) => `R$${val / 1000}k`}
                    />
                    <ChartTooltip
                      cursor={{ fill: '#F0F2F5' }}
                      content={
                        <ChartTooltipContent
                          className="bg-[#1A1A1A] text-white border-none shadow-[0_2px_8px_rgba(0,0,0,0.15)] rounded px-3 py-2"
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Bar dataKey="value" fill="#0070D2" radius={[2, 2, 0, 0]} barSize={40} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-center pb-8">
                  <TrendingUp className="h-[48px] w-[48px] text-[#D3D3D3] mb-2" />
                  <p className="text-[16px] font-semibold text-muted-foreground">
                    Dados insuficientes para o gráfico.
                  </p>
                  <p className="text-[14px] text-text-tertiary">
                    Adicione oportunidades para visualizar o funil.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-[20px] border border-border shadow-sm bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-[20px] w-[20px] text-primary" />
                <h2 className="text-[18px] font-semibold text-foreground">Agenda de Tarefas</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-[14px] px-[12px] py-[8px] text-primary border-border hover:bg-muted font-medium"
                asChild
              >
                <Link to="/tarefas">Ver Calendário</Link>
              </Button>
            </div>

            <div className="space-y-0">
              {data?.upcomingTasks?.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-md flex items-center justify-center',
                        task.type === 'call'
                          ? 'bg-blue-50 text-blue-600'
                          : task.type === 'meeting'
                            ? 'bg-purple-50 text-purple-600'
                            : task.type === 'email'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <ListTodo className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-[14px]">{task.title}</h4>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {task.customers?.name} •{' '}
                        {format(new Date(task.due_date), "dd/MM 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-primary"
                    asChild
                  >
                    <Link to="/tarefas">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </Button>
                </div>
              ))}

              {(!data?.upcomingTasks || data.upcomingTasks.length === 0) && (
                <div className="py-[20px] text-center flex flex-col items-center justify-center">
                  <ListTodo className="h-[48px] w-[48px] text-[#D3D3D3] mb-2" />
                  <p className="text-[16px] font-semibold text-muted-foreground">
                    Nenhuma tarefa pendente
                  </p>
                  <p className="text-[14px] text-text-tertiary mt-1 mb-4">
                    Sua agenda está livre no momento.
                  </p>
                  <Button
                    asChild
                    className="bg-primary text-white hover:bg-secondary px-[12px] py-[8px] font-semibold"
                  >
                    <Link to="/tarefas">Criar Tarefa</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
