'use client'
// ============================================================
//  Troca — Dashboard statistiques vendeur (Pro)
//  Affiché dans /profil quand l'utilisateur est Pro
// ============================================================

import { useEffect, useState } from 'react'
import { BarChart2, Eye, Heart, MessageCircle, Star, TrendingUp, Award, Clock } from 'lucide-react'
import { statsApi } from '@/lib/api'
import PlanBadge from '@/components/PlanBadge'

interface Stats {
  totaux: {
    total_annonces:    string
    total_vues:        string
    total_favoris:     string
    annonces_actives:  string
    annonces_boostees: string
  }
  top_annonces: Array<{
    id: string; titre: string; nb_vues: number; nb_favoris: number
    prix: number | null; status: string
  }>
  messages: {
    total_conversations: string
    total_messages:      string
    messages_7j:         string
  }
  vues_par_annonce: Array<{
    titre: string; nb_vues: number; nb_favoris: number; vues_par_jour_moy: string
  }>
  taux_reponse: {
    total_conv: string; conv_avec_reponse: string; taux_reponse_pct: string
  }
  avis: {
    total_avis: string; note_moyenne: string | null
    cinq_etoiles: string; une_etoile: string
  }
  is_pro: boolean
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-coral' }: {
  icon:   React.ElementType
  label:  string
  value:  string | number
  sub?:   string
  color?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-night/5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-night/5 flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} />
        </div>
        <span className="text-[11px] sm:text-xs text-night/50 font-medium leading-tight">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-night">{value}</p>
      {sub && <p className="text-[11px] sm:text-xs text-night/40 mt-1">{sub}</p>}
    </div>
  )
}

export default function SellerStatsDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsApi.getSeller()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-24 border border-night/5" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const { totaux, messages, taux_reponse, avis } = stats

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-coral shrink-0" />
        <h2 className="font-semibold text-night text-sm sm:text-base">Statistiques Pro</h2>
        <PlanBadge className="ml-auto" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon={Eye} label="Vues totales"
          value={Number(totaux.total_vues ?? 0).toLocaleString('fr-FR')}
          color="text-blue-500"
        />
        <StatCard
          icon={Heart} label="Fois en favoris"
          value={Number(totaux.total_favoris ?? 0).toLocaleString('fr-FR')}
          color="text-red-400"
        />
        <StatCard
          icon={MessageCircle} label="Conversations"
          value={messages.total_conversations ?? '0'}
          sub={`${messages.messages_7j ?? 0} msg ces 7 jours`}
          color="text-green-500"
        />
        <StatCard
          icon={Clock} label="Taux de réponse"
          value={`${taux_reponse.taux_reponse_pct ?? 0}%`}
          sub={`${taux_reponse.conv_avec_reponse}/${taux_reponse.total_conv} conv.`}
          color="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp} label="Annonces actives"
          value={totaux.annonces_actives ?? '0'}
          sub={`${totaux.total_annonces ?? 0} au total`}
          color="text-coral"
        />
        <StatCard
          icon={Award} label="Annonces boostées"
          value={totaux.annonces_boostees ?? '0'}
          color="text-amber-500"
        />
        {avis.total_avis !== '0' && (
          <>
            <StatCard
              icon={Star} label="Note moyenne"
              value={avis.note_moyenne ? `${avis.note_moyenne}/5` : '—'}
              sub={`${avis.total_avis} avis`}
              color="text-amber-400"
            />
            <StatCard
              icon={Star} label="Avis 5 étoiles"
              value={avis.cinq_etoiles ?? '0'}
              sub={`${avis.une_etoile} avis 1 étoile`}
              color="text-amber-400"
            />
          </>
        )}
      </div>

      {/* Top annonces */}
      {stats.top_annonces.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-night/5">
          <h3 className="text-sm font-semibold text-night mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            Top 5 annonces par vues
          </h3>
          <div className="space-y-2">
            {stats.top_annonces.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-night/5 last:border-0">
                <span className="text-xs font-bold text-night/30 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-night truncate">{a.titre}</p>
                  <p className="text-xs text-night/40">
                    {a.prix ? `${a.prix.toLocaleString('fr-FR')} XPF` : 'Prix libre'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-night/50">
                    <Eye className="w-3 h-3" />{a.nb_vues}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-night/50">
                    <Heart className="w-3 h-3" />{a.nb_favoris}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vues moyennes par jour */}
      {stats.vues_par_annonce.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-night/5">
          <h3 className="text-sm font-semibold text-night mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-coral" />
            Vues moyennes par jour (annonces actives)
          </h3>
          <div className="space-y-2">
            {stats.vues_par_annonce.map((a, i) => {
              const max = stats.vues_par_annonce[0]?.vues_par_jour_moy ?? '1'
              const pct = Math.round((Number(a.vues_par_jour_moy) / Number(max)) * 100)
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-night/60 truncate max-w-[200px]">{a.titre}</span>
                    <span className="font-semibold text-night ml-2">{a.vues_par_jour_moy}/j</span>
                  </div>
                  <div className="w-full bg-night/5 rounded-full h-1.5">
                    <div
                      className="bg-coral h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upsell non-Pro */}
      {!stats.is_pro && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-amber-800 mb-2">
            ⭐ Passez Pro pour accéder à toutes vos statistiques
          </p>
          <a href="/pro" className="text-xs text-amber-700 underline">Découvrir les offres Pro →</a>
        </div>
      )}
    </div>
  )
}
