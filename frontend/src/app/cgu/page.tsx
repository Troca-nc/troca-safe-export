import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'CGU — Kalico',
  description: "Conditions générales d'utilisation de Kalico.",
}

const LAST_UPDATE = '10 juillet 2026'

export default function CguPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Conditions générales d'utilisation" lastUpdated={LAST_UPDATE}>
        <p>
          Les présentes CGU régissent l’accès et l’utilisation de Kalico, plateforme de petites annonces, troc, covoiturage, bons plans,
          événements, services, devis, appels d’offres, fret / livraison et outils professionnels associés.
        </p>

        <h2>1. Rôle de la plateforme</h2>
        <p>
          Kalico est un intermédiaire technique. La plateforme met en relation des utilisateurs, diffuse des contenus et facilite certains
          services de visibilité, de prise de contact, de réservation et de demande d’offres. Kalico n’est pas partie aux contrats conclus
          entre utilisateurs, particuliers ou professionnels.
        </p>

        <h2>2. Création et gestion du compte</h2>
        <p>
          L’utilisateur s’engage à fournir des informations exactes et à maintenir ses coordonnées à jour. Un compte peut être utilisé comme
          particulier, comme professionnel, ou dans les deux contextes selon les fonctionnalités activées.
        </p>
        <p>
          L’utilisateur reste responsable de la confidentialité de son compte, de ses identifiants et des accès à son espace.
        </p>

        <h2>3. Contenus publiés</h2>
        <p>
          L’utilisateur est seul responsable des contenus qu’il publie : textes, photos, documents, annonces, devis, demandes, réponses,
          commentaires, avis, messages et pièces jointes.
        </p>
        <p>
          Les contenus doivent être loyaux, exacts, licites et ne pas porter atteinte aux droits de tiers. Kalico peut modérer, masquer,
          retirer ou suspendre tout contenu manifestement contraire à la loi, aux présentes CGU ou aux intérêts de la communauté.
        </p>

        <h2>4. Annonces, troc et covoiturage</h2>
        <p>
          Les annonces de vente, de location ou de service doivent décrire correctement le bien ou la prestation proposée. Pour le troc,
          l’utilisateur reste responsable des objets échangés, du complément éventuel en XPF et de la remise effective.
        </p>
        <p>
          Le covoiturage publié sur Kalico relève d’un usage entre particuliers ou, lorsque l’interface le permet, d’un transport déclaré par
          un professionnel autorisé. L’utilisateur doit s’assurer du respect de la réglementation applicable, de l’assurance et des règles
          de sécurité.
        </p>

        <h2>5. Bons plans, publicité et visibilité sponsorisée</h2>
        <p>
          Les bons plans, bannières de catégorie, popups homepage et autres campagnes de visibilité sont des services payants ou sponsorisés.
          Les tarifs, durées, règles de diffusion, files d’attente et éventuelles limitations de publication sont précisés dans l’espace
          professionnel ou dans les CGV applicables.
        </p>
        <p>
          Kalico ne garantit ni la disponibilité des stocks, ni l’exactitude commerciale, ni les résultats de performance des campagnes.
        </p>

        <h2>6. Devis, appels d’offres, fret et envoi-livraison</h2>
        <p>
          Les fonctionnalités de devis, d’appels d’offres, d’envoi / livraison et de fret servent à mettre en relation un demandeur et un
          professionnel. L’utilisateur reste responsable de la vérification des informations échangées, des prix proposés, des délais,
          des conditions de prise en charge et du déroulement de la prestation.
        </p>
        <p>
          Kalico peut afficher des offres, recevoir des demandes, transmettre des notifications et permettre la sélection manuelle d’une
          offre, mais n’intervient ni dans le contrat, ni dans la facturation finale, ni dans l’exécution concrète de la prestation.
        </p>

        <h2>7. Espace professionnel</h2>
        <p>
          L’espace Pro permet de créer une vitrine, publier des produits ou services, gérer un catalogue, des stocks, des disponibilités,
          des rendez-vous, des documents, des campagnes publicitaires, des réponses aux demandes et d’autres outils métiers.
        </p>
        <p>
          Le professionnel s’engage à détenir les autorisations nécessaires à son activité et à fournir des informations exactes sur son
          entreprise, ses coordonnées, ses horaires et ses prestations.
        </p>

        <h2>8. Notifications et communications</h2>
        <p>
          Kalico peut envoyer des notifications in-app, emails, SMS et push lorsque cela est nécessaire au fonctionnement du service :
          inscriptions, confirmations, messages, réponses à des demandes, rendez-vous, confirmations de paiement, sécurité du compte,
          ou informations utiles liées aux fonctionnalités activées.
        </p>
        <p>
          Certaines communications promotionnelles ou de suivi sont soumises aux préférences de l’utilisateur et peuvent être retirées
          à tout moment dans les paramètres.
        </p>

        <h2>9. Avis, signalements et modération</h2>
        <p>
          Les avis doivent refléter une expérience réelle. Les signalements peuvent être examinés par Kalico afin de protéger la communauté,
          prévenir les abus et faire respecter les présentes CGU.
        </p>

        <h2>10. Services payants</h2>
        <p>
          Les abonnements Pro, packs de lancement, boosts, campagnes publicitaires, services de visibilité et fonctionnalités payantes sont
          soumis aux CGV, aux conditions affichées lors de l’achat et aux éventuelles règles de facturation du prestataire de paiement.
        </p>

        <h2>11. Interdictions</h2>
        <ul>
          <li>Publier des contenus illicites, trompeurs, diffamatoires, haineux ou frauduleux.</li>
          <li>Contourner les règles de publication, de modération ou de paiement.</li>
          <li>Usurper l’identité d’un tiers ou créer de faux comptes.</li>
          <li>Extraire, scraper ou réutiliser les données de la plateforme de manière non autorisée.</li>
          <li>Utiliser Kalico pour des usages contraires à la loi ou à la sécurité des autres utilisateurs.</li>
        </ul>

        <h2>12. Responsabilité</h2>
        <p>
          Kalico ne peut être tenue responsable des litiges entre utilisateurs, de l’exécution des contrats, de la qualité des biens ou
          services, ni des dommages indirects, dans la limite autorisée par la loi.
        </p>

        <h2>13. Suspension et résiliation</h2>
        <p>
          Kalico peut suspendre ou résilier un compte en cas de non-respect des CGU, de comportement abusif, d’usage frauduleux ou de
          nécessité de sécurité. L’utilisateur peut également demander la suppression de son compte via les paramètres.
        </p>

        <h2>14. Données personnelles</h2>
        <p>
          Le traitement des données personnelles est décrit dans la politique de confidentialité et la politique cookies de Kalico, qui
          font partie intégrante de l’environnement juridique du service.
        </p>

        <h2>15. Droit applicable</h2>
        <p>
          Les présentes CGU sont soumises au droit applicable en Nouvelle-Calédonie et, le cas échéant, au droit français pour les matières
          relevant de ce cadre.
        </p>
      </LegalLayout>
    </>
  )
}
