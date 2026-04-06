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
import { getSystemSettings, updateSystemSettings, SystemSettings } from '@/services/systemSettings'
import { Loader2 } from 'lucide-react'

const sidebarNavItems = [
  { title: 'Geral', id: 'general' },
  { title: 'Usuários', id: 'users' },
  { title: 'Segurança', id: 'security' },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [systemName, setSystemName] = useState('CRM AMQF')
  const [timezone, setTimezone] = useState('america-sao_paulo')
  const [language, setLanguage] = useState('pt-BR')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings()
        if (data) {
          setSettings(data)
          setSystemName(data.system_name)
          setTimezone(data.timezone)
          setLanguage(data.language)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    setIsSaving(true)
    try {
      await updateSystemSettings(settings.id, {
        system_name: systemName,
        timezone,
        language,
      })
      toast({
        title: 'Configurações salvas',
        description: 'As configurações gerais foram atualizadas com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao atualizar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
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
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="systemName">Nome do Sistema</Label>
                        <Input
                          id="systemName"
                          value={systemName}
                          onChange={(e) => setSystemName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Fuso Horário</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger id="timezone">
                            <SelectValue placeholder="Selecione um fuso horário" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="america-sao_paulo">
                              America/Sao_Paulo (BRT)
                            </SelectItem>
                            <SelectItem value="america-new_york">America/New_York (EST)</SelectItem>
                            <SelectItem value="europe-london">Europe/London (GMT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">Idioma</Label>
                        <Select value={language} onValueChange={setLanguage}>
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
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading || isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar alterações
                  </Button>
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
