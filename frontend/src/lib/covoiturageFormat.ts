export const NOUMEA_TIME_ZONE = 'Pacific/Noumea'

export function formatRideTime(value: string | null | undefined) {
  if (!value) return 'Heure à confirmer'
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return 'Heure à confirmer'
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isInteger(hours) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return 'Heure à confirmer'
  return minutes === 0 ? `${hours} h` : `${hours} h ${String(minutes).padStart(2, '0')}`
}

export function formatRideDate(value: string | null | undefined) {
  if (!value) return 'Date à confirmer'
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00+11:00` : value)
  if (Number.isNaN(date.getTime())) return 'Date à confirmer'
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: NOUMEA_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function getRideTimestamp(dateIso: string, time: string) {
  const normalizedTime = /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : '00:00'
  const timestamp = Date.parse(`${dateIso.slice(0, 10)}T${normalizedTime}:00+11:00`)
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}
