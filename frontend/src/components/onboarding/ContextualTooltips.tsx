'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { useAuthStore } from '@/store/authStore'
import styles from './ContextualTooltips.module.css'

type TooltipKey = 'search' | 'deposit' | 'messages'

type TooltipState = {
  key: TooltipKey
  text: string
  left: number
  top: number
}

const STORAGE_KEYS: Record<TooltipKey, string> = {
  search: 'kalico_tooltip_search_seen',
  deposit: 'kalico_tooltip_deposit_seen',
  messages: 'kalico_tooltip_messages_seen',
}

const TOOLTIP_TEXTS: Record<TooltipKey, string> = {
  search: 'Cherchez par commune, cat�gorie ou mot-cl�',
  deposit: "Publiez en 2 minutes, c'est gratuit",
  messages: 'Vos conversations avec acheteurs et vendeurs',
}

const AUTO_DISMISS_MS = 3000

function readSeen(key: TooltipKey) {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEYS[key]) === '1'
  } catch {
    return false
  }
}

function markSeen(key: TooltipKey) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEYS[key], '1')
  } catch {
    // Ignore storage failures.
  }
}

function isVisibleElement(element: Element | null): element is HTMLElement {
  if (!element || !(element instanceof HTMLElement)) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function getTextMatch(element: Element | null) {
  if (!(element instanceof HTMLElement)) return ''
  return element.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function findSearchTarget() {
  if (typeof document === 'undefined') return null
  return document.querySelector<HTMLElement>("input[placeholder*='Rechercher' i], input[placeholder*='rechercher' i]")
}

function findDepositTarget() {
  if (typeof document === 'undefined') return null
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('button, a'))
  return candidates.find((element) => {
    const text = getTextMatch(element)
    return isVisibleElement(element) && (text === 'Déposer' || text.includes('Déposer'))
  }) ?? null
}

function findMessagesTarget() {
  if (typeof document === 'undefined') return null
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("a[href='/messages'], button[aria-label*='messages' i], a[aria-label*='messages' i]"))
  return candidates.find((element) => isVisibleElement(element)) ?? null
}

function findTarget(key: TooltipKey) {
  if (key === 'search') return findSearchTarget()
  if (key === 'deposit') return findDepositTarget()
  return findMessagesTarget()
}

export default function ContextualTooltips() {
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const timerRef = useRef<number | null>(null)

  const onboardingStep = user?.onboarding_step ?? 0
  const eligible = useMemo(() => Boolean(hasHydrated && user && onboardingStep < 3), [hasHydrated, onboardingStep, user])

  const hideTooltip = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setTooltip(null)
  }

  useEffect(() => {
    if (!eligible || typeof window === 'undefined') {
      hideTooltip()
      return
    }

    const handleDismiss = () => hideTooltip()
    const handleHoverOrFocus = (event: Event) => {
      if (tooltip) return

      const target = event.target as HTMLElement | null
      if (!target) return

      const keys: TooltipKey[] = ['search', 'deposit', 'messages']
      const nextKey = keys.find((key) => {
        if (readSeen(key)) return false

        const element = findTarget(key)
        if (!element) return false

        if (key === 'search' || key === 'messages') {
          return target === element || element.contains(target)
        }

        const text = getTextMatch(element)
        return (text === 'Déposer' || text.includes('Déposer')) && (target === element || element.contains(target))
      })

      if (!nextKey) return

      const element = findTarget(nextKey)
      if (!element) return

      const rect = element.getBoundingClientRect()
      const width = 200
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
      const top = Math.max(12, rect.bottom + 10)

      markSeen(nextKey)
      setTooltip({
        key: nextKey,
        text: TOOLTIP_TEXTS[nextKey],
        left,
        top,
      })

      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setTooltip(null), AUTO_DISMISS_MS)
    }

    document.addEventListener('focusin', handleHoverOrFocus, true)
    document.addEventListener('pointerover', handleHoverOrFocus, true)
    document.addEventListener('pointerdown', handleDismiss, true)

    return () => {
      document.removeEventListener('focusin', handleHoverOrFocus, true)
      document.removeEventListener('pointerover', handleHoverOrFocus, true)
      document.removeEventListener('pointerdown', handleDismiss, true)
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, tooltip])

  if (!eligible || !tooltip) return null

  return (
    <div
      className={styles.tooltip}
      style={{
        left: `${tooltip.left}px`,
        top: `${tooltip.top}px`,
      }}
      role="tooltip"
      aria-live="polite"
    >
      {tooltip.text}
      <span className={styles.arrow} aria-hidden="true" />
    </div>
  )
}
