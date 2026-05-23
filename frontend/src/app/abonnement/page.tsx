'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ShieldCheck, Sparkles, Star, TrendingUp } from 'lucide-react'
import { PaymentProviderSelector } from '@/components/monetisation/PaymentProviderSelector'
import { PRO_PLANS, formatXPF, type BillingPeriod, type PaymentProvider } from '@/types/monetisation.types'
import { useSubscription } from '@/hooks/usePayment'
import { trackEvent } from '@/lib/analytics'

function getDiscount(monthly: number, yearly: number) {
  if (monthly <= 0) return 0
  return Math.max(0, Math.round((1 - yearly / 12 / monthly) * 100))
}

export default function AbonnementPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const [provider, setProvider] = useState<PaymentProvider>('stripe')
  const { initiateSubscription, loading, error } = useSubscription()

  const annualSavings = useMemo(() => {
    const plan = PRO_PLANS[0]
    return getDiscount(plan.price_monthly, plan.price_yearly)
  }, [])

  return (
    <div className="min-h-screen bg-sand-light">
      <div className="bg-night px-4 py-16 text-center text-white">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral/20 px-3 py-1.5 text-xs font-medium text-coral">
          <Star size={12} /> Abonnements Pro
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight">
          Comparez les plans
          <br />
          et choisissez votre rythme
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/65">
          Passez du mensuel à l&apos;annuel en un clic. Les prix sont lus depuis vos variables
          d&apos;environnement et les économies sont calculées dynamiquement.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/45">
          <span className="flex items-center gap-1"><ShieldCheck size={12} /> Paiement sécurisé</span>
          <span className="flex items-center gap-1"><Check size={12} /> Annulation à tout moment</span>
          <span className="flex items-center gap-1"><Sparkles size={12} /> 14 jours d&apos;essai</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-4">
          <div className="inline-flex items-center gap-1 rounded-2xl bg-sand p-1">
            {(['monthly', 'yearly'] as BillingPeriod[]).map((period) => {
              const active = billing === period
              const savings = period === 'yearly' ? annualSavings : 0
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => setBilling(period)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    active ? 'bg-white text-night shadow-sm' : 'text-night/50 hover:text-night'
                  }`}
                >
                  {period === 'monthly' ? 'Mensuel' : (
                    <span className="flex items-center gap-1.5">
                      Annuel
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        Économisez {savings}%
                      </span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <PaymentProviderSelector
            value={provider}
            onChange={setProvider}
            className="rounded-3xl border border-night/8 bg-white p-5 shadow-sm"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PRO_PLANS.map((plan) => {
            const price = billing === 'monthly' ? plan.price_monthly : plan.price_yearly
            const monthlyEquivalent = billing === 'yearly' ? Math.round(plan.price_yearly / 12) : plan.price_monthly
            const planSavings = billing === 'yearly' ? getDiscount(plan.price_monthly, plan.price_yearly) : 0

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border-2 bg-white p-6 transition-all ${
                  plan.highlight ? 'border-coral shadow-xl' : 'border-night/8'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-4 py-1 text-xs font-bold text-white">
                    Le plus complet
                  </div>
                )}

                <div className="mb-5">
                  <h2 className="text-xl font-bold text-night">{plan.label}</h2>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-3xl font-bold text-night">{formatXPF(monthlyEquivalent)}</span>
                    <span className="mb-1 text-sm text-night/40">/mois</span>
                  </div>
                  {billing === 'yearly' && (
                    <p className="mt-1 text-xs font-medium text-emerald-600">
                      {formatXPF(price)}/an - {planSavings}% d&apos;économie
                    </p>
                  )}
                </div>

                <ul className="mb-6 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-night/70">
                      <Check size={15} className="mt-0.5 shrink-0 text-coral" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    void trackEvent('subscription_cta_click', {
                      plan_id: plan.id,
                      billing_period: billing,
                      provider,
                    })
                    void initiateSubscription({
                      plan_id: plan.id,
                      billing_period: billing,
                      provider,
                    })
                  }}
                  disabled={loading}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 ${
                    plan.highlight ? 'bg-coral text-white hover:bg-coral-dark' : 'bg-night text-white hover:bg-night/80'
                  }`}
                >
                  {loading ? 'Redirection...' : 'Commencer l\'essai gratuit'}
                </button>

                <div className="mt-3 rounded-2xl bg-sand px-3 py-2 text-center text-[11px] text-night/65">
                  <p>14 jours gratuits, sans débit immédiat.</p>
                  <p className="mt-0.5">
                    Renouvellement automatique après l&apos;essai, au tarif de{' '}
                    {billing === 'monthly' ? formatXPF(price) : `${formatXPF(price)} / an`}.
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-3xl border border-night/8 bg-white p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-night/35">Comparatif</p>
              <h2 className="text-2xl font-bold text-night">Pro vs Pro+</h2>
            </div>
            <p className="max-w-2xl text-sm text-night/50">
              Le tableau ci-dessous met en avant les différences utiles pour choisir rapidement.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-night/8 text-night/45">
                <tr>
                  <th className="py-3 pr-4 font-medium">Fonctionnalité</th>
                  <th className="py-3 pr-4 font-medium">Pro</th>
                  <th className="py-3 pr-4 font-medium">Pro+</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Annonces actives', '5', '25'],
                  ['Vitrine', 'Professionnelle', 'Premium + prioritaire'],
                  ['Boosts inclus', 'A la carte', '3 offerts / mois'],
                  ['Bon plan offert', 'Non', '1 bon plan 3 jours / mois'],
                  ['Support', 'Email prioritaire', 'Téléphone prioritaire'],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-night/5 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-night">{row[0]}</td>
                    <td className="py-3 pr-4 text-night/70">{row[1]}</td>
                    <td className="py-3 pr-4 text-night/70">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-night/55">
          Besoin d&apos;un détail avant de vous lancer ?{' '}
          <Link href="/contact" className="font-semibold text-coral hover:underline">
            Contactez-nous
          </Link>
        </div>
      </div>
    </div>
  )
}
