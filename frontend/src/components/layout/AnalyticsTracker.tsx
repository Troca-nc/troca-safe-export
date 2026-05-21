'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { refreshAnalyticsSession, trackPageView } from '@/lib/analytics'

const CONSENT_EVENT = 'troca-cookie-consent-changed'

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const lastPathRef = useRef('')

  useEffect(() => {
    const handleConsentChange = () => {
      refreshAnalyticsSession()
      void trackPageView({ source: 'consent_update' })
    }

    window.addEventListener(CONSENT_EVENT, handleConsentChange)
    return () => {
      window.removeEventListener(CONSENT_EVENT, handleConsentChange)
    }
  }, [])

  useEffect(() => {
    if (!pathname) return
    if (lastPathRef.current === pathname) return
    lastPathRef.current = pathname
    void trackPageView({ route: pathname })
  }, [pathname])

  return null
}
