import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/auth'

export async function GET() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!sessionToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const session = verifyAdminSession(sessionToken)
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    data: {
      email: session.email,
      role: session.role || 'admin',
    },
  })
}
