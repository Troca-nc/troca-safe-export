import type { MetadataRoute } from 'next'

import { normalizeApiBase } from '@/lib/apiBase'
import { SITE_URL } from '@/types/seo.types'

export const revalidate = 3600

type SitemapRow = {
  id: number | string
  updated_at?: string | null
}

async function fetchRows(url: string): Promise<SitemapRow[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } })
    if (!response.ok) return []
    const payload = await response.json()
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    return []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL ?? `${SITE_URL}/api`)
  const [listings, pros, events] = await Promise.all([
    fetchRows(`${apiBase}/listings?limit=1000&status=active`),
    fetchRows(`${apiBase}/pros?limit=1000`),
    fetchRows(`${apiBase}/events?status=published&limit=1000`),
  ])

  const now = new Date().toISOString()
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/annonces`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/troc`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/covoiturage`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/bons-plans`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/evenements`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/pro`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/pros`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/appels-offres`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/envoi-livraison`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/cgu`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/cgv`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/politique-cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/politique-de-confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const listingPages: MetadataRoute.Sitemap = listings.map((item) => ({
    url: `${SITE_URL}/annonces/${item.id}`,
    lastModified: item.updated_at ?? now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const proPages: MetadataRoute.Sitemap = pros.map((item) => ({
    url: `${SITE_URL}/pros/${item.id}`,
    lastModified: item.updated_at ?? now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const eventPages: MetadataRoute.Sitemap = events.map((item) => ({
    url: `${SITE_URL}/evenements/${item.id}`,
    lastModified: item.updated_at ?? now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...listingPages, ...proPages, ...eventPages]
}
