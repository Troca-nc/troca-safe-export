'use client'

import Link from 'next/link'
import { X } from 'lucide-react'

import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { useAuthActionStore } from '@/store/authActionStore'

export default function AuthRequiredModal() {
  const isOpen = useAuthActionStore((state) => state.isOpen)
  const action = useAuthActionStore((state) => state.action)
  const closeAuthModal = useAuthActionStore((state) => state.closeAuthModal)

  if (!isOpen || !action) return null

  const redirectTo = action.redirectTo
  const isFavoriteAction = action.type === 'favorite_listing'

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-night/55 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-night/10 bg-white shadow-[0_24px_80px_rgba(8,32,50,0.2)]">
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-night/10 bg-white text-night/50 transition hover:text-night"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-7">
          <div className="inline-flex rounded-full bg-coral/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-coral">
            {isFavoriteAction ? 'Favoris synchronisés' : 'Connexion rapide'}
          </div>
          <h2 className="mt-4 text-2xl font-bold text-night">
            {isFavoriteAction ? 'Sauvegardez vos favoris partout' : 'On vous remet au bon endroit.'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-night/60">
            {isFavoriteAction
              ? 'Créez un compte en quelques secondes pour retrouver vos annonces préférées sur votre téléphone, votre ordinateur et votre tablette. Sans compte, vos favoris restent seulement sur cet appareil.'
              : 'Connectez-vous en quelques secondes. Votre action reprend automatiquement après la connexion si besoin.'}
          </p>

          <div className="mt-5 space-y-3">
            {isFavoriteAction ? (
              <>
                <Link
                  href="/inscription"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b83e28]"
                  onClick={() => closeAuthModal()}
                >
                  Créer un compte
                </Link>
                <Link
                  href="/connexion"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-night/5"
                  onClick={() => closeAuthModal()}
                >
                  Se connecter
                </Link>
                <p className="pt-1 text-center text-xs text-night/40">
                  Vous restez sur la page actuelle. Vos favoris seront synchronisés automatiquement après inscription.
                </p>
              </>
            ) : (
              <>
                <Link
                  href={redirectTo ? `/connexion?next=${encodeURIComponent(redirectTo)}` : '/connexion'}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-night px-4 py-3 text-sm font-semibold text-white transition hover:bg-night/90"
                  onClick={() => closeAuthModal()}
                >
                  Continuer avec email
                </Link>
                <SocialAuthButtons redirectTo={redirectTo} mode="connexion" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
