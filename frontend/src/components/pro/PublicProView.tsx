'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, Clock3, ExternalLink, FileText, Globe, MapPin, MessageCircle, Package, Phone, Quote, Send, Star, Store } from 'lucide-react'

import ProBookingModal from '@/components/pro/ProBookingModal'
import ProQuoteModal from '@/components/pro/ProQuoteModal'
import { normalizeQuoteTemplate } from '@/components/pro/quoteTemplate'
import ReviewCard from '@/components/reviews/ReviewCard'
import { ProBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, DeepPanel } from '@/components/ui/Card'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { reviewsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { ProPublicProduct, ProPublicProfile, ProPublicReview } from '@/types/pro-public'

const TABS = [
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'annonces', label: 'Annonces' },
  { id: 'realisations', label: 'Réalisations' },
  { id: 'avis', label: 'Avis' },
  { id: 'apropos', label: 'À propos' },
] as const
type Tab = (typeof TABS)[number]['id']

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('fr-FR')).join('') || 'P'
const money = (value?: number | null) => Number(value) > 0 ? `${Number(value).toLocaleString('fr-FR')} XPF` : 'Tarif sur demande'
const productPrice = (product: ProPublicProduct) => product.price_type === 'free' ? 'Gratuit' : product.price_type === 'on_quote' ? 'Sur devis' : product.price_type === 'from' ? `À partir de ${money(product.price_xpf)}` : money(product.price_xpf)
const listingText = (listing: Record<string, unknown>, key: string) => typeof listing[key] === 'string' ? String(listing[key]) : ''

export default function PublicProView({ profile, reviews: initialReviews }: { profile: ProPublicProfile; reviews: ProPublicReview[] }) {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const requestedTab = searchParams.get('tab')
  const [tab, setTab] = useState<Tab>(TABS.some((item) => item.id === requestedTab) ? requestedTab as Tab : 'catalogue')
  const [reviews] = useState(initialReviews)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quotePrefill, setQuotePrefill] = useState<Record<string, string> | undefined>()
  const [bookingOpen, setBookingOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [category, setCategory] = useState('all')

  const displayName = profile.display_name || profile.pro_company_name || [profile.prenom, profile.nom].filter(Boolean).join(' ') || 'Professionnel Kalico'
  const products = profile.products ?? []
  const listings = profile.listings ?? []
  const photos = (profile.pro_portfolio_photos ?? []).filter(Boolean)
  const bookingEnabled = Boolean(profile.booking_settings?.is_enabled)
  const isOwner = Boolean(user && String(user.id) === String(profile.id))
  const categories = useMemo(() => profile.catalog_categories?.length ? profile.catalog_categories : Array.from(new Map(products.filter((product) => product.catalog_category_id && product.catalog_category_name).map((product) => [String(product.catalog_category_id), { id: product.catalog_category_id!, name: product.catalog_category_name! }])).values()), [products, profile.catalog_categories])
  const visibleProducts = category === 'all' ? products : products.filter((product) => String(product.catalog_category_id) === category)

  useEffect(() => {
    if (searchParams.get('action') === 'devis') setQuoteOpen(true)
    if (searchParams.get('review_booking')) setTab('avis')
  }, [searchParams])

  const requestProduct = (product: ProPublicProduct) => {
    setQuotePrefill({ need_type: `Demande pour ${product.title}`, commune: product.commune_name || profile.pro_commune || '', budget_xpf: product.price_type === 'fixed' ? String(product.price_xpf || '') : '', details: `Bonjour, je souhaite en savoir plus sur « ${product.title} ».` })
    setQuoteOpen(true)
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviteLoading(true); setInviteError('')
    try { await reviewsApi.createInvite({ pro_id: profile.id, reviewer_email: inviteEmail.trim() }); setInviteEmail(''); setInviteOpen(false) }
    catch (error: any) { setInviteError(error?.response?.data?.error || "Impossible d'envoyer l'invitation.") }
    finally { setInviteLoading(false) }
  }

  return (
    <main className="bg-cream pb-24 text-ink md:pb-16">
      <section className="mx-auto max-w-site px-4 py-6 sm:px-6 sm:py-10">
        <DeepPanel className="p-0">
          <div className="relative h-36 overflow-hidden sm:h-48">
            {profile.pro_banner_url ? <Image src={profile.pro_banner_url} alt="" fill sizes="100vw" className="object-cover opacity-55" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" aria-hidden="true" />
          </div>
          <div className="relative px-6 pb-7 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <div className="flex h-20 w-20 shrink-0 -translate-y-5 items-center justify-center overflow-hidden rounded-card border-4 border-ink bg-cream-surface text-h3 font-semibold text-lagoon-text shadow-modal sm:h-24 sm:w-24">
                  {profile.pro_logo_url ? <Image src={profile.pro_logo_url} alt={displayName} width={96} height={96} className="h-full w-full object-cover" /> : initials(displayName)}
                </div>
                <div className="min-w-0 pb-1"><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-h2 font-normal text-cream sm:text-display-sm">{displayName}</h1><ProBadge /></div><p className="mt-2 text-body text-cream/75">{profile.pro_category || 'Professionnel local'} · {profile.pro_commune || 'Nouvelle-Calédonie'}</p></div>
              </div>
              <div className="hidden gap-3 md:flex"><Button onClick={() => { setQuotePrefill(undefined); setQuoteOpen(true) }}><Quote className="h-4 w-4" aria-hidden="true" />Demander un devis</Button>{bookingEnabled ? <Button variant="secondary" onClick={() => setBookingOpen(true)}><CalendarDays className="h-4 w-4" aria-hidden="true" />Prendre rendez-vous</Button> : null}</div>
            </div>
          </div>
        </DeepPanel>
      </section>

      <section className="mx-auto grid max-w-site gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Card className="hover:border-sand">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {Number(profile.review_count) > 0 ? <span className="inline-flex items-center gap-2 font-semibold"><Star className="h-5 w-5 fill-accent text-accent" aria-hidden="true" />{Number(profile.avg_rating || 0).toFixed(1)} · {profile.review_count} avis</span> : <span className="text-body-sm text-ink/70">Aucun avis pour le moment</span>}
              <span className="text-body-sm text-ink/70">{profile.listing_count || 0} annonce{Number(profile.listing_count) > 1 ? 's' : ''}</span>
              <span className="text-body-sm text-ink/70">{profile.product_count || products.length} produit{Number(profile.product_count || products.length) > 1 ? 's' : ''}</span>
            </div>
            {profile.pro_description ? <p className="mt-5 max-w-3xl text-body leading-relaxed text-ink/75">{profile.pro_description}</p> : null}
          </Card>

          <div className="mt-6 overflow-x-auto border-b border-sand" role="tablist" aria-label="Contenu de la vitrine">
            <div className="flex min-w-max gap-1">{TABS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`min-h-11 border-b-2 px-4 text-body-sm font-semibold ${tab === item.id ? 'border-lagoon text-lagoon-text' : 'border-transparent text-ink/60 hover:text-ink'}`}>{item.label}</button>)}</div>
          </div>

          <div className="mt-6">
            {tab === 'catalogue' ? <section aria-label="Catalogue">
              {products.length ? <><div className="mb-5 flex gap-2 overflow-x-auto pb-1"><button className={`k-filter shrink-0 ${category === 'all' ? 'k-filter-selected' : ''}`} onClick={() => setCategory('all')}>Tous</button>{categories.map((item) => <button key={item.id} className={`k-filter shrink-0 ${category === String(item.id) ? 'k-filter-selected' : ''}`} onClick={() => setCategory(String(item.id))}>{item.name}</button>)}</div><div className="grid gap-5 sm:grid-cols-2">{visibleProducts.map((product) => <article key={product.id} className="overflow-hidden rounded-card border border-sand bg-cream-surface shadow-card"><div className="relative aspect-[16/10] bg-cream-sunken">{product.cover_image_url || product.images?.[0]?.url ? <Image src={product.cover_image_url || product.images![0].url} alt={product.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /> : <Store className="absolute inset-0 m-auto h-10 w-10 text-ink/25" aria-hidden="true" />}</div><div className="p-5"><p className="text-caption font-semibold uppercase tracking-label text-lagoon-text">{product.catalog_category_name || product.category_name || 'Catalogue'}</p><h2 className="mt-2 font-display text-h5 font-semibold">{product.title}</h2><p className="mt-2 text-h5 font-semibold">{productPrice(product)}</p>{product.description ? <p className="mt-3 line-clamp-3 text-body-sm text-ink/70">{product.description}</p> : null}<Button className="mt-5 w-full" onClick={() => requestProduct(product)}><MessageCircle className="h-4 w-4" aria-hidden="true" />Demander des informations</Button></div></article>)}</div></> : <Empty title="Catalogue à venir" text="Ce professionnel n'a pas encore publié de produit." icon={Store} />}
            </section> : null}

            {tab === 'annonces' ? <section className="grid gap-5 sm:grid-cols-2" aria-label="Annonces">{listings.length ? listings.map((listing) => <Card key={listing.id}><p className="text-caption font-semibold uppercase tracking-label text-lagoon-text">Annonce professionnelle</p><h2 className="mt-2 font-display text-h5 font-semibold">{listingText(listing, 'titre') || listingText(listing, 'title') || 'Annonce'}</h2><p className="mt-3 line-clamp-3 text-body-sm text-ink/70">{listingText(listing, 'description')}</p><Link href={`/annonces/${listing.id}`} className="k-button k-button-secondary mt-5"><span>Voir l'annonce</span></Link></Card>) : <div className="sm:col-span-2"><Empty title="Aucune annonce active" text="Les annonces de ce professionnel apparaîtront ici." icon={Package} /></div>}</section> : null}

            {tab === 'realisations' ? <section aria-label="Réalisations">{photos.length ? <div className="grid gap-4 sm:grid-cols-2">{photos.map((photo, index) => <a key={`${photo}-${index}`} href={photo} target="_blank" rel="noreferrer" className="relative aspect-[4/3] overflow-hidden rounded-card border border-sand bg-cream-sunken"><Image src={photo} alt={`Réalisation ${index + 1} de ${displayName}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition hover:scale-105" /></a>)}</div> : <Empty title="Aucune réalisation publiée" text="Le portfolio de ce professionnel est encore vide." icon={Store} />}</section> : null}

            {tab === 'avis' ? <section className="space-y-4" aria-label="Avis clients">{reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} />) : <Empty title="Aucun avis pour le moment" text="Les premiers retours clients apparaîtront ici." icon={Star} />}{isOwner ? <Button variant="secondary" onClick={() => setInviteOpen(true)}><Send className="h-4 w-4" aria-hidden="true" />Inviter un client</Button> : null}</section> : null}

            {tab === 'apropos' ? <section className="grid gap-5 sm:grid-cols-2" aria-label="À propos"><Card><p className="text-label-sm font-semibold uppercase tracking-label text-lagoon-text">Présentation</p><p className="mt-4 text-body leading-relaxed text-ink/75">{profile.pro_description || 'Ce professionnel présente ses services sur Kalico.'}</p>{profile.pro_catalog_pdf_url ? <a href={profile.pro_catalog_pdf_url} target="_blank" rel="noreferrer" className="k-button k-button-secondary mt-5"><span className="flex items-center gap-2"><FileText className="h-4 w-4" aria-hidden="true" />Ouvrir le catalogue<ExternalLink className="h-4 w-4" aria-hidden="true" /></span></a> : null}</Card><Card><p className="text-label-sm font-semibold uppercase tracking-label text-lagoon-text">Informations pratiques</p><dl className="mt-4 space-y-4 text-body-sm"><InfoLine icon={MapPin} label="Commune" value={profile.pro_commune || 'Nouvelle-Calédonie'} /><InfoLine icon={Clock3} label="Horaires" value={profile.pro_hours || 'Non renseignés'} /></dl></Card></section> : null}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="hover:border-sand"><p className="text-label-sm font-semibold uppercase tracking-label text-lagoon-text">Contacter le professionnel</p><div className="mt-5 grid gap-3"><Link href={`/messages/new?to=${profile.id}`} className="k-button k-button-primary"><span className="flex items-center justify-center gap-2"><MessageCircle className="h-4 w-4" aria-hidden="true" />Envoyer un message</span></Link><Button variant="secondary" onClick={() => { setQuotePrefill(undefined); setQuoteOpen(true) }}><Quote className="h-4 w-4" aria-hidden="true" />Demander un devis</Button>{bookingEnabled ? <Button variant="secondary" onClick={() => setBookingOpen(true)}><CalendarDays className="h-4 w-4" aria-hidden="true" />Prendre rendez-vous</Button> : null}</div></Card>
          {(profile.pro_phone || profile.pro_website) ? <Card className="hover:border-sand"><p className="text-label-sm font-semibold uppercase tracking-label text-lagoon-text">Coordonnées publiques</p><div className="mt-4 space-y-3 text-body-sm">{profile.pro_phone ? <a href={`tel:${profile.pro_phone}`} className="flex items-center gap-3 text-ink/75 hover:text-lagoon-text"><Phone className="h-4 w-4" aria-hidden="true" />{profile.pro_phone}</a> : null}{profile.pro_website ? <a href={profile.pro_website} target="_blank" rel="noreferrer" className="flex items-center gap-3 break-all text-ink/75 hover:text-lagoon-text"><Globe className="h-4 w-4 shrink-0" aria-hidden="true" />{profile.pro_website}</a> : null}</div></Card> : null}
        </aside>
      </section>

      <div className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-2 gap-2 rounded-card border border-sand bg-cream-surface p-2 shadow-modal md:hidden"><Button onClick={() => { setQuotePrefill(undefined); setQuoteOpen(true) }}><Quote className="h-4 w-4" aria-hidden="true" />Devis</Button>{bookingEnabled ? <Button variant="secondary" onClick={() => setBookingOpen(true)}><CalendarDays className="h-4 w-4" aria-hidden="true" />Rendez-vous</Button> : <Link href={`/messages/new?to=${profile.id}`} className="k-button k-button-secondary"><span className="flex items-center justify-center gap-2"><MessageCircle className="h-4 w-4" aria-hidden="true" />Message</span></Link>}</div>

      <ProQuoteModal proId={profile.id} proName={displayName} open={quoteOpen} onClose={() => { setQuoteOpen(false); setQuotePrefill(undefined) }} template={normalizeQuoteTemplate(profile.pro_quote_template)} prefill={quotePrefill} />
      <ProBookingModal proId={profile.id} proName={displayName} open={bookingOpen} onClose={() => setBookingOpen(false)} settings={profile.booking_settings} />
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Inviter un client" footer={<><Button variant="secondary" onClick={() => setInviteOpen(false)}>Annuler</Button><Button loading={inviteLoading} onClick={() => void sendInvite()}>Envoyer l'invitation</Button></>}><p className="mb-5 text-body-sm text-ink/70">Le client recevra un lien lui permettant de publier un avis vérifié.</p><Input label="Email du client" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} error={inviteError} placeholder="client@exemple.nc" /></Modal>
    </main>
  )
}

function Empty({ title, text, icon: Icon }: { title: string; text: string; icon: typeof Store }) {
  return <Card className="py-12 text-center hover:border-sand"><Icon className="mx-auto h-9 w-9 text-lagoon-text" aria-hidden="true" /><h2 className="mt-4 font-display text-h5 font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-body-sm text-ink/70">{text}</p></Card>
}

function InfoLine({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="flex items-start gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-lagoon-text" aria-hidden="true" /><div><dt className="font-semibold">{label}</dt><dd className="mt-1 text-ink/70">{value}</dd></div></div>
}
