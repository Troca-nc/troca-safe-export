'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo } from 'react'
import { ArrowRight, Phone, ShieldCheck } from 'lucide-react'
import PhoneVerification from '@/components/profil/PhoneVerification'
import { useAuthStore } from '@/store/authStore'

function SocialPhoneCompletionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, hasHydrated, refreshMe } = useAuthStore()

  const next = useMemo(() => {
    const raw = searchParams.get('next')?.trim()
    return raw ? raw : '/profil'
  }, [searchParams])

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.replace(`/connexion?next=${encodeURIComponent(next)}`)
      return
    }

    if (user?.phone_verified && user.telephone) {
      router.replace(next)
    }
  }, [hasHydrated, isAuthenticated, next, router, user?.phone_verified, user?.telephone])

  const handleVerified = async () => {
    try {
      await refreshMe()
    } catch {
      // Si le refresh Ã©choue, on laisse quand mÃªme l'utilisateur continuer.
    }
    router.replace(next)
  }

  if (!hasHydrated || (isAuthenticated && user?.phone_verified && user.telephone)) {
    return <div className="min-h-screen bg-sand-light" />
  }

  return (
    <div className="min-h-screen bg-sand-light px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-night/10 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="relative h-11 w-11 overflow-hidden rounded-2xl border border-night/10 bg-white shadow-[0_8px_24px_rgba(8,32,50,0.08)]">
                  <Image src="/brand/kalico1.svg" alt="Kalico" fill sizes="44px" className="object-cover" priority />
                </span>
                <span>
                  <span className="block font-display text-xl font-bold text-night">Kalico</span>
                </span>
              </Link>

              <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral">
                <ShieldCheck className="h-3.5 w-3.5" />
                SÃ©curisation
              </span>
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-night/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/50">
                <Phone className="h-3.5 w-3.5" />
                Ã‰tape de finalisation
              </div>
              <h1 className="mt-5 text-3xl font-semibold leading-tight text-night md:text-4xl">
                Ajoutez votre numÃ©ro de tÃ©lÃ©phone
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-night/60">
                Le tÃ©lÃ©phone est utilisÃ© pour la rÃ©cupÃ©ration de mot de passe par SMS et pour renforcer la sÃ©curitÃ© de votre compte.
              </p>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-coral/15 bg-coral/5 p-4 text-sm text-night/70">
              Si votre numÃ©ro est dÃ©jÃ  renseignÃ© dans votre compte, il sera prÃ©-rempli. Sinon, ajoutez-le maintenant puis validez le code reÃ§u.
            </div>

            <div className="mt-6">
              <PhoneVerification
                initialPhone={user?.telephone ?? ''}
                onVerified={() => {
                  void handleVerified()
                }}
                variant="card"
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-night/60">
              Vous pourrez ajouter votre numéro plus tard depuis votre profil.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/connexion" className="btn-ghost justify-center px-5 py-3">
                Retour Ã  la connexion
              </Link>
                            <Link href={next} className="btn-secondary w-full justify-center px-5 py-3 sm:w-auto">
                Continuer sans vérification →
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-night/10 bg-night px-6 py-8 text-white shadow-[0_20px_60px_rgba(8,32,50,0.22)] md:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Pourquoi ce numÃ©ro ?
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight">
              RÃ©cupÃ©ration plus simple, sÃ©curitÃ© renforcÃ©e
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              En cas dâ€™oubli de mot de passe, vous pourrez recevoir un SMS de rÃ©initialisation. Si le tÃ©lÃ©phone nâ€™est pas vÃ©rifiÃ©, la rÃ©cupÃ©ration bascule automatiquement par email.
            </p>

            <div className="mt-6 space-y-3">
              {[
                'SMS prioritaire si le numÃ©ro est vÃ©rifiÃ©',
                'Fallback email si le tÃ©lÃ©phone nâ€™est pas vÃ©rifiÃ©',
                'Compte mieux protÃ©gÃ© contre les accÃ¨s non autorisÃ©s',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs leading-relaxed text-white/45">
              Vous pourrez complÃ©ter ou modifier ce numÃ©ro plus tard depuis les paramÃ¨tres de votre compte.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function SocialPhoneCompletionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <SocialPhoneCompletionContent />
    </Suspense>
  )
}

