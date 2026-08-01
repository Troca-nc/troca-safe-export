'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Wrench,
} from 'lucide-react'

import DemoModeNotice from '@/components/DemoModeNotice'
import { PaymentProviderSelector } from '@/components/monetisation/PaymentProviderSelector'
import { useSubscription } from '@/hooks/usePayment'
import { trackEvent } from '@/lib/analytics'
import { PRO_PLANS, type BillingPeriod, type PaymentProvider } from '@/types/monetisation.types'

const PRO_PLAN = PRO_PLANS[0]

const BOOST_PRICING = [
  { label: '3 jours', standardXpf: 500, proXpf: 400 },
  { label: '7 jours', standardXpf: 900, proXpf: 720 },
  { label: '14 jours', standardXpf: 1500, proXpf: 1200 },
  { label: '30 jours', standardXpf: 2500, proXpf: 2000 },
]

const METIER_CARDS = [
  {
    id: 'artisans',
    title: 'Artisans et BTP',
    description: 'Devis, chantiers et clientèle locale. Tout depuis votre espace pro.',
    Icon: Wrench,
    details: [
      {
        title: 'Devis PDF',
        description: 'Créez et envoyez des devis professionnels en XPF avec TGC intégrée. Le client signe en ligne.',
      },
      {
        title: 'Appels d\'offres',
        description: 'Recevez des demandes de particuliers qui cherchent un artisan dans votre commune. Répondez en 2 clics.',
      },
      {
        title: 'Réservations',
        description: 'Vos clients réservent un créneau directement depuis votre vitrine. Vous confirmez ou proposez une autre date.',
      },
      {
        title: 'Vitrine Pro',
        description: 'Une page à votre nom avec vos réalisations, avis clients et coordonnées. Visible dans l\'annuaire des pros.',
      },
      {
        title: 'Documents',
        description: 'Déposez vos justificatifs pour obtenir le badge Pro vérifié.',
      },
    ],
  },
  {
    id: 'transport',
    title: 'Transport et livraison',
    description: 'Courses, colis et fret entre communes. Gérez tout depuis un tableau de bord.',
    Icon: Truck,
    details: [
      {
        title: 'Transport Pro',
        description: 'Proposez vos services de transport, recevez des demandes et confirmez les courses depuis votre dashboard.',
      },
      {
        title: 'Livraison de colis',
        description: 'Gérez les demandes de livraison, soumettez une offre et suivez chaque remise jusqu\'à la confirmation.',
      },
      {
        title: 'Fret',
        description: 'Répondez aux demandes de fret professionnel entre communes ou vers les îles. Devis intégré, suivi de livraison.',
      },
      {
        title: 'Devis automatisé',
        description: 'Le client décrit son besoin, vous recevez une notification et répondez avec votre tarif en quelques secondes.',
      },
    ],
  },
  {
    id: 'boutique',
    title: 'Commerçants et boutiques',
    description: 'Votre boutique en ligne locale avec catalogue, promos et visibilité boostée.',
    Icon: ShoppingBag,
    details: [
      {
        title: 'Catalogue produits',
        description: 'Publiez vos produits avec photos, prix et stock. Visibles sur votre vitrine et dans les recherches Kalico.',
      },
      {
        title: 'Bons plans sponsorisés',
        description: 'Créez une offre promotionnelle visible sur la home Kalico et dans la section Bons Plans.',
      },
      {
        title: 'Campagnes',
        description: 'Achetez un emplacement publicitaire sur la home ou dans une catégorie pour une durée définie.',
      },
      {
        title: 'Coupons',
        description: 'Générez des codes promo pour vos clients réguliers ou vos campagnes de fidélisation.',
      },
      {
        title: 'Import produits',
        description: 'Importez votre catalogue depuis un fichier CSV ou Excel en quelques clics.',
      },
    ],
  },
  {
    id: 'culture',
    title: 'Événementiel et culture',
    description: 'Concerts, marchés, conférences. Touchez toute la NC avec une visibilité locale forte.',
    Icon: Calendar,
    details: [
      {
        title: 'Événements',
        description: 'Publiez votre événement dans l\'agenda Kalico visible par toute la Nouvelle-Calédonie.',
      },
      {
        title: 'Billetterie avec QR code',
        description: 'Vendez vos billets en ligne avec paiement intégré. Chaque billet génère un QR code scannable à l\'entrée.',
      },
      {
        title: 'Campagne homepage',
        description: 'Mettez votre événement en avant sur la page d\'accueil Kalico pendant la période de votre choix.',
      },
      {
        title: 'Bons plans culturels',
        description: 'Publiez vos réductions et offres spéciales dans la section Bons Plans.',
      },
    ],
  },
  {
    id: 'transversal',
    title: 'Tous les pros',
    description: 'Les outils transversaux qui font la différence au quotidien.',
    Icon: BarChart2,
    details: [
      {
        title: 'Tableau de bord',
        description: 'Suivez vos vues, contacts, conversions et performances en temps réel.',
      },
      {
        title: 'Réponse automatique',
        description: 'Configurez un message envoyé automatiquement à chaque nouveau contact. Ne ratez plus aucune opportunité.',
      },
      {
        title: 'Statistiques avancées',
        description: 'Analysez les performances de vos annonces et campagnes pour optimiser votre visibilité.',
      },
      {
        title: 'Parrainage Pro',
        description: 'Recommandez Kalico Pro à d\'autres professionnels et bénéficiez d\'avantages pour chaque parrainage.',
      },
      {
        title: 'Import de données',
        description: 'Importez vos contacts, produits ou annonces depuis un fichier externe pour démarrer plus vite.',
      },
    ],
  },
] as const

const FREE_FEATURES = [
  '5 annonces actives',
  '6 photos par annonce',
  'Chat intégré',
  'Boosts à l\'acte',
  'Vérification téléphone',
]

const PRO_FEATURES = [
  'Annonces illimitées',
  '12 photos par annonce',
  'Vitrine et catalogue',
  'Devis PDF',
  'Réservations',
  'Fret et livraison',
  'Billetterie',
  'Campagnes',
  'Statistiques',
  'Boosts -20%',
  'Réponse auto',
  'Badge Pro vérifié',
]

const BOOST_FEATURES = [
  'Boost à la une',
  'Badge urgent',
  'Photos supplémentaires',
  'Disponible pour particuliers et pros',
]

const WHY_PRO_ITEMS = [
  {
    icon: TrendingUp,
    title: 'Plus de visibilité',
    description: 'Vos annonces remontent et votre vitrine apparaît dans l\'annuaire des pros.',
  },
  {
    icon: FileText,
    title: 'Moins d\'allers-retours',
    description: 'Devis, réservations et messages au même endroit.',
  },
  {
    icon: Shield,
    title: 'Un badge qui inspire confiance',
    description: 'Le badge Pro vérifié rassure vos clients avant même le premier contact.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'Qui est Pro pour vous ?',
    a: 'Les professionnels qui publient souvent, gèrent plusieurs annonces ou veulent des outils de visibilité et de statistiques.',
  },
  {
    q: 'Puis-je annuler ?',
    a: 'Oui, vous pouvez résilier à tout moment depuis votre espace client. L\'accès reste actif jusqu\'à la fin de la période en cours.',
  },
  {
    q: 'Quels moyens de paiement ?',
    a: 'Carte internationale via Stripe ou carte OPT-NC et réseau local via PayPlug.',
  },
] as const

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

function DetailPoint({ title, description }: { title: string; description: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-white/70 p-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
      <div>
        <p className="font-medium text-night">{title}</p>
        <p className="text-sm text-night/60">{description}</p>
      </div>
    </li>
  )
}

function MetierCard({
  item,
  open,
  onToggle,
}: {
  item: (typeof METIER_CARDS)[number]
  open: boolean
  onToggle: (id: string) => void
}) {
  const Icon = item.Icon

  return (
    <article
      className={`rounded-[12px] border bg-[var(--color-surface)] p-5 transition-all duration-300 ease-out ${
        open ? 'border-[var(--color-border-strong)] shadow-md' : 'border-[var(--color-border)] shadow-sm'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 text-left"
      >
        <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral/10 text-coral">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold text-night">{item.title}</span>
          <span className="mt-1 block text-sm leading-6 text-night/60">{item.description}</span>
        </span>
        <ArrowRight className={`mt-1 h-4 w-4 shrink-0 text-night/35 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          open ? 'mt-4 max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <ul className="grid gap-3 md:grid-cols-2">
          {item.details.map((detail) => (
            <DetailPoint key={detail.title} title={detail.title} description={detail.description} />
          ))}
        </ul>
      </div>
    </article>
  )
}

export default function AbonnementPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const [provider, setProvider] = useState<PaymentProvider>('stripe')
  const [openMetierId, setOpenMetierId] = useState<string | null>(null)
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
    <div className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <section className="bg-night px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral/20 px-3 py-1.5 text-xs font-medium text-coral">
            <TrendingUp size={12} />
            Développez votre activité sur Kalico
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
              <ShieldCheck size={12} />
              Paiement sécurisé
            </span>
            <span className="flex items-center gap-1">
              <Check size={12} />
              Résiliation à tout moment
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1 text-sm text-night/50 transition-colors hover:text-night"
        >
          <ArrowLeft size={14} />
          Retour à l'accueil
        </Link>

        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
                Comment payer ?
              </p>
              <h2 className="mt-1 text-2xl font-bold text-night">Choisissez votre rythme</h2>
              <p className="mt-1 max-w-2xl text-sm text-night/60">
                Stripe pour les cartes internationales. PayPlug pour les cartes OPT-NC et le
                réseau local.
              </p>
            </div>

            <div className="inline-flex items-center gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1">
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

          <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <PaymentProviderSelector
              value={provider}
              onChange={setProvider}
              className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5"
            />
            <DemoModeNotice className="mt-4" />
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral/80">
              Fait pour votre métier
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night md:text-3xl">
              Fait pour votre métier
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-night/60">
              Cliquez sur votre secteur pour voir ce que le Pro change concrètement.
            </p>
          </div>

          <div className="space-y-4">
            {METIER_CARDS.map((item) => (
              <MetierCard
                key={item.id}
                item={item}
                open={openMetierId === item.id}
                onToggle={(id) => setOpenMetierId((current) => (current === id ? null : id))}
              />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral/80">
                Choisissez votre formule
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night md:text-3xl">
                Choisissez votre formule
              </h2>
            </div>
            <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-night/55">
              Tarif standard / Tarif Pro
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <article className="flex h-full flex-col rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
                Pour démarrer
              </p>
              <h3 className="mt-2 text-2xl font-bold text-night">Gratuit</h3>
              <p className="mt-2 text-sm leading-6 text-night/60">
                Ouvrez votre compte et publiez vos premières annonces sans frais.
              </p>
              <div className="mt-4 rounded-2xl bg-[var(--color-surface-raised)] p-4">
                <div className="text-3xl font-bold text-night">0 XPF</div>
                <div className="text-xs text-night/45">Toujours gratuit</div>
              </div>
              <ul className="mt-6 space-y-3">
                {FREE_FEATURES.map((feature) => (
                  <PlanFeature key={feature} enabled text={feature} />
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <Link
                  href="/inscription"
                  className="btn-secondary flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold"
                >
                  Créer un compte gratuit
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>

            <article className="relative flex h-full flex-col rounded-[2rem] border-2 border-coral bg-[var(--color-surface)] p-6 shadow-xl ring-2 ring-coral/10 lg:scale-[1.02]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-4 py-1 text-xs font-bold text-white shadow">
                Recommandé
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">Pro</p>
              <h3 className="mt-2 text-2xl font-bold text-night">Développez votre activité</h3>
              <p className="mt-2 text-sm leading-6 text-night/60">
                Le meilleur choix pour les professionnels qui veulent plus de volume, plus de
                photos et moins de frais sur les boosts.
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
                {PRO_FEATURES.map((feature) => (
                  <PlanFeature key={feature} enabled text={feature} />
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold disabled:opacity-60"
                >
                  {loading
                    ? 'Redirection...'
                    : hasStripeConfigured
                      ? 'Commencer l\'essai 14 jours'
                      : 'Choisir le plan Pro'}
                  {!loading ? <ArrowRight size={16} /> : null}
                </button>
              </div>
            </article>

            <article className="flex h-full flex-col rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-night/35">
                À la carte
              </p>
              <h3 className="mt-2 text-2xl font-bold text-night">Boosts</h3>
              <p className="mt-2 text-sm leading-6 text-night/60">
                Les boosts restent disponibles pour tous les utilisateurs. Les abonnés Pro paient
                moins cher.
              </p>
              <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
                <div className="text-sm font-semibold text-night">Tarif standard / Tarif Pro</div>
                <div className="mt-3 space-y-3">
                  {BOOST_PRICING.map((boost) => (
                    <div key={boost.label} className="rounded-2xl bg-white/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-night">{boost.label}</span>
                        <span className="rounded-full bg-[var(--color-success)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-success)]">
                          Pro
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between gap-3">
                        <div className="text-xs text-night/45 line-through">
                          {boost.standardXpf.toLocaleString('fr-FR')} XPF
                        </div>
                        <div className="text-sm font-semibold text-[var(--color-success)]">
                          {boost.proXpf.toLocaleString('fr-FR')} XPF
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <ul className="mt-6 space-y-3">
                {BOOST_FEATURES.map((feature) => (
                  <PlanFeature key={feature} enabled text={feature} />
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <Link
                  href="/boosts"
                  className="btn-secondary flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold"
                >
                  Voir les boosts
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral/80">
                Pourquoi Pro ?
              </p>
              <h2 className="mt-1 text-2xl font-bold text-night md:text-3xl">
                Un usage pro, un revenu récurrent
              </h2>
            </div>
            <p className="max-w-2xl text-sm text-night/55">
              Le compte gratuit suffit pour démarrer. Le Pro accompagne ceux qui veulent aller
              plus loin. Les boosts restent accessibles à tous.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {WHY_PRO_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-2xl bg-[var(--color-surface-raised)] p-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-night">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-night/65">{item.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-night">FAQ</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {FAQ_ITEMS.map((item) => (
              <article key={item.q} className="rounded-2xl bg-[var(--color-surface-raised)] p-4">
                <h3 className="font-semibold text-night">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-night/65">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
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
