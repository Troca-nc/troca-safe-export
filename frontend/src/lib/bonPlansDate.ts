export const PACIFIC_NOUMEA_TIME_ZONE = 'Pacific/Noumea'

function asValidDate(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getNoumeaDayKey(value: string | number | Date) {
  const date = asValidDate(value)
  if (!date) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PACIFIC_NOUMEA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function isExpiredBonPlan(publishedUntil: string | null | undefined, now = Date.now()) {
  if (!publishedUntil) return false
  const expiry = asValidDate(publishedUntil)
  return expiry ? expiry.getTime() <= now : false
}

export function isPastEvent(dateIso: string | null | undefined, now = Date.now()) {
  if (!dateIso) return false
  const eventDay = /^\d{4}-\d{2}-\d{2}$/.test(dateIso) ? dateIso : getNoumeaDayKey(dateIso)
  const currentDay = getNoumeaDayKey(now)
  return Boolean(eventDay && currentDay && eventDay < currentDay)
}

export function formatNoumeaDate(value: string | number | Date, options: Intl.DateTimeFormatOptions = {}) {
  const date = asValidDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: PACIFIC_NOUMEA_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    ...options,
  }).format(date)
}

export function formatNoumeaTime(value: string | number | Date) {
  const date = asValidDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: PACIFIC_NOUMEA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
