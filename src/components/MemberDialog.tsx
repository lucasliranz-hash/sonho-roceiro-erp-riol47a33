import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MemberRole, roleLabels, Property } from '@/types/auth'
import { inviteUser, updateMember } from '@/services/team'
import { toast } from '@/hooks/use-toast'

interface MemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  properties: Property[]
  mode: 'invite' | 'edit'
  member?: {
    id: string
    user_id: string | null
    role: MemberRole
    invited_email: string | null
    profile?: { full_name: string }
  } | null
  accessPropertyIds?: string[]
  onSuccess?: () => void
}

export function MemberDialog({
  open,
  onOpenChange,
  orgId,
  properties,
  mode,
  member,
  accessPropertyIds,
  onSuccess,
}: MemberDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('OPERADOR')
  const [selectedProps, setSelectedProps] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && member) {
      setName(member.profile?.full_name || '')
      setEmail(member.invited_email || '')
      setRole(member.role)
      setSelectedProps(accessPropertyIds || [])
    } else {
      setName('')
      setEmail('')
      setRole('OPERADOR')
      setSelectedProps([])
    }
  }, [mode, member, accessPropertyIds, open])

  const toggleProperty = (pid: string) => {
    setSelectedProps((prev) =>
      prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid],
    )
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (mode === 'invite') {
        const { error } = await inviteUser({ email, name, role, propertyIds: selectedProps })
        if (error) throw error
        toast({ title: 'Convite enviado!', description: `E-mail enviado para ${email}` })
      } else if (member) {
        const { error } = await updateMember(member.id, member.user_id, orgId, role, selectedProps)
        if (error) throw error
        toast({ title: 'Membro atualizado!', description: 'Permissões atualizadas com sucesso.' })
      }
      onSuccess?.()
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'invite' ? 'Convidar Usuário' : 'Editar Permissões'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs rounded-xl"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <Label className="text-xs">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 text-xs rounded-xl"
              placeholder="email@exemplo.com"
              disabled={mode === 'edit'}
            />
          </div>
          <div>
            <Label className="text-xs">Função</Label>
            <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(roleLabels) as MemberRole[]).map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {roleLabels[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Propriedades com Acesso</Label>
            <div className="space-y-2 mt-1 max-h-32 overflow-y-auto border border-border rounded-xl p-2">
              {properties.map((prop) => (
                <div key={prop.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedProps.includes(prop.id)}
                    onCheckedChange={() => toggleProperty(prop.id)}
                  />
                  <span className="text-xs">{prop.name}</span>
                </div>
              ))}
              {properties.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma propriedade cadastrada</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-primary text-white text-xs"
          >
            {loading ? 'Salvando...' : mode === 'invite' ? 'Enviar Convite' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
