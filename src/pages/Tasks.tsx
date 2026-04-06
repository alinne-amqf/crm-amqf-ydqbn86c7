import { useState, useEffect } from 'react'
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
  LayoutList,
  Loader2,
  Check,
  Pencil,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Task, getTasks, createTask, updateTask, deleteTask } from '@/services/tasks'
import { supabase } from '@/lib/supabase/client'
import { Customer } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [newTaskType, setNewTaskType] = useState<Task['type']>('call')
  const [newTaskCustomerId, setNewTaskCustomerId] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tasksData, customersData] = await Promise.all([
        getTasks(),
        supabase.from('customers').select('*').order('name'),
      ])
      setTasks(tasksData)
      if (customersData.data) {
        setCustomers(customersData.data as Customer[])
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTask = async () => {
    if (!newTaskTitle || !newTaskDate || !newTaskCustomerId) return
    try {
      setIsSubmitting(true)

      const taskData = {
        title: newTaskTitle,
        due_date: new Date(newTaskDate).toISOString(),
        type: newTaskType,
        customer_id: newTaskCustomerId,
      }

      let savedTask: Task

      if (editingTask) {
        savedTask = await updateTask(editingTask.id, taskData)
        toast.success('Tarefa atualizada com sucesso!')
      } else {
        savedTask = await createTask({
          ...taskData,
          status: 'pending',
        })
        toast.success('Tarefa criada com sucesso!')
      }

      const customer = customers.find((c) => c.id === newTaskCustomerId)
      if (customer) {
        savedTask.customers = { name: customer.name, company: customer.company }
      }

      if (editingTask) {
        setTasks((prev) =>
          prev
            .map((t) => (t.id === editingTask.id ? savedTask : t))
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()),
        )
      } else {
        setTasks((prev) =>
          [...prev, savedTask].sort(
            (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
          ),
        )
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast.error('Erro ao salvar tarefa', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setNewTaskTitle(task.title)
    setNewTaskDate(format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm"))
    setNewTaskType(task.type)
    setNewTaskCustomerId(task.customer_id)
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setNewTaskTitle('')
    setNewTaskDate('')
    setNewTaskType('call')
    setNewTaskCustomerId('')
    setEditingTask(null)
  }

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending'
      await updateTask(task.id, { status: newStatus })
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))
      if (newStatus === 'completed') {
        toast.success('Tarefa concluída!')
      }
    } catch (error: any) {
      toast.error('Erro ao atualizar tarefa', { description: error.message })
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id)
      setTasks(tasks.filter((t) => t.id !== id))
      toast.success('Tarefa excluída!')
    } catch (error: any) {
      toast.error('Erro ao excluir tarefa', { description: error.message })
    }
  }

  const pendingTasks = tasks.filter((t) => t.status === 'pending')
  const completedTasks = tasks.filter((t) => t.status === 'completed')

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="flex items-start justify-between p-4 border rounded-xl bg-white hover:border-primary/50 transition-colors shadow-sm mb-3 group">
      <div className="flex items-start gap-4">
        <button
          onClick={() => handleToggleStatus(task)}
          className={`mt-0.5 transition-colors ${task.status === 'completed' ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'}`}
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <Circle className="h-6 w-6" />
          )}
        </button>
        <div>
          <h4
            className={`text-base font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}
          >
            {task.title}
          </h4>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
            <span className="flex items-center font-medium">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-bold text-[10px] mr-2">
                {task.type}
              </span>
              {task.customers?.name} {task.customers?.company && `(${task.customers.company})`}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(task.due_date), "dd 'de' MMMM", { locale: ptBR })}
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(task.due_date), 'HH:mm', { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleToggleStatus(task)}>
            <Check className="mr-2 h-4 w-4" />
            {task.status === 'pending' ? 'Marcar concluída' : 'Marcar pendente'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleEditTask(task)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar tarefa
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir tarefa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tarefas</h2>
          <p className="text-muted-foreground">Gerencie suas atividades e acompanhamentos.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Pendentes
              <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                {pendingTasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              Concluídas
              <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                {completedTasks.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            <Card className="border-none shadow-none bg-transparent">
              {pendingTasks.length > 0 ? (
                <div className="space-y-1">
                  {pendingTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center bg-white border border-dashed rounded-xl">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <LayoutList className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Tudo em dia!</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Você não tem tarefas pendentes. Aproveite para criar novos acompanhamentos.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                    Criar nova tarefa
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            <Card className="border-none shadow-none bg-transparent">
              {completedTasks.length > 0 ? (
                <div className="space-y-1 opacity-70">
                  {completedTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  Nenhuma tarefa concluída ainda.
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ex: Ligar para confirmar proposta"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer">Cliente Vinculado</Label>
              <Select value={newTaskCustomerId} onValueChange={setNewTaskCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
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
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={newTaskType} onValueChange={(v: any) => setNewTaskType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Ligação</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Data e Hora</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTask}
              disabled={!newTaskTitle || !newTaskDate || !newTaskCustomerId || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingTask ? 'Atualizar Tarefa' : 'Salvar Tarefa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
