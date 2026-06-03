'use client'

import Link from 'next/link'
import { useMemo, useRef, useState, type ComponentType } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BarChart2,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
} from 'lucide-react'

import Header from '@/components/layout/Header'
import { proApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

const PRO_SECTORS = [
  'Commerçant',
  'Restaurateur',
  'Artisan BTP',
  'Garagiste',
  'Paysagiste',
  'Prestataire IT',
  'Agence immobilière',
  'Activité nautique',
  'Transporteur',
  'Professionnel de santé',
  "Organisateur d'événements",
  'Agriculteur',
  'Boutique mode',
  'Salon de beauté',
  'Coiffeur',
  'Électricien',
  'Plombier',
  'Menuisier',
  'Photographe',
  'Traiteur',
  'Hébergement / hôtel',
  'Location de véhicules',
  'Association',
  'Formation',
  'Service digital',
] as const

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
] as const

type ProApplicationForm = {
  company_name: string
  category: string
  description: string
  commune: string
  phone: string
  website: string
  hours: string
  siret: string
}

const initialForm: ProApplicationForm = {
  company_name: '',
  category: '',
  description: '',
  commune: '',
  phone: '',
  website: '',
  hours: '',
  siret: '',
}

function StatCard({ title, subtitle, value }: { title: string; subtitle: string; value: string }) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <p className="text-3xl font-bold text-night">{value}</p>
      <p className="mt-2 text-sm font-semibold text-night">{title}</p>
      <p className="mt-1 text-sm text-night/60">{subtitle}</p>
    </article>
  )
}

function AdvantageCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A7EA4]/10 text-[#0A7EA4]">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-lg font-semibold text-night">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-night/65">{description}</p>
    </article>
  )
}

export default function ProLandingPage() {
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const formRef = useRef<HTMLElement | null>(null)

  const [form, setForm] = useState<ProApplicationForm>(initialForm)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const stats = useMemo(
    () => [
      {
        value: '100%',
        title: '100% calédonien',
        subtitle: 'Une plateforme pensée pour le marché local.',
      },
      {
        value: '15+',
        title: 'Catégories ciblées',
        subtitle: 'Touchez exactement vos clients cibles.',
      },
      {
        value: 'Gratuit',
        title: 'Gratuit pour commencer',
        subtitle: 'Publiez vos premières annonces sans frais.',
      },
    ],
    []
  )

  const advantages = [
    {
      icon: BadgeCheck,
      title: 'Badge Pro vérifié',
      description: 'Votre badge de confiance visible sur toutes vos annonces et votre profil.',
    },
    {
      icon: TrendingUp,
      title: 'Annonces prioritaires',
      description: 'Vos annonces remontent automatiquement toutes les semaines. Toujours visibles.',
    },
    {
      icon: Store,
      title: 'Vitrine personnalisée',
      description: 'Logo, bannière, description, horaires, site web : votre mini-boutique locale.',
    },
    {
      icon: BarChart2,
      title: 'Statistiques détaillées',
      description: 'Vues, contacts, performance de vos boosts. Pilotez votre visibilité en temps réel.',
    },
    {
      icon: MessageCircle,
      title: 'Messagerie prioritaire',
      description: 'Vos messages clients remontent en haut de la liste. Répondez plus vite, convertissez plus.',
    },
    {
      icon: Tag,
      title: 'Bons plans en avant',
      description: 'Vos promotions et événements apparaissent en tête de la section Bons Plans.',
    },
  ] as const

  const plans = [
    {
      name: 'Gratuit',
      price: 'Gratuit',
      highlighted: false,
      features: ['5 annonces actives', 'Badge Pro vérifié', 'Messagerie standard', 'Vitrine publique basique'],
      cta: 'Commencer gratuitement',
    },
    {
      name: 'Pro',
      price: '2 900 XPF/mois',
      highlighted: true,
      features: ['Annonces illimitées', 'Remontée automatique hebdomadaire', 'Vitrine complète (logo, bannière, horaires, site)', 'Statistiques de performance', '1 boost offert par mois', 'Bons plans prioritaires', 'Réponse automatique', 'Support prioritaire'],
      cta: 'Choisir Pro',
    },
  ] as const

  const handleChipSelect = (category: string) => {
    setSelectedCategory(category)
    setForm((current) => ({ ...current, category }))
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleChange = <K extends keyof ProApplicationForm>(key: K, value: ProApplicationForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!isAuthenticated) {
      openAuthModal({
        type: 'login',
        redirectTo: '/pro#formulaire-pro',
      })
      return
    }

    setSubmitting(true)
    try {
      await proApi.apply({
        company_name: form.company_name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        commune: form.commune.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        hours: form.hours.trim(),
        siret: form.siret.trim(),
      })
      setSuccessMessage('✅ Demande envoyée ! Notre équipe valide votre compte sous 48h.')
      setForm(initialForm)
      setSelectedCategory('')
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Impossible d’envoyer votre demande pour le moment.'
      setErrorMessage(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <main>
        <section className="overflow-hidden bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-4 py-14 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-emeraude">
                <Sparkles className="h-3.5 w-3.5" />
                Espace Professionnel
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-6xl">
                Développez votre activité sur Troca
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/78 md:text-base">
                La première plateforme d’annonces calédonienne ouvre ses portes aux professionnels. Vitrine locale, clients ciblés, outils simples.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/pro/inscription" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0A7EA4] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  Créer mon compte Pro
                </Link>
                <a href="#avantages" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15">
                  En savoir plus
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="avantages" className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Chiffres clés</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Tout ce dont vous avez besoin</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <StatCard key={item.title} value={item.value} title={item.title} subtitle={item.subtitle} />
            ))}
          </div>

          <div className="mt-12">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Avantages pro</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">Nos 6 avantages Pro</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {advantages.map((item) => (
                <AdvantageCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Vous êtes...</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Choisissez votre secteur</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRO_SECTORS.map((sector) => (
              <button
                key={sector}
                type="button"
                onClick={() => handleChipSelect(sector)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === sector
                    ? 'border-[#0A7EA4] bg-nc-lagonLight text-[#0A7EA4]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-night/70 hover:bg-[var(--color-background-secondary)]'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Simple et transparent</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Des offres claires pour démarrer</h2>
          </div>
          <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-[2rem] border bg-[var(--color-surface)] p-6 shadow-sm ${
                  plan.highlighted ? 'border-2 border-[#0A7EA4]' : 'border-[var(--color-border)]'
                }`}
              >
                {plan.highlighted ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-[#0A7EA4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                    Recommandé
                  </span>
                ) : null}
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-night/45">{plan.name}</p>
                <p className="mt-2 text-3xl font-bold text-night">{plan.price}</p>
                <ul className="mt-5 space-y-2 text-sm text-night/65">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.highlighted ? '/pro/inscription?plan=pro' : '/pro/inscription'}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    plan.highlighted
                      ? 'bg-[#0A7EA4] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-night hover:bg-[var(--color-background-secondary)]'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section ref={formRef} id="formulaire-pro" className="mx-auto max-w-7xl px-4 pb-16">
          <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.2))] px-6 py-8 text-white md:px-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/75">Créer mon compte Pro</p>
                <h2 className="mt-2 font-display text-3xl font-bold">Gratuit pour commencer</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
                  Remplissez votre demande, notre équipe valide votre compte sous 48h et vous aide à démarrer sur Troca.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Validation</p>
                    <p className="mt-2 text-sm text-white/85">Sous 48h par notre équipe.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Contact</p>
                    <p className="mt-2 text-sm text-white/85">Vitrine, téléphone, site et horaires.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                {successMessage ? (
                  <div className="mb-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {successMessage}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                {!isAuthenticated ? (
                  <div className="mb-6 rounded-[1.5rem] border border-[#0A7EA4]/15 bg-nc-lagonLight px-4 py-4 text-sm text-night/70">
                    Connectez-vous pour envoyer votre demande Pro.
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => openAuthModal({ type: 'login', redirectTo: '/pro#formulaire-pro' })}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        Se connecter
                      </button>
                      <Link href="/inscription" className="btn-secondary px-4 py-2 text-sm">
                        Créer un compte
                      </Link>
                    </div>
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-night">Nom de l'entreprise / Raison sociale *</label>
                    <input
                      value={form.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                      placeholder="Ex. Atelier Kalo"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-night">Catégorie *</label>
                    <select
                      value={form.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                      required
                    >
                      <option value="">Choisissez votre secteur</option>
                      {PRO_SECTORS.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-night">Description courte *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value.slice(0, 300))}
                      rows={4}
                      maxLength={300}
                      className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                      placeholder="Présentez votre activité en 300 caractères max."
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-night">Commune *</label>
                    <select
                      value={form.commune}
                      onChange={(e) => handleChange('commune', e.target.value)}
                      className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                      required
                    >
                      <option value="">Choisissez votre commune</option>
                      {COMMUNES.map((commune) => (
                        <option key={commune} value={commune}>
                          {commune}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-night">Téléphone professionnel</label>
                      <input
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                        placeholder="+687 ..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-night">Site web</label>
                      <input
                        value={form.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-night">Horaires d'ouverture</label>
                    <textarea
                      value={form.hours}
                      onChange={(e) => handleChange('hours', e.target.value)}
                      rows={3}
                      className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                      placeholder="Ex. Lun-Ven 8h-17h, Sam 8h-12h"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-night">Numéro RIDET</label>
                    <input
                      value={form.siret}
                      onChange={(e) => handleChange('siret', e.target.value)}
                      className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                      placeholder="Ex. 1 234 567.8"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm disabled:opacity-70"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Envoyer ma demande
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
