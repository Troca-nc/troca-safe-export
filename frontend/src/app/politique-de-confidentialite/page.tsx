import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Politique de confidentialit� - Kalico',
  description: 'Politique de confidentialit� et protection des donn�es personnelles de Kalico.',
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
    label: 'Identit� et compte',
    examples: 'Email, pr�nom, nom, t�l�phone, avatar, mot de passe hach�, type de compte, r�le demo, compte particulier ou Pro',
    purpose: 'Cr�ation de compte, authentification, s�curit�, r�cup�ration de session et assistance.',
    basis: 'Contrat, int�r�t l�gitime, obligation l�gale',
    retention: 'Dur�e du compte + d�lais l�gaux applicables',
  },
  {
    label: 'Profil et activit� Pro',
    examples: 'Cat�gorie Pro, entreprise, site web, horaires, commune, logo, banni�re, vitrine, catalogue, stocks, disponibilit�s, documents Pro',
    purpose: 'Afficher lespace professionnel, permettre la d�couverte des prestations et g�rer les outils Pro.',
    basis: 'Contrat',
    retention: 'Dur�e du compte Pro + suppression / archivage selon les obligations',
  },
  {
    label: 'Contenus publi�s',
    examples: 'Annonces, images, bons plans, �v�nements, covoiturage, envoi-livraison, appels doffres, devis, r�ponses et pi�ces jointes',
    purpose: 'Publier, consulter, filtrer, mettre en avant et mod�rer les contenus du march� Kalico.',
    basis: 'Contrat',
    retention: 'Dur�e de vie du contenu + suppression manuelle ou automatique',
  },
  {
    label: 'Transactions et facturation',
    examples: 'Paiements, abonnements, boosts, campagnes publicitaires, commandes, factures, identifiants Stripe / PayPlug',
    purpose: 'G�rer les achats, les abonnements, la visibilit� sponsoris�e et les obligations comptables.',
    basis: 'Contrat, obligation l�gale',
    retention: 'Selon les obligations comptables et la dur�e dexploitation du service',
  },
  {
    label: 'Messages et notifications',
    examples: 'Messages priv�s, notifications in-app, email, SMS, push, pr�f�rences de notification, tokens push',
    purpose: '�changer entre utilisateurs, pr�venir des r�ponses, confirmer des op�rations et g�rer les alertes choisies.',
    basis: 'Contrat, consentement',
    retention: 'Dur�e du compte, retrait du consentement ou d�sabonnement',
  },
  {
    label: 'Devis, appels doffres et fret',
    examples: 'Demandes, offres, s�lections, statuts, coordonn�es de contact, historique des r�ponses, transporteurs et prestataires concern�s',
    purpose: 'Mettre en relation les demandeurs et les professionnels pour les devis, appels doffres et transports.',
    basis: 'Contrat',
    retention: 'Dur�e de la relation puis archivage conforme aux d�lais l�gaux',
  },
  {
    label: 'Pr�f�rences et parcours',
    examples: 'tours_seen, mode d�mo, consentements cookies, pr�f�rences de notifications, �tat de session, stockage local',
    purpose: 'M�moriser les visites guid�es, �viter les r�p�titions et conserver vos choix de confort dutilisation.',
    basis: 'Consentement, int�r�t l�gitime',
    retention: 'Jusquau retrait du consentement ou � la suppression du compte',
  },
  {
    label: 'S�curit� et logs techniques',
    examples: 'Adresse IP, journaux techniques, traces derreur, anti-fraude, webhooks v�rifi�s, horodatages',
    purpose: 'S�curiser la plateforme, pr�venir les abus, diagnostiquer les incidents et assurer la tra�abilit�.',
    basis: 'Int�r�t l�gitime, obligation l�gale',
    retention: 'De quelques jours � quelques mois selon le journal concern�',
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
      <LegalLayout title="Politique de confidentialit�" lastUpdated={LAST_UPDATE}>
        <p>
          Kalico collecte uniquement les donn�es n�cessaires pour faire fonctionner la plateforme, s�curiser les comptes, permettre les �changes
          entre particuliers et professionnels, g�rer les paiements, les notifications et les services optionnels comme la publicit�, les devis,
          le fret, les appels doffres et les tours de visite guid�e.
        </p>

        <h2>1. Responsable de traitement</h2>
        <p>
          Kalico (forme juridique et RIDET � renseigner avant publication) est responsable du traitement de vos donn�es personnelles.
        </p>
        <p>
          Contact vie priv�e : <a href="mailto:privacy@kalico.nc">privacy@kalico.nc</a>
        </p>

        <h2>2. Donn�es collect�es</h2>
        <table>
          <thead>
            <tr>
              <th>Donn�e</th>
              <th>Exemples</th>
              <th>Pourquoi</th>
              <th>Base l�gale</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <DataRow key={row.label} {...row} />
            ))}
          </tbody>
        </table>

        <h2>3. Finalit�s</h2>
        <ul>
          <li>Cr�er et s�curiser votre compte.</li>
          <li>Publier et consulter des annonces, du troc, du covoiturage, des bons plans et des �v�nements.</li>
          <li>Faire fonctionner les outils Pro, les vitrines, les stocks, les calendriers de rendez-vous et les disponibilit�s.</li>
          <li>Traiter les demandes de devis, les appels doffres et les demandes de fret / livraison.</li>
          <li>G�rer les abonnements, les paiements et les campagnes de visibilit� sponsoris�e.</li>
          <li>Envoyer les notifications transactionnelles, les SMS utiles, les emails et les push li�s au service.</li>
          <li>Afficher les tours de visite guid�e et m�moriser ce qui a d�j� �t� vu.</li>
          <li>Mod�rer les contenus, pr�venir la fraude et r�pondre aux obligations l�gales.</li>
        </ul>

        <h2>4. Destinataires et sous-traitants</h2>
        <p>Kalico ne vend pas vos donn�es. Elles peuvent �tre transmises aux prestataires n�cessaires au fonctionnement du service :</p>
        <ul>
          <li>H�bergement et stockage : AWS et linfrastructure dh�bergement configur�e par Kalico.</li>
          <li>Paiements : Stripe et PayPlug.</li>
          <li>SMS et v�rification t�l�phonique : Twilio.</li>
          <li>Notifications push : Expo.</li>
          <li>Envoi demails transactionnels : le service SMTP configur� par Kalico.</li>
        </ul>

        <h2>5. Transferts hors Nouvelle-Cal�donie</h2>
        <p>
          Certains prestataires techniques peuvent traiter des donn�es depuis l�tranger. Kalico limite ces transferts aux besoins strictement
          n�cessaires au service et sappuie sur les garanties contractuelles disponibles chez ces prestataires.
        </p>

        <h2>6. Vos droits</h2>
        <p>
          Vous disposez des droits dacc�s, de rectification, deffacement, de portabilit�, dopposition et de limitation. Pour les exercer,
          �crivez � <a href="mailto:privacy@kalico.nc">privacy@kalico.nc</a>.
        </p>

        <h2>7. Cookies et stockage local</h2>
        <p>
          Voir la <a href="/politique-cookies">politique cookies</a> pour g�rer vos choix. Kalico peut aussi utiliser le stockage local du navigateur
          pour retenir une fermeture de popup, vos tours d�j� vus ou certains r�glages de session.
        </p>

        <h2>8. Notifications, emails, SMS et push</h2>
        <p>
          Kalico envoie des notifications transactionnelles lorsque cela est n�cessaire au fonctionnement du service : nouveaux messages, r�ponses
          � une annonce, devis re�us, appels doffres, fret, confirmation de paiement ou de r�servation, s�curit� du compte et rappels utiles.
        </p>
        <p>
          Les alertes de recherche, les rapports de performance, les notifications promotionnelles ou publicitaires et certains rappels Pro sont
          g�r�s via vos pr�f�rences et peuvent �tre modifi�s � tout moment depuis les param�tres.
        </p>

        <h2>9. S�curit�</h2>
        <p>
          Les mots de passe sont hach�s, les webhooks sont v�rifi�s, les logs sont minimis�s et les acc�s aux donn�es sensibles sont limit�s aux
          services qui en ont besoin pour fonctionner.
        </p>

        <h2>10. Dur�e de conservation</h2>
        <p>
          Les dur�es de conservation varient selon la nature des donn�es et les obligations l�gales applicables. Lorsquun compte est supprim�,
          certaines donn�es peuvent �tre anonymis�es ou conserv�es temporairement pour des raisons l�gales, comptables ou de s�curit�.
        </p>
      </LegalLayout>
    </>
  )
}
