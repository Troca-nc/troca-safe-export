'use client'

import { useRef } from 'react'
import { Image as ImageIcon, Star, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'

const MAX_EVENT_PHOTOS = 12

export function EventPhotosField({
  photos,
  uploading,
  uploadProgress,
  error,
  disabled = false,
  onFilesSelected,
  onRemove,
  onSetCover,
}: {
  photos: string[]
  uploading: boolean
  uploadProgress: number
  error?: string
  disabled?: boolean
  onFilesSelected: (files: File[]) => void
  onRemove: (url: string) => void
  onSetCover: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const remaining = Math.max(0, MAX_EVENT_PHOTOS - photos.length)

  return (
    <fieldset className="mt-5" aria-describedby={error ? 'event-photos-error' : 'event-photos-hint'}>
      <legend className="text-label-sm font-semibold">Photos de l’événement</legend>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p id="event-photos-hint" className="mt-1 text-meta text-ink/65">
            Jusqu’à {MAX_EVENT_PHOTOS} photos. La première est utilisée comme couverture.
          </p>
        </div>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          disabled={disabled || uploading || remaining === 0}
          onChange={(event) => {
            onFilesSelected(Array.from(event.target.files || []))
            event.target.value = ''
          }}
        />
        <Button
          type="button"
          variant="secondary"
          compact
          loading={uploading}
          loadingLabel={`Import ${uploadProgress || 0} %`}
          disabled={disabled || remaining === 0}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {photos.length ? 'Ajouter des photos' : 'Choisir des photos'}
        </Button>
      </div>

      {error ? <p id="event-photos-error" role="alert" className="mt-2 text-meta text-alert-error">{error}</p> : null}

      {photos.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((url, index) => (
            <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-control border border-warm-border bg-cream-sunken">
              <img src={url} alt={index === 0 ? 'Photo de couverture' : `Photo ${index + 1}`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-ink/80 p-2 text-cream">
                {index === 0 ? (
                  <span className="inline-flex items-center gap-1 text-meta font-semibold"><Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />Couverture</span>
                ) : (
                  <button type="button" className="min-h-9 rounded-control px-2 text-meta font-semibold hover:bg-cream/15" onClick={() => onSetCover(url)}>
                    Mettre en couverture
                  </button>
                )}
                <button type="button" aria-label={`Retirer la photo ${index + 1}`} className="flex h-9 w-9 items-center justify-center rounded-control hover:bg-cream/15" onClick={() => onRemove(url)}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          className="mt-4 flex min-h-40 w-full flex-col items-center justify-center rounded-control border border-dashed border-warm-border bg-cream-sunken px-5 text-center text-ink/55 hover:border-accent disabled:cursor-not-allowed"
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon className="h-10 w-10" aria-hidden="true" />
          <span className="mt-2 text-body-sm font-semibold">Ajoute les photos depuis ton appareil</span>
          <span className="mt-1 text-meta">JPG, PNG, WebP ou HEIC, 10 Mo maximum par photo</span>
        </button>
      )}

      {photos.length ? <p className="mt-2 text-meta text-ink/60">{photos.length} photo{photos.length > 1 ? 's' : ''} sur {MAX_EVENT_PHOTOS}</p> : null}
    </fieldset>
  )
}
