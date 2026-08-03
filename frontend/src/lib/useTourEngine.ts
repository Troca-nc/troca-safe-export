// lib/useTourEngine.ts
//
// G�re : quel tour afficher, � quelle �tape, et la persistance de ce qui a
// d�j� �t� vu. La persistance est scopp�e par type de compte afin que les
// parcours Particulier et Pro restent ind�pendants.

import { useCallback, useEffect, useMemo, useState } from 'react'

import { normalizeApiBase } from '@/lib/apiBase'
import { getStoredAccessToken } from '@/lib/tokenStorage'

import { CATEGORY_TO_TOUR, PARTICULIER_TOUR_ORDER, PRO_TOUR_ORDER, TOURS } from './tours.config'

const STORAGE_KEY_PREFIX = 'kalico_tours_seen'
const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'https://kalico-nc.com/api')

export type TourAccountType = 'particulier' | 'pro'

function getStorageKey(accountType: TourAccountType) {
  return `${STORAGE_KEY_PREFIX}:${accountType}`
}

function scopedTourKey(accountType: TourAccountType, tourKey: string) {
  return `${accountType}:${tourKey}`
}

function normalizeSeenEntry(accountType: TourAccountType, entry: string) {
  const trimmed = String(entry || '').trim()
  if (!trimmed) return ''
  if (trimmed.includes(':')) return trimmed
  return scopedTourKey(accountType, trimmed)
}

function getSeenToursLocal(accountType: TourAccountType): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getStorageKey(accountType))
    const values = JSON.parse(raw || '[]')
    return Array.isArray(values) ? values.map((value) => normalizeSeenEntry(accountType, String(value))) : []
  } catch {
    return []
  }
}

function setSeenToursLocal(accountType: TourAccountType, seen: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getStorageKey(accountType), JSON.stringify(seen))
}

async function syncSeenToBackend(tourKey: string) {
  if (typeof window === 'undefined') return

  const accessToken = getStoredAccessToken()
  if (!accessToken) return

  try {
    await fetch(`${API_BASE}/users/me/tours-seen`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ tourKey }),
    })
  } catch {
    // �chec silencieux : localStorage reste la source de secours.
  }
}

type UseTourEngineOptions = {
  accountType?: TourAccountType
  proCategory?: string
  seenFromBackend?: string[]
  delayMs?: number
}

function resolvePreferredTour(proCategory?: string) {
  if (!proCategory) return undefined
  return CATEGORY_TO_TOUR[proCategory] ?? CATEGORY_TO_TOUR[proCategory.trim()]
}

function getOrder(accountType: TourAccountType, preferredFirst?: string) {
  const baseOrder = accountType === 'pro' ? PRO_TOUR_ORDER : PARTICULIER_TOUR_ORDER
  if (!preferredFirst || !baseOrder.includes(preferredFirst)) return baseOrder
  return [preferredFirst, ...baseOrder.filter((key) => key !== preferredFirst)]
}

export function useTourEngine({
  accountType = 'particulier',
  proCategory,
  seenFromBackend = [],
  delayMs = 600,
}: UseTourEngineOptions = {}) {
  const [activeTourKey, setActiveTourKey] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const preferredFirst = useMemo(
    () => (accountType === 'pro' ? resolvePreferredTour(proCategory) : undefined),
    [accountType, proCategory]
  )

  useEffect(() => {
    const localSeen = getSeenToursLocal(accountType)
    const backendSeen = (seenFromBackend || []).map((entry) => normalizeSeenEntry(accountType, entry))
    const seen = Array.from(new Set([...localSeen, ...backendSeen]))

    const order = getOrder(accountType, preferredFirst)
    const nextKey = order.find((key) => !seen.includes(scopedTourKey(accountType, key))) ?? null

    if (!nextKey) return

    const timer = window.setTimeout(() => {
      setActiveTourKey(nextKey)
      setStepIndex(0)
      setIsOpen(true)
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [accountType, delayMs, preferredFirst, seenFromBackend])

  const markSeenAndClose = useCallback(() => {
    if (activeTourKey) {
      const key = scopedTourKey(accountType, activeTourKey)
      const seen = getSeenToursLocal(accountType)
      if (!seen.includes(key)) {
        setSeenToursLocal(accountType, [...seen, key])
        void syncSeenToBackend(key)
      }
    }

    setIsOpen(false)
  }, [accountType, activeTourKey])

  const goNext = useCallback(() => {
    if (!activeTourKey) return

    const tour = TOURS[activeTourKey]
    if (stepIndex < tour.steps.length - 1) {
      setStepIndex((current) => current + 1)
      return
    }

    markSeenAndClose()
  }, [activeTourKey, markSeenAndClose, stepIndex])

  const skip = useCallback(() => {
    markSeenAndClose()
  }, [markSeenAndClose])

  const tour = activeTourKey ? TOURS[activeTourKey] : null
  const step = tour ? tour.steps[stepIndex] : null

  return {
    isOpen,
    tour,
    step,
    stepIndex,
    totalSteps: tour?.steps.length ?? 0,
    goNext,
    skip,
  }
}
