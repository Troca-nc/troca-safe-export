export function formatXpf(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0)
  return `${numberValue.toLocaleString('fr-FR')} XPF`
}

export function formatDateNc(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTimeNc(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatPercentage(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0)
  return `${Math.round(numberValue * 100) / 100}%`
}

