'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, Sparkles } from 'lucide-react'

import Header from '@/components/layout/Header'
import BonPlanCard, { type BonPlanCardModel } from '@/components/bon-plans/BonPlanCard'
import { bonPlansApi, businessesApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

const CATEGORY_TABS = [
  { value: '', label: 'Tout' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'mode', label: 'Mode' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'high_tech', label: 'High-Tech' },
  { value: 'auto_moto', label: 'Auto/Moto' },
  { value: 'maison', label: 'Maison' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'services', label: 'Services' },
  { value: 'sport', label: 'Sport' },
  { value: 'voyages', label: 'Voyages' },
  { value: 'autre', label: 'Autre' },
] as const

type BusinessOption = {
  name: string
  slug?: string | null
  business_logo_url?: string | null
  business_badge?: string | null
}

export default function BonsPlansPage() {
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [items, setItems] = useState<BonPlanCardModel[]>([])
  const [businesses, setBusinesses] = useState<BusinessOption[]>([])
  const [q, setQ] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingFollow, setSavingFollow] = useState(false)

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      try {
        const [listRes, businessesRes] = await Promise.all([
          bonPlansApi.list({
            limit: 24,
            q: q.trim() || undefined,
            category: category || undefined,
            business_name: businessName.trim() || undefined,
          }),
          bonPlansApi.businesses(),
        ])
        if (!alive) return
        setItems(Array.isArray(listRes.data?.data) ? listRes.data.data : [])
        setBusinesses(Array.isArray(businessesRes.data?.data) ? businessesRes.data.data : [])
      } catch {
        if (!alive) return
        setItems([])
        setBusinesses([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [q, category, businessName])

  const activeBusinessSuggestions = useMemo(
    () => businesses.filter((item) => item.name.toLowerCase().includes(businessName.toLowerCase().trim())).slice(0, 6),
    [businessName, businesses]
  )

  const handleFollowBusiness = async (business: string) => {
    if (!isAuthenticated) {
      openAuthModal({
        type: 'publish_listing',
        redirectTo: '/bons-plans',
      })
      return
    }

    setSavingFollow(true)
    try {
      const current = await bonPlansApi.getPrefs().catch(() => ({ data: { data: { notify_businesses: [] } } }))
      const prefs = current.data?.data || {}
      const nextBusinesses = Array.from(new Set([...(prefs.notify_businesses || []), business]))
      await bonPlansApi.savePrefs({
        ...prefs,
        notify_all: true,
        notify_businesses: nextBusinesses,
        via_push: true,
      })
      window.alert(`Vous suivez maintenant ${business}.`)
    } catch {
      window.alert("Impossible d'ajouter l'enseigne aux suivis.")
    } finally {
      setSavingFollow(false)
    }
  }

  return (
    <main className="min-h-screen bg-sand-light text-night">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-[2rem] border border-night/8 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.16))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.14)] md:px-8 md:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-lagoon">
            <Sparkles className="h-3.5 w-3.5" />
            Les Bons Plans du moment
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">
            Les meilleures promos des enseignes de Nouvelle-Calédonie
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/72 md:text-base">
            Vitrine digitale self-service pour enseignes locales, offres ciblées et publications visibles immédiatement après paiement.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/bons-plans/publier" className="btn-primary rounded-2xl px-4 py-3">
              Publier ma promo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/abonnement" className="btn-secondary rounded-2xl px-4 py-3">
              Voir les avantages Pro
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6">
        <div className="rounded-[2rem] border border-night/8 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher une promotion, une enseigne..."
                className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 pl-11 text-sm outline-none transition focus:border-coral/35 focus:ring-4 focus:ring-coral/10"
              />
            </div>
            <div className="flex-1">
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Filtrer par enseigne"
                list="bon-plans-businesses"
                className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-coral/35 focus:ring-4 focus:ring-coral/10"
              />
              <datalist id="bon-plans-businesses">
                {activeBusinessSuggestions.map((business) => (
                  <option key={business.slug || business.name} value={business.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {CATEGORY_TABS.map((tab) => {
              const active = tab.value === category
              return (
                <button
                  key={tab.value || 'all'}
                  type="button"
                  onClick={() => setCategory(tab.value)}
                  className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-coral bg-coral text-white'
                      : 'border-night/10 bg-sand text-night/65 hover:border-coral/30 hover:text-coral'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[420px] animate-pulse rounded-[1.5rem] border border-night/8 bg-white/70" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((bonPlan) => (
              <BonPlanCard
                key={bonPlan.id}
                bonPlan={bonPlan}
                onFollowBusiness={handleFollowBusiness}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-night/8 bg-white px-6 py-14 text-center text-night/55">
            <p className="text-lg font-semibold text-night">Aucun bon plan actif pour le moment</p>
            <p className="mt-2 text-sm">Essayez une autre catégorie ou une autre enseigne.</p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="rounded-[2rem] border border-coral/15 bg-coral/5 px-6 py-7">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral/80">Votre enseigne a une promo ?</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-night">Publiez gratuitement puis choisissez votre durée de visibilité.</h2>
              <p className="mt-1 text-sm text-night/60">Publication immédiate après paiement, à partir de 2 900 XPF.</p>
            </div>
            <Link href="/bons-plans/publier" className="btn-primary rounded-2xl px-4 py-3">
              Publier gratuitement
            </Link>
          </div>
        </div>
      </section>

      {savingFollow ? <div className="fixed bottom-4 right-4 rounded-full bg-night px-4 py-2 text-sm font-semibold text-white shadow-lg">Mise à jour en cours...</div> : null}
    </main>
  )
}
