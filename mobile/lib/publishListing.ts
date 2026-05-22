import { api } from '@/lib/api'

export type PublishListingInput = {
  titre: string
  description: string
  price?: string
  category_id: number
  commune_id: number
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'for_parts'
  contre_quoi?: string
}

export type UploadedListingImage = {
  id?: number | string
  url: string
  thumbnail_url?: string | null
  sort_order?: number
  is_cover?: boolean
}

export type CreatedListing = {
  id: string | number
  [key: string]: unknown
}

type UploadProgressHandler = (progressPct: number) => void

function guessMimeType(uri: string) {
  const cleanUri = uri.split('?')[0].toLowerCase()
  if (cleanUri.endsWith('.png')) return 'image/png'
  if (cleanUri.endsWith('.webp')) return 'image/webp'
  if (cleanUri.endsWith('.heic')) return 'image/heic'
  return 'image/jpeg'
}

function buildUploadPart(uri: string, index: number) {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg'
  return {
    uri,
    name: `photo_${Date.now()}_${index}.${extension}`,
    type: guessMimeType(uri),
  }
}

export async function createListing(data: PublishListingInput): Promise<CreatedListing> {
  const payload = {
    title: data.titre,
    titre: data.titre,
    description: data.description,
    price: data.price ? Number(data.price) : null,
    is_free: !data.price,
    category_id: data.category_id,
    commune_id: data.commune_id,
    condition: data.condition,
    contre_quoi: data.contre_quoi || null,
  }

  const { data: response } = await api.post('/listings', payload)
  return (response?.data ?? response) as CreatedListing
}

export async function uploadListingPhoto(
  listingId: string | number,
  uri: string,
  index: number,
  onProgress?: UploadProgressHandler,
): Promise<UploadedListingImage> {
  const form = new FormData()
  form.append('images', buildUploadPart(uri, index) as never)

  const { data } = await api.post(`/upload/listing/${listingId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      const total = typeof event.total === 'number' && event.total > 0 ? event.total : 0
      const loaded = Math.max(0, event.loaded ?? 0)
      const progressPct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
      onProgress?.(progressPct)
    },
  })

  const uploaded = Array.isArray(data?.data) ? data.data[0] : null
  if (!uploaded?.url) {
    throw new Error("Impossible de récupérer l'URL de l'image uploadée")
  }

  return uploaded as UploadedListingImage
}

export async function publishListing(data: PublishListingInput, photos: string[]) {
  const listing = await createListing(data)

  for (let index = 0; index < photos.length; index += 1) {
    await uploadListingPhoto(listing.id, photos[index], index)
  }

  return listing
}
