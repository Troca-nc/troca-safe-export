'use client'

import Image from 'next/image'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BadgeCheck, Clock3, Eye, Globe, Loader2, MapPin, Package, Phone, PlayCircle, Store, Upload } from 'lucide-react'

import { proApi, uploadApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import DocumentUploader from '@/components/pro/DocumentUploader'
import PdfViewer from '@/components/ui/PdfViewer'
import { compressImage } from '@/lib/imageCompressor'
import {
  DEFAULT_QUOTE_TEMPLATE,
  formatBudgetPresetInput,
  getQuoteTemplatePreset,
  normalizeQuoteTemplate,
  parseBudgetPresetInput,
  type QuoteTemplatePresetKey,
  type QuoteTemplate,
} from '@/components/pro/quoteTemplate'

const PRO_CATEGORIES = [
  'Commer�ant',
  'Restaurateur',
  'Artisan BTP',
  'Garagiste',
  'Paysagiste',
  'Prestataire IT',
  'Agence immobili�re',
  'Activit� nautique',
  'Transporteur',
  'Professionnel de sant�',
  'Organisateur d�v�nements',
  'Agriculteur',
] as const

const COMMUNES = [
  'Noum�a',
  'Mont-Dore',
  'Dumb�a',
  'Pa�ta',
  'Boulouparis',
  'La Foa',
  'Bourail',
  'Kon�',
  'Koumac',
  'Poindimi�',
  'Lifou',
  'Mar�',
  'Ouv�a',
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
  catalog_pdf_url: string
  portfolio_photos: string[]
}

type ProProfileResponse = FormState & {
  pro_company_name?: string | null
  pro_category?: string | null
  pro_description?: string | null
  pro_commune?: string | null
  pro_phone?: string | null
  pro_website?: string | null
  pro_hours?: string | null
  pro_siret?: string | null
  pro_logo_url?: string | null
  pro_banner_url?: string | null
  pro_catalog_pdf_url?: string | null
  pro_portfolio_photos?: string[] | null
  pro_quote_template?: QuoteTemplate | null
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
  catalog_pdf_url: '',
  portfolio_photos: [],
}

export default function ProDashboardSettingsPage() {
  const user = useAuthStore((state) => state.user)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [quoteTemplate, setQuoteTemplate] = useState<QuoteTemplate>(DEFAULT_QUOTE_TEMPLATE)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [uploading, setUploading] = useState<'logo' | 'banner' | 'portfolio' | 'catalog' | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const [bannerPreview, setBannerPreview] = useState('')
  const [catalogPdfUrl, setCatalogPdfUrl] = useState('')
  const [catalogPdfName, setCatalogPdfName] = useState('')
  const [catalogPreviewOpen, setCatalogPreviewOpen] = useState(false)
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const previewRef = useRef<HTMLElement | null>(null)
  const previewProfile = useMemo(
    () => ({
      name: form.company_name || user?.first_name || 'Votre entreprise',
      category: form.category || 'Cat�gorie',
      description: form.description || 'Votre description appara?tra ici.',
      commune: form.commune || 'Noum�a',
      website: form.website || '',
      phone: form.phone || '',
      hours: form.hours || 'Horaires ? compl?ter',
      logo: logoPreview || '',
      banner: bannerPreview || '',
      catalogPdfUrl,
      portfolio: portfolioPhotos,
    }),
    [bannerPreview, catalogPdfUrl, form.category, form.company_name, form.description, form.hours, form.phone, form.commune, form.website, logoPreview, portfolioPhotos, user?.first_name],
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
        const profile = (response.data?.data as ProProfileResponse | undefined) ?? null
        if (!profile) {
          return
        }
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
          catalog_pdf_url: profile.pro_catalog_pdf_url || '',
          portfolio_photos: Array.isArray(profile.pro_portfolio_photos) ? profile.pro_portfolio_photos.filter(Boolean) : [],
        })
        setQuoteTemplate(normalizeQuoteTemplate(profile.pro_quote_template))
        setLogoPreview(profile.pro_logo_url || '')
        setBannerPreview(profile.pro_banner_url || '')
        setCatalogPdfUrl(profile.pro_catalog_pdf_url || '')
        setPortfolioPhotos(Array.isArray(profile.pro_portfolio_photos) ? profile.pro_portfolio_photos.filter(Boolean) : [])
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

  const handleTemplateChange = <K extends keyof QuoteTemplate>(key: K, value: QuoteTemplate[K]) => {
    setQuoteTemplate((current) => ({ ...current, [key]: value }))
    setError('')
    setSuccess('')
  }

  const handleBudgetPresetInput = (value: string) => {
    setQuoteTemplate((current) => ({ ...current, budget_presets: parseBudgetPresetInput(value) }))
  }

  const applyPreset = (preset: QuoteTemplatePresetKey) => {
    setQuoteTemplate(getQuoteTemplatePreset(preset))
    setError('')
    setSuccess('')
  }

  const resetTemplate = () => {
    setQuoteTemplate(DEFAULT_QUOTE_TEMPLATE)
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
      const optimizedFile = file.type.startsWith('image/') ? await compressImage(file) : file
      const response = await uploadApi.uploadChatPhoto(optimizedFile)
      const url = response.data?.data?.url || ''
      if (kind === 'logo') {
        setForm((current) => ({ ...current, logo_url: url }))
        setLogoPreview(url)
      } else {
        setForm((current) => ({ ...current, banner_url: url }))
        setBannerPreview(url)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de t�l�verser limage.')
    } finally {
      setUploading(null)
      event.target.value = ''
    }
  }

  const uploadPortfolioPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setUploading('portfolio')
    setError('')
    setSuccess('')
    try {
      const uploadedUrls: string[] = []
      for (const file of files) {
        const optimizedFile = file.type.startsWith('image/') ? await compressImage(file) : file
        const response = await uploadApi.uploadChatPhoto(optimizedFile)
        const url = response.data?.data?.url || ''
        if (url) uploadedUrls.push(url)
      }

      if (uploadedUrls.length) {
        setPortfolioPhotos((current) => Array.from(new Set([...current, ...uploadedUrls])))
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de t�l�verser ces photos de portfolio.')
    } finally {
      setUploading(null)
      event.target.value = ''
    }
  }

  const uploadCatalogPdf = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Le catalogue doit �tre un PDF.')
      event.target.value = ''
      return
    }

    setUploading('catalog')
    setError('')
    setSuccess('')
    try {
      const response = await uploadApi.uploadChatDocument(file)
      const url = response.data?.data?.url || ''
      setForm((current) => ({ ...current, catalog_pdf_url: url }))
      setCatalogPdfUrl(url)
      setCatalogPdfName(file.name)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de t�l�verser le PDF.')
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
        catalog_pdf_url: form.catalog_pdf_url.trim(),
        portfolio_photos: portfolioPhotos,
        quote_template: quoteTemplate,
      })
      setSuccess(' Param�tres enregistr�s avec succ�s.')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible denregistrer vos param�tres pour le moment.')
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
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Param�tres Pro</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-night">Ma vitrine professionnelle</h1>
              <p className="mt-2 text-sm text-night/60">Mettez � jour votre marque, vos coordonn�es et vos visuels.</p>
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
              Pr�visualiser ma vitrine
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
              <span className="text-sm font-semibold text-night">Cat�gorie</span>
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
              <span className="text-sm font-semibold text-night">T�l�phone</span>
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

          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Catalogue PDF</p>
                <h3 className="mt-1 font-display text-xl font-bold text-night">Votre catalogue professionnel</h3>
                <p className="mt-1 text-sm text-night/60">Ajoutez un PDF feuilletable depuis votre vitrine publique.</p>
              </div>
              {catalogPdfUrl ? (
                <button
                  type="button"
                  onClick={() => setCatalogPreviewOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#0A7EA4]/15 bg-white px-3 py-2 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10"
                >
                  <PlayCircle className="h-4 w-4" />
                  Pr�visualiser
                </button>
              ) : null}
            </div>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-semibold text-night">PDF du catalogue</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => void uploadCatalogPdf(event)}
                className="block w-full rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#0A7EA4] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#065f7a]"
              />
            </label>
            {catalogPdfUrl ? (
              <div className="mt-4 rounded-2xl border border-white/60 bg-white px-4 py-3 text-sm text-night/70">
                <p className="font-semibold text-night">{catalogPdfName || 'Catalogue PDF t�l�vers�'}</p>
                <p className="mt-1 text-xs text-night/45 break-all">{catalogPdfUrl}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Demande de devis</p>
                <h3 className="mt-1 font-display text-xl font-bold text-night">Template modifiable</h3>
                <p className="mt-1 text-sm text-night/60">
                  Choisissez les champs visibles et les montants rapides pour mieux cadrer les demandes.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Personnalisable
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Titre de la modale</span>
                <input
                  value={quoteTemplate.title}
                  onChange={(e) => handleTemplateChange('title', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Sous-titre</span>
                <input
                  value={quoteTemplate.subtitle}
                  onChange={(e) => handleTemplateChange('subtitle', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-night">Mod�les rapides</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="rounded-full border border-dashed border-[#0A7EA4]/35 bg-nc-lagonLight px-4 py-2 text-sm font-semibold text-[#0A7EA4] transition hover:border-[#0A7EA4] hover:bg-[#d7eef3]"
                >
                  Sur mesure
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('artisan')}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-night transition hover:border-[#0A7EA4]/30 hover:bg-nc-lagonLight hover:text-[#0A7EA4]"
                >
                  Artisan
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('commercant')}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-night transition hover:border-[#0A7EA4]/30 hover:bg-nc-lagonLight hover:text-[#0A7EA4]"
                >
                  Commer�ant
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('service')}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-night transition hover:border-[#0A7EA4]/30 hover:bg-nc-lagonLight hover:text-[#0A7EA4]"
                >
                  Service / prestation
                </button>
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-night transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  R�initialiser la template
                </button>
              </div>
              <p className="mt-2 text-xs text-night/45">
                Ces mod�les pr�-remplissent la template et restent modifiables champ par champ.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Libell� du besoin</span>
                <input
                  value={quoteTemplate.need_type_label}
                  onChange={(e) => handleTemplateChange('need_type_label', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Placeholder du besoin</span>
                <input
                  value={quoteTemplate.need_type_placeholder}
                  onChange={(e) => handleTemplateChange('need_type_placeholder', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Libell� de commune</span>
                <input
                  value={quoteTemplate.commune_label}
                  onChange={(e) => handleTemplateChange('commune_label', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Placeholder commune</span>
                <input
                  value={quoteTemplate.commune_placeholder}
                  onChange={(e) => handleTemplateChange('commune_placeholder', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-night">
                <input
                  type="checkbox"
                  checked={quoteTemplate.show_phone}
                  onChange={(e) => handleTemplateChange('show_phone', e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[#0A7EA4]"
                />
                T�l�phone visible
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-night">
                <input
                  type="checkbox"
                  checked={quoteTemplate.show_budget}
                  onChange={(e) => handleTemplateChange('show_budget', e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[#0A7EA4]"
                />
                Budget visible
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-night">
                <input
                  type="checkbox"
                  checked={quoteTemplate.show_date}
                  onChange={(e) => handleTemplateChange('show_date', e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[#0A7EA4]"
                />
                Date visible
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Libell� budget</span>
                <input
                  value={quoteTemplate.budget_label}
                  onChange={(e) => handleTemplateChange('budget_label', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Montants rapides (s�par�s par des virgules)</span>
                <input
                  value={formatBudgetPresetInput(quoteTemplate.budget_presets)}
                  onChange={(e) => handleBudgetPresetInput(e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                  placeholder="15000, 30000, 50000"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Libell� d�tails</span>
                <input
                  value={quoteTemplate.details_label}
                  onChange={(e) => handleTemplateChange('details_label', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Libell� t�l�phone</span>
                <input
                  value={quoteTemplate.requester_phone_label}
                  onChange={(e) => handleTemplateChange('requester_phone_label', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Placeholder t�l�phone</span>
                <input
                  value={quoteTemplate.requester_phone_placeholder}
                  onChange={(e) => handleTemplateChange('requester_phone_placeholder', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Placeholder d�tails</span>
                <input
                  value={quoteTemplate.details_placeholder}
                  onChange={(e) => handleTemplateChange('details_placeholder', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Label date</span>
                <input
                  value={quoteTemplate.desired_date_label}
                  onChange={(e) => handleTemplateChange('desired_date_label', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Placeholder budget</span>
                <input
                  value={quoteTemplate.budget_placeholder}
                  onChange={(e) => handleTemplateChange('budget_placeholder', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Placeholder date</span>
                <input
                  value={quoteTemplate.desired_date_placeholder}
                  onChange={(e) => handleTemplateChange('desired_date_placeholder', e.target.value)}
                  className="input w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
                />
              </label>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#0A7EA4]/15 bg-[linear-gradient(180deg,_rgba(214,240,246,0.55),_rgba(255,255,255,0.95))] p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Aper�u en direct</p>
                <h4 className="mt-1 font-display text-xl font-bold text-night">{quoteTemplate.title}</h4>
                <p className="mt-1 text-sm text-night/60">{quoteTemplate.subtitle}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0A7EA4] shadow-sm">
                <Eye className="h-3.5 w-3.5" />
                Mise � jour instantan�e
              </span>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.25rem] border border-white/80 bg-white/90 p-4 shadow-sm">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Ce que verra le visiteur</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-night/60">
                      {quoteTemplate.show_phone ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                          <Phone className="h-3.5 w-3.5 text-[#0A7EA4]" />
                          T�l�phone
                        </span>
                      ) : null}
                      {quoteTemplate.show_budget ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                          <Package className="h-3.5 w-3.5 text-[#0A7EA4]" />
                          Budget
                        </span>
                      ) : null}
                      {quoteTemplate.show_date ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                          <Clock3 className="h-3.5 w-3.5 text-[#0A7EA4]" />
                          Date souhait�e
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{quoteTemplate.need_type_label}</p>
                      <p className="mt-1 text-sm text-night/65">{quoteTemplate.need_type_placeholder}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{quoteTemplate.commune_label}</p>
                      <p className="mt-1 text-sm text-night/65">{quoteTemplate.commune_placeholder}</p>
                    </div>
                    {quoteTemplate.show_phone ? (
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{quoteTemplate.requester_phone_label}</p>
                        <p className="mt-1 text-sm text-night/65">{quoteTemplate.requester_phone_placeholder}</p>
                      </div>
                    ) : null}
                    {quoteTemplate.show_date ? (
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{quoteTemplate.desired_date_label}</p>
                        <p className="mt-1 text-sm text-night/65">Date � s�lectionner par le client</p>
                      </div>
                    ) : null}
                  </div>

                  {quoteTemplate.show_details ? (
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">{quoteTemplate.details_label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-night/65">{quoteTemplate.details_placeholder}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 rounded-[1.25rem] border border-white/80 bg-white/90 p-4 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Montants rapides</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quoteTemplate.budget_presets.map((preset) => (
                      <span
                        key={preset}
                        className="inline-flex items-center rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-[#0A7EA4]"
                      >
                        {preset.toLocaleString('fr-FR')} XPF
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">R�sum�</p>
                  <div className="mt-2 space-y-2 text-sm text-night/65">
                    <p>" Champ t�l�phone : {quoteTemplate.show_phone ? 'visible' : 'masqu�'}</p>
                    <p>" Champ budget : {quoteTemplate.show_budget ? 'visible' : 'masqu�'}</p>
                    <p>" Champ date : {quoteTemplate.show_date ? 'visible' : 'masqu�'}</p>
                    <p>" Champ d�tails : {quoteTemplate.show_details ? 'visible' : 'masqu�'}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-sm text-night/70">
                  <p className="font-semibold text-emerald-800">Astuce</p>
                  <p className="mt-1">
                    Ce bloc montre le rendu final que verra le visiteur avant m�me la sauvegarde.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sauvegarder
          </button>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Visuels</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Logo et banni�re</h2>
          </div>

          <div className="space-y-3">
            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)]">
              <div className="relative h-36 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.28))]">
                {bannerPreview ? <Image src={bannerPreview} alt="Banni�re" fill className="object-cover" /> : null}
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
              {uploading === 'logo' ? <p className="text-xs text-night/55">T�l�versement du logo...</p> : null}
            </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-night">Banni�re</span>
            <input type="file" accept="image/*" onChange={(e) => uploadImage('banner', e)} className="block w-full text-sm text-night/65 file:mr-4 file:rounded-xl file:border-0 file:bg-nc-lagonLight file:px-4 file:py-2 file:text-sm file:font-semibold file:text-nc-lagon hover:file:bg-[#d7eef3]" />
            {uploading === 'banner' ? <p className="text-xs text-night/55">T�l�versement de la banni�re...</p> : null}
          </label>

          <div className="space-y-3 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Portfolio</p>
                <h3 className="mt-1 font-display text-xl font-bold text-night">Photos de r�alisations</h3>
                <p className="mt-1 text-sm text-night/60">Ajoutez quelques images pour renforcer votre vitrine Pro.</p>
              </div>
              {portfolioPhotos.length ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-night/60 shadow-sm">
                  {portfolioPhotos.length} photo{portfolioPhotos.length > 1 ? 's' : ''}
                </span>
              ) : null}
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-night">Ajouter des photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={uploadPortfolioPhotos}
                className="block w-full text-sm text-night/65 file:mr-4 file:rounded-xl file:border-0 file:bg-nc-lagonLight file:px-4 file:py-2 file:text-sm file:font-semibold file:text-nc-lagon hover:file:bg-[#d7eef3]"
              />
              {uploading === 'portfolio' ? <p className="text-xs text-night/55">T�l�versement des photos de portfolio...</p> : null}
            </label>

            {portfolioPhotos.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {portfolioPhotos.map((photo, index) => (
                  <div key={`${photo}-${index}`} className="group overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm">
                    <div className="relative aspect-[4/3] bg-sand">
                      <Image src={photo} alt={`Portfolio ${index + 1}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <p className="text-xs text-night/55">Photo {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => setPortfolioPhotos((current) => current.filter((item) => item !== photo))}
                        className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-sm text-night/55">
                Aucun visuel de portfolio pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>

      </form>

      {catalogPreviewOpen && catalogPdfUrl ? (
        <div className="fixed inset-0 z-50 bg-night/70 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
            <div className="h-[92vh] w-full overflow-hidden rounded-[2rem] bg-white">
              <PdfViewer url={catalogPdfUrl} onClose={() => setCatalogPreviewOpen(false)} title="Aper�u du catalogue" />
            </div>
          </div>
        </div>
      ) : null}

      <DocumentUploader />

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
                        ? 'bg-white text-[#0A7EA4] shadow-sm ring-1 ring-black/5'
                        : 'text-night/75 hover:bg-white hover:text-night'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      previewMode === 'mobile'
                        ? 'bg-white text-[#0A7EA4] shadow-sm ring-1 ring-black/5'
                        : 'text-night/75 hover:bg-white hover:text-night'
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
                  Fermer laper�u
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
                          <BadgeCheck className="h-4 w-4 text-amber-500" />
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
