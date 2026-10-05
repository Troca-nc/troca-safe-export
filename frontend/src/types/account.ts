import type { ListingSearchItem } from '@/types/listings'

export type AccountKind = 'particulier' | 'pro' | 'bon_plan'
export type AccountSubscriptionState = 'active' | 'trialing' | 'expiring_soon' | 'expired' | 'payment_failed'

export type AccountProfile = {
  id: string
  firstName: string
  lastName: string
  displayName: string
  initials: string
  avatarUrl: string | null
  bio: string
  communeName: string
  emailVerified: boolean
  phoneVerified: boolean
  accountKind: AccountKind
  memberSince: string | null
  rating: number | null
  reviewsCount: number
}

export type AccountSubscription = {
  plan: 'free' | 'pro'
  status: AccountSubscriptionState
  daysRemaining: number | null
  periodEnd: string | null
}

export type AccountConversation = {
  id: string
  personName: string
  personAvatarUrl: string | null
  listingTitle: string
  preview: string
  unreadCount: number
  updatedAt: string
}

export type AccountAppointment = {
  id: string
  partnerName: string
  subject: string
  startsAt: string
  status: string
}

export type AccountActivity = {
  id: string
  title: string
  body: string
  href: string
  read: boolean
  createdAt: string
}

export type AccountOverviewData = {
  profile: AccountProfile
  subscription: AccountSubscription
  completion: {
    percentage: number
    missingLabels: string[]
  }
  metrics: {
    activeListings: number
    totalViews: number
    unreadMessages: number
    upcomingAppointments: number
  }
  listings: ListingSearchItem[]
  conversations: AccountConversation[]
  appointments: AccountAppointment[]
  activity: AccountActivity[]
  partialFailures: string[]
}

export type AccountSession = {
  id: string | number
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  prenom?: string | null
  nom?: string | null
  avatar_url?: string | null
  telephone?: string | null
  phone_verified?: boolean
  is_verified?: boolean
  is_pro?: boolean
  commune_name?: string | null
  demo_role?: string | null
}
