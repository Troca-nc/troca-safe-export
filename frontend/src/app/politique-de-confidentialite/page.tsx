import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Politique de confidentialitï¿½ - Kalico',
  description: 'Politique de confidentialitï¿½ et protection des donnï¿½es personnelles de Kalico.',
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
    label: 'Identitï¿½ et compte',
    examples: 'Email, prï¿½nom, nom, tï¿½lï¿½phone, avatar, mot de passe hachï¿½, type de compte, rï¿½le demo, compte particulier ou Pro',
    purpose: 'Crï¿½ation de compte, authentification, sÃ©curitÃ©, rï¿½cupï¿½ration de session et assistance.',
    basis: 'Contrat, intï¿½rï¿½t lï¿½gitime, obligation lï¿½gale',
    retention: 'Durï¿½e du compte + dï¿½lais lï¿½gaux applicables',
  },
  {
    label: 'Profil et activitï¿½ Pro',
    examples: 'CatÃ©gorie Pro, entreprise, site web, horaires, commune, logo, banniï¿½re, vitrine, catalogue, stocks, disponibilitï¿½s, documents Pro',
    purpose: 'Afficher lespace professionnel, permettre la dï¿½couverte des prestations et gï¿½rer les outils Pro.',
    basis: 'Contrat',
    retention: 'Durï¿½e du compte Pro + suppression / archivage selon les obligations',
  },
  {
    label: 'Contenus publiï¿½s',
    examples: 'Annonces, images, bons plans, ï¿½vï¿½nements, covoiturage, envoi-livraison, appels doffres, devis, rï¿½ponses et piï¿½ces jointes',
    purpose: 'Publier, consulter, filtrer, mettre en avant et modï¿½rer les contenus du marchï¿½ Kalico.',
    basis: 'Contrat',
    retention: 'Durï¿½e de vie du contenu + suppression manuelle ou automatique',
  },
  {
    label: 'Transactions et facturation',
    examples: 'Paiements, abonnements, boosts, campagnes publicitaires, commandes, factures, identifiants Stripe / PayPlug',
    purpose: 'Gï¿½rer les achats, les abonnements, la visibilitï¿½ sponsorisï¿½e et les obligations comptables.',
    basis: 'Contrat, obligation lï¿½gale',
    retention: 'Selon les obligations comptables et la durï¿½e dexploitation du service',
  },
  {
    label: 'Messages et notifications',
    examples: 'Messages privï¿½s, notifications in-app, email, SMS, push, prï¿½fï¿½rences de notification, tokens push',
    purpose: 'ï¿½changer entre utilisateurs, prï¿½venir des rï¿½ponses, confirmer des opï¿½rations et gï¿½rer les alertes choisies.',
    basis: 'Contrat, consentement',
    retention: 'Durï¿½e du compte, retrait du consentement ou dï¿½sabonnement',
  },
  {
    label: 'Devis, appels doffres et fret',
    examples: 'Demandes, offres, sï¿½lections, statuts, coordonnï¿½es de contact, historique des rï¿½ponses, transporteurs et prestataires concernï¿½s',
    purpose: 'Mettre en relation les demandeurs et les professionnels pour les devis, appels doffres et transports.',
    basis: 'Contrat',
    retention: 'Durï¿½e de la relation puis archivage conforme aux dï¿½lais lï¿½gaux',
  },
  {
    label: 'Prï¿½fï¿½rences et parcours',
    examples: 'tours_seen, mode dï¿½mo, consentements cookies, prï¿½fï¿½rences de notifications, Ãtat de session, stockage local',
    purpose: 'Mï¿½moriser les visites guidï¿½es, ï¿½viter les rï¿½pï¿½titions et conserver vos choix de confort dutilisation.',
    basis: 'Consentement, intï¿½rï¿½t lï¿½gitime',
    retention: 'Jusquau retrait du consentement ou ï¿½ la suppression du compte',
  },
  {
    label: 'Sï¿½curitï¿½ et logs techniques',
    examples: 'Adresse IP, journaux techniques, traces derreur, anti-fraude, webhooks vï¿½rifiï¿½s, horodatages',
    purpose: 'Sï¿½curiser la plateforme, prï¿½venir les abus, diagnostiquer les incidents et assurer la traï¿½abilitï¿½.',
    basis: 'Intï¿½rï¿½t lï¿½gitime, obligation lï¿½gale',
    retention: 'De quelques jours ï¿½ quelques mois selon le journal concernï¿½',
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
      <LegalLayout title="Politique de confidentialitï¿½" lastUpdated={LAST_UPDATE}>
        <p>
          Kalico collecte uniquement les donnï¿½es nï¿½cessaires pour faire fonctionner la plateforme, sï¿½curiser les comptes, permettre les ï¿½changes
          entre particuliers et professionnels, gï¿½rer les paiements, les notifications et les services optionnels comme la publicitï¿½, les devis,
          le fret, les appels doffres et les tours de visite guidï¿½e.
        </p>

        <h2>1. Responsable de traitement</h2>
        <p>
          Kalico (forme juridique et RIDET ï¿½ renseigner avant publication) est responsable du traitement de vos donnï¿½es personnelles.
        </p>
        <p>
          Contact vie privï¿½e : <a href="mailto:privacy@kalico.nc">privacy@kalico.nc</a>
        </p>

        <h2>2. Donnï¿½es collectï¿½es</h2>
        <table>
          <thead>
            <tr>
              <th>Donnï¿½e</th>
              <th>Exemples</th>
              <th>Pourquoi</th>
              <th>Base lï¿½gale</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <DataRow key={row.label} {...row} />
            ))}
          </tbody>
        </table>

        <h2>3. Finalitï¿½s</h2>
        <ul>
          <li>Crï¿½er et sï¿½curiser votre compte.</li>
          <li>Publier et consulter des annonces, du troc, du covoiturage, des bons plans et des ï¿½vï¿½nements.</li>
          <li>Faire fonctionner les outils Pro, les vitrines, les stocks, les calendriers de rendez-vous et les disponibilitï¿½s.</li>
          <li>Traiter les demandes de devis, les appels doffres et les demandes de fret / livraison.</li>
          <li>Gï¿½rer les abonnements, les paiements et les campagnes de visibilitï¿½ sponsorisï¿½e.</li>
          <li>Envoyer les notifications transactionnelles, les SMS utiles, les emails et les push liï¿½s au service.</li>
          <li>Afficher les tours de visite guidï¿½e et mï¿½moriser ce qui a dï¿½jï¿½ ï¿½tï¿½ vu.</li>
          <li>Modï¿½rer les contenus, prï¿½venir la fraude et rï¿½pondre aux obligations lï¿½gales.</li>
        </ul>

        <h2>4. Destinataires et sous-traitants</h2>
        <p>Kalico ne vend pas vos donnï¿½es. Elles peuvent ï¿½tre transmises aux prestataires nï¿½cessaires au fonctionnement du service :</p>
        <ul>
          <li>Hï¿½bergement et stockage : AWS et linfrastructure dhï¿½bergement configurï¿½e par Kalico.</li>
          <li>Paiements : Stripe et PayPlug.</li>
          <li>SMS et vï¿½rification tï¿½lï¿½phonique : Twilio.</li>
          <li>Notifications push : Expo.</li>
          <li>Envoi demails transactionnels : le service SMTP configurï¿½ par Kalico.</li>
        </ul>

        <h2>5. Transferts hors Nouvelle-CalÃ©donie</h2>
        <p>
          Certains prestataires techniques peuvent traiter des donnï¿½es depuis lï¿½tranger. Kalico limite ces transferts aux besoins strictement
          nï¿½cessaires au service et sappuie sur les garanties contractuelles disponibles chez ces prestataires.
        </p>

        <h2>6. Vos droits</h2>
        <p>
          Vous disposez des droits daccï¿½s, de rectification, deffacement, de portabilitï¿½, dopposition et de limitation. Pour les exercer,
          ï¿½crivez ï¿½ <a href="mailto:privacy@kalico.nc">privacy@kalico.nc</a>.
        </p>

        <h2>7. Cookies et stockage local</h2>
        <p>
          Voir la <a href="/politique-cookies">politique cookies</a> pour gï¿½rer vos choix. Kalico peut aussi utiliser le stockage local du navigateur
          pour retenir une fermeture de popup, vos tours dï¿½jï¿½ vus ou certains rï¿½glages de session.
        </p>

        <h2>8. Notifications, emails, SMS et push</h2>
        <p>
          Kalico envoie des notifications transactionnelles lorsque cela est nï¿½cessaire au fonctionnement du service : nouveaux messages, rï¿½ponses
          ï¿½ une annonce, devis reï¿½us, appels doffres, fret, confirmation de paiement ou de rï¿½servation, sÃ©curitÃ© du compte et rappels utiles.
        </p>
        <p>
          Les alertes de recherche, les rapports de performance, les notifications promotionnelles ou publicitaires et certains rappels Pro sont
          gï¿½rï¿½s via vos prï¿½fï¿½rences et peuvent ï¿½tre modifiï¿½s ï¿½ tout moment depuis les paramï¿½tres.
        </p>

        <h2>9. Sï¿½curitï¿½</h2>
        <p>
          Les mots de passe sont hachï¿½s, les webhooks sont vï¿½rifiï¿½s, les logs sont minimisï¿½s et les accï¿½s aux donnï¿½es sensibles sont limitï¿½s aux
          services qui en ont besoin pour fonctionner.
        </p>

        <h2>10. Durï¿½e de conservation</h2>
        <p>
          Les durï¿½es de conservation varient selon la nature des donnï¿½es et les obligations lï¿½gales applicables. Lorsquun compte est supprimï¿½,
          certaines donnï¿½es peuvent ï¿½tre anonymisï¿½es ou conservï¿½es temporairement pour des raisons lï¿½gales, comptables ou de sÃ©curitÃ©.
        </p>
      </LegalLayout>
    </>
  )
}
