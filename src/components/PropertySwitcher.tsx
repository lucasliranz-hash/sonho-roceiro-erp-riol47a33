import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Building2, Check, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface PropertyOption {
  id: string
  name: string
  role: string
}

const mockProperties: PropertyOption[] = [
  { id: 'p1', name: 'Sonho Roceiro', role: 'Produtor Rural' },
  { id: 'p2', name: 'Fazenda Boa Vista', role: 'Produtor Rural' },
]

import { useAuth } from '@/hooks/use-auth'
import { roleLabels } from '@/types/auth'

export function PropertySwitcher() {
  const { currentProperty, properties, setCurrentProperty, orgMember, organization } = useAuth()
  const [open, setOpen] = useState(false)

  const activeName = currentProperty?.name || organization?.name || 'Propriedade'
  const roleLabel = orgMember ? roleLabels[orgMember.role] : 'Produtor Rural'

  const availableProperties =
    properties.length > 0
      ? properties
      : currentProperty
        ? [currentProperty]
        : organization
          ? [{ id: 'default', name: organization.name }]
          : []

  const handleSelect = (prop: { id: string; name: string }) => {
    setCurrentProperty(prop)
    setOpen(false)
    toast({ title: 'Propriedade alterada', description: `Agora gerenciando: ${prop.name}` })
  }

  return (
    <div className="px-3 py-2.5 border-t border-border bg-sand/20">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
        Propriedade Atual
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-sand/40 transition-colors text-left">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{activeName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{roleLabel}</p>
            </div>
            {availableProperties.length > 1 && (
              <span className="text-[9px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0">
                Trocar
              </span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Trocar Propriedade</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {availableProperties.map((prop) => (
              <button
                key={prop.id}
                onClick={() => handleSelect(prop)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                  currentProperty?.id === prop.id || (!currentProperty && prop.id === 'default')
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-secondary',
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">{prop.name}</p>
                  <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
                </div>
                {(currentProperty?.id === prop.id ||
                  (!currentProperty && prop.id === 'default')) && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
