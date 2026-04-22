import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  LifeBuoy,
  ListTodo,
  LogOut,
  ChevronsUpDown,
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
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
    { title: 'Clientes', icon: Users, url: '/' },
    { title: 'Vendas', icon: Briefcase, url: '/vendas' },
    { title: 'Tarefas', icon: ListTodo, url: '/tarefas' },
    { title: 'Relatórios', icon: BarChart3, url: '/relatorios' },
    { title: 'Configurações', icon: Settings, url: '/settings' },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2 text-sidebar-foreground">
        <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LifeBuoy className="size-5" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="text-[16px] font-bold">CRM Nexus</span>
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
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        'h-auto py-3 px-4 text-[14px] font-normal hover:bg-sidebar-accent hover:text-sidebar-accent-foreground gap-2',
                        isActive &&
                          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-medium',
                      )}
                    >
                      <Link to={item.url} className="flex items-center gap-2 w-full">
                        <item.icon className="h-5 w-5 shrink-0" />
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
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="p-0 hover:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-8 w-8 rounded-full border border-sidebar-border">
                      <AvatarImage
                        src={
                          profile?.avatar ||
                          `https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${profile?.id || 99}`
                        }
                        alt={profile?.name || ''}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-full">
                        {profile?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate text-[14px] font-semibold text-white">
                        {profile?.name || 'Usuário'}
                      </span>
                      <span className="truncate text-[12px] font-normal text-[#CCCCCC]">
                        {profile?.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-[#CCCCCC]" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={
                          profile?.avatar ||
                          `https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${profile?.id || 99}`
                        }
                        alt={profile?.name || ''}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-lg">
                        {profile?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-body leading-tight">
                      <span className="truncate font-semibold">{profile?.name || 'Usuário'}</span>
                      <span className="truncate text-caption opacity-80">{profile?.role}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
