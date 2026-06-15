'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type FaqItem = {
  question: string
  answer: string
}

type FaqGroup = {
  title: string
  items: FaqItem[]
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    title: '🔐 Compte & Sécurité',
    items: [
      {
        question: 'Comment créer un compte ?',
        answer:
          'Cliquez sur "Inscription" en haut à droite, renseignez votre email et un mot de passe. Vous recevrez un email de confirmation pour activer votre compte.',
      },
      {
        question: "J'ai oublié mon mot de passe, comment le réinitialiser ?",
        answer:
          'Sur la page de connexion, cliquez sur "Mot de passe oublié ?". Entrez votre email et vous recevrez un lien de réinitialisation dans les minutes qui suivent.',
      },
      {
        question: 'Comment supprimer mon compte ?',
        answer:
          'Rendez-vous dans Paramètres → Mon compte → Supprimer mon compte. Cette action est irréversible et supprime toutes vos annonces et données personnelles.',
      },
    ],
  },
  {
    title: '📢 Annonces',
    items: [
      {
        question: 'Comment publier une annonce ?',
        answer:
          'Cliquez sur "Publier une annonce", choisissez une catégorie, renseignez les informations et ajoutez des photos. Votre annonce sera en ligne après validation.',
      },
      {
        question: "Pourquoi mon annonce n'apparaît-elle pas ?",
        answer:
          'Les annonces sont vérifiées avant publication. Si votre annonce ne s’affiche pas sous 24h, vérifiez qu’elle respecte nos conditions d’utilisation ou contactez-nous via ce formulaire.',
      },
      {
        question: 'Combien de temps reste une annonce en ligne ?',
        answer:
          'Les annonces restent actives 60 jours. Vous pouvez les renouveler depuis votre espace personnel.',
      },
      {
        question: 'Comment modifier ou supprimer une annonce ?',
        answer:
          'Connectez-vous, allez dans "Mes annonces", cliquez sur l’annonce concernée puis "Modifier" ou "Supprimer".',
      },
    ],
  },
  {
    title: '💳 Paiement & Boost',
    items: [
      {
        question: "Comment fonctionne le boost d'annonce ?",
        answer:
          'Le boost met votre annonce en avant sur la homepage et en tête des résultats de sa catégorie pendant la durée choisie. Vous pouvez booster depuis votre espace annonces.',
      },
      {
        question: 'Quels moyens de paiement sont acceptés ?',
        answer:
          'Nous acceptons les cartes bancaires Visa et Mastercard via notre partenaire de paiement sécurisé Stripe.',
      },
      {
        question: 'Comment obtenir un remboursement ?',
        answer:
          'Si votre boost n’a pas fonctionné correctement, contactez-nous via ce formulaire dans les 7 jours avec votre numéro de transaction.',
      },
    ],
  },
  {
    title: '🛡️ Sécurité des transactions',
    items: [
      {
        question: 'Comment éviter les arnaques ?',
        answer:
          'Privilégiez toujours les échanges en personne, ne payez jamais par virement avant de voir l’objet, méfiez-vous des prix anormalement bas. En cas de doute, signalez l’annonce.',
      },
      {
        question: 'Kalico garantit-il les transactions ?',
        answer:
          'Kalico est une plateforme de mise en relation. Nous ne garantissons pas les transactions entre particuliers. Nous vous incitons à la prudence et à rencontrer les vendeurs en lieu public.',
      },
      {
        question: 'Un vendeur me demande de payer par virement, est-ce sûr ?',
        answer:
          'Non. Ne payez jamais par virement bancaire ou mandat cash avant d’avoir reçu ou vu l’objet. C’est le mode opératoire classique des arnaques. Signalez immédiatement l’annonce.',
      },
    ],
  },
  {
    title: '🚗 Covoiturage',
    items: [
      {
        question: 'Comment réserver un trajet ?',
        answer:
          'Recherchez un trajet depuis la page Covoiturage, cliquez sur une offre et contactez le conducteur via la messagerie intégrée pour confirmer votre place.',
      },
      {
        question: 'Comment annuler une réservation ?',
        answer:
          'Contactez le conducteur directement via la messagerie. En cas de problème, utilisez ce formulaire de contact.',
      },
    ],
  },
  {
    title: '🏷️ Bons Plans',
    items: [
      {
        question: 'Qui peut publier un bon plan ou un événement ?',
        answer:
          'Tout utilisateur inscrit peut publier un bon plan. Les professionnels (commerçants, enseignes) peuvent créer un compte Pro pour bénéficier de fonctionnalités supplémentaires.',
      },
    ],
  },
]

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  let currentIndex = 0

  return (
    <section className="space-y-8">
      {FAQ_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="text-xs font-semibold uppercase tracking-wide text-nc-lagon">{group.title}</p>
          <div className="mt-3">
            {group.items.map((item) => {
              const index = currentIndex++
              const isOpen = openIndex === index

              return (
                <div key={item.question} className="border-b border-night/10 py-4 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpenIndex((current) => (current === index ? null : index))}
                    className="flex w-full items-center justify-between gap-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-night">{item.question}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-nc-lagon transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'mt-3 grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="text-sm leading-relaxed text-night/65">{item.answer}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}
