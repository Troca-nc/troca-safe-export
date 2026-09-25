'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Clock, Heart, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '@/store/authStore'
import { useFavorite } from '@/hooks/useFavorite'
import ListingImage from '@/components/ListingImage'
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
  seller_is_pro?: boolean
  seller_pro_verified?: boolean
  seller_prenom?: string | null
  seller_nom?: string | null
  seller_avatar?: string | null
  author?: {
    is_pro?: boolean
    pro_verified?: boolean
  } | null
  seller_is_online?: boolean
  seller_last_seen_label?: string | null
  seller_avg_response_time_label?: string | null
  seller_note_moyenne?: number | null
  seller_nb_avis?: number | null
}

interface Props {
  listing: Listing
  className?: string
  boosted?: boolean
  featured?: boolean
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
function getListingCategoryInitial(listing: Listing) {
  const label = getListingCategoryLabel(listing)
  return label.trim().charAt(0).toUpperCase() || 'A'
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
      <span className="relative flex h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
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
    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[var(--color-info-border)] bg-[var(--color-info-soft)] text-xs font-semibold text-[var(--color-info-text)]">
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
  featuredCard,
}: {
  listing: Listing
  loaded: boolean
  setLoaded: (value: boolean) => void
  saved: boolean
  isLoading: boolean
  onFavorite: (event: React.MouseEvent<HTMLButtonElement>) => void
  featuredCard: boolean
}) {
  const hasCoverImage = Boolean(listing.cover_image)
  const categoryInitial = getListingCategoryInitial(listing)
  const [imageTimedOut, setImageTimedOut] = useState(false)
  const priceLabel = listing.is_free
    ? 'Gratuit'
    : listing.price
      ? `${listing.price.toLocaleString('fr-FR')} XPF`
      : 'Prix à débattre'

  useEffect(() => {
    if (!hasCoverImage) return undefined

    setImageTimedOut(false)
    const timer = window.setTimeout(() => setImageTimedOut(true), 8_000)
    return () => window.clearTimeout(timer)
  }, [hasCoverImage, listing.id])

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-sunken)]">
      {hasCoverImage ? (
        <ListingImage
          src={listing.cover_image}
          alt={listing.title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL={blurPlaceholder}
          onLoadingComplete={() => setLoaded(true)}
          imgClassName={`h-full w-full object-cover transition-opacity duration-150 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <div className="motif-tressage flex h-full w-full items-center justify-center bg-[var(--color-surface-sunken)]">
          <span className="font-display text-6xl font-normal text-[var(--color-text-faint)]">{categoryInitial}</span>
        </div>
      )}

      {hasCoverImage && !loaded && !imageTimedOut ? <div className="skeleton absolute inset-0 rounded-none" aria-hidden="true" /> : null}

      {featuredCard ? (
        <>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(14,42,49,0.72))]" />
          <div className="absolute bottom-3 left-3 z-10 font-display text-2xl font-normal text-[var(--color-on-deep)]">{priceLabel}</div>
          <div className="absolute left-3 top-3 z-10 rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-[var(--color-deep)]">
            À la une
          </div>
        </>
      ) : null}

      <button
        type="button"
        onClick={onFavorite}
        disabled={isLoading}
        aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className={`absolute bottom-3 right-3 z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(254,250,243,0.92)] text-[var(--color-text-muted)] shadow-[var(--shadow-card)] transition-colors hover:text-[var(--color-accent-text)] ${
          isLoading ? 'cursor-wait opacity-50' : ''
        }`}
      >
        <Heart className={`h-4 w-4 ${saved ? 'fill-[var(--color-accent)] text-[var(--color-accent-text)]' : ''}`} />
      </button>
    </div>
  )
}
export default function ListingCard({ listing, className = '', boosted, featured }: Props) {
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

  const priceText = listing.is_free
    ? 'Gratuit'
    : listing.price
      ? `${listing.price.toLocaleString('fr-FR')} XPF`
      : 'Prix à débattre'
  const priceClassName = listing.is_free ? 'text-[var(--color-success-text)]' : 'text-[var(--color-text-primary)]'

  const publishedAt = listing.published_at ?? listing.created_at ?? new Date().toISOString()
  const timeAgo = formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
    locale: fr,
  })

  const sellerName =
    [listing.seller_prenom, listing.seller_nom].filter(Boolean).join(' ').trim() ||
    'Vendeur Kalico'

  const isConditionVisible = Boolean(listing.condition && CONDITION_LABELS[listing.condition])
  const locationZone = typeof listing.metadata?.quartier_zone === 'string' ? String(listing.metadata.quartier_zone).trim() : ''
  const locationText = listing.commune_name
              ? `${listing.commune_name}${locationZone ? ` · ${locationZone}` : ''}`
    : 'Nouvelle-Calédonie'
  const isProVerified = Boolean(
    (listing.author?.is_pro && listing.author?.pro_verified)
    || (listing.is_pro && listing.seller_pro_verified)
    || (listing.seller_is_pro && listing.seller_pro_verified)
  )

  const level2 = Boolean((featured ?? boosted ?? listing.is_featured) || Boolean(listing.boosted_until && new Date(listing.boosted_until) > new Date()))

  return (
    <Link
      href={`/annonces/${listing.id}`}
      className={`group block overflow-hidden rounded-[var(--radius-card)] border bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--color-border-strong)] ${
        level2 ? 'border-l-[3px] border-l-[var(--color-accent)]' : 'border-[var(--color-border)]'
      } ${className}`}
    >
      <ListingImageFrame
        listing={listing}
        loaded={imageLoaded}
        setLoaded={setImageLoaded}
        saved={saved}
        isLoading={isLoading}
        onFavorite={handleFavorite}
        featuredCard={level2}
      />

      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-[1.55] text-[var(--color-text-primary)]">
            {listing.title}
          </h3>
          {level2 ? null : (
            <div className={`font-display text-[30px] font-normal leading-none ${priceClassName}`}>
              {priceText}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-[13px] text-[var(--color-text-muted)]">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--color-info-text)]" />
            <span className="truncate">{locationText}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-inner)] pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <SellerAvatar listing={listing} />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{sellerName}</p>
                {isProVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-success-text)]">
                    <BadgeCheck className="h-3 w-3" />
                    Pro
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-subtle)]">
                {isConditionVisible ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-muted)]">
                    {CONDITION_LABELS[listing.condition!]}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                {listing.seller_avg_response_time_label && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-info-border)] bg-[var(--color-info-soft)] px-2 py-0.5 font-medium text-[var(--color-info-text)]">
                    <Clock className="h-3 w-3" />
                    {listing.seller_avg_response_time_label}
                  </span>
                )}
                {!isProVerified && typeof listing.seller_note_moyenne === 'number' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-2 py-0.5 font-medium text-[var(--color-accent-text)]">
                    <BadgeCheck className="h-3 w-3" />
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
