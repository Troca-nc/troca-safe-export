// src/app/pro/page.tsx

'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Loader2,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { PaymentProviderSelector } from '@/components/monetisation/PaymentProviderSelector'
import { useSubscription } from '@/hooks/usePayment'
import { trackEvent } from '@/lib/analytics'
import { PRO_PLANS, formatXPF } from '@/types/monetisation.types'
import type { BillingPeriod, PaymentProvider } from '@/types/monetisation.types'

type BonPlanOffer = {
  title: string
  price: string
  duration: string
  audience: string
  bullets: string[]
  tone: string
  cta: string
}

const BON_PLAN_OFFERS: BonPlanOffer[] = [
  {
    title: 'Bon plan particulier',
    price: '290 XPF',
    duration: '3 jours',
    audience: 'Petite promo, brocante, concert local, vide-dressing, association.',
    bullets: ['Publication simple', 'Visible dans la section Bon plan', 'Parfait pour tester une idee'],
    tone: 'border-ocean/20 bg-ocean/5',
    cta: 'Publier un bon plan',
  },
  {
    title: 'Bon plan pro',
    price: '990 XPF',
    duration: '3 jours',
    audience: 'Magasin, restaurant, event local, animation commerciale, offre a duree courte.',
    bullets: ['Badge sponsorise', 'Ciblage local', 'Diffusion plus visible que le particulier'],
    tone: 'border-coral/20 bg-coral/5',
    cta: 'Publier en pro',
  },
  {
    title: 'Bon plan pro',
    price: '1 990 XPF',
    duration: '7 jours',
    audience: 'Pour une campagne un peu plus longue ou un lancement local.',
    bullets: ['Visibilite 7 jours', 'Plus de temps pour convertir', 'Ideal pour une promo hebdo'],
    tone: 'border-jungle/20 bg-jungle/5',
    cta: 'Voir les details',
  },
]

const COMPARISON_ROWS = [
  ['Particulier', '0 XPF', '5 actives', 'Basique', 'Non', 'Non'],
  ['Pro Essentiel', '3 900 XPF / mois', '5 actives', 'Pro', 'Oui', 'A la carte'],
  ['Pro Plus', '7 900 XPF / mois', '25 actives', 'Premium', 'Oui + priorite', '1 offert / mois'],
]

function BillingToggle({
  value,
  onChange,
}: {
  value: BillingPeriod
  onChange: (v: BillingPeriod) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-sand p-1">
      {(['monthly', 'yearly'] as BillingPeriod[]).map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            value === period ? 'bg-white text-night shadow-sm' : 'text-night/50 hover:text-night'
          }`}
        >
          {period === 'monthly' ? 'Mensuel' : (
            <span className="flex items-center gap-1.5">
              Annuel
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                -17%
              </span>
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default function ProPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const [provider, setProvider] = useState<PaymentProvider>('stripe')
  const { initiateSubscription, loading, error } = useSubscription()

  return (
    <div className="min-h-screen bg-sand-light">
      <div className="bg-night px-4 py-16 text-center text-white">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral/20 px-3 py-1.5 text-xs font-medium text-coral">
          <Star size={12} /> Offre professionnelle
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight">
          Developpez votre activite
          <br />
          sur Troca
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/65">
          Publiez plus, gagnez en visibilite et suivez vos resultats.
          Les particuliers restent simples, les pros disposent d&apos;un vrai tableau de bord, et
          les Pro Plus beneficient d&apos;un bon plan offert chaque mois.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/45">
          <span className="flex items-center gap-1"><ShieldCheck size={12} /> Essai gratuit 14 jours</span>
          <span className="flex items-center gap-1"><Check size={12} /> Sans engagement</span>
          <span className="flex items-center gap-1"><Zap size={12} /> Activation immediate</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex justify-center">
          <BillingToggle value={billing} onChange={setBilling} />
        </div>

        <div className="mb-8 rounded-3xl border border-jungle/25 bg-jungle/6 p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-jungle/70">Réassurance immédiate</p>
              <h2 className="mt-1 text-xl font-bold text-night">Aucun débit pendant 14 jours, annulation à tout moment</h2>
            </div>
            <p className="max-w-2xl text-sm text-night/65">
              Vous choisissez une offre, vous êtes redirigé vers un checkout sécurisé, puis l’essai démarre.
              Le renouvellement n’intervient qu’après l’essai, et tout reste visible dans vos paramètres.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-night/65">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">Débit après l&apos;essai seulement</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">Annulation en 2 clics</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">Factures accessibles</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PRO_PLANS.map((plan) => {
            const price = billing === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12)

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
                    <span className="text-3xl font-bold text-night">{formatXPF(price)}</span>
                    <span className="mb-1 text-sm text-night/40">/mois</span>
                  </div>
                  {billing === 'yearly' && (
                    <p className="mt-1 text-xs font-medium text-emerald-600">
                      {formatXPF(plan.price_yearly)}/an - {plan.savings_pct}% d&apos;economie
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
                    void trackEvent('pro_cta_click', {
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
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Redirection...</> : 'Commencer l\'essai gratuit'}
                </button>

                <div className="mt-3 rounded-2xl bg-sand px-3 py-2 text-center text-[11px] text-night/65">
                  <p>14 jours gratuits, sans débit immédiat.</p>
                  <p className="mt-0.5">
                    Renouvellement automatique après l&apos;essai, au tarif de{' '}
                    {billing === 'monthly' ? formatXPF(price) : `${formatXPF(plan.price_yearly)} / an`}.
                    Résiliation possible à tout moment depuis vos paramètres.
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-3xl border border-night/8 bg-white p-6">
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-night/35">Paiement sécurisé</p>
                <h2 className="text-lg font-bold text-night">Changer de moyen de paiement</h2>
              </div>
              <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
                Stripe / PayPlug
              </span>
            </summary>
            <div className="mt-4">
              <p className="text-sm text-night/60">
                Le moyen de paiement est secondaire. Vous pouvez rester sur Stripe, ou choisir PayPlug si vous préférez une carte locale.
                Le choix se fera au moment du checkout sécurisé.
              </p>
              <PaymentProviderSelector value={provider} onChange={setProvider} className="mt-4" />
            </div>
          </details>
        </div>

        <div className="mt-10 rounded-3xl border border-night/8 bg-white p-6">
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-night/35">Comparatif</p>
                <h2 className="text-2xl font-bold text-night">Ce que chaque offre comprend</h2>
              </div>
              <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
                Voir / masquer
              </span>
            </summary>

            <div className="mt-4">
              <p className="max-w-2xl text-sm text-night/50">
                Le gratuit reste accessible, mais les offres Pro debloquent la visibilite et le volume.
                Pro Plus ajoute un bon plan offert chaque mois.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-night/8 text-night/45">
                    <tr>
                      <th className="py-3 pr-4 font-medium">Offre</th>
                      <th className="py-3 pr-4 font-medium">Prix</th>
                      <th className="py-3 pr-4 font-medium">Annonces</th>
                      <th className="py-3 pr-4 font-medium">Vitrine</th>
                      <th className="py-3 pr-4 font-medium">Boosts</th>
                      <th className="py-3 pr-4 font-medium">Bon plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row[0]} className="border-b border-night/5 last:border-0">
                        {row.map((cell, index) => (
                          <td key={cell} className={`py-3 pr-4 ${index === 0 ? 'font-semibold text-night' : 'text-night/70'}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        </div>

        <div className="mt-14 rounded-3xl border border-night/8 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-night/35">FAQ paiement</p>
              <h2 className="text-2xl font-bold text-night">Les réponses avant de payer</h2>
            </div>
            <p className="max-w-2xl text-sm text-night/50">
              Le but est de lever les derniers doutes avant le checkout, sans alourdir la page.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                q: 'Quand serai-je débité ?',
                a: 'Après les 14 jours d’essai seulement, et uniquement si vous gardez l’abonnement actif.',
              },
              {
                q: 'Puis-je annuler facilement ?',
                a: 'Oui, à tout moment depuis Paramètres. Vous gardez l’accès jusqu’à la fin de la période en cours.',
              },
              {
                q: 'Où retrouver mes paiements ?',
                a: 'Dans Paramètres > Mes factures, avec l’historique des factures, reçus et remboursements.',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl bg-sand p-4">
                <p className="text-sm font-semibold text-night">{item.q}</p>
                <p className="mt-2 text-sm text-night/65 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-night/10 pt-12">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-night/35">Bon plans locaux</p>
              <h2 className="text-2xl font-bold text-night">Produit à part, pas un simple upsell</h2>
            </div>
            <p className="max-w-2xl text-sm text-night/50">
              Un bon plan doit rester simple a publier. Les particuliers paient peu, les pros un peu plus,
              et Pro Plus recoit 1 bon plan visible 3 jours offert chaque mois.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {BON_PLAN_OFFERS.map((offer, index) => (
              <div key={offer.title + offer.duration} className={`rounded-3xl border p-5 bg-white ${offer.tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-night/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-night/60">
                      <Sparkles size={12} />
                      Bon plan
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-night">{offer.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-night/55">{offer.audience}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70">
                    {index === 0 ? <TrendingUp size={18} /> : index === 1 ? <Megaphone size={18} /> : <Star size={18} />}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-night">{offer.price}</span>
                    <span className="mb-1 text-sm text-night/40">/ {offer.duration}</span>
                  </div>
                </div>

                <ul className="mt-4 space-y-2">
                  {offer.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-night/70">
                      <Check size={15} className="mt-0.5 shrink-0 text-coral" />
                      {bullet}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-night/10 bg-night/[0.03] px-4 py-3 text-sm font-semibold text-night hover:bg-night/[0.06]"
                >
                  {offer.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-3xl border border-jungle/20 bg-jungle/5 p-5 text-sm text-night/75">
            <p className="font-semibold text-night">Avantage Pro Plus</p>
            <p className="mt-1">
              Chaque compte Pro Plus comprend <strong>1 bon plan visible 3 jours offert par mois</strong>.
              C&apos;est ideal pour mettre en avant une promo, une ouverture ou un petit evenement sans surcout.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-night/8 bg-white p-6">
          <div className="mb-4">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-night/35">Demarche</p>
            <h2 className="text-2xl font-bold text-night">Comment publier un bon plan</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              'Choisissez Bon plan depuis le menu de publication.',
              'Indiquez le titre, la date, le lieu et la description courte.',
              'Selectionnez particulier ou pro et la duree voulue.',
              'Validez, puis la moderation publie votre bon plan.',
            ].map((step, idx) => (
              <div key={step} className="rounded-2xl bg-sand p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-night/35">Etape {idx + 1}</p>
                <p className="mt-2 text-sm text-night/70">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-night/8 bg-white p-6">
          <h3 className="mb-4 font-semibold text-night">Questions frequentes</h3>
          <div className="space-y-4 text-sm text-night/70">
            <div>
              <p className="font-medium text-night">Puis-je annuler a tout moment ?</p>
              <p className="mt-1 text-xs text-night/50">
                Oui. Votre acces Pro reste actif jusqu&apos;a la fin de la periode payee.
              </p>
            </div>
            <div>
              <p className="font-medium text-night">L&apos;essai gratuit demande-t-il une carte ?</p>
              <p className="mt-1 text-xs text-night/50">
                Oui, pour valider le lancement de l&apos;essai et simplifier la conversion ensuite.
              </p>
            </div>
            <div>
              <p className="font-medium text-night">Quelle difference entre Stripe et PayPlug ?</p>
              <p className="mt-1 text-xs text-night/50">
                Stripe pour les cartes internationales, PayPlug pour les cartes locales en Nouvelle-Caledonie.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
