import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession, verifyAdminCredentials, ADMIN_SESSION_COOKIE } from '@/lib/auth'
import { claimAdminTotpCounter, consumeAdminLoginAttempt, resetAdminLoginAttempts } from '@/lib/login-rate-limit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const email = body?.email || ''
    const password = body?.password || ''
    const totp = body?.totp || ''

    const limit = await consumeAdminLoginAttempt(request.headers, email)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives de connexion. Réessayez plus tard.' },
        { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(limit.retryAfter) } },
      )
    }

    const admin = await verifyAdminCredentials(email, password, totp)
    if (!admin) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    if (!await claimAdminTotpCounter(admin.email, admin.totpCounter)) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    await resetAdminLoginAttempts(request.headers, email)

    const token = createAdminSession(admin)
    const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
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
  } catch {
    return NextResponse.json(
      { error: 'Connexion administrateur indisponible.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
