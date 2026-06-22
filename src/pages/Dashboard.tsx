import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, ListTodo, TrendingUp, PieChartIcon, Users } from 'lucide-react'
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

import { dashboardService } from '@/services/dashboard'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface DashboardData {
  pipelineValue: number
  opportunitiesByStage: Array<{ stage: string; count: number; fill: string }>
  conversionData: Array<{ name: string; value: number; fill: string }>
  tasksSummary: { pending: number; overdue: number }
  customersByStatus: Array<{ status: string; count: number; fill: string }>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
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
    fetchData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (isLoading && !data) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
        <div className="h-8 w-48 bg-muted rounded-md mb-6"></div>
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
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground leading-tight">Dashboard Inteligente</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe os principais indicadores de desempenho do seu CRM.
        </p>
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
          <div className="grid grid-cols-2 gap-4">
            <div
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => navigate('/tarefas?filter=pending')}
            >
              <span className="text-2xl font-bold text-orange-600">
                {data?.tasksSummary.pending || 0}
              </span>
              <span className="text-xs text-orange-800 font-medium">Pendentes</span>
            </div>
            <div
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-red-50 cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => navigate('/tarefas?filter=overdue')}
            >
              <span className="text-2xl font-bold text-red-600">
                {data?.tasksSummary.overdue || 0}
              </span>
              <span className="text-xs text-red-800 font-medium">Atrasadas</span>
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
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Taxa de Conversão</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            {data?.conversionData && data.conversionData.some((d) => d.value > 0) ? (
              <ChartContainer
                config={chartConfigConversion}
                className="h-full w-full min-h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.conversionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
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
    </div>
  )
}
