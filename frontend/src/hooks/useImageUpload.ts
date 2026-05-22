'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { uploadApi } from '@/lib/api'
import type { UploadedImage, UploadProgressEvent } from '@/types/upload.types'

type UploadStage = UploadProgressEvent['stage']

type QueueItem = {
  id: string
  listingId: string
  file?: File
  preview: string
  previewSource: 'local' | 'remote'
  status: 'queued' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
  order: number
  retryCount: number
  uploadedImage?: UploadedImage
}

const MAX_CONCURRENT_UPLOADS = 3

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function makeId(prefix = 'upload') {
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${suffix}`
}

function createPreview(file: File) {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(file)
  }
  return ''
}

function toUploadedImage(item: QueueItem, payload: {
  id?: number | string
  url: string
  thumbnail_url?: string | null
  medium_url?: string | null
  original_url?: string | null
  variants?: Record<string, { path?: string; url?: string }>
}): UploadedImage {
  return {
    key: String(payload.id ?? item.id),
    url: payload.url,
    thumbnail_url: payload.thumbnail_url ?? null,
    medium_url: payload.medium_url ?? payload.url ?? null,
    original_url: payload.original_url ?? payload.url ?? null,
    variants: payload.variants,
    width: 0,
    height: 0,
    size_bytes: item.file?.size ?? 0,
    order: item.order,
  }
}

function serializeInitial(initial: UploadedImage[]) {
  return initial.map((image, index) => ({
    id: image.key || `initial-${index}`,
    listingId: 'existing',
    preview: image.url,
    previewSource: 'remote' as const,
    status: 'done' as const,
    progress: 100,
    order: image.order ?? index,
    retryCount: 0,
    uploadedImage: image,
  }))
}

export function useImageUpload(initial: UploadedImage[] = []) {
  const [items, setItems] = useState<QueueItem[]>(() => serializeInitial(initial))
  const itemsRef = useRef<QueueItem[]>(serializeInitial(initial))
  const activeUploads = useRef(0)

  useEffect(() => {
    const next = serializeInitial(initial)
    setItems(next)
    itemsRef.current = next
  }, [initial])

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.previewSource === 'local' && item.preview.startsWith('blob:')) {
          URL.revokeObjectURL(item.preview)
        }
      }
    }
  }, [])

  const updateItems = useCallback((updater: (current: QueueItem[]) => QueueItem[]) => {
    setItems((current) => {
      const next = updater(current)
      itemsRef.current = next
      return next
    })
  }, [])

  const pumpQueue = useCallback(() => {
    while (activeUploads.current < MAX_CONCURRENT_UPLOADS) {
      const nextItem = itemsRef.current.find((item) => item.status === 'queued')
      if (!nextItem || !nextItem.file) return

      activeUploads.current += 1
      updateItems((current) =>
        current.map((item) =>
          item.id === nextItem.id
            ? { ...item, status: 'uploading', progress: 0, error: undefined }
            : item
        )
      )

      const file = nextItem.file
      const listingId = nextItem.listingId

      void uploadApi.uploadImages(listingId, [file], {
        onUploadProgress: (event: ProgressEvent | { loaded: number; total?: number }) => {
          const total = 'total' in event && typeof event.total === 'number' ? event.total : file.size
          const loaded = Math.max(0, 'loaded' in event ? event.loaded : 0)
          const progressPct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
          updateItems((current) =>
            current.map((item) =>
              item.id === nextItem.id
                ? { ...item, status: 'uploading', progress: progressPct }
                : item
            )
          )
        },
      })
        .then(({ data }) => {
          const uploaded = Array.isArray(data?.data) ? data.data[0] : null
          const image = uploaded
            ? toUploadedImage(nextItem, uploaded)
            : {
                key: nextItem.id,
                url: nextItem.preview,
                width: 0,
                height: 0,
                size_bytes: file.size,
                order: nextItem.order,
              }

          updateItems((current) =>
            current.map((item) =>
              item.id === nextItem.id
                ? {
                    ...item,
                    status: 'done',
                    progress: 100,
                    error: undefined,
                    uploadedImage: image,
                  }
                : item
            )
          )
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Échec de l’envoi'
          updateItems((current) =>
            current.map((item) =>
              item.id === nextItem.id
                ? { ...item, status: 'error', error: message, progress: 0 }
                : item
            )
          )
        })
        .finally(() => {
          activeUploads.current = Math.max(0, activeUploads.current - 1)
          pumpQueue()
        })
    }
  }, [updateItems])

  const enqueueFiles = useCallback((files: FileList | File[], listingId: string) => {
    const fileList = Array.from(files as ArrayLike<File>)
    if (!fileList.length) return

    const nextItems = fileList.map((file, index) => ({
      id: makeId('img'),
      listingId,
      file,
      preview: createPreview(file),
      previewSource: 'local' as const,
      status: 'queued' as const,
      progress: 0,
      order: itemsRef.current.filter((item) => item.status === 'done').length + index,
      retryCount: 0,
    }))

    updateItems((current) => [...current, ...nextItems])
    window.setTimeout(() => {
      pumpQueue()
    }, 0)
  }, [pumpQueue, updateItems])

  const removeImage = useCallback(async (index: number | string) => {
    updateItems((current) => {
      const next = typeof index === 'number'
        ? [...current.slice(0, index), ...current.slice(index + 1)]
        : current.filter((item) => item.id !== index)

      const removed = typeof index === 'number'
        ? current[index]
        : current.find((item) => item.id === index)
      if (removed?.previewSource === 'local' && removed.preview.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview)
      }

      return next.map((item, idx) => ({
        ...item,
        order: idx,
        uploadedImage: item.uploadedImage
          ? { ...item.uploadedImage, order: idx }
          : item.uploadedImage,
      }))
    })
    return true
  }, [updateItems])

  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    updateItems((current) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length || fromIndex === toIndex) {
        return current
      }

      const next = moveItem(current, fromIndex, toIndex).map((item, index) => ({
        ...item,
        order: index,
        uploadedImage: item.uploadedImage
          ? { ...item.uploadedImage, order: index }
          : item.uploadedImage,
      }))
      return next
    })
  }, [updateItems])

  const retryImage = useCallback((index: number) => {
    updateItems((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index
          ? { ...item, status: 'queued', error: undefined, progress: 0, retryCount: item.retryCount + 1 }
          : item
      )
    )
    pumpQueue()
  }, [pumpQueue, updateItems])

  const previews = useMemo(() => items.map((item) => item.preview), [items])
  const uploadedImages = useMemo(
    () => items.filter((item) => item.status === 'done' && item.uploadedImage).map((item) => item.uploadedImage as UploadedImage),
    [items]
  )
  const progress = useMemo<UploadProgressEvent | null>(() => {
    const uploadingItem = items.find((item) => item.status === 'uploading')
    if (!uploadingItem) return null
    return {
      file_index: items.indexOf(uploadingItem),
      total_files: items.length,
      progress_pct: uploadingItem.progress,
      stage: uploadingItem.status === 'uploading' ? 'uploading' : 'done',
    }
  }, [items])

  const errors = useMemo(
    () => items.filter((item) => item.status === 'error').map((item) => item.error || 'Échec de l’envoi'),
    [items]
  )

  return {
    items,
    images: uploadedImages,
    previews,
    uploading: items.some((item) => item.status === 'queued' || item.status === 'uploading'),
    progress,
    errors,
    uploadImages: enqueueFiles,
    removeImage,
    reorderImages,
    retryImage,
  }
}
