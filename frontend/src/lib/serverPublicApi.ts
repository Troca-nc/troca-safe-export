import 'server-only'

import { normalizeApiBase } from '@/lib/apiBase'

const INTERNAL_HEADER = 'X-Kalico-Frontend-Token'

type ServerPublicFetchInit = Omit<RequestInit, 'body' | 'headers' | 'method'> & {
  method?: 'GET' | 'HEAD'
  next?: { revalidate?: number }
  capabilityToken?: string
}

function internalConfig() {
  const rawUrl = process.env.INTERNAL_FRONTEND_API_URL?.trim()
  const token = process.env.FRONTEND_INTERNAL_API_TOKEN?.trim()
  if (!rawUrl || !token || token.length < 32) {
    throw new Error('Internal frontend API configuration is missing')
  }
  const apiBase = normalizeApiBase(rawUrl)
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(apiBase)
    if (url.protocol !== 'http:' || url.hostname !== 'backend' || url.port !== '3001' || url.pathname !== '/api') {
      throw new Error('Internal frontend API must target the backend Docker service')
    }
  }
  return { apiBase, token }
}

export async function serverPublicFetch(path: string, init: ServerPublicFetchInit = {}) {
  const method = String(init.method || 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    throw new Error(`Internal public API only supports GET and HEAD, received ${method}`)
  }

  const { apiBase, token } = internalConfig()
  const { capabilityToken: rawCapabilityToken, ...fetchInit } = init
  const headers = new Headers({
    Accept: 'application/json',
    [INTERNAL_HEADER]: token,
  })
  const capabilityToken = rawCapabilityToken?.trim()
  if (capabilityToken) headers.set('X-Kalico-Capability', capabilityToken)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return fetch(`${apiBase}${normalizedPath}`, {
    ...fetchInit,
    method,
    headers,
    signal: init.signal ?? AbortSignal.timeout(5_000),
  })
}
