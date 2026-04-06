import { useState, useEffect } from 'react'
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
import { Loader2, Lock } from 'lucide-react'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword, session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!session) {
      const hash = window.location.hash
      if (!hash || !hash.includes('access_token')) {
        const timer = setTimeout(() => {
          navigate('/login')
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [session, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await updatePassword(password)
      if (error) throw error

      toast.success('Senha atualizada com sucesso!')
      navigate('/')
    } catch (err: any) {
      toast.error('Erro ao atualizar senha', { description: err?.message || 'Ocorreu um erro.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm shadow-md animate-fade-in-up border-slate-200">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Nova Senha</CardTitle>
          <CardDescription>Digite sua nova senha abaixo.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-4">
            <Button type="submit" className="w-full shadow-sm" disabled={loading || !password}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar Senha
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Voltar para o login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
