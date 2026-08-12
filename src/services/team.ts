import { supabase } from '@/lib/supabase/client'
import { OrganizationMember, MemberRole, Property } from '@/types/auth'

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

function toJson(v: Record<string, unknown> | undefined | null): Json {
  return (v ?? null) as unknown as Json
}

export interface TeamMember extends OrganizationMember {
  profile?: {
    full_name: string
    avatar_url: string | null
    phone: string | null
    last_sign_in_at: string | null
    role_title: string | null
  }
}

export async function listMembers(orgId: string) {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*, profiles:user_id(full_name, avatar_url, phone, last_sign_in_at, role_title)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  return { data: data as TeamMember[] | null, error }
}

export async function listProperties(orgId: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('id, name')
    .eq('organization_id', orgId)
  return { data: data as Property[] | null, error }
}

export async function listUserAccess(orgId: string) {
  const { data, error } = await supabase
    .from('user_property_access')
    .select('*')
    .eq('organization_id', orgId)
  return { data, error }
}

export async function inviteUser(params: {
  email: string
  name: string
  role: MemberRole
  propertyIds: string[]
  permissions?: Record<string, boolean>
}) {
  const { error } = await supabase.functions.invoke('invite-user', {
    body: {
      email: params.email,
      name: params.name,
      role: params.role,
      property_ids: params.propertyIds,
      permissions: params.permissions || {},
    },
  })
  return { error }
}

export async function updateMember(
  memberId: string,
  userId: string | null,
  orgId: string,
  role: MemberRole,
  propertyIds: string[],
  permissions?: Record<string, boolean>,
) {
  const { error: updateError } = await supabase
    .from('organization_members')
    .update({ role, permissions: permissions || {} })
    .eq('id', memberId)
  if (updateError) return { error: updateError }

  if (userId) {
    await supabase
      .from('user_property_access')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', orgId)
    if (propertyIds.length > 0) {
      const records = propertyIds.map((pid) => ({
        user_id: userId,
        organization_id: orgId,
        property_id: pid,
        can_access_all: false,
      }))
      const { error: accessError } = await supabase.from('user_property_access').insert(records)
      if (accessError) return { error: accessError }
    }
  }
  return { error: null }
}

export async function blockMember(memberId: string) {
  const { error } = await supabase
    .from('organization_members')
    .update({ status: 'bloqueado' })
    .eq('id', memberId)
  if (!error) {
    await logAudit(
      'block',
      'organization_member',
      memberId,
      { status: 'ativo' },
      { status: 'bloqueado' },
    )
  }
  return { error }
}

export async function unblockMember(memberId: string) {
  const { error } = await supabase
    .from('organization_members')
    .update({ status: 'ativo' })
    .eq('id', memberId)
  if (!error) {
    await logAudit(
      'unblock',
      'organization_member',
      memberId,
      { status: 'bloqueado' },
      { status: 'ativo' },
    )
  }
  return { error }
}

export async function removeMember(memberId: string) {
  const { data: member } = await supabase
    .from('organization_members')
    .select('user_id, organization_id, invited_email')
    .eq('id', memberId)
    .single()

  const { error } = await supabase.from('organization_members').delete().eq('id', memberId)
  if (error) return { error }

  if (member?.user_id && member?.organization_id) {
    await supabase
      .from('user_property_access')
      .delete()
      .eq('user_id', member.user_id)
      .eq('organization_id', member.organization_id)
  }

  await logAudit(
    'remove',
    'organization_member',
    memberId,
    { invited_email: member?.invited_email },
    null,
  )
  return { error: null }
}

export async function resendInvite(params: {
  email: string
  name: string
  role: MemberRole
  propertyIds: string[]
}) {
  const { error } = await supabase.functions.invoke('invite-user', {
    body: { ...params, property_ids: params.propertyIds, resend: true },
  })
  return { error }
}

export async function logAudit(
  action: string,
  entityType: string,
  entityId?: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>,
) {
  await supabase.rpc('log_audit', {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId || null,
    p_old_data: toJson(oldData),
    p_new_data: toJson(newData),
  })
}
