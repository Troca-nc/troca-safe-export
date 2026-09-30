import { DEMO } from '@/lib/demo'
import { messagesApi, notificationsApi, proApi } from '@/lib/api'
import type {
  LayoutAccount,
  LayoutDemoProfile,
  LayoutHeaderData,
  LayoutNotificationCenter,
  LayoutSessionUser,
} from '@/types/layout'

function cleanName(value?: string | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function toCount(value: unknown) {
  const count = Number(value ?? 0)
  return Number.isFinite(count) && count > 0 ? count : 0
}

export function normalizeLayoutAccount(user?: LayoutSessionUser | null): LayoutAccount | null {
  if (!user) return null

  const firstName = cleanName(user.prenom) || cleanName(user.first_name)
  const lastName = cleanName(user.nom) || cleanName(user.last_name)
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toLocaleUpperCase('fr-FR') || 'K'

  return {
    id: user.id == null ? null : String(user.id),
    firstName,
    lastName,
    initials,
    avatarUrl: user.avatar_url ?? null,
    isPro: Boolean(user.is_pro || user.account_type === 'professional'),
  }
}

export async function getLayoutHeaderData({
  account,
  demoProfile,
}: {
  account: LayoutAccount
  demoProfile: LayoutDemoProfile
}): Promise<LayoutHeaderData> {
  if (DEMO || demoProfile) {
    const { getDemoLayoutHeaderData } = await import('@/demo/fixtures/layout')
    return getDemoLayoutHeaderData(demoProfile)
  }

  const [messagesResult, notificationsResult, proResult] = await Promise.all([
    messagesApi.getConversations(),
    notificationsApi.getNotifications(20),
    account.isPro && account.id ? proApi.getById(account.id).catch(() => null) : Promise.resolve(null),
  ])

  const conversations = Array.isArray(messagesResult.data?.data) ? messagesResult.data.data : []
  const unreadMessages = conversations.reduce(
    (total: number, conversation: { unread_count?: unknown }) => total + toCount(conversation.unread_count),
    0,
  )
  const unreadNotifications = toCount(notificationsResult.data?.unread)
  const pro = proResult?.data?.data as { display_name?: string | null; pro_company_name?: string | null } | undefined
  const companyName = cleanName(pro?.display_name) || cleanName(pro?.pro_company_name) || null

  return { unreadMessages, unreadNotifications, companyName }
}

export async function getLayoutNotifications(
  limit: number,
  demoProfile: LayoutDemoProfile,
): Promise<LayoutNotificationCenter> {
  if (DEMO || demoProfile) {
    const { getDemoNotificationCenter } = await import('@/demo/fixtures/layout')
    return getDemoNotificationCenter(demoProfile)
  }

  const response = await notificationsApi.getNotifications(limit)
  return {
    items: Array.isArray(response.data?.data) ? response.data.data : [],
    unread: toCount(response.data?.unread),
  }
}

export async function markLayoutNotificationRead(id: number, demo = false) {
  if (DEMO || demo) return
  await notificationsApi.markRead(id)
}

export async function markAllLayoutNotificationsRead(demo = false) {
  if (DEMO || demo) return
  await notificationsApi.markAllRead()
}
