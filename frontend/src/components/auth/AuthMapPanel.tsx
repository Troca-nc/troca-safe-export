'use client'

import Image from 'next/image'
import { ArrowRight, BadgeCheck, BarChart3, Briefcase, CalendarDays, Camera, FileText, RefreshCw, Route, ShieldCheck, Store, Truck } from 'lucide-react'

const highlights = [
  { icon: Store, title: 'Annonces', text: 'Publiez un produit ou un service en quelques minutes.' },
  { icon: RefreshCw, title: 'Troc', text: 'Échangez, proposez et trouvez une seconde vie aux objets.' },
  { icon: Route, title: 'Covoiturage', text: 'Trajets entre communes, réservation simple, filtre femmes disponible.' },
  { icon: FileText, title: 'Devis Pro', text: 'Créez et envoyez des devis en XPF avec TGC intégrée, depuis votre dashboard Pro.' },
]

const quickWins = [
  { icon: Truck, title: 'Fret', text: 'Transport de colis et marchandises entre les communes.' },
  { icon: Briefcase, title: 'Pro', text: 'Créez et envoyez des devis en XPF avec TGC intégrée.' },
  { icon: CalendarDays, title: 'Événements', text: 'Mettez en avant ce qui se passe près de chez vous.' },
  { icon: BarChart3, title: 'Visibilité', text: 'Vos annonces remontent dans une expérience locale claire.' },
]

export default function AuthMapPanel() {
  return (
    <aside className="hidden min-h-screen overflow-hidden bg-ocean lg:flex">
      <div className="relative flex w-full items-center justify-center px-10 py-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(72,202,228,0.16),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_72%_78%,rgba(10,126,164,0.16),transparent_26%),linear-gradient(180deg,rgba(8,50,79,0.98),rgba(5,24,38,0.98))]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative z-10 flex w-full max-w-[660px] flex-col items-center text-center">
          <div className="flex flex-col items-center">
            <span className="relative h-36 w-36 overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm md:h-44 md:w-44">
              <Image src="/brand/kalico1.svg" alt="Kalico" fill sizes="176px" className="object-cover" priority />
            </span>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
              Nouvelle-Calédonie
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-[2.5rem]">
              Tout Kalico, en une seule inscription.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/72 md:text-base">
              La seule plateforme locale qui couvre les annonces, le covoiturage entre les communes, les devis Pro et le fret — en XPF, pour la Nouvelle-Calédonie.
            </p>
          </div>

          <div className="mt-8 grid w-full max-w-[620px] gap-3 sm:grid-cols-2">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-left shadow-[0_16px_50px_rgba(0,0,0,0.16)] backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-nc-lagon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-5 text-white/68">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 w-full max-w-[620px] rounded-[2rem] border border-white/10 bg-[rgba(2,16,27,0.72)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">Ce que Kalico rassemble</p>
                <p className="mt-1 text-sm text-white/78">Un terrain de jeu utile pour lancer, vendre et développer</p>
              </div>
              <BadgeCheck className="h-6 w-6 text-nc-lagon" />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {quickWins.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-left">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-nc-lagon">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/70">{text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/16 bg-white/8 px-4 py-[14px] text-left">
              <div>
                <p className="text-sm font-semibold text-white">Publier, échanger, réserver, développer.</p>
                <p className="mt-1 text-xs leading-5 text-white/70">Dès votre inscription, votre compte est actif sur toutes les fonctionnalités — aucune étape cachée.</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-nc-lagon" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
