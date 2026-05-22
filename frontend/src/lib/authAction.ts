'use client'

export type AuthActionType = 'favorite_listing' | 'message_seller' | 'publish_listing' | 'review_seller'

export type PendingAuthAction =
  | {
      type: 'favorite_listing'
      listingId: string
      redirectTo: string
    }
  | {
      type: 'message_seller'
      listingId: string
      redirectTo: string
    }
  | {
      type: 'publish_listing'
      redirectTo: string
    }
  | {
      type: 'review_seller'
      listingId: string
      redirectTo: string
    }

const PENDING_AUTH_ACTION_KEY = 'pending_auth_action'

function isPendingAuthAction(value: unknown): value is PendingAuthAction {
  if (!value || typeof value !== 'object') return false
  const action = value as Record<string, unknown>
  if (typeof action.type !== 'string' || typeof action.redirectTo !== 'string') return false
  if (action.type === 'publish_listing') return true
  return typeof action.listingId === 'string'
}

export function storePendingAuthAction(action: PendingAuthAction) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(PENDING_AUTH_ACTION_KEY, JSON.stringify(action))
  } catch {
    // Ignore storage issues and keep the login flow functional.
  }
}

export function peekPendingAuthAction(): PendingAuthAction | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(PENDING_AUTH_ACTION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isPendingAuthAction(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function consumePendingAuthAction(): PendingAuthAction | null {
  if (typeof window === 'undefined') return null
  const action = peekPendingAuthAction()
  try {
    window.sessionStorage.removeItem(PENDING_AUTH_ACTION_KEY)
  } catch {
    // Ignore storage issues and keep the flow working.
  }
  return action
}

