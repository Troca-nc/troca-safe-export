'use client'

import Link from 'next/link'
import ListingImageComponent from '@/components/ListingImage'
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  Heart,
  MailCheck,
  MapPin,
  MessageCircle,
  Phone,
  Package,
  Search,
  Send,
  Sparkles,
  Star,
  Store,
  TrendingUp,
} from 'lucide-react'

type TrustState = {
  label: string
  className: string
}

type ListingImageItem = {
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
}

type ListingDetail = {
  id: number | string
  title: string
  price: number | null
  price_negotiable: boolean
  is_free: boolean
  description: string
  condition: string
  is_featured?: boolean
  is_urgent?: boolean
  nb_vues?: number
  nb_favoris?: number
  commune_name?: string | null
  category_name?: string | null
  category_icon?: string | null
  published_at?: string
  contre_quoi?: string | null
  images?: ListingImageItem[]
  user: ListingUser
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

function starsFor(note: number, className = 'w-3.5 h-3.5') {
  return Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={`${className} ${i < Math.round(note) ? 'fill-amber-400 stroke-amber-400' : 'stroke-night/20'}`}
    />
  ))
}

function initials(user: ListingUser) {
  return `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
}

function formatDate(value?: string) {
  if (!value) return ''
  return value
}

function formatPrice(listing: Pick<ListingDetail, 'is_free' | 'price' | 'price_negotiable'>) {
  if (listing.is_free) return 'Gratuit'
  if (listing.price == null) return 'Prix a debattre'
  return `${listing.price.toLocaleString('fr-FR')} XPF`
}

export function ListingHeroCard({
  listing,
  activeCover,
  activeImage,
  onPickImage,
  primaryCategoryHref,
  trustScore,
}: {
  listing: ListingDetail
  activeCover: string | null
  activeImage: number
  onPickImage: (index: number) => void
  primaryCategoryHref: string
  trustScore?: number | null
}) {
  const images = listing.images ?? []

  return (
    <section className="space-y-4">
      <div className="bg-white rounded-3xl border border-night/8 overflow-hidden shadow-sm">
        <div className="aspect-[4/3] bg-sand relative">
          {activeCover ? (
            <ListingImageComponent src={activeCover} alt={listing.title} sizes="(max-width: 768px) 100vw, 60vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-night/20">📦</div>
          )}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {listing.is_featured && (
              <span className="px-3 py-1 rounded-full bg-coral text-white text-xs font-semibold">A la une</span>
            )}
            {listing.is_urgent && (
              <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold">Urgent</span>
            )}
            {listing.contre_quoi && (
              <span className="px-3 py-1 rounded-full bg-night text-white text-xs font-semibold">Troc</span>
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="p-3 flex gap-2 overflow-x-auto border-t border-night/8">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => onPickImage(index)}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-colors ${
                  index === activeImage ? 'border-coral' : 'border-transparent'
                }`}
              >
                <ListingImageComponent
                  src={image.thumbnail_url ?? image.url}
                  alt=""
                  sizes="160px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-night/8 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-night/45 mb-3">
          <Link href={primaryCategoryHref} className="inline-flex items-center gap-1 rounded-full bg-night/5 px-3 py-1 hover:bg-night/10">
            {listing.category_icon && <span>{listing.category_icon}</span>}
            <span>{listing.category_name ?? 'Annonce'}</span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-night/5 px-3 py-1">
            <MapPin size={12} />
            {listing.commune_name ?? 'Nouvelle-Caledonie'}
          </span>
          {trustScore != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-jungle/10 px-3 py-1 text-jungle">
              <Sparkles size={12} />
              Confiance {trustScore}/100
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-night leading-tight">{listing.title}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-night/50">
              <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {formatDate(listing.published_at)}</span>
              <span className="inline-flex items-center gap-1.5"><Heart size={13} /> {listing.nb_favoris ?? 0} favoris</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-coral">{formatPrice(listing)}</p>
            {listing.price_negotiable && !listing.is_free && (
              <p className="text-xs text-night/45">Prix negociable</p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sand/60 p-4">
            <p className="text-[11px] uppercase tracking-wide text-night/40 mb-1">Etat</p>
            <p className="font-medium text-night">{listing.condition}</p>
          </div>
          <div className="rounded-2xl bg-sand/60 p-4">
            <p className="text-[11px] uppercase tracking-wide text-night/40 mb-1">Paiement</p>
            <p className="font-medium text-night">
              {listing.is_free ? 'Gratuit' : listing.price_negotiable ? 'Negotiable' : 'Prix fixe'}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-night/8 bg-night/[0.03] p-4">
          <div className="flex items-center gap-2 text-night mb-2">
            <MessageCircle size={16} className="text-coral" />
            <h2 className="font-semibold">Description</h2>
          </div>
          <p className="text-sm leading-7 text-night/75 whitespace-pre-line">{listing.description}</p>
          {listing.contre_quoi && (
            <div className="mt-4 rounded-2xl border border-dashed border-night/15 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-night/40 mb-1">Echange possible contre</p>
              <p className="text-sm text-night/80">{listing.contre_quoi}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function SellerSidebar({
  listing,
  currentUserId,
  isOwner,
  sendingMessage,
  onMessageSeller,
  onOpenPro,
  onViewSeller,
  trustState,
  formatDateFn,
}: {
  listing: ListingDetail
  currentUserId: string | null
  isOwner: boolean
  sendingMessage: boolean
  onMessageSeller: () => void
  onOpenPro: () => void
  onViewSeller: () => void
  trustState: TrustState
  formatDateFn: (value?: string) => string
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="bg-white rounded-3xl border border-night/8 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-coral/10 text-coral font-bold flex items-center justify-center overflow-hidden shrink-0">
            {listing.user.avatar_url ? (
              <img src={listing.user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(listing.user)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-night truncate">
                {listing.user.prenom} {listing.user.nom}
              </h2>
            </div>

            {(listing.user.seller_commune_name || listing.user.seller_province_name) && (
              <p className="mt-1 flex items-center gap-1 text-xs text-night/50">
                <MapPin size={12} />
                {listing.user.seller_commune_name ?? 'Nouvelle-Caledonie'}
                {listing.user.seller_province_name && (
                  <span className="text-night/35">· {listing.user.seller_province_name}</span>
                )}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              {listing.user.email_verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-ocean/20 bg-ocean/8 px-2.5 py-0.5 text-[11px] font-medium text-ocean">
                  <MailCheck size={12} />
                  Email verifie
                </span>
              )}
              {listing.user.telephone_verifie && (
                <span className="inline-flex items-center gap-1 rounded-full border border-jungle/20 bg-jungle/8 px-2.5 py-0.5 text-[11px] font-medium text-jungle">
                  <Phone size={12} />
                  Telephone verifie
                </span>
              )}
              {listing.user.is_pro && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                  <Store size={12} />
                  Pro
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">{starsFor(listing.user.note_moyenne ?? 0, 'w-3.5 h-3.5')}</div>
              <span className="text-sm font-semibold text-night">
                {listing.user.note_moyenne ? `${listing.user.note_moyenne.toFixed(1)}/5` : 'Pas encore de note'}
              </span>
              <span className="text-xs text-night/40">{listing.user.nb_avis ?? 0} avis</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${trustState.className}`}>
                <BadgeCheck size={12} />
                {trustState.label}
              </span>
              {listing.user.nb_annonces != null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-night/10 bg-sand px-2.5 py-0.5 text-[11px] font-medium text-night/60">
                  <Package size={12} />
                  {listing.user.nb_annonces} annonces
                </span>
              )}
              {listing.user.created_at && (
                <span className="inline-flex items-center gap-1 rounded-full border border-night/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-night/60">
                  <Clock size={12} />
                  Membre depuis {formatDateFn(listing.user.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onMessageSeller}
            disabled={sendingMessage || isOwner}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-coral text-white px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            <MessageCircle size={16} />
            {isOwner ? 'Votre annonce' : sendingMessage ? 'Ouverture...' : 'Envoyer un message'}
          </button>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-medium text-night/35 cursor-not-allowed"
          >
            <Send size={16} />
            {listing.user.telephone_verifie ? 'Appel a activer' : 'Telephone non verifie'}
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={onOpenPro}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-coral/20 bg-coral/5 px-4 py-3 text-sm font-semibold text-coral hover:bg-coral/10"
            >
              <TrendingUp size={16} />
              Booster et mettre en avant
            </button>
          )}
          <button
            type="button"
            onClick={onViewSeller}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-night/10 bg-night/[0.02] px-4 py-3 text-sm font-medium text-night hover:bg-night/[0.05]"
          >
            Voir le profil vendeur
          </button>
        </div>
      </div>
    </aside>
  )
}

export function SellerReviewsSection({
  reviews,
  loading,
  formatDateFn,
}: {
  reviews: SellerReview[]
  loading: boolean
  formatDateFn: (value?: string) => string
}) {
  return (
    <div className="bg-white rounded-3xl border border-night/8 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-night">
        <Sparkles size={16} className="text-coral" />
        <h2 className="font-semibold">Avis acheteurs</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-16 rounded-2xl bg-sand animate-pulse" />
          <div className="h-16 rounded-2xl bg-sand animate-pulse" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-night/45">Aucun avis pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-night/8 bg-night/[0.02] p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-coral/10 text-coral font-semibold flex items-center justify-center overflow-hidden shrink-0">
                  {review.auteur_avatar ? (
                    <img src={review.auteur_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    review.auteur_prenom?.[0]?.toUpperCase() ?? '?'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-night truncate">{review.auteur_prenom ?? 'Acheteur'}</p>
                    <div className="flex items-center gap-0.5">{starsFor(review.note, 'w-3 h-3')}</div>
                  </div>
                  {review.commentaire && <p className="mt-1 text-sm leading-6 text-night/70">{review.commentaire}</p>}
                  {review.created_at && <p className="mt-1 text-[11px] text-night/40">{formatDateFn(review.created_at)}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReviewFormSection({
  canReview,
  submitting,
  feedback,
  error,
  reviewNote,
  reviewComment,
  onNoteChange,
  onCommentChange,
  onSubmit,
  loginHref,
}: {
  canReview: boolean
  submitting: boolean
  feedback: string | null
  error: string | null
  reviewNote: number
  reviewComment: string
  onNoteChange: (value: number) => void
  onCommentChange: (value: string) => void
  onSubmit: () => void
  loginHref: string
}) {
  if (!canReview) {
    return (
      <div className="bg-white rounded-3xl border border-night/8 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-night">
          <Star size={16} className="text-amber-500" />
          <h2 className="font-semibold">Laisser un avis</h2>
        </div>
        <p className="text-sm text-night/60 leading-6">
          Connectez-vous pour noter ce vendeur, ajouter des etoiles et partager votre retour avec la communaute.
        </p>
        <Link href={loginHref} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-night text-white px-4 py-3 text-sm font-medium">
          Se connecter pour noter
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-night/8 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-night">
        <Star size={16} className="text-amber-500" />
        <h2 className="font-semibold">Laisser un avis</h2>
      </div>

      <p className="text-sm text-night/60 mb-3">
        Votre retour aide les autres acheteurs a faire confiance au vendeur.
      </p>

      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1
          const active = value <= reviewNote
          return (
            <button
              key={value}
              type="button"
              onClick={() => onNoteChange(value)}
              className={`w-9 h-9 rounded-xl border transition-colors flex items-center justify-center ${active ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-night/10 bg-white text-night/25 hover:text-amber-400'}`}
              aria-label={`${value} etoile${value > 1 ? 's' : ''}`}
            >
              <Star className={`w-4 h-4 ${active ? 'fill-amber-400 stroke-amber-400' : ''}`} />
            </button>
          )
        })}
      </div>

      <textarea
        value={reviewComment}
        onChange={(e) => onCommentChange(e.target.value)}
        rows={4}
        maxLength={500}
        placeholder="Votre avis sur le vendeur..."
        className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-coral/25 focus:border-coral resize-none"
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-night text-white px-4 py-3 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Publication...' : 'Publier mon avis'}
      </button>

      {feedback && <p className="mt-3 text-sm text-jungle">{feedback}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export function SecurityTipsCard() {
  return (
    <div className="bg-amber-50 rounded-3xl border border-amber-100 p-5">
      <div className="flex items-center gap-2 mb-2 text-amber-800">
        <AlertTriangle size={16} />
        <h2 className="font-semibold">Conseils de securite</h2>
      </div>
      <ul className="space-y-2 text-sm text-amber-900/80 leading-6">
        <li>- N'envoyez jamais d'argent avant d'avoir verifie l'annonce et le vendeur.</li>
        <li>- Preferez l'echange en personne dans un lieu public.</li>
        <li>- Gardez toutes les discussions dans Troca pour faciliter la moderation.</li>
      </ul>
    </div>
  )
}

export function SellerListingsSection({
  items,
  sellerId,
}: {
  items: SellerListing[]
  sellerId: number | string
}) {
  if (items.length === 0) return null

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-night">Autres articles du vendeur</h2>
          <p className="text-sm text-night/50">Decouvrez le reste de sa boutique avant de contacter.</p>
        </div>
        <Link href={`/profil/${sellerId}`} className="text-sm text-coral hover:underline">
          Voir tous ses articles
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/annonces/${item.id}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-night/5"
          >
            <div className="aspect-[4/3] bg-sand overflow-hidden relative">
              {item.cover_image ? (
                <ListingImageComponent
                  src={item.cover_image}
                  alt={item.title ?? item.titre ?? 'Annonce'}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  imgClassName="group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">📦</div>
              )}
              {item.category_icon && (
                <span className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-1 text-xs shadow-sm">
                  {item.category_icon}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-night line-clamp-2 leading-tight mb-1">
                {item.title ?? item.titre}
              </p>
              <p className="text-base font-bold text-coral">
                {item.prix != null || item.price != null
                  ? `${(item.prix ?? item.price ?? 0).toLocaleString('fr-FR')} XPF`
                  : <span className="text-night/40 font-normal text-sm">Prix libre</span>}
              </p>
              {item.commune_name && (
                <p className="flex items-center gap-1 text-[11px] text-night/40 mt-1">
                  <MapPin size={10} />
                  {item.commune_name}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function RelatedSearchesSection({
  searches,
}: {
  searches: Array<{ label: string; href: string; tone: string }>
}) {
  return (
    <section className="mt-8 bg-white rounded-3xl border border-night/8 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-night">
        <Search size={16} className="text-ocean" />
        <h2 className="font-semibold">Recherches associees</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {searches.map((search) => (
          <Link
            key={`${search.label}-${search.href}`}
            href={search.href}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-transform hover:-translate-y-0.5 ${search.tone}`}
          >
            {search.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
