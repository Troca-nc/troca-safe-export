'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'

const defaultProofs = [
  'Publiez et trouvez des annonces partout en Nouvelle-Calédonie.',
  'Échangez directement dans une messagerie locale sécurisée.',
  'Accédez aux services, au troc et au covoiturage avec le même compte.',
]

export default function AuthMapPanel({
  eyebrow = 'Nouvelle-Calédonie',
  title = 'Tout Kalico, avec un seul compte.',
  body = 'Retrouvez vos échanges, vos annonces et vos services locaux au même endroit.',
  proofs = defaultProofs,
}: {
  eyebrow?: string
  title?: string
  body?: string
  proofs?: string[]
}) {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-ink-deep p-12 text-cream lg:flex lg:flex-col xl:p-14">
      <div className="motif-tressage pointer-events-none absolute inset-0 opacity-[0.09]" aria-hidden="true" />
      <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3">
        <span className="font-display text-3xl">Kalico</span>
        <span className="rounded-control border border-cream/25 px-2 py-1 text-eyebrow-sm text-cream/65">{eyebrow}</span>
      </Link>

      <div className="relative z-10 flex flex-1 items-center justify-center py-8" aria-hidden="true">
        <div className="auth-halo absolute h-80 w-80 rounded-full bg-accent/20 blur-3xl motion-reduce:animate-none" />
        <Image src="/brand/kalico1.svg" alt="" width={344} height={344} priority className="auth-sail relative w-72 drop-shadow-2xl motion-reduce:animate-none xl:w-80" />
      </div>

      <div className="relative z-10 max-w-xl">
        <h2 className="font-display text-h2 text-cream">{title}</h2>
        <p className="mt-4 text-body text-cream/70">{body}</p>
        <div className="mt-7 space-y-3">
          {proofs.map((proof) => <p key={proof} className="flex gap-3 border-t border-cream/15 pt-3 text-body-sm text-cream/85"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{proof}</p>)}
        </div>
        <p className="mt-8 font-display text-2xl italic text-cream/50">Nouvelle-Calédonie dans l’âme, Kalico dans la poche.</p>
      </div>

      <style jsx>{`
        .auth-sail { animation: auth-sail 7s ease-in-out infinite; transform-origin: 50% 88%; }
        .auth-halo { animation: auth-halo 9s ease-in-out infinite; }
        @keyframes auth-sail { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-9px) rotate(1deg); } }
        @keyframes auth-halo { 0%,100% { opacity:.28; transform:scale(.94); } 50% { opacity:.5; transform:scale(1.04); } }
        @media (prefers-reduced-motion: reduce) { .auth-sail,.auth-halo { animation:none !important; } }
      `}</style>
    </aside>
  )
}
