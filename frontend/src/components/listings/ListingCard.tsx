'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Clock, Heart, MailCheck, MapPin, Phone, ShieldCheck, Star } from 'lucide-react'
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
  type?: string
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
  is_troc?: boolean
  commune_name?: string
  category_name?: string
  category_slug?: string
  category_icon?: string
  cover_image?: string
  distance_km?: number | null
  metadata?: Record<string, unknown>
  user_rating?: number
  seller_trust_score?: number
  seller_email_verified?: boolean
  seller_phone_verified?: boolean
  is_pro?: boolean
  seller_prenom?: string | null
  seller_nom?: string | null
  seller_avatar?: string | null
  seller_is_online?: boolean
  seller_last_seen_label?: string | null
  seller_avg_response_time_label?: string | null
  seller_note_moyenne?: number | null
  seller_nb_avis?: number | null
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

const blurPlaceholder = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getListingCategoryLabel(listing: Listing) {
  if (listing.category_name) return listing.category_name
  const slug = String(listing.category_slug ?? '').replaceAll('_', ' ')
  if (!slug) return 'Annonce'
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

function getListingBadgeClass(listing: Listing) {
  const kind = String(listing.type || '').trim().toLowerCase()
  if (kind === 'bon_plan') return 'badge-emeraude'
  if (kind === 'covoiturage') return 'badge-corail'
  if (kind === 'evenement') return 'badge-sable'
  return 'badge-lagon'
}

function getListingFrameClass(listing: Listing) {
  const kind = String(listing.type || '').trim().toLowerCase()
  if (kind === 'bon_plan') return 'border-l-nc-emeraude'
  if (kind === 'covoiturage') return 'border-l-nc-corail'
  if (kind === 'evenement') return 'border-l-nc-sable'
  return 'border-l-nc-lagon'
}

function buildInitials(listing: Listing) {
  const first = (listing.seller_prenom ?? '').trim().charAt(0)
  const last = (listing.seller_nom ?? '').trim().charAt(0)
  const fallback = (listing.title ?? '').trim().charAt(0)
  return `${first}${last}`.trim() || fallback || 'T'
}

function SellerAvatar({ listing }: { listing: Listing }) {
  const initials = buildInitials(listing).toUpperCase()

  if (listing.seller_avatar) {
    return (
      <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/80 bg-sand">
        <Image
          src={listing.seller_avatar}
          alt=""
          fill
          sizes="36px"
          loading="lazy"
          className="object-cover"
        />
      </span>
    )
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/80 bg-coral/10 text-xs font-bold text-coral">
      {initials}
    </span>
  )
}

function ListingImageFrame({
  listing,
  loaded,
  setLoaded,
  saved,
  isLoading,
  onFavorite,
}: {
  listing: Listing
  loaded: boolean
  setLoaded: (value: boolean) => void
  saved: boolean
  isLoading: boolean
  onFavorite: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const boosted = listing.is_featured || Boolean(listing.boosted_until && new Date(listing.boosted_until) > new Date())

  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-sand">
      {listing.cover_image ? (
        <ListingImage
          src={listing.cover_image}
          alt={listing.title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL={blurPlaceholder}
          onLoadingComplete={() => setLoaded(true)}
          imgClassName={`transition-transform duration-300 group-hover:scale-[1.04] ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <ListingImage
          src={null}
          alt={listing.title}
          fallbackIcon={listing.category_icon}
        />
      )}

      {listing.cover_image && !loaded ? <div className="skeleton absolute inset-0 rounded-none" aria-hidden="true" /> : null}

      <div className="absolute left-3 top-3 z-10 flex max-w-[70%] flex-wrap gap-2">
        <span className={`badge text-[10px] shadow-sm backdrop-blur-sm ${getListingBadgeClass(listing)}`}>
          {getListingCategoryLabel(listing)}
        </span>
        {listing.is_troc || listing.contre_quoi ? (
          <span className="badge bg-night/90 text-[10px] text-white shadow-sm backdrop-blur-sm">
            ↔ Troc
          </span>
        ) : null}
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
        {boosted ? <span className="badge badge-warning bg-white/90 text-[10px] shadow-sm backdrop-blur-sm">⭐ Boosté</span> : null}
      </div>

      <button
        type="button"
        onClick={onFavorite}
        disabled={isLoading}
        aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className={`absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-night/50 shadow-md backdrop-blur-sm transition duration-150 hover:scale-110 active:scale-95 ${
          isLoading ? 'cursor-wait opacity-50' : ''
        }`}
      >
        <Heart className={`h-3.5 w-3.5 ${saved ? 'fill-coral text-coral' : ''}`} />
      </button>
    </div>
  )
}

export default function ListingCard({ listing, className = '' }: Props) {
  const { isAuthenticated } = useAuthStore()
  const { isFavorited, toggleFavorite, isToggling } = useFavorite()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const replayedRef = useRef(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const saved = isFavorited(listing.id)
  const isLoading = isToggling.has(listing.id)

  useEffect(() => {
    replayedRef.current = false
    setImageLoaded(false)
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
  }, [
    isAuthenticated,
    listing.category_name,
    listing.commune_name,
    listing.cover_image,
    listing.id,
    listing.price,
    listing.title,
    toggleFavorite,
  ])

  const handleFavorite = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

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
    if (listing.is_free) {
      return <span className="text-jungle">Gratuit</span>
    }

    if (!listing.price) {
      return <span className="text-night/50 text-sm italic">Prix à débattre</span>
    }

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

  const sellerName =
    [listing.seller_prenom, listing.seller_nom].filter(Boolean).join(' ').trim() ||
    'Vendeur Troca'

  const isConditionVisible = Boolean(listing.condition && CONDITION_LABELS[listing.condition])
  const locationText = listing.commune_name || 'Nouvelle-Calédonie'

  return (
    <Link
      href={`/annonces/${listing.id}`}
      className={`group card card-hover block overflow-hidden rounded-[12px] border-night/10 border-l-4 ${getListingFrameClass(listing)} bg-white/96 p-0 shadow-sm ${className}`}
    >
      <ListingImageFrame
        listing={listing}
        loaded={imageLoaded}
        setLoaded={setImageLoaded}
        saved={saved}
        isLoading={isLoading}
        onFavorite={handleFavorite}
      />

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-6 text-night transition-colors duration-150 group-hover:text-coral">
            {listing.title}
          </h3>
          <div className="text-[24px] font-bold leading-tight text-night">
            {formatPrice()}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-night/55">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{locationText}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <SellerAvatar listing={listing} />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-sm font-semibold text-night">{sellerName}</p>
                {listing.is_pro ? <PlanBadge className="shrink-0" /> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-night/50">
                {listing.seller_email_verified ? (
                  <span className="inline-flex items-center gap-1">
                    <MailCheck className="h-3 w-3" />
                    Email vérifié
                  </span>
                ) : null}
                {listing.seller_phone_verified ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Téléphone vérifié
                  </span>
                ) : null}
                {listing.seller_trust_score != null ? (
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {Math.round(listing.seller_trust_score)}/100
                  </span>
                ) : null}
                {isConditionVisible ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-night/65">
                    {CONDITION_LABELS[listing.condition!]}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                  listing.seller_is_online ? 'bg-emerald-50 text-emerald-700' : 'bg-sand text-night/45'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${listing.seller_is_online ? 'bg-emerald-500' : 'bg-night/25'}`} />
                  {listing.seller_is_online ? 'En ligne' : (listing.seller_last_seen_label ?? 'Hors ligne')}
                </span>
                {listing.seller_avg_response_time_label && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-nc-lagonLight px-2 py-0.5 font-medium text-nc-lagonText">
                    <Clock className="h-3 w-3" />
                    {listing.seller_avg_response_time_label}
                  </span>
                )}
                {typeof listing.seller_note_moyenne === 'number' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-nc-emeraudeLight px-2 py-0.5 font-medium text-nc-emeraudeText">
                    <Star className="h-3 w-3 fill-current" />
                    {listing.seller_note_moyenne.toFixed(1)}/5
                    <span className="text-current/70">({listing.seller_nb_avis ?? 0})</span>
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Link>
  )
}
