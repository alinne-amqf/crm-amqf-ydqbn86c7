import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  InboxIcon,
  Loader2,
  LogOut,
  Pencil,
  Eye,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
import { CustomerForm } from '@/components/CustomerForm'
import { Customer } from '@/lib/types'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/services/customers'
import { useAuth } from '@/hooks/use-auth'

export default function Index() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { signOut } = useAuth()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const data = await getCustomers()
      setCustomers(data)
    } catch (error: any) {
      toast.error('Erro ao buscar clientes', { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers
    const query = searchQuery.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.company && c.company.toLowerCase().includes(query)),
    )
  }, [customers, searchQuery])

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    try {
      if (editingCustomer) {
        const updated = await updateCustomer(editingCustomer.id, customerData)
        setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        toast.success('Cliente atualizado com sucesso!')
      } else {
        const created = await createCustomer(customerData)
        setCustomers((prev) => [created, ...prev])
        toast.success('Cliente cadastrado com sucesso!', {
          description: `${created.name} foi adicionado à sua base de clientes.`,
        })
      }
      handleCloseSheet()
    } catch (error: any) {
      toast.error('Erro ao salvar cliente', { description: error.message })
    }
  }

  const handleEditClick = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCustomer(customer)
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    setTimeout(() => setEditingCustomer(null), 300)
  }

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return

    try {
      await deleteCustomer(customerToDelete.id)
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id))
      toast.success('Cliente excluído com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao excluir cliente', { description: error.message })
    } finally {
      setCustomerToDelete(null)
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'Ativo':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 border-emerald-200'
      case 'Lead':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80 border-indigo-200'
      case 'Inativo':
        return 'bg-slate-100 text-slate-800 hover:bg-slate-100/80 border-slate-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-foreground">Clientes</h1>
          <p className="text-body text-muted-foreground mt-1">
            Gerencie sua base de clientes e leads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleLogout} className="shadow-sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
          <Button onClick={() => setIsSheetOpen(true)} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background shadow-sm border-slate-200"
          />
        </div>
        <Button variant="outline" className="shadow-sm bg-background">
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground text-small">Nome</TableHead>
              <TableHead className="font-semibold text-foreground text-small">Contato</TableHead>
              <TableHead className="font-semibold text-foreground text-small">Empresa</TableHead>
              <TableHead className="font-semibold text-foreground text-small">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p>Carregando clientes...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="group transition-colors cursor-pointer"
                  onClick={() => navigate(`/customer/${customer.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-slate-100">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {customer.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-body">
                            {customer.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-caption h-5 px-1.5 font-medium"
                          >
                            {customer.customerType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <a
                        href={`mailto:${customer.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-body text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {customer.email}
                      </a>
                      <span className="text-small text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {customer.phone || '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-body text-foreground font-medium">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {customer.company || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => navigate(`/customer/${customer.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleEditClick(customer, e)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar cliente
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCustomerToDelete(customer)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <InboxIcon className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-900">Nenhum cliente encontrado</p>
                    <p className="text-sm">
                      Tente ajustar seus filtros de busca ou cadastre um novo cliente.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent className="w-full sm:max-w-md border-l overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-h2">
              {editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </SheetTitle>
            <SheetDescription className="text-body">
              {editingCustomer
                ? 'Atualize os dados do cliente abaixo.'
                : 'Preencha os dados abaixo para adicionar um novo cliente ou lead à sua base.'}
            </SheetDescription>
          </SheetHeader>
          <CustomerForm
            initialData={editingCustomer}
            onSubmit={handleSaveCustomer}
            onCancel={handleCloseSheet}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!customerToDelete}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{customerToDelete?.name}</strong>?
              Esta ação não pode ser desfeita e removerá todos os dados associados a este cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
