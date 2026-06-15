import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Mentions légales — Kalico',
  description: 'Mentions légales de la plateforme Kalico.',
}

const LAST_UPDATE = '25 mai 2026'

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Mentions légales" lastUpdated={LAST_UPDATE}>
        <h2>Éditeur du site</h2>
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

        <h2>Hébergement</h2>
        <p>Le site Kalico est hébergé par :</p>
        <ul>
          <li><strong>Hébergeur :</strong> À renseigner avant publication</li>
          <li><strong>Adresse :</strong> À renseigner avant publication</li>
          <li><strong>Site web :</strong> À renseigner avant publication</li>
        </ul>
        <p>
          Les fichiers (photos, documents) sont stockés sur les serveurs Amazon Web Services (AWS S3), région Asie-Pacifique (Sydney, Australie).
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu du site Kalico (logo, design, code, textes) est la propriété exclusive de Kalico.
        </p>
        <p>
          Les annonces, photos et textes publiés par les utilisateurs restent la propriété de leurs auteurs. En publiant sur Kalico, l'utilisateur accorde à Kalico une licence non-exclusive et gratuite d'affichage sur la plateforme.
        </p>

        <h2>Limitation de responsabilité</h2>
        <p>
          Kalico est une plateforme de mise en relation entre particuliers et professionnels. Kalico n'est pas partie aux transactions, échanges, covoiturages ou prestations de services organisés entre utilisateurs. Kalico ne peut être tenu responsable des contenus publiés par les utilisateurs, des transactions réalisées, ni des dommages éventuels résultant de ces transactions.
        </p>

        <h2>Droit applicable</h2>
        <p>
          Le présent site est soumis au droit français applicable en Nouvelle-Calédonie. Tout litige relatif à son utilisation sera soumis à la compétence exclusive des tribunaux de Nouméa.
        </p>
      </LegalLayout>
    </>
  )
}
