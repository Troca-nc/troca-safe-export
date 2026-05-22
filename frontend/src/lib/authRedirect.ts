'use client'

const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login'

export function rememberRedirectAfterLogin() {
  if (typeof window === 'undefined') return

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (!currentPath || currentPath.startsWith('/connexion')) return

  try {
    window.sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, currentPath)
  } catch {
    // Ignore storage issues and keep the login flow working.
  }
}

export function rememberExplicitRedirectAfterLogin(path: string) {
  if (typeof window === 'undefined') return
  const redirectPath = path.trim()
  if (!redirectPath || !redirectPath.startsWith('/')) return

  try {
    window.sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, redirectPath)
  } catch {
    // Ignore storage issues and keep the login flow working.
  }
}

export function consumeRedirectAfterLogin(fallback = '/') {
  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)
    if (stored) {
      window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
      return stored.startsWith('/') ? stored : fallback
    }
  } catch {
    // Ignore session storage issues and keep the default redirect.
  }

  return fallback
}
