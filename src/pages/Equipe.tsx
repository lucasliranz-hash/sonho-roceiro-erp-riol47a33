import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { MemberDialog } from '@/components/MemberDialog'
import {
  listMembers,
  listProperties,
  listUserAccess,
  blockMember,
  unblockMember,
  removeMember,
  resendInvite,
} from '@/services/team'
import { roleLabels, statusLabels, roleColors, MemberRole, Property } from '@/types/auth'
import { Users, MoreVertical, UserPlus, Ban, Trash2, Unlock, Pencil, RefreshCw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface MemberRow {
  id: string
  user_id: string | null
  role: MemberRole
  status: string
  invited_email: string | null
  profile?: { full_name: string; avatar_url: string | null; last_sign_in_at: string | null }
}

export default function Equipe() {
  const { orgMember } = useAuth()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [accessMap, setAccessMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'invite' | 'edit'>('invite')
  const [editMember, setEditMember] = useState<MemberRow | null>(null)

  const orgId = orgMember?.organization_id || ''

  const loadData = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    const [{ data: membersData }, { data: propsData }, { data: accessData }] = await Promise.all([
      listMembers(orgId),
      listProperties(orgId),
      listUserAccess(orgId),
    ])
    setMembers((membersData as MemberRow[]) || [])
    setProperties(propsData || [])
    const aMap: Record<string, string[]> = {}
    ;(accessData || []).forEach((a: any) => {
      if (a.user_id && a.property_id) {
        if (!aMap[a.user_id]) aMap[a.user_id] = []
        aMap[a.user_id].push(a.property_id)
      }
    })
    setAccessMap(aMap)
    setLoading(false)
  }, [orgId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleEdit = (m: MemberRow) => {
    setEditMember(m)
    setDialogMode('edit')
    setDialogOpen(true)
  }
  const handleInvite = () => {
    setEditMember(null)
    setDialogMode('invite')
    setDialogOpen(true)
  }

  const handleBlock = async (id: string) => {
    const { error } = await blockMember(id)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Usuário bloqueado', description: 'O acesso foi revogado.' })
    loadData()
  }
  const handleUnblock = async (id: string) => {
    const { error } = await unblockMember(id)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Usuário desbloqueado', description: 'O acesso foi restaurado.' })
    loadData()
  }
  const handleRemove = async (id: string) => {
    const { error } = await removeMember(id)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Membro removido', description: 'O usuário não tem mais acesso.' })
    loadData()
  }
  const handleResend = async (m: MemberRow) => {
    const { error } = await resendInvite({
      email: m.invited_email || '',
      name: m.profile?.full_name || '',
      role: m.role,
      propertyIds: (m.user_id ? accessMap[m.user_id] : []) || [],
    })
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Convite reenviado', description: `E-mail enviado para ${m.invited_email}` })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Equipe
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie usuários, convites e permissões.
          </p>
        </div>
        <Button onClick={handleInvite} className="rounded-xl bg-primary text-white text-xs gap-2">
          <UserPlus className="w-4 h-4" /> Convidar Usuário
        </Button>
      </div>

      <div className="space-y-3">
        {members.map((m) => {
          const propNames = m.user_id
            ? (accessMap[m.user_id] || [])
                .map((pid) => properties.find((p) => p.id === pid)?.name)
                .filter(Boolean)
            : []
          const status = m.status as keyof typeof statusLabels
          const displayName = m.profile?.full_name || m.invited_email || 'Usuário'
          return (
            <Card key={m.id} className="rounded-2xl bg-white border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {m.profile?.avatar_url ? (
                    <img
                      src={m.profile.avatar_url}
                      className="w-full h-full rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span className="text-xs font-bold text-primary">
                      {displayName[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {m.invited_email || 'Sem e-mail'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className={`text-[9px] ${roleColors[m.role] || ''}`}>
                      {roleLabels[m.role] || m.role}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        status === 'ativo'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : status === 'convite_pendente'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {statusLabels[status] || status}
                    </Badge>
                  </div>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-[10px] text-muted-foreground">Propriedades</p>
                  <p className="text-xs font-medium truncate max-w-[120px]">
                    {propNames.length > 0 ? propNames.join(', ') : 'Todas'}
                  </p>
                  {m.profile?.last_sign_in_at && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      Acesso: {format(new Date(m.profile.last_sign_in_at), 'dd/MM/yyyy')}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(m)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                    </DropdownMenuItem>
                    {status === 'convite_pendente' && (
                      <DropdownMenuItem onClick={() => handleResend(m)}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" /> Reenviar convite
                      </DropdownMenuItem>
                    )}
                    {status === 'ativo' ? (
                      <DropdownMenuItem onClick={() => handleBlock(m.id)}>
                        <Ban className="w-3.5 h-3.5 mr-2" /> Bloquear
                      </DropdownMenuItem>
                    ) : (
                      status === 'bloqueado' && (
                        <DropdownMenuItem onClick={() => handleUnblock(m.id)}>
                          <Unlock className="w-3.5 h-3.5 mr-2" /> Desbloquear
                        </DropdownMenuItem>
                      )
                    )}
                    <DropdownMenuItem onClick={() => handleRemove(m.id)} className="text-rose-600">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          )
        })}
        {members.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-xs text-muted-foreground">Nenhum membro na equipe ainda.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orgId={orgId}
        properties={properties}
        mode={dialogMode}
        member={editMember}
        accessPropertyIds={editMember?.user_id ? accessMap[editMember.user_id] || [] : []}
        onSuccess={loadData}
      />
    </div>
  )
}
