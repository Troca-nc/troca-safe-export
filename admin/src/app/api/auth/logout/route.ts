import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE } from '@/lib/auth'
import { revokeAdminSession } from '@/lib/session-store'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  try {
    if (token) await revokeAdminSession(token)
  } catch {
    return NextResponse.json(
      { error: 'Déconnexion administrateur indisponible. Réessayez.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}
