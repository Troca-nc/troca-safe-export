// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { authApi } from '@/lib/api'
import { DEMO_ACCOUNTS, inferDemoAccount, isDemoEmail } from '@/lib/demoApi'
import { sessionCoordinator, type SessionStatus } from '@/lib/sessionCoordinator'
import { useFavorisStore } from '@/store/favorisStore'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  prenom?: string
  nom?: string
  telephone?: string | null
  phone_verified?: boolean
  avatar_url: string | null
  is_verified: boolean
  is_pro: boolean
  is_admin: boolean
  rating: number
  commune_name?: string
  demo_role?: string
  account_type?: 'personal' | 'professional'
  pro_plan?: 'pro'
  onboarding_step?: number
  pro_category?: string | null
  tours_seen?: string[]
}

export type DemoProfileKey = 'visitor' | 'particulier' | 'pro' | 'bon_plan'

const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login'

const DEMO_USERS: Record<Exclude<DemoProfileKey, 'visitor'>, User> = {
  particulier: {
    id: 'demo-particulier', email: 'particulier@demo.kalico.nc', first_name: 'Emma', last_name: 'Martin',
    avatar_url: null, is_verified: true, is_pro: false, is_admin: false, rating: 4.8,
    commune_name: 'Nouméa', demo_role: 'Particulier', tours_seen: [],
  },
  pro: {
    id: 'demo-pro', email: 'pro@demo.kalico.nc', first_name: 'Atelier', last_name: 'Kalo',
    avatar_url: null, is_verified: true, is_pro: true, is_admin: false, rating: 4.9,
    commune_name: 'Dumbéa', demo_role: 'Compte Pro', pro_category: 'Artisan BTP', tours_seen: [],
  },
  bon_plan: {
    id: 'demo-bon-plan', email: 'bonplan@demo.kalico.nc', first_name: 'Kalico', last_name: 'Bon Plan',
    avatar_url: null, is_verified: true, is_pro: true, is_admin: false, rating: 5,
    commune_name: 'Nouméa', demo_role: 'Annonceur Bon Plan', pro_category: 'Bons plans & événements', tours_seen: [],
  },
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  demoProfile: DemoProfileKey | null
  hasHydrated: boolean
  sessionStatus: SessionStatus
  login: (email: string, password: string, turnstileToken?: string) => Promise<void>
  register: (data: object, turnstileToken?: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  refreshMe: () => Promise<void>
  setUser: (user: User) => void
  setDemoProfile: (profile: DemoProfileKey | null) => void
  setHasHydrated: (hydrated: boolean) => void
  setSessionStatus: (status: SessionStatus) => void
  resetAuthState: () => void
}

type RealAuthBackup = { user: User | null; isAuthenticated: boolean; accessToken: string | null }
let realAuthBackup: RealAuthBackup | null = null

function isReady(status: SessionStatus) {
  return status === 'visitor' || status === 'authenticated'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      demoProfile: null,
      hasHydrated: false,
      sessionStatus: 'bootstrapping',

      setDemoProfile: (profile) => {
        const currentDemo = get().demoProfile
        if (typeof window !== 'undefined') window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)

        if (!profile) {
          if (realAuthBackup?.accessToken) {
            sessionCoordinator.setAuthenticated(realAuthBackup.accessToken)
            set({ user: realAuthBackup.user, isAuthenticated: realAuthBackup.isAuthenticated, demoProfile: null, sessionStatus: 'authenticated', hasHydrated: true })
            realAuthBackup = null
            useFavorisStore.getState().hydrate()
            return
          }
          realAuthBackup = null
          set({ user: null, isAuthenticated: false, demoProfile: null, sessionStatus: 'bootstrapping', hasHydrated: false })
          void sessionCoordinator.recoverAccessToken().catch(() => {})
          return
        }

        if (!currentDemo) {
          realAuthBackup = { user: get().user, isAuthenticated: get().isAuthenticated, accessToken: sessionCoordinator.getAccessToken() }
        }
        useFavorisStore.getState().clear()

        if (profile === 'visitor') {
          sessionCoordinator.setVisitor(false)
          set({ user: null, isAuthenticated: false, demoProfile: 'visitor', sessionStatus: 'visitor', hasHydrated: true })
          return
        }

        sessionCoordinator.setDemoAuthenticated()
        set({ user: DEMO_USERS[profile], isAuthenticated: true, demoProfile: profile, sessionStatus: 'authenticated', hasHydrated: true })
      },

      login: async (email, password, turnstileToken) => {
        set({ isLoading: true })
        try {
          const inferredDemo = inferDemoAccount(email)
          const demoProfile = inferredDemo === 'particulier' || inferredDemo === 'pro' || inferredDemo === 'bon_plan' ? inferredDemo : null
          const expectedPassword = demoProfile ? DEMO_ACCOUNTS[demoProfile].password : null
          if (demoProfile && isDemoEmail(email) && password === expectedPassword) {
            get().setDemoProfile(demoProfile)
            return
          }

          const { data } = await authApi.login({ email, password }, turnstileToken)
          const { user, access_token } = data.data
          sessionCoordinator.setAuthenticated(access_token)
          set({ user, isAuthenticated: true, demoProfile: null, sessionStatus: 'authenticated', hasHydrated: true })
          realAuthBackup = null
          useFavorisStore.getState().hydrate()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (formData, turnstileToken) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.register(formData, turnstileToken)
          const { user, access_token } = data.data
          sessionCoordinator.setAuthenticated(access_token)
          set({ user, isAuthenticated: true, demoProfile: null, sessionStatus: 'authenticated', hasHydrated: true })
          realAuthBackup = null
          useFavorisStore.getState().hydrate()
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        await sessionCoordinator.logout().catch(() => {})
        realAuthBackup = null
        useFavorisStore.getState().clear()
        set({ user: null, isAuthenticated: false, demoProfile: null, sessionStatus: 'visitor', hasHydrated: true })
      },

      fetchMe: async () => {
        if (get().demoProfile) return
        const { data } = await authApi.me()
        set({ user: data.data, isAuthenticated: true, demoProfile: null, sessionStatus: 'authenticated', hasHydrated: true })
      },

      refreshMe: async () => {
        if (get().demoProfile) return
        const { data } = await authApi.me()
        set({ user: data.data, isAuthenticated: true, demoProfile: null })
      },

      setUser: (user) => set({ user, isAuthenticated: Boolean(user), sessionStatus: user ? 'authenticated' : 'visitor', hasHydrated: true }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setSessionStatus: (sessionStatus) => set({ sessionStatus, hasHydrated: isReady(sessionStatus) }),
      resetAuthState: () => set({ user: null, isAuthenticated: false, demoProfile: null, sessionStatus: 'visitor', hasHydrated: true }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ demoProfile: state.demoProfile }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AuthState> | undefined
        return { ...current, demoProfile: saved?.demoProfile ?? null }
      },
      onRehydrateStorage: () => (state) => {
        if (!state?.demoProfile) return
        const profile = state.demoProfile
        if (profile === 'visitor') {
          sessionCoordinator.setVisitor(false)
          useAuthStore.setState({ user: null, isAuthenticated: false, sessionStatus: 'visitor', hasHydrated: true })
          return
        }
        sessionCoordinator.setDemoAuthenticated()
        useAuthStore.setState({ user: DEMO_USERS[profile], isAuthenticated: true, sessionStatus: 'authenticated', hasHydrated: true })
      },
    },
  ),
)
