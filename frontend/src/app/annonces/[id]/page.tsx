// ============================================================
//  Troca — Page détail annonce
//  Server Component pour generateMetadata + Open Graph
//  Le rendu interactif est délégué à AnnonceDetail (client)
// ============================================================

import type { Metadata } from 'next'
import { notFound }      from 'next/navigation'
import Header            from '@/components/layout/Header'
import AnnonceDetail     from '@/components/annonces/AnnonceDetail'
import JsonLd            from '@/components/seo/JsonLd'
import { generateAnnonceMetadata } from '@/lib/seoHelpers'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

// ── Fetch serveur (shared between generateMetadata + page) ────
async function fetchAnnonce(id: string) {
  try {
    const res = await fetch(`${API}/listings/${id}`, {
      next: { revalidate: 60 }, // ISR : revalide toutes les 60 s
    })
    if (!res.ok) return null
    const { data } = await res.json()
    return data
  } catch {
    return null
  }
}

// ── Open Graph dynamique ──────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const annonce = await fetchAnnonce(id)
  if (!annonce) {
    return {
      title: 'Annonce introuvable | Troca',
      robots: { index: false },
    }
  }

  return generateAnnonceMetadata({
    id:          annonce.id,
    titre:       annonce.titre,
    description: annonce.description,
    prix:        annonce.prix,
    commune:     annonce.commune_name ?? '',
    categorie:   annonce.category_name ?? '',
    images:      annonce.images ?? [],
    user:        { prenom: annonce.user?.prenom ?? '', verifie: !!annonce.user?.verifie },
    created_at:  annonce.created_at ?? '',
    updated_at:  annonce.updated_at ?? '',
  })
}

// ── Page ──────────────────────────────────────────────────────
export default async function ListingDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const annonce = await fetchAnnonce(id)
  if (!annonce) notFound()

  // JSON-LD schema.org Product pour le référencement Google Shopping
  const jsonLdData: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type':    'Product',
      name:        annonce.titre,
      description: annonce.description?.slice(0, 300),
      image:       annonce.images?.map((i: any) => i.url) ?? [],
      url:         `https://troca.nc/annonces/${annonce.id}`,
      ...(annonce.prix && {
        offers: {
          '@type':       'Offer',
          price:          annonce.prix,
          priceCurrency: 'XPF',
          availability:  'https://schema.org/InStock',
          seller: {
            '@type': 'Person',
            name:    annonce.user?.prenom ?? 'Vendeur',
          },
        },
      }),
    },
    {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil',    item: 'https://troca.nc' },
        { '@type': 'ListItem', position: 2, name: 'Annonces',   item: 'https://troca.nc/annonces' },
        { '@type': 'ListItem', position: 3, name: annonce.titre, item: `https://troca.nc/annonces/${annonce.id}` },
      ],
    },
  ]

  return (
    <>
      <JsonLd data={jsonLdData} />
      <Header />
      {/* AnnonceDetail est un Client Component — il reçoit les données prefetchées */}
      <AnnonceDetail initialData={annonce} id={id} />
    </>
  )
}
