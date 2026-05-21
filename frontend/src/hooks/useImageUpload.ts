'use client'

import { useMemo, useState } from 'react'
import type { UploadedImage, UploadProgressEvent } from '@/types/upload.types'

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function useImageUpload(initial: UploadedImage[] = []) {
  const [images, setImages] = useState<UploadedImage[]>(initial)
  const [progress, setProgress] = useState<UploadProgressEvent | null>(null)

  const previews = useMemo(() => images.map((image) => image.url), [images])

  return {
    images,
    previews,
    uploading: false,
    progress,
    errors: [] as string[],
    uploadImages: async (files: FileList | File[], annonceId: string) => {
      const fileList = Array.from(files as ArrayLike<File>)
      const next = fileList.map((file, index) => ({
        key: `annonces/${annonceId}/${Date.now()}-${index}-${file.name}`,
        url: typeof URL !== 'undefined' ? URL.createObjectURL(file) : '',
        width: 0,
        height: 0,
        size_bytes: file.size,
        order: images.length + index,
      }))

      setProgress({
        file_index: fileList.length ? fileList.length - 1 : 0,
        total_files: fileList.length,
        progress_pct: 100,
        stage: 'done',
      })
      setImages((current) => [...current, ...next])
      return next
    },
    removeImage: async (index: number | string) => {
      setImages((current) => {
        if (typeof index === 'number') {
          return current.filter((_, currentIndex) => currentIndex !== index)
        }

        return current.filter((image) => image.key !== index)
      })
      return true
    },
    reorderImages: (fromIndex: number, toIndex: number) => {
      setImages((current) =>
        moveItem(current, fromIndex, toIndex).map((image, index) => ({
          ...image,
          order: index,
        }))
      )
    },
  }
}
