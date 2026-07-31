'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import styles from './OnboardingToast.module.css'

type OnboardingFeature = {
  key: string
  title: string
  description: string
  href: string
  cta: string
}

const STORAGE_KEY = 'kalico_onboarding_seen'
const SESSION_KEY = 'kalico_onboarding_seen_session'
const SHOW_DELAY_MS = 2000
const EXIT_ANIMATION_MS = 300

const FEATURES: OnboardingFeature[] = [
  {
    key: 'listing_first_post',
    title: 'Déposez votre première annonce',
    description: 'Publiez en quelques minutes et touchez des acheteurs locaux.',
    href: '/deposer',
    cta: 'Déposer une annonce',
  },
  {
    key: 'search_alerts',
    title: 'Activez les alertes de recherche',
    description: 'Recevez une alerte dès qu’une annonce correspond à ce que vous cherchez.',
    href: '/alertes',
    cta: 'Créer une alerte',
  },
  {
    key: 'discover_pros',
    title: 'Découvrez les pros locaux',
    description: 'Comparez des professionnels vérifiés près de chez vous.',
    href: '/pros',
    cta: 'Voir les pros',
  },
  {
    key: 'covoiturage_offer',
    title: 'Proposez un trajet en covoiturage',
    description: 'Publiez un trajet et remplissez vos places en quelques clics.',
    href: '/covoiturage',
    cta: 'Proposer un trajet',
  },
]

function readSeenFeatures(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writeSeenFeatures(next: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(next))))
}

export default function OnboardingToast() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [seenFeatures, setSeenFeatures] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isRendered, setIsRendered] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user || typeof window === 'undefined') {
      setSeenFeatures([])
      return
    }

    setSeenFeatures(readSeenFeatures())
  }, [hasHydrated, isAuthenticated, user])

  const nextFeature = useMemo(() => {
    if (!hasHydrated || !isAuthenticated || !user) return null
    return FEATURES.find((feature) => !seenFeatures.includes(feature.key)) ?? null
  }, [hasHydrated, isAuthenticated, user, seenFeatures])

  useEffect(() => {
    if (!nextFeature || typeof window === 'undefined') {
      setIsVisible(false)
      setIsRendered(false)
      return
    }

    if (window.sessionStorage.getItem(SESSION_KEY) === '1') {
      setIsVisible(false)
      setIsRendered(false)
      return
    }

    setIsClosing(false)
    const timer = window.setTimeout(() => {
      setIsRendered(true)
      window.requestAnimationFrame(() => setIsVisible(true))
    }, SHOW_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [nextFeature?.key])

  const dismissFeature = () => {
    if (!nextFeature || typeof window === 'undefined') return

    const nextSeen = Array.from(new Set([...seenFeatures, nextFeature.key]))
    setSeenFeatures(nextSeen)
    writeSeenFeatures(nextSeen)
    window.sessionStorage.setItem(SESSION_KEY, '1')

    setIsClosing(true)
    setIsVisible(false)
    window.setTimeout(() => {
      setIsRendered(false)
      setIsClosing(false)
    }, EXIT_ANIMATION_MS)
  }

  if (!nextFeature || !isRendered) {
    return null
  }

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
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Sparkles className="h-4 w-4" />
        </span>
        <button type="button" className={styles.closeButton} onClick={dismissFeature} aria-label="Fermer le conseil">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={styles.content}>
        <p className={styles.title}>{nextFeature.title}</p>
        <p className={styles.description}>{nextFeature.description}</p>
        <Link href={nextFeature.href} className={styles.cta} onClick={dismissFeature}>
          {nextFeature.cta}
        </Link>
      </div>
    </aside>
  )
}
