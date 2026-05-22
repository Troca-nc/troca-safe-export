'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type ListingSort = 'date' | 'price_asc' | 'price_desc'

export interface ListingFilters {
  q: string
  category: string
  commune_id: string
  province_id: string
  price_min: string
  price_max: string
  condition: string
  troc: string
  lat: string
  lng: string
  radius: number
  sort: ListingSort
  page: number
}

const DEFAULT_FILTERS: ListingFilters = {
  q: '',
  category: '',
  commune_id: '',
  province_id: '',
  price_min: '',
  price_max: '',
  condition: '',
  troc: '',
  lat: '',
  lng: '',
  radius: 20,
  sort: 'date',
  page: 1,
}

function decodeLocationToken(token: string): Pick<ListingFilters, 'province_id' | 'commune_id' | 'condition' | 'troc'> {
  const next = {
    province_id: '',
    commune_id: '',
    condition: '',
    troc: '',
  }

  if (!token) return next

  for (const chunk of token.split('|')) {
    const [rawKey, rawValue = ''] = chunk.split(':', 2)
    const key = rawKey.trim().toLowerCase()
    const value = rawValue.trim()

    if (key === 'province' || key === 'prov' || key === 'p') {
      next.province_id = value
    } else if (key === 'commune' || key === 'comm' || key === 'c') {
      next.commune_id = value
    } else if (key === 'condition' || key === 'cond') {
      next.condition = value
    } else if (key === 'troc' || key === 'swap') {
      next.troc = value === '1' || value === 'true' ? 'true' : ''
    }
  }

  return next
}

function encodeLocationToken(filters: ListingFilters) {
  const parts: string[] = []

  if (filters.commune_id) {
    parts.push(`commune:${filters.commune_id}`)
  } else if (filters.province_id) {
    parts.push(`province:${filters.province_id}`)
  }

  if (filters.condition) {
    parts.push(`condition:${filters.condition}`)
  }

  if (filters.troc === 'true') {
    parts.push('troc:1')
  }

  return parts.join('|')
}

function parseSort(value: string | null): ListingSort {
  return value === 'price_asc' || value === 'price_desc' ? value : 'date'
}

function parsePage(value: string | null) {
  const parsed = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function fromSearchParams(searchParams: Pick<URLSearchParams, 'get'>): ListingFilters {
  const location = decodeLocationToken(searchParams.get('r') ?? '')
  const legacyLocation = {
    commune_id: searchParams.get('commune_id') ?? '',
    province_id: searchParams.get('province_id') ?? '',
    condition: searchParams.get('condition') ?? '',
    troc: searchParams.get('troc') === 'true' ? 'true' : '',
  }
  const radiusParam = Number.parseInt(searchParams.get('radius') ?? '20', 10)
  const radius = Number.isFinite(radiusParam) && radiusParam > 0 ? radiusParam : 20

  return {
    q: searchParams.get('q') ?? '',
    category: searchParams.get('cat') ?? searchParams.get('category') ?? '',
    commune_id: location.commune_id || legacyLocation.commune_id,
    province_id: location.province_id || legacyLocation.province_id,
    price_min: searchParams.get('min') ?? searchParams.get('price_min') ?? '',
    price_max: searchParams.get('max') ?? searchParams.get('price_max') ?? '',
    condition: location.condition || legacyLocation.condition,
    troc: location.troc || legacyLocation.troc,
    lat: searchParams.get('lat') ?? '',
    lng: searchParams.get('lng') ?? '',
    radius,
    sort: parseSort(searchParams.get('sort')),
    page: parsePage(searchParams.get('page')),
  }
}

function toSearchString(filters: ListingFilters) {
  const params = new URLSearchParams()

  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('cat', filters.category)
  if (filters.price_min) params.set('min', filters.price_min)
  if (filters.price_max) params.set('max', filters.price_max)
  if (filters.lat) params.set('lat', filters.lat)
  if (filters.lng) params.set('lng', filters.lng)
  if (filters.radius !== 20 || (filters.lat && filters.lng)) params.set('radius', String(filters.radius))
  const location = encodeLocationToken(filters)
  if (location) params.set('r', location)
  if (filters.sort !== 'date') params.set('sort', filters.sort)
  if (filters.page > 1) params.set('page', String(filters.page))

  return params.toString()
}

export function useListingFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlFilters = useMemo(() => fromSearchParams(searchParams), [searchParams])
  const urlSignature = useMemo(() => toSearchString(urlFilters), [urlFilters])
  const [filters, setFilters] = useState<ListingFilters>(urlFilters)
  const lastAppliedSignatureRef = useRef(urlSignature)

  // TODO: test E2E sur la synchronisation des filtres URL et le retour arrière navigateur.
  useEffect(() => {
    if (urlSignature === lastAppliedSignatureRef.current) return

    lastAppliedSignatureRef.current = urlSignature
    setFilters(urlFilters)
  }, [urlFilters, urlSignature])

  useEffect(() => {
    const stateSignature = toSearchString(filters)
    if (stateSignature === urlSignature) return

    lastAppliedSignatureRef.current = stateSignature
    router.replace(stateSignature ? `${pathname}?${stateSignature}` : pathname, { scroll: false })
  }, [filters, pathname, router, urlSignature])

  const setFilter = useCallback(<K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    setFilters((current) => {
      const next = { ...current, [key]: value } as ListingFilters

      if (key !== 'page') {
        next.page = 1
      }

      if (key === 'province_id' && value) {
        next.commune_id = ''
      }

      return next
    })
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((current) => ({
      ...current,
      page: Number.isFinite(page) && page > 0 ? page : 1,
    }))
  }, [])

  const setLocation = useCallback((lat: string, lng: string) => {
    setFilters((current) => ({
      ...current,
      lat,
      lng,
      page: 1,
    }))
  }, [])

  const clearLocation = useCallback(() => {
    setFilters((current) => ({
      ...current,
      lat: '',
      lng: '',
      page: 1,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const activeFilterCount = useMemo(() => {
    const geoActive = filters.lat && filters.lng ? 1 : 0
    const locationActive = filters.commune_id || filters.province_id ? 1 : 0

    return [
      filters.q,
      filters.category,
      locationActive ? 'location' : '',
      filters.price_min,
      filters.price_max,
      filters.condition,
      filters.troc,
      geoActive ? 'geo' : '',
      geoActive && filters.radius !== 20 ? 'radius' : '',
      filters.sort !== 'date' ? filters.sort : '',
    ].filter(Boolean).length
  }, [filters])

  return {
    filters,
    setFilter,
    setPage,
    setLocation,
    clearLocation,
    resetFilters,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
  }
}
