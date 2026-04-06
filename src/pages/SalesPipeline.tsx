import { useState, useEffect } from 'react'
import { PipelineStage, Opportunity } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { opportunitiesService } from '@/services/opportunities'
import { getCustomers } from '@/services/customers'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
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
      const [opsData, customersData] = await Promise.all([
        opportunitiesService.getAll(),
        getCustomers(),
      ])
      setOpportunities(opsData)
      setCustomers(customersData)
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

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col space-y-4 p-8 pt-6">
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
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const columnOps = opportunities.filter((op) => op.stage === stage)
            const totalValue = columnOps.reduce((sum, op) => sum + op.estimatedValue, 0)

            return (
              <div
                key={stage}
                className="flex w-80 flex-shrink-0 flex-col rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold">{stage}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnOps.length}
                  </Badge>
                </div>
                <div className="mb-3 px-1 text-xs font-medium text-muted-foreground">
                  {formatCurrency(totalValue)}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {columnOps.map((op) => (
                    <Card
                      key={op.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, op.id)}
                      onClick={() => handleEdit(op)}
                      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm active:cursor-grabbing bg-background"
                    >
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm font-medium leading-none">
                          {op.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2 p-3 pt-0">
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {op.customerName}
                        </div>
                        <div className="text-sm font-bold text-primary">
                          {formatCurrency(op.estimatedValue)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {columnOps.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/20 text-xs text-muted-foreground">
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
