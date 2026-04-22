import { UsersTab } from '@/components/settings/UsersTab'

export default function Settings() {
  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-h1 text-foreground">Configurações</h1>
        <p className="text-body text-muted-foreground mt-2">
          Gerencie usuários, permissões e configurações do sistema.
        </p>
      </div>

      <UsersTab />
    </div>
  )
}
