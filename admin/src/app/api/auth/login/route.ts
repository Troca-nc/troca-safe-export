import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession, verifyAdminCredentials, ADMIN_SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = body?.email || ''
  const password = body?.password || ''
  const totp = body?.totp || ''

  const admin = await verifyAdminCredentials(email, password, totp)
  if (!admin) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
  }

  const token = createAdminSession(admin)
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return response
}
