'use client'

import { create } from 'zustand'

export type NotifType = 'message' | 'offer' | 'offer_resp' | 'alert' | 'sold' | 'review' | 'system'

export interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

export const NOTIF_ICONS: Record<NotifType, string> = {
  message: 'message',
  offer: 'offer',
  offer_resp: 'offer_resp',
  alert: 'alert',
  sold: 'sold',
  review: 'review',
  system: 'system',
}

interface NotificationsState {
  items: Notification[]
  unreadCount: number
  loading: boolean
  fetch: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  remove: (id: string) => void
  addLocal: (notif: Omit<Notification, 'id' | 'read' | 'created_at'>) => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  fetch: async () => undefined,
  markRead: async (id) =>
    set((state) => {
      const items = state.items.map((item) => (item.id === id ? { ...item, read: true } : item))
      return { items, unreadCount: items.filter((item) => !item.read).length }
    }),
  markAllRead: async () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
      unreadCount: 0,
    })),
  remove: (id) =>
    set((state) => {
      const items = state.items.filter((item) => item.id !== id)
      return { items, unreadCount: items.filter((item) => !item.read).length }
    }),
  addLocal: (notif) =>
    set((state) => {
      const item: Notification = {
        ...notif,
        id: `local-${Date.now()}`,
        read: false,
        created_at: new Date().toISOString(),
      }
      const items = [item, ...state.items]
      return { items, unreadCount: items.filter((entry) => !entry.read).length }
    }),
}))
