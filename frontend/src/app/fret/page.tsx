'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Loader2, MapPin, Package, Sparkles, Truck } from 'lucide-react'

import Header from '@/components/layout/Header'
import { fretApi, proTransportApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

type FreightTransporter = {
  id: number | string
  company_name?: string | null
  display_name?: string | null
  service_zones?: string[]
  transport_type?: string[]
  has_fret?: boolean
  fret_volume_m3?: number | null
  fret_max_weight_kg?: number | null
  fret_vehicle_type?: string | null
  fret_description?: string | null
  fret_price_per_m3_xpf?: number | null
  pro_logo_url?: string | null
  transport_type_labels?: string[]
}

type EstimateState = {
  departure: string
  destination: string
  volume_m3: string
  weight_kg: string
  urgency: 'standard' | 'express'
  description: string
}

const INITIAL_FORM: EstimateState = {
  departure: 'Nouméa',
  destination: 'Dumbéa',
  volume_m3: '2',
  weight_kg: '250',
  urgency: 'standard',
  description: 'Quelques cartons, un électroménager et du mobilier léger.',
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function computeEstimate(form: EstimateState) {
  const volume = Math.max(0.1, toNumber(form.volume_m3, 0.1))
  const weight = Math.max(0, toNumber(form.weight_kg, 0))
  const base = 4500
  const volumeCost = Math.round(volume * 2400)
  const weightCost = Math.round(weight * 12)
  const distanceCost = 1800
  const handlingCost = weight > volume * 220 ? 1200 : 0
  const urgencyCost = form.urgency === 'express' ? 1800 : 0
  const total = base + volumeCost + weightCost + distanceCost + handlingCost + urgencyCost

  return {
    base_price_xpf: base,
    volume_cost_xpf: volumeCost,
    weight_cost_xpf: weightCost,
    distance_cost_xpf: distanceCost,
    handling_cost_xpf: handlingCost,
    urgency_cost_xpf: urgencyCost,
    estimated_total_xpf: total,
    volume_m3: volume,
    weight_kg: weight,
  }
}

function formatMoney(value: number) {
  return `${value.toLocaleString('fr-FR')} XPF`
}

export default function FreightPage() {
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [form, setForm] = useState<EstimateState>(INITIAL_FORM)
  const [estimate, setEstimate] = useState(computeEstimate(INITIAL_FORM))
  const [transporters, setTransporters] = useState<FreightTransporter[]>([])
  const [loadingTransporters, setLoadingTransporters] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoadingTransporters(true)
    proTransportApi.list({ type: 'fret', limit: 12 })
      .then((response) => {
        if (!alive) return
        setTransporters(Array.isArray(response.data?.data) ? response.data.data : [])
      })
      .catch(() => {
        if (!alive) return
        setTransporters([])
      })
      .finally(() => {
        if (alive) setLoadingTransporters(false)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    setEstimate(computeEstimate(form))
  }, [form])

  const freightTransporters = useMemo(() => transporters.filter((item) => item.has_fret || (item.transport_type || []).includes('fret')), [transporters])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!isAuthenticated) {
      openAuthModal({
        type: 'publish_listing',
        redirectTo: '/fret',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fretApi.createRequest({
        departure: form.departure.trim(),
        destination: form.destination.trim(),
        volume_m3: toNumber(form.volume_m3, 0.1),
        weight_kg: toNumber(form.weight_kg, 0),
        urgency: form.urgency,
        description: form.description.trim(),
        object_types: ['fret'],
        photos: [],
        budget_xpf: null,
      })
      const total = Number(response.data?.data?.quote_amount_xpf ?? estimate.estimated_total_xpf)
      setSuccess(`Demande enregistrée. Estimation: ${formatMoney(total)}.`)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible d’enregistrer votre demande pour le moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
        <section className="overflow-hidden rounded-[2.25rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,_rgba(8,32,50,0.96),_rgba(10,126,164,0.72))] p-6 text-white shadow-sm md:p-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
            <Truck className="h-3.5 w-3.5" />
            Module fret
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold">Estimez un volume, trouvez un transporteur, envoyez une demande</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75 md:text-base">
            Les transporteurs Pro peuvent déclarer leur capacité fret et leurs véhicules. De votre côté, vous obtenez une estimation rapide avant d’envoyer une demande.
          </p>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Estimateur</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Calculez votre fret</h2>
              </div>
              <div className="rounded-2xl bg-nc-lagonLight px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-lagon">Estimation</p>
                <p className="text-lg font-bold text-night">{formatMoney(estimate.estimated_total_xpf)}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Départ</span>
                <input value={form.departure} onChange={(event) => setForm((current) => ({ ...current, departure: event.target.value }))} className="input w-full rounded-2xl" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Destination</span>
                <input value={form.destination} onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value }))} className="input w-full rounded-2xl" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Volume (m³)</span>
                <input type="number" min="0.1" step="0.1" value={form.volume_m3} onChange={(event) => setForm((current) => ({ ...current, volume_m3: event.target.value }))} className="input w-full rounded-2xl" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Poids (kg)</span>
                <input type="number" min="0" step="1" value={form.weight_kg} onChange={(event) => setForm((current) => ({ ...current, weight_kg: event.target.value }))} className="input w-full rounded-2xl" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Urgence</span>
                <select value={form.urgency} onChange={(event) => setForm((current) => ({ ...current, urgency: event.target.value as EstimateState['urgency'] }))} className="input w-full rounded-2xl">
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Description</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="input w-full rounded-2xl py-3"
                placeholder="Expliquez ce que vous devez transporter..."
              />
            </label>

            <div className="grid gap-3 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Base</p>
                <p className="mt-1 text-lg font-bold text-night">{formatMoney(estimate.base_price_xpf)}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Volume + poids + distance</p>
                <p className="mt-1 text-lg font-bold text-night">{formatMoney(estimate.volume_cost_xpf + estimate.weight_cost_xpf + estimate.distance_cost_xpf)}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Majoration urgence</p>
                <p className="mt-1 text-lg font-bold text-night">{formatMoney(estimate.urgency_cost_xpf)}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Total estimé</p>
                <p className="mt-1 text-lg font-bold text-night">{formatMoney(estimate.estimated_total_xpf)}</p>
              </div>
            </div>

            {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            {success ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Envoyer ma demande fret
            </button>
          </form>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Transporteurs</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-night">Disponibles pour le fret</h2>
                </div>
                <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-sm font-semibold text-nc-lagon">
                  {freightTransporters.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {loadingTransporters ? (
                  <div className="space-y-3">
                    <div className="h-24 animate-pulse rounded-2xl bg-sand/60" />
                    <div className="h-24 animate-pulse rounded-2xl bg-sand/60" />
                  </div>
                ) : freightTransporters.length ? (
                  freightTransporters.slice(0, 8).map((transporter) => (
                    <article key={transporter.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-night">{transporter.display_name || transporter.company_name || 'Transporteur'}</p>
                          <p className="mt-1 text-xs text-night/55">
                            {transporter.fret_vehicle_type || 'Véhicule fret'} · {transporter.fret_volume_m3 ? `${transporter.fret_volume_m3} m³` : 'Capacité à préciser'}
                          </p>
                        </div>
                        {transporter.pro_logo_url ? (
                          <div className="h-10 w-10 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
                            <img src={transporter.pro_logo_url} alt={transporter.company_name || 'Logo'} className="h-full w-full object-cover" />
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-night/65">
                        {(transporter.service_zones || []).slice(0, 3).map((zone) => (
                          <span key={zone} className="rounded-full bg-white px-2.5 py-1">
                            <MapPin className="mr-1 inline h-3.5 w-3.5 text-coral" />
                            {zone}
                          </span>
                        ))}
                        {transporter.fret_max_weight_kg ? (
                          <span className="rounded-full bg-white px-2.5 py-1">
                            {transporter.fret_max_weight_kg.toLocaleString('fr-FR')} kg max
                          </span>
                        ) : null}
                        {transporter.fret_price_per_m3_xpf ? (
                          <span className="rounded-full bg-white px-2.5 py-1">
                            {formatMoney(transporter.fret_price_per_m3_xpf)} / m³
                          </span>
                        ) : null}
                      </div>

                      {transporter.fret_description ? (
                        <p className="mt-3 text-sm leading-relaxed text-night/65">{transporter.fret_description}</p>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-8 text-sm text-night/55">
                    Aucun transporteur fret n’a encore été publié.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,_rgba(214,240,246,0.55),_rgba(255,255,255,0.98))] p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Conseil</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-night">Préparez les dimensions avant d’envoyer</h3>
              <p className="mt-2 text-sm leading-relaxed text-night/60">
                Plus votre volume et votre poids sont précis, plus le transporteur peut vous répondre vite avec un devis réaliste.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-night">
                <Package className="h-4 w-4 text-[#0A7EA4]" />
                Estimation en quelques secondes
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
