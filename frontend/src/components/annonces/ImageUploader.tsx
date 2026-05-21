// src/components/annonces/ImageUploader.tsx
// ── Composant drag & drop avec prévisualisation + progression ─────────────────

'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, X, GripVertical, AlertCircle, CheckCircle, ImageIcon, Loader2 } from 'lucide-react'
import { useImageUpload } from '@/hooks/useImageUpload'
import type { UploadedImage } from '@/types/upload.types'
import { UPLOAD_CONFIG } from '@/types/upload.types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface ImageUploaderProps {
  annonce_id:    string
  initial?:      UploadedImage[]
  onChange?:     (images: UploadedImage[]) => void
  className?:    string
}

// ── Carte image avec drag ─────────────────────────────────────────────────────

function ImageCard({
  preview,
  index,
  total,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onMoveLeft,
  onMoveRight,
}: {
  preview:     string
  index:       number
  total:       number
  onRemove:    () => void
  onDragStart: (i: number) => void
  onDragOver:  (e: React.DragEvent, i: number) => void
  onDrop:      (i: number) => void
  onMoveLeft:  () => void
  onMoveRight: () => void
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => { e.preventDefault(); onDragOver(e, index) }}
      onDrop={() => onDrop(index)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          onMoveLeft()
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          onMoveRight()
        }
      }}
      tabIndex={0}
      className="relative group aspect-square rounded-xl overflow-hidden bg-sand border border-night/10 cursor-grab active:cursor-grabbing"
      aria-label={`Image ${index + 1} sur ${total}${index === 0 ? ' — photo principale' : ''}`}
      role="group"
    >
      {/* Image */}
      <img src={preview} alt="" className="w-full h-full object-cover" />

      {/* Badge principale */}
      {index === 0 && (
        <div className="absolute top-1.5 left-1.5 bg-coral text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          Principale
        </div>
      )}

      {/* Overlay actions */}
      <div className="absolute inset-0 bg-night/0 group-hover:bg-night/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-night/60 cursor-grab">
          <GripVertical size={12} />
        </div>
      </div>

      {/* Bouton suppression */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/90 hover:bg-red-50 border border-night/10 rounded-full flex items-center justify-center text-night/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Supprimer l'image"
      >
        <X size={10} />
      </button>
    </div>
  )
}

// ── Barre de progression ──────────────────────────────────────────────────────

function ProgressBar({ pct, stage }: { pct: number; stage: string }) {
  const label =
    stage === 'compressing' ? 'Compression…' :
    stage === 'uploading'   ? `Envoi… ${pct}%` :
    stage === 'done'        ? 'Terminé !' : 'Erreur'

  const color =
    stage === 'error' ? 'bg-red-500' :
    stage === 'done'  ? 'bg-emerald-500' : 'bg-coral'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-night/60">{label}</span>
        {stage === 'uploading' && <span className="text-night/40">{pct}%</span>}
      </div>
      <div className="h-1.5 bg-sand rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ${color}`}
          style={{ width: stage === 'compressing' ? '30%' : `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ImageUploader({ annonce_id, initial = [], onChange, className = '' }: ImageUploaderProps) {
  const {
    images, previews, uploading, progress, errors,
    uploadImages, removeImage, reorderImages,
  } = useImageUpload(initial)

  const inputRef      = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver]   = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Notifier le parent à chaque changement
  const notifyParent = useCallback((imgs: UploadedImage[]) => {
    onChange?.(imgs)
  }, [onChange])

  // ── Drop zone ─────────────────────────────────────────────────────────────

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (!files.length) return
    const uploaded = await uploadImages(files, annonce_id)
    if (uploaded.length) notifyParent([...images, ...uploaded])
  }, [uploadImages, annonce_id, images, notifyParent])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const uploaded = await uploadImages(files, annonce_id)
    if (uploaded.length) notifyParent([...images, ...uploaded])
    e.target.value = '' // reset pour permettre de re-sélectionner le même fichier
  }, [uploadImages, annonce_id, images, notifyParent])

  // ── Suppression ───────────────────────────────────────────────────────────

  const handleRemove = async (index: number) => {
    await removeImage(index)
    notifyParent(images.filter((_, i) => i !== index))
  }

  // ── Drag & drop réordonnancement ──────────────────────────────────────────

  const handleCardDragStart = (index: number) => setDragIndex(index)

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
  }

  const handleCardDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return
    reorderImages(dragIndex, index)
    setDragIndex(null)
    const next = [...images]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    notifyParent(next)
  }

  const moveImage = (from: number, to: number) => {
    if (from < 0 || to < 0 || from === to || to >= images.length) return
    reorderImages(from, to)
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    notifyParent(next)
  }

  const remaining = UPLOAD_CONFIG.max_files - images.length
  const canAddMore = remaining > 0 && !uploading

  return (
    <div className={`space-y-3 ${className}`}>

      {/* ── Grille d'images ─────────────────────────────────────────────── */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((preview, i) => (
            <ImageCard
              key={i}
              preview={preview}
              index={i}
              total={previews.length}
              onRemove={() => handleRemove(i)}
              onDragStart={handleCardDragStart}
              onDragOver={handleCardDragOver}
              onDrop={handleCardDrop}
              onMoveLeft={() => moveImage(i, i - 1)}
              onMoveRight={() => moveImage(i, i + 1)}
            />
          ))}

          {/* Cellule d'ajout rapide si place disponible */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-night/20 hover:border-coral/50 hover:bg-coral/5 flex flex-col items-center justify-center gap-1 text-night/30 hover:text-coral transition-all"
              aria-label="Ajouter des photos"
            >
              <Upload size={18} />
              <span className="text-[10px]">Ajouter</span>
            </button>
          )}
        </div>
      )}

      {/* ── Zone de drop principale (si aucune image) ────────────────────── */}
      {previews.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => canAddMore && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!canAddMore) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
            dragOver
              ? 'border-coral bg-coral/8 scale-[1.01]'
              : 'border-night/20 hover:border-coral/40 hover:bg-coral/4'
          }`}
          role="button"
          tabIndex={0}
          aria-label="Zone de dépôt des photos"
          aria-describedby="upload-help"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            dragOver ? 'bg-coral text-white' : 'bg-sand text-night/30'
          }`}>
            {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImageIcon size={22} />}
          </div>
          <div className="text-center">
            <p className="font-medium text-night/70 text-sm">
              {dragOver ? 'Déposer les photos ici' : 'Glissez vos photos ou cliquez'}
            </p>
            <p className="text-xs text-night/40 mt-1">
              JPEG, PNG, WebP, HEIC · Max {UPLOAD_CONFIG.max_size_mb}Mo · {UPLOAD_CONFIG.max_files} photos max
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-night/40">
            <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> Compression automatique</span>
            <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> WebP optimisé</span>
            <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> Miniatures générées</span>
          </div>
          <p className="sr-only" id="upload-help">
            Utilisez la touche Entrée pour ajouter des photos et les flèches gauche et droite pour réordonner les images déjà ajoutées.
          </p>
        </div>
      )}

      {/* ── Progression ─────────────────────────────────────────────────── */}
      {uploading && progress && (
        <ProgressBar pct={progress.progress_pct} stage={progress.stage} />
      )}

      {/* ── Erreurs ──────────────────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              {e}
            </div>
          ))}
        </div>
      )}

      {/* ── Compteur + hint drag ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-[11px] text-night/40">
        <span>{images.length}/{UPLOAD_CONFIG.max_files} photos</span>
        {images.length > 1 && <span>Glissez pour réordonner · La 1ère photo est la principale</span>}
      </div>

      {/* Input file caché */}
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_CONFIG.accepted_types.join(',')}
        multiple
        className="hidden"
        onChange={handleFileInput}
        aria-hidden="true"
      />
    </div>
  )
}
