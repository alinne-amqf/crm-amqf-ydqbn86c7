import React, { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loader2, MoreHorizontal, UserX, UserCheck } from 'lucide-react'
import {
  getProfiles,
  updateProfileRole,
  updateProfileStatus,
  inviteUser,
  Profile,
  UserRole,
} from '@/services/profiles'
import { getAuditLogs, AuditLog } from '@/services/auditLogs'
import { format } from 'date-fns'

export function UsersTab() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [profilesData, logsData] = await Promise.all([getProfiles(), getAuditLogs()])
      setProfiles(profilesData)
      setLogs(logsData)
    } catch (error: any) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const role = formData.get('role') as UserRole

    setIsInviting(true)
    try {
      await inviteUser(email, role)
      toast({
        title: 'Convite enviado',
        description: 'O usuário receberá um e-mail com as instruções de acesso.',
      })
      setIsInviteOpen(false)
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro ao convidar', description: error.message, variant: 'destructive' })
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole, userName: string) => {
    try {
      await updateProfileRole(userId, newRole, userName)
      toast({
        title: 'Permissão atualizada',
        description: `O papel de ${userName} foi alterado para ${newRole}.`,
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar permissão',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = async (userId: string, currentStatus: string, userName: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo'
    try {
      await updateProfileStatus(userId, newStatus, userName)
      toast({
        title: 'Status atualizado',
        description: `O usuário ${userName} agora está ${newStatus.toLowerCase()}.`,
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Configurações salvas',
      description: 'As preferências de usuário foram atualizadas com sucesso.',
    })
  }

  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="members">Membros</TabsTrigger>
        <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
        <TabsTrigger value="preferences">Preferências</TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Membros da Equipe</CardTitle>
              <CardDescription>Gerencie os acessos ao sistema.</CardDescription>
            </div>
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>Convidar Usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleInvite}>
                  <DialogHeader>
                    <DialogTitle>Convidar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Envie um convite para que um novo membro acesse o sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteEmail">E-mail</Label>
                      <Input
                        id="inviteEmail"
                        name="email"
                        type="email"
                        placeholder="nome@empresa.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inviteRole">Nível de Acesso (Role)</Label>
                      <Select defaultValue="Vendedor" name="role">
                        <SelectTrigger id="inviteRole">
                          <SelectValue placeholder="Selecione um papel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Gerente">Gerente</SelectItem>
                          <SelectItem value="Vendedor">Vendedor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar Convite
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || 'Sem Nome'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={user.role}
                          onValueChange={(val) =>
                            handleRoleChange(user.id, val as UserRole, user.name || user.email)
                          }
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Gerente">Gerente</SelectItem>
                            <SelectItem value="Vendedor">Vendedor</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Ativo' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(user.id, user.status, user.name || user.email)
                              }
                            >
                              {user.status === 'Ativo' ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" /> Desativar Usuário
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" /> Reativar Usuário
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {profiles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logs" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Logs de Auditoria</CardTitle>
            <CardDescription>Histórico de ações realizadas pela equipe.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const profileInfo = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles
                    const userName = profileInfo?.name || profileInfo?.email || 'Sistema'
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">{userName}</TableCell>
                        <TableCell>{log.action}</TableCell>
                      </TableRow>
                    )
                  })}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Nenhum log encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences" className="space-y-4">
        <form onSubmit={handleSavePreferences}>
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Usuários</CardTitle>
              <CardDescription>Configurações padrão para novos membros.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificar novos usuários</Label>
                  <p className="text-sm text-muted-foreground">
                    Envie um e-mail de boas-vindas automaticamente ao criar a conta.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="defaultRole">Papel Padrão (Role)</Label>
                <Select defaultValue="Vendedor">
                  <SelectTrigger id="defaultRole">
                    <SelectValue placeholder="Selecione um papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vendedor">Vendedor</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Salvar preferências</Button>
            </CardFooter>
          </Card>
        </form>
      </TabsContent>
    </Tabs>
  )
}
