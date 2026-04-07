import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUsers, inviteUser, updateUserProfile } from '@/services/users'
import { getAuditLogs } from '@/services/auditLogs'
import { EditUserDialog } from '@/components/settings/EditUserDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row'] & { avatar?: string | null }

export default function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [users, setUsers] = useState<Profile[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Vendedor')
  const [inviting, setInviting] = useState(false)

  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, logsData] = await Promise.all([getUsers(), getAuditLogs()])
      setUsers(usersData as Profile[])
      setLogs(logsData)
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro', description: 'Erro ao carregar dados.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInvite = async () => {
    if (!inviteEmail) return
    try {
      setInviting(true)
      await inviteUser(inviteEmail, inviteRole)
      toast({ title: 'Sucesso', description: 'Convite enviado com sucesso.' })
      setInviteEmail('')
      loadData()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar convite.',
        variant: 'destructive',
      })
    } finally {
      setInviting(false)
    }
  }

  const handleEditUser = (u: Profile) => {
    setEditingUser(u)
    setIsEditDialogOpen(true)
  }

  const handleSaveUser = async (data: any, file: File | null) => {
    if (!editingUser || !user) return
    try {
      await updateUserProfile(editingUser.id, data, file, user.id)
      toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso.' })
      loadData()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar usuário.',
        variant: 'destructive',
      })
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ')
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase()
      return name.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie usuários, permissões e configurações do sistema.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Usuários e Permissões</TabsTrigger>
          <TabsTrigger value="audit">Logs de Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Convidar Usuário</CardTitle>
              <CardDescription>Envie um convite para novos membros da equipe.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="grid gap-2 flex-1 max-w-sm">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    placeholder="email@empresa.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Papel</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Administrador</SelectItem>
                      <SelectItem value="Gerente">Gerente</SelectItem>
                      <SelectItem value="Vendedor">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInvite} disabled={inviting}>
                  {inviting ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuários Ativos</CardTitle>
              <CardDescription>Gerencie os acessos e informações da sua equipe.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6 text-center text-muted-foreground">Carregando...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Adicionado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={u.avatar || ''} />
                              <AvatarFallback>{getInitials(u.name, u.email)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{u.name || 'Sem nome'}</div>
                              <div className="text-sm text-muted-foreground">{u.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.status === 'Ativo' ? 'default' : 'secondary'}>
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.role}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(u.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)}>
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>Histórico de ações importantes no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6 text-center text-muted-foreground">Carregando...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            {log.profiles?.name || log.profiles?.email || 'Sistema'}
                          </TableCell>
                          <TableCell>{log.action}</TableCell>
                        </TableRow>
                      ))}
                      {logs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                            Nenhum log encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditUserDialog
        user={editingUser}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveUser}
      />
    </div>
  )
}
