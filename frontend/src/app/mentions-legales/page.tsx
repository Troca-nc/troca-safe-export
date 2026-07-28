import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Mentions légales — Kalico',
  description: 'Mentions légales de la plateforme Kalico.',
}

const LAST_UPDATE = '10 juillet 2026'

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Mentions légales" lastUpdated={LAST_UPDATE}>
        <h2>1. Éditeur du site</h2>
        <p>
          Le site <strong>Kalico</strong> (https://kalico.nc) est édité par :
        </p>
        <ul>
          <li><strong>Raison sociale / Nom :</strong> À renseigner avant publication</li>
          <li><strong>Forme juridique :</strong> À renseigner avant publication</li>
          <li><strong>Numéro RIDET :</strong> À renseigner avant publication</li>
          <li><strong>Adresse du siège social :</strong> À renseigner avant publication</li>
          <li><strong>Téléphone :</strong> À renseigner avant publication</li>
          <li><strong>Email :</strong> contact@kalico.nc</li>
          <li><strong>Directeur de la publication :</strong> À renseigner avant publication</li>
        </ul>

        <h2>2. Hébergement et infrastructure</h2>
        <p>Le site Kalico est hébergé sur une infrastructure technique gérée par Kalico et ses prestataires d’hébergement.</p>
        <ul>
          <li><strong>Hébergeur :</strong> À renseigner avant publication</li>
          <li><strong>Adresse :</strong> À renseigner avant publication</li>
          <li><strong>Site web :</strong> À renseigner avant publication</li>
        </ul>
        <p>
          Les contenus et fichiers téléversés par les utilisateurs peuvent être stockés sur AWS ou sur toute autre infrastructure configurée
          par Kalico pour l’hébergement applicatif, les sauvegardes ou le traitement technique.
        </p>

        <h2>3. Propriété intellectuelle</h2>
        <p>
          L’ensemble du contenu du site Kalico (logo, design, code, textes, interfaces et éléments graphiques) est protégé par le droit
          de la propriété intellectuelle. Sauf mention contraire, les droits appartiennent à Kalico ou à ses partenaires autorisés.
        </p>
        <p>
          Les annonces, photos, textes, devis, contenus de vitrines Pro, campagnes publicitaires, avis et messages publiés par les utilisateurs
          restent la propriété de leurs auteurs. En publiant sur Kalico, l’utilisateur accorde à Kalico une licence non exclusive, gratuite,
          mondiale et limitée à la diffusion, l’hébergement, l’indexation et l’affichage sur la plateforme.
        </p>

        <h2>4. Données personnelles</h2>
        <p>
          Les modalités de collecte et de traitement des données personnelles, des cookies, du stockage local et des droits des utilisateurs
          sont décrites dans la politique de confidentialité et la politique cookies accessibles depuis le site.
        </p>

        <h2>5. Responsabilité</h2>
        <p>
          Kalico est une plateforme de mise en relation entre particuliers et professionnels. Kalico n’est pas partie aux transactions,
          échanges, covoiturages, prestations de services, devis, appels d’offres, livraisons ou ventes organisées entre utilisateurs.
          Kalico ne peut être tenue responsable des contenus publiés par les utilisateurs, des accords conclus entre eux ni des dommages
          pouvant résulter de ces échanges, dans la limite autorisée par la loi.
        </p>

        <h2>6. Liens et services tiers</h2>
        <p>
          Certaines pages ou fonctionnalités peuvent renvoyer vers des services tiers, notamment pour le paiement, l’email, le SMS,
          les notifications ou l’hébergement. Kalico n’est pas responsable des pratiques de ces tiers, qui appliquent leurs propres
          conditions et politiques.
        </p>

        <h2>7. Contact</h2>
        <p>
          Pour toute question juridique ou relative à la vie privée, vous pouvez contacter Kalico à l’adresse
          <a href="mailto:privacy@kalico.nc"> privacy@kalico.nc</a> ou via <a href="mailto:contact@kalico.nc">contact@kalico.nc</a>.
        </p>

        <h2>8. Droit applicable</h2>
        <p>
          Le présent site est soumis au droit français applicable en Nouvelle-Calédonie. Tout litige relatif à son utilisation sera soumis
          à la compétence des juridictions compétentes de Nouméa, sauf disposition légale impérative contraire.
        </p>
      </LegalLayout>
    </>
  )
}
