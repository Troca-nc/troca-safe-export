'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, Archive, BadgeCheck, Layers3, Package, PencilLine, PlusCircle, RefreshCw, Save, Sparkles, Store, Trash2, Upload, X } from 'lucide-react'

import { metaApi, proApi, uploadApi } from '@/lib/api'
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
  price_type: 'fixed' | 'from' | 'on_quote' | 'free'
  price_xpf: number
  compare_at_price_xpf: number | null
  stock_quantity: number | null
  is_available: boolean
  sku: string | null
  brand: string | null
  category_id: number | null
  category_name: string | null
  catalog_category_id: number | null
  catalog_category_name: string | null
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
  price_type: 'fixed' | 'from' | 'on_quote' | 'free'
  price_xpf: string
  compare_at_price_xpf: string
  stock_quantity: string
  stock_unlimited: boolean
  sku: string
  brand: string
  category_id: string
  catalog_category_id: string
  commune_id: string
  unit_label: string
  cover_image_url: string
  image_urls_text: string
  is_featured: boolean
}

type CatalogCategoryItem = {
  id: number
  name: string
  slug: string
  position: number
  created_at: string
  updated_at: string
}

type CatalogCategoryFormState = {
  name: string
  position: string
}

const INITIAL_FORM: ProductFormState = {
  title: '',
  description: '',
  price_type: 'fixed',
  price_xpf: '',
  compare_at_price_xpf: '',
  stock_quantity: '0',
  stock_unlimited: false,
  sku: '',
  brand: '',
  category_id: '',
  catalog_category_id: '',
  commune_id: '',
  unit_label: '',
  cover_image_url: '',
  image_urls_text: '',
  is_featured: false,
}

const INITIAL_CATALOG_CATEGORY_FORM: CatalogCategoryFormState = {
  name: '',
  position: '0',
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

function formatProductPrice(product: ProductItem) {
  if (product.price_type === 'free') return 'Gratuit'
  if (product.price_type === 'on_quote') return 'Sur devis'
  if (product.price_type === 'from') return `� partir de ${formatPrice(product.price_xpf)}`
  return `${formatPrice(product.price_xpf)}${product.unit_label ? ` / ${product.unit_label}` : ''}`
}

function formatStockQuantity(stockQuantity: number | null) {
  if (stockQuantity == null) return 'Stock illimit�'
  if (stockQuantity <= 0) return 'Rupture'
  if (stockQuantity <= 5) return `Plus que ${stockQuantity}`
  return `Stock: ${stockQuantity}`
}

function getDraftProductPreview(form: ProductFormState, categories: CatalogCategoryItem[], communes: CommuneItem[]) {
  const categoryName = categories.find((category) => String(category.id) === form.catalog_category_id)?.name || 'Catalogue'
  const communeName = communes.find((commune) => String(commune.id) === form.commune_id)?.name || 'Commune'
  const imageUrls = parseImageUrls(form.image_urls_text)
  const cover = form.cover_image_url.trim() || imageUrls[0] || null
  const priceType = form.price_type
  const stockQuantity = form.stock_unlimited ? null : Number(form.stock_quantity || 0)
  const priceLabel = priceType === 'free'
    ? 'Gratuit'
    : priceType === 'on_quote'
      ? 'Sur devis'
      : priceType === 'from'
        ? `� partir de ${formatPrice(Number(form.price_xpf || 0))}`
        : `${formatPrice(Number(form.price_xpf || 0))}${form.unit_label ? ` / ${form.unit_label}` : ''}`

  return {
    cover,
    categoryName,
    communeName,
    imageCount: imageUrls.length + (cover ? 1 : 0),
    priceLabel,
    stockLabel: formatStockQuantity(stockQuantity),
    stockQuantity,
  }
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
      title: '1. Cr�ez votre produit',
      text: 'Nom, prix fixe, stock et description pour votre catalogue.',
    },
    {
      icon: ArrowRight,
      title: '2. Publiez en annonce',
      text: 'Transformez un produit en annonce visible dans le flux Kalico.',
    },
    {
      icon: Sparkles,
      title: '3. Suivez vos retours',
      text: 'Gardez un Sil sur vos publications et revenez modifier le stock.',
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
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategoryItem[]>([])
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
  const [catalogCategoryForm, setCatalogCategoryForm] = useState<CatalogCategoryFormState>(INITIAL_CATALOG_CATEGORY_FORM)
  const [catalogCategorySaving, setCatalogCategorySaving] = useState(false)
  const [catalogCategoryEditingId, setCatalogCategoryEditingId] = useState<number | null>(null)
  const [catalogCategoryLoading, setCatalogCategoryLoading] = useState(false)
  const [productUploading, setProductUploading] = useState(false)
  const productImagesInputRef = useRef<HTMLInputElement | null>(null)

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

  const draftPreview = useMemo(
    () => getDraftProductPreview(form, catalogCategories, communes),
    [catalogCategories, communes, form],
  )

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

  const loadCatalogCategories = async () => {
    setCatalogCategoryLoading(true)
    try {
      const response = await proApi.getCatalogCategories()
      setCatalogCategories(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch {
      setCatalogCategories([])
    } finally {
      setCatalogCategoryLoading(false)
    }
  }

  useEffect(() => {
    let alive = true
    const loadMeta = async () => {
      try {
        const [communesRes, categoriesRes, catalogCategoriesRes] = await Promise.all([
          metaApi.getCommunes(),
          metaApi.getCategories(),
          proApi.getCatalogCategories(),
        ])
        if (!alive) return
        setCommunes(Array.isArray(communesRes.data?.data) ? communesRes.data.data : [])
        setCategories(Array.isArray(categoriesRes.data?.data) && categoriesRes.data.data.length ? categoriesRes.data.data : FALLBACK_CATEGORIES)
        setCatalogCategories(Array.isArray(catalogCategoriesRes.data?.data) ? catalogCategoriesRes.data.data : [])
      } catch {
        if (!alive) return
        setCommunes([])
        setCategories(FALLBACK_CATEGORIES)
        setCatalogCategories([])
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

  const handleProductImagesUpload = async (files: FileList | File[] | null) => {
    const selectedFiles = Array.from(files || []).filter(Boolean)
    if (!selectedFiles.length) return

    setProductUploading(true)
    setError('')
    try {
      const response = await uploadApi.uploadProductImages(selectedFiles)
      const uploaded = Array.isArray(response.data?.data) ? response.data.data : []
      const urls = uploaded.map((item: { url?: string }) => String(item.url || '').trim()).filter(Boolean)
      if (!urls.length) {
        throw new Error('Aucune image na pu �tre import�e.')
      }

      setForm((current) => {
        const currentUrls = parseImageUrls(current.image_urls_text)
        const mergedUrls = Array.from(new Set([...currentUrls, ...urls]))
        return {
          ...current,
          cover_image_url: current.cover_image_url.trim() || mergedUrls[0] || '',
          image_urls_text: mergedUrls.join('\n'),
        }
      })
      setSuccess({ title: `${urls.length} photo${urls.length > 1 ? 's' : ''} import�e${urls.length > 1 ? 's' : ''}.` })
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Impossible dimporter ces photos.')
    } finally {
      setProductUploading(false)
      if (productImagesInputRef.current) {
        productImagesInputRef.current.value = ''
      }
    }
  }

  const handleRemoveUploadedPhoto = (url: string) => {
    setForm((current) => {
      const currentUrls = parseImageUrls(current.image_urls_text)
      const nextUrls = currentUrls.filter((item) => item !== url)
      const nextCover = current.cover_image_url.trim() === url
        ? nextUrls[0] || ''
        : current.cover_image_url

      return {
        ...current,
        cover_image_url: nextCover,
        image_urls_text: nextUrls.join('\n'),
      }
    })
  }

  const handleClearUploadedPhotos = () => {
    setForm((current) => ({
      ...current,
      cover_image_url: '',
      image_urls_text: '',
    }))
  }

  const startEdit = (product: ProductItem) => {
    setEditingId(product.id)
    setForm({
      title: product.title || '',
      description: product.description || '',
      price_type: product.price_type || 'fixed',
      price_xpf: String(product.price_xpf ?? ''),
      compare_at_price_xpf: product.compare_at_price_xpf == null ? '' : String(product.compare_at_price_xpf),
      stock_quantity: product.stock_quantity == null ? '0' : String(product.stock_quantity ?? 0),
      stock_unlimited: product.stock_quantity == null,
      sku: product.sku || '',
      brand: product.brand || '',
      category_id: product.category_id ? String(product.category_id) : '',
      catalog_category_id: product.catalog_category_id ? String(product.catalog_category_id) : '',
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
      setError('La cat�gorie est requise.')
      return
    }
    if (!selectedCategory || !isLeafCategory(selectedCategory)) {
      setError('Choisissez une sous-cat�gorie finale.')
      return
    }
    if (!form.commune_id) {
      setError('La commune est requise.')
      return
    }
    if (!form.catalog_category_id) {
      setError('La cat�gorie du catalogue est requise.')
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price_type: form.price_type || 'fixed',
      price_xpf: form.price_type === 'on_quote' || form.price_type === 'free' ? 0 : Number(form.price_xpf || 0),
      compare_at_price_xpf: form.compare_at_price_xpf.trim() ? Number(form.compare_at_price_xpf) : null,
      stock_quantity: form.stock_unlimited ? null : Number(form.stock_quantity || 0),
      sku: form.sku.trim() || null,
      brand: form.brand.trim() || null,
      category_id: Number(form.category_id),
      catalog_category_id: Number(form.catalog_category_id),
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
      setSuccess({ title: editingId ? 'Produit mis � jour.' : 'Produit cr��.' })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible denregistrer ce produit.')
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
      setSuccess({ title: 'Produit archiv�.' })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible darchiver ce produit.')
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
        title: publishedProduct ? `Annonce cr��e depuis ${publishedProduct.title}.` : 'Annonce publi�e depuis le catalogue.',
        listingId,
      })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de publier ce produit en annonce.')
    } finally {
      setPublishingId(null)
    }
  }

  const handleRestock = async (product: ProductItem) => {
    const nextValue = window.prompt(`Nouvelle quantit� pour ${product.title}`, String(Math.max(1, product.stock_quantity ?? 1)))
    if (nextValue == null) return
    const quantity = Number(nextValue)
    if (!Number.isFinite(quantity) || quantity < 0) {
      setError('La quantit� saisie est invalide.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await proApi.updateProduct(product.id, { stock_quantity: quantity })
      await loadProducts()
      setSuccess({ title: quantity > 0 ? 'Stock mis � jour.' : 'Produit masqu� car stock nul.' })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de mettre � jour le stock.')
    } finally {
      setSaving(false)
    }
  }

  const resetCatalogCategoryForm = () => {
    setCatalogCategoryEditingId(null)
    setCatalogCategoryForm(INITIAL_CATALOG_CATEGORY_FORM)
  }

  const startCatalogCategoryEdit = (category: CatalogCategoryItem) => {
    setCatalogCategoryEditingId(category.id)
    setCatalogCategoryForm({
      name: category.name,
      position: String(category.position ?? 0),
    })
  }

  const handleCatalogCategorySubmit = async () => {
    if (!catalogCategoryForm.name.trim()) {
      setError('Le nom de la cat�gorie catalogue est requis.')
      return
    }

    setCatalogCategorySaving(true)
    setError('')
    try {
      const payload = {
        name: catalogCategoryForm.name.trim(),
        position: Number(catalogCategoryForm.position || 0),
      }
      if (catalogCategoryEditingId) {
        await proApi.updateCatalogCategory(catalogCategoryEditingId, payload)
      } else {
        await proApi.createCatalogCategory(payload)
      }
      await loadCatalogCategories()
      resetCatalogCategoryForm()
      setSuccess({ title: catalogCategoryEditingId ? 'Catégorie catalogue mise � jour.' : 'Catégorie catalogue cr��e.' })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible denregistrer cette cat�gorie catalogue.')
    } finally {
      setCatalogCategorySaving(false)
    }
  }

  const handleCatalogCategoryDelete = async (categoryId: number) => {
    setCatalogCategorySaving(true)
    setError('')
    try {
      await proApi.deleteCatalogCategory(categoryId)
      await loadCatalogCategories()
      if (catalogCategoryEditingId === categoryId) {
        resetCatalogCategoryForm()
      }
      setSuccess({ title: 'Catégorie catalogue supprim�e.' })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de supprimer cette cat�gorie catalogue.')
    } finally {
      setCatalogCategorySaving(false)
    }
  }

  const handleCatalogCategoryMove = async (categoryId: number, direction: 'up' | 'down') => {
    const ordered = [...catalogCategories].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
    const index = ordered.findIndex((category) => category.id === categoryId)
    if (index < 0) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= ordered.length) return

    const current = ordered[index]
    const target = ordered[targetIndex]
    setCatalogCategorySaving(true)
    setError('')
    try {
      await Promise.all([
        proApi.updateCatalogCategory(current.id, { position: target.position }),
        proApi.updateCatalogCategory(target.id, { position: current.position }),
      ])
      await loadCatalogCategories()
      setSuccess({ title: 'Ordre des cat�gories catalogue mis � jour.' })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de r�ordonner cette cat�gorie catalogue.')
    } finally {
      setCatalogCategorySaving(false)
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
            <h1 className="mt-2 font-display text-3xl font-bold text-night">G�rez vos produits fixes s�par�ment des annonces</h1>
            <p className="mt-2 max-w-2xl text-sm text-night/60">
              Cr�ez une fiche produit durable, suivez votre stock et publiez une annonce ponctuelle quand vous voulez la mettre en avant.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pro/dashboard/import"
              className="inline-flex items-center gap-2 rounded-full border border-[#0A7EA4]/15 bg-white px-4 py-2 text-sm font-semibold text-[#0A7EA4] transition hover:bg-nc-lagonLight"
            >
              <Upload className="h-4 w-4" />
              Import en masse
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-nc-lagonLight px-3 py-1.5 text-sm font-semibold text-nc-lagon">
              <BadgeCheck className="h-4 w-4" />
              {products.length} produit{products.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </section>

      <ProductSteps />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">
                {editingId ? 'Modifier un produit' : 'Cr�er un produit'}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">
                {editingId ? 'Mise � jour du catalogue' : 'Nouveau produit'}
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

          <div className="mt-5 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)]/40 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Catégories du catalogue</p>
                <h3 className="mt-1 font-semibold text-night">Organisez vos produits par famille</h3>
              </div>
              {catalogCategoryEditingId ? (
                <button
                  type="button"
                  onClick={resetCatalogCategoryForm}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-surface)]"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_0.6fr_auto]">
              <input
                value={catalogCategoryForm.name}
                onChange={(event) => setCatalogCategoryForm((current) => ({ ...current, name: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="Boissons, Entretien, Accessoires..."
              />
              <input
                type="number"
                min="0"
                value={catalogCategoryForm.position}
                onChange={(event) => setCatalogCategoryForm((current) => ({ ...current, position: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="0"
              />
              <button
                type="button"
                onClick={handleCatalogCategorySubmit}
                disabled={catalogCategorySaving}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {catalogCategorySaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                {catalogCategoryEditingId ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {catalogCategories.length ? (
                catalogCategories.map((category) => (
                  <div key={category.id} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                    <button
                      type="button"
                      onClick={() => startCatalogCategoryEdit(category)}
                      className="text-sm font-semibold text-night transition hover:text-[#0A7EA4]"
                    >
                      {category.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCatalogCategoryDelete(category.id)}
                      disabled={catalogCategorySaving}
                      className="rounded-full p-1 text-night/45 transition hover:bg-sand hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Supprimer ${category.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCatalogCategoryMove(category.id, 'up')}
                      disabled={catalogCategorySaving || category === catalogCategories[0]}
                      className="rounded-full p-1 text-night/45 transition hover:bg-sand hover:text-night disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`Monter ${category.name}`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCatalogCategoryMove(category.id, 'down')}
                      disabled={catalogCategorySaving || category === catalogCategories[catalogCategories.length - 1]}
                      className="rounded-full p-1 text-night/45 transition hover:bg-sand hover:text-night disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`Descendre ${category.name}`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-night/55">Aucune cat�gorie catalogue pour le moment.</p>
              )}
            </div>
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
                placeholder="D�crivez votre produit, son usage, ses atouts, ses variantes �ventuelles..."
                className="input w-full rounded-2xl py-3"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Type de prix *</span>
              <select
                value={form.price_type}
                onChange={(event) => setForm((current) => ({ ...current, price_type: event.target.value as ProductFormState['price_type'] }))}
                className="input w-full rounded-2xl"
              >
                <option value="fixed">Prix fixe</option>
                <option value="from">� partir de</option>
                <option value="on_quote">Sur devis</option>
                <option value="free">Gratuit</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Prix (XPF) *</span>
              <input
                type="number"
                min="0"
                value={form.price_xpf}
                onChange={(event) => setForm((current) => ({ ...current, price_xpf: event.target.value }))}
                disabled={form.price_type === 'on_quote' || form.price_type === 'free'}
                className="input w-full rounded-2xl disabled:cursor-not-allowed disabled:bg-[var(--color-background-secondary)]"
                placeholder="2500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Prix barr� / promo</span>
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
                disabled={form.stock_unlimited}
                className="input w-full rounded-2xl disabled:cursor-not-allowed disabled:bg-[var(--color-background-secondary)]"
                placeholder="24"
              />
              <label className="flex items-center gap-2 text-xs font-medium text-night/60">
                <input
                  type="checkbox"
                  checked={form.stock_unlimited}
                  onChange={(event) => setForm((current) => ({ ...current, stock_unlimited: event.target.checked }))}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[#0A7EA4] focus:ring-[#0A7EA4]"
                />
                Stock illimit�
              </label>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Unit� / format</span>
              <input
                value={form.unit_label}
                onChange={(event) => setForm((current) => ({ ...current, unit_label: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="� lunit�, lot de 6, 1 kg..."
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
                <option value="">{loadingMeta ? 'Chargement...' : 'Choisir une cat�gorie'}</option>
                {leafCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-night">Catégorie catalogue *</span>
              <select
                value={form.catalog_category_id}
                onChange={(event) => setForm((current) => ({ ...current, catalog_category_id: event.target.value }))}
                disabled={loadingMeta || catalogCategoryLoading}
                className="input w-full rounded-2xl"
              >
                <option value="">{loadingMeta || catalogCategoryLoading ? 'Chargement...' : 'Choisir une cat�gorie catalogue'}</option>
                {catalogCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
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
              <span className="text-sm font-semibold text-night">SKU / R�f�rence</span>
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
              <span className="text-sm font-semibold text-night">Photo principale</span>
              <input
                value={form.cover_image_url}
                onChange={(event) => setForm((current) => ({ ...current, cover_image_url: event.target.value }))}
                className="input w-full rounded-2xl"
                placeholder="La premi�re photo import�e sera utilis�e par d�faut"
              />
            </label>

            <div className="md:col-span-2 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-sm font-semibold text-night">Importer des photos</span>
                  <p className="mt-1 text-xs text-night/55">Choisissez vos fichiers image, nous g�n�rons automatiquement les URLs du catalogue. Limport est d�sormais la voie principale.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-night/60">
                  {parseImageUrls(form.image_urls_text).length} photo{parseImageUrls(form.image_urls_text).length > 1 ? 's' : ''}
                </span>
              </div>
              <input
                ref={productImagesInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => void handleProductImagesUpload(event.currentTarget.files)}
                className="mt-3 block w-full text-sm text-night/70 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#0A7EA4] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#065f7a]"
              />
              {productUploading ? (
                <p className="mt-2 text-xs text-night/55">Import des photos en cours...</p>
              ) : null}
              {parseImageUrls(form.image_urls_text).length ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-night">Photos import�es</p>
                    <button
                      type="button"
                      onClick={handleClearUploadedPhotos}
                      className="text-xs font-semibold text-night/55 transition hover:text-rose-600"
                    >
                      Tout retirer
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {parseImageUrls(form.image_urls_text).map((url) => (
                      <div key={url} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                        <div className="relative aspect-[4/3] bg-sand">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Photo produit import�e" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                          <p className="truncate text-xs text-night/60">{url}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedPhoto(url)}
                            className="rounded-full p-1 text-night/45 transition hover:bg-sand hover:text-rose-600"
                            aria-label="Supprimer cette photo"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2 rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-background-secondary)]/40 p-4">
              <p className="text-sm font-semibold text-night">URLs manuelles avanc�es</p>
              <p className="mt-1 text-xs text-night/55">
                Si vous avez d�j� des images h�berg�es, vous pouvez encore les coller ci-dessous. Sinon, l&apos;import de fichiers suffit.
              </p>
              <textarea
                value={form.image_urls_text}
                onChange={(event) => setForm((current) => ({ ...current, image_urls_text: event.target.value }))}
                rows={4}
                className="input mt-3 w-full rounded-2xl py-3"
                placeholder="https://image1...\nhttps://image2..."
              />
            </div>

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

            <div className="md:col-span-2 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Aper�u en direct</p>
                  <h3 className="mt-1 font-semibold text-night">Ce que verra le client</h3>
                </div>
                <span className="rounded-full bg-nc-lagonLight px-3 py-1 text-xs font-semibold text-nc-lagon">
                  {draftPreview.imageCount} photo{draftPreview.imageCount > 1 ? 's' : ''}
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="relative overflow-hidden rounded-[1.5rem] bg-sand">
                  {draftPreview.cover ? (
                    <Image
                      src={draftPreview.cover}
                      alt={form.title || 'Aper�u du produit'}
                      width={640}
                      height={480}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center bg-gradient-to-br from-nc-lagonLight to-nc-emeraudeLight text-4xl font-bold text-[#0A7EA4]">
                      {form.title.trim().charAt(0).toUpperCase() || 'P'}
                    </div>
                  )}
                  {form.is_featured ? (
                    <span className="absolute left-3 top-3 rounded-full bg-[#0A7EA4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      � la une
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral/80">
                      {draftPreview.categoryName} � {draftPreview.communeName}
                    </p>
                    <h4 className="mt-1 text-2xl font-bold text-night">
                      {form.title || 'Nom du produit'}
                    </h4>
                    <p className="mt-1 text-sm text-night/60">
                      {form.brand || 'Marque'} � {form.unit_label || 'Format'}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-bold text-night">{draftPreview.priceLabel}</p>
                      {form.compare_at_price_xpf.trim() ? (
                        <p className="text-sm text-night/45 line-through">{formatPrice(Number(form.compare_at_price_xpf))}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/60">
                      {draftPreview.stockLabel}
                    </span>
                  </div>

                  <p className="line-clamp-4 text-sm leading-relaxed text-night/65">
                    {form.description || 'Ajoutez une description pour mieux pr�senter votre produit.'}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs font-medium text-night/55">
                    {form.catalog_category_id ? (
                      <span className="rounded-full bg-[var(--color-background-secondary)] px-2.5 py-1">{draftPreview.categoryName}</span>
                    ) : null}
                    {form.sku ? (
                      <span className="rounded-full bg-[var(--color-background-secondary)] px-2.5 py-1">{form.sku}</span>
                    ) : null}
                    <span className="rounded-full bg-[var(--color-background-secondary)] px-2.5 py-1">
                      {draftPreview.imageCount} photo{draftPreview.imageCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
                    Voir lannonce
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
              {editingId ? 'Enregistrer les modifications' : 'Cr�er le produit'}
            </button>
            {!editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
              >
                R�initialiser
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
              <p>" Le produit reste votre fiche permanente avec prix et stock.</p>
              <p>" Lannonce est une publication ponctuelle visible dans le flux.</p>
              <p>" Vous pouvez publier le m�me produit plusieurs fois sans ressaisir le contenu.</p>
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">Statut</p>
                <h2 className="mt-1 font-display text-xl font-bold text-night">Aper�u du catalogue</h2>
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
                <p className="text-night/55">Annonces publi�es</p>
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
            {loadingProducts ? 'Chargement&' : `${products.length} fiche${products.length > 1 ? 's' : ''} produit${products.length > 1 ? 's' : ''}`}
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
                          <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold text-night/60">Archiv�</span>
                        )}
                        {!product.is_available ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Masqu� stock nul</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-night/60">
                        {product.category_name || 'Catégorie'} � {product.catalog_category_name || 'Catalogue'} � {product.commune_name || 'Commune'} � {formatProductPrice(product)}
                      </p>
                      <p className="mt-1 text-sm text-night/60">
                        {formatStockQuantity(product.stock_quantity)}
                        {product.unit_label ? ` � ${product.unit_label}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-night/45">
                        Derni�re publication: {product.last_published_at ? formatDate(product.last_published_at) : 'Aucune'}
                        {' '}� Publi� {product.published_listing_count} fois
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
                      onClick={() => void handleRestock(product)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-night transition hover:bg-[var(--color-background-secondary)]"
                    >
                      <Sparkles className="h-4 w-4" />
                      R�approvisionner
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
                    Derni�re annonce publi�e:
                    {' '}
                    <Link href={`/annonces/${product.last_published_listing_id}`} className="font-semibold text-[#0A7EA4] underline">
                      {product.last_published_listing_title || 'Voir lannonce'}
                    </Link>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-night/60">
              <p className="font-semibold text-night">Aucun produit pour le moment</p>
              <p className="mt-2">Cr�ez votre premi�re fiche produit pour construire un vrai catalogue s�par� de vos annonces.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
