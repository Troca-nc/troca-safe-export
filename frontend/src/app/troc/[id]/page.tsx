'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BadgeCheck, HeartHandshake, MapPin, MessageSquareText } from 'lucide-react'
import Header from '@/components/layout/Header'
import ListingImage from '@/components/ListingImage'
import { ListingSkeleton } from '@/components/ListingSkeleton'
import TrocCompatibilityMeter from '@/components/troc/TrocCompatibilityMeter'
import TrocProposalForm from '@/components/troc/TrocProposalForm'
import { trocApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { TrocCompatibility } from '@/types/troc'

type TrocDetailListing = {
  id: number
  title: string
  troc_wants: string[]
  troc_accepts_complement_xpf: boolean
  troc_complement_max_xpf: number
  troc_status: 'open' | 'negotiating' | 'completed' | 'cancelled'
  compatibility?: {
    score: number
    label: 'Excellent' | 'Bon' | 'Possible' | 'Faible'
    matching_listings: Array<Record<string, unknown>>
    matching_count: number
  } | null
  prix?: number | null
  price?: number | null
  is_free?: boolean
  description?: string | null
  images?: Array<{
    id?: string | number
    url?: string | null
    thumbnail_url?: string | null
    medium_url?: string | null
    original_url?: string | null
    is_cover?: boolean
  }>
  commune_name?: string | null
  category_name?: string | null
  category_icon?: string | null
  user?: {
    id?: number
    prenom?: string | null
    nom?: string | null
    avatar_url?: string | null
  }
}

function TrocDetailPageContent() {
  const params = useParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()
  const listingId = params?.id

  const { data, isLoading, error } = useQuery({
    queryKey: ['troc', 'detail', listingId],
    queryFn: async () => {
      const response = await trocApi.getById(listingId)
      return response.data as { data: TrocDetailListing }
    },
    enabled: Boolean(listingId),
    staleTime: 30_000,
    retry: 1,
  })

  const listing = data?.data ?? null
  const coverImage = listing?.images?.find((image) => image.is_cover)?.url
    || listing?.images?.[0]?.url
    || listing?.images?.[0]?.thumbnail_url
    || null
  const wants = Array.isArray(listing?.troc_wants) ? listing.troc_wants : []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <ListingSkeleton />
        </main>
      </div>
    )
  }

  if (!listing || error) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-[2rem] border border-night/8 bg-white p-8 text-center shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Troc</p>
            <h1 className="mt-3 text-3xl font-bold text-night">Annonce troc introuvable</h1>
            <p className="mt-3 text-sm leading-6 text-night/60">
              Cette annonce nexiste plus ou nest plus disponible.
            </p>
            <Link href="/troc" className="btn-primary mt-6 inline-flex px-4 py-2.5 text-sm">
              Retourner au feed
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const sellerName = [listing.user?.prenom, listing.user?.nom].filter(Boolean).join(' ').trim() || 'Troceur'
  const complementLabel = listing.troc_accepts_complement_xpf && listing.troc_complement_max_xpf > 0
    ? `Accepte jusquï¿½ ${Number(listing.troc_complement_max_xpf).toLocaleString('fr-FR')} XPF de complï¿½ment`
    : null

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/troc" className="inline-flex items-center gap-2 text-sm font-semibold text-night/60 transition hover:text-kalico-blue">
          <ArrowLeft className="h-4 w-4" />
          Retour au feed Troc
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="overflow-hidden rounded-[2rem] border border-night/8 bg-white shadow-card">
            <div className="relative aspect-[4/3] bg-sand">
              <ListingImage
                src={coverImage}
                alt={listing.title}
                fallbackIcon="="
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-night/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  = Troc
                </span>
                {listing.category_name ? (
                  <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/70">
                    {listing.category_name}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-kalico-blue/80">{sellerName}</p>
                  <h1 className="mt-2 text-3xl font-bold leading-tight text-night">{listing.title}</h1>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-night/60">
                    {listing.commune_name ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-night/5 px-2.5 py-1 font-medium">
                        <MapPin className="h-3.5 w-3.5" />
                        {listing.commune_name}
                      </span>
                    ) : null}
                    {listing.user?.prenom || listing.user?.nom ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-night/5 px-2.5 py-1 font-medium">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Troceur
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-night/8 bg-sand px-4 py-3 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">ï¿½change</p>
                  <p className="mt-1 text-lg font-bold text-night">
                    {listing.is_free ? 'Gratuit' : listing.price?.toLocaleString('fr-FR') || listing.prix?.toLocaleString('fr-FR') || 'Prix ï¿½ dï¿½battre'}
                    {!listing.is_free ? <span className="ml-1 text-sm font-normal text-night/55">XPF</span> : null}
                  </p>
                </div>
              </div>

              <TrocCompatibilityMeter
                compatibility={listing.compatibility as unknown as TrocCompatibility | null}
                emptyLabel={
                  isAuthenticated
                    ? 'Publiez une annonce troc pour voir votre compatibilitï¿½'
                    : 'Connectez-vous pour voir votre compatibilitï¿½'
                }
              />

              {listing.description ? (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-night/40">Description</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-night/70">{listing.description}</p>
                </div>
              ) : null}

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-night/40">Ce que le vendeur cherche</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {wants.map((want) => (
                    <span key={want} className="rounded-full bg-kalico-blue/10 px-3 py-1.5 text-sm font-medium text-kalico-blue">
                      {want}
                    </span>
                  ))}
                </div>
                {complementLabel ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                    <HeartHandshake className="h-4 w-4" />
                    {complementLabel}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <TrocProposalForm listingId={listing.id} listingTitle={listing.title} />

            <section className="rounded-[1.75rem] border border-night/8 bg-white p-5 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-kalico-blue/80">Conseil</p>
              <h2 className="mt-2 text-lg font-bold text-night">Proposition structurï¿½e puis chat</h2>
              <p className="mt-2 text-sm leading-6 text-night/60">
                Commencez par dï¿½crire clairement ce que vous proposez. Une fois la proposition acceptï¿½e, la conversation de nï¿½gociation souvre automatiquement.
              </p>
              <div className="mt-4 rounded-2xl bg-night/5 p-4 text-sm text-night/65">
                <MessageSquareText className="mb-2 h-5 w-5 text-kalico-blue" />
                Le chat arrive aprï¿½s la proposition, pas avant.
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default function TrocDetailPage() {
  return <TrocDetailPageContent />
}
