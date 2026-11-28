'use client'

const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login'

function sanitizeRedirect(path: string) {
  const value = path.trim()
  return value.startsWith('/') && !value.startsWith('//') ? value : ''
}

export function currentRedirectPath() {
  if (typeof window === 'undefined') return ''
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function loginHref(path?: string) {
  const redirectPath = sanitizeRedirect(path || currentRedirectPath())
  return redirectPath && !redirectPath.startsWith('/connexion')
    ? `/connexion?next=${encodeURIComponent(redirectPath)}`
    : '/connexion'
}

export function redirectToLogin(options: { replace?: boolean; path?: string } = {}) {
  if (typeof window === 'undefined') return
  const path = sanitizeRedirect(options.path || currentRedirectPath())
  if (path && !path.startsWith('/connexion')) rememberExplicitRedirectAfterLogin(path)
  const target = loginHref(path)
  if (options.replace) window.location.replace(target)
  else window.location.assign(target)
}

export function rememberRedirectAfterLogin() {
  if (typeof window === 'undefined') return

  const currentPath = currentRedirectPath()
  if (!currentPath || currentPath.startsWith('/connexion')) return

  try {
    window.sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, currentPath)
  } catch {
    // Ignore storage issues and keep the login flow working.
  }
}

export function rememberExplicitRedirectAfterLogin(path: string) {
  if (typeof window === 'undefined') return
  const redirectPath = sanitizeRedirect(path)
  if (!redirectPath) return

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
      return sanitizeRedirect(stored) || fallback
    }
  } catch {
    // Ignore session storage issues and keep the default redirect.
  }

  return fallback
}
