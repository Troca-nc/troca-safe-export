import type { LayoutDemoProfile, LayoutHeaderData, LayoutNotificationCenter } from '@/types/layout'

const personalNotifications: LayoutNotificationCenter = {
  unread: 1,
  items: [
    {
      id: 1,
      type: 'new_message',
      title: 'Nouveau message (démo)',
      body: 'Une personne intéressée vous a écrit au sujet de votre annonce de démonstration.',
      href: '/messages',
      read: false,
      created_at: '2026-09-30T00:00:00.000Z',
    },
  ],
}

const proNotifications: LayoutNotificationCenter = {
  unread: 2,
  items: [
    {
      id: 2,
      type: 'new_message',
      title: 'Demande client (démo)',
      body: 'Une nouvelle demande attend une réponse dans votre espace professionnel de démonstration.',
      href: '/messages',
      read: false,
      created_at: '2026-09-30T00:00:00.000Z',
    },
    {
      id: 3,
      type: 'review',
      title: 'Nouvel avis (démo)',
      body: 'Un avis de démonstration a été ajouté à votre vitrine.',
      href: '/profil?tab=reviews',
      read: false,
      created_at: '2026-09-29T00:00:00.000Z',
    },
  ],
}

export function getDemoLayoutHeaderData(profile: LayoutDemoProfile): LayoutHeaderData {
  if (profile === 'pro' || profile === 'bon_plan') {
    return {
      unreadMessages: 4,
      unreadNotifications: 2,
      companyName: profile === 'pro' ? 'Atelier Kalico (démo)' : 'Kalico Bon Plan (démo)',
    }
  }

  if (profile === 'particulier') {
    return {
      unreadMessages: 2,
      unreadNotifications: 1,
      companyName: null,
    }
  }

  return { unreadMessages: 0, unreadNotifications: 0, companyName: null }
}

export function getDemoNotificationCenter(profile: LayoutDemoProfile): LayoutNotificationCenter {
  if (profile === 'pro' || profile === 'bon_plan') return proNotifications
  if (profile === 'particulier') return personalNotifications
  return { unread: 0, items: [] }
}
