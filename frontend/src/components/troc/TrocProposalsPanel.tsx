'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Clock3, MessageSquareText, RotateCcw, XCircle } from 'lucide-react'
import { trocApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useAuthActionStore } from '@/store/authActionStore'
import type { TrocProposal } from '@/types/troc'

type ProposalWithListing = TrocProposal & {
  listing_title?: string
  listing_owner_id?: number
  owner_prenom?: string
  owner_nom?: string
  proposer_prenom?: string
  proposer_nom?: string
  counter_proposal?: TrocProposal | null
}

function formatName(prenom?: string | null, nom?: string | null) {
  return [prenom, nom].filter(Boolean).join(' ').trim() || 'Troceur'
}

function statusMeta(status: string) {
  switch (status) {
    case 'accepted':
      return { label: 'Accept�e', className: 'bg-jungle/10 text-jungle' }
    case 'declined':
      return { label: 'Refus�e', className: 'bg-night/6 text-night/55' }
    case 'countered':
      return { label: 'Contre-proposition', className: 'bg-blue-50 text-blue-700' }
    case 'completed':
      return { label: 'Finalis�e', className: 'bg-ocean/10 text-ocean' }
    case 'expired':
      return { label: 'Expir�e', className: 'bg-amber-50 text-amber-700' }
    case 'seen':
      return { label: 'Vue', className: 'bg-night/6 text-night/55' }
    default:
      return { label: 'En attente', className: 'bg-coral/10 text-coral' }
  }
}

export default function TrocProposalsPanel() {
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [counteringId, setCounteringId] = useState<string | number | null>(null)
  const [counterDescription, setCounterDescription] = useState('')
  const [counterComplementDirection, setCounterComplementDirection] = useState<'none' | 'i_pay' | 'they_pay'>('none')
  const [counterComplementXpf, setCounterComplementXpf] = useState(0)
  const [counterMessage, setCounterMessage] = useState('')
  const [busyId, setBusyId] = useState<string | number | null>(null)

  const snapTo10 = (value: number) => Math.max(0, Math.round(value / 10) * 10)

  const receivedQuery = useQuery({
    queryKey: ['troc', 'proposals', 'received'],
    queryFn: async () => {
      const response = await trocApi.getProposalsReceived()
      return Array.isArray(response.data?.data) ? response.data.data as ProposalWithListing[] : []
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 0,
  })

  const sentQuery = useQuery({
    queryKey: ['troc', 'proposals', 'sent'],
    queryFn: async () => {
      const response = await trocApi.getProposalsSent()
      return Array.isArray(response.data?.data) ? response.data.data as ProposalWithListing[] : []
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 0,
  })

  const proposals = tab === 'received' ? (receivedQuery.data ?? []) : (sentQuery.data ?? [])

  const visibleProposals = useMemo(() => proposals.slice(0, 6), [proposals])

  const handleAuthAction = () => {
    openAuthModal({
      type: 'troc_proposal',
      redirectTo: '/troc',
      listingId: 'troc-dashboard',
    })
  }

  const resetCounterForm = () => {
    setCounteringId(null)
    setCounterDescription('')
    setCounterComplementDirection('none')
    setCounterComplementXpf(0)
    setCounterMessage('')
  }

  const submitCounter = async (proposal: ProposalWithListing) => {
    if (!isAuthenticated) {
      handleAuthAction()
      return
    }
    if (!counterDescription.trim()) return

    setBusyId(proposal.id)
    try {
      await trocApi.counterProposal(proposal.id, {
        offered_listing_ids: [],
        offered_description: counterDescription.trim(),
        offered_photos: [],
        complement_direction: counterComplementDirection,
        complement_xpf: counterComplementDirection === 'none' ? 0 : snapTo10(Number(counterComplementXpf || 0)),
        message: counterMessage.trim(),
      })
      await Promise.all([receivedQuery.refetch(), sentQuery.refetch()])
      resetCounterForm()
    } finally {
      setBusyId(null)
    }
  }

  const handleAccept = async (proposalId: string | number) => {
    setBusyId(proposalId)
    try {
      await trocApi.acceptProposal(proposalId)
      await Promise.all([receivedQuery.refetch(), sentQuery.refetch()])
    } finally {
      setBusyId(null)
    }
  }

  const handleDecline = async (proposalId: string | number) => {
    setBusyId(proposalId)
    try {
      await trocApi.declineProposal(proposalId)
      await Promise.all([receivedQuery.refetch(), sentQuery.refetch()])
    } finally {
      setBusyId(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-[2rem] border border-night/8 bg-white p-6 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Mes propositions</p>
        <h2 className="mt-2 text-xl font-bold text-night">Suivez vos �changes structur�s</h2>
        <p className="mt-2 text-sm leading-6 text-night/60">
          Connectez-vous pour voir les propositions re�ues, vos envois, les contre-propositions et les cycles d�tect�s.
        </p>
        <button
          type="button"
          onClick={handleAuthAction}
          className="btn-primary mt-5 inline-flex px-4 py-2.5 text-sm"
        >
          Se connecter
        </button>
      </section>
    )
  }

  return (
    <section className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Mes propositions</p>
          <h2 className="mt-2 text-2xl font-bold text-night">Recevez, r�pondez, contre-proposez</h2>
          <p className="mt-2 text-sm leading-6 text-night/60">
            Gardez la main sur vos �changes structur�s. Une contre-proposition ouvre un nouveau fil sans perdre le contexte.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-night/10 bg-[var(--color-background-secondary)] p-1">
          {(['received', 'sent'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                tab === value ? 'bg-white text-night shadow-sm ring-1 ring-black/5' : 'text-night/75 hover:bg-white hover:text-night'
              }`}
            >
              {value === 'received' ? 'Re�ues' : 'Envoy�es'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {visibleProposals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-night/10 bg-sand/40 p-6 text-center text-sm text-night/55">
            {tab === 'received'
              ? 'Aucune proposition re�ue pour le moment.'
              : 'Vous navez pas encore envoy� de proposition de troc.'}
          </div>
        ) : visibleProposals.map((proposal) => {
          const meta = statusMeta(proposal.status)
          const ownerName = formatName(proposal.owner_prenom, proposal.owner_nom)
          const proposerName = formatName(proposal.proposer_prenom, proposal.proposer_nom)
          const isReceived = tab === 'received'
          const isCountering = counteringId === proposal.id
          const hasCounterProposal = Boolean(proposal.counter_proposal?.id)

          return (
            <article key={proposal.id} className="rounded-3xl border border-night/8 bg-sand/25 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
                    {hasCounterProposal ? (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        Contre-proposition re�ue
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-night">
                    {proposal.listing_title || `Annonce #${proposal.listing_id}`}
                  </h3>
                  <p className="mt-1 text-sm text-night/60">
                    {isReceived
                      ? `${proposerName} vous propose un �change`
                      : `Votre proposition a �t� envoy�e � ${ownerName}`}
                  </p>

                  {proposal.offered_description ? (
                    <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-night/70">
                      {proposal.offered_description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-night/60">
                    {proposal.complement_xpf > 0 ? (
                      <span className="rounded-full bg-white px-2.5 py-1 font-medium">
                        {proposal.complement_direction === 'they_pay'
                          ? `Demande ${Number(proposal.complement_xpf).toLocaleString('fr-FR')} XPF`
                          : `Ajoute ${Number(proposal.complement_xpf).toLocaleString('fr-FR')} XPF`}
                      </span>
                    ) : null}
                    {proposal.expires_at ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium">
                        <Clock3 className="h-3.5 w-3.5" />
                        Expire bient�t
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/troc/${proposal.listing_id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-night/10 bg-white px-3 py-2 text-sm font-semibold text-night/70 transition hover:border-coral/30 hover:text-coral"
                  >
                    Voir lannonce
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {isReceived && ['pending', 'seen', 'countered'].includes(proposal.status) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAccept(proposal.id)}
                        disabled={busyId === proposal.id}
                        className="inline-flex items-center gap-2 rounded-full bg-jungle px-3 py-2 text-sm font-semibold text-white transition hover:bg-jungle/90 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Accepter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(proposal.id)}
                        disabled={busyId === proposal.id}
                        className="inline-flex items-center gap-2 rounded-full bg-night px-3 py-2 text-sm font-semibold text-white transition hover:bg-night/90 disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Refuser
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCounteringId(isCountering ? null : proposal.id)
                          setCounterDescription(proposal.offered_description || '')
                          setCounterComplementDirection('none')
                          setCounterComplementXpf(0)
                          setCounterMessage('')
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-coral/20 bg-coral/8 px-3 py-2 text-sm font-semibold text-coral transition hover:bg-coral/12"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Contre-proposer
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {isCountering && isReceived ? (
                <div className="mt-4 rounded-2xl border border-coral/15 bg-white p-4">
                  <p className="text-sm font-semibold text-night">Nouvelle contre-proposition</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="block space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-night">Ce que vous proposez</span>
                      <textarea
                        value={counterDescription}
                        onChange={(event) => setCounterDescription(event.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
                        placeholder="D�crivez votre contre-proposition..."
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-night">Compl�ment XPF</span>
                      <select
                        value={counterComplementDirection}
                        onChange={(event) => setCounterComplementDirection(event.target.value as 'none' | 'i_pay' | 'they_pay')}
                        className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
                      >
                        <option value="none">Aucun compl�ment</option>
                        <option value="i_pay">Je propose un compl�ment</option>
                        <option value="they_pay">Je demande un compl�ment</option>
                      </select>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-night">Montant</span>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={counterComplementXpf}
                        onChange={(event) => setCounterComplementXpf(Number(event.target.value || 0))}
                        onBlur={(event) => setCounterComplementXpf(snapTo10(Number(event.target.value || 0)))}
                        disabled={counterComplementDirection === 'none'}
                        className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10 disabled:bg-night/5"
                      />
                    </label>

                    <label className="block space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-night">Message facultatif</span>
                      <textarea
                        value={counterMessage}
                        onChange={(event) => setCounterMessage(event.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
                        placeholder="Ajoutez quelques pr�cisions..."
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetCounterForm}
                      className="inline-flex items-center gap-2 rounded-full border border-night/10 bg-white px-3 py-2 text-sm font-semibold text-night/65 transition hover:text-night"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => submitCounter(proposal)}
                      disabled={busyId === proposal.id || !counterDescription.trim()}
                      className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral/90 disabled:opacity-60"
                    >
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Envoyer la contre-proposition
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
