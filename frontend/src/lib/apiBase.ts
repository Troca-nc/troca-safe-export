export function normalizeApiOrigin(rawUrl?: string | null) {
  const fallback = 'http://localhost:3001'
  const input = (rawUrl ?? '').trim()
  if (!input) return fallback

  const trimmed = input.replace(/\/+$/, '')

  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname === 'api.troca.nc') {
      parsed.hostname = 'troca.nc'
    }

    if (parsed.pathname === '/api') {
      parsed.pathname = ''
    } else if (parsed.pathname.endsWith('/api')) {
      parsed.pathname = parsed.pathname.replace(/\/api$/, '')
    }

    return parsed.toString().replace(/\/$/, '')
  } catch {
    let value = trimmed
      .replace(/^https:\/\/api\.troca\.nc(?=\/|$)/i, 'https://troca.nc')
      .replace(/^http:\/\/api\.troca\.nc(?=\/|$)/i, 'http://troca.nc')

    if (value.endsWith('/api')) {
      value = value.slice(0, -4)
    }

    return value
  }
}

export function normalizeApiBase(rawUrl?: string | null) {
  const origin = normalizeApiOrigin(rawUrl)
  return origin.endsWith('/api') ? origin : `${origin}/api`
}
