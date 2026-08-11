export type MemberRole = 'OWNER' | 'ADMIN' | 'GESTOR' | 'OPERADOR' | 'FINANCEIRO' | 'VISUALIZACAO'
export type MemberStatus = 'ativo' | 'convite_pendente' | 'bloqueado'

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  role_title: string | null
  last_sign_in_at: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string | null
  role: MemberRole
  status: MemberStatus
  invited_email: string | null
  invited_at: string | null
  accepted_at: string | null
  permissions: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  organization_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface UserPropertyAccess {
  id: string
  user_id: string
  organization_id: string
  property_id: string | null
  can_access_all: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  organization_id: string
  property_id: string | null
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}

export const roleLabels: Record<MemberRole, string> = {
  OWNER: 'Proprietario',
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  OPERADOR: 'Operador',
  FINANCEIRO: 'Financeiro',
  VISUALIZACAO: 'Visualizacao',
}

export const statusLabels: Record<MemberStatus, string> = {
  ativo: 'Ativo',
  convite_pendente: 'Convite pendente',
  bloqueado: 'Bloqueado',
}

export const roleColors: Record<MemberRole, string> = {
  OWNER: 'bg-amber-100 text-amber-800 border-amber-200',
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  GESTOR: 'bg-blue-100 text-blue-800 border-blue-200',
  OPERADOR: 'bg-green-100 text-green-800 border-green-200',
  FINANCEIRO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  VISUALIZACAO: 'bg-gray-100 text-gray-800 border-gray-200',
}
