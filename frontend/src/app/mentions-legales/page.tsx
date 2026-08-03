import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Mentions l�gales - Kalico',
  description: 'Mentions l�gales de la plateforme Kalico.',
}

const LAST_UPDATE = '10 juillet 2026'

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Mentions l�gales" lastUpdated={LAST_UPDATE}>
        <h2>1. �diteur du site</h2>
        <p>
          Le site <strong>Kalico</strong> ({SITE_URL}) est �dit� par :
        </p>
        <ul>
          <li><strong>Raison sociale / Nom :</strong> � renseigner avant publication</li>
          <li><strong>Forme juridique :</strong> � renseigner avant publication</li>
          <li><strong>Num�ro RIDET :</strong> � renseigner avant publication</li>
          <li><strong>Adresse du si�ge social :</strong> � renseigner avant publication</li>
          <li><strong>T�l�phone :</strong> � renseigner avant publication</li>
          <li><strong>Email :</strong> contact@kalico.nc</li>
          <li><strong>Directeur de la publication :</strong> � renseigner avant publication</li>
        </ul>

        <h2>2. H�bergement et infrastructure</h2>
        <p>Le site Kalico est h�berg� sur une infrastructure technique g�r�e par Kalico et ses prestataires dh�bergement.</p>
        <ul>
          <li><strong>H�bergeur :</strong> � renseigner avant publication</li>
          <li><strong>Adresse :</strong> � renseigner avant publication</li>
          <li><strong>Site web :</strong> � renseigner avant publication</li>
        </ul>
        <p>
          Les contenus et fichiers t�l�vers�s par les utilisateurs peuvent �tre stock�s sur AWS ou sur toute autre infrastructure configur�e
          par Kalico pour lh�bergement applicatif, les sauvegardes ou le traitement technique.
        </p>

        <h2>3. Propri�t� intellectuelle</h2>
        <p>
          Lensemble du contenu du site Kalico (logo, design, code, textes, interfaces et �l�ments graphiques) est prot�g� par le droit
          de la propri�t� intellectuelle. Sauf mention contraire, les droits appartiennent � Kalico ou � ses partenaires autoris�s.
        </p>
        <p>
          Les annonces, photos, textes, devis, contenus de vitrines Pro, campagnes publicitaires, avis et messages publi�s par les utilisateurs
          restent la propri�t� de leurs auteurs. En publiant sur Kalico, lutilisateur accorde � Kalico une licence non exclusive, gratuite,
          mondiale et limit�e � la diffusion, lh�bergement, lindexation et laffichage sur la plateforme.
        </p>

        <h2>4. Donn�es personnelles</h2>
        <p>
          Les modalit�s de collecte et de traitement des donn�es personnelles, des cookies, du stockage local et des droits des utilisateurs
          sont d�crites dans la politique de confidentialit� et la politique cookies accessibles depuis le site.
        </p>

        <h2>5. Responsabilit�</h2>
        <p>
          Kalico est une plateforme de mise en relation entre particuliers et professionnels. Kalico nest pas partie aux transactions,
          �changes, covoiturages, prestations de services, devis, appels doffres, livraisons ou ventes organis�es entre utilisateurs.
          Kalico ne peut �tre tenue responsable des contenus publi�s par les utilisateurs, des accords conclus entre eux ni des dommages
          pouvant r�sulter de ces �changes, dans la limite autoris�e par la loi.
        </p>

        <h2>6. Liens et services tiers</h2>
        <p>
          Certaines pages ou fonctionnalit�s peuvent renvoyer vers des services tiers, notamment pour le paiement, lemail, le SMS,
          les notifications ou lh�bergement. Kalico nest pas responsable des pratiques de ces tiers, qui appliquent leurs propres
          conditions et politiques.
        </p>

        <h2>7. Contact</h2>
        <p>
          Pour toute question juridique ou relative � la vie priv�e, vous pouvez contacter Kalico � ladresse
          <a href="mailto:privacy@kalico.nc"> privacy@kalico.nc</a> ou via <a href="mailto:contact@kalico.nc">contact@kalico.nc</a>.
        </p>

        <h2>8. Droit applicable</h2>
        <p>
          Le pr�sent site est soumis au droit fran�ais applicable en Nouvelle-Cal�donie. Tout litige relatif � son utilisation sera soumis
          � la comp�tence des juridictions comp�tentes de Noum�a, sauf disposition l�gale imp�rative contraire.
        </p>
      </LegalLayout>
    </>
  )
}
