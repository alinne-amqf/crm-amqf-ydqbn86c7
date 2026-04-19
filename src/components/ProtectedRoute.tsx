import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'

export const ProtectedRoute = () => {
  const { user, profile, loading, isAuthenticated, first_login_pending } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center p-8 space-y-4">
        <Skeleton className="h-12 w-[250px]" />
        <Skeleton className="h-[400px] w-full max-w-4xl" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center p-8 space-y-4">
        <Skeleton className="h-12 w-[250px]" />
        <Skeleton className="h-[400px] w-full max-w-4xl" />
      </div>
    )
  }

  if (first_login_pending && location.pathname !== '/alterar-senha-obrigatoria') {
    return <Navigate to="/alterar-senha-obrigatoria" replace />
  }

  if (!first_login_pending && location.pathname === '/alterar-senha-obrigatoria') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
