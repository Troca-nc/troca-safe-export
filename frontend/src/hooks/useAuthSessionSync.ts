import { useEffect, useRef, useState } from 'react'

import { getStoredAccessToken } from '@/lib/tokenStorage'
import { useAuthStore } from '@/store/authStore'

export function useAuthSessionSync() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const demoProfile = useAuthStore((state) => state.demoProfile)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const refreshMe = useAuthStore((state) => state.refreshMe)

  const [authSyncing, setAuthSyncing] = useState(false)
  const lastSyncedUserIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    if (!hasHydrated) return
    if (!getStoredAccessToken()) return
    if (demoProfile) return

    const needsRefresh =
      !isAuthenticated ||
      !user ||
      user.pro_category === undefined ||
      user.tours_seen === undefined

    if (!needsRefresh) return
    if (user?.id && lastSyncedUserIdRef.current === user.id) return

    let alive = true
    if (user?.id) {
      lastSyncedUserIdRef.current = user.id
    }
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
  }, [demoProfile, hasHydrated, isAuthenticated, refreshMe, user?.id, user?.pro_category, user?.tours_seen])

  return {
    user,
    isAuthenticated,
    demoProfile,
    hasHydrated,
    authSyncing,
    authReady: hasHydrated && !authSyncing,
  }
}