'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Download, FileText, Loader2, Mail, MapPin, MessageCircle, BadgeCheck } from 'lucide-react'

import { proApi } from '@/lib/api'
import { showToast } from '@/lib/toast'

type QuoteRequest = {
  id: string
  proId: number | string
  proName: string
  proCommune?: string | null
  proCategory?: string | null
  requesterUserId?: number | null
  createdAt: string
  request: {
    requester_name: string
    requester_email: string
    requester_phone: string
    need_type: string
    commune: string
    budget_xpf: string
    desired_date: string
    details: string
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export default function ProDashboardDevisPage() {
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const response = await proApi.getQuoteRequestsReceived()
        if (!alive) return
        setRequests(Array.isArray(response.data?.data) ? response.data.data : [])
      } catch {
        if (!alive) return
        setRequests([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const handleDownload = async (request: QuoteRequest) => {
    setDownloadingId(request.id)
    try {
      const response = await proApi.downloadQuoteRequestPdf(request.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `devis-${request.id}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      showToast({
        tone: 'success',
        title: 'PDF téléchargé',
        message: 'Le devis a été exporté en PDF.',
      })
    } catch (error: any) {
      showToast({
        tone: 'error',
        title: 'Export impossible',
        message: error?.response?.data?.error || 'Impossible de générer le PDF pour le moment.',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-[2rem] bg-sand/70" />
        <div className="h-96 animate-pulse rounded-[2rem] bg-sand/70" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Demandes de devis</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Mes devis reçus</h1>
            <p className="mt-2 text-sm text-night/60">
              Suivez les demandes, retrouvez les contacts et téléchargez chaque devis en PDF pour l’archivage ou le partage interne.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-nc-lagonLight px-3 py-1.5 text-sm font-semibold text-nc-lagon">
            <BadgeCheck className="h-4 w-4" />
            {requests.length} demande{requests.length > 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {requests.length > 0 ? (
        <div className="grid gap-4">
          {requests.map((request) => (
            <article key={request.id} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-nc-lagon">
                      {formatDate(request.createdAt)}
                    </span>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
                      {request.proCategory || 'Professionnel'}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-semibold text-night">{request.request.need_type}</h2>
                  <p className="mt-1 text-sm text-night/60">
                    {request.proName} · {request.proCommune || 'Nouvelle-Calédonie'}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Demandeur</p>
                      <p className="mt-1 font-semibold text-night">{request.request.requester_name}</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Commune</p>
                      <p className="mt-1 font-semibold text-night">{request.request.commune}</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Budget</p>
                      <p className="mt-1 font-semibold text-night">
                        {request.request.budget_xpf ? `${Number(request.request.budget_xpf).toLocaleString('fr-FR')} XPF` : 'Non précisé'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-night/40">Date souhaitée</p>
                      <p className="mt-1 font-semibold text-night">{request.request.desired_date || 'Non précisée'}</p>
                    </div>
                  </div>

                  {request.request.details ? (
                    <p className="mt-4 rounded-2xl bg-[var(--color-background-secondary)] px-4 py-3 text-sm leading-relaxed text-night/70">
                      {request.request.details}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-2 lg:w-56">
                  <button
                    type="button"
                    onClick={() => handleDownload(request)}
                    disabled={downloadingId === request.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Télécharger PDF
                  </button>
                  <Link
                    href={`/messages?user=${request.requesterUserId || ''}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Répondre
                  </Link>
                  <a
                    href={`mailto:${request.request.requester_email}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center text-night/55">
          <FileText className="mx-auto h-8 w-8 text-night/25" />
          <p className="mt-3 text-lg font-semibold text-night">Aucune demande de devis reçue</p>
          <p className="mt-2 text-sm">Les prochaines demandes apparaîtront ici dès qu’un client vous enverra un formulaire.</p>
        </div>
      )}
    </div>
  )
}
