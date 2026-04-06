import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  PhoneCall,
  FileText,
  Users,
  MailCheck,
  Loader2,
  PlusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Customer, Interaction } from '@/lib/types'
import { getCustomerById } from '@/services/customers'
import { getInteractionsByCustomer, createInteraction } from '@/services/interactions'

export default function CustomerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingInteraction, setIsAddingInteraction] = useState(false)
  const [newInteractionType, setNewInteractionType] = useState<Interaction['type']>('note')
  const [newInteractionDesc, setNewInteractionDesc] = useState('')
  const [isSubmittingInteraction, setIsSubmittingInteraction] = useState(false)

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [customerData, interactionsData] = await Promise.all([
        getCustomerById(id!),
        getInteractionsByCustomer(id!),
      ])
      setCustomer(customerData)
      setInteractions(interactionsData)
    } catch (error: any) {
      toast.error('Erro ao carregar detalhes', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleAddInteraction = async () => {
    if (!newInteractionDesc.trim() || !id) return
    try {
      setIsSubmittingInteraction(true)
      const newInteraction = await createInteraction({
        customerId: id,
        type: newInteractionType,
        date: new Date().toISOString(),
        description: newInteractionDesc,
      })
      setInteractions([newInteraction, ...interactions])
      setNewInteractionDesc('')
      setIsAddingInteraction(false)
      toast.success('Interação registrada com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao adicionar interação', { description: error.message })
    } finally {
      setIsSubmittingInteraction(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-fade-in-up">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Cliente não encontrado</h2>
        <p className="text-muted-foreground">
          O cliente que você está procurando não existe ou foi removido.
        </p>
        <Button onClick={() => navigate('/')} variant="default" className="mt-4">
          Voltar para clientes
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Lead':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'Inativo':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="h-4 w-4 text-blue-500" />
      case 'email':
        return <MailCheck className="h-4 w-4 text-emerald-500" />
      case 'meeting':
        return <Users className="h-4 w-4 text-purple-500" />
      case 'note':
        return <FileText className="h-4 w-4 text-amber-500" />
      default:
        return <FileText className="h-4 w-4 text-slate-500" />
    }
  }

  const formatInteractionType = (type: string) => {
    switch (type) {
      case 'call':
        return 'Ligação realizada'
      case 'email':
        return 'E-mail enviado'
      case 'meeting':
        return 'Reunião agendada'
      case 'note':
        return 'Anotação interna'
      default:
        return 'Outra interação'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <Button
        variant="ghost"
        className="mb-2 -ml-4 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para a lista
      </Button>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Profile Sidebar */}
        <div className="w-full lg:w-1/3 space-y-6 lg:sticky lg:top-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 w-full absolute top-0 left-0 right-0 z-0"></div>
            <CardHeader className="text-center pb-2 pt-12 relative z-10">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white shadow-md bg-white">
                <AvatarImage src={customer.avatar} alt={customer.name} />
                <AvatarFallback className="text-3xl bg-primary/5 text-primary">
                  {customer.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl font-bold text-slate-900">{customer.name}</CardTitle>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge variant="outline" className={getStatusColor(customer.status)}>
                  {customer.status}
                </Badge>
                <Badge variant="secondary" className="font-medium">
                  {customer.customerType}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6 relative z-10">
              <div className="flex items-start gap-3 text-sm">
                <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">E-mail</span>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-slate-700 hover:text-primary transition-colors truncate font-medium"
                  >
                    {customer.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">Telefone</span>
                  <span className="text-slate-700 font-medium">{customer.phone}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">
                    {customer.customerType === 'B2B' ? 'CNPJ' : 'CPF'}
                  </span>
                  <span className="text-slate-700 font-medium">{customer.document || '-'}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Building className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">Empresa</span>
                  <span className="text-slate-700 font-medium">{customer.company || '-'}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-0.5">Cliente desde</span>
                  <span className="text-slate-700 font-medium">
                    {formatShortDate(customer.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interaction History */}
        <div className="w-full lg:w-2/3 space-y-6">
          <Card className="border-slate-200 shadow-sm h-full lg:min-h-[500px]">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                Histórico de Interações
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingInteraction(!isAddingInteraction)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Interação
              </Button>
            </CardHeader>
            <CardContent className="pt-6 px-6 sm:px-8">
              {isAddingInteraction && (
                <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 animate-fade-in-down">
                  <h4 className="font-medium text-sm text-slate-800">Registrar nova interação</h4>
                  <div className="flex gap-4">
                    <Select
                      value={newInteractionType}
                      onValueChange={(v: any) => setNewInteractionType(v)}
                    >
                      <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">Anotação</SelectItem>
                        <SelectItem value="call">Ligação</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="meeting">Reunião</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Descreva a interação..."
                    value={newInteractionDesc}
                    onChange={(e) => setNewInteractionDesc(e.target.value)}
                    className="min-h-[100px] bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingInteraction(false)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddInteraction}
                      disabled={!newInteractionDesc.trim() || isSubmittingInteraction}
                    >
                      {isSubmittingInteraction ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Salvar
                    </Button>
                  </div>
                </div>
              )}

              {interactions.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-10 pb-4 pt-2">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="relative pl-6 sm:pl-8 group">
                      <div className="absolute -left-[17px] top-1 bg-white p-2 rounded-full border border-slate-200 shadow-sm group-hover:border-primary/50 group-hover:shadow-md transition-all">
                        {getInteractionIcon(interaction.type)}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <span className="font-semibold text-slate-800 text-sm">
                          {formatInteractionType(interaction.type)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
                          {formatDate(interaction.date)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 bg-slate-50 hover:bg-slate-100/50 p-4 rounded-xl border border-slate-100 transition-colors leading-relaxed">
                        {interaction.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-base font-medium text-slate-800">
                    Nenhuma interação registrada
                  </p>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Este cliente ainda não possui um histórico de contatos ou anotações na
                    plataforma.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
