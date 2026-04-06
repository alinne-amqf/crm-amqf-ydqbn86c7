import { useState, useEffect } from 'react'
import { PipelineStage, Opportunity } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { opportunitiesService } from '@/services/opportunities'
import { getCustomers } from '@/services/customers'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, CheckSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const STAGES: PipelineStage[] = [
  'Prospecção',
  'Qualificação',
  'Proposta',
  'Negociação',
  'Fechado/Ganho',
  'Fechado/Perdido',
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
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          supabase.from('tasks').select('id, customer_id, status').eq('status', 'pending'),
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
    if (!id) return

    const opToMove = opportunities.find((op) => op.id === id)
    if (opToMove && opToMove.stage !== targetStage) {
      // Optimistic update
      setOpportunities((prev) =>
        prev.map((op) => (op.id === id ? { ...op, stage: targetStage } : op)),
      )

      try {
        await opportunitiesService.updateStage(id, targetStage)
      } catch (error) {
        // Revert on error
        setOpportunities((prev) =>
          prev.map((op) => (op.id === id ? { ...op, stage: opToMove.stage } : op)),
        )
        toast({
          title: 'Erro',
          description: 'Falha ao atualizar o estágio no banco de dados.',
          variant: 'destructive',
        })
      }
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
    setIsSubmitting(true)

    const numericValue = Number(formData.estimatedValue.replace(/\D/g, '')) / 100

    const payload = {
      title: formData.title,
      estimated_value: numericValue,
      stage: formData.stage,
      customer_id: formData.customerId,
      description: formData.description || undefined,
      expected_close_date: formData.expectedCloseDate || null,
    }

    try {
      if (editingId) {
        await opportunitiesService.update(editingId, payload)
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
    return tasks.filter((t) => t.customer_id === customerId).length
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col space-y-4 p-8 pt-6 bg-slate-50">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h2>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveOpportunity} className="space-y-4">
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
                <Label htmlFor="stage">Estágio Inicial</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, stage: value as PipelineStage })
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

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || !formData.customerId}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </form>
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
                className="flex w-80 flex-shrink-0 flex-col rounded-xl bg-white shadow-sm p-4 transition-colors hover:shadow-md border border-slate-100"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">{stage}</h3>
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium"
                    >
                      {columnOps.length}
                    </Badge>
                  </div>
                  <div className="text-sm font-bold text-primary">{formatCurrency(totalValue)}</div>
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
                        className="cursor-grab transition-all hover:border-slate-300 hover:shadow-md active:cursor-grabbing bg-white border border-slate-200 shadow-sm rounded-lg"
                      >
                        <CardContent className="flex flex-col gap-2 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium leading-tight text-slate-800 line-clamp-2">
                                {op.title}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 truncate">{customerName}</p>
                            </div>
                            <Avatar
                              className="h-6 w-6 border border-slate-100 flex-shrink-0"
                              title={responsibleName}
                            >
                              <AvatarFallback className="bg-slate-100 text-[10px] font-medium text-slate-600">
                                {getInitials(responsibleName)}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <div className="text-sm font-bold text-emerald-600">
                              {formatCurrency(op.estimatedValue)}
                            </div>

                            {pendingCount > 0 && (
                              <div
                                className="flex items-center text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                title={`${pendingCount} tarefa(s) pendente(s)`}
                              >
                                <CheckSquare className="h-3 w-3 mr-1" />
                                {pendingCount}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {columnOps.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-400 font-medium">
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
