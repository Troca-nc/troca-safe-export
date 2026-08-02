'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckSquare, ChevronUp } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import styles from './OnboardingChecklist.module.css'

type ChecklistKey = 'annonce' | 'profil' | 'alerte' | 'explore'

type ChecklistState = {
  createdAt: string
  items: Record<ChecklistKey, boolean>
}

const STORAGE_PREFIX = 'kalico_checklist_'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const ITEMS: Array<{ key: ChecklistKey; label: string; href: string }> = [
  { key: 'annonce', label: 'Déposer ma première annonce', href: '/annonces/nouvelle' },
  { key: 'profil', label: 'Compléter mon profil', href: '/profil' },
  { key: 'alerte', label: 'Activer mes alertes', href: '/alertes' },
  { key: 'explore', label: 'Explorer les fonctionnalités Pro', href: '/pro' },
]

const defaultState = (): ChecklistState => ({
  createdAt: new Date().toISOString(),
  items: {
    annonce: false,
    profil: false,
    alerte: false,
    explore: false,
  },
})

function storageKey(userId?: string | number | null) {
  return `${STORAGE_PREFIX}${String(userId ?? 'guest')}`
}

function readState(key: string): ChecklistState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ChecklistState>
    if (!parsed?.createdAt || !parsed?.items) return null
    return {
      createdAt: parsed.createdAt,
      items: {
        annonce: Boolean(parsed.items.annonce),
        profil: Boolean(parsed.items.profil),
        alerte: Boolean(parsed.items.alerte),
        explore: Boolean(parsed.items.explore),
      },
    }
  } catch {
    return null
  }
}

function writeState(key: string, value: ChecklistState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export default function OnboardingChecklist() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ChecklistState | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const key = useMemo(() => storageKey(user?.id), [user?.id])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user || typeof window === 'undefined') {
      setState(null)
      setOpen(false)
      return
    }

    const existing = readState(key) ?? defaultState()
    const createdAt = new Date(existing.createdAt).getTime()
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > MAX_AGE_MS) {
      setState(null)
      setOpen(false)
      return
    }

    const nextState = {
      createdAt: existing.createdAt,
      items: {
        annonce: Boolean(existing.items.annonce),
        profil: Boolean(existing.items.profil),
        alerte: Boolean(existing.items.alerte),
        explore: Boolean(existing.items.explore),
      },
    }

    writeState(key, nextState)
    setState(nextState)
  }, [hasHydrated, isAuthenticated, key, user])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [open])

  const remainingCount = useMemo(() => {
    if (!state) return 0
    return ITEMS.filter((item) => !state.items[item.key]).length
  }, [state])

  useEffect(() => {
    if (!state || remainingCount === 0) {
      setOpen(false)
    }
  }, [remainingCount, state])

  if (!user || !state || remainingCount === 0) return null

  const toggleItem = (itemKey: ChecklistKey) => {
    const nextState = {
      ...state,
      items: {
        ...state.items,
        [itemKey]: true,
      },
    }
    setState(nextState)
    writeState(key, nextState)
  }

  return (
    <div className="fixed bottom-[80px] right-5 z-[65]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={styles.fab}
        aria-label={`Checklist onboarding - ${remainingCount} tâche${remainingCount > 1 ? 's' : ''} restante${remainingCount > 1 ? 's' : ''}`}
        aria-expanded={open}
        aria-controls="onboarding-checklist-panel"
      >
        <CheckSquare className="h-5 w-5" />
        <span className={styles.badge}>{remainingCount}</span>
      </button>

      {open ? (
        <div ref={panelRef} id="onboarding-checklist-panel" className={styles.panel} role="dialog" aria-label="Pour bien démarrer">
          <div className={styles.panelHeader}>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Pour bien démarrer</p>
            <button type="button" className={styles.panelClose} onClick={() => setOpen(false)} aria-label="Fermer la checklist">
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {ITEMS.map((item) => {
              const checked = state.items[item.key]
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => toggleItem(item.key)}
                  className={`${styles.item} ${checked ? styles.itemChecked : ''}`}
                >
                  <span className={styles.checkbox} aria-hidden="true">
                    {checked ? '☑' : '☐'}
                  </span>
                  <span className="flex-1 text-sm">{item.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
