'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, Clock3, MessageSquareText } from 'lucide-react'
import Header from '@/components/layout/Header'
import ListingImage from '@/components/ListingImage'
import { ListingSkeleton } from '@/components/ListingSkeleton'
import { trocApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'
import type { TrocCycle, TrocListing } from '@/types/troc'

type CycleListing = TrocListing & {
  seller_prenom?: string | null
  seller_nom?: string | null
  seller_is_pro?: boolean
  commune_name?: string | null
  images?: Array<{ url?: string | null; thumbnail_url?: string | null; is_cover?: boolean }>
}

function formatName(prenom?: string | null, nom?: string | null) {
  return [prenom, nom].filter(Boolean).join(' ').trim() || 'Troceur'
}

function formatTimeRemaining(expiresAt?: string | null) {
  if (!expiresAt) return '48 h pour confirmer'
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (!Number.isFinite(diff)) return '48 h pour confirmer'
  const hours = Math.max(0, Math.ceil(diff / 3_600_000))
  return hours > 24 ? `${Math.ceil(hours / 24)} j restants` : `${hours} h restantes`
}

export default function TrocCyclePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const cycleId = params?.id ? String(params.id) : ''
  const [conversationId, setConversationId] = useState<string | number | null>(null)

  const { data: cyclesData, isLoading: cyclesLoading, refetch } = useQuery({
    queryKey: ['troc', 'cycles'],
    queryFn: async () => {
      const response = await trocApi.getCycles()
      return Array.isArray(response.data?.data) ? (response.data.data as TrocCycle[]) : []
    },
    enabled: Boolean(isAuthenticated),
    staleTime: 30_000,
    retry: 0,
  })

  const cycle = useMemo(() => {
    if (!Array.isArray(cyclesData)) return null
    return cyclesData.find((item) => String(item.id) === String(cycleId)) ?? null
  }, [cycleId, cyclesData])

  const listingQueries = useQueries({
    queries: (cycle?.listing_ids ?? []).map((listingId) => ({
      queryKey: ['troc', 'cycle', cycleId, 'listing', listingId],
      queryFn: async () => {
        const response = await trocApi.getById(listingId)
        const payload = response.data?.data ?? response.data
        return payload as CycleListing
      },
      enabled: Boolean(cycle?.listing_ids?.length),
      staleTime: 30_000,
      retry: 0,
    })),
  })

  const listings = listingQueries.map((entry) => entry.data).filter(Boolean) as CycleListing[]
  const participants = listings.map((listing) => formatName(listing.seller_prenom, listing.seller_nom))
  const confirmations = Array.isArray(cycle?.confirmations) ? cycle.confirmations : []
  const allConfirmed = Boolean(cycle && cycle.status === 'all_accepted')

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      openAuthModal({
        type: 'troc_proposal',
        listingId: String(cycleId),
        redirectTo: `/troc/cycles/${cycleId}`,
      })
      return
    }

    const response = await trocApi.confirmCycle(cycleId)
    const conversationId =
      response.data?.data?.conversation?.id ??
      response.data?.data?.conversation_id ??
      response.data?.conversation_id ??
      null

    await refetch()
    if (conversationId) {
      setConversationId(conversationId)
      router.push(`/messages?conv=${conversationId}`)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-[2rem] border border-night/8 bg-white p-8 text-center shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Troc</p>
            <h1 className="mt-3 text-3xl font-bold text-night">Connectez-vous pour voir ce cycle</h1>
            <p className="mt-3 text-sm leading-6 text-night/60">
              Les cycles de troc sont r�serv�s aux participants concern�s.
            </p>
            <button
              type="button"
            onClick={() => openAuthModal({
                type: 'troc_proposal',
                listingId: String(cycleId),
                redirectTo: `/troc/cycles/${cycleId}`,
              })}
              className="btn-primary mt-6 inline-flex px-4 py-2.5 text-sm"
            >
              Se connecter
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (cyclesLoading && !cycle) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <ListingSkeleton />
        </main>
      </div>
    )
  }

  if (!cycle) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-[2rem] border border-night/8 bg-white p-8 text-center shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Troc</p>
            <h1 className="mt-3 text-3xl font-bold text-night">Cycle introuvable</h1>
            <p className="mt-3 text-sm leading-6 text-night/60">
              Ce cycle nest plus disponible ou ne vous concerne plus.
            </p>
            <Link href="/troc" className="btn-primary mt-6 inline-flex px-4 py-2.5 text-sm">
              Retour au feed Troc
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/troc" className="inline-flex items-center gap-2 text-sm font-semibold text-night/60 transition hover:text-coral">
          <ArrowLeft className="h-4 w-4" />
          Retour au feed Troc
        </Link>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-night/8 bg-night px-6 py-8 text-white shadow-[0_18px_70px_rgba(8,32,50,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
                <Clock3 className="h-3.5 w-3.5" />
                {formatTimeRemaining(cycle.expires_at)}
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                = Troc en cha�ne
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                Trois annonces compatibles peuvent sencha�ner. Chaque participant confirme sa part avant douvrir le chat de groupe.
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-white/10 p-4 text-sm text-white/80">
              <p className="font-semibold text-white">Statut</p>
              <p className="mt-1 capitalize">{cycle.status.replaceAll('_', ' ')}</p>
              <p className="mt-3 text-xs text-white/65">
                {confirmations.length}/{cycle.participant_ids.length} confirmations
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-night/8 bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-xl font-bold text-night">Visualisation du cycle</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {listings.map((listing, index) => {
              const participantName = formatName(listing.seller_prenom, listing.seller_nom)
              const next = listings[(index + 1) % listings.length]
              return (
                <div key={listing.id} className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-sand">
                    <ListingImage
                      src={
                        listing.images?.find((image) => image.is_cover)?.url ??
                        listing.images?.[0]?.url ??
                        listing.images?.[0]?.thumbnail_url ??
                        null
                      }
                      alt={listing.title}
                      fallbackIcon="="
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/60">
                      {participantName}
                    </span>
                    {listing.seller_is_pro ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2.5 py-1 text-[11px] font-semibold text-coral">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Pro
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-lg font-bold text-night">{listing.title}</h3>
              <p className="mt-2 text-sm text-night/60">{listing.commune_name ?? 'Nouvelle-Cal�donie'}</p>
                  {index < listings.length - 1 ? (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-night/60">
                      <ArrowRight className="h-3.5 w-3.5 text-coral" />
                      Vers {formatName(next.seller_prenom, next.seller_nom)}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-night/8 bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-bold text-night">D�tail de chaque �change</h2>
            <div className="mt-4 space-y-3">
              {listings.length === 3 ? (
                <>
                  <div className="rounded-2xl bg-sand/40 px-4 py-3 text-sm text-night/70">
                    {formatName(listings[0].seller_prenom, listings[0].seller_nom)} donne <strong>{listings[0].title}</strong> � {formatName(listings[1].seller_prenom, listings[1].seller_nom)}.
                  </div>
                  <div className="rounded-2xl bg-sand/40 px-4 py-3 text-sm text-night/70">
                    {formatName(listings[1].seller_prenom, listings[1].seller_nom)} donne <strong>{listings[1].title}</strong> � {formatName(listings[2].seller_prenom, listings[2].seller_nom)}.
                  </div>
                  <div className="rounded-2xl bg-sand/40 px-4 py-3 text-sm text-night/70">
                    {formatName(listings[2].seller_prenom, listings[2].seller_nom)} donne <strong>{listings[2].title}</strong> � {formatName(listings[0].seller_prenom, listings[0].seller_nom)}.
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-night/10 bg-sand/40 px-4 py-3 text-sm text-night/60">
                  Ce cycle n�cessite trois annonces pour afficher la boucle compl�te.
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-night/8 bg-night/5 p-4">
              <p className="text-sm font-semibold text-night">Statut des confirmations</p>
              <div className="mt-3 space-y-2">
                {cycle.participant_ids.map((participantId, index) => {
                  const confirmed = confirmations.some((value) => Number(value) === Number(participantId))
                  const name = formatName(listings[index]?.seller_prenom, listings[index]?.seller_nom)
                  return (
                    <div key={participantId} className="flex items-center gap-2 text-sm text-night/65">
                      <span>{confirmed ? '' : '�'}</span>
                      <span>{name} {confirmed ? 'a confirm�' : 'na pas encore confirm�'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.75rem] border border-night/8 bg-white p-5 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Action</p>
              <h2 className="mt-2 text-xl font-bold text-night">Confirmer votre participation</h2>
              <p className="mt-2 text-sm leading-6 text-night/60">
                En confirmant, vous acceptez dorganiser l�change avec les autres participants. Kalico nassure pas la remise des objets.
              </p>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={allConfirmed}
                className="btn-primary mt-5 inline-flex w-full items-center justify-center px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {allConfirmed ? 'Cycle d�j� confirm�' : 'Je confirme ma participation'}
              </button>
            </div>

            {allConfirmed ? (
              <div className="rounded-[1.75rem] border border-jungle/20 bg-jungle/8 p-5 text-jungle">
                <p className="text-sm font-semibold">Tout le monde a confirm� !</p>
                <p className="mt-2 text-sm leading-6 text-jungle/80">
                  Ouvrez maintenant le chat de groupe pour organiser les remises.
                </p>
                <Link
                  href={conversationId ? `/messages?conv=${conversationId}` : '/messages'}
                  className="btn-ghost mt-4 inline-flex w-full items-center justify-center px-4 py-3 text-sm"
                >
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Ouvrir le chat de groupe
                </Link>
              </div>
            ) : null}
          </aside>
        </section>
      </main>
    </div>
  )
}
