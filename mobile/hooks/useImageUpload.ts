import { useCallback, useMemo, useRef, useState } from 'react'

import type { MobileUploadItem } from '@/components/ImageUploader'
import { uploadListingPhoto } from '@/lib/publishListing'

const MAX_CONCURRENT_UPLOADS = 3
const MAX_UPLOADS = 8

function makeId(prefix = 'upload') {
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${suffix}`
}

function createItem(uri: string): MobileUploadItem {
  return {
    id: makeId('img'),
    uri,
    status: 'queued',
    progress: 0,
  }
}

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function updateStatus(
  items: MobileUploadItem[],
  index: number,
  patch: Partial<MobileUploadItem>,
) {
  return items.map((item, currentIndex) =>
    currentIndex === index
      ? { ...item, ...patch }
      : item
  )
}

export type UploadBatchResult = {
  listingId: string | number | null
  hasErrors: boolean
  failedIndexes: number[]
}

export function useImageUpload(initialUris: string[] = []) {
  const [items, setItems] = useState<MobileUploadItem[]>(
    () => initialUris.slice(0, MAX_UPLOADS).map((uri) => createItem(uri))
  )
  const itemsRef = useRef(items)
  const listingIdRef = useRef<string | number | null>(null)

  const syncItems = useCallback((updater: (current: MobileUploadItem[]) => MobileUploadItem[]) => {
    setItems((current) => {
      const next = updater(current)
      itemsRef.current = next
      return next
    })
  }, [])

  const replacePhotos = useCallback((uris: string[]) => {
    syncItems(() => uris.slice(0, MAX_UPLOADS).map((uri) => createItem(uri)))
  }, [syncItems])

  const addPhotos = useCallback((uris: string[]) => {
    if (!uris.length) return

    syncItems((current) => {
      const remaining = Math.max(0, MAX_UPLOADS - current.length)
      if (remaining <= 0) return current

      const nextItems = uris.slice(0, remaining).map((uri) => createItem(uri))
      return [...current, ...nextItems]
    })
  }, [syncItems])

  const removeImage = useCallback((index: number) => {
    syncItems((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }, [syncItems])

  const reorderImages = useCallback((from: number, to: number) => {
    syncItems((current) => {
      if (from < 0 || to < 0 || from >= current.length || to >= current.length || from === to) {
        return current
      }

      return moveItem(current, from, to)
    })
  }, [syncItems])

  const uploadSingle = useCallback(async (listingId: string | number, index: number) => {
    const snapshot = itemsRef.current[index]
    if (!snapshot) return false

    syncItems((current) => updateStatus(current, index, { status: 'uploading', progress: 0, error: undefined }))

    try {
      await uploadListingPhoto(listingId, snapshot.uri, index, (progressPct) => {
        syncItems((current) => updateStatus(current, index, { status: 'uploading', progress: progressPct }))
      })

      syncItems((current) => updateStatus(current, index, { status: 'done', progress: 100, error: undefined }))
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ã‰chec de l'envoi"
      syncItems((current) => updateStatus(current, index, { status: 'error', progress: 0, error: message }))
      return false
    }
  }, [syncItems])

  const uploadQueued = useCallback(async (listingId: string | number): Promise<UploadBatchResult> => {
    listingIdRef.current = listingId
    const pendingIndexes = itemsRef.current
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.status === 'queued')
      .map(({ index }) => index)
    const unresolvedErrorIndexes = itemsRef.current
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.status === 'error')
      .map(({ index }) => index)

    if (!pendingIndexes.length) {
      return {
        listingId,
        hasErrors: unresolvedErrorIndexes.length > 0,
        failedIndexes: unresolvedErrorIndexes,
      }
    }

    const failedIndexes: number[] = []
    let cursor = 0

    const runWorker = async () => {
      while (cursor < pendingIndexes.length) {
        const nextIndex = pendingIndexes[cursor]
        cursor += 1
        const ok = await uploadSingle(listingId, nextIndex)
        if (!ok) {
          failedIndexes.push(nextIndex)
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENT_UPLOADS, pendingIndexes.length) },
      () => runWorker(),
    )

    await Promise.all(workers)

    const remainingErrorIndexes = itemsRef.current
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.status === 'error')
      .map(({ index }) => index)

    return {
      listingId,
      hasErrors: failedIndexes.length > 0 || remainingErrorIndexes.length > 0,
      failedIndexes: Array.from(new Set([...failedIndexes, ...remainingErrorIndexes])).sort((a, b) => a - b),
    }
  }, [uploadSingle])

  const queueRetry = useCallback((index: number) => {
    syncItems((current) => updateStatus(current, index, { status: 'queued', progress: 0, error: undefined }))
  }, [syncItems])

  const resetUploads = useCallback(() => {
    listingIdRef.current = null
    syncItems(() => [])
  }, [syncItems])

  const images = useMemo(
    () => items.filter((item) => item.status === 'done').map((item) => item.uri),
    [items],
  )

  const uploading = useMemo(
    () => items.some((item) => item.status === 'uploading' || item.status === 'queued'),
    [items],
  )

  return {
    items,
    images,
    uploading,
    addPhotos,
    removeImage,
    reorderImages,
    queueRetry,
    replacePhotos,
    uploadQueued,
    resetUploads,
  }
}
