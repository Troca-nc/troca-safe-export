'use client'
// ============================================================
//  Troca — Composant "Annonces similaires"
//  Affiché en bas de la fiche annonce
//  Même catégorie + même commune en priorité, sinon même catégorie
// ============================================================

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, MapPin } from 'lucide-react'
import { listingsApi } from '@/lib/api'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'

interface Listing {
  id:           string
  titre?:       string
  title?:       string
  prix:         number | null
  commune_id?:  number | null
  commune_name: string | null
  cover_image?: string
  condition?:   string
  is_boosted?:  boolean
}

interface Props {
  annonceId:   string | number
  categorieId: number
  communeId?:  number | null
  titre:       string
}

const CONDITION_SHORT: Record<string, string> = {
  new:       'Neuf',
  like_new:  'Comme neuf',
  good:      'Bon état',
  fair:      'Correct',
  for_parts: 'Pièces',
}

export default function AnnonceSimilaires({ annonceId, categorieId, communeId, titre }: Props) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const params: Record<string, any> = {
      category_id: categorieId,
      limit:       8,
      sort:        'date',
      exclude_id:  annonceId, // le backend ignorera cette annonce dans les résultats
    }
    if (communeId) {
      params.commune_id = communeId
    }

    listingsApi.search(params)
      .then(({ data }) => {
        // Filtrer l'annonce actuelle côté client (double sécurité)
        const items = (data.data ?? []).filter((l: Listing) => String(l.id) !== String(annonceId))
        // Trier : même commune d'abord
        items.sort((a: Listing, b: Listing) => {
          const aLocal = communeId && Number(a.commune_id) === Number(communeId) ? 1 : 0
          const bLocal = communeId && Number(b.commune_id) === Number(communeId) ? 1 : 0
          return bLocal - aLocal
        })
        setListings(items.slice(0, 6))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [annonceId, categorieId, communeId])

  if (loading) {
    return (
      <section className="mt-10">
        <h2 className="font-semibold text-night text-lg mb-4">Annonces similaires</h2>
        <ListingSkeletonGrid count={6} className="grid-cols-2 md:grid-cols-3 gap-3" />
      </section>
    )
  }

  if (listings.length === 0) return null

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-night text-lg">Annonces similaires</h2>
        <Link
          href={`/annonces?category_id=${categorieId}`}
          className="text-sm text-coral hover:underline"
        >
          Voir tout →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {listings.map((l) => (
          <Link
            key={l.id}
            href={`/annonces/${l.id}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-night/5"
          >
            {/* Image */}
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
              {l.cover_image ? (
                <img
                  src={l.cover_image}
                  alt={l.titre ?? l.title ?? 'Annonce'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  🏷️
                </div>
              )}
              {l.is_boosted && (
                <span className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  TOP
                </span>
              )}
              {l.condition && (
                <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {CONDITION_SHORT[l.condition] ?? l.condition}
                </span>
              )}
            </div>

            {/* Infos */}
            <div className="p-3">
              <p className="text-sm font-medium text-night line-clamp-2 leading-tight mb-1">
                {l.titre ?? l.title}
              </p>
              <p className="text-base font-bold text-coral">
                {l.prix != null
                  ? `${l.prix.toLocaleString('fr-FR')} XPF`
                  : <span className="text-night/40 font-normal text-sm">Prix libre</span>
                }
              </p>
              {l.commune_name && (
                <p className="flex items-center gap-1 text-[11px] text-night/40 mt-1">
                  <MapPin size={10} />
                  {l.commune_name}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
