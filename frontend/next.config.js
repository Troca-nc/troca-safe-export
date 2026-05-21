// ============================================================
//  Troca — Configuration Next.js
// ============================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone uniquement quand on le demande explicitement (Docker)
  output: process.env.NEXT_STANDALONE === '1' ? 'standalone' : undefined,

  // Variables d'environnement publiques exposées au client
  env: {
    NEXT_PUBLIC_API_URL:    process.env.NEXT_PUBLIC_API_URL    || 'http://localhost:3001/api',
    NEXT_PUBLIC_STRIPE_PK: process.env.NEXT_PUBLIC_STRIPE_PK || '',
  },

  // Images distantes: on ne garde que le domaine de prod pour la V1
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'troca.nc',
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
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',         value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
