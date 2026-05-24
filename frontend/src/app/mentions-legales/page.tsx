import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Mentions légales — Troca',
  description: 'Mentions légales de la plateforme Troca.',
}

const LAST_UPDATE = '25 mai 2026'

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Mentions légales" lastUpdated={LAST_UPDATE}>
        <h2>Éditeur du site</h2>
        <p>
          Le site <strong>Troca</strong> (https://troca.nc) est édité par :
        </p>
        <ul>
          <li><strong>Raison sociale / Nom :</strong> [À COMPLÉTER — nom ou raison sociale]</li>
          <li><strong>Forme juridique :</strong> [À COMPLÉTER — auto-entrepreneur / SARL / SAS / autre]</li>
          <li><strong>Numéro RIDET :</strong> [À COMPLÉTER — numéro RIDET NC] [À VALIDER JURISTE]</li>
          <li><strong>Adresse du siège social :</strong> [À COMPLÉTER — adresse NC]</li>
          <li><strong>Téléphone :</strong> [À COMPLÉTER]</li>
          <li><strong>Email :</strong> contact@troca.nc</li>
          <li><strong>Directeur de la publication :</strong> [À COMPLÉTER — nom du responsable]</li>
        </ul>

        <h2>Hébergement</h2>
        <p>Le site Troca est hébergé par :</p>
        <ul>
          <li><strong>Hébergeur :</strong> [À COMPLÉTER — nom de l'hébergeur]</li>
          <li><strong>Adresse :</strong> [À COMPLÉTER — adresse de l'hébergeur]</li>
          <li><strong>Site web :</strong> [À COMPLÉTER — URL hébergeur]</li>
        </ul>
        <p>
          Les fichiers (photos, documents) sont stockés sur les serveurs Amazon Web Services (AWS S3), région Asie-Pacifique (Sydney, Australie).
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu du site Troca (logo, design, code, textes) est la propriété exclusive de [À COMPLÉTER].
        </p>
        <p>
          Les annonces, photos et textes publiés par les utilisateurs restent la propriété de leurs auteurs. En publiant sur Troca, l'utilisateur accorde à Troca une licence non-exclusive et gratuite d'affichage sur la plateforme.
        </p>

        <h2>Limitation de responsabilité</h2>
        <p>
          Troca est une plateforme de mise en relation entre particuliers et professionnels. Troca n'est pas partie aux transactions, échanges, covoiturages ou prestations de services organisés entre utilisateurs. Troca ne peut être tenu responsable des contenus publiés par les utilisateurs, des transactions réalisées, ni des dommages éventuels résultant de ces transactions. [À VALIDER JURISTE]
        </p>

        <h2>Droit applicable</h2>
        <p>
          Le présent site est soumis au droit français applicable en Nouvelle-Calédonie. Tout litige relatif à son utilisation sera soumis à la compétence exclusive des tribunaux de Nouméa. [À VALIDER JURISTE]
        </p>
      </LegalLayout>
    </>
  )
}
