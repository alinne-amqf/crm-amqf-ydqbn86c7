import React, { useState } from 'react'
import { cn } from '@/lib/utils'
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
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { UsersTab } from '@/components/settings/UsersTab'

const sidebarNavItems = [
  { title: 'Geral', id: 'general' },
  { title: 'Usuários', id: 'users' },
  { title: 'Segurança', id: 'security' },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Configurações salvas',
      description: 'As configurações gerais foram atualizadas com sucesso.',
    })
  }

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Segurança atualizada',
      description: 'As preferências de segurança foram salvas.',
    })
  }

  return (
    <div className="space-y-6 p-6 md:p-10 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua conta e preferências do sistema.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto pb-2 lg:pb-0">
            {sidebarNavItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                className={cn(
                  'justify-start whitespace-nowrap',
                  activeTab === item.id
                    ? 'bg-muted hover:bg-muted'
                    : 'hover:bg-transparent hover:underline',
                )}
                onClick={() => setActiveTab(item.id)}
              >
                {item.title}
              </Button>
            ))}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-2xl">
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral}>
              <Card>
                <CardHeader>
                  <CardTitle>Geral</CardTitle>
                  <CardDescription>Configurações básicas do sistema.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">Nome do Sistema</Label>
                    <Input id="systemName" defaultValue="CRM AMQF" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select defaultValue="america-sao_paulo">
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Selecione um fuso horário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="america-sao_paulo">America/Sao_Paulo (BRT)</SelectItem>
                        <SelectItem value="america-new_york">America/New_York (EST)</SelectItem>
                        <SelectItem value="europe-london">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select defaultValue="pt-BR">
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Selecione um idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Salvar alterações</Button>
                </CardFooter>
              </Card>
            </form>
          )}

          {activeTab === 'users' && <UsersTab />}

          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurity}>
              <Card>
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>
                    Gerencie as políticas de segurança da sua conta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Autenticação de Dois Fatores (2FA)</Label>
                      <p className="text-sm text-muted-foreground">
                        Exija 2FA para todos os usuários ao fazer login.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Política de Senha Forte</Label>
                      <p className="text-sm text-muted-foreground">
                        Exija senhas com no mínimo 8 caracteres, números e símbolos.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Salvar preferências</Button>
                </CardFooter>
              </Card>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
