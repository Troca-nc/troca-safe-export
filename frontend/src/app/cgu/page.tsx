import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'CGU - Kalico',
  description: "Conditions g�n�rales d'utilisation de Kalico.",
}

const LAST_UPDATE = '10 juillet 2026'

export default function CguPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Conditions g�n�rales d'utilisation" lastUpdated={LAST_UPDATE}>
        <p>
          Les pr�sentes CGU r�gissent lacc�s et lutilisation de Kalico, plateforme de petites annonces, troc, covoiturage, bons plans,
          �v�nements, services, devis, appels doffres, fret / livraison et outils professionnels associ�s.
        </p>

        <h2>1. R�le de la plateforme</h2>
        <p>
          Kalico est un interm�diaire technique. La plateforme met en relation des utilisateurs, diffuse des contenus et facilite certains
          services de visibilit�, de prise de contact, de r�servation et de demande doffres. Kalico nest pas partie aux contrats conclus
          entre utilisateurs, particuliers ou professionnels.
        </p>

        <h2>2. Cr�ation et gestion du compte</h2>
        <p>
          Lutilisateur sengage � fournir des informations exactes et � maintenir ses coordonn�es � jour. Un compte peut �tre utilis� comme
          particulier, comme professionnel, ou dans les deux contextes selon les fonctionnalit�s activ�es.
        </p>
        <p>
          Lutilisateur reste responsable de la confidentialit� de son compte, de ses identifiants et des acc�s � son espace.
        </p>

        <h2>3. Contenus publi�s</h2>
        <p>
          Lutilisateur est seul responsable des contenus quil publie : textes, photos, documents, annonces, devis, demandes, r�ponses,
          commentaires, avis, messages et pi�ces jointes.
        </p>
        <p>
          Les contenus doivent �tre loyaux, exacts, licites et ne pas porter atteinte aux droits de tiers. Kalico peut mod�rer, masquer,
          retirer ou suspendre tout contenu manifestement contraire � la loi, aux pr�sentes CGU ou aux int�r�ts de la communaut�.
        </p>

        <h2>4. Annonces, troc et covoiturage</h2>
        <p>
          Les annonces de vente, de location ou de service doivent d�crire correctement le bien ou la prestation propos�e. Pour le troc,
          lutilisateur reste responsable des objets �chang�s, du compl�ment �ventuel en XPF et de la remise effective.
        </p>
        <p>
          Le covoiturage publi� sur Kalico rel�ve dun usage entre particuliers ou, lorsque linterface le permet, dun transport d�clar� par
          un professionnel autoris�. Lutilisateur doit sassurer du respect de la r�glementation applicable, de lassurance et des r�gles
          de s�curit�.
        </p>

        <h2>5. Bons plans, publicit� et visibilit� sponsoris�e</h2>
        <p>
          Les bons plans, banni�res de cat�gorie, popups homepage et autres campagnes de visibilit� sont des services payants ou sponsoris�s.
          Les tarifs, dur�es, r�gles de diffusion, files dattente et �ventuelles limitations de publication sont pr�cis�s dans lespace
          professionnel ou dans les CGV applicables.
        </p>
        <p>
          Kalico ne garantit ni la disponibilit� des stocks, ni lexactitude commerciale, ni les r�sultats de performance des campagnes.
        </p>

        <h2>6. Devis, appels doffres, fret et envoi-livraison</h2>
        <p>
          Les fonctionnalit�s de devis, dappels doffres, denvoi / livraison et de fret servent � mettre en relation un demandeur et un
          professionnel. Lutilisateur reste responsable de la v�rification des informations �chang�es, des prix propos�s, des d�lais,
          des conditions de prise en charge et du d�roulement de la prestation.
        </p>
        <p>
          Kalico peut afficher des offres, recevoir des demandes, transmettre des notifications et permettre la s�lection manuelle dune
          offre, mais nintervient ni dans le contrat, ni dans la facturation finale, ni dans lex�cution concr�te de la prestation.
        </p>

        <h2>7. Espace professionnel</h2>
        <p>
          Lespace Pro permet de cr�er une vitrine, publier des produits ou services, g�rer un catalogue, des stocks, des disponibilit�s,
          des rendez-vous, des documents, des campagnes publicitaires, des r�ponses aux demandes et dautres outils m�tiers.
        </p>
        <p>
          Le professionnel sengage � d�tenir les autorisations n�cessaires � son activit� et � fournir des informations exactes sur son
          entreprise, ses coordonn�es, ses horaires et ses prestations.
        </p>

        <h2>8. Notifications et communications</h2>
        <p>
          Kalico peut envoyer des notifications in-app, emails, SMS et push lorsque cela est n�cessaire au fonctionnement du service :
          inscriptions, confirmations, messages, r�ponses � des demandes, rendez-vous, confirmations de paiement, s�curit� du compte,
          ou informations utiles li�es aux fonctionnalit�s activ�es.
        </p>
        <p>
          Certaines communications promotionnelles ou de suivi sont soumises aux pr�f�rences de lutilisateur et peuvent �tre retir�es
          � tout moment dans les param�tres.
        </p>

        <h2>9. Avis, signalements et mod�ration</h2>
        <p>
          Les avis doivent refl�ter une exp�rience r�elle. Les signalements peuvent �tre examin�s par Kalico afin de prot�ger la communaut�,
          pr�venir les abus et faire respecter les pr�sentes CGU.
        </p>

        <h2>10. Services payants</h2>
        <p>
          Les abonnements Pro, packs de lancement, boosts, campagnes publicitaires, services de visibilit� et fonctionnalit�s payantes sont
          soumis aux CGV, aux conditions affich�es lors de lachat et aux �ventuelles r�gles de facturation du prestataire de paiement.
        </p>

        <h2>11. Interdictions</h2>
        <ul>
          <li>Publier des contenus illicites, trompeurs, diffamatoires, haineux ou frauduleux.</li>
          <li>Contourner les r�gles de publication, de mod�ration ou de paiement.</li>
          <li>Usurper lidentit� dun tiers ou cr�er de faux comptes.</li>
          <li>Extraire, scraper ou r�utiliser les donn�es de la plateforme de mani�re non autoris�e.</li>
          <li>Utiliser Kalico pour des usages contraires � la loi ou � la s�curit� des autres utilisateurs.</li>
        </ul>

        <h2>12. Responsabilit�</h2>
        <p>
          Kalico ne peut �tre tenue responsable des litiges entre utilisateurs, de lex�cution des contrats, de la qualit� des biens ou
          services, ni des dommages indirects, dans la limite autoris�e par la loi.
        </p>

        <h2>13. Suspension et r�siliation</h2>
        <p>
          Kalico peut suspendre ou r�silier un compte en cas de non-respect des CGU, de comportement abusif, dusage frauduleux ou de
          n�cessit� de s�curit�. Lutilisateur peut �galement demander la suppression de son compte via les param�tres.
        </p>

        <h2>14. Donn�es personnelles</h2>
        <p>
          Le traitement des donn�es personnelles est d�crit dans la politique de confidentialit� et la politique cookies de Kalico, qui
          font partie int�grante de lenvironnement juridique du service.
        </p>

        <h2>15. Droit applicable</h2>
        <p>
          Les pr�sentes CGU sont soumises au droit applicable en Nouvelle-Cal�donie et, le cas �ch�ant, au droit fran�ais pour les mati�res
          relevant de ce cadre.
        </p>
      </LegalLayout>
    </>
  )
}
