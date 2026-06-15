import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'
import CookieManager from '@/components/legal/CookieManager'

export const metadata: Metadata = {
  title: 'Cookies - Kalico',
  description: 'Gestion simple des cookies et des préférences de consentement de Kalico.',
}

const LAST_UPDATE = '25 mai 2026'

export default function PolitiqueCookiesPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Cookies" lastUpdated={LAST_UPDATE}>
        <p className="text-base leading-relaxed text-night/70">
          Cette page vous permet de choisir rapidement ce que vous autorisez. Les cookies essentiels restent actifs pour assurer la connexion et la sécurité.
        </p>

        <h2>1. Ce qui reste actif</h2>
        <p>
          Kalico utilise des cookies essentiels au fonctionnement du site. Ils gèrent notamment la session, la sécurité et vos préférences de base.
        </p>

        <h2>2. Les options que vous pouvez choisir</h2>
        <ul>
          <li><strong>Mesure d&apos;audience</strong> : statistiques limitées pour améliorer l&apos;expérience.</li>
          <li><strong>Marketing</strong> : communications promotionnelles futures, seulement si vous l&apos;autorisez.</li>
        </ul>

        <h2>3. Choisir en un geste</h2>
        <p>
          Vous pouvez modifier vos choix à tout moment via la bannière ou ci-dessous.
        </p>

        <CookieManager />

        <h2>4. Si vous refusez</h2>
        <p>
          Le refus des cookies non essentiels n&apos;empêche pas l&apos;accès au service principal.
        </p>
      </LegalLayout>
    </>
  )
}
