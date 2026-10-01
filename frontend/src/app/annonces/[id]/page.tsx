// ============================================================
//  Kalico — Page détail annonce
//  Server Component pour generateMetadata + Open Graph
//  Le rendu interactif est délégué à AnnonceDetail (client)
// ============================================================

import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound }      from 'next/navigation'
import Header            from '@/components/layout/Header'
import AnnonceDetail     from '@/components/annonces/AnnonceDetail'
import JsonLd            from '@/components/seo/JsonLd'
import { generateAnnonceMetadata } from '@/lib/seoHelpers'
import { SITE_URL } from '@/types/seo.types'
import { getListingDetail, getListingReviews, getSimilarListings, ListingNotFoundError } from '@/lib/data/listings'

const fetchAnnonce = cache(getListingDetail)

// ── Open Graph dynamique ──────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const annonce = await fetchAnnonce(id).catch(() => null)
  if (!annonce) {
    return {
      title: 'Annonce introuvable | Kalico',
      robots: { index: false },
    }
  }

  return generateAnnonceMetadata({
    id:          annonce.id,
    titre:       annonce.title,
    description: annonce.description,
    prix:        annonce.price,
    commune:     annonce.commune_name ?? '',
    categorie:   annonce.category_name ?? '',
    images:      annonce.images,
    user:        { prenom: annonce.seller.first_name, verifie: annonce.seller.email_verified || annonce.seller.phone_verified },
    created_at:  annonce.created_at ?? '',
    updated_at:  annonce.updated_at ?? '',
  })
}

// ── Page ──────────────────────────────────────────────────────
export default async function ListingDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let annonce
  try {
    annonce = await fetchAnnonce(id)
  } catch (error) {
    if (error instanceof ListingNotFoundError) notFound()
    throw error
  }
  const [reviews, similarListings] = await Promise.all([
    getListingReviews(annonce.seller.id).catch(() => []),
    getSimilarListings(annonce).catch(() => []),
  ])

  // JSON-LD schema.org Product pour le référencement Google Shopping
  const jsonLdData: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type':    'Product',
      name:        annonce.title,
      description: annonce.description?.slice(0, 300),
      image:       annonce.images.map((image) => image.url),
      url:         `${SITE_URL}/annonces/${annonce.id}`,
      ...(annonce.price && {
        offers: {
          '@type':       'Offer',
          price:          annonce.price,
          priceCurrency: 'XPF',
          availability:  'https://schema.org/InStock',
          seller: {
            '@type': 'Person',
            name:    annonce.seller.first_name,
          },
        },
      }),
    },
    {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil',    item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Annonces',   item: `${SITE_URL}/annonces` },
        { '@type': 'ListItem', position: 3, name: annonce.title, item: `${SITE_URL}/annonces/${annonce.id}` },
      ],
    },
  ]

  return (
    <>
      <JsonLd data={jsonLdData} />
      <Header />
      <AnnonceDetail listing={annonce} reviews={reviews} similarListings={similarListings} />
    </>
  )
}
