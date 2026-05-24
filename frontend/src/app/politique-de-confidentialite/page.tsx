import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Troca',
  description: 'Politique de confidentialité et protection des données personnelles de Troca.',
}

const LAST_UPDATE = '25 mai 2026'

const rows = [
  ['Email', 'Création de compte, notifications', 'Contrat', 'Durée du compte + 3 ans'],
  ['Téléphone', 'Vérification SMS et confiance', 'Contrat', 'Durée du compte'],
  ['Photos et annonces', 'Publication des annonces, bons plans et profils', 'Contrat', 'Durée de vie du contenu + suppression'],
  ['Messages', 'Messagerie et support', 'Contrat', '2 ans après le dernier échange'],
  ['Paiements', 'Abonnements Pro, boosts, bons plans, badge conducteur', 'Contrat / obligation légale', 'Selon les obligations comptables'],
  ['IP et logs techniques', 'Sécurité et prévention des abus', 'Intérêt légitime', '30 jours à 7 jours selon le log'],
  ['Tokens push', 'Notifications mobiles', 'Contrat / consentement', 'Jusqu’à retrait ou suppression du compte'],
  ['Avis et alertes', 'Favoris, avis, alertes de recherche et alertes trajet', 'Contrat / consentement', 'Durée du compte'],
]

function DataRow({ label, purpose, basis, retention }: { label: string; purpose: string; basis: string; retention: string }) {
  return (
    <tr>
      <td>{label}</td>
      <td>{purpose}</td>
      <td>{basis}</td>
      <td>{retention}</td>
    </tr>
  )
}

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <Header />
      <LegalLayout title="Politique de confidentialité" lastUpdated={LAST_UPDATE}>
        <p>
          Troca collecte et traite uniquement les données nécessaires à la fourniture, à la sécurité et à l’amélioration du service.
        </p>

        <h2>1. Responsable de traitement</h2>
        <p>
          Troca ([À COMPLÉTER — forme juridique], RIDET [À COMPLÉTER]) est responsable du traitement de vos données personnelles.
        </p>
        <p>
          Contact vie privée : <a href="mailto:privacy@troca.nc">privacy@troca.nc</a>
        </p>

        <h2>2. Données collectées</h2>
        <table>
          <thead>
            <tr>
              <th>Donnée</th>
              <th>Pourquoi</th>
              <th>Base légale</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, purpose, basis, retention]) => (
              <DataRow key={label} label={label} purpose={purpose} basis={basis} retention={retention} />
            ))}
          </tbody>
        </table>

        <h2>3. Finalités</h2>
        <ul>
          <li>Créer et sécuriser votre compte.</li>
          <li>Publier et consulter des annonces classiques, troc, covoiturage, services, locations, immobilier et bons plans.</li>
          <li>Gérer les abonnements Pro, les boosts, le badge conducteur et les paiements.</li>
          <li>Envoyer les notifications utiles au fonctionnement du service.</li>
          <li>Modérer les contenus et prévenir la fraude.</li>
        </ul>

        <h2>4. Partage des données</h2>
        <p>Troca ne vend pas vos données. Elles peuvent être partagées avec les prestataires indispensables au service :</p>
        <ul>
          <li>Stripe et PayPlug pour les paiements.</li>
          <li>Twilio pour les vérifications SMS.</li>
          <li>AWS pour l’hébergement et le stockage des fichiers.</li>
          <li>Expo pour les notifications push mobiles.</li>
        </ul>

        <h2>5. Vos droits</h2>
        <p>
          Vous disposez des droits d’accès, rectification, effacement, portabilité, opposition et limitation. Pour les exercer, écrivez à
          <a href="mailto:privacy@troca.nc"> privacy@troca.nc</a>.
        </p>

        <h2>6. Sécurité</h2>
        <p>
          Les mots de passe sont hachés, les fichiers sensibles restent privés, les webhooks sont vérifiés et les logs sont minimisés.
        </p>

        <h2>7. Cookies</h2>
        <p>
          Voir la <a href="/politique-cookies">politique cookies</a> et les préférences enregistrables à tout moment.
        </p>
      </LegalLayout>
    </>
  )
}
