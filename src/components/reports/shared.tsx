import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportToCsv } from '@/lib/csv'

export const CHART_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#14b8a6',
]

export function ReportCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string | number
  icon?: any
}) {
  return (
    <Card className="p-4 flex flex-col gap-1 shadow-sm">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </span>
      <span className="text-2xl font-bold text-foreground">{value}</span>
    </Card>
  )
}

export function ReportTable({
  headers,
  rows,
  exportFilename,
}: {
  headers: string[]
  rows: (string | number | null)[][]
  exportFilename?: string
}) {
  const handleExport = () => {
    if (exportFilename) exportToCsv(exportFilename, headers, rows)
  }
  return (
    <div>
      {exportFilename && (
        <Button variant="outline" size="sm" className="mb-2" onClick={handleExport}>
          <Download className="h-3 w-3 mr-1" /> Exportar CSV
        </Button>
      )}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h, i) => (
                <TableHead key={i} className="text-xs">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum dado encontrado para o período selecionado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j} className="text-sm">
                      {cell ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function SubReport({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-foreground border-b pb-2">{title}</h3>
      {children}
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="text-center text-muted-foreground py-8">
      Nenhum dado encontrado para o período selecionado.
    </div>
  )
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export function formatDate(date: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}
