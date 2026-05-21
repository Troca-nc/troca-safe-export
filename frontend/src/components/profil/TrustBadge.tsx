'use client'
// src/components/trust/TrustBadge.tsx
// ── Badge de confiance vendeur — affiché sur fiche annonce et profil ──────────

import { Shield, ShieldCheck, ShieldAlert, ShieldX, Phone, Star, Clock, Package, MailCheck } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrustData {
  score:   number   // 0–100
  level:   'excellent' | 'bon' | 'moyen' | 'faible' | 'inconnu'
  details: {
    email_verified:  boolean
    phone_verified:  boolean
    account_age_30:  boolean
    account_age_90:  boolean
    nb_annonces_5:   boolean
    nb_avis_3:       boolean
    note_4:          boolean
    no_reports:      boolean
    is_pro:          boolean
  }
}

// ── Config visuelle par niveau ────────────────────────────────────────────────

const LEVEL_CONFIG = {
  excellent: {
    icon:  ShieldCheck,
    label: 'Vendeur de confiance',
    color: 'text-jungle',
    bg:    'bg-jungle/10 border-jungle/20',
    bar:   'bg-jungle',
  },
  bon: {
    icon:  ShieldCheck,
    label: 'Bon vendeur',
    color: 'text-teal-600',
    bg:    'bg-teal-50 border-teal-100',
    bar:   'bg-teal-500',
  },
  moyen: {
    icon:  Shield,
    label: 'Profil en cours',
    color: 'text-amber-600',
    bg:    'bg-amber-50 border-amber-100',
    bar:   'bg-amber-400',
  },
  faible: {
    icon:  ShieldAlert,
    label: 'Profil incomplet',
    color: 'text-red-500',
    bg:    'bg-red-50 border-red-100',
    bar:   'bg-red-400',
  },
  inconnu: {
    icon:  ShieldX,
    label: 'Non évalué',
    color: 'text-night/40',
    bg:    'bg-sand border-night/10',
    bar:   'bg-night/20',
  },
}

// ── Critères affichés dans le détail ─────────────────────────────────────────

const CRITERIA = [
  { key: 'email_verified', icon: MailCheck, label: 'Email vérifié'       },
  { key: 'phone_verified', icon: Phone,   label: 'Téléphone vérifié'     },
  { key: 'account_age_30', icon: Clock,   label: 'Compte actif > 30j'    },
  { key: 'nb_annonces_5',  icon: Package, label: '5+ annonces publiées'  },
  { key: 'nb_avis_3',      icon: Star,    label: '3+ avis reçus'         },
  { key: 'note_4',         icon: Star,    label: 'Note >= 4/5'           },
  { key: 'no_reports',     icon: Shield,  label: 'Aucun signalement'     },
] as const

// ── Badge compact (fiche annonce) ─────────────────────────────────────────────

export function TrustBadgeCompact({ trust }: { trust: TrustData }) {
  const cfg   = LEVEL_CONFIG[trust.level]
  const Icon  = cfg.icon

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
      <span className="font-bold">{trust.score}/100</span>
    </div>
  )
}

// ── Badge détaillé (profil vendeur) ───────────────────────────────────────────

export function TrustBadgeDetailed({ trust }: { trust: TrustData }) {
  const cfg  = LEVEL_CONFIG[trust.level]
  const Icon = cfg.icon

  return (
    <div className="card p-5">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${cfg.color}`} />
          <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
        </div>
        <span className="font-display font-bold text-2xl text-night">{trust.score}<span className="text-sm font-normal text-night/40">/100</span></span>
      </div>

      {/* Barre de progression */}
      <div className="h-2 bg-sand rounded-full overflow-hidden mb-5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
          style={{ width: `${trust.score}%` }}
        />
      </div>

      {/* Critères */}
      <div className="space-y-2">
        {CRITERIA.map(({ key, icon: CIcon, label }) => {
          const ok = trust.details[key]
          return (
            <div key={key} className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-jungle/10' : 'bg-sand'}`}>
                <CIcon className={`w-3 h-3 ${ok ? 'text-jungle' : 'text-night/25'}`} />
              </div>
              <span className={`text-xs ${ok ? 'text-night/70' : 'text-night/35 line-through'}`}>
                {label}
              </span>
              {ok && <span className="ml-auto text-jungle text-xs">✓</span>}
            </div>
          )
        })}
      </div>

      {/* Conseil si score faible */}
      {trust.score < 50 && (
        <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
          💡 Vérifiez votre téléphone pour augmenter votre score et inspirer confiance aux acheteurs.
        </div>
      )}
    </div>
  )
}
