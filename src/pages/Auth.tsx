import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandLogo } from '@/components/BrandLogo'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'

export default function Auth() {
  const navigate = useNavigate()
  const { user, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        toast({ title: 'Bem-vindo! 👋', description: 'Acesso realizado com sucesso.' })
      } else if (mode === 'register') {
        const { error } = await signUp(email, password, fullName, farmName)
        if (error) throw error
        toast({ title: 'Conta criada! 🚀', description: 'Bem-vindo ao SR Gestão!' })
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email)
        if (error) throw error
        toast({
          title: 'E-mail enviado! 📧',
          description: 'Verifique seu e-mail para redefinir a senha.',
        })
        setMode('login')
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Algo deu errado',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center p-4">
      <Card className="max-w-md w-full rounded-3xl bg-white border-border shadow-elevation overflow-hidden">
        <div className="bg-primary p-8 flex flex-col items-center gap-3">
          <BrandLogo size="lg" showSlogan theme="light" className="justify-center" />
        </div>
        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <Label className="text-xs">Nome Completo</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 text-xs rounded-xl"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Nome da Propriedade</Label>
                  <Input
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="h-11 text-xs rounded-xl"
                    placeholder="Ex: Sítio Sonho Roceiro"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 text-xs rounded-xl"
                required
              />
            </div>
            {mode !== 'reset' && (
              <div>
                <Label className="text-xs">Senha</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 text-xs rounded-xl"
                  required
                />
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md tracking-wide"
            >
              {loading
                ? 'Aguarde...'
                : mode === 'login'
                  ? 'ENTRAR'
                  : mode === 'register'
                    ? 'CRIAR CONTA'
                    : 'ENVIAR LINK'}
            </Button>
          </form>
          {mode === 'login' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-xs text-muted-foreground hover:text-primary font-medium underline"
              >
                Esqueci minha senha
              </button>
            </div>
          )}
          <div className="text-center text-xs pt-2 border-t border-border">
            {mode === 'reset' ? (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-semibold text-primary underline"
              >
                Voltar para login
              </button>
            ) : (
              <span className="text-muted-foreground">
                {mode === 'register' ? 'Já possui conta? ' : 'Ainda não possui conta? '}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                  className="font-semibold text-primary underline"
                >
                  {mode === 'register' ? 'Entrar' : 'Criar conta'}
                </button>
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
