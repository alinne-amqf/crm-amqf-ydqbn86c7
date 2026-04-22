import { Outlet } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { AppSidebar } from './AppSidebar'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-white px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-primary" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-border" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink
                    href="#"
                    className="text-text-tertiary hover:text-primary text-[12px]"
                  >
                    CRM
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block text-text-tertiary [&>svg]:w-3 [&>svg]:h-3" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground text-[12px]">
                    Dashboard
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-2.5 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="py-[8px] px-[12px] w-64 rounded-[4px] border border-border bg-muted pl-9 text-[12px] placeholder:text-text-tertiary focus:border-primary focus:bg-white focus:outline-none"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted hover:text-primary [&>svg]:h-[20px] [&>svg]:w-[20px]"
            >
              <Bell />
            </Button>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-[16px] lg:p-[20px] overflow-y-auto bg-white">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
