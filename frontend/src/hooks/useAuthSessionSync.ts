import { useAuthStore } from '@/store/authStore'

export function useAuthSessionSync() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const demoProfile = useAuthStore((state) => state.demoProfile)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)

  return {
    user,
    isAuthenticated,
    demoProfile,
    hasHydrated,
    authSyncing: sessionStatus === 'recovering',
    authReady: hasHydrated,
  }
}
