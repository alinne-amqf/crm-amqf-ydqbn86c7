import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  LifeBuoy,
  Shield,
  ListTodo,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'

export function AppSidebar() {
  const location = useLocation()
  const { profile } = useAuth()

  const navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
    { title: 'Clientes', icon: Users, url: '/' },
    { title: 'Vendas', icon: Briefcase, url: '/vendas' },
    { title: 'Tarefas', icon: ListTodo, url: '/tarefas' },
    { title: 'Relatórios', icon: BarChart3, url: '/relatorios' },
    ...(profile?.role === 'Admin' ? [{ title: 'Usuários', icon: Shield, url: '/usuarios' }] : []),
    { title: 'Configurações', icon: Settings, url: '/configuracoes' },
  ]

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LifeBuoy className="size-5" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="font-semibold text-base">CRM Nexus</span>
          <span className="text-xs text-muted-foreground">Workspace</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${profile?.id || 99}`}
            />
            <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{profile?.name || 'Usuário'}</span>
            <span className="text-xs text-muted-foreground truncate">{profile?.email}</span>
            <span className="text-[10px] text-primary font-medium">{profile?.role}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
