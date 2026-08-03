import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'CGV - Kalico',
  description: 'Conditions g�n�rales de vente de Kalico.',
}

const LAST_UPDATE = '25 mai 2026'

export default function CgvPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Conditions g�n�rales de vente" lastUpdated={LAST_UPDATE}>
        <h2>1. Services payants</h2>
        <p>
          Kalico commercialise des abonnements Pro, des boosts dannonces, la publication de Bons Plans et le badge Conducteur V�rifi�.
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
            <tr><td>Badge Conducteur V�rifi�</td><td>1 500 XPF</td><td>1 500 XPF</td></tr>
          </tbody>
        </table>

        <h2>3. Paiement</h2>
        <p>
          Les paiements sont trait�s par Stripe ou PayPlug selon le moyen choisi. Kalico ne stocke jamais les donn�es compl�tes de carte.
        </p>

        <h2>4. Renouvellement et remboursement</h2>
        <p>
          Les abonnements peuvent se renouveler automatiquement. Les services activ�s ne sont pas remboursables, sauf dysfonctionnement av�r� ou rejet dune demande de badge conducteur.
        </p>

        <h2>5. R�tractation</h2>
        <p>
          Les services num�riques �tant activ�s imm�diatement, le droit de r�tractation peut ne pas sappliquer selon la r�glementation locale applicable.
        </p>
      </LegalLayout>
    </>
  )
}
