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

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-night/55 px-4 py-6 backdrop-blur-sm sm:items-center">
      {/* TODO: test E2E sur la modale d'authentification et la reprise d'action après connexion. */}
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
            Connectez-vous pour continuer
          </div>
          <h2 className="mt-4 text-2xl font-bold text-night">
            Votre action est bien gardée en mémoire.
          </h2>
          <p className="mt-2 text-sm leading-6 text-night/60">
            Une fois connecté, vous retrouverez exactement le même contexte et l’action sera rejouée automatiquement quand c’est nécessaire.
          </p>

          <div className="mt-5 space-y-3">
            <Link
              href="/connexion"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-night px-4 py-3 text-sm font-semibold text-white transition hover:bg-night/90"
              onClick={() => closeAuthModal()}
            >
              Se connecter avec email
            </Link>
            <SocialAuthButtons redirectTo={redirectTo} mode="connexion" />
          </div>
        </div>
      </div>
    </div>
  )
}

