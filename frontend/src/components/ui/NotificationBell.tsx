'use client'
// ============================================================
//  Troca - Centre de notifications in-app (Header web)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, MessageCircle, Search, Clock, X, Check } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { notificationsApi } from '@/lib/api'

interface Notif {
  id: number
  type: 'new_message' | 'search_alert' | 'listing_expiring' | 'review'
  title: string
  body: string
  href: string
  read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  new_message: <MessageCircle size={15} className="text-coral" />,
  search_alert: <Search size={15} className="text-blue-500" />,
  listing_expiring: <Clock size={15} className="text-amber-500" />,
  review: <Check size={15} className="text-green-500" />,
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = 'notification-panel'

  const unread = notifs.filter((n) => !n.read).length

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await notificationsApi.getNotifications(20)
      setNotifs(data.data ?? [])
    } catch {
      // fallback silencieux si la route n'existe pas encore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifs()

    const onVisibility = () => {
      if (!document.hidden) fetchNotifs()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const interval = setInterval(() => {
      if (!document.hidden) fetchNotifs()
    }, 120_000)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchNotifs])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {}
  }

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id)
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch {}
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v)
          if (!open) fetchNotifs()
        }}
        className="relative p-2 rounded-xl text-night/50 hover:text-night hover:bg-night/5 transition-colors"
        aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          aria-label="Centre de notifications"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-night/8 z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-night/6">
            <span className="font-semibold text-sm text-night">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-[11px] text-coral hover:underline">
                  Tout marquer lu
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="text-night/30 hover:text-night" aria-label="Fermer les notifications">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading && notifs.length === 0 && (
              <div className="px-4 py-8 text-center">
                <div className="w-5 h-5 border-2 border-coral/30 border-t-coral rounded-full animate-spin mx-auto" />
              </div>
            )}

            {!loading && notifs.length === 0 && (
              <div className="px-4 py-10 text-center" aria-live="polite">
                <Bell size={32} className="text-night/15 mx-auto mb-3" />
                <p className="text-sm text-night/60">Aucune notification</p>
              </div>
            )}

            {notifs.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                role="menuitem"
                onClick={() => {
                  markRead(n.id)
                  setOpen(false)
                }}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-sand transition-colors border-b border-night/4 last:border-0 ${
                  !n.read ? 'bg-coral/3' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    !n.read ? 'bg-coral/10' : 'bg-night/5'
                  }`}
                >
                  {TYPE_ICON[n.type] ?? <Bell size={15} className="text-night/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-night' : 'text-night/70'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-night/45 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-night/30 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-coral rounded-full shrink-0 mt-1.5" />}
              </Link>
            ))}
          </div>

          <Link
            href="/parametres#notifications"
            onClick={() => setOpen(false)}
            className="block text-center py-3 text-xs text-night/40 hover:text-coral border-t border-night/6 transition-colors"
            role="menuitem"
          >
            Gérer les notifications
          </Link>
        </div>
      )}
    </div>
  )
}
