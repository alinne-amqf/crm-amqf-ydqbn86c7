import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  ReportCard,
  ReportTable,
  SubReport,
  EmptyState,
  CHART_COLORS,
  formatCurrency,
  formatDate,
} from './shared'
import * as svc from '@/services/reports/pipeline'

interface Props {
  dateStart?: string
  dateEnd?: string
  userId?: string
}

export function PipelineReport({ dateStart, dateEnd, userId }: Props) {
  const [loading, setLoading] = useState(true)
  const [stageData, setStageData] = useState<svc.PipelineStageData[]>([])
  const [conversion, setConversion] = useState<svc.ConversionData>({
    won: 0,
    lost: 0,
    conversionRate: 0,
  })
  const [lossReasons, setLossReasons] = useState<svc.LossReasonData[]>([])
  const [forecast, setForecast] = useState<svc.RevenueForecastItem[]>([])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      svc.getPipelineByPeriod(dateStart, dateEnd, userId),
      svc.getConversionRate(dateStart, dateEnd, userId),
      svc.getLossReasons(dateStart, dateEnd, userId),
      svc.getRevenueForecast(dateStart, dateEnd, userId),
    ])
      .then(([s, c, l, f]) => {
        setStageData(s)
        setConversion(c)
        setLossReasons(l)
        setForecast(f)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateStart, dateEnd, userId])

  if (loading) return <div className="py-8 text-center text-muted-foreground">Carregando...</div>

  const totalOps = stageData.reduce((s, d) => s + d.count, 0)
  const totalValue = stageData.reduce((s, d) => s + d.totalValue, 0)
  const forecastTotal = forecast.reduce((s, f) => s + f.estimatedValue, 0)

  return (
    <div className="space-y-8">
      <SubReport title="Funil por período (Quantidade e Valor)">
        <div className="grid grid-cols-2 gap-3">
          <ReportCard title="Total Oportunidades" value={totalOps} />
          <ReportCard title="Valor Total" value={formatCurrency(totalValue)} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReportTable
            exportFilename="pipeline_funil.csv"
            headers={['Stage', 'Quantidade', 'Valor Total']}
            rows={stageData.map((s) => [s.stage, s.count, formatCurrency(s.totalValue)])}
          />
          {stageData.length > 0 ? (
            <ChartContainer config={{ count: { label: 'Oportunidades' } }} className="h-[250px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stageData}
                    dataKey="count"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {stageData.map((_, i) => (
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
      </SubReport>

      <SubReport title="Taxa de Conversão (Ganhas vs Perdidas)">
        <div className="grid grid-cols-3 gap-3">
          <ReportCard title="Ganhas" value={conversion.won} />
          <ReportCard title="Perdidas" value={conversion.lost} />
          <ReportCard title="Conversão" value={`${conversion.conversionRate.toFixed(1)}%`} />
        </div>
        <ReportTable
          exportFilename="pipeline_conversao.csv"
          headers={['Status', 'Quantidade', 'Percentagem']}
          rows={[
            ['Ganha', conversion.won, `${conversion.conversionRate.toFixed(1)}%`],
            ['Perdida', conversion.lost, `${(100 - conversion.conversionRate).toFixed(1)}%`],
          ]}
        />
      </SubReport>

      <SubReport title="Motivos de Perda (Ranking)">
        <ReportCard title="Total Perdidas" value={lossReasons.reduce((s, l) => s + l.count, 0)} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          <ReportTable
            exportFilename="pipeline_motivos_perda.csv"
            headers={['Motivo', 'Quantidade']}
            rows={lossReasons.map((l) => [l.lossReason, l.count])}
          />
          {lossReasons.length > 0 ? (
            <ChartContainer config={{ count: { label: 'Perdas' } }} className="h-[250px]">
              <ResponsiveContainer>
                <BarChart data={lossReasons}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="lossReason"
                    tick={{ fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyState />
          )}
        </div>
      </SubReport>

      <SubReport title="Previsão de Receita">
        <ReportCard title="Valor Previsto" value={formatCurrency(forecastTotal)} />
        <ReportTable
          exportFilename="pipeline_previsao.csv"
          headers={['Título', 'Cliente', 'Stage', 'Valor', 'Fechamento Esperado']}
          rows={forecast.map((f) => [
            f.title,
            f.customerName,
            f.stage,
            formatCurrency(f.estimatedValue),
            formatDate(f.expectedCloseDate),
          ])}
        />
      </SubReport>
    </div>
  )
}
