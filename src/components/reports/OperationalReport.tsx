import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ReportCard, ReportTable, SubReport } from './shared'
import * as svc from '@/services/reports/operational'

interface Props {
  dateStart?: string
  dateEnd?: string
  userId?: string
  sellers: { id: string; name: string | null }[]
}

const TASK_TYPE_LABELS: Record<string, string> = {
  call: 'Ligação',
  meeting: 'Reunião',
  email: 'E-mail',
  proposta: 'Proposta',
  'follow-up': 'Follow-up',
  other: 'Outro',
}

export function OperationalReport({ dateStart, dateEnd, userId, sellers }: Props) {
  const [loading, setLoading] = useState(true)
  const [taskSummary, setTaskSummary] = useState<{
    items: svc.TaskSummaryItem[]
    totalPending: number
    totalOverdue: number
  }>({ items: [], totalPending: 0, totalOverdue: 0 })
  const [auditLogs, setAuditLogs] = useState<svc.AuditLogItem[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  const [auditTable, setAuditTable] = useState('')
  const [auditAction, setAuditAction] = useState('')
  const [auditChangedBy, setAuditChangedBy] = useState('')
  const [auditDateStart, setAuditDateStart] = useState('')
  const [auditDateEnd, setAuditDateEnd] = useState('')

  useEffect(() => {
    setLoading(true)
    svc
      .getTaskSummaryByVendor(dateStart, dateEnd, userId)
      .then(setTaskSummary)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateStart, dateEnd, userId])

  useEffect(() => {
    setAuditLoading(true)
    svc
      .getAuditLogs({
        tableName: auditTable || undefined,
        action: auditAction || undefined,
        changedBy: auditChangedBy || undefined,
        startDate: auditDateStart || undefined,
        endDate: auditDateEnd || undefined,
      })
      .then(setAuditLogs)
      .catch(console.error)
      .finally(() => setAuditLoading(false))
  }, [auditTable, auditAction, auditChangedBy, auditDateStart, auditDateEnd])

  if (loading) return <div className="py-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-8">
      <SubReport title="Tarefas Pendentes e Vencidas por Vendedor e Tipo">
        <div className="grid grid-cols-2 gap-3">
          <ReportCard title="Tarefas Pendentes" value={taskSummary.totalPending} />
          <ReportCard title="Tarefas Vencidas" value={taskSummary.totalOverdue} />
        </div>
        <ReportTable
          exportFilename="operacional_tarefas.csv"
          headers={['Vendedor', 'Tipo', 'Pendentes', 'Vencidas']}
          rows={taskSummary.items.map((i) => [
            i.vendorName,
            TASK_TYPE_LABELS[i.taskType] || i.taskType,
            i.pendingCount,
            i.overdueCount,
          ])}
        />
      </SubReport>

      <SubReport title="Histórico de Auditoria">
        <ReportCard title="Total de Registros" value={auditLogs.length} />
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Tabela</Label>
            <Select
              value={auditTable || 'all'}
              onValueChange={(v) => setAuditTable(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-40 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="opportunities">Opportunities</SelectItem>
                <SelectItem value="interactions">Interactions</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Ação</Label>
            <Select
              value={auditAction || 'all'}
              onValueChange={(v) => setAuditAction(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-32 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="INSERT">INSERT</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Usuário</Label>
            <Select
              value={auditChangedBy || 'all'}
              onValueChange={(v) => setAuditChangedBy(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-40 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {sellers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name || 'Sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Data inicial</Label>
            <Input
              type="date"
              value={auditDateStart}
              onChange={(e) => setAuditDateStart(e.target.value)}
              className="w-40 bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Data final</Label>
            <Input
              type="date"
              value={auditDateEnd}
              onChange={(e) => setAuditDateEnd(e.target.value)}
              className="w-40 bg-white"
            />
          </div>
        </div>
        {auditLoading ? (
          <div className="text-center text-muted-foreground py-8">Carregando...</div>
        ) : (
          <ReportTable
            exportFilename="operacional_auditoria.csv"
            headers={[
              'Tabela',
              'Record ID',
              'Ação',
              'Dados Anteriores',
              'Dados Novos',
              'Alterado por',
              'Data',
            ]}
            rows={auditLogs.map((l) => [
              l.tableName,
              l.recordId.substring(0, 8),
              l.action,
              l.oldData ? JSON.stringify(l.oldData).substring(0, 100) : '—',
              l.newData ? JSON.stringify(l.newData).substring(0, 100) : '—',
              l.changedBy,
              new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(l.changedAt)),
            ])}
          />
        )}
      </SubReport>
    </div>
  )
}
