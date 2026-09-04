import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/session'

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json({
    authenticated: true,
    data: {
      email: session.email,
      role: session.role || 'admin',
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}
