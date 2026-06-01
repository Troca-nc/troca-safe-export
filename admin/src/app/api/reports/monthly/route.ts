import { NextRequest, NextResponse } from 'next/server'
import { adminBackendJson } from '@/lib/backend'

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month') || new Date().toISOString().slice(0, 7)
  const data = await adminBackendJson(`/admin/reports/monthly?month=${encodeURIComponent(month)}`)
  return NextResponse.json({ data })
}
