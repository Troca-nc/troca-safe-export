'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  BadgeInfo,
  CheckCircle2,
  ChevronRight,
  Megaphone,
  PauseCircle,
  PlayCircle,
  Sparkles,
  TimerReset,
} from 'lucide-react'

import { campaignsApi } from '@/lib/api'

type CampaignType = 'bon_plan' | 'banner' | 'popup'

type Campaign = {
  id: number | string
  type: CampaignType | string
  title: string
  description?: string | null
  category_slug?: string | null
  status?: string | null
  user_id?: number | null
  sponsor_name?: string | null
  sponsor_email?: string | null
  sponsor_phone?: string | null
  price_xpf?: number | null
  duration_days?: number | null
  starts_at?: string | null
  ends_at?: string | null
  is_default_popup?: boolean
  metadata?: Record<string, any> | null
}

type WeeklyBonPlanSelection = {
  week_key: string
  limit: number
  campaigns: Campaign[]
  selected_campaign_ids: Array<number | string>
  selected_campaigns: Campaign[]
}

type CampaignSectionId = 'bon_plan' | 'banner' | 'popup'

type PricingChip = {
  label: string
  price: string
}

function formatMoney(value?: number | null) {
  return `${Number(value || 0).toLocaleString('fr-FR')} XPF`
}

function formatDate(value?: string | null) {
  if (!value) return 'ï¿½ confirmer'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'ï¿½ confirmer'
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
      return 'Banniï¿½re'
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
      return 'Expirï¿½'
    default:
      return status || ''
  }
}

function getSectionLabel(type: CampaignType) {
  switch (type) {
    case 'bon_plan':
      return 'Bons Plans'
    case 'banner':
      return 'Banniï¿½re catï¿½gorie'
    case 'popup':
      return 'Popup homepage'
  }
}

function getAdvertiserLabel(campaign: Campaign) {
  return (
    campaign.sponsor_name
    || campaign.sponsor_email
    || ''
  )
}

function PricingRow({ label, price }: PricingChip) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-night">{price}</p>
    </div>
  )
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-2 rounded-full border border-nc-lagon/15 bg-nc-lagonLight px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </p>
      <h2 className="font-display text-2xl font-bold text-night">{title}</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-night/60">{description}</p>
    </div>
  )
}

function CampaignForm({
  type,
  allowMonthly,
  includeCategorySlug,
  durationOptions,
  onSaved,
}: {
  type: CampaignType
  allowMonthly?: boolean
  includeCategorySlug?: boolean
  durationOptions: Array<{ value: number; label: string }>
  onSaved: () => Promise<void> | void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    cta_text: 'DÃ©couvrir',
    duration_days: String(durationOptions[0]?.value || 7),
    pricing_mode: 'one_shot',
    pricing_plan: 'essential',
    category_slug: '',
    payment_provider: 'stripe',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('saving')
    setFeedback('')

    try {
      const payload: Record<string, unknown> = {
        type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        link_url: form.link_url.trim() || null,
        cta_text: form.cta_text.trim() || null,
        duration_days: type === 'bon_plan' && form.pricing_mode === 'monthly' ? 30 : Number(form.duration_days),
        pricing_mode: type === 'bon_plan' ? form.pricing_mode : 'one_shot',
        pricing_plan: type === 'bon_plan' && form.pricing_mode === 'monthly' ? form.pricing_plan : undefined,
        payment_provider: form.payment_provider,
      }

      if (includeCategorySlug) {
        payload.category_slug = form.category_slug.trim() || null
      }

      const response = await campaignsApi.create(payload)
      const checkoutUrl = response.data?.data?.payment?.checkout_url

      if (checkoutUrl && typeof window !== 'undefined') {
        window.location.assign(checkoutUrl)
        return
      }

      await onSaved()
      setForm((current) => ({
        ...current,
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        cta_text: 'DÃ©couvrir',
      }))
      setStatus('success')
      setFeedback('Campagne crï¿½ï¿½e avec succï¿½s.')
    } catch (error) {
      console.error(error)
      setStatus('error')
      setFeedback("La campagne n'a pas pu ï¿½tre crï¿½ï¿½e.")
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">Crï¿½er une campagne</p>
          <h3 className="mt-1 text-lg font-bold text-night">{getSectionLabel(type)}</h3>
        </div>
        <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1 text-xs font-semibold text-night/60">
          {type === 'bon_plan' ? 'Paiement sï¿½curisï¿½' : 'Visibilitï¿½ sponsorisï¿½e'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-night">Titre *</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm"
            placeholder="Ex. Rï¿½duction sur les packs de rentrï¿½e"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-night">CTA</span>
          <input
            value={form.cta_text}
            onChange={(event) => setForm((current) => ({ ...current, cta_text: event.target.value }))}
            className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm"
            placeholder="DÃ©couvrir"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-night">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="input min-h-[96px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm"
            placeholder="Courte description de la campagne"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-night">Image (optionnel)</span>
          <input
            value={form.image_url}
            onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
            className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm"
            placeholder="/brand/visuel.jpg"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-night">Lien (optionnel)</span>
          <input
            value={form.link_url}
            onChange={(event) => setForm((current) => ({ ...current, link_url: event.target.value }))}
            className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm"
            placeholder="/page-cible"
          />
        </label>

        {includeCategorySlug ? (
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Slug catï¿½gorie *</span>
            <input
              value={form.category_slug}
              onChange={(event) => setForm((current) => ({ ...current, category_slug: event.target.value }))}
              className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm"
              placeholder="immobilier, auto, services..."
              required
            />
          </label>
        ) : null}

        {type === 'bon_plan' && allowMonthly ? (
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Mode tarifaire</span>
            <select
              value={form.pricing_mode}
              onChange={(event) => setForm((current) => ({ ...current, pricing_mode: event.target.value }))}
              className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm"
            >
              <option value="one_shot">One shot</option>
              <option value="monthly">Abonnement</option>
            </select>
          </label>
        ) : (
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Durï¿½e</span>
            <select
              value={form.duration_days}
              onChange={(event) => setForm((current) => ({ ...current, duration_days: event.target.value }))}
              className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm"
            >
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {type === 'bon_plan' && form.pricing_mode === 'monthly' ? (
          <label className="space-y-2">
            <span className="text-sm font-semibold text-night">Formule</span>
            <select
              value={form.pricing_plan}
              onChange={(event) => setForm((current) => ({ ...current, pricing_plan: event.target.value }))}
              className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm"
            >
              <option value="essential">Essentiel</option>
              <option value="standard">Standard</option>
              <option value="unlimited">Illimitï¿½</option>
            </select>
          </label>
        ) : null}

        <label className="space-y-2">
          <span className="text-sm font-semibold text-night">Paiement</span>
          <select
            value={form.payment_provider}
            onChange={(event) => setForm((current) => ({ ...current, payment_provider: event.target.value }))}
            className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-3 text-sm"
          >
            <option value="stripe">Stripe</option>
            <option value="payplug">PayPlug</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-night/55">
          {type === 'bon_plan'
            ? 'Les campagnes sont activï¿½es aprï¿½s paiement sï¿½curisï¿½.'
            : 'La campagne sera placï¿½e en file si aucun emplacement nest disponible.'}
        </p>
        <button
          type="submit"
          disabled={status === 'saving'}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#076b8d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'saving' ? 'Crï¿½ation...' : 'Crï¿½er la campagne'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            status === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback}
        </div>
      ) : null}
    </form>
  )
}

function SectionPanel({
  id,
  title,
  eyebrow,
  description,
  active,
  children,
}: {
  id: CampaignSectionId
  title: string
  eyebrow: string
  description: string
  active: boolean
  children: ReactNode
}) {
  return (
    <section id={id} className={active ? 'space-y-5' : 'hidden'}>
      <SectionTitle eyebrow={eyebrow} title={title} description={description} />
      {children}
    </section>
  )
}

export default function ProDashboardPublicitePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [weeklySelection, setWeeklySelection] = useState<WeeklyBonPlanSelection | null>(null)
  const [selectedWeeklyIds, setSelectedWeeklyIds] = useState<Array<number | string>>([])
  const [savingWeeklySelection, setSavingWeeklySelection] = useState(false)
  const [weeklyFeedback, setWeeklyFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<CampaignSectionId>('bon_plan')

  const refresh = async () => {
    const [dashboardResult, weeklyResult] = await Promise.allSettled([
      campaignsApi.getDashboard(),
      campaignsApi.getWeeklyBonPlans(),
    ])
    const dashboardData = dashboardResult.status === 'fulfilled' ? dashboardResult.value.data?.data ?? {} : {}
    const weeklyData = weeklyResult.status === 'fulfilled' ? weeklyResult.value.data?.data ?? null : null
    setCampaigns(Array.isArray(dashboardData.campaigns) ? dashboardData.campaigns : [])
    setWeeklySelection(weeklyData)
    setSelectedWeeklyIds(Array.isArray(weeklyData?.selected_campaign_ids) ? weeklyData.selected_campaign_ids : [])
  }

  useEffect(() => {
    let alive = true

    void refresh()
      .catch(() => {
        if (!alive) return
        setCampaigns([])
        setWeeklySelection(null)
        setSelectedWeeklyIds([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const counts = useMemo(() => ({
    bon_plan: campaigns.filter((campaign) => campaign.type === 'bon_plan').length,
    banner: campaigns.filter((campaign) => campaign.type === 'banner').length,
    popup: campaigns.filter((campaign) => campaign.type === 'popup').length,
  }), [campaigns])

  const activeCampaigns = useMemo(
    () => campaigns.filter((campaign) => ['active', 'queued', 'paused'].includes(String(campaign.status || '').trim())),
    [campaigns]
  )

  const weeklyBonPlanCampaigns = useMemo(
    () => (weeklySelection?.campaigns || []).filter((campaign) => campaign.type === 'bon_plan'),
    [weeklySelection]
  )

  const weeklySelectedCampaigns = useMemo(
    () => weeklyBonPlanCampaigns.filter((campaign) => selectedWeeklyIds.includes(campaign.id)),
    [selectedWeeklyIds, weeklyBonPlanCampaigns]
  )

  const toggleWeeklyCampaign = (campaignId: number | string) => {
    setWeeklyFeedback('')
    setSelectedWeeklyIds((current) => {
      if (current.includes(campaignId)) {
        return current.filter((value) => value !== campaignId)
      }
      if (current.length >= (weeklySelection?.limit || 2)) return current
      return [...current, campaignId]
    })
  }

  const saveWeeklySelection = async () => {
    setSavingWeeklySelection(true)
    setWeeklyFeedback('')
    try {
      const response = await campaignsApi.saveWeeklyBonPlans(selectedWeeklyIds)
      const data = response.data?.data ?? null
      setWeeklySelection(data)
      setSelectedWeeklyIds(Array.isArray(data?.selected_campaign_ids) ? data.selected_campaign_ids : [])
      setWeeklyFeedback('Votre sï¿½lection hebdomadaire a ï¿½tï¿½ enregistrï¿½e.')
    } catch (error) {
      console.error(error)
      setWeeklyFeedback('Impossible denregistrer la sï¿½lection pour le moment.')
    } finally {
      setSavingWeeklySelection(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-nc-lagon/15 bg-nc-lagonLight px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">
              <Megaphone className="h-3.5 w-3.5" />
              Publicitï¿½
            </p>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold text-night">Pilotez vos campagnes sponsorisï¿½es</h1>
              <p className="max-w-3xl text-sm leading-relaxed text-night/60">
                Retrouvez vos offres, les tarifs publics et lensemble de vos campagnes en cours au mï¿½me endroit.
              </p>
            </div>
          </div>

          <Link href="/pro/dashboard" className="btn-secondary rounded-2xl px-4 py-2.5 text-sm">
            Retour dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">Bon Plans</p>
          <p className="mt-2 text-2xl font-bold text-night">{counts.bon_plan}</p>
          <p className="mt-1 text-sm text-night/55">Campagnes One shot et abonnements</p>
        </article>
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">Banniï¿½res</p>
          <p className="mt-2 text-2xl font-bold text-night">{counts.banner}</p>
          <p className="mt-1 text-sm text-night/55">Visibilitï¿½ sur les catï¿½gories</p>
        </article>
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">Popups</p>
          <p className="mt-2 text-2xl font-bold text-night">{counts.popup}</p>
          <p className="mt-1 text-sm text-night/55">Une seule campagne active ï¿½ la fois</p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          {([
            { id: 'bon_plan', label: 'Bons Plans', sub: 'One shot / Abonnement' },
            { id: 'banner', label: 'Banniï¿½re catï¿½gorie', sub: 'Tarif par durï¿½e' },
            { id: 'popup', label: 'Popup homepage', sub: 'File dattente si besoin' },
          ] as Array<{ id: CampaignSectionId; label: string; sub: string }>).map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  isActive
                    ? 'border-[#0A7EA4]/30 bg-[#0A7EA4]/10 shadow-sm'
                    : 'border-[var(--color-border)] bg-[var(--color-background-secondary)] hover:border-[#0A7EA4]/30'
                }`}
              >
                <p className="text-sm font-semibold text-night">{item.label}</p>
                <p className="mt-1 text-xs text-night/55">{item.sub}</p>
              </button>
            )
          })}
        </div>
      </section>

      <SectionPanel
        id="bon_plan"
        active={activeSection === 'bon_plan'}
        eyebrow="Bons Plans"
        title="Prix One shot et Abonnement"
        description="Choisissez une mise en avant ponctuelle ou un abonnement mensuel pour garder votre activitï¿½ visible en continu."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">One shot</p>
                <h3 className="mt-1 text-lg font-bold text-night">Campagne ponctuelle</h3>
              </div>
              <BadgeInfo className="h-5 w-5 text-nc-lagon" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: '3 jours', price: '500 XPF' },
                { label: '7 jours', price: '990 XPF' },
                { label: '14 jours', price: '1 500 XPF' },
                { label: '30 jours', price: '2 500 XPF' },
              ].map((item) => (
                <PricingRow key={item.label} label={item.label} price={item.price} />
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">Abonnement</p>
                <h3 className="mt-1 text-lg font-bold text-night">Prï¿½sence continue</h3>
              </div>
              <TimerReset className="h-5 w-5 text-nc-lagon" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Essentiel', price: '1 800 XPF / mois' },
                { label: 'Standard', price: '2 500 XPF / mois' },
                { label: 'Illimitï¿½', price: '4 000 XPF / mois' },
              ].map((item) => (
                <PricingRow key={item.label} label={item.label} price={item.price} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[#0A7EA4]/15 bg-[#0A7EA4]/6 p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">Illimitï¿½</p>
              <h3 className="mt-1 text-lg font-bold text-night">Choisissez vos 2 bons plans de la semaine</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-night/60">
                Ces campagnes apparaissent en prioritï¿½ sur laccueil. Chaque lundi, nous vous rappelons de
                sï¿½lectionner vos 2 mises en avant. Si vous ne le faites pas, les 2 plus rï¿½centes seront retenues
                automatiquement mardi ï¿½ 12h.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#0A7EA4]/15 bg-white px-3 py-1 text-xs font-semibold text-[#0A7EA4]">
              <Sparkles className="h-3.5 w-3.5" />
              {weeklySelectedCampaigns.length}/{weeklySelection?.limit || 2} sï¿½lectionnï¿½{(weeklySelection?.limit || 2) > 1 ? 's' : ''}
            </span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {weeklyBonPlanCampaigns.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[#0A7EA4]/20 bg-white/80 p-5 text-sm text-night/60 lg:col-span-2">
                Aucun bon plan mensuel illimitï¿½ nest actif pour le moment. Crï¿½ez dabord une campagne Abonnement pour pouvoir la sï¿½lectionner chaque semaine.
              </div>
            ) : (
              weeklyBonPlanCampaigns.map((campaign) => {
                const checked = selectedWeeklyIds.includes(campaign.id)
                return (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => toggleWeeklyCampaign(campaign.id)}
                    className={`rounded-[1.5rem] border p-4 text-left transition ${
                      checked
                        ? 'border-[#0A7EA4]/35 bg-white shadow-sm'
                        : 'border-[var(--color-border)] bg-[var(--color-background-secondary)] hover:border-[#0A7EA4]/25'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">
                          {campaign.category_slug || 'Homepage'}
                        </p>
                        <h4 className="text-base font-bold text-night">{campaign.title}</h4>
                        <p className="text-sm text-night/60 line-clamp-2">{campaign.description || 'Campagne illimitï¿½e'}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${checked ? 'bg-[#0A7EA4] text-white' : 'bg-white text-night/60'}`}>
                        {checked ? 'Sï¿½lectionnï¿½e' : 'Sï¿½lectionner'}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-night/55">
              {weeklySelection?.week_key ? `Semaine du ${weeklySelection.week_key}` : 'Semaine en cours'}
            </p>
            <button
              type="button"
              onClick={() => void saveWeeklySelection()}
              disabled={savingWeeklySelection || weeklyBonPlanCampaigns.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#076b8d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {savingWeeklySelection ? 'Enregistrement...' : 'Enregistrer ma sï¿½lection'}
            </button>
          </div>

          {weeklyFeedback ? (
            <p className="mt-3 text-sm font-medium text-[#0A7EA4]">{weeklyFeedback}</p>
          ) : null}
        </div>

        <CampaignForm
          type="bon_plan"
          allowMonthly
          durationOptions={[
            { value: 3, label: '3 jours' },
            { value: 7, label: '7 jours' },
            { value: 14, label: '14 jours' },
            { value: 30, label: '30 jours' },
          ]}
          onSaved={refresh}
        />
      </SectionPanel>

      <SectionPanel
        id="banner"
        active={activeSection === 'banner'}
        eyebrow="Banniï¿½re catï¿½gorie"
        title="Tarifs pour une visibilitï¿½ ciblï¿½e"
        description="Touchez les internautes dï¿½jï¿½ prï¿½sents dans une catï¿½gorie prï¿½cise avec un emplacement visuel simple et lisible."
      >
        <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: '7 jours', price: '990 XPF' },
              { label: '15 jours', price: '1 900 XPF' },
              { label: '30 jours', price: '2 900 XPF' },
              { label: '3 mois', price: '6 900 XPF' },
            ].map((item) => (
              <PricingRow key={item.label} label={item.label} price={item.price} />
            ))}
          </div>
        </div>

        <CampaignForm
          type="banner"
          includeCategorySlug
          durationOptions={[
            { value: 7, label: '7 jours' },
            { value: 15, label: '15 jours' },
            { value: 30, label: '30 jours' },
            { value: 90, label: '3 mois' },
          ]}
          onSaved={refresh}
        />
      </SectionPanel>

      <SectionPanel
        id="popup"
        active={activeSection === 'popup'}
        eyebrow="Popup homepage"
        title="Le popup daccueil et sa file dattente"
        description="Un seul popup peut ï¿½tre actif ï¿½ la fois. Si une campagne est dï¿½jï¿½ en cours, la nouvelle bascule automatiquement en attente."
      >
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
            <CheckCircle2 className="h-4 w-4" />
            1 seul popup actif ï¿½ la fois - votre campagne sera mise en file dattente si un popup est dï¿½jï¿½ en cours.
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: '3 jours', price: '1 900 XPF' },
              { label: '7 jours', price: '3 500 XPF' },
              { label: '15 jours', price: '5 900 XPF' },
              { label: '30 jours', price: '9 900 XPF' },
            ].map((item) => (
              <PricingRow key={item.label} label={item.label} price={item.price} />
            ))}
          </div>
        </div>

        <CampaignForm
          type="popup"
          durationOptions={[
            { value: 3, label: '3 jours' },
            { value: 7, label: '7 jours' },
            { value: 15, label: '15 jours' },
            { value: 30, label: '30 jours' },
          ]}
          onSaved={refresh}
        />
      </SectionPanel>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">Campagnes</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Liste des campagnes enregistrï¿½es</h2>
          </div>
          <p className="text-sm text-night/55">
            {loading ? 'Chargement...' : `${activeCampaigns.length} campagne${activeCampaigns.length > 1 ? 's' : ''} suivie${activeCampaigns.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-night/55">Chargement...</p>
        ) : campaigns.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center text-night/55">
            Aucune campagne enregistrï¿½e pour le moment.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[1.5rem] border border-[var(--color-border)]">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
              <thead className="bg-[var(--color-background-secondary)] text-night/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Titre</th>
                  <th className="px-4 py-3 text-left font-semibold">CatÃ©gorie</th>
                  <th className="px-4 py-3 text-left font-semibold">Dï¿½but</th>
                  <th className="px-4 py-3 text-left font-semibold">Fin</th>
                  <th className="px-4 py-3 text-left font-semibold">Prix</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-4 py-3 font-medium text-night">{getTypeLabel(campaign.type)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-night">{campaign.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-night/55">{campaign.description || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-night/70">
                      {campaign.type === 'banner'
                        ? campaign.category_slug || ''
                        : 'Homepage'}
                    </td>
                    <td className="px-4 py-3 text-night/70">{formatDate(campaign.starts_at)}</td>
                    <td className="px-4 py-3 text-night/70">{formatDate(campaign.ends_at)}</td>
                    <td className="px-4 py-3 text-night/70">{formatMoney(campaign.price_xpf)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        campaign.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : campaign.status === 'queued'
                            ? 'bg-amber-50 text-amber-700'
                            : campaign.status === 'paused'
                              ? 'bg-sand text-night/60'
                              : 'bg-sand text-night/60'
                      }`}>
                        {getStatusLabel(campaign.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (campaign.status === 'paused') {
                            await campaignsApi.resume(campaign.id)
                          } else {
                            await campaignsApi.pause(campaign.id)
                          }
                          await refresh()
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-night/70 transition hover:border-[#0A7EA4]/30 hover:text-[#0A7EA4]"
                      >
                        {campaign.status === 'paused' ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                        {campaign.status === 'paused' ? 'Reprendre' : 'Suspendre'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
