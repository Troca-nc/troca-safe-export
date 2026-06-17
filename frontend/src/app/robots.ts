import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/types/seo.types'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/pro/dashboard/',
          '/admin/',
          '/messages/',
          '/mes-',
          '/parametres/',
          '/connexion',
          '/inscription',
          '/scan/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
