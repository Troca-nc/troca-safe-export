'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  FileText,
  Hammer,
  Home,
  LayoutDashboard,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  Store,
  Truck,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

import { Placeholder } from '@/components/demo/Placeholder'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, DeepPanel } from '@/components/ui/Card'
import FeedbackAlert from '@/components/ui/FeedbackAlert'
import { Skeleton } from '@/components/ui/Skeleton'
import { getProOfferPageData } from '@/lib/data/pro-offers'
import {
  buildComparisonRows,
  formatXpf,
  getAnnualSavingsXpf,
  getDisplayedPrice,
  planFeatureHighlights,
} from '@/lib/proOffersPresentation'
import type { ProBillingCycle, ProModule, ProModuleKey, ProOfferPageData, ProSector } from '@/types/pro-offers'

const moduleIcons: Record<ProModuleKey, LucideIcon> = {
  showcase: LayoutDashboard,
  quotes: FileText,
  bookings: CalendarDays,
  transport: Users,
  delivery: Truck,
  visibility: BarChart3,
}

const sectorIcons: Record<ProSector['icon'], LucideIcon> = {
  building: Building2,
  car: Car,
  hammer: Hammer,
  utensils: Utensils,
  users: Users,
  truck: Truck,
  home: Home,
  store: Store,
}

function SectionHeading({ eyebrow, title, description, centered = false }: { eyebrow: string; title: string; description?: string; centered?: boolean }) {
  return (
    <div className={centered ? 'mx-auto max-w-title text-center' : 'max-w-title'}>
      <p className="text-eyebrow uppercase text-accent-text">{eyebrow}</p>
      <h2 className="mt-3 font-display text-h3 font-normal text-ink sm:text-h2">{title}</h2>
      {description ? <p className="mt-4 text-body text-ink/70">{description}</p> : null}
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="rounded-card border border-cream/15 bg-cream/5 p-4 shadow-panel sm:p-5" aria-label="Aperçu schématique de l’espace professionnel">
      <div className="flex items-center justify-between gap-4 border-b border-cream/15 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-control bg-accent text-ink"><LayoutDashboard className="h-5 w-5" aria-hidden="true" /></span>
          <div><p className="text-eyebrow-sm uppercase text-cream/55">Espace Pro</p><p className="text-body-sm font-semibold text-cream">Tableau de bord</p></div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-pill border border-reef-on-deep/30 bg-reef/15 px-3 py-2 text-body-sm font-semibold text-reef-on-deep"><BadgeCheck className="h-4 w-4" aria-hidden="true" />Profil vérifié</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          [MessageSquareText, 'Contacts'],
          [FileText, 'Devis'],
          [CalendarDays, 'Rendez-vous'],
        ].map(([Icon, label]) => {
          const PreviewIcon = Icon as LucideIcon
          return <div key={label as string} className="rounded-control bg-cream/10 p-4"><PreviewIcon className="h-5 w-5 text-accent" aria-hidden="true" /><p className="mt-5 text-body-sm font-semibold text-cream">{label as string}</p><div className="mt-3 h-2 rounded-pill bg-cream/15" /><div className="mt-2 h-2 w-2/3 rounded-pill bg-cream/10" /></div>
        })}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <div className="rounded-control bg-cream/10 p-4"><div className="flex items-center justify-between gap-3"><p className="text-body-sm font-semibold text-cream">Activité récente</p><BarChart3 className="h-5 w-5 text-reef-on-deep" aria-hidden="true" /></div><div className="mt-5 flex h-24 items-end gap-2" aria-hidden="true">{['h-8', 'h-14', 'h-11', 'h-20', 'h-16', 'h-24', 'h-20'].map((height, index) => <span key={`${height}-${index}`} className={`flex-1 rounded-control bg-accent/70 ${height}`} />)}</div></div>
        <div className="grid gap-3">{['Vitrine', 'Annonces', 'Visibilité'].map((label) => <div key={label} className="flex min-h-12 items-center justify-between gap-3 rounded-control bg-cream/10 px-4"><span className="text-body-sm font-semibold text-cream">{label}</span><Check className="h-4 w-4 text-reef-on-deep" aria-hidden="true" /></div>)}</div>
      </div>
    </div>
  )
}

function ModulePreview({ module }: { module: ProModule }) {
  const Icon = moduleIcons[module.id]
  return (
    <Card className="h-full hover:border-sand">
      <div className="flex items-center justify-between gap-4 border-b border-warm-border pb-5">
        <div><p className="text-eyebrow-sm uppercase text-accent-text">Aperçu du module</p><h3 className="mt-2 font-display text-h4 font-semibold">{module.eyebrow}</h3></div>
        <span className="flex h-11 w-11 items-center justify-center rounded-control bg-accent-soft text-accent-text"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      </div>
      <div className="mt-5 grid gap-3">
        {module.benefits.slice(0, 3).map((benefit, index) => (
          <div key={benefit} className="flex min-h-16 items-center gap-3 rounded-control bg-cream-sunken px-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-cream-surface font-display text-h5 text-ink">{index + 1}</span>
            <span className="text-body-sm font-semibold text-ink">{benefit}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-control border border-info/20 bg-info/10 p-4 text-body-sm text-info-text"><PackageCheck className="h-5 w-5 shrink-0" aria-hidden="true" />Un espace structuré pour suivre votre activité.</div>
    </Card>
  )
}

function PageSkeleton() {
  return (
    <main className="bg-cream text-ink" aria-busy="true" aria-label="Chargement de l’offre Pro">
      <section className="mx-auto max-w-site px-4 py-8 sm:px-6 sm:py-12"><Skeleton className="h-[560px] rounded-block" /></section>
      <section className="mx-auto max-w-site px-4 py-16 sm:px-6"><Skeleton className="h-12 max-w-2xl" /><Skeleton className="mt-5 h-6 max-w-xl" /><div className="mt-10 grid gap-5 lg:grid-cols-3"><Skeleton className="h-72" /><Skeleton className="h-72" /><Skeleton className="h-72" /></div></section>
      <section className="mx-auto max-w-site px-4 pb-20 sm:px-6"><Skeleton className="h-[480px] rounded-block" /></section>
    </main>
  )
}

export default function ProOffersPageView() {
  const [data, setData] = useState<ProOfferPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeModule, setActiveModule] = useState<ProModuleKey>('showcase')
  const [cycle, setCycle] = useState<ProBillingCycle>('monthly')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await getProOfferPageData())
    } catch {
      setData(null)
      setError("L’offre Pro ne peut pas être chargée pour le moment.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const selectedModule = data?.modules.find((module) => module.id === activeModule) ?? data?.modules[0]
  const comparisonRows = useMemo(() => buildComparisonRows(data?.plans ?? []), [data?.plans])

  return (
    <>
      <Header />
      {loading ? <PageSkeleton /> : null}
      {!loading && error ? (
        <main className="min-h-[70vh] bg-cream px-4 py-16 text-ink sm:px-6">
          <div className="mx-auto max-w-2xl"><FeedbackAlert tone="error" title="Chargement impossible"><p>{error}</p><Button variant="secondary" className="mt-4" onClick={() => void load()}><RefreshCw className="h-4 w-4" aria-hidden="true" />Réessayer</Button></FeedbackAlert></div>
        </main>
      ) : null}
      {!loading && data ? (
        <main className="overflow-hidden bg-cream text-ink">
          <section className="mx-auto max-w-site px-4 py-6 sm:px-6 sm:py-10">
            <DeepPanel className="p-6 sm:p-10 lg:p-12">
              <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div>
                  <p className="text-eyebrow uppercase text-accent">Kalico Pro</p>
                  <h1 className="mt-4 max-w-3xl font-display text-h2 font-normal text-cream sm:text-h1-form">Votre activité locale mérite un espace à sa mesure</h1>
                  <p className="mt-5 max-w-2xl text-body-lg text-cream/75">Vitrine, devis, rendez-vous, transport et visibilité réunis dans un seul espace professionnel.</p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/inscription" className="k-button k-button-primary"><span className="flex items-center justify-center gap-2">Créer mon compte Pro<ArrowRight className="h-4 w-4" aria-hidden="true" /></span></Link><Link href="/pro/vitrine-exemple" className="k-button k-button-ghost">Voir une vitrine exemple</Link></div>
                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ['membres', 'membres'],
                      ['visitesMois', 'visites mensuelles'],
                      ['annoncesEnLigne', 'annonces en ligne'],
                      ['prosVerifies', 'pros vérifiés'],
                    ].map(([key, label]) => <div key={key} className="rounded-control border border-cream/15 bg-cream/5 p-3"><p className="font-display text-h4 text-accent"><Placeholder k={key as 'membres' | 'visitesMois' | 'annoncesEnLigne' | 'prosVerifies'} /></p><p className="mt-1 text-body-sm text-cream/65">{label}</p></div>)}
                  </div>
                </div>
                <DashboardPreview />
              </div>
            </DeepPanel>
          </section>

          <section className="mx-auto max-w-site px-4 py-16 sm:px-6 sm:py-20" id="modules">
            <SectionHeading eyebrow="Six modules, un seul espace" title="Les outils essentiels pour présenter, organiser et développer votre activité" description="Activez les usages qui correspondent à votre métier et retrouvez-les depuis le même tableau de bord." />
            <div className="mt-10 hidden gap-6 lg:grid lg:grid-cols-[360px_minmax(0,1fr)]">
              <div role="tablist" aria-label="Modules Pro" className="grid content-start gap-2">
                {data.modules.map((module) => { const Icon = moduleIcons[module.id]; const selected = module.id === selectedModule?.id; return <button key={module.id} type="button" role="tab" aria-selected={selected} aria-controls="module-panel" onClick={() => setActiveModule(module.id)} className={`flex min-h-16 items-center gap-3 rounded-control border px-4 text-left text-body-sm font-semibold transition-colors ${selected ? 'border-ink bg-ink text-cream shadow-card' : 'border-warm-border bg-cream-surface text-ink hover:border-ink'}`}><Icon className={`h-5 w-5 shrink-0 ${selected ? 'text-accent' : 'text-info-text'}`} aria-hidden="true" /><span>{module.eyebrow}</span></button> })}
              </div>
              {selectedModule ? <div id="module-panel" role="tabpanel" className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><div className="self-center"><p className="text-eyebrow uppercase text-accent-text">{selectedModule.eyebrow}</p><h3 className="mt-3 font-display text-h3 font-normal">{selectedModule.title}</h3><p className="mt-4 text-body text-ink/70">{selectedModule.description}</p><ul className="mt-6 grid gap-3">{selectedModule.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-3 text-body-sm text-ink/75"><span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-reef/15 text-reef-text"><Check className="h-3 w-3" aria-hidden="true" /></span>{benefit}</li>)}</ul></div><ModulePreview module={selectedModule} /></div> : null}
            </div>
            <div className="mt-8 grid gap-3 lg:hidden">
              {data.modules.map((module) => { const Icon = moduleIcons[module.id]; const open = module.id === activeModule; return <div key={module.id} className="rounded-card border border-warm-border bg-cream-surface shadow-card"><button type="button" aria-expanded={open} aria-controls={`mobile-module-${module.id}`} onClick={() => setActiveModule(module.id)} className="flex min-h-16 w-full items-center gap-3 px-4 text-left text-body-sm font-semibold"><span className="flex h-10 w-10 items-center justify-center rounded-control bg-accent-soft text-accent-text"><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="flex-1">{module.eyebrow}</span><ChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" /></button>{open ? <div id={`mobile-module-${module.id}`} className="border-t border-warm-border p-4"><h3 className="font-display text-h4">{module.title}</h3><p className="mt-3 text-body-sm text-ink/70">{module.description}</p><ul className="mt-4 grid gap-3">{module.benefits.map((benefit) => <li key={benefit} className="flex gap-3 text-body-sm"><Check className="mt-1 h-4 w-4 shrink-0 text-reef-text" aria-hidden="true" />{benefit}</li>)}</ul></div> : null}</div> })}
            </div>
          </section>

          <section className="bg-cream-sunken py-16 sm:py-20">
            <div className="mx-auto max-w-site px-4 sm:px-6">
              <SectionHeading eyebrow="Pour les pros d’ici" title="Un espace qui s’adapte à votre secteur" description="Présentez vos services avec les outils utiles à votre quotidien, quel que soit votre métier." centered />
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.sectors.map((sector) => { const Icon = sectorIcons[sector.icon]; return <Card key={sector.id} className="hover:border-ink"><span className="flex h-11 w-11 items-center justify-center rounded-control bg-info/15 text-info-text"><Icon className="h-5 w-5" aria-hidden="true" /></span><h3 className="mt-5 font-display text-h4 font-semibold">{sector.title}</h3><p className="mt-2 text-body-sm text-ink/65">{sector.description}</p></Card> })}</div>
            </div>
          </section>

          <section className="mx-auto max-w-site px-4 py-16 sm:px-6 sm:py-20" id="tarifs">
            <SectionHeading eyebrow="Des tarifs lisibles" title="Choisissez le rythme qui convient à votre activité" description="Les prix et avantages affichés sont chargés directement depuis le catalogue des abonnements Kalico." centered />
            <div className="mx-auto mt-8 flex w-fit rounded-pill border border-warm-border bg-cream-sunken p-1" aria-label="Période de facturation">
              {(['monthly', 'yearly'] as const).map((value) => <button key={value} type="button" aria-pressed={cycle === value} onClick={() => setCycle(value)} className={`min-h-11 rounded-pill px-5 text-body-sm font-semibold transition-colors ${cycle === value ? 'bg-ink text-cream shadow-card' : 'text-ink hover:bg-cream-surface'}`}>{value === 'monthly' ? 'Mensuel' : 'Annuel'}</button>)}
            </div>
            <div className="mx-auto mt-10 grid max-w-4xl gap-5 lg:grid-cols-2">
              {data.plans.map((plan) => { const isPro = plan.id === 'pro'; const price = getDisplayedPrice(plan, cycle); const savings = getAnnualSavingsXpf(plan); return <Card key={plan.id} className={`relative flex flex-col hover:border-ink ${isPro ? 'border-ink shadow-panel' : ''}`}>{isPro ? <span className="absolute right-5 top-5 rounded-pill bg-accent-soft px-3 py-2 text-body-sm font-semibold text-accent-text">Pour les professionnels</span> : null}<p className="text-eyebrow uppercase text-accent-text">Formule {plan.name}</p><h3 className="mt-4 font-display text-h3 font-normal">{plan.name}</h3><div className="mt-6"><span className="font-display text-price-lg text-ink">{formatXpf(price)}</span><p className="mt-2 text-body-sm text-ink/60">{cycle === 'yearly' ? 'par an' : 'par mois'}</p>{cycle === 'yearly' && isPro && savings > 0 ? <p className="mt-2 text-body-sm font-semibold text-reef-text">{formatXpf(savings)} économisés sur douze mensualités</p> : null}</div><ul className="mt-7 grid flex-1 gap-3 border-t border-warm-border pt-6">{planFeatureHighlights(plan).map((feature) => <li key={feature} className="flex gap-3 text-body-sm text-ink/75"><Check className="mt-1 h-4 w-4 shrink-0 text-reef-text" aria-hidden="true" />{feature}</li>)}</ul><Link href="/inscription" className={`k-button mt-8 ${isPro ? 'k-button-primary' : 'k-button-secondary'}`}>Choisir {plan.name}</Link></Card> })}
            </div>
          </section>

          <section className="mx-auto max-w-site px-4 pb-16 sm:px-6 sm:pb-20">
            <SectionHeading eyebrow="Comparer les formules" title="Les avantages, ligne par ligne" description="Chaque élément ci-dessous provient du catalogue actuel des abonnements." />
            <div className="mt-10 hidden overflow-hidden rounded-card border border-warm-border bg-cream-surface shadow-card sm:block">
              <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(150px,0.6fr)_minmax(150px,0.6fr)] bg-ink px-6 py-4 text-body-sm font-semibold text-cream"><span>Fonctionnalité</span><span>Gratuit</span><span>Pro</span></div>
              {comparisonRows.map((row) => <div key={row.label} className="grid grid-cols-[minmax(0,1.4fr)_minmax(150px,0.6fr)_minmax(150px,0.6fr)] items-center border-t border-warm-border px-6 py-4 text-body-sm"><span className="font-semibold">{row.label}</span><span className="text-ink/65">{row.free}</span><span className="font-semibold text-reef-text">{row.pro}</span></div>)}
            </div>
            <div className="mt-8 grid gap-3 sm:hidden">{comparisonRows.map((row) => <Card key={row.label} className="p-4 hover:border-sand"><h3 className="text-body-sm font-semibold">{row.label}</h3><dl className="mt-3 grid grid-cols-2 gap-3 text-body-sm"><div className="rounded-control bg-cream-sunken p-3"><dt className="font-semibold">Gratuit</dt><dd className="mt-1 text-ink/65">{row.free}</dd></div><div className="rounded-control bg-reef/10 p-3"><dt className="font-semibold text-reef-text">Pro</dt><dd className="mt-1 text-reef-text">{row.pro}</dd></div></dl></Card>)}</div>
          </section>

          <section className="mx-auto max-w-site px-4 pb-16 sm:px-6 sm:pb-20">
            <DeepPanel className="p-7 text-center sm:p-12"><p className="text-eyebrow uppercase text-accent">Prêt à vous lancer ?</p><h2 className="mx-auto mt-4 max-w-title font-display text-h3 font-normal text-cream sm:text-h2">Faites de Kalico votre vitrine professionnelle en Nouvelle-Calédonie</h2><p className="mx-auto mt-5 max-w-2xl text-body text-cream/75">Créez votre compte, présentez votre activité et choisissez la formule adaptée à vos besoins.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/inscription" className="k-button k-button-primary"><span className="flex items-center justify-center gap-2">Créer mon compte Pro<ArrowRight className="h-4 w-4" aria-hidden="true" /></span></Link><Link href="/pros" className="k-button k-button-ghost">Découvrir les professionnels</Link></div></DeepPanel>
          </section>
        </main>
      ) : null}
    </>
  )
}
