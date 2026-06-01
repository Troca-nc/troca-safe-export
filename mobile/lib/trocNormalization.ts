import type { TrocCompatibility, TrocStatus } from '@/types/troc'

export type TrocFeedItem = {
  id: number
  title: string
  description?: string | null
  category_name?: string | null
  category_slug?: string | null
  commune_name?: string | null
  image_url: string | null
  cover_image: string | null
  photos: Array<{ url?: string | null; thumbnail_url?: string | null }> | null
  troc_wants: string[]
  troc_accepts_complement_xpf: boolean
  troc_complement_max_xpf: number
  troc_status: TrocStatus
  published_at?: string | null
  created_at?: string | null
  seller_prenom?: string | null
  seller_nom?: string | null
  seller_avatar?: string | null
  seller_is_pro?: boolean
  seller_troc_badges?: string[] | null
  user?: {
    id?: number
    prenom?: string | null
    nom?: string | null
    avatar_url?: string | null
    troc_badges?: string[] | null
  }
  compatibility?: TrocCompatibility | null
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
}

function extractImage(value: Record<string, unknown>): string | null {
  const direct = value.image_url ?? value.cover_image ?? value.cover_image_thumbnail
  if (typeof direct === 'string' && direct.trim()) return direct

  const images = Array.isArray(value.images) ? value.images : []
  const firstImage = images[0] as Record<string, unknown> | undefined
  if (firstImage) {
    const thumbnail = firstImage.thumbnail_url
    if (typeof thumbnail === 'string' && thumbnail.trim()) return thumbnail
    const url = firstImage.url
    if (typeof url === 'string' && url.trim()) return url
  }

  const photos = Array.isArray(value.photos) ? value.photos : []
  const firstPhoto = photos[0] as Record<string, unknown> | string | undefined
  if (typeof firstPhoto === 'string' && firstPhoto.trim()) return firstPhoto
  if (firstPhoto && typeof firstPhoto === 'object') {
    const photoUrl = firstPhoto.thumbnail_url ?? firstPhoto.url
    if (typeof photoUrl === 'string' && photoUrl.trim()) return photoUrl
  }

  return null
}

export function normalizeTrocListing(source: unknown): TrocFeedItem {
  const item = (source ?? {}) as Record<string, unknown>
  const user = (item.user ?? {}) as Record<string, unknown>
  const compatibility = (item.compatibility ?? null) as TrocCompatibility | null

  return {
    id: Number(item.id ?? 0),
    title: String(item.titre ?? item.title ?? ''),
    description: typeof item.description === 'string' ? item.description : null,
    category_name: typeof item.category_name === 'string' ? item.category_name : null,
    category_slug: typeof item.category_slug === 'string' ? item.category_slug : null,
    commune_name: typeof item.commune_name === 'string' ? item.commune_name : null,
    image_url: extractImage(item),
    cover_image: typeof item.cover_image === 'string' ? item.cover_image : null,
    photos: Array.isArray(item.images)
      ? (item.images as Array<{ url?: string | null; thumbnail_url?: string | null }>)
      : Array.isArray(item.photos)
        ? (item.photos as Array<{ url?: string | null; thumbnail_url?: string | null }>)
        : null,
    troc_wants: toStringArray(item.troc_wants),
    troc_accepts_complement_xpf: Boolean(item.troc_accepts_complement_xpf),
    troc_complement_max_xpf: Number(item.troc_complement_max_xpf || 0),
    troc_status: (item.troc_status as TrocStatus) || 'open',
    published_at: typeof item.published_at === 'string' ? item.published_at : typeof item.created_at === 'string' ? item.created_at : null,
    created_at: typeof item.created_at === 'string' ? item.created_at : null,
    seller_prenom: typeof item.seller_prenom === 'string' ? item.seller_prenom : null,
    seller_nom: typeof item.seller_nom === 'string' ? item.seller_nom : null,
    seller_avatar: typeof item.seller_avatar === 'string' ? item.seller_avatar : null,
    seller_is_pro: Boolean(item.seller_is_pro),
    seller_troc_badges: Array.isArray(item.seller_troc_badges) ? toStringArray(item.seller_troc_badges) : null,
    user: {
      id: typeof user.id === 'number' ? user.id : Number(user.id ?? 0) || undefined,
      prenom: typeof user.prenom === 'string' ? user.prenom : null,
      nom: typeof user.nom === 'string' ? user.nom : null,
      avatar_url: typeof user.avatar_url === 'string' ? user.avatar_url : null,
      troc_badges: Array.isArray(user.troc_badges) ? toStringArray(user.troc_badges) : null,
    },
    compatibility,
  }
}
