import { useEffect, useState } from 'react'

import { getStoredAccessToken } from '@/lib/tokenStorage'
import { useAuthStore } from '@/store/authStore'

export function useAuthSessionSync() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const demoProfile = useAuthStore((state) => state.demoProfile)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const refreshMe = useAuthStore((state) => state.refreshMe)

  const [authSyncing, setAuthSyncing] = useState(false)

  useEffect(() => {
    if (!hasHydrated) return
    if (demoProfile || isAuthenticated) return
    if (!getStoredAccessToken()) return

    let alive = true
    setAuthSyncing(true)

    refreshMe()
      .catch(() => {})
      .finally(() => {
        if (alive) {
          setAuthSyncing(false)
        }
      })

    return () => {
      alive = false
    }
  }, [demoProfile, hasHydrated, isAuthenticated, refreshMe])

  return {
    user,
    isAuthenticated,
    demoProfile,
    hasHydrated,
    authSyncing,
    authReady: hasHydrated && !authSyncing,
  }
}
