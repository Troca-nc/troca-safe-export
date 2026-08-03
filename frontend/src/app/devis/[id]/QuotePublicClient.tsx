'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Download, Loader2, Mail, MessageCircle, XCircle, CheckCircle2 } from 'lucide-react'

import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { proQuotesApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import type { PublicQuote } from '../publicQuoteData'

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString('fr-FR')} XPF`
}

function formatDate(value?: string | null) {
  if (!value) return 'Non pr�cis�e'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

function formatStatus(status: string) {
  const value = String(status || '').toLowerCase()
  if (value === 'draft') return 'Brouillon'
  if (value === 'sent') return 'Envoy�'
  if (value === 'viewed') return 'Consult�'
  if (value === 'accepted') return 'Accept�'
  if (value === 'refused') return 'Refus�'
  if (value === 'expired') return 'Expir�'
  if (value === 'converted') return 'Converti'
  return status || 'Inconnu'
}

type QuotePublicClientProps = {
  quote: PublicQuote
  token: string
}

export default function QuotePublicClient({ quote, token }: QuotePublicClientProps) {
  const [busy, setBusy] = useState<null | 'download' | 'accept' | 'refuse'>(null)
  const [refuseReason, setRefuseReason] = useState('')
  const [localStatus, setLocalStatus] = useState(quote.status)

  const handleDownload = async () => {
    setBusy('download')
    try {
      const response = await proQuotesApi.downloadPdf(quote.id, token)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${quote.quote_number || `devis-${quote.id}`}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      showToast({ tone: 'success', title: 'PDF t�l�charg�', message: 'Le devis a �t� enregistr� en PDF.' })
    } catch (error: any) {
      showToast({
        tone: 'error',
        title: 'T�l�chargement impossible',
        message: error?.response?.data?.error || 'Impossible de t�l�charger le PDF pour le moment.',
      })
    } finally {
      setBusy(null)
    }
  }

  const handleAccept = async () => {
    setBusy('accept')
    try {
      await proQuotesApi.accept(quote.id, { token })
      setLocalStatus('accepted')
      showToast({
        tone: 'success',
        title: 'Devis accept�',
        message: 'Le professionnel a �t� notifi�.',
      })
    } catch (error: any) {
      showToast({
        tone: 'error',
        title: 'Acceptation impossible',
        message: error?.response?.data?.error || 'Impossible daccepter ce devis.',
      })
    } finally {
      setBusy(null)
    }
  }

  const handleRefuse = async () => {
    setBusy('refuse')
    try {
      await proQuotesApi.refuse(quote.id, { token, reason: refuseReason.trim() || null })
      setLocalStatus('refused')
      showToast({
        tone: 'success',
        title: 'Devis refus�',
        message: 'Le professionnel a �t� notifi�.',
      })
    } catch (error: any) {
      showToast({
        tone: 'error',
        title: 'Refus impossible',
        message: error?.response?.data?.error || 'Impossible de refuser ce devis.',
      })
    } finally {
      setBusy(null)
    }
  }

  const canDecide = ['sent', 'viewed'].includes(String(localStatus).toLowerCase())
  const contactHref = quote.pro?.id ? `/messages?user=${quote.pro.id}` : '/messages'

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Devis</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">{quote.quote_number}</h1>
            <p className="mt-2 text-sm text-night/60">
              {quote.pro.display_name} � {quote.subject}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-sm font-semibold text-night">
            Statut: {formatStatus(localStatus)}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Professionnel</p>
                  <p className="mt-1 text-lg font-semibold text-night">{quote.pro.display_name}</p>
                  <p className="mt-1 text-sm text-night/60">{quote.pro.pro_company_name || quote.pro.pro_category || 'Professionnel Kalico'}</p>
                  <p className="mt-1 text-sm text-night/60">{quote.pro.pro_commune || 'Nouvelle-Cal�donie'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Client</p>
                  <p className="mt-1 text-lg font-semibold text-night">{quote.requester_name}</p>
                  <p className="mt-1 text-sm text-night/60">{quote.requester_email}</p>
                  {quote.requester_phone ? <p className="mt-1 text-sm text-night/60">{quote.requester_phone}</p> : null}
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Lignes</p>
              <div className="mt-4 space-y-3">
                {quote.items.map((item, index) => (
                  <div key={item.id || `${index}`} className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-night">{index + 1}. {item.label}</p>
                        {item.description ? <p className="mt-1 text-sm text-night/55">{item.description}</p> : null}
                        <p className="mt-1 text-xs text-night/45">
                          {item.quantity} x {formatMoney(item.unit_price_xpf)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-night">{formatMoney(item.total_xpf)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Totaux</p>
              <div className="mt-4 space-y-2 rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <div className="flex items-center justify-between text-sm text-night/65">
                  <span>Sous-total</span>
                  <span className="font-semibold text-night">{formatMoney(quote.subtotal_xpf)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-night/65">
                  <span>TGC ({quote.tax_rate || 0}%)</span>
                  <span className="font-semibold text-night">{formatMoney(quote.tax_amount_xpf)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-base font-bold text-night">
                  <span>Total</span>
                  <span>{formatMoney(quote.total_xpf)}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-night/60">
                <p><strong>Validit� :</strong> {formatDate(quote.valid_until)}</p>
                <p><strong>Envoy� :</strong> {formatDate(quote.sent_at)}</p>
                <p><strong>Vu :</strong> {formatDate(quote.viewed_at)}</p>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Actions</p>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)] disabled:opacity-60"
                >
                  {busy === 'download' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  T�l�charger PDF
                </button>

                {canDecide ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleAccept()}
                      disabled={busy !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
                    >
                      {busy === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Accepter
                    </button>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-night">Raison du refus</span>
                      <textarea
                        rows={3}
                        value={refuseReason}
                        onChange={(event) => setRefuseReason(event.target.value)}
                        className="input w-full rounded-2xl py-3"
                        placeholder="Expliquez votre retour..."
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void handleRefuse()}
                      disabled={busy !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {busy === 'refuse' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Refuser
                    </button>
                  </>
                ) : null}

                {localStatus === 'accepted' ? (
                  <Link
                    href={contactHref}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contacter le professionnel
                  </Link>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {quote.client_note ? (
        <div className="mt-6 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Note client</p>
          <p className="mt-2 whitespace-pre-line text-sm text-night/70">{quote.client_note}</p>
        </div>
      ) : null}

      <div className="mt-6 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <FeedbackAlert tone="info" title="Devis s�curis�">
          Ce lien permet dafficher et de g�rer votre devis sans passer par une inscription suppl�mentaire.
        </FeedbackAlert>
      </div>
    </main>
  )
}
