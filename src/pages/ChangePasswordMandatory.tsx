import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ShieldAlert, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function ChangePasswordMandatory() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { user } = useAuth()
  const navigate = useNavigate()

  const validations = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*]/.test(newPassword),
      match: newPassword === confirmPassword && newPassword.length > 0,
      different: newPassword !== currentPassword || newPassword === '',
    }
  }, [newPassword, confirmPassword, currentPassword])

  const strength = useMemo(() => {
    if (!newPassword) return 0
    let score = 0
    if (validations.length) score += 1
    if (validations.upper && validations.lower) score += 1
    if (validations.number) score += 1
    if (validations.special) score += 1
    return score
  }, [validations, newPassword])

  const strengthLabel = strength < 2 ? 'Fraco' : strength < 4 ? 'Médio' : 'Forte'
  const strengthColor =
    strength < 2 ? 'bg-red-500' : strength < 4 ? 'bg-yellow-500' : 'bg-green-500'
  const strengthTextColor =
    strength < 2 ? 'text-red-600' : strength < 4 ? 'text-yellow-600' : 'text-green-600'

  const isFormValid =
    validations.length &&
    validations.upper &&
    validations.lower &&
    validations.number &&
    validations.special &&
    validations.match &&
    validations.different &&
    currentPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !user) return

    setLoading(true)
    setErrorMsg('')

    try {
      const sessionRes = await supabase.auth.getSession()
      const token = sessionRes.data.session?.access_token

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/change_password_first_login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            current_password: currentPassword,
            new_password: newPassword,
          }),
        },
      )

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast.error('Nao autorizado')
          navigate('/login')
          return
        }
        throw new Error(data.error || 'Erro ao processar solicitacao.')
      }

      toast.success('Senha alterada com sucesso! Redirecionando para dashboard...')

      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 2000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar solicitacao.')
      toast.error(err.message || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-md animate-fade-in-up border-slate-200">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Altere sua Senha</CardTitle>
          <CardDescription>
            Voce esta usando uma senha temporaria. Por favor, crie uma nova senha pessoal agora.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Temporaria</Label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={cn('bg-white', errorMsg && 'border-red-500 focus-visible:ring-red-500')}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white"
                disabled={loading}
                aria-describedby="password-strength"
              />
              {newPassword && (
                <div
                  id="password-strength"
                  className="flex items-center gap-2 mt-2"
                  aria-live="polite"
                >
                  <div className="flex-1 flex gap-1 h-1.5">
                    <div
                      className={cn(
                        'h-full flex-1 rounded-full',
                        strength > 0 ? strengthColor : 'bg-slate-200',
                      )}
                    />
                    <div
                      className={cn(
                        'h-full flex-1 rounded-full',
                        strength > 1 ? strengthColor : 'bg-slate-200',
                      )}
                    />
                    <div
                      className={cn(
                        'h-full flex-1 rounded-full',
                        strength > 2 ? strengthColor : 'bg-slate-200',
                      )}
                    />
                    <div
                      className={cn(
                        'h-full flex-1 rounded-full',
                        strength > 3 ? strengthColor : 'bg-slate-200',
                      )}
                    />
                  </div>
                  <span className={cn('text-xs font-medium', strengthTextColor)}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme a Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  'bg-white',
                  confirmPassword &&
                    !validations.match &&
                    'border-red-500 focus-visible:ring-red-500',
                )}
                disabled={loading}
              />
              {confirmPassword && !validations.match && (
                <p className="text-xs text-red-500">As senhas não coincidem.</p>
              )}
            </div>

            <div className="text-xs space-y-1.5 p-3 bg-slate-50 rounded-md border border-slate-100">
              <p className="font-medium text-slate-700 mb-2">A nova senha deve conter:</p>
              <div className="flex items-center gap-2">
                {validations.length ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-slate-300" />
                )}
                <span className={validations.length ? 'text-slate-700' : 'text-slate-500'}>
                  Mínimo de 8 caracteres
                </span>
              </div>
              <div className="flex items-center gap-2">
                {validations.upper && validations.lower ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-slate-300" />
                )}
                <span
                  className={
                    validations.upper && validations.lower ? 'text-slate-700' : 'text-slate-500'
                  }
                >
                  Letras maiúsculas e minúsculas
                </span>
              </div>
              <div className="flex items-center gap-2">
                {validations.number ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-slate-300" />
                )}
                <span className={validations.number ? 'text-slate-700' : 'text-slate-500'}>
                  Pelo menos um número
                </span>
              </div>
              <div className="flex items-center gap-2">
                {validations.special ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-slate-300" />
                )}
                <span className={validations.special ? 'text-slate-700' : 'text-slate-500'}>
                  Pelo menos um caractere especial (!@#$%^&*)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {validations.different ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-red-500" />
                )}
                <span className={validations.different ? 'text-slate-700' : 'text-red-500'}>
                  Diferente da senha atual
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md">
                {errorMsg}
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2">
            <Button type="submit" className="w-full" disabled={loading || !isFormValid}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
