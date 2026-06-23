'use client'

import Image from 'next/image'
import { BadgeCheck, BarChart3, MapPin, ShieldCheck, Store } from 'lucide-react'

const highlights = [
  { icon: Store, label: 'Annonces locales' },
  { icon: ShieldCheck, label: 'Compte sécurisé' },
  { icon: BarChart3, label: 'Outils Pro' },
]

const places = ['Nouméa', 'Dumbéa', 'Païta', 'Bourail', 'Koné', 'Lifou']

export default function AuthMapPanel() {
  return (
    <aside className="hidden min-h-screen overflow-hidden bg-ocean lg:flex">
      <div className="relative flex w-full items-center justify-center px-10 py-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(72,202,228,0.16),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_72%_78%,rgba(10,126,164,0.16),transparent_26%),linear-gradient(180deg,rgba(8,50,79,0.98),rgba(5,24,38,0.98))]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative z-10 flex w-full max-w-[540px] flex-col items-center text-center">
          <div className="flex flex-col items-center">
            <span className="relative h-20 w-20 overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-sm md:h-24 md:w-24">
              <Image src="/brand/kalico1.svg" alt="Kalico" fill sizes="88px" className="object-cover" priority />
            </span>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
              Nouvelle-Calédonie
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight text-white md:text-[2.35rem]">
              Rejoignez la plateforme locale pensée pour vendre, échanger et développer votre activité.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/68 md:text-base">
              Une inscription rapide, une identité claire et un espace adapté aux particuliers comme aux pros.
            </p>
          </div>

          <div className="mt-8 grid w-full max-w-[440px] gap-3 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-left shadow-[0_16px_50px_rgba(0,0,0,0.16)] backdrop-blur-sm">
                <Icon className="h-5 w-5 text-nc-lagon" />
                <p className="mt-3 text-sm font-semibold text-white">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 w-full max-w-[440px] rounded-[2rem] border border-white/10 bg-[rgba(2,16,27,0.62)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">Repères locaux</p>
                <p className="mt-1 text-sm text-white/78">Présence dans les principales communes du territoire</p>
              </div>
              <BadgeCheck className="h-6 w-6 text-nc-lagon" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {places.map((place) => (
                <span key={place} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/80">
                  <MapPin className="h-3.5 w-3.5 text-nc-lagon" />
                  {place}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
