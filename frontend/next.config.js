// ============================================================
//  Kalico — Configuration Next.js
// ============================================================

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalico.nc'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || `${siteUrl}/api`
const siteUrlObject = new URL(siteUrl)
const siteOrigin = siteUrlObject.origin
const apiOrigin = new URL(apiUrl, siteUrl).origin
const apiWsOrigin = apiOrigin.replace(/^http/, 'ws')

const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },

  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

  // Standalone uniquement quand on le demande explicitement (Docker)
  output: process.env.NEXT_STANDALONE === '1' ? 'standalone' : undefined,

  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf',
      '@napi-rs/canvas': false,
    }
    return config
  },

  async redirects() {
    return [
      {
        source: '/fret',
        destination: '/envoi-livraison',
        permanent: true,
      },
    ]
  },

  // Variables d'environnement publiques exposées au client
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://kalico.nc',
    NEXT_PUBLIC_API_URL:    process.env.NEXT_PUBLIC_API_URL    || 'http://localhost:3001',
    NEXT_PUBLIC_STRIPE_PK: process.env.NEXT_PUBLIC_STRIPE_PK || '',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
    NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
    NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY: process.env.NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY || '',
    NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY: process.env.NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY || '',
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || 'false',
    NEXT_PUBLIC_SHOW_DEMO_BAR: process.env.NEXT_PUBLIC_SHOW_DEMO_BAR || 'false',
  },

  // Images distantes: on ne garde que le domaine de prod pour la V1
  images: {
    remotePatterns: [
      {
        protocol: siteUrlObject.protocol.replace(':', ''),
        hostname: siteUrlObject.hostname,
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/**',
      },
    ],
  },

  // Headers de sécurité
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https: http://localhost:3000 http://127.0.0.1:3000 http://localhost:3001 http://127.0.0.1:3001",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com accounts.google.com static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      `connect-src 'self' ${siteOrigin} ${apiOrigin} ${apiWsOrigin} accounts.google.com https://oauth2.googleapis.com https://api.stripe.com wss://${siteUrlObject.hostname} http://localhost:3001 http://127.0.0.1:3001 ws://localhost:3001 ws://127.0.0.1:3001`,
      "font-src 'self' data: https:",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options',         value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }] : []),
        ],
      },
    ];
  },
};

module.exports = nextConfig;
