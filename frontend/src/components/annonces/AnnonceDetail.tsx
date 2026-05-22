'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Heart } from 'lucide-react'
import { listingsApi, messagesApi, usersApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useFavorite } from '@/hooks/useFavorite'
import ShareButton from '@/components/annonces/ShareButton'
import {
  ListingHeroCard,
  RelatedSearchesSection,
  ReviewFormSection,
  SellerListingsSection,
  SellerReviewsSection,
  SecurityTipsCard,
  SellerSidebar,
} from '@/components/annonces/AnnonceDetailSections'

type ListingImage = {
  id: number
  url: string
  thumbnail_url?: string | null
  medium_url?: string | null
  original_url?: string | null
}

type ListingUser = {
  id: number
  prenom: string
  nom: string
  avatar_url?: string | null
  is_pro: boolean
  note_moyenne?: number | null
  nb_avis?: number | null
  nb_annonces?: number | null
  created_at?: string | null
  seller_commune_name?: string | null
  seller_province_name?: string | null
  email_verified?: boolean
  telephone_verifie?: boolean
  trust_score?: number | null
  trust_level?: string | null
}

export type ListingDetail = {
  id: number | string
  title: string
  price: number | null
  price_negotiable: boolean
  is_free: boolean
  description: string
  condition: string
  status: string
  is_featured?: boolean
  is_urgent?: boolean
  nb_vues?: number
  nb_favoris?: number
  commune_id?: number | null
  commune_name?: string | null
  commune_slug?: string | null
  category_id?: number | null
  category_name?: string | null
  category_slug?: string | null
  category_icon?: string | null
  published_at?: string
  contre_quoi?: string | null
  images?: ListingImage[]
  user: ListingUser
  is_favorited?: boolean
}

type SellerListing = {
  id: number | string
  title?: string
  titre?: string
  prix?: number | null
  price?: number | null
  commune_name?: string | null
  category_icon?: string | null
  cover_image?: string | null
}

type SellerReview = {
  id: number
  note: number
  commentaire?: string | null
  created_at?: string
  auteur_prenom?: string
  auteur_avatar?: string | null
}

interface Props {
  id: string
  initialData?: ListingDetail | null
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon etat',
  fair: 'Correct',
  for_parts: 'Pour pieces',
}

const TRUST_LABELS: Record<string, { label: string; className: string }> = {
  excellent: { label: 'Vendeur de confiance', className: 'bg-jungle/10 text-jungle border-jungle/20' },
  bon: { label: 'Vendeur fiable', className: 'bg-teal-50 text-teal-700 border-teal-100' },
  moyen: { label: 'Profil en cours', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  faible: { label: 'Profil sensible', className: 'bg-red-50 text-red-600 border-red-100' },
  inconnu: { label: 'Non evalue', className: 'bg-sand text-night/60 border-night/10' },
}

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'pour', 'avec', 'sur', 'dans',
  'au', 'aux', 'a', 'ab', 'version', 'modele', 'neuf', 'bon', 'etat',
])

function formatDate(value?: string) {
  if (!value) return ''
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: fr })
  } catch {
    return ''
  }
}

function buildAssociatedSearches(listing: ListingDetail) {
  const searches: Array<{ label: string; href: string; tone: string }> = []
  const rawTokens = (listing.title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))

  if (listing.category_name && listing.category_id) {
    searches.push({
      label: listing.category_name,
      href: `/annonces?category_id=${listing.category_id}`,
      tone: 'bg-night text-white',
    })
  }

  if (listing.commune_name && listing.commune_id) {
    searches.push({
      label: listing.commune_name,
      href: `/annonces?commune_id=${listing.commune_id}`,
      tone: 'bg-ocean/10 text-ocean',
    })
  }

  rawTokens.slice(0, 4).forEach((token, index) => {
    searches.push({
      label: token,
      href: `/annonces?q=${encodeURIComponent(token)}`,
      tone: index % 2 === 0 ? 'bg-coral/10 text-coral' : 'bg-sand text-night',
    })
  })

  if (listing.price) {
    const min = Math.max(0, Math.floor(listing.price * 0.75))
    const max = Math.floor(listing.price * 1.25)
    searches.push({
      label: `${min.toLocaleString('fr-FR')} - ${max.toLocaleString('fr-FR')} XPF`,
      href: `/annonces?price_min=${min}&price_max=${max}`,
      tone: 'bg-jungle/10 text-jungle',
    })
  }

  return searches.slice(0, 7)
}

export default function AnnonceDetail({ id, initialData }: Props) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { isFavorited, toggleFavorite } = useFavorite()
  const [listing, setListing] = useState<ListingDetail | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)
  const [activeImage, setActiveImage] = useState(0)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sellerListings, setSellerListings] = useState<SellerListing[]>([])
  const [sellerReviews, setSellerReviews] = useState<SellerReview[]>([])
  const [sellerLoading, setSellerLoading] = useState(false)
  const [reviewNote, setReviewNote] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setListing(initialData)
      setLoading(false)
      return
    }

    let alive = true
    setLoading(true)
    listingsApi.getById(id)
      .then(({ data }) => {
        if (!alive) return
        setListing(data.data ?? null)
        setError(null)
      })
      .catch(() => {
        if (alive) setError('Impossible de charger cette annonce.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [id, initialData])

  useEffect(() => {
    setActiveImage(0)
  }, [listing?.id])

  useEffect(() => {
    if (!listing?.user?.id) return

    let alive = true
    setSellerLoading(true)

    const loadSellerContext = async () => {
      try {
        const [listingsRes, reviewsRes] = await Promise.all([
          usersApi.getUserListings(String(listing.user.id)),
          usersApi.getReviews(String(listing.user.id)),
        ])

        if (!alive) return
        const items = (listingsRes.data?.data ?? listingsRes.data ?? []).filter(
          (item: SellerListing) => String(item.id) !== String(listing.id)
        )
        setSellerListings(items)
        setSellerReviews(reviewsRes.data?.data ?? reviewsRes.data ?? [])
      } catch {
        if (alive) {
          setSellerListings([])
          setSellerReviews([])
        }
      } finally {
        if (alive) setSellerLoading(false)
      }
    }

    loadSellerContext()
    return () => {
      alive = false
    }
  }, [listing?.id, listing?.user?.id])

  const currentUserId = user ? String(user.id) : null
  const ownerId = listing ? String(listing.user.id) : null
  const isOwner = Boolean(listing && currentUserId === ownerId)
  const saved = listing ? isFavorited(String(listing.id)) || Boolean(listing.is_favorited) : false
  const images = listing?.images ?? []
  const activeCover = images[activeImage]?.medium_url
    ?? images[activeImage]?.url
    ?? images[0]?.medium_url
    ?? images[0]?.url
    ?? null
  const associatedSearches = useMemo(() => (listing ? buildAssociatedSearches(listing) : []), [listing])
  const primaryCategoryHref = listing?.category_id ? `/annonces?category_id=${listing.category_id}` : '/annonces'
  const trustState = TRUST_LABELS[((listing?.user?.trust_level ?? 'inconnu') as keyof typeof TRUST_LABELS)] ?? TRUST_LABELS.inconnu
  const recentReviews = sellerReviews.slice(0, 4)
  const otherSellerListings = sellerListings.slice(0, 8)
  const shareAnnonce = listing
    ? {
        id: Number(listing.id),
        titre: listing.title,
        prix: listing.is_free ? 0 : listing.price ?? 0,
        commune: listing.commune_name ?? null,
        image_url: activeCover ?? null,
      }
    : null

  const refreshListing = async () => {
    const { data } = await listingsApi.getById(id)
    setListing(data.data ?? null)
  }

  const refreshSellerContext = async () => {
    if (!listing?.user?.id) return
    const [listingsRes, reviewsRes] = await Promise.all([
      usersApi.getUserListings(String(listing.user.id)),
      usersApi.getReviews(String(listing.user.id)),
    ])
    const items = (listingsRes.data?.data ?? listingsRes.data ?? []).filter(
      (item: SellerListing) => String(item.id) !== String(listing.id)
    )
    setSellerListings(items)
    setSellerReviews(reviewsRes.data?.data ?? reviewsRes.data ?? [])
  }

  const handleFavorite = async () => {
    if (!listing) return
    await toggleFavorite({
      id: String(listing.id),
      titre: listing.title,
      prix: listing.price,
      cover_image: activeCover,
      commune: listing.commune_name ?? null,
      category: listing.category_name ?? null,
    })
  }

  const handleMessageSeller = async () => {
    if (!listing) return
    setSendingMessage(true)
    try {
      const starter = `Bonjour, votre annonce "${listing.title}" m'interesse. Est-elle toujours disponible ?`
      const res = await messagesApi.startConversation({
        annonce_id: Number(listing.id),
        message: starter,
      })
      const convId = res.data?.conversation_id ?? res.data?.data?.conversation_id ?? res.data?.id
      if (convId) router.push(`/messages/${convId}`)
    } catch {
      setError('Impossible douvrir la conversation.')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!listing) return
    setReviewSubmitting(true)
    setReviewError(null)
    try {
      await usersApi.addReview(String(listing.user.id), {
        note: reviewNote,
        commentaire: reviewComment.trim(),
      })
      await Promise.all([
        refreshListing().catch(() => undefined),
        refreshSellerContext().catch(() => undefined),
      ])
      setReviewFeedback('Merci, votre avis a bien ete publie.')
      setReviewComment('')
      setReviewNote(5)
    } catch {
      setReviewError('Impossible de publier votre avis pour le moment.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading || !listing) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-3xl border border-night/8 bg-white p-8 text-center text-night/60 shadow-sm">
          Chargement de l'annonce...
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <Link href="/annonces" className="inline-flex items-center gap-2 text-sm text-night/50 hover:text-night">
          <ArrowLeft size={16} />
          Retour aux annonces
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFavorite}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
              saved ? 'border-coral/30 bg-coral/8 text-coral' : 'border-night/10 bg-white text-night/65 hover:text-night'
            }`}
          >
            <Heart size={16} className={saved ? 'fill-coral' : ''} />
            Favori
          </button>
          {shareAnnonce && <ShareButton annonce={shareAnnonce} variant="icon" />}
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.25fr_0.95fr] gap-6 items-start">
        <ListingHeroCard
          listing={listing}
          activeCover={activeCover}
          activeImage={activeImage}
          onPickImage={setActiveImage}
          primaryCategoryHref={primaryCategoryHref}
          trustScore={listing.user.trust_score}
        />

        <div className="space-y-4 lg:sticky lg:top-24">
          <SellerSidebar
            listing={listing}
            currentUserId={currentUserId}
            isOwner={isOwner}
            sendingMessage={sendingMessage}
            onMessageSeller={handleMessageSeller}
            onOpenPro={() => router.push('/pro')}
            onViewSeller={() => router.push(`/profil/${listing.user.id}`)}
            trustState={trustState}
            formatDateFn={formatDate}
          />

          <SellerReviewsSection reviews={recentReviews} loading={sellerLoading} formatDateFn={formatDate} />

          <ReviewFormSection
            canReview={Boolean(!isOwner && user)}
            submitting={reviewSubmitting}
            feedback={reviewFeedback}
            error={reviewError}
            reviewNote={reviewNote}
            reviewComment={reviewComment}
            onNoteChange={setReviewNote}
            onCommentChange={setReviewComment}
            onSubmit={handleSubmitReview}
            loginHref={`/connexion?redirect=/annonces/${listing.id}`}
          />

          <SecurityTipsCard />
        </div>
      </div>

      <SellerListingsSection items={otherSellerListings} sellerId={listing.user.id} />
      <RelatedSearchesSection searches={associatedSearches} />
    </main>
  )
}
