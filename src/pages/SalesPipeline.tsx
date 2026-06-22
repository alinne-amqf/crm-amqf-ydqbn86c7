import { useState, useEffect } from 'react'
import { PipelineStage } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { opportunitiesService } from '@/services/opportunities'
import { getCustomers } from '@/services/customers'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, CheckSquare, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createTask, TaskType } from '@/services/tasks'

const STAGES: PipelineStage[] = [
  'Prospecção',
  'Qualificação',
  'Proposta',
  'Negociação',
  'Fechado/Ganho',
  'Fechado/Perdido',
]

const LOSS_REASONS = [
  'Preço',
  'Concorrência',
  'Timing',
  'Budget Insuficiente',
  'Falta de Fit',
  'Outro',
]

export default function SalesPipeline() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<
    { id: string; name: string; customerType?: string; company?: string | null }[]
  >([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    estimatedValue: '',
    stage: 'Prospecção' as PipelineStage,
    customerId: '',
    description: '',
    expectedCloseDate: '',
    lossReason: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Loss Modal state
  const [isLossModalOpen, setIsLossModalOpen] = useState(false)
  const [pendingMove, setPendingMove] = useState<{
    id: string
    targetStage: PipelineStage
    previousStage: PipelineStage
  } | null>(null)
  const [lossReason, setLossReason] = useState('')
  const [isSubmittingLoss, setIsSubmittingLoss] = useState(false)

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    type: 'call' as TaskType,
    description: '',
    dueDate: '',
    customerId: '',
  })
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [opsData, customersData, { data: profilesData }, { data: tasksData }] =
        await Promise.all([
          opportunitiesService.getAll(),
          getCustomers(),
          supabase.from('profiles').select('id, name'),
          supabase.from('tasks').select('id, customer_id, status').neq('status', 'completed'),
        ])
      setOpportunities(opsData)
      setCustomers(customersData)
      if (profilesData) setProfiles(profilesData)
      if (tasksData) setTasks(tasksData)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as oportunidades.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('opportunityId', id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('opportunityId')
    if (!id || !user) return

    const opToMove = opportunities.find((op) => op.id === id)
    if (opToMove && opToMove.stage !== targetStage) {
      if (targetStage === 'Fechado/Perdido') {
        setPendingMove({ id, targetStage, previousStage: opToMove.stage })
        setIsLossModalOpen(true)
        return
      }

      // Optimistic update
      setOpportunities((prev) =>
        prev.map((op) => (op.id === id ? { ...op, stage: targetStage, lossReason: null } : op)),
      )

      try {
        await opportunitiesService.updateStage(id, targetStage, null, user.id)
      } catch (error) {
        // Revert on error
        setOpportunities((prev) =>
          prev.map((op) =>
            op.id === id ? { ...op, stage: opToMove.stage, lossReason: opToMove.lossReason } : op,
          ),
        )
        toast({
          title: 'Erro',
          description: 'Falha ao atualizar o estágio no banco de dados.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleConfirmLoss = async () => {
    if (!pendingMove || !user) return
    setIsSubmittingLoss(true)

    const { id, targetStage } = pendingMove

    // Optimistic update
    setOpportunities((prev) =>
      prev.map((op) => (op.id === id ? { ...op, stage: targetStage, lossReason } : op)),
    )

    try {
      await opportunitiesService.updateStage(id, targetStage, lossReason, user.id)
      setIsLossModalOpen(false)
      toast({ title: 'Sucesso', description: 'Oportunidade marcada como perdida.' })
    } catch (error) {
      // Revert on error
      setOpportunities((prev) =>
        prev.map((op) => (op.id === id ? { ...op, stage: pendingMove.previousStage } : op)),
      )
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o banco de dados.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingLoss(false)
      setPendingMove(null)
      setLossReason('')
    }
  }

  const handleNew = () => {
    setEditingId(null)
    setFormData({
      title: '',
      estimatedValue: '',
      stage: 'Prospecção',
      customerId: '',
      description: '',
      expectedCloseDate: '',
      lossReason: '',
    })
  }

  const handleEdit = (op: any) => {
    setEditingId(op.id)
    setFormData({
      title: op.title,
      estimatedValue: op.estimatedValue
        ? new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(op.estimatedValue)
        : '',
      stage: op.stage,
      customerId: op.customerId,
      description: op.description || '',
      expectedCloseDate: op.expectedCloseDate || '',
      lossReason: op.lossReason || '',
    })
    setIsDialogOpen(true)
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (!value) {
      setFormData((prev) => ({ ...prev, estimatedValue: '' }))
      return
    }
    const numValue = Number(value) / 100
    setFormData((prev) => ({
      ...prev,
      estimatedValue: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(numValue),
    }))
  }

  const handleSaveOpportunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (formData.stage === 'Fechado/Perdido' && !formData.lossReason) {
      toast({
        title: 'Atenção',
        description: 'Selecione o motivo da perda.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    const numericValue = Number(formData.estimatedValue.replace(/\D/g, '')) / 100

    const payload = {
      title: formData.title,
      estimated_value: numericValue,
      stage: formData.stage,
      customer_id: formData.customerId,
      description: formData.description || undefined,
      expected_close_date: formData.expectedCloseDate || null,
      loss_reason: formData.stage === 'Fechado/Perdido' ? formData.lossReason : null,
    }

    try {
      if (editingId) {
        await opportunitiesService.update(editingId, payload, user.id)
        toast({ title: 'Sucesso', description: 'Oportunidade atualizada com sucesso.' })
      } else {
        await opportunitiesService.create({
          ...payload,
          user_id: user.id,
        })
        toast({ title: 'Sucesso', description: 'Oportunidade criada com sucesso.' })
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Não foi possível ${editingId ? 'atualizar' : 'criar'} a oportunidade.`,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getPendingTasksCount = (op: any) => {
    const customerId = op.customerId || op.customer_id
    return tasks.filter((t) => t.customer_id === customerId && t.status !== 'completed').length
  }

  const handleNewTaskClick = (op: any) => {
    setTaskFormData({
      title: '',
      type: 'call',
      description: '',
      dueDate: '',
      customerId: op.customerId || op.customer_id,
    })
    setIsTaskModalOpen(true)
  }

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmittingTask(true)

    try {
      const newTask = await createTask(
        {
          title: taskFormData.title,
          description: taskFormData.description || null,
          type: taskFormData.type,
          due_date: new Date(taskFormData.dueDate).toISOString(),
          customer_id: taskFormData.customerId,
          status: 'pending',
          priority: 'Media',
        },
        'Criar Tarefa (via Kanban)',
      )

      setTasks((prev) => [...prev, newTask])
      toast({ title: 'Sucesso', description: 'Tarefa criada com sucesso!' })
      setIsTaskModalOpen(false)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tarefa.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingTask(false)
    }
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col space-y-4 p-8 pt-6 bg-slate-50">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-h1 text-foreground">Pipeline de Vendas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 font-semibold shadow-md"
              onClick={handleNew}
            >
              <Plus className="mr-2 h-5 w-5" /> Nova Oportunidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveOpportunity} className="space-y-4 py-2">
              {editingId && formData.stage === 'Fechado/Perdido' && formData.lossReason && (
                <div className="mb-2 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-semibold text-sm">Oportunidade Perdida</span>
                  </div>
                  <span className="text-sm pl-7">Motivo: {formData.lossReason}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Título do Negócio</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {customers.find((c) => c.id === formData.customerId)?.customerType === 'B2B' && (
                <div className="space-y-2 animate-fade-in-down">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    readOnly
                    value={customers.find((c) => c.id === formData.customerId)?.company || ''}
                    className="bg-muted cursor-not-allowed"
                    tabIndex={-1}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes adicionais sobre a oportunidade..."
                  className="resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Estimado</Label>
                  <Input
                    id="value"
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={formData.estimatedValue}
                    onChange={handleCurrencyChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedCloseDate">Data de Fechamento</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedCloseDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Estágio</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      stage: value as PipelineStage,
                      lossReason: value === 'Fechado/Perdido' ? formData.lossReason : '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.stage === 'Fechado/Perdido' && (
                <div className="space-y-2 animate-fade-in-down">
                  <Label htmlFor="lossReason">Motivo da Perda</Label>
                  <Select
                    value={formData.lossReason}
                    onValueChange={(value) => setFormData({ ...formData, lossReason: value })}
                  >
                    <SelectTrigger className="border-red-200 focus:ring-red-500">
                      <SelectValue placeholder="Selecione um motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOSS_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || !formData.customerId}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Task Modal */}
        <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
              <DialogDescription>Crie uma nova tarefa associada a este cliente.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveTask} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="taskTitle">Título da tarefa *</Label>
                <Input
                  id="taskTitle"
                  required
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taskType">Tipo de tarefa</Label>
                  <Select
                    value={taskFormData.type}
                    onValueChange={(v: TaskType) =>
                      setTaskFormData((prev) => ({ ...prev, type: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Ligação</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="proposta">Proposta</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskDueDate">Vencimento *</Label>
                  <Input
                    id="taskDueDate"
                    type="datetime-local"
                    required
                    value={taskFormData.dueDate}
                    onChange={(e) =>
                      setTaskFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskDesc">Descrição</Label>
                <Textarea
                  id="taskDesc"
                  value={taskFormData.description}
                  onChange={(e) =>
                    setTaskFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="resize-none"
                  rows={2}
                />
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" type="button" onClick={() => setIsTaskModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingTask || !taskFormData.title || !taskFormData.dueDate}
                >
                  {isSubmittingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Interceptador de Perda (Drag & Drop) */}
        <Dialog
          open={isLossModalOpen}
          onOpenChange={(open) => {
            setIsLossModalOpen(open)
            if (!open) {
              setPendingMove(null)
              setLossReason('')
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Motivo da Perda</DialogTitle>
              <DialogDescription>
                Por favor, informe o motivo pelo qual esta oportunidade foi perdida para nos ajudar
                a melhorar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <RadioGroup value={lossReason} onValueChange={setLossReason} className="space-y-2">
                {LOSS_REASONS.map((reason) => (
                  <div key={reason} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason} id={`reason-${reason}`} />
                    <Label htmlFor={`reason-${reason}`} className="font-normal cursor-pointer">
                      {reason}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLossModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmLoss}
                disabled={!lossReason || isSubmittingLoss}
              >
                {isSubmittingLoss && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-1 gap-6 overflow-x-auto pb-6 scroll-smooth">
          {STAGES.map((stage) => {
            const columnOps = opportunities.filter((op) => op.stage === stage)
            const totalValue = columnOps.reduce((sum, op) => sum + op.estimatedValue, 0)

            return (
              <div
                key={stage}
                className="flex w-80 flex-shrink-0 flex-col rounded-md bg-muted border border-border shadow-sm p-4 transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="mb-4 flex flex-col gap-2 border-b border-border pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-foreground">{stage}</h3>
                    <Badge
                      variant="outline"
                      className="bg-white border-border text-muted-foreground text-[11px] font-medium px-2 py-0"
                    >
                      {columnOps.length}
                    </Badge>
                  </div>
                  <div className="text-[14px] font-bold text-primary">
                    {formatCurrency(totalValue)}
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {columnOps.map((op) => {
                    const pendingCount = getPendingTasksCount(op)
                    const responsibleId = op.userId || op.user_id
                    const responsibleName =
                      profiles.find((p) => p.id === responsibleId)?.name || 'Usuário'
                    const customerName =
                      op.customerName ||
                      customers.find((c) => c.id === (op.customerId || op.customer_id))?.name ||
                      'Cliente Desconhecido'

                    return (
                      <Card
                        key={op.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, op.id)}
                        onClick={() => handleEdit(op)}
                        className="cursor-grab transition-all hover:bg-muted active:cursor-grabbing bg-white border border-border shadow-[0_1px_3px_rgba(0,0,0,0.08)] rounded-md"
                      >
                        <CardContent className="flex flex-col gap-2 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[14px] font-semibold leading-tight text-primary line-clamp-2 hover:underline">
                                {op.title}
                              </h4>
                              <p className="text-[12px] text-foreground mt-1 truncate">
                                {customerName}
                              </p>
                            </div>
                            <Avatar
                              className="h-6 w-6 border border-border flex-shrink-0"
                              title={responsibleName}
                            >
                              <AvatarFallback className="bg-accent text-[10px] font-medium text-foreground">
                                {getInitials(responsibleName)}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                            <div className="text-[12px] font-bold text-success">
                              {formatCurrency(op.estimatedValue)}
                            </div>

                            <div className="flex items-center gap-2">
                              {pendingCount > 0 && (
                                <div
                                  className="flex items-center text-warning font-medium text-[11px]"
                                  title={`${pendingCount} tarefa(s) pendente(s)`}
                                >
                                  <CheckSquare className="h-3 w-3 mr-1" />
                                  {pendingCount}
                                </div>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2 py-0 border-primary/20 text-primary hover:bg-primary hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNewTaskClick(op)
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Tarefa
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {columnOps.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-border bg-white/50 text-[12px] text-muted-foreground font-medium">
                      Solte aqui
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
