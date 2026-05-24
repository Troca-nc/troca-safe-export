const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

function getSessionStorage() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

export function getStoredAccessToken() {
  return getSessionStorage()?.getItem(ACCESS_TOKEN_KEY) ?? ''
}

export function getStoredRefreshToken() {
  return getSessionStorage()?.getItem(REFRESH_TOKEN_KEY) ?? ''
}

export function saveStoredTokens(accessToken: string, refreshToken: string) {
  const storage = getSessionStorage()
  if (!storage) return
  storage.setItem(ACCESS_TOKEN_KEY, accessToken)
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearStoredTokens() {
  const storage = getSessionStorage()
  if (!storage) return
  storage.removeItem(ACCESS_TOKEN_KEY)
  storage.removeItem(REFRESH_TOKEN_KEY)
}
