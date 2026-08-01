'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'

import DemoModeNotice from '@/components/DemoModeNotice'
import { PaymentProviderSelector } from '@/components/monetisation/PaymentProviderSelector'
import { useSubscription } from '@/hooks/usePayment'
import { trackEvent } from '@/lib/analytics'
import { PRO_PLANS, type BillingPeriod, type PaymentProvider } from '@/types/monetisation.types'

const PRO_PLAN = PRO_PLANS[0]

const BOOST_PRICING = [
  { label: '3 jours', publicXpf: 500, proXpf: 400 },
  { label: '7 jours', publicXpf: 900, proXpf: 720 },
  { label: '14 jours', publicXpf: 1500, proXpf: 1200 },
  { label: '30 jours', publicXpf: 2500, proXpf: 2000 },
]

const CLIENT_LOGOS = ['Logo client 1', 'Logo client 2', 'Logo client 3']

function getSavingsMonths(monthlyXpf: number, yearlyXpf: number) {
  if (!monthlyXpf) return 0
  return Math.max(0, Math.round(12 - yearlyXpf / monthlyXpf))
}

function PlanFeature({ enabled, text }: { enabled: boolean; text: string }) {
  return (
    <li className={`flex items-start gap-3 text-sm ${enabled ? 'text-night/75' : 'text-night/40'}`}>
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-sand text-night/35'
        }`}
      >
        <Check size={12} />
      </span>
      <span>{text}</span>
    </li>
  )
}

export default function AbonnementPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const [provider, setProvider] = useState<PaymentProvider>('stripe')
  const { initiateSubscription, loading, error } = useSubscription()
  const stripePk = process.env.NEXT_PUBLIC_STRIPE_PK?.trim()
  const hasStripeConfigured = Boolean(stripePk)

  const annualSavingsMonths = useMemo(
    () => getSavingsMonths(PRO_PLAN.price_monthly, PRO_PLAN.price_yearly),
    [],
  )

  const proPriceLabel =
    billing === 'yearly'
      ? `${PRO_PLAN.price_yearly.toLocaleString('fr-FR')} XPF / an`
      : `${PRO_PLAN.price_monthly.toLocaleString('fr-FR')} XPF / mois`

  const hasRealClientLogos = CLIENT_LOGOS.some((label) => !/^Logo client \d+$/i.test(label))

  const handleSubscribe = () => {
    void trackEvent('subscription_cta_click', {
      plan_id: 'pro',
      billing_period: billing,
      provider,
    })

    void initiateSubscription({
      plan_id: 'pro',
      billing_period: billing,
      provider,
    })
  }

  return (
    <div className="min-h-screen bg-sand-light">
      <section className="bg-night px-4 py-16 text-center text-white">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral/20 px-3 py-1.5 text-xs font-medium text-coral">
          <TrendingUp size={12} /> Développez votre activité sur Kalico
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
          La plateforme des professionnels
          <br />
          en Nouvelle-Calédonie
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-white/70 md:text-base">
          Gratuit pour commencer sans friction. Pro pour les professionnels qui veulent plus de
          visibilité, plus de photos, des statistiques et des boosts moins chers.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/45">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} /> Paiement sécurisé
          </span>
          <span className="flex items-center gap-1">
            <Check size={12} /> Résiliation à tout moment
          </span>
          <span className="flex items-center gap-1">
            <Sparkles size={12} /> 14 jours d&apos;essai si configuré
          </span>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-night/50 transition-colors hover:text-night"
        >
          <ArrowLeft size={14} />
          Retour à l&apos;accueil
        </Link>

        <div className="flex flex-col gap-4 rounded-[2rem] border border-night/8 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
              Choisissez votre rythme
            </p>
            <h2 className="mt-1 text-2xl font-bold text-night">Mensuel ou annuel</h2>
            <p className="mt-1 max-w-2xl text-sm text-night/60">
              L&apos;option annuelle affiche directement la réduction sur 12 mois. Le calcul reste
              local dans l&apos;interface, juste un prix clair.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-2xl border border-night/10 bg-[var(--color-background-secondary)] p-1">
            {(['monthly', 'yearly'] as BillingPeriod[]).map((period) => {
              const active = billing === period
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => setBilling(period)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-white text-night shadow-sm ring-1 ring-black/5'
                      : 'text-night/75 hover:bg-white hover:text-night'
                  }`}
                >
                  {period === 'monthly' ? (
                    'Mensuel'
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Annuel
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        2 mois offerts
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
          <DemoModeNotice className="mt-4" />
          <p className="mt-3 text-sm text-night/55">
            Stripe est recommandé pour les cartes internationales. PayPlug est recommandé pour les
            cartes OPT-NC et le réseau local.
          </p>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="flex h-full flex-col rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">Gratuit</p>
            <h3 className="mt-2 text-2xl font-bold text-night">Pour particuliers</h3>
            <p className="mt-2 text-sm leading-6 text-night/60">
              Publiez sans friction avec les fonctionnalités de base pour rester actif sur la
              plateforme.
            </p>
            <div className="mt-4 rounded-2xl bg-sand/40 p-4">
              <div className="text-3xl font-bold text-night">0 XPF</div>
              <div className="text-xs text-night/45">Toujours gratuit</div>
            </div>
            <ul className="mt-6 space-y-3">
              <PlanFeature enabled text="Jusqu'à 5 annonces actives" />
              <PlanFeature enabled text="Jusqu'à 6 photos par annonce" />
              <PlanFeature enabled text="Chat intégré et vérification téléphone" />
              <PlanFeature enabled text="Boosts à l'acte" />
              <PlanFeature enabled={false} text="Statistiques et badge Pro" />
            </ul>
            <div className="mt-auto pt-6">
              <Link
                href="/inscription"
                className="btn-secondary flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold"
              >
                Créer mon compte
                <ArrowRight size={16} />
              </Link>
            </div>
          </article>

          <article className="relative flex h-full flex-col rounded-[2rem] border-2 border-coral bg-white p-6 shadow-xl ring-2 ring-coral/10 lg:scale-[1.02]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-4 py-1 text-xs font-bold text-white shadow">
              Recommandé
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">Pro</p>
            <h3 className="mt-2 text-2xl font-bold text-night">Développez votre activité</h3>
            <p className="mt-2 text-sm leading-6 text-night/60">
              4 900 XPF / mois ou 44 900 XPF / an. Le meilleur choix pour les professionnels qui
              veulent plus de volume, plus de photos et moins de frais sur les boosts.
            </p>
            <div className="mt-4 rounded-2xl bg-night p-4 text-white">
              <div className="text-3xl font-bold">{proPriceLabel}</div>
              <div className="mt-1 text-xs text-white/70">
                {billing === 'yearly' ? 'Paiement annuel' : 'Paiement mensuel'}
              </div>
              {billing === 'yearly' ? (
                <div className="mt-2 inline-flex rounded-full bg-emerald-400/20 px-2 py-1 text-[11px] font-semibold text-emerald-200">
                  Économisez {annualSavingsMonths} mois
                </div>
              ) : null}
            </div>
            <ul className="mt-6 space-y-3">
              {PRO_PLAN.features.map((feature) => (
                <PlanFeature key={feature} enabled text={feature} />
              ))}
            </ul>
            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral-dark disabled:opacity-60"
              >
                {loading
                  ? 'Redirection...'
                  : hasStripeConfigured
                    ? "Commencer l'essai gratuit 14 jours"
                    : 'Choisir le plan Pro'}
                {!loading ? <ArrowRight size={16} /> : null}
              </button>
            </div>
          </article>

          <article className="flex h-full flex-col rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">Boosts</p>
            <h3 className="mt-2 text-2xl font-bold text-night">À la carte</h3>
            <p className="mt-2 text-sm leading-6 text-night/60">
              Les boosts restent disponibles pour tous les utilisateurs. Les abonnés Pro paient
              moins cher.
            </p>
            <div className="mt-4 rounded-2xl bg-sand/40 p-4">
              <div className="text-sm font-semibold text-night">Tarif Pro / Tarif standard</div>
              <div className="mt-3 space-y-2 text-sm text-night/70">
                {BOOST_PRICING.map((boost) => (
                  <div key={boost.label} className="flex items-center justify-between gap-3">
                    <span>{boost.label}</span>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
                        <span>{boost.proXpf.toLocaleString('fr-FR')} XPF</span>
                        <span className="rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-success)]">
                          Pro
                        </span>
                      </div>
                      <div className="text-xs text-night/45 line-through">
                        {boost.publicXpf.toLocaleString('fr-FR')} XPF
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              <PlanFeature enabled text="Boost à la une" />
              <PlanFeature enabled text="Badge urgent" />
              <PlanFeature enabled text="Photos supplémentaires" />
              <PlanFeature enabled text="Disponible pour particuliers et pros" />
            </ul>
            <div className="mt-auto pt-6">
              <Link
                href="/annonces"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-night/10 bg-sand px-4 py-3 text-sm font-semibold text-night transition hover:bg-sand/80"
              >
                Voir les boosts
                <ArrowRight size={16} />
              </Link>
            </div>
          </article>
        </section>

        <section className="mt-10 rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
                Pourquoi Pro ?
              </p>
              <h2 className="mt-1 text-2xl font-bold text-night">Un usage pro, un revenu récurrent</h2>
            </div>
            <p className="max-w-2xl text-sm text-night/55">
              Le compte gratuit suffit pour démarrer. Le Pro accompagne ceux qui veulent aller plus
              loin. Les boosts restent accessibles à tous.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              'Gestion de volume sans friction',
              'Plus de visibilité et de photos',
              'Revenus récurrents simples à comprendre',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-sand/40 p-4 text-sm text-night/70">
                {item}
              </div>
            ))}
          </div>
        </section>

        {hasRealClientLogos ? (
          <section className="mt-10 rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
                  Ils font confiance à Kalico Pro
                </p>
                <h2 className="mt-1 text-2xl font-bold text-night">Logos clients à venir</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {CLIENT_LOGOS.map((label) => (
                <div
                  key={label}
                  className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-night/10 bg-sand/30 text-sm text-night/35"
                >
                  {label}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10 rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-night">FAQ</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                q: 'Qui est Pro pour vous ?',
                a: 'Les professionnels qui publient souvent, gèrent plusieurs annonces ou veulent des outils de visibilité et de statistiques.',
              },
              {
                q: 'Puis-je annuler ?',
                a: "Oui, vous pouvez résilier à tout moment depuis votre espace client. L'accès reste actif jusqu'à la fin de la période en cours.",
              },
              {
                q: 'Quels moyens de paiement ?',
                a: 'Carte internationale via Stripe ou carte OPT-NC / réseau local via PayPlug.',
              },
            ].map((item) => (
              <article key={item.q} className="rounded-2xl bg-sand/30 p-4">
                <h3 className="font-semibold text-night">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-night/65">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 rounded-[2rem] border border-night/8 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
              <div>
                <p className="text-sm font-semibold text-night">Le plus important à retenir</p>
                <p className="mt-1 text-sm text-night/60">
                  Le compte gratuit suffit pour démarrer. Le Pro accompagne ceux qui veulent aller
                  plus loin. Les boosts restent accessibles à tous.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-night/55">
              <span className="rounded-full bg-sand px-3 py-1">Stripe / PayPlug</span>
              <span className="rounded-full bg-sand px-3 py-1">Paiement local</span>
              <span className="rounded-full bg-sand px-3 py-1">Annulation à tout moment</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-center text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}

        <div className="mt-8 text-center text-sm text-night/55">
          Besoin d&apos;un détail avant de vous lancer ?{' '}
          <Link href="/contact" className="font-semibold text-coral hover:underline">
            Contactez-nous
          </Link>
        </div>
      </main>
    </div>
  )
}
