import { NextRequest, NextResponse } from 'next/server'
import { adminBackendFetch } from '@/lib/backend'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}))
  const { id } = await params
  const response = await adminBackendFetch(`/admin/users/${id}/suspend`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload ?? { ok: response.ok }, { status: response.status })
}
