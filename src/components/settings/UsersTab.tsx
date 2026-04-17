import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getUsers,
  updateUserStatus,
  updateUserRole,
  inviteUser,
  updateUserProfile,
  deactivateUser,
} from '@/services/users'
import { getAuditLogs } from '@/services/auditLogs'
import { Database } from '@/lib/supabase/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, UserPlus, UserX, UserCheck, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { EditUserDialog } from './EditUserDialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

type Profile = Database['public']['Tables']['profiles']['Row']
type Role = Database['public']['Enums']['user_role']

export function UsersTab() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('Vendedor')
  const [inviting, setInviting] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [userToDeactivate, setUserToDeactivate] = useState<Profile | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [profilesData, logsData] = await Promise.all([getUsers(), getAuditLogs()])
      setProfiles(profilesData)
      setLogs(logsData)
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return

    setInviting(true)
    try {
      await inviteUser(inviteEmail, inviteRole)
      toast({
        title: 'Convite enviado',
        description: `Usuário ${inviteEmail} convidado com sucesso.`,
      })
      setIsInviteOpen(false)
      setInviteEmail('')
      loadData()
    } catch (error: any) {
      toast({ title: 'Erro ao convidar', description: error.message, variant: 'destructive' })
    } finally {
      setInviting(false)
    }
  }

  const handleStatusChange = async (profileId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo'
    try {
      await updateUserStatus(profileId, newStatus, user?.id || '')
      toast({ title: 'Status atualizado' })
      loadData()
    } catch (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleRoleChange = async (profileId: string, newRole: Role) => {
    try {
      await updateUserRole(profileId, newRole, user?.id || '')
      toast({ title: 'Permissão atualizada' })
      loadData()
    } catch (error) {
      toast({ title: 'Erro ao atualizar permissão', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users">Equipe</TabsTrigger>
          <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Membros da Equipe</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie os acessos e permissões do seu time.
              </p>
            </div>

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" /> Convidar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleInvite}>
                  <DialogHeader>
                    <DialogTitle>Convidar Membro</DialogTitle>
                    <DialogDescription>
                      Envie um convite para adicionar um novo membro à plataforma.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="nome@empresa.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Nível de Acesso</Label>
                      <Select value={inviteRole} onValueChange={(val: Role) => setInviteRole(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um papel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Administrador</SelectItem>
                          <SelectItem value="Gerente">Gerente</SelectItem>
                          <SelectItem value="Vendedor">Vendedor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={inviting}>
                      {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar Convite
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.name || 'Pendente'}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        <Select
                          value={profile.role}
                          onValueChange={(val: Role) => handleRoleChange(profile.id, val)}
                          disabled={profile.id === user?.id}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
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
                        <Badge variant={profile.status === 'Ativo' ? 'default' : 'secondary'}>
                          {profile.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingUser(profile)}
                            title="Editar Usuário"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setUserToDeactivate(profile)}
                            title="Remover Usuário"
                            disabled={profile.id === user?.id || profile.status === 'Inativo'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {profile.id !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(profile.id, profile.status)}
                                >
                                  {profile.status === 'Ativo' ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" /> Desativar Usuário
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" /> Ativar Usuário
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Logs de Auditoria</h3>
            <p className="text-sm text-muted-foreground">
              Histórico de ações críticas realizadas na plataforma.
            </p>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Data e Hora</TableHead>
                  <TableHead>Usuário (Responsável)</TableHead>
                  <TableHead>Ação Realizada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(log.created_at))}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {log.profiles?.name || 'Sistema'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.profiles?.email || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{log.action}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!userToDeactivate}
        onOpenChange={(open) => !open && setUserToDeactivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário será marcado como inativo e seus dados
              históricos serão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault()
                if (!userToDeactivate) return
                setIsDeactivating(true)
                try {
                  let ip = 'Desconhecido'
                  try {
                    const res = await fetch('https://api.ipify.org?format=json')
                    if (res.ok) {
                      const json = await res.json()
                      ip = json.ip || 'Desconhecido'
                    }
                  } catch (err) {
                    // Ignore IP fetch error
                  }

                  await deactivateUser(userToDeactivate.id, user?.id || '', ip)
                  toast({
                    title: 'Usuário removido',
                    description: 'O usuário foi marcado como inativo com sucesso.',
                  })
                  setUserToDeactivate(null)
                  loadData()
                } catch (error: any) {
                  toast({
                    title: 'Erro ao remover',
                    description: error.message || 'Falha ao desativar o usuário.',
                    variant: 'destructive',
                  })
                } finally {
                  setIsDeactivating(false)
                }
              }}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditUserDialog
        user={editingUser}
        isOpen={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSave={async (data, file) => {
          try {
            let ip = 'Desconhecido'
            try {
              const res = await fetch('https://api.ipify.org?format=json')
              if (res.ok) {
                const json = await res.json()
                ip = json.ip || 'Desconhecido'
              }
            } catch (err) {
              // Ignore se falhar ao obter IP
            }

            await updateUserProfile(editingUser!.id, data, file, user?.id || '', ip)
            toast({
              title: 'Usuário atualizado',
              description: 'As alterações foram salvas com sucesso.',
            })
            loadData()
          } catch (error: any) {
            toast({
              title: 'Erro ao atualizar',
              description: error.message || 'Falha ao salvar as alterações do usuário.',
              variant: 'destructive',
            })
          }
        }}
      />
    </div>
  )
}
