import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
import { Loader2, KeyRound } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, resetPassword, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user && !location.hash.includes('type=recovery')) {
      navigate('/')
    }
  }, [user, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          const isInvalidCredentials = error.message
            .toLowerCase()
            .includes('invalid login credentials')
          toast.error('Erro ao fazer login', {
            description: isInvalidCredentials
              ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
              : error.message,
          })
        } else {
          toast.success('Login realizado com sucesso!')
          navigate('/')
        }
      } else if (mode === 'register') {
        const { data, error } = await signUp(email, password)
        if (error) {
          toast.error('Erro ao criar conta', { description: error.message })
        } else if (data?.user?.identities && data.user.identities.length === 0) {
          toast.error('Erro ao criar conta', {
            description: 'Este e-mail já está cadastrado. Tente fazer login ou recupere a senha.',
          })
          setMode('login')
        } else {
          toast.success('Conta criada com sucesso! Você já pode acessar o sistema.')
          if (!data?.session) {
            setMode('login')
          }
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email)
        if (error) {
          toast.error('Erro ao solicitar recuperação', { description: error.message })
        } else {
          toast.success('E-mail de recuperação enviado!', {
            description: 'Verifique sua caixa de entrada para redefinir sua senha.',
          })
          setMode('login')
        }
      }
    } catch (err: any) {
      toast.error('Erro inesperado', { description: err?.message || 'Ocorreu um erro.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm shadow-md animate-fade-in-up border-slate-200">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' && 'Bem-vindo de volta'}
            {mode === 'register' && 'Crie sua conta'}
            {mode === 'forgot' && 'Recuperar senha'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' && 'Insira suas credenciais para acessar o CRM'}
            {mode === 'register' && 'Preencha seus dados para começar'}
            {mode === 'forgot' && 'Digite seu e-mail para receber um link de recuperação'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-white"
              />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm font-medium text-primary hover:underline focus:outline-none"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="bg-white"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-4">
            <Button type="submit" className="w-full shadow-sm" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'login' && 'Entrar'}
              {mode === 'register' && 'Cadastrar'}
              {mode === 'forgot' && 'Enviar e-mail'}
            </Button>
            {mode === 'forgot' ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setMode('login')}
                disabled={loading}
              >
                Voltar para o login
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                disabled={loading}
              >
                {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
