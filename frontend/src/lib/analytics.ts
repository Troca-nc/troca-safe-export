'use client'

import { api } from '@/lib/api'

const CONSENT_KEY = 'troca-cookie-consent'
const SESSION_KEY = 'troca-analytics-session'

type ConsentState = {
  analytics?: boolean
}

type TrackPayload = {
  event_name: string
  page_path: string
  referrer?: string | null
  device_type?: 'web' | 'mobile' | 'tablet' | 'unknown'
  session_id?: string
  metadata?: Record<string, string | number | boolean | null | undefined>
}

function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ConsentState
  } catch {
    return null
  }
}

function hasAnalyticsConsent(): boolean {
  return !!readConsent()?.analytics
}

function getOrCreateSessionId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    if (!hasAnalyticsConsent()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `aid_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    localStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return null
  }
}

function getDeviceType(): 'web' | 'mobile' | 'tablet' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown'
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'web'
}

export function refreshAnalyticsSession() {
  if (typeof window === 'undefined') return
  if (!hasAnalyticsConsent()) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  getOrCreateSessionId()
}

export async function trackEvent(
  eventName: string,
  metadata: Record<string, string | number | boolean | null | undefined> = {},
) {
  if (typeof window === 'undefined') return false
  if (!hasAnalyticsConsent()) return false

  const payload: TrackPayload = {
    event_name: eventName,
    page_path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    device_type: getDeviceType(),
    session_id: getOrCreateSessionId() ?? undefined,
    metadata,
  }

  try {
    const response = await api.post('/analytics/events', {
      ...payload,
      consent_analytics: true,
    })
    return response.status >= 200 && response.status < 300
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[analytics] impossible d’enregistrer l’événement')
    }
    return false
  }
}

export async function trackPageView(metadata: Record<string, string | number | boolean | null | undefined> = {}) {
  return trackEvent('page_view', metadata)
}
