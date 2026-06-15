import { NextRequest, NextResponse } from 'next/server'
import { buildSetupQrDataUrl, getAdminEmail, getAdminTotpSecret, isTotpConfigured, markTotpConfigured } from '@/lib/auth'
import { createOtpAuthUrl, verifyTotpToken } from '@/lib/totp'

export async function GET() {
  if (isTotpConfigured()) {
    return NextResponse.json({ configured: true })
  }

  const qrDataUrl = await buildSetupQrDataUrl()
  const otpAuthUrl = createOtpAuthUrl({
    secret: getAdminTotpSecret(),
    label: `Kalico Admin (${getAdminEmail()})`,
    issuer: 'Kalico',
  })

  return NextResponse.json({
    configured: false,
    email: getAdminEmail(),
    otpAuthUrl,
    qrDataUrl,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const code = String(body?.code || '').trim()
  if (!code) {
    return NextResponse.json({ error: 'Code TOTP requis' }, { status: 400 })
  }

  const secret = getAdminTotpSecret()
  const verified = verifyTotpToken({
    secret,
    token: code,
    window: 1,
  })

  if (!verified) {
    return NextResponse.json({ error: 'Code TOTP invalide' }, { status: 401 })
  }

  markTotpConfigured()
  return NextResponse.json({ ok: true })
}
