import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { roleLabels } from '@/types/auth'
import { toast } from '@/hooks/use-toast'
import { User, Lock, LogOut, Shield, Camera } from 'lucide-react'
import { format } from 'date-fns'

export default function MinhaConta() {
  const { user, profile, orgMember, signOut, updatePassword, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [roleTitle, setRoleTitle] = useState(profile?.role_title || '')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSaveProfile = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, role_title: roleTitle })
      .eq('id', user!.id)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Perfil atualizado!', description: 'Dados salvos com sucesso.' })
      refreshProfile()
    }
    setLoading(false)
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    const { error } = await updatePassword(newPassword)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Senha alterada!', description: 'Sua senha foi atualizada.' })
      setNewPassword('')
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setLoading(true)
    const ext = file.name.split('.').pop()
    const fileName = `${user.id}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })
    if (upErr) {
      toast({ title: 'Erro', description: upErr.message, variant: 'destructive' })
      setLoading(false)
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', user.id)
    if (updErr) {
      toast({ title: 'Erro', description: updErr.message, variant: 'destructive' })
    } else {
      toast({ title: 'Foto atualizada!', description: 'Sua foto de perfil foi atualizada.' })
      refreshProfile()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-primary" /> Minha Conta
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Gerencie seu perfil e segurança.</p>
      </div>

      <Card className="rounded-3xl bg-white border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    className="w-full h-full rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <span className="text-lg font-bold text-primary">
                    {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
                <Camera className="w-3 h-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
            <div>
              <p className="font-bold text-base">{profile?.full_name || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              {orgMember && (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg inline-block mt-1">
                  {roleLabels[orgMember.role]}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome Completo</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="h-10 text-xs rounded-xl bg-secondary"
              />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label className="text-xs">Cargo</Label>
              <Input
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="h-10 text-xs rounded-xl"
                placeholder="Ex: Proprietário"
              />
            </div>
            {profile?.last_sign_in_at && (
              <p className="text-[10px] text-muted-foreground">
                Último acesso: {format(new Date(profile.last_sign_in_at), 'dd/MM/yyyy HH:mm')}
              </p>
            )}
            <Button
              onClick={handleSaveProfile}
              disabled={loading}
              className="rounded-xl bg-primary text-white text-xs w-full"
            >
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl bg-white border-border">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">Alterar Senha</h2>
          </div>
          <div>
            <Label className="text-xs">Nova Senha</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 text-xs rounded-xl"
              placeholder="••••••••"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={loading}
            variant="outline"
            className="rounded-xl text-xs w-full border-border"
          >
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl bg-white border-border">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">Segurança</h2>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="rounded-xl text-xs w-full border-border text-rose-600 hover:bg-rose-50 gap-2"
          >
            <LogOut className="w-4 h-4" /> Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
