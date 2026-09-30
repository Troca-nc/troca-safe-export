'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, Clock, MessageCircle, Search, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import {
  getLayoutNotifications,
  markAllLayoutNotificationsRead,
  markLayoutNotificationRead,
} from '@/lib/data/layout'
import { useAuthStore } from '@/store/authStore'
import type { LayoutNotification } from '@/types/layout'

const TYPE_ICON = {
  new_message: MessageCircle,
  search_alert: Search,
  listing_expiring: Clock,
  review: Check,
} as const

export default function HeaderNotifications({
  initialUnread = 0,
  onUnreadChange,
}: {
  initialUnread?: number
  onUnreadChange?: (count: number) => void
}) {
  const demoProfile = useAuthStore((state) => state.demoProfile)
  const [notifs, setNotifs] = useState<LayoutNotification[]>([])
  const [unread, setUnread] = useState(initialUnread)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = 'header-notification-panel'

  useEffect(() => setUnread(initialUnread), [initialUnread])

  const updateUnread = useCallback((count: number) => {
    setUnread(count)
    onUnreadChange?.(count)
  }, [onUnreadChange])

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const center = await getLayoutNotifications(20, demoProfile)
      setNotifs(center.items)
      updateUnread(center.unread)
    } catch {
      setError('Notifications temporairement indisponibles.')
    } finally {
      setLoading(false)
    }
  }, [demoProfile, updateUnread])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const markAllRead = async () => {
    try {
      await markAllLayoutNotificationsRead(Boolean(demoProfile))
      setNotifs((current) => current.map((notification) => ({ ...notification, read: true })))
      updateUnread(0)
    } catch {
      setError('Impossible de marquer les notifications comme lues.')
    }
  }

  const markRead = async (notification: LayoutNotification) => {
    if (notification.read) return
    try {
      await markLayoutNotificationRead(notification.id, Boolean(demoProfile))
      setNotifs((current) => current.map((item) => (
        item.id === notification.id ? { ...item, read: true } : item
      )))
      updateUnread(Math.max(0, unread - 1))
    } catch {
      setError('Impossible de marquer cette notification comme lue.')
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open
          setOpen(nextOpen)
          if (nextOpen) void fetchNotifs()
        }}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-control text-ink transition-colors hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
        aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        {unread > 0 ? <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-pill border-2 border-cream bg-accent-strong" /> : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="menu"
          aria-label="Centre de notifications"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-block border border-warm-border bg-cream-surface shadow-modal"
        >
          <div className="flex min-h-12 items-center justify-between gap-3 border-b border-warm-border px-4 py-3">
            <span className="text-label text-ink">Notifications</span>
            <div className="flex items-center gap-1">
              {unread > 0 ? (
                <button type="button" onClick={() => void markAllRead()} className="min-h-11 rounded-control px-2 text-caption text-accent-text hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong">
                  Tout lire
                </button>
              ) : null}
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-control text-ink hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong" aria-label="Fermer les notifications">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading && notifs.length === 0 ? (
              <div className="flex flex-col gap-3 px-4 py-6" role="status">
                <span className="sr-only">Chargement des notifications</span>
                <span className="h-12 animate-pulse rounded-card bg-cream-sunken motion-reduce:animate-none" />
                <span className="h-12 animate-pulse rounded-card bg-cream-sunken motion-reduce:animate-none" />
              </div>
            ) : null}

            {error ? (
              <div className="m-4 rounded-card border border-[var(--color-error)] bg-[var(--color-error-soft)] p-4 text-body-sm text-[var(--color-error)]" role="alert">
                <p>{error}</p>
                <button type="button" onClick={() => void fetchNotifs()} className="mt-3 min-h-11 rounded-control border border-[var(--color-error)] px-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong">
                  Réessayer
                </button>
              </div>
            ) : null}

            {!loading && !error && notifs.length === 0 ? (
              <div className="px-4 py-10 text-center" aria-live="polite">
                <Bell className="mx-auto mb-3 h-8 w-8 text-ink/30" aria-hidden="true" />
                <p className="text-body-sm text-ink/70">Aucune notification</p>
              </div>
            ) : null}

            {!error ? notifs.map((notification) => {
              const Icon = TYPE_ICON[notification.type as keyof typeof TYPE_ICON] ?? Bell
              return (
                <Link
                  key={notification.id}
                  href={notification.href || '/notifications'}
                  role="menuitem"
                  onClick={() => {
                    void markRead(notification)
                    setOpen(false)
                  }}
                  className="flex min-h-11 items-start gap-3 border-b border-warm-border px-4 py-3 text-ink transition-colors last:border-0 hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-accent-strong"
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-cream-sunken text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-body-sm ${notification.read ? 'font-normal' : 'font-semibold'}`}>{notification.title}</span>
                    <span className="mt-1 block text-caption text-ink/70">{notification.body}</span>
                    <span className="mt-1 block text-caption text-ink/55">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}</span>
                  </span>
                  {!notification.read ? <span className="mt-2 h-2 w-2 shrink-0 rounded-pill bg-accent-strong" /> : null}
                </Link>
              )
            }) : null}
          </div>

          <Link href="/notifications" onClick={() => setOpen(false)} className="block min-h-11 border-t border-warm-border px-4 py-3 text-center text-caption text-accent-text hover:bg-cream-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-accent-strong" role="menuitem">
            Voir toutes les notifications
          </Link>
        </div>
      ) : null}
    </div>
  )
}
