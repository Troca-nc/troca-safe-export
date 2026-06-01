import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import jwt from 'jsonwebtoken'
import { createOtpAuthUrl, verifyTotpToken } from './totp'
import { buildQrLikeDataUrl } from './qr'

export const ADMIN_SESSION_COOKIE = 'troca_admin_session'
const SETUP_FLAG_PATH = path.join(process.cwd(), '.totp-configured')
const DEMO_TOTP_CODE = '123456'

function readEnv(value: string | undefined, fallback = '') {
  return String(value || fallback).trim()
}

export function isTotpConfigured() {
  if (isDemoMode()) return true
  return fs.existsSync(SETUP_FLAG_PATH) || readEnv(process.env.TOTP_CONFIGURED).toLowerCase() === 'true'
}

export function markTotpConfigured() {
  fs.writeFileSync(SETUP_FLAG_PATH, 'true', 'utf8')
}

export function getAdminEmail() {
  return readEnv(process.env.ADMIN_EMAIL, 'admin@troca.nc')
}

export function getAdminPasswordHash() {
  return readEnv(process.env.ADMIN_PASSWORD_HASH)
}

export function getAdminTotpSecret() {
  return readEnv(process.env.ADMIN_TOTP_SECRET)
}

export function getSessionSecret() {
  return readEnv(process.env.NEXTAUTH_SECRET, 'dev-admin-secret-change-me')
}

export function getBackendUrl() {
  return readEnv(process.env.BACKEND_URL, 'http://backend:3001')
}

export function getAdminBaseUrl() {
  return readEnv(process.env.NEXTAUTH_URL, 'https://admin.troca.nc')
}

export async function buildSetupQrDataUrl() {
  const uri = createOtpAuthUrl({
    secret: getAdminTotpSecret(),
    label: `Troca Admin (${getAdminEmail()})`,
    issuer: 'Troca',
  })

  return buildQrLikeDataUrl(uri)
}

export async function verifyAdminCredentials(email: string, password: string, totpCode: string) {
  if (readEnv(email).toLowerCase() !== getAdminEmail().toLowerCase()) {
    return null
  }

  const passwordHash = getAdminPasswordHash()
  if (!passwordHash) {
    throw new Error('ADMIN_PASSWORD_HASH manquant')
  }

  const passwordOk = await bcrypt.compare(password, passwordHash)
  if (!passwordOk) {
    return null
  }

  if (isDemoMode()) {
    if (readEnv(totpCode) !== DEMO_TOTP_CODE) {
      return null
    }
  } else {
    if (!isTotpConfigured()) {
      return null
    }

    const totpOk = verifyTotpToken({
      secret: getAdminTotpSecret(),
      token: readEnv(totpCode),
      window: 1,
    })

    if (!totpOk) {
      return null
    }
  }

  return {
    email: getAdminEmail(),
    role: 'single-admin',
  }
}

export function createAdminSession(payload: { email: string; role?: string }) {
  return jwt.sign(
    {
      email: payload.email,
      role: payload.role || 'admin',
    },
    getSessionSecret(),
    {
      subject: payload.email,
      expiresIn: '24h',
    }
  )
}

export function verifyAdminSession(token: string) {
  try {
    return jwt.verify(token, getSessionSecret()) as {
      email?: string
      role?: string
      sub?: string
      exp?: number
    }
  } catch {
    return null
  }
}

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}
