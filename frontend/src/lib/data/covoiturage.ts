import { covoiturageApi, proTransportApi } from '@/lib/api'
import { demoOr } from '@/lib/demo'
import type { Ride, RideDraft, RideSearchFilters, Transporter, TransporterFilters } from '@/types/covoiturage'

type UnknownRecord = Record<string, unknown>
const record = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {}
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const optionalNumber = (value: unknown) => value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null
const rows = (value: unknown) => Array.isArray(value) ? value : Array.isArray(record(value).data) ? record(value).data as unknown[] : []

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toLocaleUpperCase('fr-FR')).join('') || 'K'
}

export function normalizeRide(value: unknown): Ride | null {
  const item = record(value)
  const id = text(item.id) || (typeof item.id === 'number' ? String(item.id) : '')
  const departure = text(item.departure_commune_name ?? item.departure)
  const destination = text(item.destination_commune_name ?? item.destination)
  if (!id || !departure || !destination) return null
  const driverName = [text(item.driver_prenom), text(item.driver_nom)].filter(Boolean).join(' ') || 'Conducteur local'
  const seatsTotal = number(item.seats_total)
  const seatsRemaining = optionalNumber(item.seats_remaining) ?? Math.max(0, seatsTotal - number(item.seats_reserved))
  const recurrenceType = text(item.recurrence_type)
  return {
    id, departure, destination,
    dateIso: text(item.ride_date), time: text(item.ride_time), seatsTotal, seatsRemaining,
    bookingMode: text(item.booking_mode) === 'manual' ? 'manual' : 'auto',
    recurrenceType: recurrenceType === 'daily' || recurrenceType === 'weekly' ? recurrenceType : 'none',
    recurrenceDays: Array.isArray(item.recurrence_days) ? item.recurrence_days.map((day) => number(day)).filter((day) => day >= 0 && day <= 6) : [],
    recurrenceUntil: text(item.recurrence_until) || null,
    priceXpf: number(item.price_xpf), vehicle: text(item.vehicle) || null, description: text(item.description),
    driverId: text(item.user_id) || (typeof item.user_id === 'number' ? String(item.user_id) : null),
    driverName, driverInitials: initials(driverName), trustScore: optionalNumber(item.trust_score), rating: optionalNumber(item.avg_rating),
    reviewsCount: number(item.reviews_count), verifiedDriver: Boolean(item.is_verified_driver), featured: Boolean(item.is_featured),
    womenOnly: Boolean(item.women_only), direct: item.is_direct !== false,
    viaStops: Array.isArray(item.via_stops) ? item.via_stops.filter((stop): stop is string => typeof stop === 'string') : [],
    musicAllowed: Boolean(item.music_allowed), noSmoking: Boolean(item.no_smoking), animalsAllowed: Boolean(item.animals_allowed),
  }
}

export function normalizeTransporter(value: unknown): Transporter | null {
  const item = record(value)
  const id = text(item.id) || (typeof item.id === 'number' ? String(item.id) : '')
  const companyName = text(item.company_name)
  if (!id || !companyName) return null
  return {
    id, companyName, displayName: text(item.display_name) || companyName,
    logoUrl: text(item.pro_logo_url) || null, vehiclePhotoUrl: text(item.vehicle_photo_url) || null,
    transportTypes: Array.isArray(item.transport_type) ? item.transport_type.filter((type): type is string => typeof type === 'string') : [],
    transportTypeLabels: Array.isArray(item.transport_type_labels) ? item.transport_type_labels.filter((type): type is string => typeof type === 'string') : [],
    vehicleDescription: text(item.vehicle_description) || null, vehicleCapacity: optionalNumber(item.vehicle_capacity),
    serviceZones: Array.isArray(item.service_zones) ? item.service_zones.filter((zone): zone is string => typeof zone === 'string') : [],
    basePriceXpf: optionalNumber(item.base_price_xpf), pricePerKmXpf: optionalNumber(item.price_per_km_xpf),
    rating: optionalNumber(item.avg_rating), ridesCompleted: number(item.total_rides ?? item.rides_completed),
    verified: Boolean(item.is_verified), available: item.is_available !== false, commune: text(item.pro_commune) || null,
  }
}

export async function getRides(filters: RideSearchFilters = {}): Promise<Ride[]> {
  return demoOr(
    async () => (await import('@/demo/fixtures/covoiturage')).demoRides,
    async () => {
      const response = await covoiturageApi.list({
        departure: filters.departure || undefined,
        destination: filters.destination || undefined,
        ride_date: filters.rideDate || undefined,
        women_only: filters.womenOnly || undefined,
      })
      return rows(response.data).map(normalizeRide).filter((ride): ride is Ride => Boolean(ride))
    },
  )
}

export async function getTransporters(filters: TransporterFilters = {}): Promise<Transporter[]> {
  return demoOr(
    async () => (await import('@/demo/fixtures/covoiturage')).demoTransporters,
    async () => {
      const response = await proTransportApi.list({ limit: 24, ...filters })
      return rows(response.data).map(normalizeTransporter).filter((item): item is Transporter => Boolean(item))
    },
  )
}

export async function publishRide(draft: RideDraft) {
  return demoOr(
    async () => ({ id: 'demo-created-ride' }),
    async () => {
      const response = await covoiturageApi.create({
        ...draft,
        stops: [], comfort: draft.vehicle || null, luggage_allowed: 'Oui',
        price_xpf: Math.max(0, Math.round(draft.price_xpf / 10) * 10),
      })
      return response.data?.data ?? response.data
    },
  )
}

export async function bookRide(rideId: string, message?: string) {
  return demoOr(
    async () => ({ status: message ? 'pending' : 'auto_confirmed' }),
    async () => {
      const response = await covoiturageApi.book(rideId, { seats: 1, ...(message ? { message } : {}) })
      return response.data?.data ?? response.data
    },
  )
}
