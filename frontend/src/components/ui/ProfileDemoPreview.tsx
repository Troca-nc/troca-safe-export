'use client'

import Link from 'next/link'
import {
  BadgeCheck,
  Heart,
  Megaphone,
  MessageCircle,
  Package,
  Plus,
  Settings,
  ShieldCheck,
  Store,
  UsersRound,
} from 'lucide-react'
import { useAuthStore, type DemoProfileKey } from '@/store/authStore'
import { inferDemoAccount } from '@/lib/demoApi'

type PreviewMode = 'deposit' | 'account'

const PROFILE_CONFIG: Record<
  Exclude<DemoProfileKey, 'visitor'>,
  {
    title: string
    subtitle: string
    accent: string
    badge: string
    depositLabel: string
    accountLabel: string
    accountHint: string
  }
> = {
  particulier: {
    title: 'Particulier',
    subtitle: 'D�pose une annonce simple et rapide',
    accent: 'from-coral/20 to-[var(--color-surface)]',
    badge: 'D�poser une annonce',
    depositLabel: 'Annonce classique',
    accountLabel: 'Mon compte particulier',
    accountHint: 'Publier, suivre les messages et garder ses favoris.',
  },
  pro: {
    title: 'Compte Pro',
    subtitle: 'Gestion du catalogue, statistiques et visibilit�',
    accent: 'from-ocean/20 to-[var(--color-surface)]',
    badge: 'Espace vendeur pro',
    depositLabel: 'Vitrine professionnelle',
    accountLabel: 'Tableau de bord pro',
    accountHint: 'Voir les vues, les favoris, les boosts et les abonnements.',
  },
  bon_plan: {
    title: 'Annonceur Bon Plan',
    subtitle: 'Promo, �v�nement ou mise en avant locale',
    accent: 'from-lagoon/20 to-[var(--color-surface)]',
    badge: 'Bon plan sponsoris�',
    depositLabel: 'Contenu sponsoris�',
    accountLabel: 'Espace bon plan',
    accountHint: 'Programmer une promo, suivre la visibilit� et la diffusion.',
  },
}

const ACCOUNT_ITEMS = [
  { icon: Package, label: 'Mes annonces', href: '/profil?tab=listings' },
  { icon: Heart, label: 'Favoris', href: '/favoris' },
  { icon: MessageCircle, label: 'Messages', href: '/messages' },
  { icon: Settings, label: 'Param�tres', href: '/parametres' },
]

const PROFILE_LABELS: Record<Exclude<DemoProfileKey, 'visitor'>, string> = {
  particulier: 'Profil particulier actif',
  pro: 'Profil compte pro actif',
  bon_plan: 'Profil annonceur bon plan actif',
}

export default function ProfileDemoPreview({
  mode,
  profile,
}: {
  mode: PreviewMode
  profile?: DemoProfileKey | null
}) {
  const { demoProfile, user } = useAuthStore()
  const inferredProfile = inferDemoAccount(user?.email)
  const activeProfile = profile ?? demoProfile ?? inferredProfile ?? 'visitor'

  if (activeProfile === 'visitor') {
    return (
      <div className="rounded-[1.5rem] border border-night/10 bg-white dark:bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-night/5 text-night/60">
            <UsersRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-night">Choisissez un profil pour voir l'aper�u.</p>
            <p className="text-sm text-night/60">
              Choisissez un profil d�mo dans le header pour voir la publication et le compte comme un vrai utilisateur.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const config = PROFILE_CONFIG[activeProfile]
  const profileLabel = PROFILE_LABELS[activeProfile]
  const accountStats =
    activeProfile === 'particulier'
      ? [
          { value: '0', label: 'annonces' },
          { value: '', label: 'note' },
          { value: '0', label: 'messages' },
        ]
      : activeProfile === 'pro'
        ? [
            { value: '0', label: 'annonces' },
            { value: '', label: 'vues' },
            { value: '0', label: 'avis' },
          ]
        : [
            { value: '0', label: 'campagnes' },
            { value: '', label: 'diffusions' },
            { value: '0', label: 'clics' },
          ]

  return (
    <div className={`rounded-[1.75rem] border border-night/10 bg-gradient-to-br ${config.accent} p-5 shadow-[0_20px_70px_rgba(8,32,50,0.08)]`}>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/75 dark:bg-[var(--color-surface)] px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-night text-white shadow-sm">
            <BadgeCheck className="h-4 w-4" />
          </span>
          <div>
                        {/* Profil actif supprim� pour garder le contexte */}
            <p className="text-sm font-semibold text-night">{profileLabel}</p>
          </div>
        </div>
        <span className="rounded-full bg-night/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-night/65">
          {config.title}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">{config.badge}</p>
          <h3 className="mt-1 text-xl font-bold text-night">{config.title}</h3>
          <p className="text-sm text-night/60">{config.subtitle}</p>
        </div>
        <span className="rounded-full border border-night/10 bg-white dark:bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-night/70">
          {mode === 'deposit' ? 'Comment votre annonce appara�t' : 'Votre espace personnel'}
        </span>
      </div>

      {mode === 'deposit' ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/70 bg-white/90 dark:bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-night">
              <Plus className="h-4 w-4 text-coral" />
              {config.depositLabel}
            </div>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm text-night/70">Titre de l'annonce</div>
              <div className="rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm text-night/70">Prix et n�gociation</div>
              <div className="rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm text-night/70">Commune / province</div>
              <div className="rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm text-night/70">Photos + description</div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/90 dark:bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-night">{config.accountLabel}</p>
            <p className="mt-1 text-sm text-night/60">{config.accountHint}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-coral/5 px-3 py-2 text-sm text-night">
                <ShieldCheck className="h-4 w-4 text-coral" />
                {activeProfile === 'bon_plan' ? 'Mention sponsoris�e obligatoire' : 'V�rification du compte recommand�e'}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-night/5 px-3 py-2 text-sm text-night">
                <Megaphone className="h-4 w-4 text-night/55" />
                {activeProfile === 'pro' ? 'Boost et mise en avant visibles' : 'Diffusion standard sur Kalico'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-white/70 bg-white/90 dark:bg-[var(--color-surface)] p-4">
              <p className="text-sm font-semibold text-night">{config.accountLabel}</p>
              <p className="mt-1 text-sm text-night/60">{config.accountHint}</p>
              <div className="mt-4 space-y-2">
                {ACCOUNT_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm text-night/80 transition hover:-translate-y-0.5 hover:border-coral/20 hover:bg-coral/5 focus:outline-none focus:ring-2 focus:ring-coral/30"
                    >
                      <Icon className="h-4 w-4 text-coral" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/90 dark:bg-[var(--color-surface)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-night">
                <Store className="h-4 w-4 text-coral" />
                Vue rapide du compte
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {accountStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-coral/5 p-3">
                    <p className="text-lg font-bold text-night">{stat.value}</p>
                    <p className="text-xs text-night/55">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {ACCOUNT_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-full bg-night/5 px-3 py-1 text-xs font-semibold text-night/70 transition hover:bg-coral/10 hover:text-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {activeProfile === 'particulier' ? (
            <div className="mt-4 rounded-2xl border border-night/10 bg-white dark:bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-night">Vous n'avez pas encore d'annonce. Publiez la v�tre.</p>
                  <p className="mt-1 text-sm text-night/60">
                    Votre compte particulier n&apos;a pas encore d&apos;annonce active. Le bouton ci-dessous vous envoie directement vers la page de publication.
                  </p>
                </div>
                <Link href="/annonces/nouvelle" className="btn-primary px-4 py-2 text-sm">
                  D�poser une annonce
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {[
                activeProfile === 'bon_plan'
                  ? { title: 'Campagne � cr�er', meta: 'Programmez votre premi�re mise en avant.' }
                  : { title: 'Annonce � publier', meta: 'Pr�parez votre premi�re publication.' },
                activeProfile === 'bon_plan'
                  ? { title: 'Diffusion en attente', meta: 'Le contenu sponsoris� sera visible ici.' }
                  : { title: 'Message � traiter', meta: 'Les �changes safficheront ici.' },
                activeProfile === 'bon_plan'
                  ? { title: 'Statistiques � suivre', meta: 'Suivi de visibilit� et clics.' }
                  : { title: 'Param�tres � compl�ter', meta: 'Retrouvez vos pr�f�rences ici.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-night/10 bg-white dark:bg-[var(--color-surface)] p-4 shadow-sm">
                  <p className="text-sm font-semibold text-night">{item.title}</p>
                  <p className="mt-1 text-sm text-night/60">{item.meta}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
