import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'
import CookieManager from '@/components/legal/CookieManager'

export const metadata: Metadata = {
  title: 'Politique cookies — Troca',
  description: 'Gestion des cookies et préférences de consentement de Troca.',
}

const LAST_UPDATE = '25 mai 2026'

export default function PolitiqueCookiesPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Politique cookies" lastUpdated={LAST_UPDATE}>
        <h2>1. Utilisation des cookies</h2>
        <p>
          Troca utilise des cookies essentiels au fonctionnement du site. Avec votre accord, une mesure d’audience limitée peut être activée.
        </p>

        <h2>2. Types de cookies</h2>
        <ul>
          <li><strong>Essentiels</strong> : session, sécurité, préférences de base.</li>
          <li><strong>Fonctionnels</strong> : thème, langue, historique de recherche.</li>
          <li><strong>Analytiques</strong> : mesure d’audience first-party si vous y consentez.</li>
          <li><strong>Tiers</strong> : Stripe et PayPlug pendant les parcours de paiement.</li>
        </ul>

        <h2>3. Gérer vos choix</h2>
        <p>
          Vous pouvez modifier vos préférences à tout moment via la bannière de consentement ou ci-dessous.
        </p>

        <CookieManager />

        <h2>4. Impact du refus</h2>
        <p>
          Le refus des cookies fonctionnels et analytiques n’empêche pas l’accès au service principal.
        </p>
      </LegalLayout>
    </>
  )
}
