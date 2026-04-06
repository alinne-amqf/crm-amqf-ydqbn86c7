import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { Profile, UserRole } from '@/lib/types'
import { getProfiles, updateProfileRole } from '@/services/profiles'
import { useAuth } from '@/hooks/use-auth'

export default function UsersPage() {
  const { profile, loading } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (profile?.role === 'Admin') {
      fetchUsers()
    }
  }, [profile])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const data = await getProfiles()
      setUsers(data)
    } catch (error: any) {
      toast.error('Erro ao buscar usuários', { description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateProfileRole(userId, newRole)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
      toast.success('Permissão atualizada com sucesso')
    } catch (error: any) {
      toast.error('Erro ao atualizar permissão', { description: error.message })
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (profile && profile.role !== 'Admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Gerenciamento de Usuários
        </h1>
        <p className="text-muted-foreground mt-1">
          Atribua e gerencie os níveis de acesso (Roles) da sua equipe.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Acesso Atual</TableHead>
              <TableHead>Alterar Permissão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p>Carregando equipe...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-slate-900">
                    {user.name || 'Sem nome'}
                  </TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === 'Admin'
                          ? 'default'
                          : user.role === 'Gerente'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(val) => handleRoleChange(user.id, val as UserRole)}
                      disabled={user.id === profile?.id}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Administrador</SelectItem>
                        <SelectItem value="Gerente">Gerente</SelectItem>
                        <SelectItem value="Vendedor">Vendedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
