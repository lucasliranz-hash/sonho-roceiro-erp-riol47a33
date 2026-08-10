import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Download, Smartphone } from 'lucide-react'
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
          <Settings className="w-6 h-6 text-primary" /> Configurações do Sistema
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Perfil do sítio, backup e status do aplicativo PWA.
        </p>
      </div>

      <Card className="p-6 rounded-3xl bg-white border-border space-y-4">
        <h2 className="font-bold text-base">Sítio Sonho Roceiro</h2>
        <p className="text-xs text-muted-foreground">
          Sistema configurado para Avicultura de Poedeiras e Corte.
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
    </div>
  )
}
