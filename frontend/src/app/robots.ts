// src/app/robots.ts
// ── robots.txt dynamique Next.js 14 ──────────────────────────────────────────

import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/types/seo.types'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Autoriser tous les robots sur le contenu public
        userAgent: '*',
        allow:     ['/', '/annonces/', '/annonces/*'],
        disallow:  [
          '/admin/',
          '/api/',
          '/profil/',
          '/mes-annonces/',
          '/messages/',
          '/favoris/',
          '/connexion',
          '/inscription',
          '/parametres/',
          '/*?*',      // bloquer toutes les URLs avec query params (évite le duplicate content)
        ],
      },
      {
        // Bloquer les scrapers connus
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai'],
        disallow:  ['/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  }
}
