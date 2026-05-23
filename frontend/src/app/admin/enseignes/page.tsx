'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Eye, Shield, Star, Store, Trash2, AlertTriangle } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { adminBusinessesApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

type BusinessRow = {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  contact_email?: string | null
  category?: string | null
  badge?: 'none' | 'active' | 'verified'
  verified_at?: string | null
  bon_plan_count?: number
  review_avg?: number | null
  review_count?: number | null
}

type ReportedReview = {
  id: string
  comment?: string | null
  rating?: number
  reported?: boolean
  business_name?: string
  user_name?: string
  created_at?: string
  report_reason?: string | null
}

export default function AdminBusinessesPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'verified'>('all')

  const { data: businessesData, refetch: refetchBusinesses } = useQuery({
    queryKey: ['adminBusinesses', filter],
    queryFn: async () => {
      const response = await adminBusinessesApi.list({ badge: filter === 'all' ? undefined : filter })
      return response.data as { data: BusinessRow[] }
    },
    staleTime: 30_000,
  })

  const { data: reportedData, refetch: refetchReported } = useQuery({
    queryKey: ['adminBusinesses', 'reported'],
    queryFn: async () => {
      const response = await adminBusinessesApi.reportedReviews()
      return response.data as { data: ReportedReview[] }
    },
    staleTime: 30_000,
  })

  const businesses = businessesData?.data ?? []
  const reported = reportedData?.data ?? []

  const visibleBusinesses = useMemo(() => {
    if (filter === 'active') return businesses.filter((business) => business.badge === 'active')
    if (filter === 'verified') return businesses.filter((business) => business.badge === 'verified')
    return businesses
  }, [businesses, filter])

  const verify = async (id: string) => {
    await adminBusinessesApi.verify(id)
    void refetchBusinesses()
  }

  const unverify = async (id: string) => {
    await adminBusinessesApi.unverify(id)
    void refetchBusinesses()
  }

  const keepReview = async (id: string) => {
    await adminBusinessesApi.keepReview(id)
    void refetchReported()
  }

  const deleteReview = async (id: string) => {
    await adminBusinessesApi.deleteReview(id)
    void refetchReported()
  }

  return (
    <AdminLayout>
      <div className="border-b border-night/8 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-coral" />
          <div>
            <h1 className="text-xl font-bold text-night">Enseignes</h1>
            <p className="text-sm text-night/60">Vérification manuelle, badges et modération des avis signalés.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'active', label: 'À vérifier' },
            { id: 'verified', label: 'Vérifiées' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as typeof filter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filter === item.id
                  ? 'border-coral bg-coral text-white'
                  : 'border-night/10 bg-white text-night/60 hover:border-coral/30 hover:text-coral'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <section className="rounded-3xl border border-night/8 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-night/50">Catalogue enseignes</p>
                <h2 className="mt-1 text-lg font-semibold text-night">Triées par activité</h2>
              </div>
              <span className="rounded-full bg-sand px-3 py-1 text-xs font-medium text-night/60">{visibleBusinesses.length} enseignes</span>
            </div>
            <div className="space-y-3">
              {visibleBusinesses.map((business) => (
                <div key={business.id} className="flex flex-col gap-3 rounded-2xl border border-night/8 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    {business.logo_url ? (
                      <img src={business.logo_url} alt={business.name} className="h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand text-coral">
                        <Store className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-night">{business.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          business.badge === 'verified'
                            ? 'bg-emerald-50 text-emerald-700'
                            : business.badge === 'active'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-sand text-night/50'
                        }`}>
                          {business.badge === 'verified' ? 'Vérifiée' : business.badge === 'active' ? 'Active' : 'Aucun paiement'}
                        </span>
                      </div>
                      <p className="text-xs text-night/50">
                        {business.category || 'Catégorie inconnue'} · {business.bon_plan_count ?? 0} bons plans · {business.review_count ?? 0} avis
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <Star className="h-3.5 w-3.5" />
                      {Number(business.review_avg ?? 0).toFixed(1)}
                    </span>
                    {business.badge === 'verified' ? (
                      <button onClick={() => void unverify(business.id)} className="btn-ghost px-3 py-2 text-xs">Révoquer</button>
                    ) : (
                      <button onClick={() => void verify(business.id)} className="btn-primary px-3 py-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Vérifier
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-night/8 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-night/50">Avis signalés</p>
                <h2 className="mt-1 text-lg font-semibold text-night">À modérer</h2>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-3">
              {reported.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-night/10 p-6 text-center text-sm text-night/50">
                  Aucun avis signalé pour le moment.
                </div>
              ) : reported.map((review) => (
                <div key={review.id} className="rounded-2xl border border-night/8 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-night">{review.business_name}</p>
                      <p className="text-xs text-night/50">{review.user_name} · {review.rating ?? '—'}★</p>
                    </div>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Signalé</span>
                  </div>
                  <p className="mt-3 text-sm text-night/70">{review.comment || '—'}</p>
                  <p className="mt-2 text-xs text-night/40">{review.report_reason || 'Signalement automatique ou manuel'}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => void keepReview(review.id)} className="btn-ghost px-3 py-2 text-xs">
                      <Eye className="h-3.5 w-3.5" />
                      Garder
                    </button>
                    <button onClick={() => void deleteReview(review.id)} className="btn-primary px-3 py-2 text-xs bg-red-600 hover:bg-red-700">
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}
