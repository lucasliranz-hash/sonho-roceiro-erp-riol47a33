import { useFarmStore } from '@/hooks/use-farm-store'
import { Card } from '@/components/ui/card'
import { Users, Phone } from 'lucide-react'

export default function ClientesFornecedores() {
  const { customers, suppliers } = useFarmStore()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Clientes e Fornecedores
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Cadastro de contatos e histórico de negócios da propriedade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 rounded-3xl bg-white border-border space-y-3">
          <h2 className="font-bold text-base">Clientes Cadastrados</h2>
          {customers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum cliente cadastrado
            </p>
          )}
          {customers.map((c) => (
            <div key={c.id} className="p-3 rounded-2xl bg-secondary/30 text-xs space-y-1">
              <p className="font-bold text-foreground">{c.name}</p>
              <p className="text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> {c.phone} • {c.city}
              </p>
            </div>
          ))}
        </Card>

        <Card className="p-5 rounded-3xl bg-white border-border space-y-3">
          <h2 className="font-bold text-base">Fornecedores</h2>
          {suppliers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum fornecedor cadastrado
            </p>
          )}
          {suppliers.map((s) => (
            <div key={s.id} className="p-3 rounded-2xl bg-secondary/30 text-xs space-y-1">
              <p className="font-bold text-foreground">{s.name}</p>
              <p className="text-muted-foreground">
                {s.suppliedProduct} • {s.city}
              </p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
