'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Megaphone, PauseCircle, PlayCircle, Sparkles } from 'lucide-react'

import { campaignsApi } from '@/lib/api'

type Campaign = {
  id: number | string
  type: string
  title: string
  description?: string | null
  category_slug?: string | null
  status?: string | null
  user_id?: number | null
  sponsor_name?: string | null
  sponsor_email?: string | null
  sponsor_first_name?: string | null
  sponsor_last_name?: string | null
  sponsor_phone?: string | null
  price_xpf?: number | null
  starts_at?: string | null
  ends_at?: string | null
  revenue_xpf?: number | null
  is_default_popup?: boolean
}

function formatMoney(value?: number | null) {
  return `${Number(value || 0).toLocaleString('fr-FR')} XPF`
}

function formatDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getTypeLabel(type?: string) {
  switch (type) {
    case 'bon_plan':
      return 'Bon plan'
    case 'banner':
      return 'Banni�re'
    case 'popup':
      return 'Popup'
    default:
      return type || ''
  }
}

function getStatusLabel(status?: string | null) {
  switch (String(status || '').trim()) {
    case 'active':
      return 'Actif'
    case 'queued':
      return 'En file'
    case 'paused':
      return 'Suspendu'
    case 'expired':
      return 'Expir�'
    default:
      return status || ''
  }
}

function getAdvertiserLabel(campaign: Campaign) {
  return (
    campaign.sponsor_name
    || [campaign.sponsor_first_name, campaign.sponsor_last_name].filter(Boolean).join(' ').trim()
    || campaign.sponsor_email
    || ''
  )
}

function getCategoryLabel(campaign: Campaign) {
  if (campaign.type === 'banner') return campaign.category_slug || ''
  return 'Homepage'
}

export default function AdminPublicitePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [revenue, setRevenue] = useState(0)
  const [activePopup, setActivePopup] = useState<Campaign | null>(null)
  const [defaultPopup, setDefaultPopup] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const response = await campaignsApi.getAdmin()
    const data = response.data?.data ?? {}
    setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : [])
    setRevenue(Number(data.revenue_month_xpf || 0))
    setActivePopup(data.active_popup || null)
    setDefaultPopup(data.default_popup || null)
  }

  useEffect(() => {
    let alive = true

    void refresh()
      .catch(() => {
        if (!alive) return
        setCampaigns([])
        setRevenue(0)
        setActivePopup(null)
        setDefaultPopup(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const popupIndicator = useMemo(
    () => activePopup?.title || defaultPopup?.title || 'Bienvenue Kalico (d�faut)',
    [activePopup, defaultPopup]
  )

  const toggleStatus = async (campaign: Campaign) => {
    if (campaign.status === 'paused') {
      await campaignsApi.resume(campaign.id)
    } else {
      await campaignsApi.pause(campaign.id)
    }
    await refresh()
  }

  return (
    <main className="space-y-6 px-4 py-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-nc-lagon/15 bg-nc-lagonLight px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">
              <Megaphone className="h-3.5 w-3.5" />
              Administration publicit�
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-night">Pilotage des campagnes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night/60">
              Suivez les campagnes sponsoris�es, les revenus du mois et lÉtat du popup daccueil depuis un seul �cran.
            </p>
          </div>
          <Link href="/admin" className="btn-secondary rounded-2xl px-4 py-2.5 text-sm">
            Retour admin
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">Revenus publicitaires ce mois</p>
          <p className="mt-2 text-3xl font-bold text-night">{formatMoney(revenue)}</p>
          <p className="mt-1 text-sm text-night/55">Somme des campagnes actives et expir�es du mois en cours.</p>
        </article>
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">Popup actuel</p>
          <p className="mt-2 text-2xl font-bold text-night">{popupIndicator}</p>
          <p className="mt-1 text-sm text-night/55">
            Une seule campagne popup peut �tre active � la fois. Le d�faut saffiche si aucune campagne sponsoris�e nest en cours.
          </p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-night">
          <Sparkles className="h-4 w-4 text-nc-lagon" />
          Campagnes enregistr�es
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-night/55">Chargement...</p>
        ) : campaigns.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center text-night/55">
            Aucune campagne enregistr�e.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[1.5rem] border border-[var(--color-border)]">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
              <thead className="bg-[var(--color-background-secondary)] text-night/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Annonceur</th>
                  <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
                  <th className="px-4 py-3 text-left font-semibold">D�but</th>
                  <th className="px-4 py-3 text-left font-semibold">Fin</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold">Revenus g�n�r�s</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-4 py-3 font-medium text-night">{getTypeLabel(campaign.type)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-night">{getAdvertiserLabel(campaign)}</p>
                      {campaign.sponsor_email ? (
                        <p className="mt-1 text-xs text-night/55">{campaign.sponsor_email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-night/70">{getCategoryLabel(campaign)}</td>
                    <td className="px-4 py-3 text-night/70">{formatDate(campaign.starts_at)}</td>
                    <td className="px-4 py-3 text-night/70">{formatDate(campaign.ends_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          campaign.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : campaign.status === 'queued'
                              ? 'bg-amber-50 text-amber-700'
                              : campaign.status === 'paused'
                                ? 'bg-sand text-night/60'
                                : 'bg-sand text-night/60'
                        }`}
                      >
                        {getStatusLabel(campaign.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-night/70">{formatMoney(campaign.price_xpf)}</td>
                    <td className="px-4 py-3">
                      {campaign.is_default_popup ? (
                        <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-2 text-sm font-semibold text-night/50">
                          Popup par d�faut
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void toggleStatus(campaign)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-night/70 transition hover:border-[#0A7EA4]/30 hover:text-[#0A7EA4]"
                        >
                          {campaign.status === 'paused' ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                          {campaign.status === 'paused' ? 'Reprendre' : 'Suspendre'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
