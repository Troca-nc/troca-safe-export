export type CovoiturageTab = 'search' | 'publish' | 'transport'

export type Ride = {
  id: string
  departure: string
  destination: string
  dateIso: string
  time: string
  seatsTotal: number
  seatsRemaining: number
  bookingMode: 'auto' | 'manual'
  recurrenceType: 'none' | 'daily' | 'weekly'
  recurrenceDays: number[]
  recurrenceUntil: string | null
  priceXpf: number
  vehicle: string | null
  description: string
  driverId: string | null
  driverName: string
  driverInitials: string
  trustScore: number | null
  rating: number | null
  reviewsCount: number
  verifiedDriver: boolean
  featured: boolean
  womenOnly: boolean
  direct: boolean
  viaStops: string[]
  musicAllowed: boolean
  noSmoking: boolean
  animalsAllowed: boolean
}

export type Transporter = {
  id: string
  companyName: string
  displayName: string
  logoUrl: string | null
  vehiclePhotoUrl: string | null
  transportTypes: string[]
  transportTypeLabels: string[]
  vehicleDescription: string | null
  vehicleCapacity: number | null
  serviceZones: string[]
  basePriceXpf: number | null
  pricePerKmXpf: number | null
  rating: number | null
  ridesCompleted: number
  verified: boolean
  available: boolean
  commune: string | null
}

export type RideSearchFilters = {
  departure?: string
  destination?: string
  rideDate?: string
  womenOnly?: boolean
}

export type TransporterFilters = {
  type?: string
  zone?: string
  passengers?: number
  date?: string
  time?: string
}

export type RideDraft = {
  departure: string
  destination: string
  ride_date: string
  ride_time: string
  seats_total: number
  price_xpf: number
  vehicle: string
  description: string
  booking_mode: 'auto' | 'manual'
  women_only: boolean
  music_allowed: boolean
  no_smoking: boolean
  animals_allowed: boolean
  recurrence_enabled: boolean
  recurrence_type: 'daily' | 'weekly'
  recurrence_days: number[]
  recurrence_until: string
}
