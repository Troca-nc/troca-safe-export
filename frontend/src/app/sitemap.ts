// src/app/sitemap.ts
// ── Sitemap.xml dynamique Next.js 14 ─────────────────────────────────────────
// Généré à la demande + revalidé toutes les heures via ISR
// Google indexe automatiquement /sitemap.xml

import type { MetadataRoute } from 'next'
import { SITE_URL, CATEGORIES_SEO } from '@/types/seo.types'

// Revalidation ISR : le sitemap est recalculé toutes les heures max
export const revalidate = 3600

// ── Fetch des annonces actives depuis l'API ───────────────────────────────────
// On récupère seulement les champs nécessaires pour le sitemap (léger)

interface AnnonceSitemapRow {
  id:         number
  updated_at: string
  categorie:  string
  images:     { url: string }[]
  titre:      string
}

async function fetchAnnoncesForSitemap(): Promise<AnnonceSitemapRow[]> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? `${SITE_URL}/api`
    const res = await fetch(`${apiBase}/annonces/sitemap`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const payload = await res.json()
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    return []
  } catch {
    return []
  }
}

// ── Sitemap principal ─────────────────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now      = new Date().toISOString()
  const annonces = await fetchAnnoncesForSitemap()

  // ── Pages statiques ───────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:        SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority:   1.0,
    },
    {
      url:        `${SITE_URL}/annonces`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority:   0.9,
    },
    {
      url:        `${SITE_URL}/annonces/nouvelle`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority:   0.8,
    },
    {
      url:        `${SITE_URL}/pro`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority:   0.7,
    },
    {
      url:        `${SITE_URL}/bons-plans`,
      lastModified: now,
      changeFrequency: 'daily',
      priority:   0.8,
    },
    {
      url:        `${SITE_URL}/evenements`,
      lastModified: now,
      changeFrequency: 'daily',
      priority:   0.8,
    },
    {
      url:        `${SITE_URL}/covoiturage`,
      lastModified: now,
      changeFrequency: 'daily',
      priority:   0.8,
    },
    {
      url:        `${SITE_URL}/connexion`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority:   0.3,
    },
    {
      url:        `${SITE_URL}/inscription`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority:   0.4,
    },
    {
      url:        `${SITE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority:   0.2,
    },
    {
      url:        `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority:   0.3,
    },
  ]

  // ── Pages catégories ──────────────────────────────────────────────────────
  const categoryPages: MetadataRoute.Sitemap = Object.keys(CATEGORIES_SEO).map(slug => ({
    url:        `${SITE_URL}/annonces/categorie/${slug}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority:   0.8,
  }))

  // ── Pages annonces individuelles ──────────────────────────────────────────
  const annoncesPages: MetadataRoute.Sitemap = annonces.map(a => ({
    url:        `${SITE_URL}/annonces/${a.id}`,
    lastModified: a.updated_at,
    changeFrequency: 'weekly' as const,
    priority:   0.6,
  }))

  return [...staticPages, ...categoryPages, ...annoncesPages]
}
