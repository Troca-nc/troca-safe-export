'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

import TrocBalanceGraphic from './TrocBalanceGraphic'
import { calculateTrocBalance, TROC_COMPLEMENT_STEP } from '@/lib/trocBalance'
import type { TrocListing } from '@/types/troc-page'

type Props = {
  target: TrocListing
  myListings: TrocListing[]
  isAuthenticated: boolean
  onRequireAuth: () => void
  onPropose: (mine: TrocListing, complement: number) => Promise<void>
}

const formatXpf = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} F`

export default function TrocometerPanel({ target, myListings, isAuthenticated, onRequireAuth, onPropose }: Props) {
  const [selectedMineId, setSelectedMineId] = useState(myListings[0]?.id ?? '')
  const [complement, setComplement] = useState(0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!myListings.some((listing) => listing.id === selectedMineId)) setSelectedMineId(myListings[0]?.id ?? '')
  }, [myListings, selectedMineId])

  useEffect(() => {
    setComplement(0)
    setError(null)
    setSuccess(false)
  }, [target.id])

  const mine = myListings.find((listing) => listing.id === selectedMineId) ?? null
  const balance = useMemo(() => calculateTrocBalance({
    offeredValue: mine?.valueXpf ?? 0,
    requestedValue: target.valueXpf,
    complement,
  }), [mine, target.valueXpf, complement])
  const rangeMax = Math.max(5000, Math.ceil(Math.max(target.valueXpf, mine?.valueXpf ?? 0) / 10000) * 10000)

  const verdict = !mine
    ? { title: 'Ajoutez une annonce dans la balance', body: 'Déposez un objet recherché par le vendeur pour obtenir une estimation juste.' }
    : balance.isBalanced
      ? { title: 'Échange équilibré', body: 'Les valeurs déclarées sont dans une marge de 10 %. Vous pouvez faire une proposition.' }
      : balance.difference > 0
        ? { title: 'Votre côté est plus léger', body: `Un complément proche de ${formatXpf(balance.suggestedComplement)} peut rééquilibrer la proposition.` }
        : { title: 'Votre côté est plus lourd', body: `Vous pouvez demander environ ${formatXpf(balance.suggestedComplement)} en retour.` }

  const handleBalance = () => {
    if (!mine) return
    setComplement(balance.suggestedDirection === 'offered' ? balance.suggestedComplement : -balance.suggestedComplement)
  }

  const handleProposal = async () => {
    if (!mine) return
    if (!isAuthenticated) {
      onRequireAuth()
      return
    }
    setSending(true)
    setError(null)
    setSuccess(false)
    try {
      await onPropose(mine, complement)
      setSuccess(true)
    } catch {
      setError('La proposition n’a pas pu être envoyée. Réessayez dans un instant.')
    } finally {
      setSending(false)
    }
  }

  return (
    <aside className="overflow-hidden rounded-block border border-warm-border bg-cream-surface shadow-panel xl:sticky xl:top-28">
      <div className="px-5 pt-6 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-eyebrow uppercase text-accent-text">Trocomètre</p>
          <span className="text-meta text-ink/60">Valeurs déclarées par les vendeurs</span>
        </div>
        <h2 className="mt-2 font-display text-h3">{target.title}</h2>
        <p className="mt-1 text-body-sm text-ink/65">{target.sellerName} · {target.commune} · {target.condition}</p>
      </div>

      <TrocBalanceGraphic mine={mine} target={target} angle={balance.angle} complement={complement} />

      <div className={`mx-5 flex flex-col items-start gap-3 rounded-card border-l-[3px] p-4 sm:mx-7 sm:flex-row ${balance.isBalanced && mine ? 'border-reef bg-reef/10' : 'border-accent bg-accent/10'}`}>
        <div className="min-w-0 flex-1">
          <p className={`text-h5 ${balance.isBalanced && mine ? 'text-reef-text' : 'text-accent-text'}`}>{verdict.title}</p>
          <p className="mt-1 text-body-sm text-ink/70">{verdict.body}</p>
        </div>
        {mine && !balance.isBalanced ? (
          <button type="button" onClick={handleBalance} className="k-button k-button-secondary shrink-0">Équilibrer</button>
        ) : null}
      </div>

      {mine ? (
        <div className="px-5 pt-5 sm:px-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="troc-complement" className="text-label-sm text-ink/70">Complément en argent</label>
            <p className="text-label">{complement === 0 ? 'Aucun' : complement > 0 ? `Vous ajoutez ${formatXpf(complement)}` : `${target.sellerName.split(' ')[0]} ajoute ${formatXpf(-complement)}`}</p>
          </div>
          <input
            id="troc-complement"
            type="range"
            min={-rangeMax}
            max={rangeMax}
            step={TROC_COMPLEMENT_STEP}
            value={complement}
            onChange={(event) => setComplement(Number(event.target.value))}
            className="mt-2 h-11 w-full cursor-pointer accent-accent-strong"
          />
          <div className="flex justify-between gap-2 text-caption text-ink/60"><span>Le vendeur ajoute</span><span>Aucun</span><span>Vous ajoutez</span></div>

          <p className="mt-5 text-eyebrow-sm uppercase text-ink/55">Mettre dans la balance</p>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
            {myListings.map((listing) => (
              <button
                key={listing.id}
                type="button"
                onClick={() => { setSelectedMineId(listing.id); setComplement(0) }}
                aria-pressed={listing.id === mine.id}
                className={`min-h-20 rounded-control border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${listing.id === mine.id ? 'border-ink bg-cream-sunken' : 'border-warm-border bg-cream-surface hover:border-ink'}`}
              >
                <span className="block truncate text-label-sm">{listing.title}</span>
                <span className="mt-1 block text-meta text-ink/65">{formatXpf(listing.valueXpf)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mx-5 mt-5 rounded-card bg-cream-sunken p-4 sm:mx-7 sm:p-5">
        <p className="text-eyebrow-sm uppercase text-ink/60">Ce que {target.sellerName.split(' ')[0]} aimerait en échange</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(target.wants.length ? target.wants : ['Propositions']).map((want) => <span key={want} className="rounded-pill border border-warm-border bg-cream-surface px-3 py-1.5 text-label-sm">{want}</span>)}
        </div>
        <p className="mt-3 font-display text-[22px] italic leading-snug">« {target.wish} »</p>
        <p className="mt-2 text-meta text-ink/65">{target.acceptsComplement ? `Accepte un complément jusqu’à ${formatXpf(target.complementMaxXpf)}.` : 'Préfère un échange sans complément en argent.'}</p>
      </div>

      <div className="p-5 sm:p-7">
        {mine ? (
          <>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button type="button" onClick={handleProposal} disabled={sending} className="k-button k-button-primary min-h-[52px] flex-1">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Proposer cet échange{complement > 0 ? ` + ${formatXpf(complement)}` : ''}
              </button>
              <Link href={`/troc/${target.id}`} className="k-button k-button-secondary min-h-[52px]">Écrire</Link>
            </div>
            <p className="mt-2.5 text-meta text-ink/60">Le vendeur reçoit la proposition avec la balance. Rien n’est engagé avant votre rencontre.</p>
          </>
        ) : (
          <>
            <p className="text-body-sm text-ink/70">Vous n’avez pas encore d’annonce en ligne à mettre en face. Déposez un objet dans une catégorie recherchée, ou proposez autre chose directement.</p>
            <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row">
              <Link href="/deposer?type=troc" className="k-button k-button-primary min-h-[52px] flex-1">Déposer un objet{target.wants[0] ? ` « ${target.wants[0]} »` : ''}</Link>
              <Link href={`/troc/${target.id}`} className="k-button k-button-secondary min-h-[52px]">Proposer autre chose</Link>
            </div>
          </>
        )}
        {success ? <p className="mt-3 inline-flex items-center gap-2 text-label text-reef-text"><CheckCircle2 className="h-4 w-4" />Proposition envoyée.</p> : null}
        {error ? <p role="alert" className="mt-3 text-body-sm text-alert-error">{error}</p> : null}
      </div>
    </aside>
  )
}
