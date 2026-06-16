'use client'

const DEFAULT_MAX_WIDTH = 1600
const DEFAULT_MAX_HEIGHT = 1600
const DEFAULT_QUALITY = 0.82

function getTargetMimeType(sourceType: string) {
  const normalized = String(sourceType || '').toLowerCase()
  if (normalized === 'image/png') return 'image/webp'
  if (normalized === 'image/webp') return 'image/webp'
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'image/webp'
  return 'image/webp'
}

function createImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de charger l’image.'))
    }
    image.src = url
  })
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Compression impossible.'))
        return
      }
      resolve(blob)
    }, mimeType, quality)
  })
}

export async function compressImage(file: File, options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}) {
  if (typeof window === 'undefined' || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }

  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT
  const quality = options.quality ?? DEFAULT_QUALITY

  const image = await createImageElement(file)
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  if (!width || !height) return file

  const ratio = Math.min(1, maxWidth / width, maxHeight / height)
  const targetWidth = Math.max(1, Math.round(width * ratio))
  const targetHeight = Math.max(1, Math.round(height * ratio))

  if (ratio >= 1 && file.size < 900_000) {
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

  const mimeType = getTargetMimeType(file.type)
  const blob = await canvasToBlob(canvas, mimeType, quality)
  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg'
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${baseName}.${extension}`, {
    type: blob.type || mimeType,
    lastModified: file.lastModified || Date.now(),
  })
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return '0 o'
  const units = ['o', 'Ko', 'Mo', 'Go']
  let current = bytes
  let index = 0
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  const rounded = current >= 10 || index === 0 ? Math.round(current) : Number(current.toFixed(1))
  return `${rounded} ${units[index]}`
}
