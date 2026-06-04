'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, BadgeCheck, Upload } from 'lucide-react'

import Header from '@/components/layout/Header'
import { proTransportApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type FormState = {
  company_name: string
  transport_type: string
  description: string
  commune: string
  phone: string
  website: string
  hours: string
  ridet: string
}

const TRANSPORT_TYPES = [
  { value: 'taxi', label: 'Taxi / VTC' },
  { value: 'navette', label: 'Navette' },
  { value: 'aeroport', label: 'Transfert aéroport' },
  { value: 'excursion', label: 'Excursion' },
  { value: 'scolaire', label: 'Transport scolaire' },
  { value: 'chauffeur', label: 'Location avec chauffeur' },
  { value: 'location', label: 'Location avec chauffeur' },
]

const COMMUNES = [
  'Nouméa',
  'Mont-Dore',
  'Dumbéa',
  'Païta',
  'Boulouparis',
  'La Foa',
  'Bourail',
  'Koné',
  'Koumac',
  'Poindimié',
  'Lifou',
  'Maré',
  'Ouvéa',
  'Autre',
]

export default function ProTransportInscriptionPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [form, setForm] = useState<FormState>({
    company_name: '',
    transport_type: 'taxi',
    description: '',
    commune: 'Nouméa',
    phone: '',
    website: '',
    hours: '',
    ridet: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/connexion')
      return
    }
    if (user && !user.is_pro) {
      router.replace('/pro')
    }
  }, [hasHydrated, isAuthenticated, router, user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      await proTransportApi.apply({
        company_name: form.company_name,
        transport_type: form.transport_type,
        vehicle_description: form.description,
        vehicle_capacity: 4,
        vehicle_photo_url: '',
        license_number: form.phone || '',
        insurance_number: form.hours || '',
        base_price_xpf: 0,
        price_per_km_xpf: 0,
        service_zones: [form.commune],
        availability: [],
        exceptions: [],
        pro_phone: form.phone,
        pro_website: form.website,
        pro_hours: form.hours,
        pro_siret: form.ridet,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'La demande a échoué.')
    } finally {
      setSaving(false)
    }
  }

  if (!hasHydrated || !isAuthenticated || (user && !user.is_pro)) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-sand/80" />
          <p className="mt-4 text-sm text-night/55">Chargement de votre espace transport...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <section className="rounded-[2rem] border border-night/8 border-b-4 border-b-nc-lagon bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-lagon">
            <BadgeCheck className="h-3.5 w-3.5" />
            Espace Transport Pro
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">Devenez transporteur partenaire sur Troca</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
            Déposez votre demande, présentez votre activité et commencez à recevoir des réservations de clients calédoniens.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="#formulaire" className="btn-primary rounded-2xl px-4 py-2.5">
              Remplir le formulaire
            </Link>
            <Link href="/covoiturage?tab=transport" className="btn-secondary rounded-2xl px-4 py-2.5">
              Voir les transporteurs
            </Link>
          </div>
        </section>

        <section id="formulaire" className="mt-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm md:p-6">
          {success ? (
            <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 text-center">
              <p className="text-lg font-semibold text-emerald-700">✅ Demande envoyée !</p>
              <p className="mt-2 text-sm text-emerald-700/80">Notre équipe valide votre compte sous 48h.</p>
              <Link href="/pro" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] shadow-sm">
                Retour à l&apos;espace Pro
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Formulaire</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Créer mon compte Transport Pro</h2>
                <p className="mt-1 text-sm text-night/55">Gratuit pour commencer — validé par notre équipe sous 48h.</p>
              </div>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-night">Nom de l&apos;entreprise / Raison sociale *</span>
                <input
                  required
                  value={form.company_name}
                  onChange={(e) => setForm((current) => ({ ...current, company_name: e.target.value }))}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-night">Catégorie *</span>
                <select
                  required
                  value={form.transport_type}
                  onChange={(e) => setForm((current) => ({ ...current, transport_type: e.target.value }))}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                >
                  {TRANSPORT_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-night">Commune *</span>
                <select
                  required
                  value={form.commune}
                  onChange={(e) => setForm((current) => ({ ...current, commune: e.target.value }))}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                >
                  {COMMUNES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-night">Description courte *</span>
                <textarea
                  required
                  maxLength={300}
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-night">Téléphone professionnel</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-night">Site web (optionnel)</span>
                <input
                  value={form.website}
                  onChange={(e) => setForm((current) => ({ ...current, website: e.target.value }))}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-night">Horaires d&apos;ouverture (optionnel)</span>
                <textarea
                  rows={3}
                  value={form.hours}
                  onChange={(e) => setForm((current) => ({ ...current, hours: e.target.value }))}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-night">Numéro RIDET (optionnel)</span>
                <input
                  value={form.ridet}
                  onChange={(e) => setForm((current) => ({ ...current, ridet: e.target.value }))}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                />
              </label>

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 disabled:opacity-60">
                  <Upload className="h-4 w-4" />
                  {saving ? 'Envoi en cours...' : 'Envoyer ma demande'}
                </button>
                <p className="text-sm text-night/55">Votre demande sera vérifiée par notre équipe avant publication.</p>
              </div>

              {error ? <p className="md:col-span-2 text-sm font-medium text-red-600">{error}</p> : null}
            </form>
          )}
        </section>
      </main>
    </div>
  )
}
