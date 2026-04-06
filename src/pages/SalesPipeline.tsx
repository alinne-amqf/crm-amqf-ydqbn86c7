import { useState, useEffect } from 'react'
import { PipelineStage, Opportunity } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { opportunitiesService } from '@/services/opportunities'
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
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Form state
  const [newOp, setNewOp] = useState({
    title: '',
    estimatedValue: '',
    stage: 'Prospecção' as PipelineStage,
    customerId: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [opsData, customersData] = await Promise.all([
        opportunitiesService.getAll(),
        opportunitiesService.getCustomers(),
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

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)
    try {
      await opportunitiesService.create({
        title: newOp.title,
        estimated_value: Number(newOp.estimatedValue),
        stage: newOp.stage,
        customer_id: newOp.customerId,
        user_id: user.id,
      })
      toast({ title: 'Sucesso', description: 'Oportunidade criada com sucesso.' })
      setIsDialogOpen(false)
      setNewOp({ title: '', estimatedValue: '', stage: 'Prospecção', customerId: '' })
      fetchData()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a oportunidade.',
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
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova Oportunidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Oportunidade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOpportunity} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Negócio</Label>
                <Input
                  id="title"
                  required
                  value={newOp.title}
                  onChange={(e) => setNewOp({ ...newOp, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <Select
                  value={newOp.customerId}
                  onValueChange={(value) => setNewOp({ ...newOp, customerId: value })}
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
              <div className="space-y-2">
                <Label htmlFor="value">Valor Estimado (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={newOp.estimatedValue}
                  onChange={(e) => setNewOp({ ...newOp, estimatedValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Estágio Inicial</Label>
                <Select
                  value={newOp.stage}
                  onValueChange={(value) => setNewOp({ ...newOp, stage: value as PipelineStage })}
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
                <Button type="submit" disabled={isSubmitting || !newOp.customerId}>
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
                      className="cursor-grab transition-all hover:border-primary/50 hover:shadow-sm active:cursor-grabbing bg-background"
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
