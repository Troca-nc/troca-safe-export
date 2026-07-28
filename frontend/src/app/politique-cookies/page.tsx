import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'
import CookieManager from '@/components/legal/CookieManager'

export const metadata: Metadata = {
  title: 'Cookies — Kalico',
  description: 'Gestion des cookies, du stockage local et des préférences de consentement de Kalico.',
}

const LAST_UPDATE = '10 juillet 2026'

export default function PolitiqueCookiesPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Cookies" lastUpdated={LAST_UPDATE}>
        <p className="text-base leading-relaxed text-night/70">
          Kalico utilise des cookies essentiels et, selon vos choix, des cookies de mesure d’audience et de marketing. Nous utilisons aussi
          parfois le stockage local du navigateur pour retenir des préférences utiles comme la fermeture d’un popup, les tours déjà vus ou
          certains réglages de session.
        </p>

        <h2>1. Ce qui reste actif</h2>
        <p>
          Les cookies essentiels sont nécessaires au fonctionnement du site. Ils gèrent la connexion, la sécurité, le maintien de session et
          certaines préférences techniques.
        </p>

        <h2>2. Ce que vous pouvez choisir</h2>
        <ul>
          <li><strong>Mesure d’audience</strong> : statistiques limitées pour améliorer l’expérience et suivre les performances du site.</li>
          <li><strong>Marketing</strong> : suivi des campagnes et communications promotionnelles, uniquement si vous l’autorisez.</li>
        </ul>

        <h2>3. Stockage local et préférences</h2>
        <p>
          Kalico peut utiliser sessionStorage ou localStorage pour des usages fonctionnels limités : mémoriser qu’une popup a déjà été vue,
          conserver un tour de visite guidée ou garder un état de navigation utile. Ces données restent dans votre navigateur et peuvent être
          supprimées depuis vos paramètres ou votre navigateur.
        </p>

        <h2>4. Gérer en un geste</h2>
        <p>
          Vous pouvez modifier vos choix à tout moment via la bannière ci-dessous ou dans vos paramètres de confidentialité.
        </p>

        <CookieManager />

        <h2>5. Si vous refusez</h2>
        <p>
          Le refus des cookies non essentiels n’empêche pas l’accès au service principal. Les fonctionnalités de base restent disponibles.
        </p>
      </LegalLayout>
    </>
  )
}
