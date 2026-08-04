import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Mentions lï¿½gales - Kalico',
  description: 'Mentions lï¿½gales de la plateforme Kalico.',
}

const LAST_UPDATE = '10 juillet 2026'

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Mentions lï¿½gales" lastUpdated={LAST_UPDATE}>
        <h2>1. ï¿½diteur du site</h2>
        <p>
          Le site <strong>Kalico</strong> ({SITE_URL}) est ï¿½ditï¿½ par :
        </p>
        <ul>
          <li><strong>Raison sociale / Nom :</strong> ï¿½ renseigner avant publication</li>
          <li><strong>Forme juridique :</strong> ï¿½ renseigner avant publication</li>
          <li><strong>Numï¿½ro RIDET :</strong> ï¿½ renseigner avant publication</li>
          <li><strong>Adresse du siï¿½ge social :</strong> ï¿½ renseigner avant publication</li>
          <li><strong>Tï¿½lï¿½phone :</strong> ï¿½ renseigner avant publication</li>
          <li><strong>Email :</strong> contact@kalico.nc</li>
          <li><strong>Directeur de la publication :</strong> ï¿½ renseigner avant publication</li>
        </ul>

        <h2>2. Hï¿½bergement et infrastructure</h2>
        <p>Le site Kalico est hï¿½bergï¿½ sur une infrastructure technique gï¿½rï¿½e par Kalico et ses prestataires dhï¿½bergement.</p>
        <ul>
          <li><strong>Hï¿½bergeur :</strong> ï¿½ renseigner avant publication</li>
          <li><strong>Adresse :</strong> ï¿½ renseigner avant publication</li>
          <li><strong>Site web :</strong> ï¿½ renseigner avant publication</li>
        </ul>
        <p>
          Les contenus et fichiers tï¿½lï¿½versï¿½s par les utilisateurs peuvent ï¿½tre stockï¿½s sur AWS ou sur toute autre infrastructure configurï¿½e
          par Kalico pour lhï¿½bergement applicatif, les sauvegardes ou le traitement technique.
        </p>

        <h2>3. Propriï¿½tï¿½ intellectuelle</h2>
        <p>
          Lensemble du contenu du site Kalico (logo, design, code, textes, interfaces et ï¿½lï¿½ments graphiques) est protï¿½gï¿½ par le droit
          de la propriï¿½tï¿½ intellectuelle. Sauf mention contraire, les droits appartiennent ï¿½ Kalico ou ï¿½ ses partenaires autorisï¿½s.
        </p>
        <p>
          Les annonces, photos, textes, devis, contenus de vitrines Pro, campagnes publicitaires, avis et messages publiï¿½s par les utilisateurs
          restent la propriï¿½tï¿½ de leurs auteurs. En publiant sur Kalico, lutilisateur accorde ï¿½ Kalico une licence non exclusive, gratuite,
          mondiale et limitï¿½e ï¿½ la diffusion, lhï¿½bergement, lindexation et laffichage sur la plateforme.
        </p>

        <h2>4. Donnï¿½es personnelles</h2>
        <p>
          Les modalitï¿½s de collecte et de traitement des donnï¿½es personnelles, des cookies, du stockage local et des droits des utilisateurs
          sont dï¿½crites dans la politique de confidentialitï¿½ et la politique cookies accessibles depuis le site.
        </p>

        <h2>5. Responsabilitï¿½</h2>
        <p>
          Kalico est une plateforme de mise en relation entre particuliers et professionnels. Kalico nest pas partie aux transactions,
          ï¿½changes, covoiturages, prestations de services, devis, appels doffres, livraisons ou ventes organisï¿½es entre utilisateurs.
          Kalico ne peut ï¿½tre tenue responsable des contenus publiï¿½s par les utilisateurs, des accords conclus entre eux ni des dommages
          pouvant rï¿½sulter de ces ï¿½changes, dans la limite autorisï¿½e par la loi.
        </p>

        <h2>6. Liens et services tiers</h2>
        <p>
          Certaines pages ou fonctionnalitï¿½s peuvent renvoyer vers des services tiers, notamment pour le paiement, lemail, le SMS,
          les notifications ou lhï¿½bergement. Kalico nest pas responsable des pratiques de ces tiers, qui appliquent leurs propres
          conditions et politiques.
        </p>

        <h2>7. Contact</h2>
        <p>
          Pour toute question juridique ou relative ï¿½ la vie privï¿½e, vous pouvez contacter Kalico ï¿½ ladresse
          <a href="mailto:privacy@kalico.nc"> privacy@kalico.nc</a> ou via <a href="mailto:contact@kalico.nc">contact@kalico.nc</a>.
        </p>

        <h2>8. Droit applicable</h2>
        <p>
          Le prï¿½sent site est soumis au droit franï¿½ais applicable en Nouvelle-CalÃ©donie. Tout litige relatif ï¿½ son utilisation sera soumis
          ï¿½ la compï¿½tence des juridictions compï¿½tentes de NoumÃ©a, sauf disposition lï¿½gale impï¿½rative contraire.
        </p>
      </LegalLayout>
    </>
  )
}
