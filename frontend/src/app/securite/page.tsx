// src/app/securite/page.tsx
// ── Conseils de sécurité — Troca ─────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  CreditCard,
  MessageCircle,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Conseils de sécurité — Troca',
  description:
    'Recommandations pratiques pour acheter et vendre en sécurité sur Troca en Nouvelle-Calédonie.',
}

const GOOD_PRACTICES = [
  {
    icon: MapPin,
    text: 'Privilégiez une rencontre dans un lieu public, fréquenté et facilement identifiable.',
  },
  {
    icon: CheckCircle2,
    text: "Vérifiez l'état réel de l'article, son fonctionnement et sa conformité avant tout paiement.",
  },
  {
    icon: Phone,
    text: 'Évitez les paiements non traçables ou les demandes d’avance inhabituelles.',
  },
  {
    icon: Shield,
    text: 'Consultez le score de confiance, les badges de vérification et l’historique du vendeur.',
  },
  {
    icon: MessageCircle,
    text: 'Conservez les échanges dans la messagerie Troca afin de disposer d’un historique en cas de litige.',
  },
  {
    icon: CheckCircle2,
    text: 'Restez vigilant face aux annonces urgentes, aux prix anormalement bas ou aux vendeurs pressés.',
  },
]

const WARNING_SIGNS = [
  'Prix très inférieur au marché sans justification crédible.',
  'Refus de rencontre physique ou pression pour conclure immédiatement.',
  'Demande de paiement par un moyen difficilement traçable ou irréversible.',
  'Compte récent, absence d’avis ou score de confiance très faible.',
  'Invitation à poursuivre la conversation en dehors de Troca sans raison légitime.',
  'Demande d’acompte avant toute vérification du bien.',
  'Description vague, incohérente ou photos manifestement réutilisées.',
]

const CATEGORY_WARNINGS = [
  {
    cat: 'Véhicules',
    conseil:
      'Vérifiez les documents, comparez le numéro de série et procédez à un essai avant tout paiement.',
  },
  {
    cat: 'Immobilier',
    conseil:
      'Ne versez aucun dépôt sans visite préalable, contrat clair et vérification de l’identité du bailleur ou vendeur.',
  },
  {
    cat: 'Multimédia',
    conseil:
      'Testez l’appareil devant vous et vérifiez qu’il n’est pas bloqué par un compte ou un verrouillage constructeur.',
  },
  {
    cat: 'Emploi',
    conseil:
      'Méfiez-vous de toute offre demandant un paiement préalable ou des informations bancaires non nécessaires.',
  },
]

export default function SecuritePage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-jungle/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-jungle" />
          </div>
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-coral font-semibold">
            Sécurité des utilisateurs
          </p>
          <h1 className="font-display font-bold text-3xl text-night mt-2 mb-3">
            Achetez et vendez en sécurité
          </h1>
          <p className="text-night/55 text-base max-w-2xl mx-auto leading-relaxed">
            Troca met en place des mécanismes de modération et de confiance. Cette page rappelle
            les réflexes essentiels pour limiter les risques d’arnaque et sécuriser vos échanges.
          </p>
        </div>

        <section className="card p-6 mb-6">
          <h2 className="font-semibold text-night text-lg mb-5 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-jungle" />
            Les bonnes pratiques
          </h2>
          <div className="space-y-4">
            {GOOD_PRACTICES.map(({ icon: Icon, text }, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-jungle/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-jungle" />
                </div>
                <p className="text-sm text-night/75 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6 mb-6 border-l-4 border-red-400">
          <h2 className="font-semibold text-night text-lg mb-5 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Signaux d’alerte
          </h2>
          <div className="space-y-3">
            {WARNING_SIGNS.map((signal, index) => (
              <div key={index} className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-night/70">{signal}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6 mb-6">
          <h2 className="font-semibold text-night text-lg mb-5 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-coral" />
            Vigilance par catégorie
          </h2>
          <div className="space-y-4">
            {CATEGORY_WARNINGS.map(({ cat, conseil }) => (
              <div key={cat} className="p-4 bg-sand rounded-xl">
                <p className="font-semibold text-night text-sm mb-1">{cat}</p>
                <p className="text-xs text-night/60 leading-relaxed">{conseil}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-coral/5 border border-coral/15 rounded-2xl p-6 text-center">
          <p className="font-semibold text-night mb-2">
            Vous avez identifié une annonce ou un comportement suspect ?
          </p>
          <p className="text-sm text-night/55 mb-4 leading-relaxed">
            Utilisez le bouton de signalement présent sur chaque annonce ou contactez notre équipe
            sécurité si la situation vous semble urgente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/annonces" className="btn-primary px-6">
              Consulter les annonces
            </Link>
            <a href="mailto:securite@troca.nc" className="btn-ghost px-6">
              Contacter la sécurité
            </a>
          </div>
        </section>

        <p className="text-center text-xs text-night/30 mt-8 leading-relaxed">
          Troca agit comme intermédiaire technique et ne peut garantir l’absence totale de risque
          lors d’une transaction entre utilisateurs. En cas de litige, privilégiez les recours
          appropriés et, si nécessaire, les autorités compétentes.
        </p>
      </main>
    </>
  )
}
