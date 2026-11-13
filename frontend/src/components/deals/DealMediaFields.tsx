'use client'

import { useRef } from 'react'
import { FileText, ImagePlus, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'

export function DealMediaFields({
  imageUrl,
  catalogPdfUrl,
  uploadingImage,
  imageUploadProgress,
  uploadingCatalog,
  disabled = false,
  onImageSelected,
  onCatalogSelected,
  onRemoveImage,
  onRemoveCatalog,
}: {
  imageUrl: string
  catalogPdfUrl: string
  uploadingImage: boolean
  imageUploadProgress: number
  uploadingCatalog: boolean
  disabled?: boolean
  onImageSelected: (file: File) => void
  onCatalogSelected: (file: File) => void
  onRemoveImage: () => void
  onRemoveCatalog: () => void
}) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const catalogInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <section className="rounded-control border border-warm-border bg-cream-sunken p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-label-sm font-semibold">Photo du bon plan · facultative</h3>
            <p className="mt-1 text-meta text-ink/60">JPG, PNG, WebP ou HEIC, 10 Mo maximum.</p>
          </div>
          {imageUrl ? <Button type="button" variant="secondary" compact loading={uploadingImage} loadingLabel={`Import ${imageUploadProgress || 0} %`} disabled={disabled} onClick={() => imageInputRef.current?.click()}>Remplacer</Button> : null}
        </div>
        <input
          ref={imageInputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          disabled={disabled || uploadingImage}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onImageSelected(file)
            event.target.value = ''
          }}
        />
        {imageUrl ? (
          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-control border border-warm-border bg-cream-surface">
            <img src={imageUrl} alt="Aperçu de la photo du bon plan" className="h-full w-full object-cover" />
            <button type="button" aria-label="Retirer la photo" disabled={disabled || uploadingImage} className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-control bg-ink/85 text-cream hover:bg-ink disabled:cursor-not-allowed" onClick={onRemoveImage}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" disabled={disabled || uploadingImage} className="mt-4 flex min-h-40 w-full flex-col items-center justify-center rounded-control border border-dashed border-warm-border bg-cream-surface px-4 text-center text-ink/60 hover:border-accent disabled:cursor-not-allowed" onClick={() => imageInputRef.current?.click()}>
            <ImagePlus className="h-9 w-9" aria-hidden="true" />
            <span className="mt-2 text-body-sm font-semibold">Choisir une photo sur ton appareil</span>
            {uploadingImage ? <span className="mt-1 text-meta">Import en cours · {imageUploadProgress || 0} %</span> : null}
          </button>
        )}
      </section>

      <section className="rounded-control border border-warm-border bg-cream-sunken p-4">
        <h3 className="text-label-sm font-semibold">Catalogue PDF · facultatif</h3>
        <p className="mt-1 text-meta text-ink/60">Utile si ton prospectus présente plusieurs offres. PDF, 20 Mo maximum.</p>
        <input
          ref={catalogInputRef}
          className="sr-only"
          type="file"
          accept="application/pdf"
          disabled={disabled || uploadingCatalog}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onCatalogSelected(file)
            event.target.value = ''
          }}
        />
        {catalogPdfUrl ? (
          <div className="mt-4 flex min-h-40 flex-col items-center justify-center rounded-control border border-warm-border bg-cream-surface px-4 text-center">
            <FileText className="h-9 w-9 text-accent-text" aria-hidden="true" />
            <p className="mt-2 text-body-sm font-semibold">Catalogue prêt à être publié</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button type="button" variant="secondary" compact loading={uploadingCatalog} loadingLabel="Import…" disabled={disabled} onClick={() => catalogInputRef.current?.click()}>Remplacer</Button>
              <Button type="button" variant="ghost" compact disabled={disabled || uploadingCatalog} onClick={onRemoveCatalog}><X className="h-4 w-4" aria-hidden="true" />Retirer</Button>
            </div>
          </div>
        ) : (
          <button type="button" disabled={disabled || uploadingCatalog} className="mt-4 flex min-h-40 w-full flex-col items-center justify-center rounded-control border border-dashed border-warm-border bg-cream-surface px-4 text-center text-ink/60 hover:border-accent disabled:cursor-not-allowed" onClick={() => catalogInputRef.current?.click()}>
            <Upload className="h-9 w-9" aria-hidden="true" />
            <span className="mt-2 text-body-sm font-semibold">Ajouter un catalogue PDF</span>
            {uploadingCatalog ? <span className="mt-1 text-meta">Import en cours…</span> : null}
          </button>
        )}
      </section>
    </div>
  )
}
