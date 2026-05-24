import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'CGV — Troca',
  description: 'Conditions générales de vente de Troca.',
}

const LAST_UPDATE = '25 mai 2026'

export default function CgvPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Conditions générales de vente" lastUpdated={LAST_UPDATE}>
        <h2>1. Services payants</h2>
        <p>
          Troca commercialise des abonnements Pro, des boosts d’annonces, la publication de Bons Plans et le badge Conducteur Vérifié.
        </p>

        <h2>2. Tarifs</h2>
        <table>
          <thead>
            <tr>
              <th>Offre</th>
              <th>Prix public</th>
              <th>Prix Pro</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Pro mensuel</td><td>4 900 XPF</td><td>4 900 XPF</td></tr>
            <tr><td>Pro annuel</td><td>44 900 XPF</td><td>44 900 XPF</td></tr>
            <tr><td>Boost 3 jours</td><td>500 XPF</td><td>400 XPF</td></tr>
            <tr><td>Boost 7 jours</td><td>900 XPF</td><td>720 XPF</td></tr>
            <tr><td>Boost 14 jours</td><td>1 500 XPF</td><td>1 200 XPF</td></tr>
            <tr><td>Boost 30 jours</td><td>2 500 XPF</td><td>2 000 XPF</td></tr>
            <tr><td>Bon Plan 7 jours</td><td>2 900 XPF</td><td>2 320 XPF</td></tr>
            <tr><td>Bon Plan 30 jours</td><td>7 900 XPF</td><td>6 320 XPF</td></tr>
            <tr><td>Badge Conducteur Vérifié</td><td>1 500 XPF</td><td>1 500 XPF</td></tr>
          </tbody>
        </table>

        <h2>3. Paiement</h2>
        <p>
          Les paiements sont traités par Stripe ou PayPlug selon le moyen choisi. Troca ne stocke jamais les données complètes de carte.
        </p>

        <h2>4. Renouvellement et remboursement</h2>
        <p>
          Les abonnements peuvent se renouveler automatiquement. Les services activés ne sont pas remboursables, sauf dysfonctionnement avéré ou rejet d’une demande de badge conducteur.
        </p>

        <h2>5. Rétractation</h2>
        <p>
          Les services numériques étant activés immédiatement, le droit de rétractation peut ne pas s’appliquer selon la réglementation locale applicable. [À VALIDER JURISTE]
        </p>
      </LegalLayout>
    </>
  )
}
