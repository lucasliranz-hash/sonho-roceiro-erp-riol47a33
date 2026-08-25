import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Download, Smartphone, Users, ChevronRight, ListTodo } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'

export default function Configuracoes() {
  const handleExport = () => {
    toast({
      title: 'Exportação Concluída! 📥',
      description: 'Dados em formato JSON gerados com sucesso.',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Configurações — SR Gestão
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Perfil do sítio, backup e status do aplicativo PWA.
        </p>
      </div>

      <div className="space-y-3">
        <Link to="/atividades">
          <Card className="p-4 rounded-2xl bg-white border-border flex items-center gap-3 hover:bg-secondary/50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ListTodo className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold">Atividades</p>
              <p className="text-[10px] text-muted-foreground">
                Cadastre atividades produtivas (avicultura, piscicultura, etc.)
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Card>
        </Link>

        <Link to="/equipe">
          <Card className="p-4 rounded-2xl bg-white border-border flex items-center gap-3 hover:bg-secondary/50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold">Equipe e Permissões</p>
              <p className="text-[10px] text-muted-foreground">
                Gerencie usuários, convites e acessos
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Card>
        </Link>
      </div>

      <Card className="p-6 rounded-3xl bg-white border-border space-y-4">
        <h2 className="font-bold text-base">Propriedade: Sonho Roceiro</h2>
        <p className="text-xs text-muted-foreground">
          SR Gestão configurado para Avicultura de Poedeiras e Corte.
        </p>

        <div className="pt-4 border-t border-border flex flex-col md:flex-row gap-3">
          <Button onClick={handleExport} className="rounded-xl bg-primary text-white text-xs gap-2">
            <Download className="w-4 h-4" /> Exportar Backup dos Dados
          </Button>

          <Button variant="outline" className="rounded-xl text-xs gap-2 border-border">
            <Smartphone className="w-4 h-4 text-emerald-600" /> Aplicativo Instalável PWA Pronto
          </Button>
        </div>
      </Card>

      <p className="text-[10px] text-muted-foreground/70 text-center">
        Sonho Roceiro ERP — v0.0.51
      </p>
    </div>
  )
}
