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
  const lastRefreshAttemptKeyRef = useRef<string | null>(null)
  const refreshMeRef = useRef(refreshMe)
  const demoProfileRef = useRef(demoProfile)
  const userSnapshotRef = useRef({
    id: user?.id ?? null,
    pro_category: user?.pro_category,
    tours_seen: user?.tours_seen,
  })

  useEffect(() => {
    refreshMeRef.current = refreshMe
  }, [refreshMe])

  useEffect(() => {
    demoProfileRef.current = demoProfile
  }, [demoProfile])

  useEffect(() => {
    userSnapshotRef.current = {
      id: user?.id ?? null,
      pro_category: user?.pro_category,
      tours_seen: user?.tours_seen,
    }
  }, [user?.id, user?.pro_category, user?.tours_seen])

  useEffect(() => {
    if (!hasHydrated) return
    if (!getStoredAccessToken()) return
    if (demoProfileRef.current) return

    const currentUser = userSnapshotRef.current
    const refreshAttemptKey = [
      hasHydrated ? 'hydrated' : 'not-hydrated',
      isAuthenticated ? 'auth' : 'guest',
      currentUser.id ?? 'no-user',
      currentUser.pro_category ?? 'no-pro-category',
      currentUser.tours_seen === undefined ? 'no-tours-seen' : 'tours-seen',
    ].join(':')
    const needsRefresh =
      !isAuthenticated ||
      !currentUser.id ||
      currentUser.pro_category === undefined ||
      currentUser.tours_seen === undefined

    if (!needsRefresh) return
    if (lastRefreshAttemptKeyRef.current === refreshAttemptKey) return
    if (currentUser.id && lastSyncedUserIdRef.current === currentUser.id) return

    let alive = true
    lastRefreshAttemptKeyRef.current = refreshAttemptKey
    if (currentUser.id) {
      lastSyncedUserIdRef.current = currentUser.id
    }
    setAuthSyncing(true)

    refreshMeRef.current()
      .catch(() => {})
      .finally(() => {
        if (alive) {
          setAuthSyncing(false)
        }
      })

    return () => {
      alive = false
    }
  }, [hasHydrated, isAuthenticated, user?.id])

  return {
    user,
    isAuthenticated,
    demoProfile,
    hasHydrated,
    authSyncing,
    authReady: hasHydrated && !authSyncing,
  }
}
