import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'CGU - Kalico',
  description: "Conditions gï¿½nï¿½rales d'utilisation de Kalico.",
}

const LAST_UPDATE = '10 juillet 2026'

export default function CguPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Conditions gï¿½nï¿½rales d'utilisation" lastUpdated={LAST_UPDATE}>
        <p>
          Les prï¿½sentes CGU rï¿½gissent laccï¿½s et lutilisation de Kalico, plateforme de petites annonces, troc, covoiturage, bons plans,
          ï¿½vï¿½nements, services, devis, appels doffres, fret / livraison et outils professionnels associï¿½s.
        </p>

        <h2>1. Rï¿½le de la plateforme</h2>
        <p>
          Kalico est un intermï¿½diaire technique. La plateforme met en relation des utilisateurs, diffuse des contenus et facilite certains
          services de visibilitï¿½, de prise de contact, de rï¿½servation et de demande doffres. Kalico nest pas partie aux contrats conclus
          entre utilisateurs, particuliers ou professionnels.
        </p>

        <h2>2. Crï¿½ation et gestion du compte</h2>
        <p>
          Lutilisateur sengage ï¿½ fournir des informations exactes et ï¿½ maintenir ses coordonnï¿½es ï¿½ jour. Un compte peut ï¿½tre utilisï¿½ comme
          particulier, comme professionnel, ou dans les deux contextes selon les fonctionnalitï¿½s activï¿½es.
        </p>
        <p>
          Lutilisateur reste responsable de la confidentialitï¿½ de son compte, de ses identifiants et des accï¿½s ï¿½ son espace.
        </p>

        <h2>3. Contenus publiï¿½s</h2>
        <p>
          Lutilisateur est seul responsable des contenus quil publie : textes, photos, documents, annonces, devis, demandes, rï¿½ponses,
          commentaires, avis, messages et piï¿½ces jointes.
        </p>
        <p>
          Les contenus doivent ï¿½tre loyaux, exacts, licites et ne pas porter atteinte aux droits de tiers. Kalico peut modï¿½rer, masquer,
          retirer ou suspendre tout contenu manifestement contraire ï¿½ la loi, aux prï¿½sentes CGU ou aux intï¿½rï¿½ts de la communautï¿½.
        </p>

        <h2>4. Annonces, troc et covoiturage</h2>
        <p>
          Les annonces de vente, de location ou de service doivent dï¿½crire correctement le bien ou la prestation proposï¿½e. Pour le troc,
          lutilisateur reste responsable des objets ï¿½changï¿½s, du complï¿½ment ï¿½ventuel en XPF et de la remise effective.
        </p>
        <p>
          Le covoiturage publiï¿½ sur Kalico relï¿½ve dun usage entre particuliers ou, lorsque linterface le permet, dun transport dï¿½clarï¿½ par
          un professionnel autorisï¿½. Lutilisateur doit sassurer du respect de la rï¿½glementation applicable, de lassurance et des rï¿½gles
          de sÃ©curitÃ©.
        </p>

        <h2>5. Bons plans, publicitï¿½ et visibilitï¿½ sponsorisï¿½e</h2>
        <p>
          Les bons plans, banniï¿½res de catï¿½gorie, popups homepage et autres campagnes de visibilitï¿½ sont des services payants ou sponsorisï¿½s.
          Les tarifs, durï¿½es, rï¿½gles de diffusion, files dattente et ï¿½ventuelles limitations de publication sont prï¿½cisï¿½s dans lespace
          professionnel ou dans les CGV applicables.
        </p>
        <p>
          Kalico ne garantit ni la disponibilitï¿½ des stocks, ni lexactitude commerciale, ni les rï¿½sultats de performance des campagnes.
        </p>

        <h2>6. Devis, appels doffres, fret et envoi-livraison</h2>
        <p>
          Les fonctionnalitï¿½s de devis, dappels doffres, denvoi / livraison et de fret servent ï¿½ mettre en relation un demandeur et un
          professionnel. Lutilisateur reste responsable de la vï¿½rification des informations ï¿½changï¿½es, des prix proposï¿½s, des dï¿½lais,
          des conditions de prise en charge et du dï¿½roulement de la prestation.
        </p>
        <p>
          Kalico peut afficher des offres, recevoir des demandes, transmettre des notifications et permettre la sï¿½lection manuelle dune
          offre, mais nintervient ni dans le contrat, ni dans la facturation finale, ni dans lexï¿½cution concrï¿½te de la prestation.
        </p>

        <h2>7. Espace professionnel</h2>
        <p>
          Lespace Pro permet de crï¿½er une vitrine, publier des produits ou services, gï¿½rer un catalogue, des stocks, des disponibilitï¿½s,
          des rendez-vous, des documents, des campagnes publicitaires, des rï¿½ponses aux demandes et dautres outils mï¿½tiers.
        </p>
        <p>
          Le professionnel sengage ï¿½ dï¿½tenir les autorisations nï¿½cessaires ï¿½ son activitï¿½ et ï¿½ fournir des informations exactes sur son
          entreprise, ses coordonnï¿½es, ses horaires et ses prestations.
        </p>

        <h2>8. Notifications et communications</h2>
        <p>
          Kalico peut envoyer des notifications in-app, emails, SMS et push lorsque cela est nï¿½cessaire au fonctionnement du service :
          inscriptions, confirmations, messages, rï¿½ponses ï¿½ des demandes, rendez-vous, confirmations de paiement, sÃ©curitÃ© du compte,
          ou informations utiles liï¿½es aux fonctionnalitï¿½s activï¿½es.
        </p>
        <p>
          Certaines communications promotionnelles ou de suivi sont soumises aux prï¿½fï¿½rences de lutilisateur et peuvent ï¿½tre retirï¿½es
          ï¿½ tout moment dans les paramï¿½tres.
        </p>

        <h2>9. Avis, signalements et modï¿½ration</h2>
        <p>
          Les avis doivent reflï¿½ter une expï¿½rience rï¿½elle. Les signalements peuvent ï¿½tre examinï¿½s par Kalico afin de protï¿½ger la communautï¿½,
          prï¿½venir les abus et faire respecter les prï¿½sentes CGU.
        </p>

        <h2>10. Services payants</h2>
        <p>
          Les abonnements Pro, packs de lancement, boosts, campagnes publicitaires, services de visibilitï¿½ et fonctionnalitï¿½s payantes sont
          soumis aux CGV, aux conditions affichï¿½es lors de lachat et aux ï¿½ventuelles rï¿½gles de facturation du prestataire de paiement.
        </p>

        <h2>11. Interdictions</h2>
        <ul>
          <li>Publier des contenus illicites, trompeurs, diffamatoires, haineux ou frauduleux.</li>
          <li>Contourner les rï¿½gles de publication, de modï¿½ration ou de paiement.</li>
          <li>Usurper lidentitï¿½ dun tiers ou crï¿½er de faux comptes.</li>
          <li>Extraire, scraper ou rï¿½utiliser les donnï¿½es de la plateforme de maniï¿½re non autorisï¿½e.</li>
          <li>Utiliser Kalico pour des usages contraires ï¿½ la loi ou ï¿½ la sÃ©curitÃ© des autres utilisateurs.</li>
        </ul>

        <h2>12. Responsabilitï¿½</h2>
        <p>
          Kalico ne peut ï¿½tre tenue responsable des litiges entre utilisateurs, de lexï¿½cution des contrats, de la qualitï¿½ des biens ou
          services, ni des dommages indirects, dans la limite autorisï¿½e par la loi.
        </p>

        <h2>13. Suspension et rï¿½siliation</h2>
        <p>
          Kalico peut suspendre ou rï¿½silier un compte en cas de non-respect des CGU, de comportement abusif, dusage frauduleux ou de
          nï¿½cessitï¿½ de sÃ©curitÃ©. Lutilisateur peut ï¿½galement demander la suppression de son compte via les paramï¿½tres.
        </p>

        <h2>14. Donnï¿½es personnelles</h2>
        <p>
          Le traitement des donnï¿½es personnelles est dï¿½crit dans la politique de confidentialitï¿½ et la politique cookies de Kalico, qui
          font partie intï¿½grante de lenvironnement juridique du service.
        </p>

        <h2>15. Droit applicable</h2>
        <p>
          Les prï¿½sentes CGU sont soumises au droit applicable en Nouvelle-CalÃ©donie et, le cas ï¿½chï¿½ant, au droit franï¿½ais pour les matiï¿½res
          relevant de ce cadre.
        </p>
      </LegalLayout>
    </>
  )
}
