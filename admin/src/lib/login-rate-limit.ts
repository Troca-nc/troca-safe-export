import { createHmac } from 'node:crypto'
import { createClient, type RedisClientType } from 'redis'
import { getSessionSecret } from './auth'

const WINDOW_SECONDS = 15 * 60
const SOURCE_MAX_ATTEMPTS = 5
const IDENTITY_MAX_ATTEMPTS = 10

let clientPromise: Promise<RedisClientType> | null = null

function redisUrl() {
  const value = String(process.env.REDIS_URL || '').trim()
  if (!value) throw new Error('Protection des connexions administrateur indisponible.')
  return value
}

async function redisClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = createClient({
        url: redisUrl(),
        socket: { connectTimeout: 2_000, reconnectStrategy: false },
      }) as RedisClientType
      client.on('error', () => undefined)
      await client.connect()
      return client
    })().catch((error) => {
      clientPromise = null
      throw error
    })
  }
  const client = await clientPromise
  if (!client.isReady) {
    clientPromise = null
    try { await client.disconnect() } catch {}
    throw new Error('Protection des connexions administrateur indisponible.')
  }
  return client
}

function digest(kind: string, value: string) {
  return createHmac('sha256', getSessionSecret())
    .update(`${kind}:${value.trim().toLowerCase()}`)
    .digest('hex')
}

function sourceAddress(headers: Headers) {
  // Nginx overwrites X-Real-IP with the direct client address. Do not use the
  // first X-Forwarded-For value, which can be supplied by the caller.
  return headers.get('x-real-ip')?.trim() || 'unknown-source'
}

export function loginLimitKeys(headers: Headers, email: string) {
  return [
    { key: `admin-login:source:${digest('source', sourceAddress(headers))}`, maximum: SOURCE_MAX_ATTEMPTS },
    { key: `admin-login:identity:${digest('identity', email || 'unknown-identity')}`, maximum: IDENTITY_MAX_ATTEMPTS },
  ]
}

export async function consumeAdminLoginAttempt(headers: Headers, email: string) {
  const client = await redisClient()
  const keys = loginLimitKeys(headers, email)
  const result = await client.eval(
    `
      local blocked = 0
      local longestTtl = 0
      for i, key in ipairs(KEYS) do
        local count = redis.call('INCR', key)
        if count == 1 then redis.call('EXPIRE', key, ARGV[1]) end
        local ttl = redis.call('TTL', key)
        if count > tonumber(ARGV[i + 1]) then blocked = 1 end
        if ttl > longestTtl then longestTtl = ttl end
      end
      return { blocked, longestTtl }
    `,
    { keys: keys.map(({ key }) => key), arguments: [String(WINDOW_SECONDS), ...keys.map(({ maximum }) => String(maximum))] },
  ) as number[]

  return { allowed: Number(result[0]) === 0, retryAfter: Math.max(1, Number(result[1]) || WINDOW_SECONDS) }
}

export async function resetAdminLoginAttempts(headers: Headers, email: string) {
  const client = await redisClient()
  await client.del(loginLimitKeys(headers, email).map(({ key }) => key))
}
