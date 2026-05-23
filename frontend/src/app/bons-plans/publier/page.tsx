'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, CircleDollarSign, ExternalLink, Upload } from 'lucide-react'

import Header from '@/components/layout/Header'
import { bonPlansApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

const CATEGORIES = [
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
]

export default function PublishBonPlanPage() {
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'payplug'>('stripe')
  const [durationDays, setDurationDays] = useState<7 | 30>(7)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
    business_logo_url: '',
    contact_email: '',
    title: '',
    description: '',
    image_url: '',
    promo_label: '',
    original_price_xpf: '',
    promo_price_xpf: '',
    category: 'services',
    cta_label: 'En profiter',
    cta_url: '',
    promo_valid_from: '',
    promo_valid_until: '',
  })

  const baseAmount = durationDays === 7 ? 2900 : 7900
  const proAmount = durationDays === 7 ? 2320 : 6320
  const discountText = durationDays === 7 ? '2 320 XPF si vous êtes Pro' : '6 320 XPF si vous êtes Pro'
  const preview = useMemo(() => ({
    title: form.title || 'Titre de la promo',
    description: form.description || 'La description de votre bon plan apparaîtra ici.',
    business_name: form.business_name || 'Votre enseigne',
    image_url: form.image_url || null,
    promo_label: form.promo_label || null,
    original_price_xpf: form.original_price_xpf ? Number(form.original_price_xpf) : null,
    promo_price_xpf: form.promo_price_xpf ? Number(form.promo_price_xpf) : null,
    cta_label: form.cta_label || 'En profiter',
    cta_url: form.cta_url || null,
    category: form.category,
  }), [form])

  const handleChange = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAuthenticated) {
      openAuthModal({
        type: 'publish_listing',
        redirectTo: '/bons-plans/publier',
      })
      return
    }

    setSaving(true)
    try {
      const { data } = await bonPlansApi.create({
        ...form,
        duration_days: durationDays,
        payment_provider: paymentProvider,
        title: form.title.trim(),
        description: form.description.trim(),
        business_name: form.business_name.trim(),
        contact_email: form.contact_email.trim(),
        cta_label: form.cta_label.trim() || 'En profiter',
        category: form.category,
      })
      const checkoutUrl = data?.data?.payment_url || data?.data?.checkout_url
      if (checkoutUrl) {
        window.location.assign(checkoutUrl)
      }
    } catch (err: any) {
      window.alert(err?.response?.data?.error || 'Publication impossible.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-sand-light text-night">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-[2rem] border border-night/8 bg-white shadow-sm">
          <div className="bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.14))] px-6 py-8 text-white md:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-lagoon">Self-service enseigne</p>
            <h1 className="mt-3 font-display text-4xl font-bold">Publier une promo en ligne</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/72 md:text-base">
              Créez votre bon plan, choisissez Stripe ou PayPlug, puis votre promo devient visible dès le paiement confirmé.
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="p-6 md:p-8">
              <div className="rounded-[1.5rem] border border-coral/15 bg-coral/5 p-5">
                <p className="font-semibold text-night">Connectez-vous pour continuer.</p>
                <p className="mt-1 text-sm text-night/60">Nous avons besoin de votre compte pour déclencher le paiement et la publication immédiate.</p>
                <button type="button" className="btn-primary mt-4 rounded-2xl px-4 py-3" onClick={() => openAuthModal({ type: 'publish_listing', redirectTo: '/bons-plans/publier' })}>
                  Se connecter
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-6 p-6 md:grid-cols-[1.08fr_0.92fr] md:p-8">
              <div className="space-y-6">
                <section className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-5">
                  <div className="mb-4 flex items-center gap-2 text-night">
                    <Upload className="h-4 w-4 text-coral" />
                    <h2 className="text-lg font-bold">Votre enseigne</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Nom de l&apos;enseigne</span>
                      <input value={form.business_name} onChange={(e) => handleChange('business_name', e.target.value)} required className="input w-full" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Email de contact</span>
                      <input value={form.contact_email} onChange={(e) => handleChange('contact_email', e.target.value)} type="email" required className="input w-full" />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-semibold">Logo (URL)</span>
                      <input value={form.business_logo_url} onChange={(e) => handleChange('business_logo_url', e.target.value)} placeholder="https://..." className="input w-full" />
                    </label>
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-5">
                  <div className="mb-4 flex items-center gap-2 text-night">
                    <CircleDollarSign className="h-4 w-4 text-coral" />
                    <h2 className="text-lg font-bold">Votre promo</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-semibold">Titre</span>
                      <input value={form.title} onChange={(e) => handleChange('title', e.target.value)} maxLength={150} required className="input w-full" />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-semibold">Description</span>
                      <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} maxLength={500} required rows={5} className="input w-full" />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-semibold">Image (URL)</span>
                      <input value={form.image_url} onChange={(e) => handleChange('image_url', e.target.value)} placeholder="https://..." className="input w-full" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Label promo</span>
                      <input value={form.promo_label} onChange={(e) => handleChange('promo_label', e.target.value)} placeholder="-20% sur tout" className="input w-full" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Catégorie</span>
                      <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className="input w-full">
                        {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Prix barré XPF</span>
                      <input value={form.original_price_xpf} onChange={(e) => handleChange('original_price_xpf', e.target.value)} inputMode="numeric" className="input w-full" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Prix promo XPF</span>
                      <input value={form.promo_price_xpf} onChange={(e) => handleChange('promo_price_xpf', e.target.value)} inputMode="numeric" className="input w-full" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Bouton CTA</span>
                      <input value={form.cta_label} onChange={(e) => handleChange('cta_label', e.target.value)} className="input w-full" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Lien ou téléphone</span>
                      <input value={form.cta_url} onChange={(e) => handleChange('cta_url', e.target.value)} className="input w-full" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Valable du</span>
                      <input value={form.promo_valid_from} onChange={(e) => handleChange('promo_valid_from', e.target.value)} type="date" className="input w-full" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Valable au</span>
                      <input value={form.promo_valid_until} onChange={(e) => handleChange('promo_valid_until', e.target.value)} type="date" className="input w-full" />
                    </label>
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-5">
                  <h2 className="mb-4 text-lg font-bold">Durée de publication</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { days: 7 as const, label: '7 jours', price: 2900, pro: 2320 },
                      { days: 30 as const, label: '30 jours', price: 7900, pro: 6320 },
                    ].map((option) => {
                      const active = durationDays === option.days
                      return (
                        <button
                          key={option.days}
                          type="button"
                          onClick={() => setDurationDays(option.days)}
                          className={`rounded-[1.25rem] border p-4 text-left transition ${
                            active ? 'border-coral bg-white shadow-sm' : 'border-night/10 bg-white/70 hover:border-coral/25'
                          }`}
                        >
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-coral">{option.label}</p>
                          <p className="mt-2 text-2xl font-bold text-night">{Number(option.price).toLocaleString('fr-FR')} XPF</p>
                          <p className="mt-1 text-xs text-night/60">Pro: {Number(option.pro).toLocaleString('fr-FR')} XPF</p>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-5">
                  <h2 className="mb-4 text-lg font-bold">Paiement</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPaymentProvider('stripe')}
                      className={`rounded-[1.25rem] border p-4 text-left transition ${paymentProvider === 'stripe' ? 'border-coral bg-white' : 'border-night/10 bg-white/70'}`}
                    >
                      <p className="font-semibold">Carte bancaire internationale</p>
                      <p className="mt-1 text-sm text-night/60">Stripe PaymentSheet pour les cartes internationales.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentProvider('payplug')}
                      className={`rounded-[1.25rem] border p-4 text-left transition ${paymentProvider === 'payplug' ? 'border-coral bg-white' : 'border-night/10 bg-white/70'}`}
                    >
                      <p className="font-semibold">Carte OPT-NC / réseau local</p>
                      <p className="mt-1 text-sm text-night/60">PayPlug pour les cartes locales et un tunnel plus simple.</p>
                    </button>
                  </div>
                </section>

                <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3">
                  {saving ? 'Ouverture du paiement...' : 'Publier ma promo'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <aside className="space-y-5">
                <div className="rounded-[1.5rem] border border-coral/15 bg-coral/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Aperçu en temps réel</p>
                  <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-night/8 bg-white shadow-sm">
                    <div className="aspect-[16/9] bg-sand">
                      {preview.image_url ? (
                        <img src={preview.image_url} alt={preview.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl opacity-30">🏷️</div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">Catégorie: {preview.category}</p>
                      <h3 className="mt-2 text-xl font-bold text-night">{preview.title}</h3>
                      <p className="mt-2 text-sm text-night/65">{preview.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          {preview.original_price_xpf ? <p className="text-sm text-night/45 line-through">{Number(preview.original_price_xpf).toLocaleString('fr-FR')} XPF</p> : null}
                          {preview.promo_price_xpf ? <p className="text-lg font-bold text-night">{Number(preview.promo_price_xpf).toLocaleString('fr-FR')} XPF</p> : null}
                        </div>
                        <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/65">{preview.business_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-night/8 bg-sand/40 p-5">
                  <h3 className="text-lg font-bold text-night">Résumé</h3>
                  <ul className="mt-3 space-y-2 text-sm text-night/65">
                    <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-coral" /> Durée: {durationDays} jours</li>
                    <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-coral" /> Paiement: {paymentProvider === 'stripe' ? 'Stripe' : 'PayPlug'}</li>
                    <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-coral" /> Prix public: {baseAmount.toLocaleString('fr-FR')} XPF</li>
                    <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-coral" /> Prix Pro: {discountText}</li>
                  </ul>
                </div>

                <div className="rounded-[1.5rem] border border-night/8 bg-white p-5 text-sm text-night/60">
                  <p className="font-semibold text-night">Important</p>
                  <p className="mt-2">
                    La promo devient visible seulement après paiement confirmé. Le paiement réel est traité par le fournisseur choisi.
                  </p>
                  <Link href="/bons-plans" className="mt-4 inline-flex items-center gap-2 font-semibold text-coral">
                    Retour aux bons plans
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </aside>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
