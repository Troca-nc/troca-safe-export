'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertTriangle, ArrowLeft, BadgeDollarSign, Heart, X } from 'lucide-react'
import { listingsApi, messagesApi, usersApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { consumePendingAuthAction, peekPendingAuthAction } from '@/lib/authAction'
import { useAuthActionStore } from '@/store/authActionStore'
import { useFavorite } from '@/hooks/useFavorite'
import { trackEvent } from '@/lib/analytics'
import { API_ORIGIN } from '@/lib/api'
import ShareButton from '@/components/annonces/ShareButton'
import TrocProposalForm from '@/components/troc/TrocProposalForm'
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
  is_online?: boolean
  last_seen_label?: string | null
  avg_response_time_label?: string | null
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
  good: 'Bon Ãtat',
  fair: 'Correct',
  for_parts: 'Pour piï¿½ces',
}

const TRUST_LABELS: Record<string, { label: string; className: string }> = {
  excellent: { label: 'Vendeur de confiance', className: 'bg-jungle/10 text-jungle border-jungle/20' },
  bon: { label: 'Vendeur fiable', className: 'bg-teal-50 text-teal-700 border-teal-100' },
  moyen: { label: 'Profil en cours', className: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30' },
  faible: { label: 'Profil sensible', className: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30' },
  inconnu: { label: 'Non ï¿½valuï¿½', className: 'bg-sand text-night/60 border-night/10' },
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

function snapTo10(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value / 10) * 10)
}

export default function AnnonceDetail({ id, initialData }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const { isFavorited, toggleFavorite } = useFavorite()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
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
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerNote, setOfferNote] = useState('')
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerFeedback, setOfferFeedback] = useState<string | null>(null)
  const [offerError, setOfferError] = useState<string | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState<'spam' | 'fake' | 'prohibited' | 'offensive' | 'other'>('spam')
  const [reportComment, setReportComment] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportFeedback, setReportFeedback] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [trocModalOpen, setTrocModalOpen] = useState(false)
  const [publishedBannerOpen, setPublishedBannerOpen] = useState(false)
  const replayedMessageRef = useRef(false)
  const trackedViewRef = useRef<string | null>(null)

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
    setPublishedBannerOpen(searchParams.get('published') === '1')
  }, [searchParams])

  useEffect(() => {
    if (!listing?.id) return
    if (trackedViewRef.current === String(listing.id)) return
    trackedViewRef.current = String(listing.id)
    void trackEvent('listing_view', {
      listing_id: listing.id,
      listing_title: listing.title,
      category_id: listing.category_id ?? null,
      seller_id: listing.user?.id ?? null,
    }).catch(() => {})
    void fetch(`${API_ORIGIN}/api/listings/${listing.id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        source: typeof document !== 'undefined' && document.referrer.includes('/annonces') ? 'search' : 'direct',
      }),
    }).catch(() => {})
  }, [listing])

  useEffect(() => {
    replayedMessageRef.current = false
  }, [listing?.id])

  useEffect(() => {
    if (!isAuthenticated || !listing || replayedMessageRef.current) return

    const pending = peekPendingAuthAction()
    if (!pending || pending.type !== 'message_seller' || pending.listingId !== String(listing.id)) return

    replayedMessageRef.current = true
    consumePendingAuthAction()
    void handleMessageSeller()
  }, [isAuthenticated, listing, listing?.id])

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
    if (!isAuthenticated) {
      openAuthModal({
        type: 'favorite_listing',
        listingId: String(listing.id),
        redirectTo: `/annonces/${listing.id}`,
      })
      return
    }
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
    void trackEvent('contact_seller_click', {
      listing_id: listing.id,
      listing_title: listing.title,
      seller_id: listing.user?.id ?? null,
    }).catch(() => {})
    if (!isAuthenticated) {
      openAuthModal({
        type: 'message_seller',
        listingId: String(listing.id),
        redirectTo: `/annonces/${listing.id}`,
      })
      return
    }
    setSendingMessage(true)
    try {
      const starter = `Bonjour, votre annonce "${listing.title}" m'interesse. Est-elle toujours disponible ?`
      const res = await messagesApi.startConversation({
        annonce_id: Number(listing.id),
        message: starter,
      })
      const convId = res.data?.conversation_id ?? res.data?.data?.conversation_id ?? res.data?.id
      void fetch(`${API_ORIGIN}/api/listings/${listing.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contact_type: 'message' }),
      }).catch(() => {})
      if (convId) router.push(`/messages/${convId}`)
    } catch {
      setError("Impossible d'ouvrir la conversation.")
    } finally {
      setSendingMessage(false)
    }
  }

  const openOfferModal = () => {
    if (!listing) return
    if (!isAuthenticated) {
      openAuthModal({
        type: 'login',
        redirectTo: `/annonces/${listing.id}`,
      })
      return
    }
    setOfferFeedback(null)
    setOfferError(null)
    setOfferAmount((current) => current || String(snapTo10((listing.price ?? 0) * 0.9 || 0)))
    setOfferNote('')
    setOfferModalOpen(true)
  }

  const openReportModal = () => {
    if (!listing) return
    if (!isAuthenticated) {
      openAuthModal({
        type: 'login',
        redirectTo: `/annonces/${listing.id}`,
      })
      return
    }
    setReportFeedback(null)
    setReportError(null)
    setReportComment('')
    setReportReason('spam')
    setReportModalOpen(true)
  }

  const handleSubmitOffer = async () => {
    if (!listing) return
    const amount = snapTo10(Number(String(offerAmount).replace(/\s/g, '')))
    if (!amount) {
      setOfferError('Indiquez un montant valide pour votre offre.')
      return
    }

    if (!isAuthenticated) {
      openAuthModal({
        type: 'login',
        redirectTo: `/annonces/${listing.id}`,
      })
      return
    }

    setOfferSubmitting(true)
    setOfferError(null)
    setOfferFeedback(null)
    try {
      const starter = `Bonjour, je souhaite faire une offre de ${amount.toLocaleString('fr-FR')} XPF pour "${listing.title}".${offerNote.trim() ? `\n\n${offerNote.trim()}` : ''}`
      const convoRes = await messagesApi.startConversation({
        annonce_id: Number(listing.id),
        message: starter,
      })
      const convId =
        convoRes.data?.data?.conversationId ??
        convoRes.data?.conversationId ??
        convoRes.data?.data?.conversation_id ??
        convoRes.data?.conversation_id ??
        convoRes.data?.id

      if (!convId) {
        throw new Error('Conversation introuvable')
      }

      await messagesApi.makeOffer(convId, amount)
      setOfferFeedback('Votre offre a bien ï¿½tï¿½ envoyï¿½e. Vous ï¿½tes redirigï¿½ vers la conversation.')
      setOfferModalOpen(false)
      router.push(`/messages/${convId}`)
    } catch {
      setOfferError("Impossible d'envoyer votre offre pour le moment.")
    } finally {
      setOfferSubmitting(false)
    }
  }

  const handleSubmitReport = async () => {
    if (!listing) return
    setReportSubmitting(true)
    setReportError(null)
    setReportFeedback(null)
    try {
      await listingsApi.report(listing.id, {
        reason: reportReason,
        comment: reportComment.trim(),
      })
      setReportFeedback('Merci, votre signalement a bien ï¿½tï¿½ envoyï¿½.')
      setReportModalOpen(false)
      setReportComment('')
      setReportReason('spam')
    } catch {
      setReportError("Impossible d'envoyer le signalement pour le moment.")
    } finally {
      setReportSubmitting(false)
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
      setReviewFeedback('Merci, votre avis a bien ï¿½tï¿½ publiï¿½.')
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
        <div className="mb-5 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {publishedBannerOpen ? (
        <div className="mb-5 rounded-[2rem] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-success)]">Publication rï¿½ussie</p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--color-success)]">Votre annonce est en ligne</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-success)]/70">
                Partagez-la maintenant, retrouvez-la dans vos annonces et dï¿½couvrez les options de visibilitï¿½ pour lui donner un coup de pouce.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPublishedBannerOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-success)]/30 bg-white text-[var(--color-success)] transition hover:bg-[var(--color-success)]/10"
              aria-label="Fermer le message de publication"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {shareAnnonce && <ShareButton annonce={shareAnnonce} variant="full" className="rounded-2xl" />}
            <Link
              href="/profil?tab=listings"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-success)]/30 bg-white px-4 py-3 text-sm font-semibold text-[var(--color-success)] transition hover:bg-[var(--color-success)]/10"
            >
              Voir mes annonces
            </Link>
            <Link
              href="/pro"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--color-success)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Mettre en avant
            </Link>
          </div>
        </div>
      ) : null}

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
            onMakeOffer={openOfferModal}
            onProposeTroc={() => setTrocModalOpen(true)}
            onReportListing={openReportModal}
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
            onRequireAuth={() =>
              openAuthModal({
                type: 'review_seller',
                listingId: String(listing.id),
                redirectTo: `/annonces/${listing.id}`,
              })
            }
          />

          <SecurityTipsCard />
        </div>
      </div>

      <SellerListingsSection items={otherSellerListings} sellerId={listing.user.id} />
      <RelatedSearchesSection searches={associatedSearches} />

      {offerModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-night/55 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-night/10 bg-white p-6 shadow-[0_24px_80px_rgba(8,32,50,0.2)]">
            <button
              type="button"
              onClick={() => setOfferModalOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-night/10 bg-white text-night/50 transition hover:text-night"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                <BadgeDollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Offre rapide</p>
                <h2 className="mt-1 text-2xl font-bold text-night">Faire une offre pour {listing.title}</h2>
                <p className="mt-2 text-sm leading-6 text-night/60">
                  Proposez un montant et ajoutez un message bref. La discussion souvrira directement avec le vendeur.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.1fr]">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-night">Montant proposï¿½ (XPF)</span>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={offerAmount}
                  onChange={(event) => setOfferAmount(event.target.value)}
                  onBlur={(event) => setOfferAmount(String(snapTo10(Number(event.target.value || 0))))}
                  className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
                  placeholder="Ex. 12 000"
                />
                {listing.price != null && (
                  <p className="text-xs text-night/45">
                    Prix affichï¿½: {listing.price.toLocaleString('fr-FR')} XPF
                    {listing.price_negotiable ? ' ï¿½ nï¿½gociable' : ''}
                  </p>
                )}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-night">Message facultatif</span>
                <textarea
                  value={offerNote}
                  onChange={(event) => setOfferNote(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
                  placeholder="Ajoutez une courte note sur votre offre..."
                  maxLength={500}
                />
              </label>
            </div>

            {offerFeedback && (
              <div className="mt-4 rounded-2xl bg-jungle/10 px-4 py-3 text-sm font-medium text-jungle">
                {offerFeedback}
              </div>
            )}
            {offerError && (
              <div className="mt-4 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                {offerError}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOfferModalOpen(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-night/5"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmitOffer}
                disabled={offerSubmitting}
                className="inline-flex items-center justify-center rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90 disabled:cursor-wait disabled:opacity-60"
              >
                {offerSubmitting ? 'Envoi...' : 'Envoyer mon offre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-night/55 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="relative w-full max-w-xl rounded-[2rem] border border-night/10 bg-white p-6 shadow-[0_24px_80px_rgba(8,32,50,0.2)]">
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-night/10 bg-white text-night/50 transition hover:text-night"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-danger)]/80">Signalement</p>
                <h2 className="mt-1 text-2xl font-bold text-night">Signaler cette annonce</h2>
                <p className="mt-2 text-sm leading-6 text-night/60">
                  Aidez-nous ï¿½ garder une plateforme de confiance. Votre signalement sera transmis ï¿½ notre ï¿½quipe.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-night">Motif</span>
                <select
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value as typeof reportReason)}
                  className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-[var(--color-danger)]/30 focus:ring-4 focus:ring-[var(--color-danger)]/10"
                >
                  <option value="spam">Spam ou publicitï¿½ abusive</option>
                  <option value="fake">Annonce douteuse ou trompeuse</option>
                  <option value="prohibited">Produit ou contenu interdit</option>
                  <option value="offensive">Contenu offensant</option>
                  <option value="other">Autre</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-night">Commentaire (facultatif)</span>
                <textarea
                  value={reportComment}
                  onChange={(event) => setReportComment(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-[var(--color-danger)]/30 focus:ring-4 focus:ring-[var(--color-danger)]/10"
                  placeholder="Expliquez briï¿½vement ce qui vous paraï¿½t problï¿½matique..."
                  maxLength={500}
                />
              </label>
            </div>

            {reportFeedback && (
              <div className="mt-4 rounded-2xl bg-jungle/10 px-4 py-3 text-sm font-medium text-jungle">
                {reportFeedback}
              </div>
            )}
            {reportError && (
              <div className="mt-4 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                {reportError}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-night/5"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={reportSubmitting}
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--color-danger)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {reportSubmitting ? 'Envoi...' : 'Envoyer le signalement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {trocModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-night/55 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-night/10 bg-white shadow-[0_24px_80px_rgba(8,32,50,0.2)]">
            <button
              type="button"
              onClick={() => setTrocModalOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-night/10 bg-white text-night/50 transition hover:text-night z-10"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
              <TrocProposalForm listingId={listing.id} listingTitle={listing.title} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
