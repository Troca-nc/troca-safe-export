import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import Header from '@/components/layout/Header'
import { generateNoindexMetadata } from '@/lib/seoHelpers'
import { SITE_URL } from '@/types/seo.types'

import ProPublicClient from './ProPublicClient'
import { fetchProPublicProfile, fetchProPublicReviews } from '../publicStorefrontData'

function buildDisplayName(profile: NonNullable<Awaited<ReturnType<typeof fetchProPublicProfile>>>) {
  return (
    profile.display_name
    || profile.pro_company_name
    || [profile.prenom, profile.nom].filter(Boolean).join(' ').trim()
    || 'Professionnel Troca'
  )
}

function buildDescription(profile: NonNullable<Awaited<ReturnType<typeof fetchProPublicProfile>>>, displayName: string) {
  const parts = [
    profile.pro_category ? `${profile.pro_category}` : null,
    profile.pro_commune ? `à ${profile.pro_commune}` : null,
    profile.product_count ? `${profile.product_count} produit${Number(profile.product_count) > 1 ? 's' : ''} dans son catalogue` : null,
    profile.pro_description ? profile.pro_description.replace(/\s+/g, ' ').trim() : null,
  ].filter(Boolean)

  const base = `${displayName} sur Troca.`
  const description = parts.length > 0
    ? `${base} ${parts.join(' • ')}`
    : `${base} Découvrez sa vitrine professionnelle, ses annonces et ses avis.`

  return description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const profile = await fetchProPublicProfile(id)

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

export default async function ProPublicPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [profile, reviews] = await Promise.all([
    fetchProPublicProfile(id),
    fetchProPublicReviews(id, 20),
  ])

  if (!profile) {
    notFound()
  }

  return (
    <>
      <Header />
      <ProPublicClient
        proId={id}
        initialProfile={profile}
        initialReviews={reviews}
      />
    </>
  )
}
