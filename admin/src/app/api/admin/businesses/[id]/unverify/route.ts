import { NextRequest, NextResponse } from 'next/server'
import { adminBackendFetch } from '@/lib/backend'

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const response = await adminBackendFetch(`/admin/businesses/${id}/unverify`, {
    method: 'PATCH',
  })
  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload ?? { ok: response.ok }, { status: response.status })
}
