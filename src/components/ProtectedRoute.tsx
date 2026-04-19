import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export const ProtectedRoute = () => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isFirstLoginPending =
    profile.has_accessed === false && profile.temporary_password_hash !== null

  if (isFirstLoginPending && location.pathname !== '/alterar-senha-obrigatoria') {
    return <Navigate to="/alterar-senha-obrigatoria" replace />
  }

  if (!isFirstLoginPending && location.pathname === '/alterar-senha-obrigatoria') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
