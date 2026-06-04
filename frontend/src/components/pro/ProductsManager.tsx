'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Archive, BadgeCheck, Layers3, Package, PencilLine, PlusCircle, RefreshCw, Save, Sparkles, Store, X } from 'lucide-react'

import { metaApi, proApi } from '@/lib/api'
import type { CategoryNode } from '@/lib/categoryCatalog'
import { FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'

type CommuneItem = {
  id: string | number
  name: string
}

type ProductImage = {
  id: number
  url: string
  position: number
  alt_text: string | null
}

type ProductItem = {
  id: number
  title: string
  slug: string
  description: string
  price_xpf: number
  compare_at_price_xpf: number | null
  stock_quantity: number
  sku: string | null
  brand: string | null
  category_id: number | null
  category_name: string | null
  commune_id: number | null
  commune_name: string | null
  unit_label: string | null
  cover_image_url: string | null
  is_active: boolean
  is_featured: boolean
  published_listing_count: number
  last_published_listing_id: number | null
  last_published_listing_title: string | null
  last_published_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
  image_count: number
  images: ProductImage[]
  owner_id?: number
}

type ProductFormState = {
  title: string
  description: string
  price_xpf: string
  compare_at_price_xpf: string
  stock_quantity: string
  sku: string
  brand: string
  category_id: string
  commune_id: string
  unit_label: string
  cover_image_url: string
  image_urls_text: string
  is_featured: boolean
}

const INITIAL_FORM: ProductFormState = {
  title: '',
  description: '',
  price_xpf: '',
  compare_at_price_xpf: '',
  stock_quantity: '0',
  sku: '',
  brand: '',
  category_id: '',
  commune_id: '',
  unit_label: '',
  cover_image_url: '',
  image_urls_text: '',
  is_featured: false,
}

function formatPrice(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return 'Prix sur demande'
  return `${Number(value).toLocaleString('fr-FR')} XPF`
}

function formatDate(value?: string | null) {
  if (!value) return 'Date inconnue'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function isLeafCategory(node: CategoryNode | null | undefined) {
  if (!node) return false
  const children = node.children || node.subcategories || []
  return children.length === 0
}

function collectLeafCategories(nodes: CategoryNode[], depth = 0, out: Array<{ id: string; label: string; depth: number }> = []) {
  for (const node of nodes || []) {
    const children = node.children || node.subcategories || []
    if (!children.length) {
      out.push({ id: node.id, label: node.name, depth })
      continue
    }
    collectLeafCategories(children, depth + 1, out)
  }
  return out
}

function parseImageUrls(text: string) {
  return text
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function ProductSteps() {
  const steps = [
    {
      icon: Package,
      title: '1. Créez votre produit',
      text: 'Nom, prix fixe, stock et description pour votre catalogue.',
    },
    {
      icon: ArrowRight,
      title: '2. Publiez en annonce',
      text: 'Transformez un produit en annonce visible dans le flux Troca.',
    },
    {
      icon: Sparkles,
      title: '3. Suivez vos retours',
      text: 'Gardez un œil sur vos publications et revenez modifier le stock.',
    },
  ]

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {steps.map((step) => {
        const Icon = step.icon
        return (
          <article key={step.title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-night">{step.title}</h3>
            <p className="mt-1 text-sm text-night/60">{step.text}</p>
          </article>
        )
      })}
    </div>
  )
}

export default function ProductsManager() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [categories, setCategories] = useState<CategoryNode[]>(FALLBACK_CATEGORIES)
  const [communes, setCommunes] = useState<CommuneItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [saving, setSaving] = useState(false)
  const [archivingId, setArchivingId] = useState<number | null>(null)
  const [publishingId, setPublishingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ title: string; listingId?: number } | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductFormState>(INITIAL_FORM)

  const leafCategories = useMemo(() => collectLeafCategories(categories), [categories])

  const selectedCategory = useMemo(() => {
    const node = categories.length ? categories : FALLBACK_CATEGORIES
    const stack = [...node]
    const targetId = form.category_id
    while (stack.length) {
      const current = stack.shift()
      if (!current) continue
      if (String(current.id) === targetId) return current
      stack.unshift(...(current.children || current.subcategories || []))
    }
    return null
  }, [categories, form.category_id])

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      const response = await proApi.getProducts()
      setProducts(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch {
      setProducts([])
    } finally {
      setLoadingProducts(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    let alive = true
    const loadMeta = async () => {
      try {
        const [communesRes, categoriesRes] = await Promise.all([metaApi.getCommunes(), metaApi.getCategories()])
        if (!alive) return
        setCommunes(Array.isArray(communesRes.data?.data) ? communesRes.data.data : [])
        setCategories(Array.isArray(categoriesRes.data?.data) && categoriesRes.data.data.length ? categoriesRes.data.data : FALLBACK_CATEGORIES)
      } catch {
        if (!alive) return
        setCommunes([])
        setCategories(FALLBACK_CATEGORIES)
      } finally {
        if (alive) setLoadingMeta(false)
      }
    }

    void loadMeta()
    void loadProducts()

    return () => {
      alive = false
    }
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setForm(INITIAL_FORM)
    setError('')
  }

  const startEdit = (product: ProductItem) => {
    setEditingId(product.id)
    setForm({
      title: product.title || '',
      description: product.description || '',
      price_xpf: String(product.price_xpf ?? ''),
      compare_at_price_xpf: product.compare_at_price_xpf == null ? '' : String(product.compare_at_price_xpf),
      stock_quantity: String(product.stock_quantity ?? 0),
      sku: product.sku || '',
      brand: product.brand || '',
      category_id: product.category_id ? String(product.category_id) : '',
      commune_id: product.commune_id ? String(product.commune_id) : '',
      unit_label: product.unit_label || '',
      cover_image_url: product.cover_image_url || '',
      image_urls_text: (product.images || []).map((image) => image.url).join('\n'),
      is_featured: Boolean(product.is_featured),
    })
    setError('')
    setSuccess(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Le nom du produit est requis.')
      return
    }
    if (!form.description.trim()) {
      setError('La description du produit est requise.')
      return
    }
    if (!form.category_id) {
      setError('La catégorie est requise.')
      return
    }
    if (!selectedCategory || !isLeafCategory(selectedCategory)) {
      setError('Choisissez une sous-catégorie finale.')
      return
    }
    if (!form.commune_id) {
      setError('La commune est requise.')
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price_xpf: Number(form.price_xpf || 0),
      compare_at_price_xpf: form.compare_at_price_xpf.trim() ? Number(form.compare_at_price_xpf) : null,
      stock_quantity: Number(form.stock_quantity || 0),
      sku: form.sku.trim() || null,
      brand: form.brand.trim() || null,
      category_id: Number(form.category_id),
      commune_id: Number(form.commune_id),
      unit_label: form.unit_label.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      image_urls: parseImageUrls(form.image_urls_text),
      is_featured: form.is_featured,
    }

    setSaving(true)
    setError('')
    setSuccess(null)

    try {
      if (editingId) {
        await proApi.updateProduct(editingId, payload)
      } else {
        await proApi.createProduct(payload)
      }
      await loadProducts()
      resetForm()
      setSuccess({ title: editingId ? 'Produit mis à jour.' : 'Produit créé.' })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible d’enregistrer ce produit.')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (productId: number) => {
    setArchivingId(productId)
    setError('')
    try {
      await proApi.archiveProduct(productId)
      await loadProducts()
      setSuccess({ title: 'Produit archivé.' })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible d’archiver ce produit.')
    } finally {
      setArchivingId(null)
    }
  }

  const handlePublish = async (productId: number) => {
    setPublishingId(productId)
    setError('')
    try {
      const response = await proApi.publishProduct(productId)
      await loadProducts()
      const listingId = response.data?.data?.listing_id
      const publishedProduct = products.find((item) => item.id === productId)
      setSuccess({
        title: publishedProduct ? `Annonce créée depuis “${publishedProduct.title}”.` : 'Annonce publiée depuis le catalogue.',
        listingId,
      })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de publier ce produit en annonce.')
    } finally {
      setPublishingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-[2rem] bg-sand/70" />
        <div className="h-96 animate-pulse rounded-[2rem] bg-sand/70" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Catalogue produits</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-night">Gérez vos produits fixes séparément des annonces</h1>
            <p className="mt-2 max-w-2xl text-sm text-night/60">
              Créez une fiche produit durable, suivez votre stock et publiez une annonce ponctuelle quand vous voulez la mettre en avant.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-nc-lagonLight px-3 py-1.5 text-sm font-semibold text-nc-lagon">
            <BadgeCheck className="h-4 w-4" />
            {products.length} produit{products.length > 1 ? 's' : ''}
          </div>
        </div>
      </section>

      <ProductSteps />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">
                {editingId ? 'Modifier un produit' : 'Créer un produit'}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">
                {editingId ? 'Mise à jour du catalogue' : 'Nouveau produit'}
              </h2>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-night">Nom du produit *</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Pain complet, T-shirt coton, Savon artisanal..."
                className="input w-full rounded-2xl"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-night">Description *</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={5}
                placeholder="Décrivez votre produit, son usage, ses atouts, ses variantes éventuelles..."
                className="input w-full rounded-2xl py-3"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Prix fixe (XPF) *</span>
              <input
                type="number"
                min="0"
                value={form.price_xpf}
                onChange={(event) => setForm((current) => ({ ...current, price_xpf: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="2500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Prix barré / promo</span>
              <input
                type="number"
                min="0"
                value={form.compare_at_price_xpf}
                onChange={(event) => setForm((current) => ({ ...current, compare_at_price_xpf: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="3200"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Stock *</span>
              <input
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={(event) => setForm((current) => ({ ...current, stock_quantity: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="24"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Unité / format</span>
              <input
                value={form.unit_label}
                onChange={(event) => setForm((current) => ({ ...current, unit_label: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="à l’unité, lot de 6, 1 kg..."
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Catégorie *</span>
              <select
                value={form.category_id}
                onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                disabled={loadingMeta}
                className="input w-full rounded-2xl"
              >
                <option value="">{loadingMeta ? 'Chargement...' : 'Choisir une catégorie'}</option>
                {leafCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Commune *</span>
              <select
                value={form.commune_id}
                onChange={(event) => setForm((current) => ({ ...current, commune_id: event.target.value }))}
                disabled={loadingMeta}
                className="input w-full rounded-2xl"
              >
                <option value="">{loadingMeta ? 'Chargement...' : 'Choisir une commune'}</option>
                {communes.map((commune) => (
                  <option key={commune.id} value={commune.id}>
                    {commune.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">SKU / Référence</span>
              <input
                value={form.sku}
                onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="SKU-001"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Marque</span>
              <input
                value={form.brand}
                onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="Maison locale, Samsung..."
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-night">Photo principale (URL)</span>
              <input
                value={form.cover_image_url}
                onChange={(event) => setForm((current) => ({ ...current, cover_image_url: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="https://..."
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-night">Galerie (URLs, une par ligne)</span>
              <textarea
                value={form.image_urls_text}
                onChange={(event) => setForm((current) => ({ ...current, image_urls_text: event.target.value }))}
                rows={4}
                className="input w-full rounded-2xl py-3"
                placeholder="https://image1...\nhttps://image2..."
              />
            </label>

            <label className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) => setForm((current) => ({ ...current, is_featured: event.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-night/20 text-[#0A7EA4] focus:ring-[#0A7EA4]/20"
              />
              <span>
                <span className="block text-sm font-semibold text-night">Produit mis en avant</span>
                <span className="mt-1 block text-xs text-night/55">Le produit remonte plus facilement dans votre vitrine.</span>
              </span>
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{success.title}</span>
                {success.listingId ? (
                  <Link href={`/annonces/${success.listingId}`} className="font-semibold underline">
                    Voir l’annonce
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? 'Enregistrer les modifications' : 'Créer le produit'}
            </button>
            {!editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
              >
                Réinitialiser
              </button>
            ) : null}
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Structure</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Produits vs annonces</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-night/65">
              <p>• Le produit reste votre fiche permanente avec prix et stock.</p>
              <p>• L’annonce est une publication ponctuelle visible dans le flux.</p>
              <p>• Vous pouvez publier le même produit plusieurs fois sans ressaisir le contenu.</p>
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Statut</p>
                <h2 className="mt-1 font-display text-xl font-bold text-night">Aperçu du catalogue</h2>
              </div>
              <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-nc-lagon">
                {products.filter((product) => product.is_active).length} actifs
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
                <p className="text-night/55">Produits actifs</p>
                <p className="mt-1 text-xl font-bold text-night">{products.filter((product) => product.is_active).length}</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
                <p className="text-night/55">En stock</p>
                <p className="mt-1 text-xl font-bold text-night">{products.reduce((acc, product) => acc + Math.max(0, Number(product.stock_quantity ?? 0)), 0)}</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
                <p className="text-night/55">Annonces publiées</p>
                <p className="mt-1 text-xl font-bold text-night">{products.reduce((acc, product) => acc + Number(product.published_listing_count ?? 0), 0)}</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-background-secondary)] p-4">
                <p className="text-night/55">Mise en avant</p>
                <p className="mt-1 text-xl font-bold text-night">{products.filter((product) => product.is_featured).length}</p>
              </div>
            </div>
          </article>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Mes produits</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Votre catalogue</h2>
          </div>
          <p className="text-sm text-night/55">
            {loadingProducts ? 'Chargement…' : `${products.length} fiche${products.length > 1 ? 's' : ''} produit${products.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {products.length ? (
            products.map((product) => (
              <article key={product.id} className="rounded-[1.75rem] border border-[var(--color-border)] p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-sand">
                      {product.cover_image_url ? (
                        <Image src={product.cover_image_url} alt={product.title} width={96} height={96} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-night/30">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="line-clamp-1 text-base font-semibold text-night">{product.title}</h3>
                        {product.is_featured ? (
                          <span className="rounded-full bg-coral/10 px-2.5 py-1 text-[11px] font-semibold text-coral">Mise en avant</span>
                        ) : null}
                        {product.is_active ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Actif</span>
                        ) : (
                          <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold text-night/60">Archivé</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-night/60">
                        {product.category_name || 'Catégorie'} · {product.commune_name || 'Commune'} · {formatPrice(product.price_xpf)}
                      </p>
                      <p className="mt-1 text-sm text-night/60">
                        Stock: <span className="font-semibold text-night">{product.stock_quantity}</span>
                        {product.unit_label ? ` · ${product.unit_label}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-night/45">
                        Dernière publication: {product.last_published_at ? formatDate(product.last_published_at) : 'Aucune'}
                        {' '}· Publié {product.published_listing_count} fois
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-night/65">{product.description}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                    >
                      <PencilLine className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePublish(product.id)}
                      disabled={publishingId === product.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0A7EA4] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {publishingId === product.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
                      Publier en annonce
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(product.id)}
                      disabled={archivingId === product.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Archive className="h-4 w-4" />
                      Archiver
                    </button>
                  </div>
                </div>
                {product.last_published_listing_id ? (
                  <div className="mt-4 rounded-2xl border border-[#0A7EA4]/15 bg-nc-lagonLight px-4 py-3 text-sm text-night/70">
                    Dernière annonce publiée:
                    {' '}
                    <Link href={`/annonces/${product.last_published_listing_id}`} className="font-semibold text-[#0A7EA4] underline">
                      {product.last_published_listing_title || 'Voir l’annonce'}
                    </Link>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-night/60">
              <p className="font-semibold text-night">Aucun produit pour le moment</p>
              <p className="mt-2">Créez votre première fiche produit pour construire un vrai catalogue séparé de vos annonces.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
