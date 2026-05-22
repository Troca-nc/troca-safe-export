// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, saveTokens, clearTokens } from '@/lib/api'
import { useFavorisStore } from '@/store/favorisStore'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  prenom?: string
  nom?: string
  avatar_url: string | null
  is_verified: boolean
  is_pro: boolean
  is_admin: boolean
  rating: number
  commune_name?: string
  demo_role?: string
  pro_plan?: 'pro' | 'pro_plus'
  onboarding_step?: number
}

export type DemoProfileKey = 'visitor' | 'particulier' | 'pro' | 'bon_plan'

const REAL_AUTH_BACKUP_KEY = 'auth-store-real-backup'

const DEMO_USERS: Record<Exclude<DemoProfileKey, 'visitor'>, User> = {
  particulier: {
    id: 'demo-particulier',
    email: 'particulier@demo.troca',
    first_name: 'Emma',
    last_name: 'Martin',
    avatar_url: null,
    is_verified: true,
    is_pro: false,
    is_admin: false,
    rating: 4.8,
    commune_name: 'Nouméa',
    demo_role: 'Particulier',
  },
  pro: {
    id: 'demo-pro',
    email: 'pro@demo.troca',
    first_name: 'Atelier',
    last_name: 'Kalo',
    avatar_url: null,
    is_verified: true,
    is_pro: true,
    is_admin: false,
    rating: 4.9,
    commune_name: 'Dumbéa',
    demo_role: 'Compte Pro',
  },
  bon_plan: {
    id: 'demo-bon-plan',
    email: 'bonplan@demo.troca',
    first_name: 'Troca',
    last_name: 'Bon Plan',
    avatar_url: null,
    is_verified: true,
    is_pro: true,
    is_admin: false,
    rating: 5,
    commune_name: 'Nouméa',
    demo_role: 'Annonceur Bon Plan',
  },
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  demoProfile: DemoProfileKey | null

  login:    (email: string, password: string, turnstileToken?: string) => Promise<void>
  register: (data: object, turnstileToken?: string) => Promise<void>
  logout:   () => Promise<void>
  fetchMe:  () => Promise<void>
  refreshMe: () => Promise<void>
  setUser:  (user: User) => void
  setDemoProfile: (profile: DemoProfileKey | null) => void
}

type RealAuthBackup = {
  user: User | null
  isAuthenticated: boolean
  access_token: string | null
  refresh_token: string | null
}

function readRealAuthBackup(): RealAuthBackup | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(REAL_AUTH_BACKUP_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeRealAuthBackup(state: RealAuthBackup) {
  if (typeof window === 'undefined') return
  localStorage.setItem(REAL_AUTH_BACKUP_KEY, JSON.stringify(state))
}

function clearRealAuthBackup() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REAL_AUTH_BACKUP_KEY)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      isLoading:       false,
      isAuthenticated: false,
      demoProfile:     null,

      setDemoProfile: (profile) => {
        const currentDemo = get().demoProfile

        if (!profile) {
          const backup = readRealAuthBackup()
          if (backup) {
            if (backup.access_token && backup.refresh_token) {
              saveTokens(backup.access_token, backup.refresh_token)
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
            access_token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
            refresh_token: typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null,
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
        set({
          user: demoUser,
          isAuthenticated: true,
          demoProfile: profile,
        })
      },

      login: async (email, password, turnstileToken) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.login({ email, password }, turnstileToken)
          const { user, access_token, refresh_token } = data.data
          saveTokens(access_token, refresh_token)
          set({ user, isAuthenticated: true, demoProfile: null })
          clearRealAuthBackup()
          // Sync les favoris depuis le serveur après connexion
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
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          await authApi.logout(refreshToken).catch(() => {})
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

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        demoProfile: state.demoProfile,
      }),
    }
  )
)
