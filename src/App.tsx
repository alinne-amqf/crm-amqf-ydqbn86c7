import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Index from './pages/Index'
import CustomerDetails from './pages/CustomerDetails'
import Login from './pages/Login'
import UpdatePassword from './pages/UpdatePassword'
import NotFound from './pages/NotFound'
import UsersPage from './pages/Users'
import SalesPipeline from './pages/SalesPipeline'
import TasksPage from './pages/Tasks'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customer/:id" element={<CustomerDetails />} />
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/vendas" element={<SalesPipeline />} />
              <Route path="/tarefas" element={<TasksPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
