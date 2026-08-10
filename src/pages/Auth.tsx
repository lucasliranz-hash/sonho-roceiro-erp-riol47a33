import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

export default function Auth() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [farmName, setFarmName] = useState('Sítio Sonho Roceiro')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: isRegister ? 'Bem-vindo ao Sonho Roceiro! 🐓' : 'Acesso realizado! 👋',
      description: 'Conectado com sucesso.',
    })
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-4">
      <Card className="max-w-md w-full rounded-3xl bg-white border-border shadow-elevation p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white text-3xl font-bold flex items-center justify-center mx-auto shadow-md">
            🐓
          </div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">Sonho Roceiro ERP</h1>
          <p className="text-xs text-muted-foreground">
            Gestão rural simples, rápida e descomplicada
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <Label className="text-xs">Nome da Propriedade / Sítio</Label>
              <Input
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="h-11 text-xs rounded-xl"
                required
              />
            </div>
          )}

          <div>
            <Label className="text-xs">E-mail</Label>
            <Input
              type="email"
              placeholder="seuemail@roceiro.com"
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
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md"
          >
            {isRegister ? 'Criar Minha Conta 🚀' : 'Entrar no Sistema ✨'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-semibold text-primary underline"
          >
            {isRegister
              ? 'Já possui conta? Clique aqui para entrar'
              : 'Ainda não tem conta? Cadastre-se grátis'}
          </button>
        </div>
      </Card>
    </div>
  )
}
