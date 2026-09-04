import { formatXpf } from './formatters'

export const UNAVAILABLE_VALUE = 'Non renseigné'

export function displayCount(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : UNAVAILABLE_VALUE
}

export function displayXpf(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? formatXpf(value) : UNAVAILABLE_VALUE
}

export function displayArrayCount(value: unknown) {
  return Array.isArray(value) ? String(value.length) : UNAVAILABLE_VALUE
}

export function rowsOrEmpty(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

export function percentageWidth(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0
}
