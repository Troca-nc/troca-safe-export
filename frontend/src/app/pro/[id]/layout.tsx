import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { generateNoindexMetadata } from '@/lib/seoHelpers'
import { SITE_URL } from '@/types/seo.types'

type ProProfilePayload = {
  data?: {
    id?: number | string
    prenom?: string | null
    nom?: string | null
    display_name?: string | null
    pro_company_name?: string | null
    pro_category?: string | null
    pro_commune?: string | null
    pro_description?: string | null
    avg_rating?: number | null
    review_count?: number | null
    listing_count?: number | null
  }
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? `${SITE_URL}/api`).replace(/\/$/, '')

async function fetchProProfile(id: string) {
  try {
    const res = await fetch(`${API_BASE}/pro/${id}`, {
      next: { revalidate: 300 },
    })

    if (!res.ok) return null

    const payload = (await res.json()) as ProProfilePayload
    return payload?.data ?? null
  } catch {
    return null
  }
}

function buildDisplayName(profile: NonNullable<Awaited<ReturnType<typeof fetchProProfile>>>) {
  return (
    profile.display_name
    || profile.pro_company_name
    || [profile.prenom, profile.nom].filter(Boolean).join(' ').trim()
    || 'Professionnel Troca'
  )
}

function buildDescription(profile: NonNullable<Awaited<ReturnType<typeof fetchProProfile>>>, displayName: string) {
  const parts = [
    profile.pro_category ? `${profile.pro_category}` : null,
    profile.pro_commune ? `à ${profile.pro_commune}` : null,
    profile.pro_description ? profile.pro_description.replace(/\s+/g, ' ').trim() : null,
  ].filter(Boolean)

  const base = `${displayName} sur Troca.`
  const description = parts.length > 0 ? `${base} ${parts.join(' • ')}` : `${base} Découvrez sa vitrine professionnelle, ses annonces et ses avis.`

  return description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const profile = await fetchProProfile(id)

  if (!profile) {
    return generateNoindexMetadata('Vitrine professionnelle introuvable')
  }

  const displayName = buildDisplayName(profile)
  const title = `${displayName} — Vitrine Pro | Troca`
  const description = buildDescription(profile, displayName)
  const canonical = `${SITE_URL}/pro/${id}`

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Troca',
      locale: 'fr_NC',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function ProPublicLayout(
  { children, params }: { children: ReactNode; params: Promise<{ id: string }> }
) {
  const { id } = await params
  const profile = await fetchProProfile(id)

  if (!profile) {
    notFound()
  }

  return children
}
