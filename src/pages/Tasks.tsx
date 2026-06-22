import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Clock,
  MoreVertical,
  Trash2,
  LayoutList,
  Loader2,
  Check,
  Pencil,
  Search,
  Filter,
  X,
  PlayCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isWithinInterval,
  startOfDay,
  addDays,
  endOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Task, getTasks, createTask, updateTask, deleteTask } from '@/services/tasks'
import { supabase } from '@/lib/supabase/client'
import { Customer } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [newTaskType, setNewTaskType] = useState<Task['type']>('call')
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('Media')
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('pending')
  const [newTaskCustomerId, setNewTaskCustomerId] = useState('')

  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'overdue') {
      setDateFilter('overdue')
      setStatusFilter(['pending', 'in_progress'])
    } else if (filter === 'pending') {
      setStatusFilter(['pending'])
    }
  }, [searchParams])

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

  const isOverdue = (task: Task) =>
    new Date(task.due_date) < new Date() && task.status !== 'completed'

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const searchLower = searchTerm.toLowerCase()
      if (
        searchTerm &&
        !t.title.toLowerCase().includes(searchLower) &&
        !t.description?.toLowerCase().includes(searchLower)
      )
        return false

      if (statusFilter.length > 0 && !statusFilter.includes(t.status)) return false

      if (customerFilter !== 'all' && t.customer_id !== customerFilter) return false

      const dueDate = new Date(t.due_date)
      const now = new Date()
      if (dateFilter === 'today' && !isSameDay(dueDate, now)) return false
      if (
        dateFilter === 'next_7' &&
        !isWithinInterval(dueDate, { start: startOfDay(now), end: addDays(endOfDay(now), 7) })
      )
        return false
      if (
        dateFilter === 'next_30' &&
        !isWithinInterval(dueDate, { start: startOfDay(now), end: addDays(endOfDay(now), 30) })
      )
        return false
      if (dateFilter === 'overdue' && !isOverdue(t)) return false

      return true
    })
  }, [tasks, searchTerm, statusFilter, customerFilter, dateFilter])

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentMonth)),
      end: endOfWeek(endOfMonth(currentMonth)),
    })
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter([])
    setDateFilter('all')
    setCustomerFilter('all')
  }

  const resetForm = () => {
    setNewTaskTitle('')
    setNewTaskDesc('')
    setNewTaskDate('')
    setNewTaskType('call')
    setNewTaskPriority('Media')
    setNewTaskStatus('pending')
    setNewTaskCustomerId('')
    setEditingTask(null)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setNewTaskTitle(task.title)
    setNewTaskDesc(task.description || '')
    setNewTaskDate(format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm"))
    setNewTaskType(task.type)
    setNewTaskPriority(task.priority)
    setNewTaskStatus(task.status)
    setNewTaskCustomerId(task.customer_id)
    setIsDialogOpen(true)
  }

  const handleSaveTask = async () => {
    if (!newTaskTitle || !newTaskDate || !newTaskCustomerId) return
    try {
      setIsSubmitting(true)
      const taskData = {
        title: newTaskTitle,
        description: newTaskDesc,
        due_date: new Date(newTaskDate).toISOString(),
        type: newTaskType,
        priority: newTaskPriority,
        status: newTaskStatus,
        customer_id: newTaskCustomerId,
      }

      let savedTask: Task
      if (editingTask) {
        savedTask = await updateTask(editingTask.id, taskData)
        toast.success('Tarefa atualizada com sucesso!')
      } else {
        savedTask = await createTask(taskData)
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

  const handleComplete = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'completed' })
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: 'completed' } : t)))
      toast.success('Tarefa concluída!')
    } catch (error: any) {
      toast.error('Erro ao atualizar tarefa', { description: error.message })
    }
  }

  const confirmDelete = async () => {
    if (!taskToDelete) return
    try {
      await deleteTask(taskToDelete)
      setTasks(tasks.filter((t) => t.id !== taskToDelete))
      toast.success('Tarefa excluída!')
    } catch (error: any) {
      toast.error('Erro ao excluir tarefa', { description: error.message })
    } finally {
      setTaskToDelete(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'Media':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'Baixa':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusBadge = (task: Task) => {
    if (isOverdue(task)) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 gap-1">
          <AlertCircle className="w-3 h-3" /> Atrasada
        </Badge>
      )
    }
    switch (task.status) {
      case 'completed':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> Concluída
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
            <PlayCircle className="w-3 h-3" /> Em Andamento
          </Badge>
        )
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1"
          >
            <Clock className="w-3 h-3" /> Pendente
          </Badge>
        )
      default:
        return null
    }
  }

  const TaskItem = ({ task }: { task: Task }) => {
    const overdue = isOverdue(task)
    return (
      <div className="flex items-start justify-between p-4 border border-border rounded-lg bg-white hover:border-primary/30 transition-all shadow-sm mb-3 group">
        <div className="flex items-start gap-4 flex-1">
          <button
            onClick={() => (task.status !== 'completed' ? handleComplete(task) : null)}
            disabled={task.status === 'completed'}
            className={cn(
              'mt-0.5 transition-colors flex-shrink-0',
              task.status === 'completed'
                ? 'text-emerald-500 cursor-default'
                : 'text-slate-300 hover:text-emerald-500',
            )}
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </button>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={cn(
                  'text-base font-semibold',
                  task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800',
                )}
              >
                {task.title}
              </h4>
              {getStatusBadge(task)}
              <Badge
                variant="outline"
                className={cn('text-[10px] uppercase font-bold', getPriorityColor(task.priority))}
              >
                {task.priority}
              </Badge>
            </div>
            {task.description && (
              <p
                className={cn(
                  'text-sm line-clamp-1',
                  task.status === 'completed' ? 'text-slate-400' : 'text-slate-500',
                )}
              >
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center text-slate-700">
                <Badge variant="secondary" className="mr-2 uppercase text-[10px] rounded-sm">
                  {task.type === 'call'
                    ? 'Ligação'
                    : task.type === 'meeting'
                      ? 'Reunião'
                      : task.type === 'email'
                        ? 'E-mail'
                        : task.type === 'proposta'
                          ? 'Proposta'
                          : task.type === 'follow-up'
                            ? 'Follow-up'
                            : 'Outro'}
                </Badge>
                {task.customers?.name} {task.customers?.company && `(${task.customers.company})`}
              </span>
              <span
                className={cn('flex items-center gap-1', overdue && 'text-red-600 font-semibold')}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1">
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
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {task.status !== 'completed' && (
              <DropdownMenuItem onClick={() => handleComplete(task)}>
                <Check className="mr-2 h-4 w-4 text-emerald-600" />
                Marcar concluída
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleEditTask(task)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar tarefa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTaskToDelete(task.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir tarefa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-h1 text-foreground">Tarefas</h2>
          <p className="text-body text-muted-foreground">
            Gerencie suas atividades e acompanhamentos.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar tarefas..."
            className="pl-10 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-white">
              <SelectValue placeholder="Data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer data</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="next_7">Próximos 7 dias</SelectItem>
              <SelectItem value="next_30">Próximos 30 dias</SelectItem>
              <SelectItem value="overdue">Atrasadas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos clientes</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4" />
                Status
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-[10px]">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { id: 'pending', label: 'Pendente' },
                { id: 'in_progress', label: 'Em Andamento' },
                { id: 'completed', label: 'Concluída' },
              ].map((status) => (
                <DropdownMenuCheckboxItem
                  key={status.id}
                  checked={statusFilter.includes(status.id)}
                  onCheckedChange={(checked) => {
                    if (checked) setStatusFilter([...statusFilter, status.id])
                    else setStatusFilter(statusFilter.filter((s) => s !== status.id))
                  }}
                >
                  {status.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(searchTerm ||
            statusFilter.length > 0 ||
            dateFilter !== 'all' ||
            customerFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="text-slate-500 hover:text-slate-800 w-full sm:w-auto"
            >
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-500">
          {filteredTasks.length}{' '}
          {filteredTasks.length === 1 ? 'tarefa encontrada' : 'tarefas encontradas'}
        </h3>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as 'list' | 'calendar')}
          className="bg-white border rounded-md p-1 h-9"
        >
          <ToggleGroupItem
            value="list"
            aria-label="Lista"
            className="px-3 py-1 data-[state=on]:bg-slate-100 h-7 text-xs"
          >
            <LayoutList className="h-3.5 w-3.5 mr-1.5" />
            Lista
          </ToggleGroupItem>
          <ToggleGroupItem
            value="calendar"
            aria-label="Calendário"
            className="px-3 py-1 data-[state=on]:bg-slate-100 h-7 text-xs"
          >
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
            Calendário
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border border-dashed">
          <LayoutList className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800">Nenhuma tarefa encontrada</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Tente ajustar os filtros de busca ou crie uma nova tarefa.
          </p>
          <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
            Nova Tarefa
          </Button>
        </Card>
      ) : view === 'list' ? (
        <div className="space-y-1">
          {filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-slate-800 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b bg-slate-50/50">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div
                key={d}
                className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-slate-500 border-r last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayTasks = filteredTasks.filter((t) => isSameDay(new Date(t.due_date), day))
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isToday = isSameDay(day, new Date())
              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[100px] sm:min-h-[140px] p-1.5 sm:p-2 border-r border-b [&:nth-child(7n)]:border-r-0',
                    !isCurrentMonth && 'bg-slate-50 opacity-50',
                  )}
                >
                  <div className="flex justify-end mb-1">
                    <span
                      className={cn(
                        'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                        isToday && 'bg-primary text-white',
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[70px] sm:max-h-[100px]">
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleEditTask(t)}
                        className={cn(
                          'text-[10px] p-1.5 rounded cursor-pointer truncate transition-colors font-medium border',
                          t.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 line-through'
                            : isOverdue(t)
                              ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                              : 'bg-primary/5 text-primary border-primary/10 hover:bg-primary/10',
                        )}
                      >
                        {format(new Date(t.due_date), 'HH:mm')} - {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Ligar para confirmar proposta"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                placeholder="Detalhes adicionais da tarefa..."
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                className="resize-none h-20"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer">Cliente Vinculado *</Label>
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
                <Label>Prioridade</Label>
                <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={newTaskStatus} onValueChange={(v: any) => setNewTaskStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={newTaskType} onValueChange={(v: any) => setNewTaskType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Ligação</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data e Hora *</Label>
                <Input
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

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
