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
    'bg-blue-600 text-white shadow-md shadow-blue-500/20',
    'bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
    'bg-zinc-950 text-white shadow-md shadow-zinc-900/20',
    'bg-amber-400 text-zinc-900 shadow-md shadow-amber-400/20',
    'bg-card text-card-foreground border border-slate-200 shadow-sm',
    'bg-card text-card-foreground border border-slate-200 shadow-sm',
  ]

  const GrowthIndicator = ({
    value,
    label = 'em relação ao período anterior',
  }: {
    value: number | null
    label?: string
  }) => {
    if (value === null)
      return <p className="text-xs text-slate-500 mt-1 opacity-0">Sem comparação</p>
    const isPositive = value >= 0
    return (
      <div
        className={cn(
          'flex items-center text-xs font-medium mt-1',
          isPositive ? 'text-emerald-600' : 'text-rose-600',
        )}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        {Math.abs(value)}% <span className="text-slate-500 font-normal ml-1">{label}</span>
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
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-slate-200 rounded"></div>
          <div className="h-10 w-32 bg-slate-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-[2.5rem] mt-8" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-10">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Resumo das suas atividades e métricas importantes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês Atual</SelectItem>
              <SelectItem value="prev_month">Mês Anterior</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="outline" className="shadow-sm">
            <Link to="/tarefas">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Link>
          </Button>
          <Button asChild className="shadow-sm">
            <Link to="/vendas">
              <Plus className="h-4 w-4 mr-2" />
              Nova Oportunidade
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Clientes no Período
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data?.metrics.totalCustomers}</div>
            <GrowthIndicator value={data?.metrics.customersGrowth ?? null} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Valor em Pipeline</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(data?.metrics.pipelineValue || 0)}
            </div>
            <GrowthIndicator value={data?.metrics.pipelineGrowth ?? null} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Valor Ganho</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(data?.metrics.wonValue || 0)}
            </div>
            <GrowthIndicator value={data?.metrics.wonGrowth ?? null} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tarefas no Período</CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
              <ListTodo className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data?.metrics.pendingTasks}</div>
            <GrowthIndicator value={data?.metrics.tasksGrowth ?? null} />
          </CardContent>
        </Card>
      </div>

      <div className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Oportunidades Recentes</h2>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 text-slate-500"
              asChild
            >
              <Link to="/vendas">
                <ArrowUpRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.recentOpportunities?.map((opp, index) => {
              const style = CARD_STYLES[index % CARD_STYLES.length]
              const isDark = style.includes('text-white')

              return (
                <div
                  key={opp.id}
                  className={cn(
                    'p-6 rounded-[2rem] flex flex-col justify-between min-h-[160px] transition-transform hover:scale-[1.02]',
                    style,
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={cn(
                        'text-xs font-medium opacity-80',
                        isDark ? 'text-white/80' : 'text-slate-500',
                      )}
                    >
                      {format(new Date(opp.created_at), 'd MMM', { locale: ptBR })}
                    </span>
                    <button
                      className={cn(
                        'opacity-80 hover:opacity-100',
                        isDark ? 'text-white' : 'text-slate-500',
                      )}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg leading-tight mb-1 line-clamp-1">
                      {opp.title}
                    </h3>
                    <p
                      className={cn(
                        'text-xs mb-4 opacity-80',
                        isDark ? 'text-white/70' : 'text-slate-500',
                      )}
                    >
                      {opp.stage}
                    </p>

                    <div className="flex items-end justify-between mt-auto">
                      <span className="text-2xl font-bold tracking-tight">
                        {formatCurrency(Number(opp.estimated_value))}
                      </span>

                      <div className="flex -space-x-2">
                        {opp.customers?.avatar ? (
                          <Avatar className="h-8 w-8 border-2 border-transparent bg-white/20">
                            <AvatarImage src={opp.customers.avatar} />
                          </Avatar>
                        ) : (
                          <Avatar className="h-8 w-8 border-2 border-transparent bg-white/20">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                              {opp.customers?.name?.substring(0, 2).toUpperCase() || 'CL'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <Avatar className="h-8 w-8 border-2 border-transparent bg-white/20">
                          <AvatarImage
                            src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${index}`}
                          />
                        </Avatar>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {(!data?.recentOpportunities || data.recentOpportunities.length === 0) && (
              <div className="col-span-full py-10 text-center text-slate-500">
                Nenhuma oportunidade recente encontrada.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Funil de Vendas</h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 text-slate-500"
                asChild
              >
                <Link to="/vendas">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {formatCurrency(data?.metrics.pipelineValue || 0)}
              </span>
              <p className="text-sm text-slate-500 mt-1">
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="stage"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(val) => `R$${val / 1000}k`}
                    />
                    <ChartTooltip
                      cursor={{ fill: '#f8fafc' }}
                      content={
                        <ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />
                      }
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--color-value)"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm pb-8">
                  Dados insuficientes para o gráfico
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Agenda de Tarefas</h2>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" asChild>
                <Link to="/tarefas">
                  <CalendarIcon className="h-4 w-4 text-slate-500" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {data?.upcomingTasks?.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center',
                        task.type === 'call'
                          ? 'bg-blue-100 text-blue-600'
                          : task.type === 'meeting'
                            ? 'bg-purple-100 text-purple-600'
                            : task.type === 'email'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-slate-200 text-slate-600',
                      )}
                    >
                      <ListTodo className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{task.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {task.customers?.name} •{' '}
                        {format(new Date(task.due_date), "dd/MM 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                    <Link to="/tarefas">
                      <ArrowUpRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </Button>
                </div>
              ))}

              {(!data?.upcomingTasks || data.upcomingTasks.length === 0) && (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Nenhuma tarefa pendente próxima.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
