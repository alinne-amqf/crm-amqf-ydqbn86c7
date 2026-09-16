import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { createTask, TaskType, TaskPriority } from '@/services/tasks'
import { Customer } from '@/lib/types'

interface NewTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NewTaskModal({ open, onOpenChange, onSuccess }: NewTaskModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [type, setType] = useState<TaskType>('call')
  const [priority, setPriority] = useState<TaskPriority>('Media')
  const [customerId, setCustomerId] = useState('')

  useEffect(() => {
    if (open) {
      loadCustomers()
    }
  }, [open])

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true)
      const { data, error } = await supabase.from('customers').select('*').order('name')
      if (error) throw error
      if (data) {
        setCustomers(
          data.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            company: c.company,
            status: c.status,
            customerType: c.customer_type || 'B2C',
            document: c.document,
            createdAt: c.created_at,
          })),
        )
      }
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err)
    } finally {
      setLoadingCustomers(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDueDate('')
    setType('call')
    setPriority('Media')
    setCustomerId('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dueDate || !customerId) {
      toast.error('Preencha os campos obrigatórios (*)')
      return
    }

    try {
      setIsSubmitting(true)
      await createTask(
        {
          title: title.trim(),
          description: description.trim() || null,
          due_date: new Date(dueDate).toISOString(),
          type,
          priority,
          status: 'pending',
          customer_id: customerId,
        },
        `Criou a tarefa: ${title.trim()}`,
      )

      toast.success('Tarefa criada com sucesso!')
      onOpenChange(false)
      resetForm()
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      toast.error('Erro ao criar tarefa', { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>Crie uma nova atividade vinculada a um cliente.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="modal-task-title">Título da tarefa *</Label>
            <Input
              id="modal-task-title"
              placeholder="Ex: Ligar para confirmar proposta"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-task-customer">Cliente Vinculado *</Label>
            <Select value={customerId} onValueChange={setCustomerId} required>
              <SelectTrigger id="modal-task-customer" className="bg-white">
                <SelectValue
                  placeholder={loadingCustomers ? 'Carregando...' : 'Selecione um cliente'}
                />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-task-type">Tipo</Label>
              <Select value={type} onValueChange={(v: TaskType) => setType(v)}>
                <SelectTrigger id="modal-task-type" className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Ligação</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-task-priority">Prioridade</Label>
              <Select value={priority} onValueChange={(v: TaskPriority) => setPriority(v)}>
                <SelectTrigger id="modal-task-priority" className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-task-duedate">Data e Hora de Vencimento *</Label>
            <Input
              id="modal-task-duedate"
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-task-desc">Descrição / Detalhes</Label>
            <Textarea
              id="modal-task-desc"
              placeholder="Anotações e detalhes sobre a atividade..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !title || !dueDate || !customerId}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Tarefa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
