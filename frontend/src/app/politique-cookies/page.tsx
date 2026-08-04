import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'
import CookieManager from '@/components/legal/CookieManager'

export const metadata: Metadata = {
  title: 'Cookies - Kalico',
  description: 'Gestion des cookies, du stockage local et des prï¿½fï¿½rences de consentement de Kalico.',
}

const LAST_UPDATE = '10 juillet 2026'

export default function PolitiqueCookiesPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Cookies" lastUpdated={LAST_UPDATE}>
        <p className="text-base leading-relaxed text-night/70">
          Kalico utilise des cookies essentiels et, selon vos choix, des cookies de mesure daudience et de marketing. Nous utilisons aussi
          parfois le stockage local du navigateur pour retenir des prï¿½fï¿½rences utiles comme la fermeture dun popup, les tours dï¿½jï¿½ vus ou
          certains rï¿½glages de session.
        </p>

        <h2>1. Ce qui reste actif</h2>
        <p>
          Les cookies essentiels sont nï¿½cessaires au fonctionnement du site. Ils gï¿½rent la connexion, la sÃ©curitÃ©, le maintien de session et
          certaines prï¿½fï¿½rences techniques.
        </p>

        <h2>2. Ce que vous pouvez choisir</h2>
        <ul>
          <li><strong>Mesure daudience</strong> : statistiques limitï¿½es pour amï¿½liorer lexpï¿½rience et suivre les performances du site.</li>
          <li><strong>Marketing</strong> : suivi des campagnes et communications promotionnelles, uniquement si vous lautorisez.</li>
        </ul>

        <h2>3. Stockage local et prï¿½fï¿½rences</h2>
        <p>
          Kalico peut utiliser sessionStorage ou localStorage pour des usages fonctionnels limitï¿½s : mï¿½moriser quune popup a dï¿½jï¿½ ï¿½tï¿½ vue,
          conserver un tour de visite guidï¿½e ou garder un Ãtat de navigation utile. Ces donnï¿½es restent dans votre navigateur et peuvent ï¿½tre
          supprimï¿½es depuis vos paramï¿½tres ou votre navigateur.
        </p>

        <h2>4. Gï¿½rer en un geste</h2>
        <p>
          Vous pouvez modifier vos choix ï¿½ tout moment via la banniï¿½re ci-dessous ou dans vos paramï¿½tres de confidentialitï¿½.
        </p>

        <CookieManager />

        <h2>5. Si vous refusez</h2>
        <p>
          Le refus des cookies non essentiels nempï¿½che pas laccï¿½s au service principal. Les fonctionnalitï¿½s de base restent disponibles.
        </p>
      </LegalLayout>
    </>
  )
}
