import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ReportCard, ReportTable, SubReport, EmptyState, CHART_COLORS, formatDate } from './shared'
import * as svc from '@/services/reports/customers'

interface Props {
  dateStart?: string
  dateEnd?: string
  userId?: string
}

export function CustomersReport({ dateStart, dateEnd, userId }: Props) {
  const [loading, setLoading] = useState(true)
  const [statusDist, setStatusDist] = useState<svc.StatusDistribution[]>([])
  const [typeDist, setTypeDist] = useState<svc.TypeDistribution[]>([])
  const [evolution, setEvolution] = useState<svc.StatusEvolution[]>([])
  const [conversionTime, setConversionTime] = useState<{
    items: svc.ConversionTimeItem[]
    avgDays: number
  }>({ items: [], avgDays: 0 })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      svc.getStatusDistribution(dateStart, dateEnd, userId),
      svc.getTypeDistribution(dateStart, dateEnd, userId),
      svc.getStatusEvolution(dateStart, dateEnd, userId),
      svc.getAvgConversionTime(dateStart, dateEnd, userId),
    ])
      .then(([s, t, e, c]) => {
        setStatusDist(s)
        setTypeDist(t)
        setEvolution(e)
        setConversionTime(c)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateStart, dateEnd, userId])

  if (loading) return <div className="py-8 text-center text-muted-foreground">Carregando...</div>

  const leadCount = statusDist.find((s) => s.status === 'Lead')?.count || 0
  const clientCount = statusDist
    .filter((s) => s.status !== 'Lead')
    .reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="space-y-8">
      <SubReport title="Distribuição por Status (Lead, Cliente)">
        <div className="grid grid-cols-2 gap-3">
          <ReportCard title="Leads" value={leadCount} />
          <ReportCard title="Clientes" value={clientCount} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReportTable
            exportFilename="clientes_status.csv"
            headers={['Status', 'Quantidade']}
            rows={statusDist.map((s) => [s.status, s.count])}
          />
          {statusDist.length > 0 ? (
            <ChartContainer config={{ count: { label: 'Clientes' } }} className="h-[250px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyState />
          )}
        </div>
        {evolution.length > 0 && (
          <ChartContainer
            config={{ leads: { label: 'Leads' }, clients: { label: 'Clientes' } }}
            className="h-[250px] mt-4"
          >
            <ResponsiveContainer>
              <LineChart data={evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="clients" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </SubReport>

      <SubReport title="Segmentação por Tipo (B2B/B2C)">
        <ReportTable
          exportFilename="clientes_tipo.csv"
          headers={['Tipo', 'Quantidade']}
          rows={typeDist.map((t) => [t.type, t.count])}
        />
        {typeDist.length > 0 && (
          <ChartContainer config={{ count: { label: 'Clientes' } }} className="h-[200px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={typeDist}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                >
                  {typeDist.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </SubReport>

      <SubReport title="Tempo Médio de Conversão de Lead para Cliente">
        <ReportCard title="Tempo Médio (dias)" value={conversionTime.avgDays} />
        <ReportTable
          exportFilename="clientes_tempo_conversao.csv"
          headers={['Cliente', 'Data Lead', 'Data Cliente', 'Dias para Converter']}
          rows={conversionTime.items.map((i) => [
            i.customerName,
            formatDate(i.leadDate),
            formatDate(i.clientDate),
            i.daysToConvert,
          ])}
        />
      </SubReport>
    </div>
  )
}
