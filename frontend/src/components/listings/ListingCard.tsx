'use client'
// src/components/listings/ListingCard.tsx

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Heart, MapPin, Clock, MailCheck, Phone, ShieldCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '@/store/authStore'
import { useFavorite } from '@/hooks/useFavorite'
import ListingImage from '@/components/ListingImage'
import PlanBadge from '@/components/PlanBadge'
import { consumePendingAuthAction, peekPendingAuthAction } from '@/lib/authAction'
import { useAuthActionStore } from '@/store/authActionStore'
export { ListingSkeleton as ListingCardSkeleton, ListingSkeletonGrid as ListingGridSkeleton } from '@/components/ListingSkeleton'

interface Listing {
  id: string
  title: string
  price: number | null
  price_negotiable: boolean
  is_free: boolean
  condition?: string
  is_featured: boolean
  is_urgent: boolean
  published_at?: string
  created_at?: string
  boosted_until?: string | null
  contre_quoi?: string | null
  commune_name?: string
  category_name?: string
  category_icon?: string
  cover_image?: string
  distance_km?: number | null
  user_rating?: number
  seller_trust_score?: number
  seller_email_verified?: boolean
  seller_phone_verified?: boolean
  is_pro?: boolean
}

interface Props {
  listing: Listing
  className?: string
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'Correct',
  for_parts: 'Pour pièces',
}

function CoverImage({ src, alt, icon }: { src?: string; alt: string; icon?: string }) {
  return (
    <ListingImage
      src={src}
      alt={alt}
      fallbackIcon={icon}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      imgClassName="group-hover:scale-105 transition-all duration-300"
    />
  )
}

export default function ListingCard({ listing, className = '' }: Props) {
  const { isAuthenticated } = useAuthStore()
  const { isFavorited, toggleFavorite, isToggling } = useFavorite()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const replayedRef = useRef(false)

  const saved = isFavorited(listing.id)
  const isLoading = isToggling.has(listing.id)

  useEffect(() => {
    replayedRef.current = false
  }, [listing.id])

  useEffect(() => {
    if (!isAuthenticated || replayedRef.current) return

    const pending = peekPendingAuthAction()
    if (!pending || pending.type !== 'favorite_listing' || pending.listingId !== listing.id) return

    replayedRef.current = true
    consumePendingAuthAction()
    void toggleFavorite({
      id: listing.id,
      titre: listing.title,
      prix: listing.price,
      cover_image: listing.cover_image ?? null,
      commune: listing.commune_name ?? null,
      category: listing.category_name ?? null,
    })
  }, [isAuthenticated, listing.category_name, listing.commune_name, listing.cover_image, listing.id, listing.price, listing.title, toggleFavorite])

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : `/annonces/${listing.id}`
      openAuthModal({
        type: 'favorite_listing',
        listingId: listing.id,
        redirectTo,
      })
      return
    }

    await toggleFavorite({
      id: listing.id,
      titre: listing.title,
      prix: listing.price,
      cover_image: listing.cover_image ?? null,
      commune: listing.commune_name ?? null,
      category: listing.category_name ?? null,
    })
  }

  const formatPrice = () => {
    if (listing.is_free) return <span className="text-jungle font-bold">Gratuit 🎁</span>
    if (!listing.price) return <span className="text-night/50 italic text-sm">Prix à débattre</span>
    return (
      <span className="font-bold text-night">
        {listing.price.toLocaleString('fr-FR')}{' '}
        <span className="text-sm font-normal text-night/60">XPF</span>
      </span>
    )
  }

  const publishedAt = listing.published_at ?? listing.created_at ?? new Date().toISOString()
  const timeAgo = formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
    locale: fr,
  })

  const boosted = listing.is_featured || Boolean(listing.boosted_until && new Date(listing.boosted_until) > new Date())

  return (
    <Link href={`/annonces/${listing.id}`} className={`card block overflow-hidden group ${className}`}>
      <div className="relative aspect-[4/3] bg-sand overflow-hidden">
        <CoverImage src={listing.cover_image} alt={listing.title} icon={listing.category_icon} />

        {listing.contre_quoi && (
          <span className="badge absolute bottom-2 left-2 bg-night text-white text-[10px] flex items-center gap-0.5">
            ↻ Troc
          </span>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {boosted && <span className="badge bg-coral text-white text-[10px]">⭐ À la une</span>}
          {listing.is_urgent && <span className="badge bg-amber-500 text-white text-[10px]">⚡ Urgent</span>}
          {listing.is_pro ? <PlanBadge className="shadow-sm" /> : null}
        </div>

        <button
          onClick={handleFavorite}
          disabled={isLoading}
          aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={`absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-all ${
            isLoading ? 'opacity-50 cursor-wait' : 'hover:scale-110 active:scale-95'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              saved ? 'fill-coral text-coral scale-110' : 'text-night/40 hover:text-coral/60'
            }`}
          />
        </button>
      </div>

      <div className="p-3">
        <h3 className="font-medium text-night text-sm leading-tight line-clamp-2 mb-1.5 group-hover:text-coral transition-colors">
          {listing.title}
        </h3>

        {listing.distance_km != null && (
          <p className="mb-1 text-[11px] font-medium text-ocean">
            À {Math.round(listing.distance_km)} km
          </p>
        )}

        <div className="text-base mb-2">{formatPrice()}</div>

        {(listing.seller_email_verified || listing.seller_phone_verified || listing.seller_trust_score != null) && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {listing.seller_email_verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-ocean/20 bg-ocean/8 px-2 py-0.5 text-[10px] font-medium text-ocean">
                <MailCheck className="w-3 h-3" />
                Email vérifié
              </span>
            )}
            {listing.seller_phone_verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-jungle/20 bg-jungle/8 px-2 py-0.5 text-[10px] font-medium text-jungle">
                <Phone className="w-3 h-3" />
                Téléphone vérifié
              </span>
            )}
            {listing.seller_trust_score != null && (
              <span className="inline-flex items-center gap-1 rounded-full border border-night/10 bg-night/[0.03] px-2 py-0.5 text-[10px] font-medium text-night/60">
                <ShieldCheck className="w-3 h-3" />
                Confiance {Math.round(listing.seller_trust_score)}/100
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-night/45">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {listing.commune_name || 'Nouvelle-Calédonie'}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        </div>

        {listing.condition && (
          <div className="mt-1.5">
            <span className="badge bg-sand text-night/60 text-[10px]">
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
