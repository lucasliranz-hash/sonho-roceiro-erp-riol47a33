import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandLogo } from '@/components/BrandLogo'
import { toast } from '@/hooks/use-toast'

export default function Auth() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [farmName, setFarmName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: isRegister ? 'Bem-vindo ao SR Gestão! 🚀' : 'Acesso realizado! 👋',
      description: 'Conectado com sucesso.',
    })
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center p-4">
      <Card className="max-w-md w-full rounded-3xl bg-white border-border shadow-elevation overflow-hidden">
        <div className="bg-primary p-8 flex flex-col items-center gap-3">
          <BrandLogo size="lg" showSlogan theme="light" className="justify-center" />
        </div>

        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
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

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md tracking-wide"
            >
              {isRegister ? 'CRIAR CONTA' : 'ENTRAR'}
            </Button>
          </form>

          {!isRegister && (
            <div className="text-center">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary font-medium underline"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <div className="text-center text-xs pt-2 border-t border-border">
            <span className="text-muted-foreground">
              {isRegister ? 'Já possui conta? ' : 'Ainda não possui conta? '}
            </span>
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="font-semibold text-primary underline"
            >
              {isRegister ? 'Entrar' : 'Criar conta'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
