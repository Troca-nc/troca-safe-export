'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BadgeCheck, CalendarDays, Download, Loader2, Mail, MapPin, MessageCircle, Sparkles, User } from 'lucide-react'

import { proApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { showToast } from '@/lib/toast'

type QuoteRequestDetail = {
  id: string
  proId: number
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
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function QuoteRequestDetailClient({ requestId }: { requestId: string }) {
  const { user, isAuthenticated } = useAuthStore()
  const [data, setData] = useState<QuoteRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await proApi.getQuoteRequestById(requestId)
        if (!alive) return
        setData(response.data?.data || null)
      } catch (err: any) {
        if (!alive) return
        setData(null)
        setError(err?.response?.data?.error || 'Impossible de charger cette demande.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [requestId])

  const isProOwner = useMemo(() => {
    if (!user || !data) return false
    return Boolean(user.is_pro && Number(user.id) === Number(data.proId))
  }, [data, user])

  const isRequester = useMemo(() => {
    if (!user || !data) return false
    return Number(user.id) === Number(data.requesterUserId)
  }, [data, user])

  const handleDownloadPdf = async () => {
    if (!data) return
    setDownloading(true)
    try {
      const response = await proApi.downloadQuoteRequestPdf(data.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `devis-${data.id}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      showToast({
        tone: 'success',
        title: 'PDF téléchargé',
        message: 'La demande a été exportée en PDF.',
      })
    } catch (err: any) {
      showToast({
        tone: 'error',
        title: 'Téléchargement impossible',
        message: err?.response?.data?.error || 'Impossible de générer le PDF.',
      })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="h-32 animate-pulse rounded-[1.5rem] bg-sand/70" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <p className="text-lg font-semibold text-night">Connectez-vous pour voir cette demande.</p>
        <p className="mt-2 text-sm text-night/60">
          Cette page est réservée au client qui a envoyé la demande ou au professionnel concerné.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/connexion?next=/appels-offres/${requestId}`} className="rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white">
            Se connecter
          </Link>
          <Link href="/appels-offres" className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night">
            Retour
          </Link>
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <p className="text-lg font-semibold text-night">Demande introuvable</p>
        <p className="mt-2 text-sm text-night/60">{error || 'Cette demande n’est pas disponible.'}</p>
        <Link href="/appels-offres" className="mt-5 inline-flex rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night">
          Retour aux appels d’offres
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Détail de la demande</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">{data.request.need_type}</h1>
            <p className="mt-3 text-sm text-night/60">
              Envoyée le {formatDate(data.createdAt)} à {data.proName}.
            </p>
          </div>
          <Link href="/appels-offres" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Demandeur</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-night">
                <User className="h-4 w-4 text-[#0A7EA4]" />
                {data.request.requester_name}
              </p>
              <p className="mt-1 text-sm text-night/60">{data.request.requester_email}</p>
              {data.request.requester_phone ? <p className="mt-1 text-sm text-night/60">{data.request.requester_phone}</p> : null}
            </div>
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Besoin</p>
              <p className="mt-2 text-sm font-semibold text-night">{data.request.need_type}</p>
              <p className="mt-1 text-sm text-night/60">{data.request.details || 'Aucun détail supplémentaire.'}</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Commune</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-night">
                <MapPin className="h-4 w-4 text-coral" />
                {data.request.commune}
              </p>
              <p className="mt-1 text-sm text-night/60">{data.proCommune || 'Nouvelle-Calédonie'}</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Budget / date</p>
              <p className="mt-2 text-sm font-semibold text-night">
                {data.request.budget_xpf ? `${Number(data.request.budget_xpf).toLocaleString('fr-FR')} XPF` : 'Budget non précisé'}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-night/60">
                <CalendarDays className="h-4 w-4 text-[#0A7EA4]" />
                {data.request.desired_date || 'Date souhaitée non précisée'}
              </p>
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Professionnel</p>
                <h2 className="mt-1 font-display text-xl font-bold text-night">{data.proName}</h2>
                <p className="mt-1 text-sm text-night/60">{data.proCategory || 'Professionnel Kalico'}</p>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm text-night/65">
              <MapPin className="h-4 w-4 text-coral" />
              {data.proCommune || 'Nouvelle-Calédonie'}
            </p>

            <div className="mt-5 space-y-2">
              {isProOwner ? (
                <Link
                  href={`/pro/dashboard/devis?request=${data.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a]"
                >
                  <Sparkles className="h-4 w-4" />
                  Répondre avec un devis
                </Link>
              ) : null}
              {(isRequester || isProOwner) ? (
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={downloading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)] disabled:opacity-60"
                >
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Télécharger PDF
                </button>
              ) : null}
              <Link
                href={`/pro/${data.proId}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
              >
                Voir la vitrine
                <MessageCircle className="h-4 w-4" />
              </Link>
              {data.request.requester_email ? (
                <a
                  href={`mailto:${data.request.requester_email}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                >
                  <Mail className="h-4 w-4" />
                  Contacter par email
                </a>
              ) : null}
            </div>

            <div className="mt-5 rounded-2xl bg-[var(--color-background-secondary)] p-4 text-sm text-night/65">
              <p className="font-semibold text-night">État d’accès</p>
              <p className="mt-1">
                {isProOwner
                  ? 'Vous êtes le professionnel concerné par cette demande.'
                  : isRequester
                    ? 'Vous êtes à l’origine de cette demande.'
                    : 'Vous consultez cette demande en lecture seule.'}
              </p>
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}
