'use client'

import { useCallback, useEffect, useState } from 'react'
import { Files, LayoutDashboard, ListChecks, Store } from 'lucide-react'

import ProDashboardOverview from '@/components/pro/ProDashboardOverview'
import ProQuoteTemplatesTab from '@/components/pro/ProQuoteTemplatesTab'
import ProQuoteTrackingTab from '@/components/pro/ProQuoteTrackingTab'
import ProShopTab from '@/components/pro/ProShopTab'
import { DeepPanel } from '@/components/ui/Card'
import { ErrorState, LoadingState, Skeleton } from '@/components/ui/Skeleton'
import { getProSpaceData } from '@/lib/data/pro-space'
import { useAuthStore } from '@/store/authStore'
import type { ProSpaceData } from '@/types/pro-space'

type TabId = 'dashboard' | 'shop' | 'templates' | 'tracking'

const tabs: Array<{ id: TabId; label: string; description: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Tableau de bord', description: 'Activité et priorités', icon: LayoutDashboard },
  { id: 'shop', label: 'Ma boutique', description: 'Vitrine et stocks', icon: Store },
  { id: 'templates', label: 'Modèles de devis', description: 'Lignes et calculs', icon: Files },
  { id: 'tracking', label: 'Suivi des devis', description: 'Demandes et étapes', icon: ListChecks },
]

function PageSkeleton() {
  return (
    <main className="min-h-screen bg-cream px-4 py-8 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-container gap-6">
        <Skeleton className="h-52 rounded-block" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        <LoadingState><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div><Skeleton className="h-80" /></LoadingState>
      </div>
    </main>
  )
}

export default function ProSpaceView() {
  const { user } = useAuthStore()
  const numericProId = Number(user?.id ?? 0)
  const loadProId = Number.isFinite(numericProId) && numericProId > 0 ? numericProId : user?.is_pro ? -1 : 0
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [data, setData] = useState<ProSpaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!loadProId) return
    setLoading(true)
    setError(false)
    try {
      setData(await getProSpaceData(loadProId))
    } catch {
      setData(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [loadProId])

  useEffect(() => { void load() }, [load])

  if (loading || !loadProId) return <PageSkeleton />

  if (error || !data) {
    return <main className="min-h-[70vh] bg-cream px-4 py-16 text-ink sm:px-6"><div className="mx-auto max-w-2xl"><ErrorState message="L’espace Pro n’a pas pu être chargé." onRetry={() => void load()} /></div></main>
  }

  const displayName = data.profile?.pro_company_name || user?.first_name || user?.prenom || 'Votre activité'
  const proId = data.profile?.id ?? loadProId

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto grid max-w-container gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <DeepPanel className="p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-eyebrow uppercase text-accent">Espace Pro</p>
              <h1 className="mt-3 max-w-title font-display text-h2 font-normal text-cream">Pilotez {displayName}</h1>
              <p className="mt-4 max-w-2xl text-body text-cream/75">Retrouvez vos signaux utiles, votre catalogue et vos devis depuis un espace construit sur les données réellement disponibles.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
              <div className="rounded-control border border-cream/15 bg-cream/5 p-3"><p className="font-display text-h4 text-accent">{data.dashboard.listings.active}</p><p className="mt-1 text-label-sm text-cream/65">annonces actives</p></div>
              <div className="rounded-control border border-cream/15 bg-cream/5 p-3"><p className="font-display text-h4 text-accent">{data.products.length}</p><p className="mt-1 text-label-sm text-cream/65">références</p></div>
              <div className="col-span-2 rounded-control border border-cream/15 bg-cream/5 p-3 sm:col-span-1"><p className="font-display text-h4 text-accent">{data.quotes.length}</p><p className="mt-1 text-label-sm text-cream/65">devis suivis</p></div>
            </div>
          </div>
        </DeepPanel>

        <nav className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="tablist" aria-label="Sections de l’espace Pro">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const selected = activeTab === tab.id
            return <button key={tab.id} type="button" role="tab" id={`tab-${tab.id}`} aria-selected={selected} aria-controls={`panel-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={`flex min-h-20 items-center gap-3 rounded-card border px-4 text-left transition ${selected ? 'border-ink bg-ink text-cream shadow-panel' : 'border-warm-border bg-cream-surface text-ink shadow-card hover:border-ink'}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${selected ? 'bg-accent text-ink' : 'bg-info-soft text-info-text'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span><span><span className="block font-semibold">{tab.label}</span><span className={`mt-1 hidden text-label-sm sm:block ${selected ? 'text-cream/65' : 'text-ink/55'}`}>{tab.description}</span></span></button>
          })}
        </nav>

        <section id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} tabIndex={0}>
          {activeTab === 'dashboard' ? <ProDashboardOverview data={data} /> : null}
          {activeTab === 'shop' ? <ProShopTab data={data} proId={proId} /> : null}
          {activeTab === 'templates' ? <ProQuoteTemplatesTab initialTemplates={data.templates} config={data.quoteConfig} /> : null}
          {activeTab === 'tracking' ? <ProQuoteTrackingTab initialQuotes={data.quotes} requests={data.requests} /> : null}
        </section>
      </div>
    </main>
  )
}
