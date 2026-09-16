import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Bell,
  Search,
  User,
  CheckSquare,
  Calendar,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { supabase } from '@/lib/supabase/client'
import { AppSidebar } from './AppSidebar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CustomerSearchResult {
  id: string
  name: string
  email: string
  company?: string | null
}

interface TaskSearchResult {
  id: string
  title: string
  due_date: string
  status: string
}

interface OverdueTaskItem {
  id: string
  title: string
  due_date: string
  customerName?: string
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  // Breadcrumb dinâmico
  const [customerName, setCustomerName] = useState<string | null>(null)

  // Header Search
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([])
  const [taskResults, setTaskResults] = useState<TaskSearchResult[]>([])
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Overdue Tasks & Notifications
  const [overdueTasks, setOverdueTasks] = useState<OverdueTaskItem[]>([])
  const [overdueCount, setOverdueCount] = useState<number>(0)
  const [isOverduePopoverOpen, setIsOverduePopoverOpen] = useState(false)

  // Carregar nome do cliente caso seja rota de detalhe
  useEffect(() => {
    const match = location.pathname.match(/^\/customer\/([^/]+)/)
    if (match) {
      const customerId = match[1]
      const fetchCustomerName = async () => {
        try {
          const { data } = await supabase
            .from('customers')
            .select('name')
            .eq('id', customerId)
            .single()
          if (data?.name) {
            setCustomerName(data.name)
          } else {
            setCustomerName(null)
          }
        } catch {
          setCustomerName(null)
        }
      }
      fetchCustomerName()
    } else {
      setCustomerName(null)
    }
  }, [location.pathname])

  // Carregar tarefas atrasadas
  useEffect(() => {
    fetchOverdueTasks()

    // Configurar listener para atualizações na tabela tasks
    const channel = supabase
      .channel('tasks-overdue-listener')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchOverdueTasks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchOverdueTasks = async () => {
    try {
      const nowIso = new Date().toISOString()
      const { data, error, count } = await supabase
        .from('tasks')
        .select(
          `
          id,
          title,
          due_date,
          status,
          customers (name)
        `,
          { count: 'exact' },
        )
        .neq('status', 'completed')
        .lt('due_date', nowIso)
        .order('due_date', { ascending: true })

      if (error) {
        console.error('Erro ao buscar tarefas atrasadas:', error)
        return
      }

      setOverdueCount(count || 0)
      if (data) {
        setOverdueTasks(
          data.slice(0, 5).map((t: any) => ({
            id: t.id,
            title: t.title,
            due_date: t.due_date,
            customerName: t.customers?.name,
          })),
        )
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err)
    }
  }

  // Busca debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCustomerResults([])
      setTaskResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const query = searchQuery.trim()

        const [custRes, taskRes] = await Promise.all([
          supabase
            .from('customers')
            .select('id, name, email, company')
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5),
          supabase
            .from('tasks')
            .select('id, title, due_date, status')
            .ilike('title', `%${query}%`)
            .limit(5),
        ])

        setCustomerResults(custRes.data || [])
        setTaskResults(taskRes.data || [])
      } catch (err) {
        console.error('Erro ao pesquisar:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fechar dropdown de pesquisa ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Derivar breadcrumbs dinâmicos
  const renderBreadcrumb = () => {
    const path = location.pathname

    if (path === '/') {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold text-foreground text-[12px]">
            Dashboard
          </BreadcrumbPage>
        </BreadcrumbItem>
      )
    }

    if (path === '/clientes') {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold text-foreground text-[12px]">
            Clientes
          </BreadcrumbPage>
        </BreadcrumbItem>
      )
    }

    if (path.startsWith('/customer/')) {
      return (
        <>
          <BreadcrumbItem className="hidden sm:block">
            <BreadcrumbLink
              onClick={() => navigate('/clientes')}
              className="text-text-tertiary hover:text-primary text-[12px] cursor-pointer"
            >
              Clientes
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:block text-text-tertiary [&>svg]:w-3 [&>svg]:h-3" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-foreground text-[12px] truncate max-w-[180px]">
              {customerName || 'Detalhes do Cliente'}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )
    }

    if (path === '/vendas') {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold text-foreground text-[12px]">
            Vendas (Kanban)
          </BreadcrumbPage>
        </BreadcrumbItem>
      )
    }

    if (path === '/tarefas') {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold text-foreground text-[12px]">
            Tarefas
          </BreadcrumbPage>
        </BreadcrumbItem>
      )
    }

    if (path === '/relatorios') {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold text-foreground text-[12px]">
            Relatórios
          </BreadcrumbPage>
        </BreadcrumbItem>
      )
    }

    if (path === '/settings') {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold text-foreground text-[12px]">
            Configurações
          </BreadcrumbPage>
        </BreadcrumbItem>
      )
    }

    return (
      <BreadcrumbItem>
        <BreadcrumbPage className="font-semibold text-foreground text-[12px]">
          Página
        </BreadcrumbPage>
      </BreadcrumbItem>
    )
  }

  const handleSelectCustomer = (c: CustomerSearchResult) => {
    setIsSearchOpen(false)
    setSearchQuery('')
    navigate(`/customer/${c.id}`)
  }

  const handleSelectTask = (t: TaskSearchResult) => {
    setIsSearchOpen(false)
    setSearchQuery('')
    navigate(`/tarefas?filter=all`)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-white px-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-primary" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-border" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink
                    onClick={() => navigate('/')}
                    className="text-text-tertiary hover:text-primary text-[12px] cursor-pointer"
                  >
                    CRM
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block text-text-tertiary [&>svg]:w-3 [&>svg]:h-3" />
                {renderBreadcrumb()}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-3">
            {/* Header Search with Command dropdown */}
            <div ref={searchContainerRef} className="relative hidden sm:block">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-4 w-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Pesquisar clientes ou tarefas..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsSearchOpen(true)
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setIsSearchOpen(true)
                  }}
                  className="py-[7px] px-[12px] w-64 md:w-80 rounded-[6px] border border-border bg-muted pl-9 text-[12px] placeholder:text-text-tertiary focus:border-primary focus:bg-white focus:outline-none transition-all"
                />
                {isSearching && (
                  <Loader2 className="absolute right-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Command Dropdown Popover */}
              {isSearchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute right-0 top-full mt-1.5 w-96 rounded-lg border bg-popover p-0 shadow-lg z-50 text-popover-foreground overflow-hidden animate-fade-in-down">
                  <Command className="rounded-lg">
                    <CommandList className="max-h-[350px]">
                      {isSearching ? (
                        <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          Pesquisando...
                        </div>
                      ) : customerResults.length === 0 && taskResults.length === 0 ? (
                        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
                          Nenhum resultado encontrado para &quot;{searchQuery}&quot;.
                        </CommandEmpty>
                      ) : (
                        <>
                          {customerResults.length > 0 && (
                            <CommandGroup heading="Clientes">
                              {customerResults.map((c) => (
                                <CommandItem
                                  key={`cust-${c.id}`}
                                  onSelect={() => handleSelectCustomer(c)}
                                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                                      <User className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold text-xs text-foreground truncate">
                                        {c.name}
                                      </span>
                                      <span className="text-[11px] text-muted-foreground truncate">
                                        {c.email} {c.company ? `• ${c.company}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}

                          {taskResults.length > 0 && (
                            <CommandGroup heading="Tarefas">
                              {taskResults.map((t) => (
                                <CommandItem
                                  key={`task-${t.id}`}
                                  onSelect={() => handleSelectTask(t)}
                                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 shrink-0">
                                      <CheckSquare className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold text-xs text-foreground truncate">
                                        {t.title}
                                      </span>
                                      <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(t.due_date), 'dd/MM/yyyy HH:mm', {
                                          locale: ptBR,
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </>
                      )}
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>

            {/* Notification Bell with Overdue Tasks Badge and Popover */}
            <Popover open={isOverduePopoverOpen} onOpenChange={setIsOverduePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-muted-foreground hover:bg-muted hover:text-primary [&>svg]:h-[20px] [&>svg]:w-[20px]"
                  aria-label="Notificações de tarefas atrasadas"
                >
                  <Bell />
                  {overdueCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                    >
                      {overdueCount > 99 ? '99+' : overdueCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/40">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="font-semibold text-xs text-foreground">Tarefas Atrasadas</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[11px] bg-red-50 text-destructive border-destructive/20"
                  >
                    {overdueCount} {overdueCount === 1 ? 'pendência' : 'pendências'}
                  </Badge>
                </div>

                <div className="divide-y divide-border max-h-[280px] overflow-y-auto">
                  {overdueTasks.length === 0 ? (
                    <div className="py-6 px-4 text-center text-xs text-muted-foreground">
                      🎉 Nenhuma tarefa atrasada no momento!
                    </div>
                  ) : (
                    overdueTasks.map((t) => (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setIsOverduePopoverOpen(false)
                          navigate('/tarefas?filter=overdue')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setIsOverduePopoverOpen(false)
                            navigate('/tarefas?filter=overdue')
                          }
                        }}
                        className="p-3 hover:bg-accent/60 cursor-pointer transition-colors text-left select-none"
                      >
                        <p className="text-xs font-semibold text-foreground line-clamp-1">
                          {t.title}
                        </p>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[130px]">
                            {t.customerName || 'Sem cliente'}
                          </span>
                          <span className="text-destructive font-medium shrink-0">
                            {format(new Date(t.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t p-2 bg-muted/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-primary font-medium hover:bg-primary/10"
                    onClick={() => {
                      setIsOverduePopoverOpen(false)
                      navigate('/tarefas?filter=overdue')
                    }}
                  >
                    Ver todas as atrasadas
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Fundo levemente acinzentado bg-muted/40 para dar profundidade aos cards */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-[16px] lg:p-[20px] overflow-y-auto bg-muted/40">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
