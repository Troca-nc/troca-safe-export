'use client'
// src/app/profil/[id]/page.tsx â€” Profil public d'un vendeur

import { useEffect, useState, type ElementType } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, MapPin, Calendar, Package, MailCheck, Phone, Eye, Heart, TrendingUp, Award, ShieldCheck, LocateFixed, Navigation2, Compass } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Header from '@/components/layout/Header'
import ListingCard from '@/components/listings/ListingCard'
import ContentShareButton from '@/components/share/ContentShareButton'
import { useAuthStore } from '@/store/authStore'
import SellerStatsDashboard from '@/components/profil/SellerStatsDashboard'
import { usersApi } from '@/lib/api'
import Link from 'next/link'

function MetricCard({ label, value, sub, icon: Icon, tone = 'text-coral' }: {
  label: string
  value: string | number
  sub?: string
  icon: ElementType
  tone?: string
}) {
  return (
    <div className="rounded-2xl border border-night/10 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-night/45 mb-2">
        <Icon className={`w-4 h-4 ${tone}`} />
        {label}
      </div>
      <p className="text-2xl font-bold text-night">{value}</p>
      {sub && <p className="mt-1 text-xs text-night/45">{sub}</p>}
    </div>
  )
}

export default function PublicProfilePage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const { user: me } = useAuthStore()
  const isOwn = Boolean(me?.id && String(me.id) === String(id))
  const [profile,  setProfile]  = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [reviews,  setReviews]  = useState<any[]>([])
  const [tab,      setTab]      = useState<'listings' | 'reviews'>('listings')
  const [loading,  setLoading]  = useState(true)
  const profileShareContent = profile
    ? {
        kind: 'profil' as const,
        itemId: id,
        title: `${profile.prenom} ${profile.nom} | Troca`,
        description: [
          profile.commune_name ? `Basé à ${profile.commune_name}` : null,
          profile.is_pro ? 'Compte professionnel' : 'Profil particulier',
          profile.nb_annonces ? `${profile.nb_annonces} annonce${profile.nb_annonces > 1 ? 's' : ''}` : null,
        ].filter(Boolean).join(' • '),
        url: `https://troca.nc/profil/${id}`,
        imageUrl: null,
      }
    : null


  useEffect(() => {
    if (!id) return
    Promise.all([
      usersApi.getProfile(id),
      usersApi.getUserListings(id),
      usersApi.getReviews(id),
    ])
      .then(([p, l, r]) => {
        setProfile(p.data.data)
        setListings(l.data.data ?? [])
        setReviews(r.data.data ?? [])
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-light">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
          <div className="h-24 bg-white rounded-2xl" />
          <div className="h-64 bg-white rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-sand-light">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Carte profil */}
        <div className="card p-6 mb-6 flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-16 h-16 rounded-2xl bg-coral/15 flex items-center justify-center text-2xl font-bold text-coral shrink-0">
            {profile.prenom?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-xl font-bold text-night">
                {profile.prenom} {profile.nom}
              </h1>
              {profile.is_pro && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Pro</span>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {profile.email_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-ocean/20 bg-ocean/8 px-2.5 py-0.5 text-xs font-medium text-ocean">
                    <MailCheck className="w-3.5 h-3.5" /> Email vÃ©rifiÃ©
                  </span>
                )}
                {profile.phone_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-jungle/20 bg-jungle/8 px-2.5 py-0.5 text-xs font-medium text-jungle">
                    <Phone className="w-3.5 h-3.5" /> TÃ©lÃ©phone vÃ©rifiÃ©
                  </span>
                )}
              </div>
            </div>

            {profile.commune_name && (
              <p className="text-sm text-night/50 flex items-center gap-1 mb-2">
                <MapPin className="w-3.5 h-3.5" />
                {profile.commune_name}
                {profile.province_name && <span className="text-night/35">Â· {profile.province_name}</span>}
              </p>
            )}
            {profile.bio && (
              <p className="text-sm text-night/70 leading-relaxed mb-3">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              {profile.note_moyenne && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  {Number(profile.note_moyenne).toFixed(1)}
                  <span className="text-night/40 font-normal">({profile.nb_avis} avis)</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-night/50">
                <Package className="w-4 h-4" /> {profile.nb_annonces} annonce{profile.nb_annonces !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 text-night/50">
                <Calendar className="w-4 h-4" />
                Membre depuis {format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/messages?user=${id}`}
              className="btn-primary text-sm px-4 py-2"
            >
              Contacter
            </Link>
            {profileShareContent && (
              <ContentShareButton content={profileShareContent} variant="compact" />
            )}
          </div>
        </div>

        {(profile.total_vues != null || profile.total_favoris != null || profile.active_listings_count != null || profile.annonces_boostees != null) && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MetricCard
              label="Vues totales"
              value={Number(profile.total_vues ?? 0).toLocaleString('fr-FR')}
              icon={Eye}
              tone="text-blue-500"
            />
            <MetricCard
              label="Favoris reÃ§us"
              value={Number(profile.total_favoris ?? 0).toLocaleString('fr-FR')}
              icon={Heart}
              tone="text-red-400"
            />
            <MetricCard
              label="Annonces actives"
              value={Number(profile.active_listings_count ?? profile.nb_annonces ?? 0).toLocaleString('fr-FR')}
              sub={profile.is_pro ? 'AperÃ§u public du catalogue' : 'Catalogue vendeur'}
              icon={TrendingUp}
              tone="text-coral"
            />
            <MetricCard
              label="Boosts / mises en avant"
              value={Number(profile.annonces_boostees ?? 0).toLocaleString('fr-FR')}
              sub={profile.is_pro ? 'Incitation Ã  activer plus de visibilitÃ©' : 'Options pro disponibles'}
              icon={Award}
              tone="text-amber-500"
            />
          </div>
        )}

        {(profile.commune_name || profile.province_name || profile.commune_id || profile.province_id) && (
          <div className="mb-6 overflow-hidden rounded-3xl border border-ocean/12 bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-[220px] bg-gradient-to-br from-ocean via-ocean/95 to-coral overflow-hidden">
                <div className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 18%, rgba(255,255,255,0.14) 0 1px, transparent 1px), radial-gradient(circle at 78% 34%, rgba(255,255,255,0.14) 0 1px, transparent 1px), radial-gradient(circle at 45% 72%, rgba(255,255,255,0.12) 0 1px, transparent 1px), linear-gradient(135deg, rgba(255,255,255,0.08) 0 1px, transparent 1px)',
                    backgroundSize: '24px 24px, 28px 28px, 34px 34px, 100% 100%',
                  }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.18),transparent_55%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute h-44 w-44 rounded-full border border-white/20" />
                    <div className="absolute h-28 w-28 rounded-full border border-white/25" />
                    <div className="absolute h-16 w-16 rounded-full border border-white/30 bg-white/8 backdrop-blur-sm" />
                    <div className="relative flex items-center justify-center">
                      <div className="absolute h-24 w-24 rounded-full bg-white/10 blur-xl" />
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ocean shadow-lg">
                        <LocateFixed className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                  <Compass className="h-3.5 w-3.5" />
                  Zone de vente locale
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  {profile.commune_name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-night shadow-sm">
                      <Navigation2 className="w-3.5 h-3.5 text-coral" />
                      {profile.commune_name}
                    </span>
                  )}
                  {profile.province_name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-night shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-coral" />
                      {profile.province_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-gradient-to-br from-white to-sand/40">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ocean/70">Zone de vente</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">GÃ©olocalisation du vendeur</h2>
                <p className="mt-2 text-sm text-night/60">
                  {profile.commune_name
                    ? `BasÃ© Ã  ${profile.commune_name}${profile.province_name ? `, ${profile.province_name}` : ''}.`
                    : 'Zone de vente non prÃ©cisÃ©e pour le moment.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {profile.email_verified && (
                    <span className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-ocean/15 bg-ocean/5 px-3 py-2 text-xs font-semibold text-ocean">
                      <MailCheck className="w-3.5 h-3.5" /> Email vÃ©rifiÃ©
                    </span>
                  )}
                  {profile.phone_verified && (
                    <span className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-jungle/15 bg-jungle/5 px-3 py-2 text-xs font-semibold text-jungle">
                      <Phone className="w-3.5 h-3.5" /> TÃ©lÃ©phone vÃ©rifiÃ©
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={
                      profile.commune_id_lookup || profile.commune_id
                        ? `/annonces?commune_id=${profile.commune_id_lookup ?? profile.commune_id}`
                        : '/annonces'
                    }
                    className="rounded-2xl border border-night/10 bg-white px-3 py-3 text-sm font-semibold text-night hover:border-coral/30 hover:text-coral transition-colors"
                  >
                    Commune
                  </Link>
                  <Link
                    href={profile.province_id ? `/annonces?province_id=${profile.province_id}` : '/annonces'}
                    className="rounded-2xl border border-night/10 bg-white px-3 py-3 text-sm font-semibold text-night hover:border-coral/30 hover:text-coral transition-colors"
                  >
                    Province
                  </Link>
                </div>

                {isOwn && profile.is_pro && (
                  <div className="mt-4 rounded-2xl border border-coral/15 bg-coral/5 p-4">
                    <p className="text-sm font-semibold text-night">DÃ©finir votre zone de couverture</p>
                    <p className="mt-1 text-sm text-night/55">Renforcez votre visibilitÃ© sur la commune et la province oÃ¹ vous vendez le plus.</p>
                    <div className="mt-3">
                      <Link href="/parametres" className="btn-primary text-sm px-4 py-2">
                        Ajuster ma zone
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isOwn && profile.is_pro && (
          <div className="mb-6 rounded-3xl border border-coral/15 bg-coral/5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">VisibilitÃ© vendeur</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Booster vos annonces et mettre en avant votre vitrine</h2>
                <p className="mt-1 text-sm text-night/60 max-w-2xl">
                  Suivez vos vues, vos favoris et vos annonces boostÃ©es, puis activez les options de visibilitÃ© pour remonter dans les rÃ©sultats.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/pro" className="btn-primary px-4 py-2 text-sm">
                  Voir les boosts et mises en avant
                </Link>
                <Link href="/annonces/nouvelle" className="btn-ghost px-4 py-2 text-sm">
                  Publier une annonce
                </Link>
              </div>
            </div>
          </div>
        )}

        {isOwn && profile.is_pro && (
          <div className="mb-6">
            <SellerStatsDashboard />
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-1 mb-5 bg-white border border-night/8 rounded-xl p-1 w-fit">
          {([['listings', 'Annonces'], ['reviews', 'Avis']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-coral text-white' : 'text-night/60 hover:text-night'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">
                {key === 'listings' ? listings.length : reviews.length}
              </span>
            </button>
          ))}
        </div>

        {/* Contenu */}
        {tab === 'listings' && (
          listings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          ) : (
            <p className="text-center text-night/40 py-12 text-sm">Aucune annonce active.</p>
          )
        )}

        {tab === 'reviews' && (
          reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((r: any) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-coral/10 flex items-center justify-center text-xs font-bold text-coral">
                      {r.auteur_prenom?.[0] ?? '?'}
                    </div>
                    <span className="text-sm font-medium text-night">{r.auteur_prenom}</span>
                    <div className="flex ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.note ? 'fill-amber-400 stroke-amber-400' : 'stroke-night/20'}`} />
                      ))}
                    </div>
                  </div>
                  {r.commentaire && <p className="text-sm text-night/70">{r.commentaire}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-night/40 py-12 text-sm">Aucun avis pour le moment.</p>
          )
        )}
      </div>
    </div>
  )
}
