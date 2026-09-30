export type LayoutDemoProfile = 'visitor' | 'particulier' | 'pro' | 'bon_plan' | null

export type LayoutSessionUser = {
  id?: string | number | null
  first_name?: string | null
  last_name?: string | null
  prenom?: string | null
  nom?: string | null
  avatar_url?: string | null
  is_pro?: boolean
  account_type?: 'personal' | 'professional' | null
}

export type LayoutAccount = {
  id: string | null
  firstName: string
  lastName: string
  initials: string
  avatarUrl: string | null
  isPro: boolean
}

export type LayoutHeaderData = {
  unreadMessages: number
  unreadNotifications: number
  companyName: string | null
}

export type LayoutNotification = {
  id: number
  type: 'new_message' | 'search_alert' | 'listing_expiring' | 'review' | string
  title: string
  body: string
  href: string
  read: boolean
  created_at: string
}

export type LayoutNotificationCenter = {
  items: LayoutNotification[]
  unread: number
}
