import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Profile, OrganizationMember } from '@/types/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  orgMember: OrganizationMember | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
    farmName: string,
  ) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
  signOutAll: () => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orgMember, setOrgMember] = useState<OrganizationMember | null>(null)
  const [loading, setLoading] = useState(true)
  const orgSetupDone = useRef(false)
  const lastSignInUpdated = useRef(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setOrgMember(null)
      orgSetupDone.current = false
      lastSignInUpdated.current = false
      return
    }
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData as Profile | null)

      if (!lastSignInUpdated.current && profileData) {
        lastSignInUpdated.current = true
        await supabase
          .from('profiles')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', user.id)
      }

      const { data: memberData } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)

      if (memberData && memberData.length > 0) {
        setOrgMember(memberData[0] as OrganizationMember)
      } else if (!orgSetupDone.current && user.user_metadata?.farm_name) {
        orgSetupDone.current = true
        const farmName = user.user_metadata.farm_name as string
        const { data: org } = await supabase
          .from('organizations')
          .insert({ name: farmName, created_by: user.id })
          .select()
          .single()
        if (org) {
          await supabase.from('organization_members').insert({
            organization_id: org.id,
            user_id: user.id,
            role: 'OWNER',
            status: 'ativo',
            accepted_at: new Date().toISOString(),
          })
          const { data: newProp } = await supabase
            .from('properties')
            .insert({ organization_id: org.id, name: farmName })
            .select()
            .single()
          if (newProp) {
            await supabase.from('user_property_access').insert({
              user_id: user.id,
              organization_id: org.id,
              property_id: newProp.id,
              can_access_all: true,
            })
          }
          const { data: newMember } = await supabase
            .from('organization_members')
            .select('*')
            .eq('user_id', user.id)
            .limit(1)
          setOrgMember(newMember?.[0] as OrganizationMember | null)
        }
      }
    } catch (err) {
      console.error('Failed to refresh profile', err)
    }
  }, [user])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const signUp = async (email: string, password: string, fullName: string, farmName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { full_name: fullName, farm_name: farmName },
      },
    })
    return { error }
  }
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    return { error }
  }
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }
  const signOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        orgMember,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        signOutAll,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
