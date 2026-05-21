import { NextRequest, NextResponse } from 'next/server'

function normalizeApiBase(url: string) {
  const trimmed = url.trim().replace(/\/+$/, '')
  if (!trimmed) return 'http://localhost:3001/api'
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

function getApiBase() {
  return normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization') || ''
  if (!authorization.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 401 })
  }

  const apiBase = getApiBase()
  const meResponse = await fetch(`${apiBase}/auth/me`, {
    method: 'GET',
    headers: {
      authorization,
    },
    cache: 'no-store',
  })

  if (!meResponse.ok) {
    return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  }

  const mePayload = await meResponse.json().catch(() => null)
  if (!mePayload?.data?.is_admin) {
    return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  }

  const internalToken = process.env.INTERNAL_API_TOKEN?.trim()
  const observabilityResponse = await fetch(`${apiBase}/internal/observability`, {
    method: 'GET',
    headers: internalToken ? { 'x-internal-token': internalToken } : {},
    cache: 'no-store',
  })

  const payload = await observabilityResponse.json().catch(() => null)
  if (!observabilityResponse.ok) {
    return NextResponse.json(
      { error: payload?.error || 'Impossible de charger l’observabilité' },
      { status: observabilityResponse.status || 502 }
    )
  }

  return NextResponse.json({ data: payload?.data ?? payload })
}
