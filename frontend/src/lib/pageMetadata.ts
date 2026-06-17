import type { Metadata } from 'next'

import { DEFAULT_OG_IMAGE, SITE_LOCALE, SITE_NAME, SITE_TWITTER, SITE_URL } from '@/types/seo.types'

type PageMetadataInput = {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  noindex?: boolean
}

export function buildPageMetadata({ title, description, path, type = 'website', noindex = false }: PageMetadataInput): Metadata {
  const canonical = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
      site: SITE_TWITTER,
    },
  }
}
