'use client'
// src/app/profil/page.tsx  (mon profil)
// src/app/profil/[id]/page.tsx  (profil public)

import { Suspense, useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  BadgeCheck, MapPin, Calendar, Shield, CheckCircle2,
  Edit3, Save, X, Package, MessageCircle, Heart, AlertTriangle, Clock3, CreditCard
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Header from '@/components/layout/Header'
import ListingCard from '@/components/listings/ListingCard'
import { subscriptionsApi, usersApi } from '@/lib/api'
import { inferDemoAccount } from '@/lib/demoApi'
import { useAuthSessionSync } from '@/hooks/useAuthSessionSync'
import ProfileDemoPreview from '@/components/ui/ProfileDemoPreview'
import Link from 'next/link'

const TABS = [
  { id: 'listings', label: 'Annonces',     icon: <Package   className="w-4 h-4" /> },
  { id: 'reviews',  label: 'Avis re�us',   icon: <BadgeCheck className="w-4 h-4" /> },
]

type SubscriptionStatus = {
  plan?: 'free' | 'pro' | null
  status?: 'active' | 'expiring_soon' | 'expired' | 'payment_failed' | null
  current_period_end?: string | null
  days_remaining?: number | null
  payment_provider?: 'stripe' | 'payplug' | null
  payment_status?: 'pending' | 'succeeded' | 'failed' | 'refunded' | null
}

function getSubscriptionStatusMeta(status?: SubscriptionStatus | null) {
  if (!status || status.plan === 'free') return null

  if (status.status === 'payment_failed') {
    return {
      tone: 'danger' as const,
      label: 'Paiement �chou�',
      description: 'Mettez � jour votre moyen de paiement pour conserver vos avantages Pro.',
      cta: { href: '/parametres#factures', label: 'Mettre � jour mon moyen de paiement' },
      icon: AlertTriangle,
    }
  }

  if (status.status === 'expired') {
    return {
      tone: 'danger' as const,
      label: 'Abonnement expir�',
      description: 'Votre abonnement a expir�. R�activez-le pour retrouver vos avantages Pro.',
      cta: { href: '/abonnement', label: 'R�activer mon abonnement' },
      icon: AlertTriangle,
    }
  }

  if (status.status === 'expiring_soon' && typeof status.days_remaining === 'number') {
    return {
      tone: 'warning' as const,
      label: `Expire dans ${status.days_remaining} jour${status.days_remaining > 1 ? 's' : ''}`,
      description: 'Votre abonnement arrive � �ch�ance. Renouvelez pour �viter une interruption.',
      cta: { href: '/abonnement', label: 'Renouveler maintenant' },
      icon: Clock3,
    }
  }

  return {
    tone: 'success' as const,
    label: 'Abonnement actif',
    description: 'Votre abonnement est actif et vos avantages Pro sont disponibles.',
    cta: null,
    icon: CheckCircle2,
  }
}

function ProfilePageContent() {
  const params   = useParams<{ id?: string }>()
  const searchParams = useSearchParams()
  const { user: me, demoProfile, authReady } = useAuthSessionSync()

  // Si pas d'id dans l'URL �  mon profil
  const profileId = params?.id || me?.id
  const isOwn     = !params?.id || params.id === me?.id
  const demoActive = Boolean(demoProfile || me?.demo_role || inferDemoAccount(me?.email))
  const demoKey = (demoProfile || me?.demo_role || inferDemoAccount(me?.email) || 'particulier') as 'particulier' | 'pro' | 'bon_plan'
  const demoProfileEmail =
    demoKey === 'particulier'
      ? 'particulier@demo.kalico.nc'
      : demoKey === 'pro'
        ? 'pro@demo.kalico.nc'
        : 'bonplan@demo.kalico.nc'
  const activeTab = searchParams.get('tab')

  const [profile,   setProfile]   = useState<any>(null)
  const [listings,  setListings]  = useState<any[]>([])
  const [reviews,   setReviews]   = useState<any[]>([])
  const [tab,       setTab]       = useState('listings')
  const [editing,   setEditing]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const { data: subscriptionStatusData } = useQuery({
    queryKey: ['subscriptions', 'status'],
    queryFn: async () => {
      const response = await subscriptionsApi.getStatus()
      return response.data as { data: SubscriptionStatus | null }
    },
    enabled: Boolean(isOwn && profileId && !demoActive),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 0,
  })
  const subscriptionStatus = subscriptionStatusData?.data ?? null
  const subscriptionMeta = getSubscriptionStatusMeta(subscriptionStatus)

  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    if (!authReady) return
    if (!profileId) {
      setLoading(false)
      return
    }
    if (demoActive) {
      setLoading(false)
      return
    }
    loadProfile()
  }, [authReady, profileId, demoActive])

  const loadProfile = async () => {
    try {
      const [profRes, listRes, revRes] = await Promise.all([
        usersApi.getProfile(profileId!),
        usersApi.getUserListings(profileId!),
        usersApi.getReviews(profileId!),
      ])
      setProfile(profRes.data.data)
      setListings(listRes.data.data)
      setReviews(revRes.data.data)
      reset(profRes.data.data)
    } finally {
      setLoading(false)
    }
  }

  const onSave = async (data: any) => {
    setSaving(true)
    try {
      await usersApi.updateProfile({
        first_name: data.first_name,
        last_name:  data.last_name,
        phone:      data.phone,
        bio:        data.bio,
      })
      setProfile({ ...profile, ...data })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const RatingRow = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <BadgeCheck key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-[var(--color-warning)]' : 'text-night/20'}`} />
      ))}
    </div>
  )

  if (!authReady) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
          <div className="card p-6 flex gap-5">
            <div className="skeleton w-20 h-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-6 w-48" />
              <div className="skeleton h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="card p-6 flex gap-5">
          <div className="skeleton w-20 h-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!profile && !demoActive) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-12 text-center">
          <div className="w-full rounded-[2rem] border border-night/8 bg-white dark:bg-[var(--color-surface)] p-8 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Profil</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-night">
              {profileId ? 'Chargement de votre profil' : 'Connectez-vous pour acc�der � votre espace.'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-night/60">
              {profileId
                ? 'Votre espace personnel est en cours de chargement. Si la page reste vide, reconnectez-vous pour r�initialiser la session.'
                : 'Vous devez �tre connect� pour consulter ou modifier votre profil. Utilisez votre compte Kalico pour acc�der � cet espace.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/connexion" className="btn-primary px-4 py-2 text-sm">
                Se connecter
              </Link>
              <Link href="/inscription" className="btn-secondary px-4 py-2 text-sm">
                Cr�er un compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (demoActive) {
    const demoKey = (demoProfile || me?.demo_role || inferDemoAccount(me?.email) || 'particulier') as 'particulier' | 'pro' | 'bon_plan'
    const demoCards = {
      particulier: {
        title: 'Mon compte particulier',
        subtitle: 'Publier, suivre, discuter',
        stats: [
          { value: '3', label: 'annonces' },
          { value: '18', label: 'messages' },
          { value: '24', label: 'favoris' },
        ],
        tabs: ['Annonces', 'Avis re�us', 'Favoris', 'Messages', 'Param�tres'],
        hint: "Tu vois l'espace classique d'un utilisateur qui d�pose une annonce.",
      },
      pro: {
        title: 'Espace professionnel',
        subtitle: 'Suivi de performance et visibilit�',
        stats: [
          { value: '47', label: 'annonces' },
          { value: '1.2k', label: 'vues' },
          { value: '4.9', label: 'note' },
        ],
        tabs: ['Annonces', 'Avis re�us', 'Statistiques', 'Boosts', 'Param�tres'],
        hint: 'Tu vois un compte orient� business avec indicateurs de performance.',
      },
      bon_plan: {
        title: 'Espace bon plan',
        subtitle: 'Campagnes locales et mises en avant',
        stats: [
          { value: '8', label: 'campagnes' },
          { value: '5', label: 'b�n�fices' },
          { value: '12', label: 'diffusions' },
        ],
        tabs: ['Annonces', 'Avis re�us', 'Campagnes', 'Statistiques', 'Param�tres'],
        hint: 'Tu vois une interface pens�e pour une promo, un �v�nement ou une annonce sponsoris�e.',
      },
    }[demoKey]

    return (
      <div className="min-h-screen">
        <Header />

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
          <div className="card p-5 border-coral/15 bg-coral/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Onboarding du compte</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">
                  {demoKey === 'pro'
                    ? 'Votre espace professionnel est pr�t'
                    : demoKey === 'bon_plan'
                      ? 'Votre espace bon plan est pr�t'
                      : 'Votre espace particulier est pr�t'}
                </h2>
                <p className="mt-1 text-sm text-night/60">
                  {demoKey === 'pro'
                    ? 'Compl�tez les infos soci�t�, activez les options de visibilit� et pr�parez vos annonces.'
                    : demoKey === 'bon_plan'
                      ? 'Programmez vos promos, affichez vos campagnes et mesurez la visibilit�.'
                      : 'Compl�tez votre profil, publiez une annonce et �changez avec les acheteurs.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={demoKey === 'pro' ? '/parametres' : '/annonces/nouvelle'} className="btn-primary px-4 py-2 text-sm">
                  {demoKey === 'pro' ? 'Configurer mon espace pro' : 'D�poser ma premi�re annonce'}
                </Link>
                <Link href="/annonces" className="btn-ghost px-4 py-2 text-sm">
                  Explorer les annonces
                </Link>
              </div>
            </div>
          </div>

          <ProfileDemoPreview mode="account" profile={demoKey} />

        </div>
      </div>
    )
  }

  const securityPanel = activeTab === 'securite' ? (
    <div className="card border-coral/15 bg-coral/5 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">S�curit� et connexion</p>
      <h2 className="mt-2 text-xl font-bold text-night">Votre s�curit� est active sur ce compte</h2>
      <p className="mt-2 text-sm text-night/60">
        Vous pouvez modifier votre mot de passe, v�rifier vos appareils actifs et consulter les options de r�cup�ration dans Param�tres.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/parametres#donnees" className="btn-primary px-4 py-2 text-sm">
          G�rer mes donn�es
        </Link>
        <Link href="/parametres#cookies" className="btn-ghost px-4 py-2 text-sm">
          Consentement cookies
        </Link>
      </div>
    </div>
  ) : null

  const notificationsPanel = activeTab === 'notifications' ? (
    <div className="card border-coral/15 bg-coral/5 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Notifications</p>
      <h2 className="mt-2 text-xl font-bold text-night">Les notifications sont g�r�es depuis le compte</h2>
      <p className="mt-2 text-sm text-night/60">
        Les alertes de recherche, les messages et les r�ponses dannonces restent visibles dans votre espace. Les r�glages d�taill�s sont accessibles depuis Param�tres de notification.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/parametres/notifications" className="btn-primary px-4 py-2 text-sm">
          Ouvrir les param�tres
        </Link>
        <Link href="/alertes" className="btn-ghost px-4 py-2 text-sm">
          Mes alertes
        </Link>
        <Link href="/messages" className="btn-ghost px-4 py-2 text-sm">
          Ouvrir mes messages
        </Link>
        <Link href="/profil/alertes-trajet" className="btn-ghost px-4 py-2 text-sm">
          Mes alertes trajet
        </Link>
      </div>

      {!demoActive && isOwn && (
        <div className="mt-6 rounded-[1.5rem] border border-night/8 bg-white dark:bg-[var(--color-surface)] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Bons Plans</p>
              <h3 className="mt-1 text-lg font-bold text-night">Tout est regroup� dans le centre de pr�f�rences</h3>
              <p className="mt-1 text-sm text-night/60">
                Les promos, cat�gories, enseignes et canaux sont maintenant g�r�s dans Param�tres de notification pour �viter les doublons.
              </p>
            </div>
            <Link href="/parametres/notifications#bons-plans" className="btn-primary px-4 py-2 text-sm">
              Ouvrir les pr�f�rences
            </Link>
          </div>
        </div>
      )}
    </div>
  ) : null

  const favoritesPanel = isOwn ? (
    <div className="card border-coral/15 bg-white dark:bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Favoris</p>
          <h2 className="mt-2 text-xl font-bold text-night">Mes favoris</h2>
          <p className="mt-2 text-sm text-night/60">
            Retrouvez ici les annonces que vous avez mises en m�moire pour les consulter plus tard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/favoris" className="btn-primary px-4 py-2 text-sm">
            Ouvrir mes favoris
          </Link>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        {securityPanel}
        {notificationsPanel}
        {favoritesPanel}

        <div className="card p-5 border-coral/15 bg-coral/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Onboarding du compte</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">
                {profile?.is_pro ? 'Votre espace professionnel est pr�t' : 'Votre espace particulier est pr�t'}
              </h2>
              <p className="mt-1 text-sm text-night/60">
                {profile?.is_pro
                  ? 'Compl�tez les infos soci�t�, activez les options de visibilit� et pr�parez vos annonces.'
                  : 'Compl�tez votre profil, publiez une annonce et �changez avec les acheteurs.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile?.is_pro ? (
                <Link href="/parametres" className="btn-primary px-4 py-2 text-sm">
                  Configurer mon espace pro
                </Link>
              ) : (
                <Link href="/annonces/nouvelle" className="btn-primary px-4 py-2 text-sm">
                  D�poser ma premi�re annonce
                </Link>
              )}
              <Link href="/annonces" className="btn-ghost px-4 py-2 text-sm">
                Explorer les annonces
              </Link>
            </div>
          </div>
        </div>

        {isOwn && !demoActive && subscriptionMeta && (
          <div
            className={`rounded-[1.5rem] border p-4 shadow-sm ${
              subscriptionMeta.tone === 'danger'
                ? 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10'
                : subscriptionMeta.tone === 'warning'
                  ? 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10'
                  : 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10'
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <subscriptionMeta.icon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    subscriptionMeta.tone === 'danger'
                      ? 'text-[var(--color-danger)]'
                      : subscriptionMeta.tone === 'warning'
                        ? 'text-[var(--color-warning)]'
                        : 'text-[var(--color-success)]'
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-night">{subscriptionMeta.label}</p>
                  <p className="text-sm text-night/60">{subscriptionMeta.description}</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/75 dark:bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-night/60">
                    {subscriptionStatus?.plan === 'pro' ? 'Pro' : 'Gratuit'}
                    {subscriptionStatus?.payment_provider ? ` � ${subscriptionStatus.payment_provider.toUpperCase()}` : ''}
                    {typeof subscriptionStatus?.days_remaining === 'number' && subscriptionStatus.days_remaining > 0
                      ? ` � ${subscriptionStatus.days_remaining} j`
                      : ''}
                  </div>
                </div>
              </div>

              {subscriptionMeta.cta && (
                <Link
                  href={subscriptionMeta.cta.href}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    subscriptionMeta.tone === 'danger'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : subscriptionMeta.tone === 'warning'
                        ? 'bg-night text-white hover:bg-night/90'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  {subscriptionMeta.cta.label}
                </Link>
              )}
            </div>
          </div>
        )}

        <ProfileDemoPreview mode="account" profile={demoKey} />

        {/* ���� Carte profil ������������������������������������������������������ */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-5">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-coral/15 flex items-center justify-center text-coral font-bold text-2xl overflow-hidden">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : `${profile.first_name?.[0]}${profile.last_name?.[0]}`
                }
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-jungle rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Infos */}
            {editing ? (
              <form onSubmit={handleSubmit(onSave)} className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-night/60 mb-1 block">Pr�nom</label>
                    <input {...register('first_name')} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-night/60 mb-1 block">Nom</label>
                    <input {...register('last_name')} className="input text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-night/60 mb-1 block">T�l�phone</label>
                  <input {...register('phone')} placeholder="+687123456" className="input text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-night/60 mb-1 block">Pr�sentation</label>
                  <textarea {...register('bio')} rows={3} placeholder="Parlez un peu de vous&" className="input text-sm resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary text-sm py-2">
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Enregistrer</>}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="btn-ghost text-sm py-2">
                    <X className="w-4 h-4" /> Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-night">
                      {profile.first_name} {profile.last_name}
                      {profile.is_pro && <span className="badge bg-ocean text-white text-xs ml-2">PRO</span>}
                    </h1>

                    {/* Note */}
                    {profile.rating_count > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <RatingRow rating={profile.rating} />
                        <span className="text-sm text-night/60">
                          {parseFloat(profile.rating).toFixed(1)} � {profile.rating_count} avis
                        </span>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-night/50">
                      {profile.commune_name && (
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.commune_name}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Membre depuis {format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })}
                      </span>
                    </div>

                    {/* Bio */}
                    {profile.bio && <p className="text-sm text-night/60 mt-3 max-w-lg">{profile.bio}</p>}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {profile.is_verified && (
                        <span className="badge bg-jungle/10 text-jungle text-xs">
                          <CheckCircle2 className="w-3 h-3" /> Compte v�rifi�
                        </span>
                      )}
                      <span className="badge bg-sand text-night/50 text-xs">
                        <Shield className="w-3 h-3" /> {profile.active_listings_count} annonce{profile.active_listings_count > 1 ? 's' : ''} active{profile.active_listings_count > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {isOwn ? (
                      <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-2">
                        <Edit3 className="w-4 h-4" /> Modifier
                      </button>
                    ) : (
                      <Link
                        href={`/messages?listing_user=${profile.id}`}
                        className="btn-primary text-sm py-2"
                      >
                        <MessageCircle className="w-4 h-4" /> Contacter
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ���� Onglets ������������������������������������������������������������������ */}
        <div className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-night/10 bg-[var(--color-background-secondary)] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white text-coral shadow-sm ring-1 ring-black/5' : 'text-night/75 hover:bg-white hover:text-night'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
          {isOwn && (
            <Link href="/favoris" className="flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-night/50 hover:text-night transition-all">
              <Heart className="w-4 h-4" /> Favoris
            </Link>
          )}
        </div>

        {/* ���� Contenu onglets �������������������������������������������������� */}
        {tab === 'listings' && (
          <div>
            {listings.length === 0 ? (
              <div className="text-center py-16 text-night/40">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Vous n'avez pas encore d'annonce. Publiez la v�tre.</p>
                {isOwn && (
                  <Link href="/annonces/nouvelle" className="btn-primary text-sm mt-4 inline-flex">
                    D�poser une annonce
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-16 text-night/40">
                <BadgeCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Vos premiers avis appara�tront ici.</p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-coral/15 flex items-center justify-center text-coral font-bold text-sm shrink-0">
                      {rev.first_name?.[0]}{rev.last_name?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-sm text-night">
                          {rev.first_name} {rev.last_name}
                        </p>
                        <span className="text-xs text-night/35">
                          {format(new Date(rev.created_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      <RatingRow rating={rev.rating} />
                      {rev.listing_title && (
                        <p className="text-xs text-night/40 mt-1">Re: {rev.listing_title}</p>
                      )}
                      {rev.comment && (
                        <p className="text-sm text-night/70 mt-2 leading-relaxed">{rev.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <Header />
          <div className="mx-auto max-w-5xl px-4 py-12">
            <div className="card animate-pulse p-6">
              <div className="skeleton h-7 w-40 rounded-full" />
              <div className="mt-4 space-y-3">
                <div className="skeleton h-6 w-3/5 rounded-full" />
                <div className="skeleton h-4 w-4/5 rounded-full" />
                <div className="skeleton h-4 w-2/5 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  )
}
