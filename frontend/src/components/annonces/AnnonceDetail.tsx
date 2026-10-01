'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Clock, Heart, MapPin, MessageCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import ContentShareButton from '@/components/share/ContentShareButton'
import { useFavorite } from '@/hooks/useFavorite'
import { useAuthStore } from '@/store/authStore'
import { useAuthActionStore } from '@/store/authActionStore'
import { contactListingSeller, reportListing } from '@/lib/data/listings'
import { SITE_URL } from '@/types/seo.types'
import type { ListingDetail, ListingReview, ListingSearchItem } from '@/types/listings'
import { DetailGallery, DetailInformation, DetailReviews, DetailSecurity } from './AnnonceDetailSections'
import { SimilarListings } from './AnnonceSimilaires'

type Props = { listing: ListingDetail; reviews: ListingReview[]; similarListings: ListingSearchItem[] }

export default function AnnonceDetailV2({ listing, reviews, similarListings }: Props) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const { isFavorited, toggleFavorite, isToggling } = useFavorite()
  const [contactOpen, setContactOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [message, setMessage] = useState(`Bonjour, votre annonce « ${listing.title} » est-elle toujours disponible ?`)
  const [reportReason, setReportReason] = useState('spam')
  const [reportComment, setReportComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const active = listing.status === 'active'
  const sellerName = [listing.seller.first_name, listing.seller.last_name].filter(Boolean).join(' ')
  const saved = isFavorited(listing.id)
  const price = listing.is_free ? 'Gratuit' : listing.price !== null ? `${listing.price.toLocaleString('fr-FR')} XPF` : 'Prix à débattre'

  function requireAuth() {
    if (isAuthenticated) return true
    openAuthModal({ type: 'message_seller', listingId: listing.id, redirectTo: `/annonces/${listing.id}` })
    return false
  }

  async function sendMessage() {
    if (!message.trim()) return
    setSubmitting(true); setFeedback('')
    try {
      const conversationId = await contactListingSeller(listing.id, message.trim())
      setContactOpen(false)
      if (conversationId) router.push(`/messages/${conversationId}`)
      else setFeedback('Votre message a bien été envoyé.')
    } catch { setFeedback('Impossible d’envoyer le message pour le moment.') }
    finally { setSubmitting(false) }
  }

  async function sendReport() {
    setSubmitting(true); setFeedback('')
    try {
      await reportListing(listing.id, reportReason, reportComment.trim())
      setReportOpen(false); setReportComment(''); setFeedback('Merci, votre signalement a été transmis.')
    } catch { setFeedback('Impossible d’envoyer le signalement pour le moment.') }
    finally { setSubmitting(false) }
  }

  async function favorite() {
    if (!isAuthenticated) {
      openAuthModal({ type: 'favorite_listing', listingId: listing.id, redirectTo: `/annonces/${listing.id}` })
      return
    }
    await toggleFavorite({ id: listing.id, titre: listing.title, prix: listing.price, cover_image: listing.images[0]?.url ?? null, commune: listing.commune_name ?? null, category: listing.category_name ?? null })
  }

  return <>
    <main className="mx-auto max-w-container px-4 pb-20 pt-6 sm:px-6 lg:px-12">
      <nav aria-label="Fil d’Ariane" className="mb-6 flex flex-wrap items-center gap-2 text-meta text-ink/55">
        <Link href="/" className="hover:text-ink">Accueil</Link><span>/</span><Link href="/annonces" className="hover:text-ink">Annonces</Link><span>/</span>{listing.category_slug ? <><Link href={`/annonces?category=${listing.category_slug}`} className="hover:text-ink">{listing.category_name}</Link><span>/</span></> : null}<span className="max-w-[18rem] truncate text-ink">{listing.title}</span>
      </nav>

      {!active ? <div role="status" className="mb-6 rounded-card border border-accent/35 bg-accent/10 p-4 text-body-sm text-ink"><strong>{listing.status === 'sold' ? 'Cette annonce a été vendue.' : 'Cette annonce n’est plus active.'}</strong> Le contact avec le vendeur est désactivé pour cet article.</div> : null}
      {feedback ? <div role="status" className="mb-6 rounded-card border border-info/30 bg-info/10 p-4 text-body-sm text-ink">{feedback}</div> : null}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_396px]">
        <div className="min-w-0 space-y-8">
          <DetailGallery listing={listing} />
          <section className="rounded-block border border-warm-border bg-cream-surface p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0"><div className="flex flex-wrap gap-2">{listing.is_featured ? <span className="rounded-full bg-accent px-3 py-1 text-caption font-semibold text-ink-deep">À la une</span> : null}{listing.is_urgent ? <span className="rounded-full bg-alert-error/10 px-3 py-1 text-caption font-semibold text-alert-error">Urgent</span> : null}{listing.is_troc ? <span className="rounded-full bg-info/15 px-3 py-1 text-caption font-semibold text-info-text">Troc accepté</span> : null}</div><h1 className="mt-3 font-display text-h2 text-ink sm:text-h1-form">{listing.title}</h1><p className={`mt-4 font-display text-price-lg ${listing.is_free ? 'text-reef-text' : 'text-ink'}`}>{price}</p>{listing.price_negotiable ? <p className="mt-2 text-body-sm text-ink/55">Prix négociable</p> : null}</div>
              <div className="flex gap-2"><button type="button" onClick={() => void favorite()} disabled={isToggling.has(listing.id)} aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'} className="flex h-11 w-11 items-center justify-center rounded-control border border-warm-border text-ink hover:border-accent"><Heart className={`h-5 w-5 ${saved ? 'fill-accent text-accent' : ''}`} /></button><ContentShareButton variant="icon" content={{ kind: 'annonce', itemId: listing.id, title: listing.title, description: listing.description.slice(0, 140), url: `${SITE_URL}/annonces/${listing.id}`, imageUrl: listing.images[0]?.url }} /></div>
            </div>
          </section>
          <DetailInformation listing={listing} />
          <DetailReviews reviews={reviews} rating={listing.seller.rating} count={listing.seller.reviews_count} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <section className="rounded-block border border-warm-border bg-cream-surface p-6 shadow-card">
            <p className="text-eyebrow uppercase text-info-text">Vendeur</p>
            <div className="mt-4 flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-info/15 font-display text-xl text-info-text">{sellerName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate font-semibold text-ink">{sellerName}</h2>{listing.seller.pro_verified ? <BadgeCheck className="h-4 w-4 text-reef-text" aria-label="Professionnel vérifié" /> : null}</div><p className="text-meta text-ink/55">{listing.seller.is_online ? 'En ligne' : listing.seller.last_seen_label || 'Membre Kalico'}</p></div></div>
            <div className="mt-5 space-y-2 text-body-sm text-ink/65">{listing.seller.commune_name ? <p className="flex gap-2"><MapPin className="h-4 w-4 text-info-text" />{listing.seller.commune_name}</p> : null}{listing.seller.response_time_label ? <p className="flex gap-2"><Clock className="h-4 w-4 text-info-text" />{listing.seller.response_time_label}</p> : null}<p className="flex gap-2"><ShieldCheck className="h-4 w-4 text-info-text" />{listing.seller.email_verified || listing.seller.phone_verified ? 'Identité de contact vérifiée' : 'Profil Kalico'}</p></div>
            <Button className="mt-6 w-full" disabled={!active} onClick={() => { if (requireAuth()) setContactOpen(true) }}><MessageCircle className="h-5 w-5" />Contacter le vendeur</Button>
          </section>
          <DetailSecurity onReport={() => setReportOpen(true)} />
        </aside>
      </div>
      <SimilarListings listings={similarListings} />
    </main>

    <Modal open={contactOpen} onClose={() => setContactOpen(false)} title="Contacter le vendeur" footer={<><Button variant="secondary" onClick={() => setContactOpen(false)}>Annuler</Button><Button loading={submitting} onClick={() => void sendMessage()}>Envoyer</Button></>}><label className="block"><span className="text-label text-ink">Votre message</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="mt-2 w-full rounded-field border border-warm-border bg-cream-surface p-3 outline-none focus:border-accent" /></label></Modal>
    <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Signaler cette annonce" footer={<><Button variant="secondary" onClick={() => setReportOpen(false)}>Annuler</Button><Button loading={submitting} onClick={() => void sendReport()}>Envoyer le signalement</Button></>}><div className="space-y-4"><label className="block"><span className="text-label text-ink">Motif</span><select value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-2 w-full rounded-field border border-warm-border bg-cream-surface p-3"><option value="spam">Contenu indésirable</option><option value="fraud">Suspicion de fraude</option><option value="prohibited">Objet interdit</option><option value="other">Autre</option></select></label><label className="block"><span className="text-label text-ink">Précisions (facultatif)</span><textarea value={reportComment} onChange={(event) => setReportComment(event.target.value)} rows={3} className="mt-2 w-full rounded-field border border-warm-border bg-cream-surface p-3" /></label></div></Modal>
  </>
}
