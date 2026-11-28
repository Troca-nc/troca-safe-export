// Access tokens deliberately live only in this JavaScript module. The refresh
// token is an HttpOnly cookie and must never be exposed to the browser runtime.
let inMemoryAccessToken = ''

export function purgeLegacyStoredTokens() {
  if (typeof window === 'undefined') return
  for (const storage of [window.sessionStorage, window.localStorage]) {
    for (const key of ['access_token', 'refresh_token', 'accessToken', 'refreshToken']) {
      storage.removeItem(key)
    }
  }
}

export function getStoredAccessToken() {
  return inMemoryAccessToken
}

export function saveStoredTokens(accessToken: string) {
  inMemoryAccessToken = accessToken.trim()
}

export function clearStoredTokens() {
  inMemoryAccessToken = ''
}
