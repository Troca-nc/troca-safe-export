'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  ChefHat,
  FileText,
  Hammer,
  Home,
  MapPin,
  Sparkles,
  Store,
  Truck,
  Users,
} from 'lucide-react'

import Header from '@/components/layout/Header'

const DEMO_PROFILE_HREF = '/pro/vitrine-exemple'

const STATS = [
  { value: '33', label: 'communes couvertes' },
  { value: '1', label: 'seul compte, toutes les fonctionnalitï¿½s' },
  { value: 'XPF', label: 'paiement local' },
  { value: '11%', label: 'TGC intï¿½grï¿½e dans les devis' },
] as const

type FeatureKey = 'vitrine' | 'devis' | 'rdv' | 'transport' | 'fret' | 'visibilite'

type FeatureSection = {
  key: FeatureKey
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  accent: 'lagon' | 'corail' | 'emeraude' | 'amber'
}

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    key: 'vitrine',
    eyebrow: 'Vitrine & Catalogue',
    title: 'Votre espace pro. Vos clients. Vos rï¿½sultats.',
    description: 'Un espace public clair pour prï¿½senter votre activitï¿½, rassurer vos clients et convertir plus vite.',
    bullets: [
      'Profil public avec logo, description, horaires et coordonnï¿½es',
      'Catalogue produits et services avec photos',
      'Avis clients vï¿½rifiï¿½s',
      'Prise de rendez-vous intï¿½grï¿½e',
    ],
    accent: 'lagon',
  },
  {
    key: 'devis',
    eyebrow: 'Devis & Facturation',
    title: 'Rï¿½pondez vite, en XPF, avec la bonne structure',
    description: 'Crï¿½ez des devis propres, envoyez-les lï¿½ oï¿½ il faut et suivez leur statut sans perdre le fil.',
    bullets: [
      'Crï¿½ation de devis en XPF avec TGC automatique',
      'Envoi par e-mail ou messagerie Kalico',
      'Suivi des statuts envoyï¿½s / acceptï¿½s / refusï¿½s',
      'Export PDF en un clic',
    ],
    accent: 'corail',
  },
  {
    key: 'rdv',
    eyebrow: 'Rï¿½servations & RDV',
    title: 'Un planning simple pour remplir vos crï¿½neaux',
    description: 'Laissez vos clients rï¿½server plus facilement et centralisez les rï¿½ponses sans bricolage.',
    bullets: [
      'Calendrier de disponibilitï¿½s',
      'Rï¿½servation en ligne par les clients',
      'Notifications automatiques',
      'Historique complet des rendez-vous',
    ],
    accent: 'emeraude',
  },
  {
    key: 'transport',
    eyebrow: 'Transport Pro',
    title: 'Courses, rÃ©servations et suivi mï¿½tier',
    description: 'Pensï¿½ pour les transporteurs et conducteurs qui veulent organiser leur activitï¿½ proprement.',
    bullets: [
      'Inscription transporteur professionnel',
      'Gestion des courses et rÃ©servations',
      'Profil conducteur vï¿½rifiï¿½',
      'Statistiques et revenus',
      'Intï¿½gration avec /covoiturage et /envoi-livraison',
    ],
    accent: 'amber',
  },
  {
    key: 'fret',
    eyebrow: 'Envoi & Livraison',
    title: 'Transport de marchandises, devis et demandes',
    description: 'Un module dï¿½diï¿½ pour les pros qui font bouger des colis, du stock ou du matï¿½riel.',
    bullets: [
      'Annonces de transport de marchandises',
      'Estimation volume / poids / urgence',
      'Mise en relation avec les expï¿½diteurs',
      'Gestion des demandes denvoi et livraison',
    ],
    accent: 'lagon',
  },
  {
    key: 'visibilite',
    eyebrow: 'Visibilitï¿½ & Boosts',
    title: 'Soyez visible quand les clients cherchent.',
    description: 'Boostez quand vous en avez besoin.',
    bullets: [
      'Annonces prioritaires dans les rï¿½sultats',
      'Badge Pro vï¿½rifiï¿½ sur toutes les surfaces',
      'Statistiques de vues et de contacts',
      'Systï¿½me de boosts ponctuels',
    ],
    accent: 'corail',
  },
]

const SECTOR_CARDS = [
  {
    icon: Building2,
    title: 'Immobilier',
    description: 'Vitrines, visites et mandats en ligne',
  },
  {
    icon: Car,
    title: 'Auto / Moto',
    description: 'Annonces vï¿½hicules et devis rï¿½paration',
  },
  {
    icon: Hammer,
    title: 'Artisanat & BTP',
    description: 'Devis chantier et agenda travaux',
  },
  {
    icon: ChefHat,
    title: 'Restauration',
    description: 'Menu, rÃ©servations et bons plans',
  },
  {
    icon: Users,
    title: 'Transport de personnes',
    description: 'Courses, covoiturage et planning',
  },
  {
    icon: Truck,
    title: 'Envoi & Livraison',
    description: 'Demandes, offres et suivi dexpï¿½ditions',
  },
  {
    icon: Home,
    title: 'Services ï¿½ domicile',
    description: 'RDV, catalogue et avis clients',
  },
  {
    icon: Store,
    title: 'Commerce & Retail',
    description: 'Catalogue, stock et promotions',
  },
] as const

const COMPARISON_ROWS = [
  ['Publier des annonces', true, true],
  ['Messagerie', true, true],
  ['Vitrine publique', false, true],
  ['Devis & factures', false, true],
  ['Rï¿½servations / RDV', false, true],
  ['Transport Pro & Livraison', false, true],
  ['Badge Pro vï¿½rifiï¿½', false, true],
  ['Boosts & prioritï¿½', false, true],
  ['Statistiques', false, true],
  ['Support prioritaire', false, true],
] as const

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.16)] backdrop-blur-sm">
      <p className="text-3xl font-bold text-nc-lagon">{value}</p>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#1e293b]">{label}</p>
    </article>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-nc-emeraude">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-bold text-night sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-sm leading-relaxed text-night/65 sm:text-base">{description}</p> : null}
    </div>
  )
}

function HeroDashboardMockup() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,32,50,0.92),rgba(4,18,30,0.98))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(72,202,228,0.22)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Dashboard Pro</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Atelier Kalico</h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-nc-lagonLight px-3 py-1 text-[11px] font-semibold text-nc-lagon">
            <BadgeCheck className="h-3.5 w-3.5" />
            Pro vï¿½rifiï¿½
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Vues</p>
            <p className="mt-2 text-2xl font-bold text-white">18 420</p>
            <p className="mt-1 text-xs text-white/55">+14% cette semaine</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Contacts</p>
            <p className="mt-2 text-2xl font-bold text-white">268</p>
            <p className="mt-1 text-xs text-white/55">Messages et appels</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Boosts</p>
            <p className="mt-2 text-2xl font-bold text-white">4</p>
            <p className="mt-1 text-xs text-white/55">En cours / programmï¿½s</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Performance</p>
                <h4 className="mt-1 font-semibold text-white">Vues et contacts</h4>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/75">30 jours</span>
            </div>
            <div className="mt-4 flex h-28 items-end gap-2">
              {[32, 44, 38, 58, 48, 64, 52, 74, 68, 86].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-xl bg-gradient-to-b from-nc-lagonLight to-nc-lagon"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-white/50">
              <span>Lun</span>
              <span>Mer</span>
              <span>Ven</span>
              <span>Dim</span>
            </div>
          </div>

          <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Annonces</p>
              <span className="rounded-full bg-[var(--color-success)]/15 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-success)]">3 actives</span>
            </div>
            {[
              ['Rï¿½fection terrasse', 'Boost actif jusqu\'ï¿½ demain'],
              ['Pose de cuisine', '12 vues aujourd\'hui'],
              ['Devis clï¿½ture', '2 rï¿½ponses en attente'],
            ].map(([title, subtitle]) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-nc-lagonLight text-nc-lagon">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs text-white/55">{subtitle}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureMockup({ section }: { section: FeatureSection }) {
  if (section.key === 'vitrine') {
    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="h-28 rounded-[1.25rem] bg-[linear-gradient(135deg,_rgba(8,32,50,0.94),_rgba(10,126,164,0.24))] p-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Fiche publique</p>
              <h3 className="mt-2 text-xl font-semibold">Atelier Kalico</h3>
              <p className="mt-1 text-sm text-white/70">Artisan BTP ï¿½ DumbÃ©a</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">4.9 / 5</span>
          </div>
        </div>
        <div className="-mt-6 space-y-3 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-night/40">Horaires</p>
              <p className="mt-2 text-sm font-semibold text-night">Lun-Sam</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-night/40">Catalogue</p>
              <p className="mt-2 text-sm font-semibold text-night">18 produits</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-background-secondary)] p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-night/40">RDV</p>
              <p className="mt-2 text-sm font-semibold text-night">En ligne</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-night">Avis vï¿½rifiï¿½s</p>
              <p className="text-xs font-semibold text-nc-emeraude">14 nouveaux</p>
            </div>
            <p className="mt-2 text-sm text-night/60">Rï¿½ponse rapide, vitrine claire et devis prï¿½cis.</p>
          </div>
        </div>
      </div>
    )
  }

  if (section.key === 'devis') {
    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="rounded-[1.25rem] bg-[linear-gradient(135deg,_rgba(8,32,50,0.96),_rgba(10,126,164,0.18))] p-4 text-white">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Nouveau devis</p>
          <h3 className="mt-2 text-xl font-semibold">Menuiserie intï¿½rieure</h3>
          <p className="mt-1 text-sm text-white/70">Client ï¿½ NoumÃ©a ï¿½ total estimï¿½</p>
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night/45">Lignes</p>
            <div className="mt-3 space-y-2 text-sm text-night/70">
              <div className="flex justify-between"><span>Main d'Suvre</span><span>48 000 XPF</span></div>
              <div className="flex justify-between"><span>Matï¿½riel</span><span>76 500 XPF</span></div>
              <div className="flex justify-between"><span>TGC 11%</span><span>13 695 XPF</span></div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-nc-lagon-border bg-nc-lagonLight p-3">
            <p className="text-sm font-semibold text-nc-lagon-text">PDF prï¿½t ï¿½ envoyer</p>
            <FileText className="h-4 w-4 text-nc-lagon" />
          </div>
        </div>
      </div>
    )
  }

  if (section.key === 'rdv') {
    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-night/45">Planning</p>
            <h3 className="mt-1 text-xl font-semibold text-night">Aoï¿½t 2026</h3>
          </div>
          <CalendarDays className="h-5 w-5 text-nc-lagon" />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold text-night/45">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {Array.from({ length: 21 }).map((_, index) => (
            <div
              key={index}
              className={`aspect-square rounded-2xl border p-2 ${index === 11 ? 'border-nc-lagon bg-nc-lagonLight text-nc-lagon' : 'border-[var(--color-border)] bg-[var(--color-background-secondary)] text-night/55'}`}
            >
              <span className="text-xs font-semibold">{index + 1}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3 text-sm text-night/65">
          3 rÃ©servations confirmï¿½es aujourdhui
        </div>
      </div>
    )
  }

  if (section.key === 'transport') {
    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-night/45">Transport Pro</p>
            <h3 className="mt-1 text-xl font-semibold text-night">Courses du jour</h3>
          </div>
          <Truck className="h-5 w-5 text-nc-lagon" />
        </div>
        <div className="mt-4 space-y-3">
          {[
            ['NoumÃ©a ï¿½ Bourail', '07:30 ï¿½ 4 passagers'],
            ['DumbÃ©a ï¿½ Paï¿½ta', '10:15 ï¿½ confirmï¿½'],
            ['Lifou ï¿½ NoumÃ©a', '18:00 ï¿½ retour prï¿½vu'],
          ].map(([title, subtitle]) => (
            <div key={title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
              <p className="text-sm font-semibold text-night">{title}</p>
              <p className="mt-1 text-xs text-night/55">{subtitle}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-nc-lagonLight p-3 text-center">
            <p className="text-lg font-bold text-nc-lagon">96%</p>
            <p className="text-[11px] text-nc-lagon-text">satisfaction</p>
          </div>
          <div className="rounded-2xl bg-nc-emeraudeLight p-3 text-center">
            <p className="text-lg font-bold text-nc-emeraude">128</p>
            <p className="text-[11px] text-nc-emeraude-text">courses</p>
          </div>
          <div className="rounded-2xl bg-coral/10 p-3 text-center">
            <p className="text-lg font-bold text-coral">4.9</p>
            <p className="text-[11px] text-coral/80">note</p>
          </div>
        </div>
      </div>
    )
  }

  if (section.key === 'fret') {
    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="rounded-[1.25rem] bg-[linear-gradient(135deg,_rgba(8,32,50,0.96),_rgba(10,126,164,0.18))] p-4 text-white">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Demande Envoi & Livraison</p>
          <h3 className="mt-2 text-xl font-semibold">NoumÃ©a ï¿½ Konï¿½</h3>
          <p className="mt-1 text-sm text-white/70">2.5 mï¿½ ï¿½ 380 kg ï¿½ express</p>
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-night">
              <MapPin className="h-4 w-4 text-coral" />
              Capacitï¿½ recommandï¿½e
            </div>
            <p className="mt-2 text-sm text-night/60">Fourgon, utilitaire ou camion lï¿½ger selon le volume.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
            <div className="rounded-2xl bg-nc-lagonLight p-3">
              <p className="text-lg font-bold text-nc-lagon">XPF</p>
              <p className="text-[11px] text-nc-lagon-text">devis</p>
            </div>
            <div className="rounded-2xl bg-nc-emeraudeLight p-3">
              <p className="text-lg font-bold text-nc-emeraude">24h</p>
              <p className="text-[11px] text-nc-emeraude-text">rï¿½ponse</p>
            </div>
            <div className="rounded-2xl bg-coral/10 p-3">
              <p className="text-lg font-bold text-coral">NC</p>
              <p className="text-[11px] text-coral/80">territoire</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="rounded-[1.25rem] bg-[linear-gradient(135deg,_rgba(8,32,50,0.96),_rgba(10,126,164,0.18))] p-4 text-white">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Visibilitï¿½</p>
        <h3 className="mt-2 text-xl font-semibold">Boosts en cours</h3>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
          <span className="text-sm font-semibold text-night">Vues de la semaine</span>
          <span className="text-sm font-bold text-nc-lagon">+28%</span>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
          <div className="flex items-end gap-2">
            {[12, 24, 18, 34, 28, 46, 42].map((height, index) => (
              <div key={index} className="flex-1 rounded-t-xl bg-gradient-to-b from-nc-lagonLight to-nc-lagon" style={{ height: `${height}px` }} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-nc-lagonLight p-3 text-sm font-semibold text-nc-lagon">
          4 boosts actifs ï¿½ badge Pro vï¿½rifiï¿½ partout
        </div>
      </div>
    </div>
  )
}

function FeatureTabs() {
  const [activeKey, setActiveKey] = useState<FeatureKey>('vitrine')
  const activeSection = useMemo(
    () => FEATURE_SECTIONS.find((section) => section.key === activeKey) ?? FEATURE_SECTIONS[0],
    [activeKey]
  )

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:py-28">
      <SectionHeading
        eyebrow="Preview fonctionnalitï¿½s"
        title="Tout ce que Kalico Pro rassemble"
        description="Chaque bloc montre un usage rï¿½el, pour que les prospects comprennent vite ce quils gagnent en passant Pro."
      />

      <div className="mt-8 hidden lg:block">
        <div className="flex flex-wrap gap-2 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm">
          {FEATURE_SECTIONS.map((section) => {
            const active = section.key === activeKey
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveKey(section.key)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? 'bg-nc-lagon text-white shadow-sm'
                    : 'text-night/65 hover:bg-[var(--color-background-secondary)] hover:text-night'
                }`}
              >
                {section.eyebrow}
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${activeSection.accent === 'corail' ? 'text-coral/80' : activeSection.accent === 'emeraude' ? 'text-nc-emeraude' : 'text-nc-lagon'}`}>
              {activeSection.eyebrow}
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold text-night">{activeSection.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-night/65">{activeSection.description}</p>

            <ul className="mt-6 space-y-3">
              {activeSection.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${activeSection.accent === 'corail' ? 'text-coral' : activeSection.accent === 'emeraude' ? 'text-nc-emeraude' : 'text-nc-lagon'}`} />
                  <span className="text-sm leading-relaxed text-night/75">{bullet}</span>
                </li>
              ))}
            </ul>
          </article>

          <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)]/70 p-4 shadow-sm">
            <FeatureMockup section={activeSection} />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4 lg:hidden">
        {FEATURE_SECTIONS.map((section) => {
          const active = section.key === activeKey
          return (
            <article key={section.key} className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
              <button
                type="button"
                onClick={() => setActiveKey(section.key)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={active}
              >
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${section.accent === 'corail' ? 'text-coral/80' : section.accent === 'emeraude' ? 'text-nc-emeraude' : 'text-nc-lagon'}`}>
                    {section.eyebrow}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-night">{section.title}</h3>
                </div>
                <ChevronRight className={`h-5 w-5 shrink-0 text-night/35 transition-transform ${active ? 'rotate-90' : ''}`} />
              </button>

              {active ? (
                <div className="border-t border-[var(--color-border)] px-5 py-5">
                  <p className="text-sm leading-relaxed text-night/65">{section.description}</p>
                  <ul className="mt-4 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                        <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${section.accent === 'corail' ? 'text-coral' : section.accent === 'emeraude' ? 'text-nc-emeraude' : 'text-nc-lagon'}`} />
                        <span className="text-sm leading-relaxed text-night/75">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <FeatureMockup section={section} />
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function SectorsGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:py-28">
      <SectionHeading
        eyebrow="Secteurs ciblï¿½s"
        title="Un seul profil pour tous vos mï¿½tiers."
        description="Des usages concrets pour les mï¿½tiers qui ont besoin de visibilitï¿½, de rendez-vous, de devis ou de logistique."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SECTOR_CARDS.map((sector) => {
          const Icon = sector.icon
          return (
            <article
              key={sector.title}
              className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-nc-lagon">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-night">{sector.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-night/65">{sector.description}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ComparisonTable() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:py-28">
      <SectionHeading
        eyebrow="Offre"
        title="Des offres claires pour dï¿½marrer"
        description="Un point dentrï¿½e simple, puis un plan Pro pensï¿½ pour ceux qui veulent vraiment dï¿½velopper leur activitï¿½."
      />

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-[var(--color-background-secondary)]">
              <tr>
                <th className="px-5 py-4 font-semibold text-night">Fonctionnalitï¿½</th>
                <th className="px-5 py-4 text-center font-semibold text-night">Gratuit</th>
                <th className="px-5 py-4 text-center font-semibold text-night">Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(([label, free, pro]) => (
                <tr key={label} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-4 font-medium text-night">{label}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full align-middle ${free ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-sand text-night/40'}`}>
                      {free ? '' : '-'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full align-middle ${pro ? 'bg-nc-lagonLight text-nc-lagon' : 'bg-sand text-night/40'}`}>
                      {pro ? '' : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--color-border)] bg-[var(--color-background-secondary)] px-5 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-nc-emeraude">Formule Pro</p>
              <p className="mt-2 text-2xl font-bold text-night">4 900 XPF / mois</p>
              <p className="mt-1 text-sm text-night/60">Sans engagement. Rï¿½siliable ï¿½ tout moment.</p>
            </div>
            <Link href="/pro/inscription" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm">
              Crï¿½er mon espace Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-sm text-nc-lagon md:ml-4 md:max-w-md">
              =% 3 mois offerts pour les 20 premiers inscrits
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 md:pb-28">
      <div
        className="overflow-hidden rounded-[2.25rem] border border-[var(--color-border)] p-6 shadow-sm md:p-10"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(4,18,30,0.98), rgba(8,32,50,0.96) 55%, rgba(10,126,164,0.25)), radial-gradient(circle at top right, rgba(72,202,228,0.18), transparent 30%)',
        }}
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Derniï¿½re ï¿½tape</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            Prï¿½t ï¿½ dï¿½velopper votre activitï¿½ en NC ?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Crï¿½ez votre espace Pro en 5 minutes. Commencez gratuitement, passez Pro quand vous voulez.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/pro/inscription" className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm">
              Crï¿½er mon espace Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={DEMO_PROFILE_HREF} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Voir une vitrine exemple
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ProLandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <main>
        <section
          className="relative overflow-hidden px-4 py-20 md:py-24"
          style={{
            backgroundImage:
              'radial-gradient(circle at top left, rgba(72,202,228,0.12), transparent 24%), radial-gradient(circle at top right, rgba(10,126,164,0.22), transparent 22%), linear-gradient(135deg, #03131f 0%, #071a28 45%, #0a3041 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Espace Professionnel
              </div>
              <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Votre espace pro. Vos clients. Vos rï¿½sultats.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                Vitrine, devis, rÃ©servations, transport, envoi & livraison - tout ce quil faut pour dï¿½velopper votre business local.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/pro/inscription" className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold shadow-lg shadow-nc-lagon/25">
                  Crï¿½er mon espace Pro
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={DEMO_PROFILE_HREF}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
                >
                  Voir une vitrine exemple
                </Link>
              </div>
              <p className="mt-3 text-sm font-semibold text-nc-lagon">
                =% 3 mois offerts pour les 20 premiers inscrits
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  'Badge Pro vï¿½rifiï¿½',
                  'Devis et rÃ©servations intï¿½grï¿½s',
                  'Transport et livraison connectï¿½s',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/85 backdrop-blur-sm">
                    <CheckCircle2 className="h-4 w-4 text-nc-lagon" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <HeroDashboardMockup />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 md:py-28">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STATS.map((stat) => (
              <StatCard key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </section>

        <FeatureTabs />
        <SectorsGrid />
        <ComparisonTable />
        <FinalCta />
      </main>
    </div>
  )
}
