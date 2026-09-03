import { NextResponse } from 'next/server'

function unavailable() {
  return NextResponse.json(
    { error: 'Configuration TOTP publique désactivée. Un provisionnement sécurisé est nécessaire.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
export async function GET() { return unavailable() }
export async function POST() { return unavailable() }
