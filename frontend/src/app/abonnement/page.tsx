'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Check, ShieldCheck, Sparkles, Star, TrendingUp } from 'lucide-react'

import DemoModeNotice from '@/components/DemoModeNotice'
import { PaymentProviderSelector } from '@/components/monetisation/PaymentProviderSelector'
import { useSubscription } from '@/hooks/usePayment'
import { trackEvent } from '@/lib/analytics'
import { PRO_PLANS, type BillingPeriod, type PaymentProvider } from '@/types/monetisation.types'

const XPF_PER_EUR = 119.3317
const PRO_PLAN = PRO_PLANS[0]

const BOOST_PRICING = [
  { label: '3 jours', publicXpf: 500, proXpf: 400 },
  { label: '7 jours', publicXpf: 900, proXpf: 720 },
  { label: '14 jours', publicXpf: 1500, proXpf: 1200 },
  { label: '30 jours', publicXpf: 2500, proXpf: 2000 },
]

function formatEur(amountXpf: number) {
  return (amountXpf / XPF_PER_EUR).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatXpfEur(amountXpf: number) {
  return `${amountXpf.toLocaleString('fr-FR')} XPF (${formatEur(amountXpf)} EUR)`
}

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

  const annualSavingsMonths = useMemo(
    () => getSavingsMonths(PRO_PLAN.price_monthly, PRO_PLAN.price_yearly),
    []
  )

  const currentPrice = billing === 'monthly' ? PRO_PLAN.price_monthly : PRO_PLAN.price_yearly
  const monthlyEquivalent = billing === 'yearly' ? Math.round(PRO_PLAN.price_yearly / 12) : PRO_PLAN.price_monthly

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
          <Star size={12} /> Developpez votre activite sur Troca
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
          La plateforme des professionnels
          <br />
          en Nouvelle-Caledonie
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-white/70 md:text-base">
          Gratuit pour commencer sans friction. Pro pour les professionnels qui veulent plus de
          visibilité, plus de photos, des statistiques et des boosts moins chers.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/45">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} /> Paiement securise
          </span>
          <span className="flex items-center gap-1">
            <Check size={12} /> Resiliation a tout moment
          </span>
          <span className="flex items-center gap-1">
            <Sparkles size={12} /> 14 jours d'essai si configure
          </span>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-night/8 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
              Choisissez votre rythme
            </p>
            <h2 className="mt-1 text-2xl font-bold text-night">Mensuel ou annuel</h2>
            <p className="mt-1 max-w-2xl text-sm text-night/60">
              L&apos;option annuelle affiche directement la reduction sur 12 mois. Pas de calcul,
              juste un prix clair.
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
            Stripe est recommande pour les cartes internationales. PayPlug est recommande pour les
            cartes OPT-NC et le reseau local.
          </p>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="flex h-full flex-col rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">Gratuit</p>
            <h3 className="mt-2 text-2xl font-bold text-night">Pour particuliers</h3>
            <p className="mt-2 text-sm leading-6 text-night/60">
              Publiez sans friction avec les fonctionnalites de base pour rester actif sur la
              plateforme.
            </p>
            <div className="mt-4 rounded-2xl bg-sand/40 p-4">
              <div className="text-3xl font-bold text-night">0 XPF</div>
              <div className="text-xs text-night/45">Toujours gratuit</div>
            </div>
            <ul className="mt-6 space-y-3">
              <PlanFeature enabled text="Jusqu'a 5 annonces actives" />
              <PlanFeature enabled text="Jusqu'a 6 photos par annonce" />
              <PlanFeature enabled text="Chat integre et verification telephone" />
              <PlanFeature enabled text="Boosts a l'acte" />
              <PlanFeature enabled={false} text="Statistiques et badge Pro" />
            </ul>
            <div className="mt-auto pt-6">
              <Link
                href="/inscription"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-night px-4 py-3 text-sm font-semibold text-white transition hover:bg-night/80"
              >
                Creer mon compte
                <ArrowRight size={16} />
              </Link>
            </div>
          </article>

          <article className="relative flex h-full flex-col rounded-[2rem] border-2 border-coral bg-white p-6 shadow-xl ring-2 ring-coral/10 lg:scale-[1.02]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-4 py-1 text-xs font-bold text-white shadow">
              Recommande
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">Pro</p>
            <h3 className="mt-2 text-2xl font-bold text-night">Developpez votre activite</h3>
            <p className="mt-2 text-sm leading-6 text-night/60">
              4 900 XPF/mois ou 44 900 XPF/an. Le meilleur choix pour les professionnels qui
              veulent plus de volume, plus de photos et moins de frais sur les boosts.
            </p>
            <div className="mt-4 rounded-2xl bg-night p-4 text-white">
              <div className="text-3xl font-bold">{formatXpfEur(currentPrice)}</div>
              <div className="mt-1 text-xs text-white/70">
                {billing === 'yearly'
                  ? `${formatXpfEur(monthlyEquivalent)} / mois en moyenne`
                  : `${formatXpfEur(PRO_PLAN.price_yearly)} / an`}
              </div>
              {billing === 'yearly' ? (
                <div className="mt-2 inline-flex rounded-full bg-emerald-400/20 px-2 py-1 text-[11px] font-semibold text-emerald-200">
                  Economisez {annualSavingsMonths} mois
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
                {loading ? 'Redirection...' : "Commencer l'essai gratuit 14 jours"}
                {!loading ? <ArrowRight size={16} /> : null}
              </button>
              <p className="mt-3 text-center text-[11px] leading-5 text-night/50">
                Si aucun essai n&apos;est configure, le tunnel passe directement en abonnement.
              </p>
            </div>
          </article>

          <article className="flex h-full flex-col rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">Boosts</p>
            <h3 className="mt-2 text-2xl font-bold text-night">A la carte</h3>
            <p className="mt-2 text-sm leading-6 text-night/60">
              Les boosts restent disponibles pour tous les utilisateurs. Les abonnes Pro paient
              moins cher.
            </p>
            <div className="mt-4 rounded-2xl bg-sand/40 p-4">
              <div className="text-sm font-semibold text-night">Tarifs public / Pro</div>
              <div className="mt-3 space-y-2 text-sm text-night/70">
                {BOOST_PRICING.map((boost) => (
                  <div key={boost.label} className="flex items-center justify-between gap-3">
                    <span>{boost.label}</span>
                    <span className="text-right">
                      <strong>{boost.publicXpf.toLocaleString('fr-FR')} XPF</strong>
                      <br />
                      <span className="text-xs text-night/45">
                        Pro {boost.proXpf.toLocaleString('fr-FR')} XPF
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              <PlanFeature enabled text="Boost a la une" />
              <PlanFeature enabled text="Badge urgent" />
              <PlanFeature enabled text="Photos supplementaires" />
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
              <h2 className="mt-1 text-2xl font-bold text-night">Un usage pro, un revenu recurrent</h2>
            </div>
            <p className="max-w-2xl text-sm text-night/55">
              Gratuit pour faire grossir le reseau. Pro pour les pros. Boosts a l'acte pour tout le
              monde.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              'Gestion de volume sans friction',
              'Plus de visibilite et de photos',
              'Revenus recurrents simples a comprendre',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-sand/40 p-4 text-sm text-night/70">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
                Ils font confiance a Troca Pro
              </p>
              <h2 className="mt-1 text-2xl font-bold text-night">Logos clients a venir</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {['Logo client 1', 'Logo client 2', 'Logo client 3'].map((label) => (
              <div key={label} className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-night/10 bg-sand/30 text-sm text-night/35">
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-night">FAQ</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                q: 'Qui est Pro pour vous ?',
                a: 'Les professionnels qui publient souvent, gèrent plusieurs annonces ou veulent des outils de visibilite et de statistiques.',
              },
              {
                q: 'Puis-je annuler ?',
                a: "Oui, vous pouvez resilier a tout moment depuis votre espace client. L'acces reste actif jusqu'a la fin de la periode en cours.",
              },
              {
                q: 'Quels moyens de paiement ?',
                a: 'Carte internationale via Stripe ou carte OPT-NC / reseau local via PayPlug.',
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
                <p className="text-sm font-semibold text-night">Le plus important a retenir</p>
                <p className="mt-1 text-sm text-night/60">
                  Gratuit pour grossir le reseau. Pro pour les professionnels. Boosts pour
                  accelerer quand il faut.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-night/55">
              <span className="rounded-full bg-sand px-3 py-1">Stripe / PayPlug</span>
              <span className="rounded-full bg-sand px-3 py-1">Paiement local</span>
              <span className="rounded-full bg-sand px-3 py-1">Annulation a tout moment</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-8 text-center text-sm text-night/55">
          Besoin d&apos;un detail avant de vous lancer ?{' '}
          <Link href="/contact" className="font-semibold text-coral hover:underline">
            Contactez-nous
          </Link>
        </div>

        {/* TODO: test E2E sur le comparatif pricing, le toggle mensuel/annuel et les CTA paiement. */}
      </main>
    </div>
  )
}
