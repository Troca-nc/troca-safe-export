import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'CGU — Troca',
  description: "Conditions générales d'utilisation de Troca.",
}

const LAST_UPDATE = '25 mai 2026'

export default function CguPage() {
  return (
    <>
      <Header />
      <LegalLayout title="Conditions générales d'utilisation" lastUpdated={LAST_UPDATE}>
        <h2>1. Objet</h2>
        <p>
          Les présentes CGU régissent l'accès et l'utilisation de Troca, plateforme de petites annonces, troc, covoiturage, services, locations, immobilier et bons plans.
        </p>

        <h2>2. Fonctionnement général</h2>
        <p>
          Troca agit comme intermédiaire technique. Les utilisateurs restent seuls responsables des contenus qu'ils publient et des échanges conclus entre eux.
        </p>

        <h2>3. Annonces classiques</h2>
        <p>Les annonces de vente entre particuliers doivent être loyales, exactes et respecter la réglementation applicable.</p>

        <h2>4. Troc</h2>
        <p>
          Le troc permet l'échange d'objets avec ou sans complément XPF. Troca ne gère pas de séquestre, n'encaisse pas les compléments et n'intervient pas dans la remise des objets.
        </p>

        <h2>5. Covoiturage</h2>
        <p>
          Le covoiturage publié sur Troca est strictement non professionnel. Les trajets doivent respecter les lois applicables, l'assurance et la sécurité des passagers. Le badge Conducteur Vérifié n'est qu'une vérification visuelle du permis soumis.
        </p>

        <h2>6. Services, locations et immobilier</h2>
        <p>
          Les services entre particuliers, les locations courte durée et les annonces immobilières utilisent le système d'annonces existant avec des champs spécifiques. Troca n'intervient ni dans les contrats, ni dans les remises de clés, ni dans la qualité des prestations.
        </p>

        <h2>7. Bons Plans</h2>
        <p>
          Les Bons Plans sont des vitrines promotionnelles payantes publiées par des enseignes ou annonceurs locaux. Troca ne garantit ni les remises ni les stocks ni les conditions commerciales affichées.
        </p>

        <h2>8. Services payants</h2>
        <p>
          Les abonnements Pro, boosts, Bons Plans et le badge Conducteur Vérifié sont des services payants soumis aux CGV.
        </p>

        <h2>9. Avis et modération</h2>
        <p>
          Les avis consommateurs doivent refléter une expérience réelle. Troca peut modérer ou supprimer tout contenu illicite, abusif ou manifestement faux.
        </p>

        <h2>10. Responsabilité</h2>
        <p>
          Troca ne peut être tenue responsable des litiges entre utilisateurs, des contenus publiés ni des dommages indirects, dans la limite autorisée par la loi. [À VALIDER JURISTE]
        </p>

        <h2>11. Droit applicable</h2>
        <p>
          Les CGU sont soumises au droit applicable en Nouvelle-Calédonie et, le cas échéant, au droit français pour les matières concernées. [À VALIDER JURISTE]
        </p>
      </LegalLayout>
    </>
  )
}
