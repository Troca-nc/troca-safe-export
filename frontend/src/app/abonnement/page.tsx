'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Check, ShieldCheck, Sparkles, Star, TrendingUp } from 'lucide-react'

import { PaymentProviderSelector } from '@/components/monetisation/PaymentProviderSelector'
import { useSubscription } from '@/hooks/usePayment'
import { trackEvent } from '@/lib/analytics'
import { PRO_PLANS, type BillingPeriod, type PaymentProvider, type PlanId } from '@/types/monetisation.types'

const XPF_PER_EUR = 119.3317

type FeatureRow = {
  label: string
  free: string
  pro: string
  proPlus: string
}

type PricingCard = {
  id: 'free' | PlanId
  label: string
  highlight?: boolean
  badge?: string
  intro: string
  monthlyXpf: number
  yearlyXpf: number
  yearlyNote?: string
  features: Array<{
    label: string
    value: string
  }>
  cta?: {
    label: string
    href?: string
    planId?: PlanId
  }
}

function formatEur(amountXpf: number) {
  return (amountXpf / XPF_PER_EUR).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPricePair(amountXpf: number) {
  return `${amountXpf.toLocaleString('fr-FR')} XPF (${formatEur(amountXpf)} €)`
}

function getMonthlyEquivalent(yearlyXpf: number) {
  return Math.round(yearlyXpf / 12)
}

function getMonthsSaved(monthlyXpf: number, yearlyXpf: number) {
  if (!monthlyXpf) return 0
  return Math.max(0, Math.round(12 - yearlyXpf / monthlyXpf))
}

const FREE_PLAN: PricingCard = {
  id: 'free',
  label: 'Gratuit',
  intro: 'Pour essayer Troca sans engagement et publier vos premières annonces.',
  monthlyXpf: 0,
  yearlyXpf: 0,
  features: [
    { label: 'Annonces actives', value: '1 annonce' },
    { label: 'Photos par annonce', value: '3 photos' },
    { label: 'Boosts', value: 'Non inclus' },
    { label: 'Badge vendeur vérifié', value: 'Non' },
    { label: "Statistiques d'annonce", value: 'Vue simple' },
    { label: 'Support', value: 'Standard' },
  ],
  cta: {
    label: 'Créer mon compte',
    href: '/inscription',
  },
}

const PRO_PLAN = PRO_PLANS.find((plan) => plan.id === 'pro') ?? PRO_PLANS[0]
const PRO_PLUS_PLAN = PRO_PLANS.find((plan) => plan.id === 'pro_plus') ?? PRO_PLANS[1]

const PRICING_PLANS: PricingCard[] = [
  FREE_PLAN,
  {
    id: 'pro',
    label: PRO_PLAN.label,
    intro: 'Le meilleur équilibre pour les vendeurs réguliers qui veulent gagner du temps et de la visibilité.',
    monthlyXpf: PRO_PLAN.price_monthly,
    yearlyXpf: PRO_PLAN.price_yearly,
    yearlyNote: 'Économisez 2 mois sur la formule annuelle',
    features: [
      { label: 'Annonces actives', value: '5 annonces' },
      { label: 'Photos par annonce', value: '10 photos' },
      { label: 'Boosts', value: 'À la carte' },
      { label: 'Badge vendeur vérifié', value: 'Oui' },
      { label: "Statistiques d'annonce", value: 'Détaillées' },
      { label: 'Support', value: 'Email prioritaire' },
    ],
    cta: {
      label: 'Choisir Pro',
      planId: 'pro',
    },
  },
  {
    id: 'pro_plus',
    label: PRO_PLUS_PLAN.label,
    highlight: true,
    badge: 'Recommandé',
    intro: 'La formule la plus lisible pour les pros qui publient souvent et veulent maximiser leur présence.',
    monthlyXpf: PRO_PLUS_PLAN.price_monthly,
    yearlyXpf: PRO_PLUS_PLAN.price_yearly,
    yearlyNote: 'Économisez 2 mois sur la formule annuelle',
    features: [
      { label: 'Annonces actives', value: '25 annonces' },
      { label: 'Photos par annonce', value: '15 photos' },
      { label: 'Boosts', value: '3 offerts / mois' },
      { label: 'Badge vendeur vérifié', value: 'Oui + prioritaire' },
      { label: "Statistiques d'annonce", value: 'Avancées' },
      { label: 'Support', value: 'Téléphone prioritaire' },
    ],
    cta: {
      label: 'Choisir Pro+',
      planId: 'pro_plus',
    },
  },
]

const COMPARISON_ROWS: FeatureRow[] = [
  {
    label: 'Annonces actives',
    free: '1',
    pro: '5',
    proPlus: '25',
  },
  {
    label: 'Photos par annonce',
    free: '3',
    pro: '10',
    proPlus: '15',
  },
  {
    label: 'Boosts',
    free: 'Non',
    pro: 'À la carte',
    proPlus: '3 offerts / mois',
  },
  {
    label: 'Badge vendeur vérifié',
    free: 'Non',
    pro: 'Oui',
    proPlus: 'Oui + prioritaire',
  },
  {
    label: "Statistiques d'annonce",
    free: 'Basique',
    pro: 'Détaillées',
    proPlus: 'Avancées',
  },
  {
    label: 'Support prioritaire',
    free: 'Non',
    pro: 'Email',
    proPlus: 'Téléphone',
  },
]

export default function AbonnementPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const [provider, setProvider] = useState<PaymentProvider>('stripe')
  const { initiateSubscription, loading, error } = useSubscription()

  const annualSavingsMonths = useMemo(
    () => getMonthsSaved(PRO_PLAN.price_monthly, PRO_PLAN.price_yearly),
    []
  )

  const handleSubscribe = (planId: PlanId) => {
    void trackEvent('subscription_cta_click', {
      plan_id: planId,
      billing_period: billing,
      provider,
    })

    void initiateSubscription({
      plan_id: planId,
      billing_period: billing,
      provider,
    })
  }

  const periodLabel = billing === 'monthly' ? '/mois' : '/an'

  return (
    <div className="min-h-screen bg-sand-light">
      <section className="bg-night px-4 py-16 text-center text-white">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral/20 px-3 py-1.5 text-xs font-medium text-coral">
          <Star size={12} /> Abonnements Troca
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
          Gratuit, Pro, Pro+
          <br />
          comparez en 5 secondes
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/70 md:text-base">
          Les prix sont affichés en XPF en priorité avec l&apos;équivalent en euros, et le choix du
          moyen de paiement guide automatiquement le tunnel Stripe ou PayPlug.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/45">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} /> Paiement sécurisé
          </span>
          <span className="flex items-center gap-1">
            <Check size={12} /> Résiliation à tout moment
          </span>
          <span className="flex items-center gap-1">
            <Sparkles size={12} /> 14 jours d&apos;essai
          </span>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-night/8 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
              Tarif lisible
            </p>
            <h2 className="mt-1 text-2xl font-bold text-night">Mensuel ou annuel</h2>
            <p className="mt-1 max-w-2xl text-sm text-night/60">
              Le mode annuel met en avant la réduction réalisée sur 12 mois. Vous voyez le prix
              réduit immédiatement, sans calcul mental.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-2xl bg-sand p-1">
            {(['monthly', 'yearly'] as BillingPeriod[]).map((period) => {
              const active = billing === period
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => setBilling(period)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    active ? 'bg-white text-night shadow-sm' : 'text-night/50 hover:text-night'
                  }`}
                >
                  {period === 'monthly' ? (
                    'Mensuel'
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Annuel
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        Économisez {annualSavingsMonths} mois
                      </span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-night/8 bg-white p-5 shadow-sm">
          <PaymentProviderSelector
            value={provider}
            onChange={setProvider}
            className="rounded-[1.75rem] border border-night/8 bg-sand/35 p-5"
          />
          <p className="mt-3 text-sm text-night/55">
            Votre choix s&apos;applique au prochain checkout. Stripe est conseillé pour les cartes
            internationales, PayPlug pour les cartes OPT-NC et le réseau local.
          </p>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const isPaidPlan = plan.id !== 'free'
            const yearlySavings = isPaidPlan
              ? getMonthsSaved(plan.monthlyXpf, plan.yearlyXpf)
              : 0
            const selectedPrice = billing === 'monthly' ? plan.monthlyXpf : plan.yearlyXpf
            const monthlyEquivalent = isPaidPlan && billing === 'yearly'
              ? getMonthlyEquivalent(plan.yearlyXpf)
              : plan.monthlyXpf
            const yearlyDisplay = plan.yearlyXpf > 0 ? formatPricePair(plan.yearlyXpf) : 'Gratuit'

            return (
              <article
                key={plan.id}
                className={`relative flex h-full flex-col rounded-[2rem] border-2 bg-white p-6 shadow-sm transition-all ${
                  plan.highlight
                    ? 'border-coral shadow-xl ring-2 ring-coral/10 lg:scale-[1.03]'
                    : 'border-night/8'
                }`}
              >
                {plan.badge ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-4 py-1 text-xs font-bold text-white shadow">
                    {plan.badge}
                  </div>
                ) : null}

                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
                    {plan.id === 'free' ? 'Sans engagement' : 'Offre payante'}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-night">{plan.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-night/60">{plan.intro}</p>
                </div>

                <div className="rounded-2xl bg-sand/40 p-4">
                  {plan.id === 'free' ? (
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-night">Gratuit</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-night">
                          {formatPricePair(selectedPrice)}
                        </span>
                        <span className="mb-1 text-sm text-night/40">{periodLabel}</span>
                      </div>
                      <p className="mt-1 text-xs text-night/55">
                        {billing === 'yearly'
                          ? `${formatPricePair(monthlyEquivalent)} / mois en moyenne`
                          : `${formatPricePair(plan.yearlyXpf)} / an`}
                      </p>
                      {billing === 'yearly' ? (
                        <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                          Économisez {yearlySavings} mois
                        </p>
                      ) : null}
                    </>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={`${plan.id}-${feature.label}`} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check size={12} />
                      </span>
                      <span className="text-night/70">
                        <span className="font-semibold text-night">{feature.value}</span>{' '}
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  {plan.cta?.href ? (
                    <Link
                      href={plan.cta.href}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-night px-4 py-3 text-sm font-semibold text-white transition hover:bg-night/80"
                    >
                      {plan.cta.label}
                      <ArrowRight size={16} />
                    </Link>
                  ) : plan.cta?.planId ? (
                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan.cta?.planId ?? 'pro')}
                      disabled={loading}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${
                        plan.highlight ? 'bg-coral hover:bg-coral-dark' : 'bg-night hover:bg-night/80'
                      }`}
                    >
                      {loading ? 'Redirection...' : plan.cta.label}
                      {!loading ? <ArrowRight size={16} /> : null}
                    </button>
                  ) : null}

                  {plan.id !== 'free' ? (
                    <p className="mt-3 text-center text-[11px] leading-5 text-night/50">
                      {plan.yearlyNote}
                    </p>
                  ) : (
                    <p className="mt-3 text-center text-[11px] leading-5 text-night/50">
                      Commencez gratuitement puis passez en Pro ou Pro+ quand vous êtes prêt.
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </section>

        <section className="mt-10 rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
                Comparatif express
              </p>
              <h2 className="mt-1 text-2xl font-bold text-night">Pourquoi payer plus ?</h2>
            </div>
            <p className="max-w-2xl text-sm text-night/55">
              En un coup d&apos;oeil, voyez ce qui change vraiment entre les trois niveaux.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-night/8 text-night/45">
                <tr>
                  <th className="py-3 pr-4 font-medium">Fonctionnalité</th>
                  <th className="py-3 pr-4 font-medium">Gratuit</th>
                  <th className="py-3 pr-4 font-medium">Pro</th>
                  <th className="py-3 pr-4 font-medium">Pro+</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-night/5 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-night">{row.label}</td>
                    <td className="py-3 pr-4 text-night/70">{row.free}</td>
                    <td className="py-3 pr-4 text-night/70">{row.pro}</td>
                    <td className="py-3 pr-4 text-night/70">{row.proPlus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-8 rounded-[2rem] border border-night/8 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
              <div>
                <p className="text-sm font-semibold text-night">Le plus important à retenir</p>
                <p className="mt-1 text-sm text-night/60">
                  Gratuit pour commencer. Pro pour gagner du temps. Pro+ pour maximiser la
                  visibilité et la crédibilité vendeur.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-night/55">
              <span className="rounded-full bg-sand px-3 py-1">Stripe / PayPlug</span>
              <span className="rounded-full bg-sand px-3 py-1">14 jours d&apos;essai</span>
              <span className="rounded-full bg-sand px-3 py-1">Annulation à tout moment</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-8 text-center text-sm text-night/55">
          Besoin d&apos;un détail avant de vous lancer ?{' '}
          <Link href="/contact" className="font-semibold text-coral hover:underline">
            Contactez-nous
          </Link>
        </div>

        {/* TODO: test E2E sur le comparatif pricing, le toggle mensuel/annuel et les CTA paiement. */}
      </main>
    </div>
  )
}
