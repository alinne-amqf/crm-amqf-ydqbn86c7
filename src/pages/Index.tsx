import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  InboxIcon,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CustomerForm } from '@/components/CustomerForm'
import { Customer } from '@/lib/types'
import { mockCustomers } from '@/lib/mock-data'

export default function Index() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers
    const query = searchQuery.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.company.toLowerCase().includes(query),
    )
  }, [customers, searchQuery])

  const handleAddCustomer = (newCustomerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...newCustomerData,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
    }

    setCustomers((prev) => [newCustomer, ...prev])
    setIsSheetOpen(false)
    toast.success('Cliente cadastrado com sucesso!', {
      description: `${newCustomer.name} foi adicionado à sua base de clientes.`,
    })
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
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua base de clientes e leads.</p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
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

      <div className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-slate-700">Nome</TableHead>
              <TableHead className="font-semibold text-slate-700">Contato</TableHead>
              <TableHead className="font-semibold text-slate-700">Empresa</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="group transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-slate-100">
                        <AvatarImage src={customer.avatar} alt={customer.name} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {customer.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{customer.name}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-sm text-slate-600 hover:text-primary flex items-center gap-1.5 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {customer.email}
                      </a>
                      <span className="text-sm text-slate-500 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {customer.phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                      <Building className="h-4 w-4 text-slate-400" />
                      {customer.company}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem>Editar cliente</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md border-l overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl">Cadastrar Novo Cliente</SheetTitle>
            <SheetDescription>
              Preencha os dados abaixo para adicionar um novo cliente ou lead à sua base.
            </SheetDescription>
          </SheetHeader>
          <CustomerForm onSubmit={handleAddCustomer} onCancel={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
