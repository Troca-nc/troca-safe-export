'use client'

import Image from 'next/image'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Loader2, Upload } from 'lucide-react'

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
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            <BadgeCheck className="h-4 w-4" />
            Compte Pro
          </span>
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
    </div>
  )
}
