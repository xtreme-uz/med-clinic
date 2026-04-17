import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/types'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    const { data } = await supabase.auth.getSession()
    await applySession(set, data.session)

    supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(set, session)
    })
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await applySession(set, data.session)
  },

  signOut: async () => {
    await supabase.auth.signOut().catch(() => {})
    set({ session: null, user: null, profile: null })
  },
}))

async function applySession(
  set: (state: Partial<AuthState>) => void,
  session: Session | null,
) {
  if (!session) {
    set({ session: null, user: null, profile: null, loading: false })
    return
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  set({
    session,
    user: session.user,
    profile: (profile as Profile | null) ?? null,
    loading: false,
  })
}
