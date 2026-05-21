// src/components/seo/JsonLd.tsx
// ── Injection JSON-LD (schema.org) dans le <head> ────────────────────────────
// À utiliser dans les pages annonce et catégorie pour le rich snippet Google

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ── Schémas prêts à l'emploi ──────────────────────────────────────────────────

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type':    'Organization',
    name:       'Troca',
    url:        'https://troca.nc',
    logo:       'https://troca.nc/logo.png',
    description: 'Plateforme de petites annonces en Nouvelle-Calédonie',
    address: {
      '@type':          'PostalAddress',
      addressLocality:  'Nouméa',
      addressRegion:    'Nouvelle-Calédonie',
      addressCountry:   'NC',
    },
    contactPoint: {
      '@type':       'ContactPoint',
      contactType:   'customer support',
      email:         'contact@troca.nc',
      availableLanguage: 'French',
    },
    sameAs: [
      'https://www.facebook.com/TrocaNC',
      'https://www.instagram.com/TrocaNC',
    ],
  }
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type':    'WebSite',
    name:       'Troca',
    url:        'https://troca.nc',
    description: 'Petites annonces Nouvelle-Calédonie',
    potentialAction: {
      '@type':       'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://troca.nc/annonces?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildProductSchema(annonce: {
  id:          number
  titre:       string
  description: string
  prix:        number | null
  commune:     string | null
  images:      { url: string }[]
  user:        { prenom: string }
  created_at:  string
}) {
  return {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:       annonce.titre,
    description: annonce.description.slice(0, 500),
    image:      annonce.images.slice(0, 4).map(i => i.url),
    url:        `https://troca.nc/annonces/${annonce.id}`,
    ...(annonce.prix && {
      offers: {
        '@type':       'Offer',
        price:         annonce.prix,
        priceCurrency: 'XPF',
        availability:  'https://schema.org/InStock',
        areaServed:    annonce.commune ?? 'Nouvelle-Calédonie',
        seller: {
          '@type': 'Person',
          name:    annonce.user.prenom,
        },
      },
    }),
  }
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type':   'ListItem',
      position:  i + 1,
      name:      item.name,
      item:      item.url,
    })),
  }
}
