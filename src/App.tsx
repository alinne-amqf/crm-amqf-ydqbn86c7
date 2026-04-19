import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Index from './pages/Index'
import CustomerDetails from './pages/CustomerDetails'
import Login from './pages/Login'
import UpdatePassword from './pages/UpdatePassword'
import NotFound from './pages/NotFound'
import SalesPipeline from './pages/SalesPipeline'
import TasksPage from './pages/Tasks'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import ChangePasswordMandatory from './pages/ChangePasswordMandatory'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const MarkAccessed = () => {
  const { user, profile } = useAuth()

  useEffect(() => {
    if (
      user &&
      profile &&
      profile.has_accessed === false &&
      profile.temporary_password_hash === null
    ) {
      supabase
        .from('profiles')
        .update({ has_accessed: true } as any)
        .eq('id', user.id)
        .then()
    }
  }, [user, profile])

  return null
}

const App = () => (
  <AuthProvider>
    <MarkAccessed />
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/alterar-senha-obrigatoria" element={<ChangePasswordMandatory />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customer/:id" element={<CustomerDetails />} />
              <Route path="/vendas" element={<SalesPipeline />} />
              <Route path="/tarefas" element={<TasksPage />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
