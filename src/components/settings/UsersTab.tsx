import React, { useState } from 'react'
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

const mockUsers = [
  { id: '1', name: 'Ana Silva', email: 'ana@empresa.com', role: 'Admin', status: 'Ativo' },
  { id: '2', name: 'Carlos Mendes', email: 'carlos@empresa.com', role: 'Gerente', status: 'Ativo' },
  {
    id: '3',
    name: 'Beatriz Costa',
    email: 'beatriz@empresa.com',
    role: 'Vendedor',
    status: 'Inativo',
  },
]

const mockLogs = [
  {
    id: '1',
    user: 'Ana Silva',
    action: 'Alterou permissões do Carlos Mendes',
    date: '2023-10-25 14:30',
  },
  {
    id: '2',
    user: 'Carlos Mendes',
    action: 'Exportou relatório de vendas',
    date: '2023-10-24 09:15',
  },
  { id: '3', user: 'Sistema', action: 'Backup automático concluído', date: '2023-10-24 00:00' },
]

export function UsersTab() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Convite enviado',
      description: 'O usuário receberá um e-mail com as instruções de acesso.',
    })
    setIsInviteOpen(false)
  }

  const handleSaveUsers = (e: React.FormEvent) => {
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
                    <Button type="submit">Enviar Convite</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'Ativo' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {log.date}
                    </TableCell>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell>{log.action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences" className="space-y-4">
        <form onSubmit={handleSaveUsers}>
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
