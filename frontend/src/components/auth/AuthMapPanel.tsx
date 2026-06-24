'use client'

import Image from 'next/image'
import { ArrowRight, BadgeCheck, BarChart3, Camera, MapPin, ShieldCheck, Store } from 'lucide-react'

const highlights = [
  { icon: Store, title: 'Publiez vite', text: 'Créez une annonce propre sans vous perdre dans les options.' },
  { icon: Camera, title: 'Montrez mieux', text: 'Photos, titre et infos utiles dans une présentation claire.' },
  { icon: ShieldCheck, title: 'Avancez serein', text: 'Un compte sécurisé et des repères simples pour bien démarrer.' },
]

const momentum = [
  { value: '2 min', label: 'pour lancer un compte' },
  { value: '1 page', label: 'pour comprendre la suite' },
  { value: '0 friction', label: 'au moment de commencer' },
]

const nextSteps = [
  { icon: Store, title: 'Publiez', text: 'Annonce, service ou bon plan' },
  { icon: BarChart3, title: 'Diffusez', text: 'Visibilité locale immédiate' },
  { icon: MapPin, title: 'Échangez', text: 'Messages et mises en relation' },
]

export default function AuthMapPanel() {
  return (
    <aside className="hidden min-h-screen overflow-hidden bg-ocean lg:flex">
      <div className="relative flex w-full items-center justify-center px-10 py-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(72,202,228,0.16),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_72%_78%,rgba(10,126,164,0.16),transparent_26%),linear-gradient(180deg,rgba(8,50,79,0.98),rgba(5,24,38,0.98))]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative z-10 flex w-full max-w-[620px] flex-col items-center text-center">
          <div className="flex flex-col items-center">
            <span className="relative h-28 w-28 overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm md:h-32 md:w-32">
              <Image src="/brand/kalico-logo.png" alt="Kalico" fill sizes="128px" className="object-contain p-3" priority />
            </span>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
              Nouvelle-Calédonie
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-[2.5rem]">
              Publiez, trouvez et avancez plus vite sur la marketplace locale de Nouvelle-Calédonie.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/72 md:text-base">
              Une inscription simple pour créer un profil propre, lancer vos annonces et donner envie aux bonnes personnes de vous contacter.
            </p>
          </div>

          <div className="mt-8 grid w-full max-w-[560px] gap-3 sm:grid-cols-3">
            {momentum.map(({ value, label }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-center shadow-[0_16px_50px_rgba(0,0,0,0.14)] backdrop-blur-sm">
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="mt-2 text-sm leading-5 text-white/72">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid w-full max-w-[560px] gap-3 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-left shadow-[0_16px_50px_rgba(0,0,0,0.16)] backdrop-blur-sm">
                <Icon className="h-5 w-5 text-nc-lagon" />
                <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm leading-6 text-white/68">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 w-full max-w-[560px] rounded-[2rem] border border-white/10 bg-[rgba(2,16,27,0.7)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">Votre départ</p>
                <p className="mt-1 text-sm text-white/78">Un chemin clair pour publier sans hésiter</p>
              </div>
              <BadgeCheck className="h-6 w-6 text-nc-lagon" />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {nextSteps.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-left">
                  <Icon className="h-4 w-4 text-nc-lagon" />
                  <p className="mt-2 text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/70">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left">
              <div>
                <p className="text-sm font-semibold text-white">Commencez avec un compte clair.</p>
                <p className="mt-1 text-xs leading-5 text-white/70">Le reste de l’expérience suit naturellement.</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-nc-lagon" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
