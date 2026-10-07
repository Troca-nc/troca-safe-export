'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BellRing, CheckCircle2, CircleDollarSign, FileClock, FileInput, LockKeyhole } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { markProQuotePaid, remindProQuote } from '@/lib/data/pro-space'
import { formatXpf, quoteTrackingColumn, trackingCounts } from '@/lib/proSpacePresentation'
import type { ProQuote, ProQuoteRequest, QuoteTrackingColumn } from '@/types/pro-space'

const columnMeta: Array<{ id: QuoteTrackingColumn; label: string; description: string; icon: typeof FileInput }> = [
  { id: 'requests', label: 'Demandes', description: 'À préparer', icon: FileInput },
  { id: 'sent', label: 'Envoyés', description: 'En attente du client', icon: FileClock },
  { id: 'accepted', label: 'Acceptés', description: 'À réaliser ou encaisser', icon: CheckCircle2 },
  { id: 'paid', label: 'Payés', description: 'Déclarés par le professionnel', icon: CircleDollarSign },
]

function dateLabel(value: string | null) {
  if (!value) return 'Date non renseignée'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

function QuoteCard({ quote, busy, onRemind, onPaid }: { quote: ProQuote; busy: boolean; onRemind: (quote: ProQuote) => void; onPaid: (quote: ProQuote) => void }) {
  const column = quoteTrackingColumn(quote.status)
  const remindedRecently = quote.last_reminded_at
    ? Date.now() - new Date(quote.last_reminded_at).getTime() < 24 * 60 * 60 * 1000
    : false
  return (
    <article className="rounded-card border border-warm-border bg-cream-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{quote.requester_name}</p><p className="mt-1 text-label-sm text-ink/55">{quote.quote_number}</p></div><span className="rounded-pill bg-info-soft px-3 py-1 text-label-sm text-info-text">{quote.status}</span></div>
      <p className="mt-3 line-clamp-2 text-body-sm text-ink/70">{quote.subject}</p>
      <p className="mt-3 font-display text-h4">{formatXpf(quote.total_xpf)}</p>
      <p className="mt-1 text-label-sm text-ink/55">Créé le {dateLabel(quote.created_at)}</p>
      <div className="mt-4 grid gap-2">
        {column === 'sent' ? <Button compact variant="secondary" loading={busy} loadingLabel="Relance…" disabled={remindedRecently} onClick={() => onRemind(quote)}><BellRing className="h-4 w-4" aria-hidden="true" />{remindedRecently ? 'Relance déjà envoyée' : 'Relancer le client'}</Button> : null}
        {column === 'accepted' ? <Button compact loading={busy} loadingLabel="Mise à jour…" onClick={() => onPaid(quote)}><CircleDollarSign className="h-4 w-4" aria-hidden="true" />Déclarer payé</Button> : null}
        <Link href={`/pro/dashboard/devis?quote=${quote.id}`} className="k-button k-button-tertiary k-button-compact">Ouvrir le devis</Link>
      </div>
    </article>
  )
}

function RequestCard({ request }: { request: ProQuoteRequest }) {
  return (
    <article className="rounded-card border border-warm-border bg-cream-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{request.request.requester_name}</p><p className="mt-1 text-label-sm text-ink/55">{dateLabel(request.createdAt)}</p></div>{request.isLockedForFree ? <LockKeyhole className="h-5 w-5 text-accent-text" aria-label="Accès différé" /> : null}</div>
      <p className="mt-3 text-body-sm text-ink/70">{request.request.need_type || 'Besoin à préciser'} · {request.request.commune}</p>
      {request.request.budget_xpf ? <p className="mt-3 font-display text-h4">{formatXpf(Number(request.request.budget_xpf))}</p> : null}
      <Link href={`/pro/dashboard/devis?request=${request.id}`} className="k-button k-button-tertiary k-button-compact mt-4 w-full">Préparer un devis</Link>
    </article>
  )
}

export default function ProQuoteTrackingTab({ initialQuotes, requests }: { initialQuotes: ProQuote[]; requests: ProQuoteRequest[] }) {
  const [quotes, setQuotes] = useState(initialQuotes)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const counts = useMemo(() => trackingCounts(requests, quotes), [quotes, requests])

  const updateQuote = (quote: ProQuote) => setQuotes((current) => current.map((item) => item.id === quote.id ? quote : item))

  const remind = async (quote: ProQuote) => {
    setBusyId(quote.id)
    setFeedback(null)
    try {
      const updated = await remindProQuote(quote.id)
      updateQuote(updated ?? { ...quote, last_reminded_at: new Date().toISOString(), reminder_count: quote.reminder_count + 1 })
      setFeedback({ tone: 'success', message: `La relance de ${quote.quote_number} a été enregistrée.` })
    } catch {
      setFeedback({ tone: 'error', message: 'La relance n’a pas pu être envoyée. Vérifiez le délai de 24 heures.' })
    } finally {
      setBusyId(null)
    }
  }

  const markPaid = async (quote: ProQuote) => {
    setBusyId(quote.id)
    setFeedback(null)
    try {
      const updated = await markProQuotePaid(quote.id)
      updateQuote(updated ?? { ...quote, status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      setFeedback({ tone: 'success', message: `${quote.quote_number} est déclaré payé par le professionnel.` })
    } catch {
      setFeedback({ tone: 'error', message: 'Le devis n’a pas pu être déclaré payé. Rechargez les données puis réessayez.' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-eyebrow uppercase text-accent-text">Pipeline</p><h2 className="mt-2 font-display text-h3 font-normal">Suivi des demandes et devis</h2><p className="mt-3 max-w-3xl text-body-sm text-ink/65">Les devis refusés ou expirés restent disponibles dans la vue détaillée. La colonne Payés correspond à une déclaration du professionnel.</p></div><Link href="/pro/dashboard/devis" className="k-button k-button-secondary">Vue détaillée des devis</Link></div>
      {feedback ? <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert> : null}
      <div className="grid gap-4 lg:grid-cols-4">
        {columnMeta.map((column) => {
          const Icon = column.icon
          const columnQuotes = quotes.filter((quote) => quoteTrackingColumn(quote.status) === column.id)
          return (
            <section key={column.id} className="min-w-0 rounded-block border border-warm-border bg-cream-sunken p-3" aria-labelledby={`tracking-${column.id}`}>
              <div className="flex items-center justify-between gap-3 px-1 py-2"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-control bg-cream-surface text-info-text"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><h3 id={`tracking-${column.id}`} className="font-display text-h4">{column.label}</h3><p className="text-label-sm text-ink/55">{column.description}</p></div></div><span className="rounded-pill bg-ink px-3 py-1 text-label-sm text-cream">{counts[column.id]}</span></div>
              <div className="mt-3 grid gap-3">
                {column.id === 'requests' ? requests.map((request) => <RequestCard key={`request-${request.id}`} request={request} />) : null}
                {columnQuotes.map((quote) => <QuoteCard key={quote.id} quote={quote} busy={busyId === quote.id} onRemind={remind} onPaid={markPaid} />)}
                {counts[column.id] === 0 ? <p className="rounded-control bg-cream-surface p-4 text-body-sm text-ink/60">Aucun élément dans cette colonne.</p> : null}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
