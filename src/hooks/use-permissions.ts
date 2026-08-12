import { useAuth } from '@/hooks/use-auth'
import { MemberRole } from '@/types/auth'

const READ_ONLY_ROLES: MemberRole[] = ['VISUALIZACAO']

/**
 * Returns permission flags based on the current user's organization role.
 * - VISUALIZACAO users are read-only (cannot edit or delete).
 * - All other roles (OWNER, ADMIN, GESTOR, OPERADOR, FINANCEIRO) can edit/delete
 *   subject to RLS on the backend.
 */
export function usePermissions() {
  const { orgMember } = useAuth()
  const role = orgMember?.role
  const isReadOnly = role ? READ_ONLY_ROLES.includes(role) : false
  return {
    role,
    canEdit: !isReadOnly,
    canDelete: !isReadOnly,
    isReadOnly,
  }
}
