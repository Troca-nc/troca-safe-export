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
    title: '= Compte & S�curit�',
    items: [
      {
        question: 'Comment cr�er un compte ?',
        answer:
          'Cliquez sur "Inscription" en haut � droite, renseignez votre email et un mot de passe. Vous recevrez un email de confirmation pour activer votre compte.',
      },
      {
        question: "J'ai oubli� mon mot de passe, comment le r�initialiser ?",
        answer:
          'Sur la page de connexion, cliquez sur "Mot de passe oubli� ?". Entrez votre email et vous recevrez un lien de r�initialisation dans les minutes qui suivent.',
      },
      {
        question: 'Comment supprimer mon compte ?',
        answer:
          'Rendez-vous dans Param�tres � Mon compte � Supprimer mon compte. Cette action est irr�versible et supprime toutes vos annonces et donn�es personnelles.',
      },
    ],
  },
  {
    title: '=� Annonces',
    items: [
      {
        question: 'Comment publier une annonce ?',
        answer:
          'Cliquez sur "Publier une annonce", choisissez une cat�gorie, renseignez les informations et ajoutez des photos. Votre annonce sera en ligne apr�s validation.',
      },
      {
        question: "Pourquoi mon annonce n'appara�t-elle pas ?",
        answer:
          'Les annonces sont v�rifi�es avant publication. Si votre annonce ne saffiche pas sous 24h, v�rifiez quelle respecte nos conditions dutilisation ou contactez-nous via ce formulaire.',
      },
      {
        question: 'Combien de temps reste une annonce en ligne ?',
        answer:
          'Les annonces restent actives 60 jours. Vous pouvez les renouveler depuis votre espace personnel.',
      },
      {
        question: 'Comment modifier ou supprimer une annonce ?',
        answer:
          'Connectez-vous, allez dans "Mes annonces", cliquez sur lannonce concern�e puis "Modifier" ou "Supprimer".',
      },
    ],
  },
  {
    title: '=� Paiement & Boost',
    items: [
      {
        question: "Comment fonctionne le boost d'annonce ?",
        answer:
          'Le boost met votre annonce en avant sur la homepage et en t�te des r�sultats de sa cat�gorie pendant la dur�e choisie. Vous pouvez booster depuis votre espace annonces.',
      },
      {
        question: 'Quels moyens de paiement sont accept�s ?',
        answer:
          'Nous acceptons les cartes bancaires Visa et Mastercard via notre partenaire de paiement s�curis� Stripe.',
      },
      {
        question: 'Comment obtenir un remboursement ?',
        answer:
          'Si votre boost na pas fonctionn� correctement, contactez-nous via ce formulaire dans les 7 jours avec votre num�ro de transaction.',
      },
    ],
  },
  {
    title: '=� S�curit� des transactions',
    items: [
      {
        question: 'Comment �viter les arnaques ?',
        answer:
          'Privil�giez toujours les �changes en personne, ne payez jamais par virement avant de voir lobjet, m�fiez-vous des prix anormalement bas. En cas de doute, signalez lannonce.',
      },
      {
        question: 'Kalico garantit-il les transactions ?',
        answer:
          'Kalico est une plateforme de mise en relation. Nous ne garantissons pas les transactions entre particuliers. Nous vous incitons � la prudence et � rencontrer les vendeurs en lieu public.',
      },
      {
        question: 'Un vendeur me demande de payer par virement, est-ce s�r ?',
        answer:
          'Non. Ne payez jamais par virement bancaire ou mandat cash avant davoir re�u ou vu lobjet. Cest le mode op�ratoire classique des arnaques. Signalez imm�diatement lannonce.',
      },
    ],
  },
  {
    title: '=� Covoiturage',
    items: [
      {
        question: 'Comment r�server un trajet ?',
        answer:
          'Recherchez un trajet depuis la page Covoiturage, cliquez sur une offre et contactez le conducteur via la messagerie int�gr�e pour confirmer votre place.',
      },
      {
        question: 'Comment annuler une r�servation ?',
        answer:
          'Contactez le conducteur directement via la messagerie. En cas de probl�me, utilisez ce formulaire de contact.',
      },
    ],
  },
  {
    title: '<� Bons Plans',
    items: [
      {
        question: 'Qui peut publier un bon plan ou un �v�nement ?',
        answer:
          'Tout utilisateur inscrit peut publier un bon plan. Les professionnels (commer�ants, enseignes) peuvent cr�er un compte Pro pour b�n�ficier de fonctionnalit�s suppl�mentaires.',
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
