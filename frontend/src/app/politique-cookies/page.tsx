import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'
import CookieManager from '@/components/legal/CookieManager'

export const metadata: Metadata = {
  title: 'Cookies - Kalico',
  description: 'Gestion des cookies, du stockage local et des pr�f�rences de consentement de Kalico.',
}

const LAST_UPDATE = '10 juillet 2026'

export default function PolitiqueCookiesPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Cookies" lastUpdated={LAST_UPDATE}>
        <p className="text-base leading-relaxed text-night/70">
          Kalico utilise des cookies essentiels et, selon vos choix, des cookies de mesure daudience et de marketing. Nous utilisons aussi
          parfois le stockage local du navigateur pour retenir des pr�f�rences utiles comme la fermeture dun popup, les tours d�j� vus ou
          certains r�glages de session.
        </p>

        <h2>1. Ce qui reste actif</h2>
        <p>
          Les cookies essentiels sont n�cessaires au fonctionnement du site. Ils g�rent la connexion, la sécurité, le maintien de session et
          certaines pr�f�rences techniques.
        </p>

        <h2>2. Ce que vous pouvez choisir</h2>
        <ul>
          <li><strong>Mesure daudience</strong> : statistiques limit�es pour am�liorer lexp�rience et suivre les performances du site.</li>
          <li><strong>Marketing</strong> : suivi des campagnes et communications promotionnelles, uniquement si vous lautorisez.</li>
        </ul>

        <h2>3. Stockage local et pr�f�rences</h2>
        <p>
          Kalico peut utiliser sessionStorage ou localStorage pour des usages fonctionnels limit�s : m�moriser quune popup a d�j� �t� vue,
          conserver un tour de visite guid�e ou garder un État de navigation utile. Ces donn�es restent dans votre navigateur et peuvent �tre
          supprim�es depuis vos param�tres ou votre navigateur.
        </p>

        <h2>4. G�rer en un geste</h2>
        <p>
          Vous pouvez modifier vos choix � tout moment via la banni�re ci-dessous ou dans vos param�tres de confidentialit�.
        </p>

        <CookieManager />

        <h2>5. Si vous refusez</h2>
        <p>
          Le refus des cookies non essentiels nemp�che pas lacc�s au service principal. Les fonctionnalit�s de base restent disponibles.
        </p>
      </LegalLayout>
    </>
  )
}
