export function consumeCapabilityTokenFromFragment() {
  if (typeof window === 'undefined') return null
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const token = fragment.get('token')?.trim() || null
  if (token) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  return token
}
