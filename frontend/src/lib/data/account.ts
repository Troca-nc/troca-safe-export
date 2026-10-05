import {
  messagesApi,
  notificationsApi,
  proBookingsApi,
  statsApi,
  subscriptionsApi,
  usersApi,
} from '@/lib/api'
import { DEMO } from '@/lib/demo'
import type {
  AccountActivity,
  AccountAppointment,
  AccountConversation,
  AccountKind,
  AccountOverviewData,
  AccountProfile,
  AccountSession,
  AccountSubscription,
  AccountSubscriptionState,
} from '@/types/account'
import type { ListingSearchItem } from '@/types/listings'

type UnknownRecord = Record<string, unknown>

function record(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {}
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function nullableNumber(value: unknown) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function iso(value: unknown) {
  const raw = text(value)
  return raw && !Number.isNaN(new Date(raw).getTime()) ? raw : new Date(0).toISOString()
}

function accountKind(session: AccountSession): AccountKind {
  const role = text(session.demo_role).toLocaleLowerCase('fr-FR')
  if (role.includes('bon plan')) return 'bon_plan'
  return session.is_pro ? 'pro' : 'particulier'
}

function normalizeProfile(rawValue: unknown, session: AccountSession): AccountProfile {
  const raw = record(rawValue)
  const firstName = text(raw.prenom) || text(raw.first_name) || text(session.prenom) || text(session.first_name)
  const lastName = text(raw.nom) || text(raw.last_name) || text(session.nom) || text(session.last_name)
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Mon compte'
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toLocaleUpperCase('fr-FR') || 'K'

  return {
    id: String(raw.id ?? session.id),
    firstName,
    lastName,
    displayName,
    initials,
    avatarUrl: text(raw.avatar_url) || text(session.avatar_url) || null,
    bio: text(raw.bio),
    communeName: text(raw.commune_name) || text(session.commune_name),
    emailVerified: Boolean(raw.email_verified ?? session.is_verified),
    phoneVerified: Boolean(raw.phone_verified ?? session.phone_verified),
    accountKind: accountKind(session),
    memberSince: text(raw.member_since) || text(raw.created_at) || null,
    rating: nullableNumber(raw.note_moyenne ?? raw.rating),
    reviewsCount: number(raw.nb_avis ?? raw.reviews_count),
  }
}

function normalizeListing(value: unknown): ListingSearchItem {
  const item = record(value)
  const price = nullableNumber(item.price ?? item.prix)
  return {
    id: String(item.id ?? ''),
    title: text(item.title) || text(item.titre) || 'Annonce',
    price,
    price_negotiable: Boolean(item.price_negotiable ?? item.is_negotiable),
    is_free: Boolean(item.is_free) || price == null,
    condition: text(item.condition) || undefined,
    is_featured: Boolean(item.is_featured),
    is_urgent: Boolean(item.is_urgent),
    created_at: text(item.created_at) || undefined,
    published_at: text(item.published_at) || undefined,
    boosted_until: text(item.boosted_until) || null,
    commune_name: text(item.commune_name) || undefined,
    category_name: text(item.category_name) || undefined,
    cover_image: text(item.cover_image) || undefined,
    metadata: record(item.metadata),
    seller_prenom: text(item.seller_prenom) || null,
    seller_nom: text(item.seller_nom) || null,
    seller_avatar: text(item.seller_avatar) || null,
    seller_is_pro: Boolean(item.seller_is_pro ?? item.is_pro),
    seller_pro_verified: Boolean(item.seller_pro_verified),
  }
}

function messagePreview(messageValue: unknown) {
  const message = record(messageValue)
  const type = text(message.type)
  if (type === 'photo') return 'Photo partagée'
  if (type === 'audio') return 'Message vocal'
  if (type === 'document') return text(message.attachment_name) || 'Document partagé'
  if (type === 'offer') return 'Offre de prix'
  return text(message.content) || 'Nouvelle conversation'
}

function normalizeConversation(value: unknown): AccountConversation {
  const item = record(value)
  const person = record(item.other_user)
  const listing = record(item.annonce)
  const lastMessage = record(item.last_message)
  const personName = [text(person.prenom), text(person.nom)].filter(Boolean).join(' ') || 'Membre Kalico'
  return {
    id: String(item.id ?? ''),
    personName,
    personAvatarUrl: text(person.avatar_url) || null,
    listingTitle: text(listing.titre) || 'Annonce',
    preview: messagePreview(lastMessage),
    unreadCount: number(item.unread_count),
    updatedAt: iso(lastMessage.created_at ?? item.updated_at ?? item.created_at),
  }
}

function normalizeAppointment(value: unknown): AccountAppointment {
  const item = record(value)
  const pro = record(item.pro)
  const requester = record(item.requester)
  const role = text(item.role)
  const partnerName = role === 'client'
    ? text(pro.display_name) || text(pro.pro_company_name) || 'Professionnel'
    : [text(requester.prenom), text(requester.nom)].filter(Boolean).join(' ') || text(item.requester_name) || 'Client'
  return {
    id: String(item.id ?? ''),
    partnerName,
    subject: text(item.subject) || text(item.service_title) || 'Rendez-vous',
    startsAt: iso(item.starts_at),
    status: text(item.status) || 'pending',
  }
}

function normalizeActivity(value: unknown): AccountActivity {
  const item = record(value)
  return {
    id: String(item.id ?? ''),
    title: text(item.title) || 'Activité Kalico',
    body: text(item.body),
    href: text(item.href) || '/profil',
    read: Boolean(item.read),
    createdAt: iso(item.created_at),
  }
}

function normalizeSubscription(value: unknown): AccountSubscription {
  const item = record(value)
  const rawStatus = text(item.status) as AccountSubscriptionState
  const allowed: AccountSubscriptionState[] = ['active', 'trialing', 'expiring_soon', 'expired', 'payment_failed']
  return {
    plan: item.plan === 'pro' ? 'pro' : 'free',
    status: allowed.includes(rawStatus) ? rawStatus : 'active',
    daysRemaining: nullableNumber(item.days_remaining),
    periodEnd: text(item.current_period_end) || null,
  }
}

function computeCompletion(profile: AccountProfile) {
  const fields = [
    { complete: Boolean(profile.firstName), label: 'prénom' },
    { complete: Boolean(profile.lastName), label: 'nom' },
    { complete: Boolean(profile.avatarUrl), label: 'photo de profil' },
    { complete: Boolean(profile.bio), label: 'présentation' },
    { complete: Boolean(profile.communeName), label: 'commune' },
    { complete: profile.phoneVerified, label: 'téléphone vérifié' },
  ]
  const completeCount = fields.filter((field) => field.complete).length
  return {
    percentage: Math.round((completeCount / fields.length) * 100),
    missingLabels: fields.filter((field) => !field.complete).map((field) => field.label),
  }
}

export async function getAccountOverview({
  session,
  demoKind,
  demoSubscription,
}: {
  session: AccountSession
  demoKind?: AccountKind | null
  demoSubscription?: AccountSubscriptionState | null
}): Promise<AccountOverviewData> {
  if (DEMO || demoKind) {
    const { getDemoAccountOverview } = await import('@/demo/fixtures/account')
    return getDemoAccountOverview(demoKind ?? accountKind(session), demoSubscription ?? 'active')
  }

  const profileResponse = await usersApi.getProfile(String(session.id))
  const profile = normalizeProfile(profileResponse.data?.data, session)
  const results = await Promise.allSettled([
    usersApi.getUserListings(String(session.id), { limit: 4 }),
    statsApi.getSeller(),
    messagesApi.getConversations(),
    proBookingsApi.getMine(),
    notificationsApi.getNotifications(4),
    subscriptionsApi.getStatus(),
  ])
  const failures: string[] = []
  const value = (index: number, label: string) => {
    const result = results[index]
    if (result.status === 'fulfilled') return result.value
    failures.push(label)
    return null
  }

  const listingsResponse = value(0, 'annonces')
  const statsResponse = value(1, 'statistiques')
  const messagesResponse = value(2, 'messages')
  const bookingsResponse = value(3, 'rendez-vous')
  const notificationsResponse = value(4, 'activité')
  const subscriptionResponse = value(5, 'abonnement')

  const listings = array(listingsResponse?.data?.data).map(normalizeListing).filter((item) => item.id).slice(0, 4)
  const stats = record(statsResponse?.data?.data)
  const totals = record(stats.totaux)
  const conversations = array(messagesResponse?.data?.data)
    .map(normalizeConversation)
    .filter((item) => item.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const appointments = array(bookingsResponse?.data?.data)
    .map(normalizeAppointment)
    .filter((item) => item.id)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const upcomingAppointments = appointments.filter((item) => (
    new Date(item.startsAt).getTime() > Date.now()
    && !['cancelled', 'declined', 'completed', 'no_show'].includes(item.status.toLocaleLowerCase('fr-FR'))
  ))
  const activity = array(notificationsResponse?.data?.data)
    .map(normalizeActivity)
    .filter((item) => item.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const subscription = normalizeSubscription(subscriptionResponse?.data?.data)

  return {
    profile,
    subscription,
    completion: computeCompletion(profile),
    metrics: {
      activeListings: number(totals.annonces_actives, listings.length),
      totalViews: number(totals.total_vues),
      unreadMessages: conversations.reduce((sum, item) => sum + item.unreadCount, 0),
      upcomingAppointments: upcomingAppointments.length,
    },
    listings,
    conversations: conversations.slice(0, 3),
    appointments: upcomingAppointments.slice(0, 3),
    activity: activity.slice(0, 4),
    partialFailures: failures,
  }
}
