import crypto from 'node:crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32ToBuffer(secret: string) {
  const normalized = secret.replace(/=+$/g, '').toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const char of normalized) {
    const value = BASE32_ALPHABET.indexOf(char)
    if (value < 0) continue
    bits += value.toString(2).padStart(5, '0')
  }

  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function generateHotp(secret: string, counter: number) {
  const key = base32ToBuffer(secret)
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))

  const digest = crypto.createHmac('sha1', key).update(buffer).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const code = ((digest[offset] & 0x7f) << 24)
    | (digest[offset + 1] << 16)
    | (digest[offset + 2] << 8)
    | digest[offset + 3]

  return String(code % 1_000_000).padStart(6, '0')
}

export function createOtpAuthUrl({
  secret,
  label,
  issuer = 'Kalico',
}: {
  secret: string
  label: string
  issuer?: string
}) {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`
}

export function verifyTotpToken({
  secret,
  token,
  window = 1,
  epoch = Date.now(),
}: {
  secret: string
  token: string
  window?: number
  epoch?: number
}) {
  const normalizedToken = String(token || '').trim()
  if (!/^\d{6}$/.test(normalizedToken)) return false

  const counter = Math.floor(epoch / 1000 / 30)
  for (let offset = -window; offset <= window; offset += 1) {
    if (counter + offset < 0) continue
    if (generateHotp(secret, counter + offset) === normalizedToken) {
      return true
    }
  }
  return false
}
