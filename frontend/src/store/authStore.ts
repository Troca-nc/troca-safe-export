// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, clearTokens, isStoredAccessTokenValid, saveTokens } from '@/lib/api'
import { useFavorisStore } from '@/store/favorisStore'
import { getStoredAccessToken, getStoredRefreshToken } from '@/lib/tokenStorage'
import { DEMO_ACCOUNTS, inferDemoAccount, isDemoEmail } from '@/lib/demoApi'

interface User {
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

const REAL_AUTH_BACKUP_KEY = 'auth-store-real-backup'
const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login'

const DEMO_USERS: Record<Exclude<DemoProfileKey, 'visitor'>, User> = {
  particulier: {
    id: 'demo-particulier',
    email: 'particulier@demo.kalico.nc',
    first_name: 'Emma',
    last_name: 'Martin',
    avatar_url: null,
    is_verified: true,
    is_pro: false,
    is_admin: false,
    rating: 4.8,
    commune_name: 'Noum�a',
    demo_role: 'Particulier',
    tours_seen: [],
  },
  pro: {
    id: 'demo-pro',
    email: 'pro@demo.kalico.nc',
    first_name: 'Atelier',
    last_name: 'Kalo',
    avatar_url: null,
    is_verified: true,
    is_pro: true,
    is_admin: false,
    rating: 4.9,
    commune_name: 'Dumb�a',
    demo_role: 'Compte Pro',
    pro_category: 'Artisan BTP',
    tours_seen: [],
  },
  bon_plan: {
    id: 'demo-bon-plan',
    email: 'bonplan@demo.kalico.nc',
    first_name: 'Kalico',
    last_name: 'Bon Plan',
    avatar_url: null,
    is_verified: true,
    is_pro: true,
    is_admin: false,
    rating: 5,
    commune_name: 'Noum�a',
    demo_role: 'Annonceur Bon Plan',
    pro_category: 'Bon plans & �v�nements',
    tours_seen: [],
  },
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  demoProfile: DemoProfileKey | null
  hasHydrated: boolean

  login:    (email: string, password: string, turnstileToken?: string) => Promise<void>
  register: (data: object, turnstileToken?: string) => Promise<void>
  logout:   () => Promise<void>
  fetchMe:  () => Promise<void>
  refreshMe: () => Promise<void>
  setUser:  (user: User) => void
  setDemoProfile: (profile: DemoProfileKey | null) => void
  setHasHydrated: (hydrated: boolean) => void
}

type RealAuthBackup = {
  user: User | null
  isAuthenticated: boolean
  access_token: string | null
}

function readRealAuthBackup(): RealAuthBackup | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(REAL_AUTH_BACKUP_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeRealAuthBackup(state: RealAuthBackup) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(REAL_AUTH_BACKUP_KEY, JSON.stringify(state))
}

function clearRealAuthBackup() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(REAL_AUTH_BACKUP_KEY)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      isLoading:       false,
      isAuthenticated: false,
      demoProfile:     null,
      hasHydrated:     false,

      setDemoProfile: (profile) => {
        const currentDemo = get().demoProfile

        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
        }

        if (!profile) {
          const backup = readRealAuthBackup()
          if (backup) {
            if (backup.access_token) {
              saveTokens(backup.access_token)
            }
            set({
              user: backup.user,
              isAuthenticated: backup.isAuthenticated,
              demoProfile: null,
            })
            useFavorisStore.getState().hydrate()
            clearRealAuthBackup()
            return
          }

          clearTokens()
          useFavorisStore.getState().clear()
          set({ user: null, isAuthenticated: false, demoProfile: null })
          return
        }

        if (!currentDemo) {
          writeRealAuthBackup({
            user: get().user,
            isAuthenticated: get().isAuthenticated,
            access_token: typeof window !== 'undefined' ? getStoredAccessToken() : null,
          })
        }

        if (profile === 'visitor') {
          clearTokens()
          useFavorisStore.getState().clear()
          set({ user: null, isAuthenticated: false, demoProfile: 'visitor' })
          return
        }

        const demoUser = DEMO_USERS[profile]
        clearTokens()
        useFavorisStore.getState().clear()
        clearRealAuthBackup()
        set({
          user: demoUser,
          isAuthenticated: true,
          demoProfile: profile,
        })
      },

      login: async (email, password, turnstileToken) => {
        set({ isLoading: true })
        try {
          const inferredDemo = inferDemoAccount(email)
          const demoProfile =
            inferredDemo === 'particulier' || inferredDemo === 'pro' || inferredDemo === 'bon_plan'
              ? inferredDemo
              : null
          const expectedPassword = demoProfile ? DEMO_ACCOUNTS[demoProfile].password : null

          if (demoProfile && isDemoEmail(email) && password === expectedPassword) {
            get().setDemoProfile(demoProfile)
            return
          }

          const { data } = await authApi.login({ email, password }, turnstileToken)
          const { user, access_token, refresh_token } = data.data
          saveTokens(access_token, refresh_token)
          set({ user, isAuthenticated: true, demoProfile: null })
          clearRealAuthBackup()
          // Sync les favoris depuis le serveur apr�s connexion
          useFavorisStore.getState().hydrate()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (formData, turnstileToken) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.register(formData, turnstileToken)
          const { user, access_token, refresh_token } = data.data
          saveTokens(access_token, refresh_token)
          set({ user, isAuthenticated: true, demoProfile: null })
          clearRealAuthBackup()
          useFavorisStore.getState().hydrate()
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
          const refreshToken = getStoredRefreshToken()
        if (refreshToken) {
          await authApi.logout().catch(() => {})
        }
        clearTokens()
        clearRealAuthBackup()
        // Vider les favoris au logout
        useFavorisStore.getState().clear()
        set({ user: null, isAuthenticated: false, demoProfile: null })
      },

      fetchMe: async () => {
        if (get().demoProfile) return
        try {
          const { data } = await authApi.me()
          set({ user: data.data, isAuthenticated: true, demoProfile: null })
        } catch {
          set({ user: null, isAuthenticated: false, demoProfile: null })
        }
      },

      refreshMe: async () => {
        if (get().demoProfile) return
        try {
          const { data } = await authApi.me()
          set({ user: data.data, isAuthenticated: true, demoProfile: null })
        } catch {
          set({ user: null, isAuthenticated: false, demoProfile: null })
        }
      },

      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        demoProfile: state.demoProfile,
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined') {
          const storedAccessToken = getStoredAccessToken()
          const shouldClearRealAuth = !state?.demoProfile && (!storedAccessToken || !isStoredAccessTokenValid(storedAccessToken))

          if (shouldClearRealAuth) {
            clearTokens()
            useFavorisStore.getState().clear()
            clearRealAuthBackup()
            useAuthStore.setState({ user: null, isAuthenticated: false, demoProfile: null })
          }
        }

        state?.setHasHydrated(true)
      },
    }
  )
)
