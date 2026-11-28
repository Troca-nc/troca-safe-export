'use client'

import { useEffect, useRef, useState } from 'react'

import { sessionCoordinator, type SessionSnapshot } from '@/lib/sessionCoordinator'
import { purgeLegacyStoredTokens } from '@/lib/tokenStorage'
import { clearApiCache } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export function SessionBootstrap() {
  const [showRecoveryNotice, setShowRecoveryNotice] = useState(false)
  const fetchingUserRef = useRef(false)
  const userRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userRetryAttemptRef = useRef(0)

  useEffect(() => {
    purgeLegacyStoredTokens()
    const loadUser = () => {
      const state = useAuthStore.getState()
      if (state.demoProfile || state.user || fetchingUserRef.current) return
      state.setSessionStatus('recovering')
      fetchingUserRef.current = true
      void state.fetchMe()
        .then(() => {
          userRetryAttemptRef.current = 0
        })
        .catch(() => {
          if (sessionCoordinator.getSnapshot().status !== 'authenticated') return
          const base = Math.min(1_000 * 2 ** userRetryAttemptRef.current, 60_000)
          const delay = base + Math.floor(base * (0.2 + Math.random() * 0.3))
          userRetryAttemptRef.current += 1
          userRetryRef.current = setTimeout(loadUser, delay)
        })
        .finally(() => {
          fetchingUserRef.current = false
        })
    }

    const unsubscribe = sessionCoordinator.subscribe((snapshot: SessionSnapshot) => {
      const state = useAuthStore.getState()
      if (state.demoProfile) return

      state.setSessionStatus(snapshot.status)

      if (snapshot.status === 'visitor') {
        clearApiCache()
        state.resetAuthState()
        return
      }

      if (snapshot.status === 'authenticated' && !state.user) loadUser()
    })

    if (!useAuthStore.getState().demoProfile) {
      void sessionCoordinator.bootstrap()
    }

    return () => {
      unsubscribe()
      if (userRetryRef.current) clearTimeout(userRetryRef.current)
    }
  }, [])

  const status = useAuthStore((state) => state.sessionStatus)
  useEffect(() => {
    document.documentElement.dataset.sessionStatus = status
  }, [status])

  useEffect(() => {
    if (status !== 'recovering') {
      setShowRecoveryNotice(false)
      return
    }
    const timer = setTimeout(() => setShowRecoveryNotice(true), 5_000)
    return () => clearTimeout(timer)
  }, [status])

  if (!showRecoveryNotice || status !== 'recovering') return null

  return (
    <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-control border border-warm-border bg-cream-surface px-4 py-3 text-body-sm text-ink shadow-card" role="status">
      Reconnexion en cours. Vos données restent disponibles.
    </div>
  )
}
