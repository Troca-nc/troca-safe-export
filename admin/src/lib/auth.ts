import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import jwt from 'jsonwebtoken'
import { matchTotpCounter } from './totp'

export const ADMIN_SESSION_COOKIE = 'kalico_admin_session'
const SETUP_FLAG_PATH = path.join(process.cwd(), '.totp-configured')
const ISSUER = 'kalico-admin'
const AUDIENCE = 'kalico-admin-session'

function readEnv(value: string | undefined, fallback = '') {
  return String(value || fallback).trim()
}

export function isTotpConfigured() {
  return fs.existsSync(SETUP_FLAG_PATH) || readEnv(process.env.TOTP_CONFIGURED).toLowerCase() === 'true'
}
export function getAdminEmail() { return readEnv(process.env.ADMIN_EMAIL) }
export function getAdminPasswordHash() { return readEnv(process.env.ADMIN_PASSWORD_HASH) }
export function getAdminTotpSecret() { return readEnv(process.env.ADMIN_TOTP_SECRET) }
export function getSessionSecret() {
  const secret = readEnv(process.env.NEXTAUTH_SECRET)
  if (secret.length < 32 || /change.?me/i.test(secret)) {
    throw new Error('Configuration de session administrateur invalide.')
  }
  return secret
}
export function getBackendUrl() { return readEnv(process.env.BACKEND_URL, 'http://backend:3001') }
export function getAdminBaseUrl() { return readEnv(process.env.NEXTAUTH_URL, 'https://admin.kalico.nc') }

export async function verifyAdminCredentials(email: string, password: string, totpCode: string) {
  getSessionSecret()
  const expectedEmail = getAdminEmail()
  const secret = getAdminTotpSecret()
  if (!expectedEmail || !getAdminPasswordHash() || !/^[A-Z2-7]{32,}=*$/i.test(secret)) {
    throw new Error('Configuration administrateur incomplète.')
  }
  if (typeof email !== 'string' || typeof password !== 'string' || typeof totpCode !== 'string') return null
  if (readEnv(email).toLowerCase() !== expectedEmail.toLowerCase()) return null
  if (!await bcrypt.compare(password, getAdminPasswordHash())) return null
  if (!isTotpConfigured()) return null
  const totpCounter = matchTotpCounter({ secret, token: readEnv(totpCode), window: 1 })
  if (totpCounter === null) return null
  return { email: expectedEmail, role: 'single-admin', totpCounter }
}

export function createAdminSession(payload: { email: string; role?: string }) {
  if (!getAdminEmail() || payload.email !== getAdminEmail() || payload.role !== 'single-admin') {
    throw new Error('Identité administrateur invalide.')
  }
  return jwt.sign({ email: payload.email, role: 'single-admin' }, getSessionSecret(), {
    algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE,
    subject: payload.email, expiresIn: '24h',
  })
}

export function verifyAdminSession(token: string) {
  try {
    const session = jwt.verify(token, getSessionSecret(), {
      algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE,
    })
    if (typeof session === 'string' || !getAdminEmail()) return null
    if (session.email !== getAdminEmail() || session.sub !== getAdminEmail() || session.role !== 'single-admin') return null
    if (typeof session.exp !== 'number' || !Number.isFinite(session.exp)) return null
    return session
  } catch {
    return null
  }
}
