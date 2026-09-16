'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { notificationsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type NotificationItem = {
  id: string | number
  title?: string | null
  body?: string | null
  href?: string | null
  read?: boolean | null
  created_at?: string | null
}

export default function NotificationsPage() {
  const router = useRouter()
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const demoProfile = useAuthStore((state) => state.demoProfile)

  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items])

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.replace('/connexion')
      return
    }

    let alive = true

    const loadNotifications = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data } = await notificationsApi.getNotifications(100)
        const notifications = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []

        if (!alive) return
        setItems(notifications)

        if (notifications.some((item: NotificationItem) => !item.read)) {
          setMarkingAllRead(true)
          try {
            await notificationsApi.markAllRead()
            if (!alive) return
            setItems((prev) => prev.map((item) => ({ ...item, read: true })))
          } catch {
            // On garde la liste visible même si le marquage global échoue.
          } finally {
            if (alive) setMarkingAllRead(false)
          }
        }
      } catch {
        if (!alive) return
        setError('Impossible de charger vos notifications pour le moment.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void loadNotifications()

    return () => {
      alive = false
    }
  }, [hasHydrated, isAuthenticated, router])

  const handleOpen = async (item: NotificationItem) => {
    if (!item.id || item.read) return

    try {
      await notificationsApi.markRead(Number(item.id))
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)))
    } catch {
      // Pas bloquant : le clic continue vers la destination.
    }
  }

  if (!hasHydrated || (!isAuthenticated && typeof window !== 'undefined')) {
    return null
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] py-8 text-night">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-tertiary)]">
                Notifications
              </p>
              <h1 className="mt-2 text-2xl font-display font-semibold text-night">Votre centre de notifications</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Retrouvez ici les messages, alertes et rappels importants liés à votre compte.
              </p>
            </div>

            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={async () => {
                  setMarkingAllRead(true)
                  try {
                    await notificationsApi.markAllRead()
                    setItems((prev) => prev.map((item) => ({ ...item, read: true })))
                  } finally {
                    setMarkingAllRead(false)
                  }
                }}
                disabled={markingAllRead}
                className="btn-primary inline-flex items-center gap-2 self-start px-4 py-2 text-sm sm:self-auto"
              >
                {markingAllRead ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                Tout marquer comme lu
              </button>
            ) : null}
          </div>

          <div className="pt-6">
            {loading ? (
              <div className="space-y-3" aria-busy="true" aria-live="polite">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-[var(--color-border)] bg-white p-4 dark:bg-[var(--color-surface)]">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 w-32 rounded-full bg-night/10" />
                      <div className="h-4 w-5/6 rounded-full bg-night/10" />
                      <div className="h-3 w-20 rounded-full bg-night/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center dark:bg-[var(--color-surface)]">
                <Bell className="mx-auto h-10 w-10 text-[var(--color-text-tertiary)]" />
                <p className="mt-3 text-sm font-semibold text-night">{error}</p>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="btn-secondary mt-5 inline-flex items-center px-4 py-2 text-sm"
                >
                  Réessayer
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-white px-6 py-12 text-center dark:bg-[var(--color-surface)]">
                <Bell className="mx-auto h-12 w-12 text-[var(--color-text-tertiary)]" />
                <p className="mt-4 text-lg font-semibold text-night">Vous n'avez pas encore de notification.</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Les alertes, réponses et rappels liés à votre activité apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const content = (
                    <div
                      className={`flex items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 transition-colors hover:bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface)] ${
                        item.read ? '' : 'shadow-sm'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          item.read ? 'bg-[var(--color-surface-raised)]' : 'bg-[var(--color-success)]/10'
                        }`}
                      >
                        <Bell className="h-4 w-4 text-[var(--color-success)]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className={`text-sm font-semibold ${item.read ? 'text-night/75' : 'text-night'}`}>
                            {item.title || 'Notification'}
                          </h2>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                              item.read
                                ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]'
                                : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                            }`}
                          >
                            {item.read ? 'Lu' : 'Non lu'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{item.body || ''}</p>
                        <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                          {item.created_at
                            ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })
                            : ''}
                        </p>
                      </div>
                    </div>
                  )

                  if (item.href) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => void handleOpen(item)}
                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-success)]/30 focus-visible:ring-offset-2"
                      >
                        {content}
                      </Link>
                    )
                  }

                  return (
                    <div key={item.id} aria-label={item.title || 'Notification'}>
                      {content}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
