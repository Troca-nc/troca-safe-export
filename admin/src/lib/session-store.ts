import { createHmac } from 'node:crypto'
import { getSessionSecret, verifyAdminSession } from './auth'
import { getAdminRedisClient } from './login-rate-limit'

function sessionKey(jti: string) {
  const digest = createHmac('sha256', getSessionSecret()).update(`admin-session:${jti}`).digest('hex')
  return `admin-session:active:${digest}`
}

export async function registerAdminSession(token: string) {
  const session = verifyAdminSession(token)
  if (!session?.jti || !session.exp) throw new Error('Session administrateur invalide.')
  const ttl = Math.floor(session.exp - Date.now() / 1000)
  if (ttl <= 0) throw new Error('Session administrateur expirée.')
  const client = await getAdminRedisClient()
  const result = await client.set(sessionKey(session.jti), 'active', { NX: true, EX: ttl })
  if (result !== 'OK') throw new Error('Identifiant de session administrateur déjà utilisé.')
  return session
}

export async function verifyActiveAdminSession(token: string) {
  const session = verifyAdminSession(token)
  if (!session?.jti) return null
  const client = await getAdminRedisClient()
  return await client.get(sessionKey(session.jti)) === 'active' ? session : null
}

export async function revokeAdminSession(token: string) {
  const session = verifyAdminSession(token)
  if (!session?.jti) return false
  const client = await getAdminRedisClient()
  await client.del(sessionKey(session.jti))
  return true
}

