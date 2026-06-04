'use client'

import Image from 'next/image'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BadgeCheck, Clock3, Eye, Globe, Loader2, MapPin, Package, Phone, Star, Store, Upload } from 'lucide-react'

import { proApi, uploadApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const PRO_CATEGORIES = [
  'Commerçant',
  'Restaurateur',
  'Artisan BTP',
  'Garagiste',
  'Paysagiste',
  'Prestataire IT',
  'Agence immobilière',
  'Activité nautique',
  'Transporteur',
  'Professionnel de santé',
  'Organisateur d’événements',
  'Agriculteur',
] as const

const COMMUNES = [
  'Nouméa',
  'Mont-Dore',
  'Dumbéa',
  'Païta',
  'Boulouparis',
  'La Foa',
  'Bourail',
  'Koné',
  'Koumac',
  'Poindimié',
  'Lifou',
  'Maré',
  'Ouvéa',
  'Autre',
] as const

type FormState = {
  company_name: string
  category: string
  description: string
  commune: string
  phone: string
  website: string
  hours: string
  siret: string
  logo_url: string
  banner_url: string
}

const INITIAL_FORM: FormState = {
  company_name: '',
  category: '',
  description: '',
  commune: '',
  phone: '',
  website: '',
  hours: '',
  siret: '',
  logo_url: '',
  banner_url: '',
}

export default function ProDashboardSettingsPage() {
  const user = useAuthStore((state) => state.user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const [bannerPreview, setBannerPreview] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const previewRef = useRef<HTMLElement | null>(null)
  const previewProfile = useMemo(
    () => ({
      name: form.company_name || user?.first_name || 'Votre entreprise',
      category: form.category || 'Cat?gorie',
      description: form.description || 'Votre description appara?tra ici.',
      commune: form.commune || 'Noum?a',
      website: form.website || '',
      phone: form.phone || '',
      hours: form.hours || 'Horaires ? compl?ter',
      logo: logoPreview || '',
      banner: bannerPreview || '',
    }),
    [bannerPreview, form.category, form.company_name, form.description, form.hours, form.phone, form.commune, form.website, logoPreview, user?.first_name],
  )

  const descriptionCount = useMemo(() => form.description.length, [form.description])

  useEffect(() => {
    let alive = true

    const loadProfile = async () => {
      if (!user?.id) {
        if (alive) setPageLoading(false)
        return
      }

      try {
        const response = await proApi.getById(user.id)
        if (!alive) return
        const profile = response.data?.data || {}
        setForm({
          company_name: profile.pro_company_name || '',
          category: profile.pro_category || '',
          description: profile.pro_description || '',
          commune: profile.pro_commune || '',
          phone: profile.pro_phone || '',
          website: profile.pro_website || '',
          hours: profile.pro_hours || '',
          siret: profile.pro_siret || '',
          logo_url: profile.pro_logo_url || '',
          banner_url: profile.pro_banner_url || '',
        })
        setLogoPreview(profile.pro_logo_url || '')
        setBannerPreview(profile.pro_banner_url || '')
      } catch {
        // Keep defaults if the profile cannot be loaded.
      } finally {
        if (alive) setPageLoading(false)
      }
    }

    void loadProfile()
    return () => {
      alive = false
    }
  }, [user?.id])

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
    setSuccess('')
  }

  const uploadImage = async (kind: 'logo' | 'banner', event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(kind)
    setError('')
    setSuccess('')
    try {
      const response = await uploadApi.uploadChatPhoto(file)
      const url = response.data?.data?.url || ''
      if (kind === 'logo') {
        setForm((current) => ({ ...current, logo_url: url }))
        setLogoPreview(url)
      } else {
        setForm((current) => ({ ...current, banner_url: url }))
        setBannerPreview(url)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de téléverser l’image.')
    } finally {
      setUploading(null)
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await proApi.updateProfile({
        company_name: form.company_name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        commune: form.commune.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        hours: form.hours.trim(),
        siret: form.siret.trim(),
        logo_url: form.logo_url.trim(),
        banner_url: form.banner_url.trim(),
      })
      setSuccess('✅ Paramètres enregistrés avec succès.')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible d’enregistrer vos paramètres pour le moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {pageLoading ? (
        <div className="h-28 animate-pulse rounded-[2rem] bg-sand/70" />
      ) : null}
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Paramètres Pro</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-night">Ma vitrine professionnelle</h1>
              <p className="mt-2 text-sm text-night/60">Mettez à jour votre marque, vos coordonnées et vos visuels.</p>
            </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              <BadgeCheck className="h-4 w-4" />
              Compte Pro
            </span>
              <button
                type="button"
                onClick={() => {
                  setShowPreview(true)
                  setPreviewMode('desktop')
                  window.requestAnimationFrame(() => {
                    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  })
                }}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/15 bg-nc-lagonLight px-4 py-2 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10"
            >
              Pr?visualiser ma vitrine
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Nom de l'entreprise</span>
              <input value={form.company_name} onChange={(e) => handleChange('company_name', e.target.value)} className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Catégorie</span>
              <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
                <option value="">Choisir un secteur</option>
                {PRO_CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="flex items-center justify-between text-sm font-semibold text-night">
              <span>Description</span>
              <span className="text-xs text-night/45">{descriptionCount}/300</span>
            </span>
            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value.slice(0, 300))} rows={4} maxLength={300} className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Commune</span>
              <select value={form.commune} onChange={(e) => handleChange('commune', e.target.value)} className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
                <option value="">Choisir une commune</option>
                {COMMUNES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Téléphone</span>
              <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Site web</span>
              <input value={form.website} onChange={(e) => handleChange('website', e.target.value)} className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">RIDET</span>
              <input value={form.siret} onChange={(e) => handleChange('siret', e.target.value)} className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm" />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-night">Horaires</span>
            <textarea value={form.hours} onChange={(e) => handleChange('hours', e.target.value)} rows={3} className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm" />
          </label>

          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sauvegarder
          </button>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Visuels</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Logo et bannière</h2>
          </div>

          <div className="space-y-3">
            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)]">
              <div className="relative h-36 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.28))]">
                {bannerPreview ? <Image src={bannerPreview} alt="Bannière" fill className="object-cover" /> : null}
              </div>
              <div className="-mt-8 px-4 pb-4">
                <div className="flex items-end gap-3">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm">
                    {logoPreview ? (
                      <Image src={logoPreview} alt="Logo" width={64} height={64} className="h-full w-full object-cover" />
                    ) : (
                      <Upload className="h-6 w-6 text-[#0A7EA4]" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-night">Logo</span>
              <input type="file" accept="image/*" onChange={(e) => uploadImage('logo', e)} className="block w-full text-sm text-night/65 file:mr-4 file:rounded-xl file:border-0 file:bg-nc-lagonLight file:px-4 file:py-2 file:text-sm file:font-semibold file:text-nc-lagon hover:file:bg-[#d7eef3]" />
              {uploading === 'logo' ? <p className="text-xs text-night/55">Téléversement du logo...</p> : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-night">Bannière</span>
              <input type="file" accept="image/*" onChange={(e) => uploadImage('banner', e)} className="block w-full text-sm text-night/65 file:mr-4 file:rounded-xl file:border-0 file:bg-nc-lagonLight file:px-4 file:py-2 file:text-sm file:font-semibold file:text-nc-lagon hover:file:bg-[#d7eef3]" />
              {uploading === 'banner' ? <p className="text-xs text-night/55">Téléversement de la bannière...</p> : null}
            </label>
          </div>
        </div>

      </form>

      {showPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] bg-[var(--color-background)] p-4 shadow-2xl md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Aper?u vitrine</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Voici ce que verront vos visiteurs</h2>
                <p className="mt-2 text-sm text-night/60">Cette pr?visualisation refl?te vos changements avant sauvegarde.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('desktop')}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      previewMode === 'desktop'
                        ? 'bg-white text-[#0A7EA4] shadow-sm'
                        : 'text-night/55 hover:text-night'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      previewMode === 'mobile'
                        ? 'bg-white text-[#0A7EA4] shadow-sm'
                        : 'text-night/55 hover:text-night'
                    }`}
                  >
                    Mobile
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                >
                  Fermer l’aperçu
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
              <div className={`mx-auto transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-[390px] px-2 py-2' : 'w-full px-0 py-0'}`}>
              <div className="relative h-44 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.35))]">
                {previewProfile.banner ? (
                  <Image src={previewProfile.banner} alt={previewProfile.name} fill sizes="100vw" className="object-cover opacity-80" />
                ) : null}
              </div>
              <div className="-mt-10 px-5 pb-6 md:px-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] border-4 border-white bg-white shadow-md">
                      {previewProfile.logo ? (
                        <Image src={previewProfile.logo} alt={previewProfile.name} width={80} height={80} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-[#0A7EA4]">{previewProfile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('').slice(0, 2) || 'P'}</span>
                      )}
                    </div>

                    <div className="pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-3xl font-bold text-night">{previewProfile.name}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Pro v?rifi?
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-night/60">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-coral" />
                          {previewProfile.commune}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Store className="h-4 w-4 text-coral" />
                          {previewProfile.category}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-4 w-4 text-coral" />
                          {previewProfile.hours}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-night/60">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          0.0 (0 avis)
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                          <Package className="h-4 w-4 text-[#0A7EA4]" />
                          0 annonce active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {previewProfile.website ? (
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-night">
                        <Globe className="h-4 w-4" />
                        Site web
                      </span>
                    ) : null}
                    {previewProfile.phone ? (
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-night">
                        <Phone className="h-4 w-4" />
                        Appeler
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="mt-6 max-w-4xl text-sm leading-relaxed text-night/65 md:text-base">{previewProfile.description}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm">
                    Voir mes offres
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]">
                    Contacter
                  </button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
