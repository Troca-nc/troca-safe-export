'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, X } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import styles from './WelcomeToast.module.css'

const SHOW_DELAY_MS = 1500
const AUTO_CLOSE_MS = 8000
const EXIT_ANIMATION_MS = 200

type WelcomeUser = {
  id?: string | number | null
  prenom?: string | null
  first_name?: string | null
  name?: string | null
  onboarding_step?: number
}

function getDisplayName(user: WelcomeUser | null) {
  return [user?.prenom, user?.first_name, user?.name]
    .map((value) => String(value ?? '').trim())
    .find(Boolean) ?? ''
}

export default function WelcomeToast() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user) as WelcomeUser | null
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [isRendered, setIsRendered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const showTimerRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  const dismissKey = useMemo(() => `kalico_welcome_seen_${String(user?.id ?? 'guest')}`, [user?.id])
  const title = useMemo(() => {
    const firstName = getDisplayName(user)
    return firstName ? `Bienvenue ${firstName} !` : 'Bienvenue sur Kalico !'
  }, [user])

  const close = (persist = true) => {
    if (typeof window !== 'undefined' && persist) {
      window.localStorage.setItem(dismissKey, '1')
    }

    if (showTimerRef.current) window.clearTimeout(showTimerRef.current)
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)

    setIsClosing(true)
    setIsVisible(false)
    closeTimerRef.current = window.setTimeout(() => {
      setIsRendered(false)
      setIsClosing(false)
    }, EXIT_ANIMATION_MS)
  }

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user || (user.onboarding_step ?? 0) !== 0 || typeof window === 'undefined') {
      setIsRendered(false)
      setIsVisible(false)
      setIsClosing(false)
      return
    }

    if (window.localStorage.getItem(dismissKey) === '1') {
      setIsRendered(false)
      setIsVisible(false)
      setIsClosing(false)
      return
    }

    setIsClosing(false)
    showTimerRef.current = window.setTimeout(() => {
      setIsRendered(true)
      window.requestAnimationFrame(() => setIsVisible(true))
      closeTimerRef.current = window.setTimeout(() => close(true), AUTO_CLOSE_MS)
    }, SHOW_DELAY_MS)

    return () => {
      if (showTimerRef.current) window.clearTimeout(showTimerRef.current)
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissKey, hasHydrated, isAuthenticated, user?.id, user?.onboarding_step])

  if (!isRendered || !user) return null

  return (
    <aside
      className={[
        styles.toast,
        isVisible ? styles.visible : '',
        isClosing ? styles.closing : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
      role="status"
    >
      <button type="button" className={styles.closeButton} onClick={() => close(true)} aria-label="Fermer le toast">
        <X className="h-4 w-4" />
      </button>

      <p className={styles.title}>{title}</p>
      <p className={styles.subtitle}>Kalico est ï¿½ vous.</p>

      <div className={styles.actions}>
        <button
          type="button"
          className="btn-primary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm"
          onClick={() => {
            close(true)
            router.push('/annonces/nouvelle')
          }}
        >
          DÃ©poser une annonce
          <ArrowRight className="h-4 w-4" />
        </button>

        <button type="button" className={styles.linkButton} onClick={() => close(true)}>
          Explorer
        </button>
      </div>
    </aside>
  )
}
