'use client'

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
    subtitle: 'Dépose une annonce simple et rapide',
    accent: 'from-coral/20 to-white',
    badge: 'Déposer une annonce',
    depositLabel: 'Annonce classique',
    accountLabel: 'Mon compte particulier',
    accountHint: 'Publier, suivre les messages et garder ses favoris.',
  },
  pro: {
    title: 'Compte Pro',
    subtitle: 'Gestion du catalogue, statistiques et visibilité',
    accent: 'from-ocean/20 to-white',
    badge: 'Espace vendeur pro',
    depositLabel: 'Vitrine professionnelle',
    accountLabel: 'Tableau de bord pro',
    accountHint: 'Voir les vues, les favoris, les boosts et les abonnements.',
  },
  bon_plan: {
    title: 'Annonceur Bon Plan',
    subtitle: 'Promo, événement ou mise en avant locale',
    accent: 'from-lagoon/20 to-white',
    badge: 'Bon plan sponsorisé',
    depositLabel: 'Contenu sponsorisé',
    accountLabel: 'Espace bon plan',
    accountHint: 'Programmer une promo, suivre la visibilité et la diffusion.',
  },
}

const ACCOUNT_ITEMS = [
  { icon: Package, label: 'Mes annonces' },
  { icon: Heart, label: 'Favoris' },
  { icon: MessageCircle, label: 'Messages' },
  { icon: Settings, label: 'Paramètres' },
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
      <div className="rounded-[1.5rem] border border-night/10 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-night/5 text-night/60">
            <UsersRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-night">Mode visiteur</p>
            <p className="text-sm text-night/60">
              Choisissez un profil démo dans le header pour voir la publication et le compte comme un vrai utilisateur.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const config = PROFILE_CONFIG[activeProfile]
  const profileLabel = PROFILE_LABELS[activeProfile]

  return (
    <div className={`rounded-[1.75rem] border border-night/10 bg-gradient-to-br ${config.accent} p-5 shadow-[0_20px_70px_rgba(8,32,50,0.08)]`}>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-night text-white shadow-sm">
            <BadgeCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-night/50">Profil actif</p>
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
        <span className="rounded-full border border-night/10 bg-white px-3 py-1 text-xs font-semibold text-night/70">
          {mode === 'deposit' ? 'Aperçu publication' : 'Aperçu compte'}
        </span>
      </div>

      {mode === 'deposit' ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-night">
              <Plus className="h-4 w-4 text-coral" />
              {config.depositLabel}
            </div>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm text-night/70">Titre de l'annonce</div>
              <div className="rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm text-night/70">Prix et négociation</div>
              <div className="rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm text-night/70">Commune / province</div>
              <div className="rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm text-night/70">Photos + description</div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4">
            <p className="text-sm font-semibold text-night">{config.accountLabel}</p>
            <p className="mt-1 text-sm text-night/60">{config.accountHint}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-coral/5 px-3 py-2 text-sm text-night">
                <ShieldCheck className="h-4 w-4 text-coral" />
                {activeProfile === 'bon_plan' ? 'Mention sponsorisée obligatoire' : 'Vérification du compte recommandée'}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-night/5 px-3 py-2 text-sm text-night">
                <Megaphone className="h-4 w-4 text-night/55" />
                {activeProfile === 'pro' ? 'Boost et mise en avant visibles' : 'Diffusion standard sur Troca'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4">
            <p className="text-sm font-semibold text-night">{config.accountLabel}</p>
            <p className="mt-1 text-sm text-night/60">{config.accountHint}</p>
            <div className="mt-4 space-y-2">
              {ACCOUNT_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-night/10 bg-sand px-3 py-2 text-sm text-night/80">
                    <Icon className="h-4 w-4 text-coral" />
                    {item.label}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-night">
              <Store className="h-4 w-4 text-coral" />
              Vue rapide du compte
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-coral/5 p-3">
                <p className="text-lg font-bold text-night">12</p>
                <p className="text-xs text-night/55">annonces</p>
              </div>
              <div className="rounded-xl bg-lagoon/10 p-3">
                <p className="text-lg font-bold text-night">4.8</p>
                <p className="text-xs text-night/55">note moyenne</p>
              </div>
              <div className="rounded-xl bg-night/5 p-3">
                <p className="text-lg font-bold text-night">{activeProfile === 'bon_plan' ? '1' : '3'}</p>
                <p className="text-xs text-night/55">{activeProfile === 'bon_plan' ? 'campagne' : 'brouillons'}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-night/5 px-3 py-1 text-xs font-semibold text-night/70">Mes annonces</span>
              <span className="rounded-full bg-night/5 px-3 py-1 text-xs font-semibold text-night/70">Favoris</span>
              <span className="rounded-full bg-night/5 px-3 py-1 text-xs font-semibold text-night/70">Messages</span>
              <span className="rounded-full bg-night/5 px-3 py-1 text-xs font-semibold text-night/70">Paramètres</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
