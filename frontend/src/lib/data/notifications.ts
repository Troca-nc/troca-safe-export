import { bonPlansApi, notificationsApi } from '@/lib/api'

export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'never'

export type NotificationPreferences = {
  email_new_message: boolean
  push_new_message: boolean
  email_search_alert: boolean
  push_search_alert: boolean
  email_boost_activated: boolean
  email_offer_received: boolean
  email_listing_expiring: boolean
  email_listing_expired: boolean
  email_performance_report: boolean
  push_performance_report: boolean
  performance_report_frequency: ReportFrequency
}

export type BonPlanPreferences = {
  notify_all: boolean
  notify_categories: string[]
  notify_businesses: string[]
  via_push: boolean
  via_email: boolean
}

export type NotificationPreferencesData = {
  notifications: NotificationPreferences
  bonPlans: BonPlanPreferences
  businesses: Array<{ name: string }>
}

export const BON_PLAN_CATEGORIES = [
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'mode', label: 'Mode' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'high_tech', label: 'High-tech' },
  { value: 'auto_moto', label: 'Auto / Moto' },
  { value: 'maison', label: 'Maison' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'services', label: 'Services' },
  { value: 'sport', label: 'Sport' },
  { value: 'voyages', label: 'Voyages' },
  { value: 'autre', label: 'Autres' },
] as const

const NOTIFICATION_STORAGE_PREFIX = 'kalico-demo-notification-prefs'
const BON_PLAN_STORAGE_PREFIX = 'kalico-demo-bon-plan-prefs'

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function defaultNotificationPreferences(): NotificationPreferences {
  return {
    email_new_message: true,
    push_new_message: true,
    email_search_alert: true,
    push_search_alert: true,
    email_boost_activated: true,
    email_offer_received: true,
    email_listing_expiring: true,
    email_listing_expired: true,
    email_performance_report: true,
    push_performance_report: false,
    performance_report_frequency: 'weekly',
  }
}

export function defaultBonPlanPreferences(): BonPlanPreferences {
  return {
    notify_all: false,
    notify_categories: [],
    notify_businesses: [],
    via_push: true,
    via_email: false,
  }
}

function storageKey(prefix: string, profile: string | null) {
  return `${prefix}:${profile ?? 'visitor'}`
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? { ...fallback, ...record(JSON.parse(raw)) } : fallback
  } catch {
    return fallback
  }
}

function writeStored(key: string, value: unknown) {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value))
}

function frequency(value: unknown): ReportFrequency {
  return value === 'daily' || value === 'monthly' || value === 'never' ? value : 'weekly'
}

function normalizeNotifications(value: unknown, isPro: boolean): NotificationPreferences {
  const current = record(value)
  const selectedFrequency = frequency(current.performance_report_frequency)
  return {
    email_new_message: current.email_new_message !== false,
    push_new_message: current.push_new_message !== false,
    email_search_alert: current.email_search_alert !== false,
    push_search_alert: current.push_search_alert !== false,
    email_boost_activated: current.email_boost_activated !== false,
    email_offer_received: current.email_offer_received !== false,
    email_listing_expiring: current.email_listing_expiring !== false,
    email_listing_expired: current.email_listing_expired !== false,
    email_performance_report: current.email_performance_report !== false,
    push_performance_report: current.push_performance_report === true,
    performance_report_frequency: !isPro && !['weekly', 'never'].includes(selectedFrequency)
      ? 'weekly'
      : selectedFrequency,
  }
}

function normalizeBonPlans(value: unknown): BonPlanPreferences {
  const current = record(value)
  return {
    notify_all: Boolean(current.notify_all),
    notify_categories: strings(current.notify_categories),
    notify_businesses: strings(current.notify_businesses),
    via_push: current.via_push !== false,
    via_email: current.via_email === true,
  }
}

export async function loadNotificationPreferences({
  demoProfile,
  isPro,
}: {
  demoProfile: string | null
  isPro: boolean
}): Promise<NotificationPreferencesData> {
  if (demoProfile) {
    const { notificationPreferencesFixture } = await import('@/demo/fixtures/notifications')
    return {
      notifications: normalizeNotifications(
        readStored(storageKey(NOTIFICATION_STORAGE_PREFIX, demoProfile), notificationPreferencesFixture.notifications),
        isPro,
      ),
      bonPlans: normalizeBonPlans(
        readStored(storageKey(BON_PLAN_STORAGE_PREFIX, demoProfile), notificationPreferencesFixture.bonPlans),
      ),
      businesses: notificationPreferencesFixture.businesses,
    }
  }

  const [notificationResponse, bonPlanResponse, businessesResponse] = await Promise.all([
    notificationsApi.getPreferences(),
    bonPlansApi.getPrefs(),
    bonPlansApi.businesses(),
  ])

  const businesses = Array.isArray(businessesResponse.data?.data)
    ? businessesResponse.data.data
        .map((item: unknown) => record(item))
        .filter((item) => typeof item.name === 'string' && item.name.trim())
        .map((item) => ({ name: String(item.name) }))
    : []

  return {
    notifications: normalizeNotifications(notificationResponse.data?.data, isPro),
    bonPlans: normalizeBonPlans(bonPlanResponse.data?.data),
    businesses,
  }
}

export async function saveNotificationPreferences(
  data: Pick<NotificationPreferencesData, 'notifications' | 'bonPlans'>,
  demoProfile: string | null,
) {
  if (demoProfile) {
    writeStored(storageKey(NOTIFICATION_STORAGE_PREFIX, demoProfile), data.notifications)
    writeStored(storageKey(BON_PLAN_STORAGE_PREFIX, demoProfile), data.bonPlans)
    return
  }

  await Promise.all([
    notificationsApi.savePreferences(data.notifications),
    bonPlansApi.savePrefs(data.bonPlans),
  ])
}
