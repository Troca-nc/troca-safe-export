import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Politique de confidentialité - Kalico',
  description: 'Politique de confidentialité et protection des données personnelles de Kalico.',
}

const LAST_UPDATE = '10 juillet 2026'

type DataRowProps = {
  label: string
  examples: string
  purpose: string
  basis: string
  retention: string
}

const rows: DataRowProps[] = [
  {
    label: 'Identité et compte',
    examples: 'Email, prénom, nom, téléphone, avatar, mot de passe haché, type de compte, rôle demo, compte particulier ou Pro',
    purpose: 'Création de compte, authentification, sécurité, récupération de session et assistance.',
    basis: 'Contrat, intérêt légitime, obligation légale',
    retention: 'Durée du compte + délais légaux applicables',
  },
  {
    label: 'Profil et activité Pro',
    examples: 'Catégorie Pro, entreprise, site web, horaires, commune, logo, bannière, vitrine, catalogue, stocks, disponibilités, documents Pro',
    purpose: 'Afficher l’espace professionnel, permettre la découverte des prestations et gérer les outils Pro.',
    basis: 'Contrat',
    retention: 'Durée du compte Pro + suppression / archivage selon les obligations',
  },
  {
    label: 'Contenus publiés',
    examples: 'Annonces, images, bons plans, événements, covoiturage, envoi-livraison, appels d’offres, devis, réponses et pièces jointes',
    purpose: 'Publier, consulter, filtrer, mettre en avant et modérer les contenus du marché Kalico.',
    basis: 'Contrat',
    retention: 'Durée de vie du contenu + suppression manuelle ou automatique',
  },
  {
    label: 'Transactions et facturation',
    examples: 'Paiements, abonnements, boosts, campagnes publicitaires, commandes, factures, identifiants Stripe / PayPlug',
    purpose: 'Gérer les achats, les abonnements, la visibilité sponsorisée et les obligations comptables.',
    basis: 'Contrat, obligation légale',
    retention: 'Selon les obligations comptables et la durée d’exploitation du service',
  },
  {
    label: 'Messages et notifications',
    examples: 'Messages privés, notifications in-app, email, SMS, push, préférences de notification, tokens push',
    purpose: 'Échanger entre utilisateurs, prévenir des réponses, confirmer des opérations et gérer les alertes choisies.',
    basis: 'Contrat, consentement',
    retention: 'Durée du compte, retrait du consentement ou désabonnement',
  },
  {
    label: 'Devis, appels d’offres et fret',
    examples: 'Demandes, offres, sélections, statuts, coordonnées de contact, historique des réponses, transporteurs et prestataires concernés',
    purpose: 'Mettre en relation les demandeurs et les professionnels pour les devis, appels d’offres et transports.',
    basis: 'Contrat',
    retention: 'Durée de la relation puis archivage conforme aux délais légaux',
  },
  {
    label: 'Préférences et parcours',
    examples: 'tours_seen, mode démo, consentements cookies, préférences de notifications, état de session, stockage local',
    purpose: 'Mémoriser les visites guidées, éviter les répétitions et conserver vos choix de confort d’utilisation.',
    basis: 'Consentement, intérêt légitime',
    retention: 'Jusqu’au retrait du consentement ou à la suppression du compte',
  },
  {
    label: 'Sécurité et logs techniques',
    examples: 'Adresse IP, journaux techniques, traces d’erreur, anti-fraude, webhooks vérifiés, horodatages',
    purpose: 'Sécuriser la plateforme, prévenir les abus, diagnostiquer les incidents et assurer la traçabilité.',
    basis: 'Intérêt légitime, obligation légale',
    retention: 'De quelques jours à quelques mois selon le journal concerné',
  },
]

function DataRow({ label, examples, purpose, basis, retention }: DataRowProps) {
  return (
    <tr>
      <td>{label}</td>
      <td>{examples}</td>
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
          Kalico collecte uniquement les données nécessaires pour faire fonctionner la plateforme, sécuriser les comptes, permettre les échanges
          entre particuliers et professionnels, gérer les paiements, les notifications et les services optionnels comme la publicité, les devis,
          le fret, les appels d’offres et les tours de visite guidée.
        </p>

        <h2>1. Responsable de traitement</h2>
        <p>
          Kalico (forme juridique et RIDET à renseigner avant publication) est responsable du traitement de vos données personnelles.
        </p>
        <p>
          Contact vie privée : <a href="mailto:privacy@kalico.nc">privacy@kalico.nc</a>
        </p>

        <h2>2. Données collectées</h2>
        <table>
          <thead>
            <tr>
              <th>Donnée</th>
              <th>Exemples</th>
              <th>Pourquoi</th>
              <th>Base légale</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <DataRow key={row.label} {...row} />
            ))}
          </tbody>
        </table>

        <h2>3. Finalités</h2>
        <ul>
          <li>Créer et sécuriser votre compte.</li>
          <li>Publier et consulter des annonces, du troc, du covoiturage, des bons plans et des événements.</li>
          <li>Faire fonctionner les outils Pro, les vitrines, les stocks, les calendriers de rendez-vous et les disponibilités.</li>
          <li>Traiter les demandes de devis, les appels d’offres et les demandes de fret / livraison.</li>
          <li>Gérer les abonnements, les paiements et les campagnes de visibilité sponsorisée.</li>
          <li>Envoyer les notifications transactionnelles, les SMS utiles, les emails et les push liés au service.</li>
          <li>Afficher les tours de visite guidée et mémoriser ce qui a déjà été vu.</li>
          <li>Modérer les contenus, prévenir la fraude et répondre aux obligations légales.</li>
        </ul>

        <h2>4. Destinataires et sous-traitants</h2>
        <p>Kalico ne vend pas vos données. Elles peuvent être transmises aux prestataires nécessaires au fonctionnement du service :</p>
        <ul>
          <li>Hébergement et stockage : AWS et l’infrastructure d’hébergement configurée par Kalico.</li>
          <li>Paiements : Stripe et PayPlug.</li>
          <li>SMS et vérification téléphonique : Twilio.</li>
          <li>Notifications push : Expo.</li>
          <li>Envoi d’emails transactionnels : le service SMTP configuré par Kalico.</li>
        </ul>

        <h2>5. Transferts hors Nouvelle-Calédonie</h2>
        <p>
          Certains prestataires techniques peuvent traiter des données depuis l’étranger. Kalico limite ces transferts aux besoins strictement
          nécessaires au service et s’appuie sur les garanties contractuelles disponibles chez ces prestataires.
        </p>

        <h2>6. Vos droits</h2>
        <p>
          Vous disposez des droits d’accès, de rectification, d’effacement, de portabilité, d’opposition et de limitation. Pour les exercer,
          écrivez à <a href="mailto:privacy@kalico.nc">privacy@kalico.nc</a>.
        </p>

        <h2>7. Cookies et stockage local</h2>
        <p>
          Voir la <a href="/politique-cookies">politique cookies</a> pour gérer vos choix. Kalico peut aussi utiliser le stockage local du navigateur
          pour retenir une fermeture de popup, vos tours déjà vus ou certains réglages de session.
        </p>

        <h2>8. Notifications, emails, SMS et push</h2>
        <p>
          Kalico envoie des notifications transactionnelles lorsque cela est nécessaire au fonctionnement du service : nouveaux messages, réponses
          à une annonce, devis reçus, appels d’offres, fret, confirmation de paiement ou de réservation, sécurité du compte et rappels utiles.
        </p>
        <p>
          Les alertes de recherche, les rapports de performance, les notifications promotionnelles ou publicitaires et certains rappels Pro sont
          gérés via vos préférences et peuvent être modifiés à tout moment depuis les paramètres.
        </p>

        <h2>9. Sécurité</h2>
        <p>
          Les mots de passe sont hachés, les webhooks sont vérifiés, les logs sont minimisés et les accès aux données sensibles sont limités aux
          services qui en ont besoin pour fonctionner.
        </p>

        <h2>10. Durée de conservation</h2>
        <p>
          Les durées de conservation varient selon la nature des données et les obligations légales applicables. Lorsqu’un compte est supprimé,
          certaines données peuvent être anonymisées ou conservées temporairement pour des raisons légales, comptables ou de sécurité.
        </p>
      </LegalLayout>
    </>
  )
}
