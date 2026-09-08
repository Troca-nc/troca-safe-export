'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function usePrivateAttachment(path?: string | null) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!path) {
      setObjectUrl(null)
      return
    }

    setObjectUrl(null)
    let active = true
    let createdUrl: string | null = null

    api.get(path, { responseType: 'blob' }).then(({ data }) => {
      if (!active) return
      createdUrl = URL.createObjectURL(data)
      setObjectUrl(createdUrl)
    }).catch(() => {
      if (active) setObjectUrl(null)
    })

    return () => {
      active = false
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [path])

  return objectUrl
}

export async function openPrivateAttachment(path: string, filename?: string) {
  const { data } = await api.get(path, { responseType: 'blob' })
  const objectUrl = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = objectUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  if (filename) link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}
