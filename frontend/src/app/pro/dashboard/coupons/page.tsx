'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, Loader2, QrCode, PlusCircle, Power, Trash2 } from 'lucide-react'

import { couponsApi } from '@/lib/api'

type CouponItem = {
  id: number
  code: string
  label: string
  description?: string | null
  discount_type: string
  discount_value?: number | null
  min_purchase_xpf?: number | null
  max_uses?: number | null
  uses_count?: number | null
  uses_per_user?: number | null
  valid_from?: string | null
  valid_until?: string | null
  is_active?: boolean
  qr_code_url?: string | null
  public_url?: string | null
  bon_plan_title?: string | null
  business_name?: string | null
}

const INITIAL_FORM = {
  label: '',
  description: '',
  discount_type: 'fixed_xpf',
  discount_value: '1500',
  min_purchase_xpf: '0',
  max_uses: '',
  uses_per_user: '1',
  valid_from: '',
  valid_until: '',
}

function formatDiscount(coupon: CouponItem) {
  if (coupon.discount_type === 'percent') return `-${coupon.discount_value || 0}%`
  if (coupon.discount_type === 'fixed_xpf') return `-${Number(coupon.discount_value || 0).toLocaleString('fr-FR')} XPF`
  if (coupon.discount_type === 'free_item') return 'Article offert'
  if (coupon.discount_type === 'free_shipping') return 'Livraison offerte'
  return 'Autre avantage'
}

export default function CouponsPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [coupons, setCoupons] = useState<CouponItem[]>([])

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const response = await couponsApi.listMine()
      setCoupons(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch {
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCoupons()
  }, [])

  const generatedCoupon = useMemo(() => coupons[0] || null, [coupons])

  const handleChange = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await couponsApi.create({
        ...form,
        discount_value: form.discount_value ? Number(form.discount_value) : null,
        min_purchase_xpf: form.min_purchase_xpf ? Number(form.min_purchase_xpf) : 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        uses_per_user: form.uses_per_user ? Number(form.uses_per_user) : 1,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
      })
      const created = response.data?.data as CouponItem | undefined
      setSuccess(created ? `Coupon ${created.code} cr��.` : 'Coupon cr��.')
      setForm(INITIAL_FORM)
      await loadCoupons()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de cr�er le coupon.')
    } finally {
      setSaving(false)
    }
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setSuccess(`Code ${code} copi�.`)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Mes coupons</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-night">Cr�er et g�rer des coupons</h1>
        <p className="mt-2 text-sm text-night/60">G�n�rez un code court, un QR scannable et un lien public pour vos clients.</p>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-[#0A7EA4]" />
            <h2 className="text-lg font-bold text-night">Nouveau coupon</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-night">Label *</span>
              <input value={form.label} onChange={(e) => handleChange('label', e.target.value)} required className="input w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-night">Description</span>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={4} className="input w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Type de r�duction</span>
              <select value={form.discount_type} onChange={(e) => handleChange('discount_type', e.target.value)} className="input w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm">
                <option value="fixed_xpf">Montant fixe</option>
                <option value="percent">Pourcentage</option>
                <option value="free_item">Article offert</option>
                <option value="free_shipping">Livraison offerte</option>
                <option value="other">Autre</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Valeur</span>
              <input value={form.discount_value} onChange={(e) => handleChange('discount_value', e.target.value)} inputMode="numeric" className="input w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Achat minimum XPF</span>
              <input value={form.min_purchase_xpf} onChange={(e) => handleChange('min_purchase_xpf', e.target.value)} inputMode="numeric" className="input w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Utilisations max</span>
              <input value={form.max_uses} onChange={(e) => handleChange('max_uses', e.target.value)} inputMode="numeric" placeholder="Illimit�" className="input w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Par utilisateur</span>
              <input value={form.uses_per_user} onChange={(e) => handleChange('uses_per_user', e.target.value)} inputMode="numeric" className="input w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Valide du</span>
              <input value={form.valid_from} onChange={(e) => handleChange('valid_from', e.target.value)} type="date" className="input w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Au</span>
              <input value={form.valid_until} onChange={(e) => handleChange('valid_until', e.target.value)} type="date" className="input w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm" />
            </label>
          </div>

          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#065f7a] disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            G�n�rer le coupon
          </button>
        </form>

        <div className="space-y-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-night">Coupons cr��s</h2>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{coupons.length} coupon{coupons.length > 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-sand/60" />
          ) : coupons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)] p-5 text-sm text-night/55">
              Aucun coupon pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <article key={coupon.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-night">{coupon.label}</p>
                      <p className="mt-1 text-xs text-night/55">{coupon.description || 'Aucune description'}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${coupon.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {coupon.is_active ? 'Actif' : 'D�sactiv�'}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-night/65 sm:grid-cols-2">
                    <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-night">{coupon.code}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-night">{formatDiscount(coupon)}</span>
                    <span className="rounded-full bg-white px-2.5 py-1">Utilisations {coupon.uses_count ?? 0}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}</span>
                    <span className="rounded-full bg-white px-2.5 py-1">Validit� {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString('fr-FR') : 'illimit�e'}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => copyCode(coupon.code)} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-night">
                      <Copy className="h-4 w-4" />
                      Copier
                    </button>
                    {coupon.public_url ? (
                      <a href={coupon.public_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-[#0A7EA4] px-3 py-2 text-xs font-semibold text-white">
                        <QrCode className="h-4 w-4" />
                        Ouvrir
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={async () => {
                        await couponsApi.deactivate(coupon.id)
                        await loadCoupons()
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                    >
                      <Power className="h-4 w-4" />
                      D�sactiver
                    </button>
                  </div>

                  {coupon.qr_code_url ? (
                    <img src={coupon.qr_code_url} alt={`QR ${coupon.code}`} className="mt-3 h-40 w-40 rounded-2xl border border-[var(--color-border)] bg-white p-2" />
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {generatedCoupon ? (
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Dernier coupon</p>
          <p className="mt-2 text-lg font-bold text-night">{generatedCoupon.code}</p>
        </div>
      ) : null}
    </div>
  )
}
