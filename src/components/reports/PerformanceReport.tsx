import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ReportCard, ReportTable, SubReport, EmptyState, formatCurrency } from './shared'
import * as svc from '@/services/reports/performance'

interface Props {
  dateStart?: string
  dateEnd?: string
  userId?: string
}

export function PerformanceReport({ dateStart, dateEnd, userId }: Props) {
  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState<svc.SalesRankingItem[]>([])
  const [activities, setActivities] = useState<svc.ActivityByVendorItem[]>([])
  const [individual, setIndividual] = useState<svc.IndividualConversionItem[]>([])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      svc.getSalesRanking(dateStart, dateEnd, userId),
      svc.getActivitiesByVendor(dateStart, dateEnd, userId),
      svc.getIndividualConversion(dateStart, dateEnd, userId),
    ])
      .then(([r, a, i]) => {
        setRanking(r)
        setActivities(a)
        setIndividual(i)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateStart, dateEnd, userId])

  if (loading) return <div className="py-8 text-center text-muted-foreground">Carregando...</div>

  const totalWon = ranking.reduce((s, r) => s + r.wonCount, 0)
  const totalValue = ranking.reduce((s, r) => s + r.totalWonValue, 0)
  const totalInteractions = activities.reduce((s, a) => s + a.interactionsCount, 0)
  const totalTasks = activities.reduce((s, a) => s + a.completedTasksCount, 0)

  return (
    <div className="space-y-8">
      <SubReport title="Ranking de Vendas por Vendedor">
        <div className="grid grid-cols-2 gap-3">
          <ReportCard title="Oportunidades Ganhas" value={totalWon} />
          <ReportCard title="Valor Total Ganho" value={formatCurrency(totalValue)} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReportTable
            exportFilename="performance_ranking.csv"
            headers={['Vendedor', 'Ganhas', 'Valor Total']}
            rows={ranking.map((r) => [r.vendorName, r.wonCount, formatCurrency(r.totalWonValue)])}
          />
          {ranking.length > 0 ? (
            <ChartContainer config={{ totalWonValue: { label: 'Valor' } }} className="h-[250px]">
              <ResponsiveContainer>
                <BarChart data={ranking} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="vendorName" tick={{ fontSize: 11 }} width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="totalWonValue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyState />
          )}
        </div>
      </SubReport>

      <SubReport title="Atividades por Vendedor">
        <div className="grid grid-cols-2 gap-3">
          <ReportCard title="Total Interações" value={totalInteractions} />
          <ReportCard title="Tarefas Concluídas" value={totalTasks} />
        </div>
        <ReportTable
          exportFilename="performance_atividades.csv"
          headers={['Vendedor', 'Interações', 'Tarefas Concluídas']}
          rows={activities.map((a) => [a.vendorName, a.interactionsCount, a.completedTasksCount])}
        />
      </SubReport>

      <SubReport title="Taxa de Conversão Individual">
        <ReportTable
          exportFilename="performance_conversao_individual.csv"
          headers={['Vendedor', 'Ganhas', 'Perdidas', 'Conversão %']}
          rows={individual.map((i) => [
            i.vendorName,
            i.won,
            i.lost,
            `${i.conversionRate.toFixed(1)}%`,
          ])}
        />
      </SubReport>
    </div>
  )
}
