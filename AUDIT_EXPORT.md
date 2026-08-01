# AUDIT_EXPORT

## PATH: frontend/src/app/layout.tsx
````
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/legal/CookieBanner'
import AnalyticsTracker from '@/components/layout/AnalyticsTracker'
import JsonLd, { buildOrganizationSchema, buildWebSiteSchema } from '@/components/seo/JsonLd'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import PaymentFailureBanner from '@/components/PaymentFailureBanner'
import AuthRequiredModal from '@/components/auth/AuthRequiredModal'
import DemoBanner from '@/components/DemoBanner'
import ToastCenter from '@/components/ui/ToastCenter'
import OnboardingWizard from '@/components/OnboardingWizard'
import { DEFAULT_OG_IMAGE, SITE_LOCALE, SITE_NAME, SITE_TWITTER, SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Kalico - Petites annonces Nouvelle-Calédonie',
  description: 'La première plateforme de petites annonces dédiée à la Nouvelle-Calédonie. Achetez, vendez, louez en toute confiance.',
  keywords: 'annonces, nouvelle-calédonie, noumea, vente, achat, immobilier, véhicules',
  openGraph: {
    title: SITE_NAME,
    description: 'Petites annonces Nouvelle-Calédonie',
    url: SITE_URL,
    locale: SITE_LOCALE,
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  alternates: {
    canonical: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'Petites annonces Nouvelle-Calédonie',
    images: [DEFAULT_OG_IMAGE],
    site: SITE_TWITTER,
  },
}

export const viewport = {
  themeColor: '#0A7EA4',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='theme';var legacy='kalico-theme';var saved=localStorage.getItem(k)||localStorage.getItem(legacy);var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=(saved==='dark'||saved==='light')?saved:(prefersDark?'dark':'light');var root=document.documentElement;root.classList.toggle('dark',theme==='dark');root.dataset.theme=theme;root.style.colorScheme=theme;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-[var(--color-bg-page)] text-[var(--color-text-primary)] font-body antialiased overflow-x-clip pt-14 md:overflow-x-visible">
        <ThemeProvider>
          <ReactQueryProvider>
            <JsonLd data={buildOrganizationSchema()} />
            <JsonLd data={buildWebSiteSchema()} />
            <AnalyticsTracker />
            <DemoBanner />
            <ToastCenter />
            <PaymentFailureBanner />
            <AuthRequiredModal />
            <OnboardingWizard />
            {children}
            <Footer />
            <CookieBanner />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

````

## PATH: frontend/src/app/page.tsx
````
// src/app/page.tsx
import type { Metadata } from 'next'
import { generateHomeMetadata } from '@/lib/seoHelpers'
import HomePage from '@/components/home/HomePage'

export const metadata: Metadata = generateHomeMetadata()

export default function Home() {
  return <HomePage />
}

````

## PATH: frontend/src/app/globals.css
````
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-display: Georgia, "Times New Roman", serif;
  --font-body: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  --coral: #0a7ea4;
  --ocean: #08324f;
  --lagoon: #48cae4;
  --sand: #f4f8f7;
  --jungle: #2d6a4f;
  --night: #082032;

  --color-background-primary: #fbfcfc;
  --color-background-secondary: #f4f8f7;
  --color-bg-page: #f4f8f7;
  --color-surface: #fbfcfc;
  --color-surface-raised: #ffffff;
  --color-border: rgba(8, 32, 50, 0.1);
  --color-border-secondary: rgba(8, 32, 50, 0.1);
  --color-border-strong: rgba(10, 126, 164, 0.26);
  --color-text-primary: #082032;
  --color-text-secondary: rgba(8, 32, 50, 0.72);
  --color-text-tertiary: rgba(8, 32, 50, 0.46);
  --color-success: #2d6a4f;
  --color-warning: #d97706;
  --color-danger: #d7263d;
  --color-info: #0a7ea4;

  --nc-lagon: #1e90ff;
  --nc-lagon-light: rgba(30, 144, 255, 0.08);
  --nc-lagon-border: rgba(30, 144, 255, 0.25);
  --nc-lagon-text: #0a4d8c;

  --nc-emeraude: #2e8b57;
  --nc-emeraude-light: rgba(46, 139, 87, 0.08);
  --nc-emeraude-border: rgba(46, 139, 87, 0.25);
  --nc-emeraude-text: #1a5233;

  --nc-corail: #ff6b6b;
  --nc-corail-light: rgba(255, 107, 107, 0.08);
  --nc-corail-border: rgba(255, 107, 107, 0.25);
  --nc-corail-text: #8b0000;

  --nc-sable: #f5a623;
  --nc-sable-light: rgba(245, 166, 35, 0.08);
  --nc-sable-border: rgba(245, 166, 35, 0.25);
  --nc-sable-text: #7a4800;

  color-scheme: light;
}

.dark {
  --color-background-primary: #04121e;
  --color-background-secondary: #082032;
  --color-bg-page: #04121e;
  --color-surface: #04121e;
  --color-surface-raised: #082032;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-secondary: rgba(255, 255, 255, 0.1);
  --color-border-strong: rgba(72, 202, 228, 0.28);
  --color-text-primary: #f7fbfc;
  --color-text-secondary: rgba(247, 251, 252, 0.72);
  --color-text-tertiary: rgba(247, 251, 252, 0.48);
  --color-success: #4ade80;
  --color-warning: #f59e0b;
  --color-danger: #f87171;
  --color-info: #48cae4;

  color-scheme: dark;
}

html[data-theme='dark'] {
  color-scheme: dark;
}

html[data-theme='dark'] body {
  background:
    radial-gradient(circle at top left, rgba(72, 202, 228, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(10, 126, 164, 0.1), transparent 24%),
    linear-gradient(180deg, #04121e 0%, #082032 100%);
}

.dark .bg-white,
html[data-theme='dark'] .bg-white {
  background-color: var(--color-surface) !important;
}

.dark [class*='bg-white/'],
html[data-theme='dark'] [class*='bg-white/'] {
  background-color: var(--color-surface) !important;
}

.dark .bg-sand,
html[data-theme='dark'] .bg-sand {
  background-color: var(--color-surface-raised) !important;
}

.dark [class*='bg-sand/'],
html[data-theme='dark'] [class*='bg-sand/'] {
  background-color: var(--color-surface-raised) !important;
}

.dark .text-night,
html[data-theme='dark'] .text-night {
  color: var(--color-text-primary) !important;
}

.dark [class*='text-night/9'],
html[data-theme='dark'] [class*='text-night/9'] {
  color: var(--color-text-primary) !important;
}

.dark [class*='text-night/8'],
.dark [class*='text-night/7'],
.dark [class*='text-night/6'],
html[data-theme='dark'] [class*='text-night/8'],
html[data-theme='dark'] [class*='text-night/7'],
html[data-theme='dark'] [class*='text-night/6'] {
  color: var(--color-text-secondary) !important;
}

.dark [class*='text-night/5'],
.dark [class*='text-night/4'],
.dark [class*='text-night/3'],
.dark [class*='text-night/2'],
.dark [class*='text-night/1'],
html[data-theme='dark'] [class*='text-night/5'],
html[data-theme='dark'] [class*='text-night/4'],
html[data-theme='dark'] [class*='text-night/3'],
html[data-theme='dark'] [class*='text-night/2'],
html[data-theme='dark'] [class*='text-night/1'] {
  color: var(--color-text-tertiary) !important;
}

.dark [class*='border-night/'],
html[data-theme='dark'] [class*='border-night/'] {
  border-color: var(--color-border) !important;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body), system-ui, sans-serif;
  color: var(--color-text-primary);
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(72, 202, 228, 0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(10, 126, 164, 0.12), transparent 24%),
    linear-gradient(180deg, var(--color-background-primary) 0%, var(--color-bg-page) 100%);
}

.dark body {
  background:
    radial-gradient(circle at top left, rgba(72, 202, 228, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(10, 126, 164, 0.1), transparent 24%),
    linear-gradient(180deg, #04121e 0%, #082032 100%);
}

h1,
h2,
h3,
.font-display {
  font-family: var(--font-display), Georgia, serif;
}

::selection {
  background: rgba(10, 126, 164, 0.18);
}

:focus-visible {
  outline: 2px solid rgba(10, 126, 164, 0.62);
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[role="button"]:focus-visible,
[role="switch"]:focus-visible,
[role="option"]:focus-visible {
  box-shadow: none;
}

header nav a,
header nav button {
  transition:
    color 150ms ease-out,
    background-color 150ms ease-out,
    border-color 150ms ease-out,
    box-shadow 150ms ease-out,
    transform 150ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  [data-reveal='true'] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(8, 32, 50, 0.04);
}

::-webkit-scrollbar-thumb {
  background: rgba(10, 126, 164, 0.35);
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(10, 126, 164, 0.55);
}

@layer components {
  .section {
    @apply py-16 md:py-20;
  }

  .container-narrow {
    @apply mx-auto w-full max-w-[640px] px-4 sm:px-6 lg:px-8;
  }

  .container-wide {
    @apply mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8;
  }

  .card {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(8, 32, 50, 0.08), 0 0 1px rgba(8, 32, 50, 0.06);
    padding: 24px;
    transition:
      transform 150ms ease-out,
      box-shadow 150ms ease-out,
      border-color 150ms ease-out;
  }

  .card-hover {
    @apply cursor-pointer;
  }

  .card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(8, 32, 50, 0.12), 0 0 1px rgba(8, 32, 50, 0.06);
    border-color: var(--color-border-strong);
  }

  .btn-primary,
  .btn-secondary,
  .btn-ghost,
  .btn-danger {
    @apply inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 font-semibold
      transition-all duration-100 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50;
  }

  .btn-primary {
    background: var(--coral);
    color: white;
    box-shadow: 0 2px 8px rgba(10, 126, 164, 0.18);
  }

  .btn-primary,
  .btn-secondary {
    @apply active:scale-[0.97];
  }

  .btn-primary:hover {
    background: var(--ocean);
  }

  .btn-primary:active,
  .btn-secondary:active {
    transform: scale(0.97);
  }

  .btn-ghost:active,
  .btn-danger:active {
    transform: scale(0.98);
  }

  .btn-secondary {
    border: 1px solid var(--color-border-strong);
    color: var(--color-text-primary);
    background: transparent;
  }

  .btn-secondary:hover {
    background: rgba(10, 126, 164, 0.04);
  }

  .dark .btn-secondary:hover {
    background: var(--color-surface-raised);
    color: var(--color-text-primary);
  }

  .btn-ghost {
    color: var(--coral);
    background: transparent;
  }

  .btn-ghost:hover {
    background: rgba(10, 126, 164, 0.06);
  }

  .dark .btn-ghost:hover {
    background: var(--color-surface-raised);
    color: var(--color-text-primary);
  }

  .btn-danger {
    background: var(--color-danger);
    color: white;
  }

  .btn-danger:hover {
    filter: brightness(0.96);
  }

  .input {
    @apply w-full rounded-md border px-4 py-2.5 transition-colors transition-shadow duration-150 ease-out;
    background: var(--color-surface-raised);
    border-color: var(--color-border);
    color: var(--color-text-primary);
  }

  .input::placeholder {
    color: var(--color-text-tertiary);
  }

  .input:focus {
    outline: none;
    border-color: var(--coral);
    box-shadow: none;
  }

  .field-label {
    @apply mb-1.5 block text-sm font-medium;
    color: var(--color-text-secondary);
  }

  .field-help {
    @apply mt-1 text-sm;
    color: var(--color-text-tertiary);
  }

  .field-error {
    @apply mt-1 flex items-center gap-1 text-sm font-medium;
    color: var(--color-danger);
  }

  .field-success {
    @apply mt-1 flex items-center gap-1 text-sm font-medium;
    color: var(--color-success);
  }

  .badge {
    @apply inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold;
  }

  .badge-primary {
    background: rgba(10, 126, 164, 0.12);
    color: var(--coral);
  }

  .badge-success {
    background: rgba(45, 106, 79, 0.12);
    color: var(--color-success);
  }

  .badge-info {
    background: rgba(72, 202, 228, 0.15);
    color: var(--color-info);
  }

  .badge-warning {
    background: rgba(217, 119, 6, 0.12);
    color: var(--color-warning);
  }

  .badge-danger {
    background: rgba(215, 38, 61, 0.12);
    color: var(--color-danger);
  }

  .badge-muted {
    background: rgba(8, 32, 50, 0.08);
    color: var(--color-text-secondary);
  }

  .badge-lagon {
    background: var(--nc-lagon-light);
    color: var(--nc-lagon-text);
    border: 0.5px solid var(--nc-lagon-border);
  }

  .badge-emeraude {
    background: var(--nc-emeraude-light);
    color: var(--nc-emeraude-text);
    border: 0.5px solid var(--nc-emeraude-border);
  }

  .badge-corail {
    background: var(--nc-corail-light);
    color: var(--nc-corail-text);
    border: 0.5px solid var(--nc-corail-border);
  }

  .badge-sable {
    background: var(--nc-sable-light);
    color: var(--nc-sable-text);
    border: 0.5px solid var(--nc-sable-border);
  }

  .section-lagon,
  .section-emeraude,
  .section-corail,
  .section-sable {
    padding-left: 12px;
  }

  .section-lagon {
    border-left: 3px solid var(--nc-lagon);
  }

  .section-emeraude {
    border-left: 3px solid var(--nc-emeraude);
  }

  .section-corail {
    border-left: 3px solid var(--nc-corail);
  }

  .section-sable {
    border-left: 3px solid var(--nc-sable);
  }

  .skeleton {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    background: linear-gradient(
      90deg,
      rgba(8, 32, 50, 0.06) 0%,
      rgba(8, 32, 50, 0.11) 20%,
      rgba(8, 32, 50, 0.06) 40%,
      rgba(8, 32, 50, 0.06) 100%
    );
    background-size: 300% 100%;
    animation: shimmer 1.5s linear infinite;
  }

  .fade-in {
    animation: fadeIn 400ms ease-out both;
  }

  .slide-up {
    animation: slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .step-enter-forward {
    animation: stepEnterForward 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .step-enter-backward {
    animation: stepEnterBackward 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .pulse-once {
    animation: pulseOnce 520ms ease-out both;
  }

  [data-reveal='true'] {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 350ms ease-out, transform 350ms ease-out;
    will-change: opacity, transform;
  }

  [data-reveal='true'][data-reveal-visible='true'] {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@keyframes stepEnterForward {
  from {
    opacity: 0;
    transform: translateX(48px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes stepEnterBackward {
  from {
    opacity: 0;
    transform: translateX(-48px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulseOnce {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-4px);
  }
  40% {
    transform: translateX(4px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}

@keyframes wiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-6deg);
  }
  75% {
    transform: rotate(6deg);
  }
}

@keyframes pulseSoft {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.01);
    opacity: 0.96;
  }
}

@keyframes ncMapFloat {
  0%,
  100% {
    transform: translateY(-4px);
  }
  50% {
    transform: translateY(0);
  }
}

@keyframes ncMapPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.82;
  }
}

.nc-map-float {
  animation: ncMapFloat 4s ease-in-out infinite;
  transform-origin: center;
}

.nc-map-pulse {
  animation: ncMapPulse 2s ease-in-out infinite;
  transform-origin: center;
}

.nc-map-delay-1 {
  animation-delay: 0.4s;
}

.nc-map-delay-2 {
  animation-delay: 0.8s;
}

.nc-map-delay-3 {
  animation-delay: 1.2s;
}

.nc-map-delay-4 {
  animation-delay: 1.6s;
}

@media (prefers-reduced-motion: reduce) {
  .nc-map-float,
  .nc-map-pulse {
    animation: none !important;
  }
}

.brand-surface {
  background:
    radial-gradient(circle at 20% 20%, rgba(72, 202, 228, 0.22), transparent 35%),
    radial-gradient(circle at 80% 0%, rgba(10, 126, 164, 0.18), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(244, 248, 247, 0.92));
}

.dark .brand-surface {
  background:
    radial-gradient(circle at 20% 20%, rgba(72, 202, 228, 0.12), transparent 35%),
    radial-gradient(circle at 80% 0%, rgba(10, 126, 164, 0.12), transparent 32%),
    linear-gradient(180deg, rgba(8, 32, 50, 0.96), rgba(4, 18, 30, 0.96));
}

.brand-ring {
  box-shadow:
    0 0 0 1px rgba(10, 126, 164, 0.14),
    0 18px 60px rgba(8, 32, 50, 0.12);
}

.leaflet-container {
  font-family: var(--font-body), system-ui, sans-serif;
  border-radius: 1rem;
}

.leaflet-popup-content-wrapper {
  border-radius: 0.75rem !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.swiper-pagination-bullet-active {
  background: var(--coral) !important;
}

.swiper-button-next,
.swiper-button-prev {
  color: var(--coral) !important;
}

.legal-content h2 {
  @apply mt-10 mb-4 text-2xl font-bold;
  color: var(--color-text-primary);
}

.legal-content h3 {
  @apply mt-6 mb-3 text-xl font-semibold;
  color: var(--color-text-primary);
}

.legal-content table {
  @apply w-full border-collapse overflow-hidden rounded-2xl border text-sm;
  border-color: var(--color-border);
}

.legal-content thead tr {
  background: rgba(244, 248, 247, 0.8);
}

.dark .legal-content thead tr {
  background: rgba(255, 255, 255, 0.04);
}

.legal-content th {
  @apply px-4 py-3 text-left font-semibold;
  color: var(--color-text-primary);
}

.legal-content td {
  @apply border-t px-4 py-3 align-top;
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.legal-content ul,
.legal-content ol {
  @apply space-y-2 pl-5;
}

.legal-content a {
  color: var(--coral);
  text-decoration: underline;
  text-underline-offset: 2px;
}

````

## PATH: frontend/next.config.js
````
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
    return [
      {
        source: '/(.*)',
        headers: [
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

````

## PATH: frontend/tailwind.config.js
````
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette de marque existante
        coral: { DEFAULT: '#0A7EA4', light: '#1C9BC2', dark: '#075B77' },
        ocean: { DEFAULT: '#08324F', light: '#0D4C75', dark: '#051E30' },
        lagoon: { DEFAULT: '#48CAE4', light: '#72DDF7', dark: '#2AB8D4' },
        sand: { DEFAULT: '#F4F8F7', light: '#FBFCFC', dark: '#DCE8E5' },
        jungle: { DEFAULT: '#2D6A4F', light: '#40916C', dark: '#1B4332' },
        night: { DEFAULT: '#082032', light: '#113A54', dark: '#04121E' },
        slate: { DEFAULT: '#4A5568', light: '#718096', dark: '#2D3748' },
        nc: {
          lagon: '#1E90FF',
          lagonLight: '#1E90FF18',
          lagonBorder: '#1E90FF40',
          lagonText: '#0A4D8C',
          emeraude: '#2E8B57',
          emeraudeLight: '#2E8B5718',
          emeraudeBorder: '#2E8B5740',
          emeraudeText: '#1A5233',
          corail: '#FF6B6B',
          corailLight: '#FF6B6B18',
          corailBorder: '#FF6B6B40',
          corailText: '#8B0000',
          sable: '#F5A623',
          sableLight: '#F5A62318',
          sableBorder: '#F5A62340',
          sableText: '#7A4800',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        '3xl': '64px',
        '4xl': '96px',
        '5xl': '128px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(8, 32, 50, 0.04)',
        sm: '0 2px 8px rgba(8, 32, 50, 0.08), 0 0 1px rgba(8, 32, 50, 0.06)',
        md: '0 8px 24px rgba(8, 32, 50, 0.10), 0 0 1px rgba(8, 32, 50, 0.06)',
        lg: '0 16px 40px rgba(8, 32, 50, 0.12), 0 0 1px rgba(8, 32, 50, 0.06)',
        xl: '0 24px 64px rgba(8, 32, 50, 0.18)',
        card: '0 2px 8px rgba(8, 32, 50, 0.08), 0 0 1px rgba(8, 32, 50, 0.06)',
        hover: '0 10px 28px rgba(8, 32, 50, 0.12), 0 0 1px rgba(8, 32, 50, 0.06)',
        modal: '0 24px 64px rgba(8, 32, 50, 0.24)',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '56px' }],
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        shake: 'shake 0.45s ease-out',
        wiggle: 'wiggle 0.6s ease-in-out',
        shimmer: 'shimmer 1.5s linear infinite',
        pulse: 'pulseSoft 1.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-6deg)' },
          '75%': { transform: 'rotate(6deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.01)', opacity: '0.96' },
        },
      },
    },
  },
  plugins: [],
}

````

## PATH: frontend/package.json
````
{
  "name": "kalico-web",
  "version": "1.0.0-rc1",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "test": "echo 'No test suite configured' && exit 0",
    "start": "next start"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "@tanstack/react-query": "^5.100.13",
    "axios": "^1.6.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.0.6",
    "jsqr": "^1.4.0",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.344.0",
    "next": "^15.5.18",
    "papaparse": "^5.5.3",
    "pdfjs-dist": "^6.0.227",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-dropzone": "^14.2.3",
    "react-hook-form": "^7.49.0",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.15.1",
    "socket.io-client": "^4.8.1",
    "swiper": "^12.1.2",
    "xlsx": "^0.18.5",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.5.10",
    "tailwindcss": "^3.4.0",
    "typescript": "^5"
  },
  "overrides": {
    "ws": "8.21.0",
    "next": {
      "postcss": "8.5.14"
    }
  }
}

````

## PATH: frontend/src/components/home/HomeSections.tsx
````
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronRight, CheckCircle2, MapPin, Search, Sparkles, ShieldCheck } from 'lucide-react'

import PlatformStats from '@/components/PlatformStats'
import CategoryTreeSection from '@/components/home/CategoryTreeSection'
import ListingCard from '@/components/listings/ListingCard'
import { ListingSkeletonGrid } from '@/components/ListingSkeleton'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { CategoryNode } from '@/lib/categoryCatalog'
import { SEARCH_ALERTS, getCategoryIcon } from '@/lib/categoryPresentation'

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return '...'
  return new Intl.NumberFormat('fr-FR').format(value)
}
function getCategoryChildren(category: CategoryNode) {
  return category.children || category.subcategories || []
}

function getHomepageCategoryIcon(category: Pick<CategoryNode, 'slug' | 'name' | 'icon'>) {
  return getCategoryIcon(category.slug, category.name, category.icon)
}

type HomeHeroSectionProps = {
  q: string
  onQueryChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  listings: HomeListing[]
}

type HomeListing = {
  id: string | number
  title?: string | null
  price?: string | number | null
  price_xpf?: string | number | null
  price_display?: string | null
  commune_name?: string | null
  commune?: string | null
  image_url?: string | null
  cover_image?: string | null
  images?: Array<string | { url?: string | null; image_url?: string | null; src?: string | null }>
  category_slug?: string | null
  category_name?: string | null
  category?: string | null
}

const HERO_CATEGORY_PILLS = [
  { slug: 'vehicules', label: '🚗 Véhicules' },
  { slug: 'immobilier', label: '🏠 Immobilier' },
  { slug: 'services', label: '🛠 Services' },
  { slug: 'electronique-multimedia', label: '📱 High-tech' },
  { slug: 'maison-jardin', label: '🌿 Jardin' },
] as const

const HERO_FALLBACK_LISTINGS = [
  {
    id: 'fallback-vehicules',
    title: 'Toyota Hilux 4x4 double cabine',
    price_display: '2 450 000 F',
    commune_name: 'Nouméa',
    image_url: null,
    category_slug: 'vehicules',
    category_name: 'Véhicules',
  },
  {
    id: 'fallback-immobilier',
    title: 'Appartement T2 meublé',
    price_display: '85 000 F / mois',
    commune_name: 'Dumbéa',
    image_url: null,
    category_slug: 'immobilier',
    category_name: 'Immobilier',
  },
] satisfies HomeListing[]

const HERO_FEATURES = [
  {
    icon: CheckCircle2,
    title: 'Publication gratuite',
    subtitle: 'Pour les particuliers',
  },
  {
    icon: MapPin,
    title: 'Toute la NC couverte',
    subtitle: 'Communes, tribus, îles',
  },
  {
    icon: ShieldCheck,
    title: 'Pros vérifiés',
    subtitle: 'Artisans et services de confiance',
  },
] as const

function normalizeHeroPrice(listing: HomeListing) {
  const value = listing.price_display ?? listing.price_xpf ?? listing.price
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${new Intl.NumberFormat('fr-FR').format(value)} F`
  }
  return 'Prix sur demande'
}

function getHeroListingCommune(listing: HomeListing) {
  return String(listing.commune_name ?? listing.commune ?? '').trim() || 'Nouvelle-Calédonie'
}

function getHeroListingImage(listing: HomeListing) {
  const direct = String(listing.image_url ?? listing.cover_image ?? '').trim()
  if (direct) return direct
  const firstImage = listing.images?.[0]
  if (typeof firstImage === 'string' && firstImage.trim()) return firstImage.trim()
  if (firstImage && typeof firstImage === 'object') {
    const objectImage = String(firstImage.url ?? firstImage.image_url ?? firstImage.src ?? '').trim()
    if (objectImage) return objectImage
  }
  return null
}

function getHeroListingHref(listing: HomeListing) {
  return `/annonces/${listing.id}`
}

function HeroListingCard({ listing }: { listing: HomeListing }) {
  const image = getHeroListingImage(listing)
  const categoryLabel = listing.category_name || listing.category || 'Annonce'
  const categoryInitial = categoryLabel.trim().charAt(0).toUpperCase() || 'A'
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setErrored(false)
  }, [listing.id])

  return (
    <Link
      href={getHeroListingHref(listing)}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e7dbcd] bg-white shadow-[0_20px_60px_rgba(3,31,45,0.12)] transition duration-300 hover:-translate-y-1 hover:border-[#d4c4b0] hover:shadow-[0_24px_64px_rgba(3,31,45,0.14)] dark:border-white/10 dark:bg-white/8 dark:hover:border-white/20 dark:hover:bg-white/12"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f1e7da] dark:bg-[linear-gradient(160deg,_rgba(255,255,255,0.12),_rgba(255,255,255,0.03))]">
        {image && !errored ? (
          <>
            <div
              className={`absolute inset-0 flex items-center justify-center bg-[#1d9e75] text-5xl font-bold text-white transition-opacity duration-300 ${
                loaded ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {categoryInitial}
            </div>
            <Image
              src={image}
              alt={listing.title || 'Annonce Kalico'}
              fill
              sizes="(max-width: 768px) 50vw, 320px"
              className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoadingComplete={() => setLoaded(true)}
              onError={() => setErrored(true)}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-[#1d9e75] text-white">
            <span className="text-5xl font-bold leading-none">{categoryInitial}</span>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">{categoryLabel}</span>
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-[rgba(6,36,52,0.75)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
          {categoryLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4 text-[#17313d] dark:text-white">
        <div className="space-y-1">
          <p className="line-clamp-2 font-display text-xl font-bold leading-tight">{listing.title || 'Annonce locale'}</p>
          <p className="text-lg font-semibold text-[#1d9e75] dark:text-[#8ce3d2]">{normalizeHeroPrice(listing)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 text-sm text-[#39505b] dark:text-white/75">
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
            <MapPin className="h-4 w-4 shrink-0 text-[#1d9e75] dark:text-[#8ce3d2]" />
            {getHeroListingCommune(listing)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6d5d4b] dark:text-white/55">
            Voir
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function HeroFeature({ icon: Icon, title, subtitle }: (typeof HERO_FEATURES)[number]) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8832a]/15 text-[#8ce3d2]">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="block text-xs text-white/65">{subtitle}</span>
      </span>
    </div>
  )
}

export function HomeHeroSection({ q, onQueryChange, onSubmit, listings }: HomeHeroSectionProps) {
  const cards = [...listings.slice(0, 2), ...HERO_FALLBACK_LISTINGS].slice(0, 2)
  useScrollReveal()

  return (
    <section
      className="relative overflow-hidden px-4 pb-10 pt-6 text-[#17313d] dark:text-white dark:!bg-[#0c2a35]"
      style={{ background: '#fdf8f1' }}
    >
      <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,_rgba(23,49,61,0.22)_1px,_transparent_0)] [background-size:28px_28px] dark:[background-image:radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.75)_1px,_transparent_0)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-6 rounded-[2rem] border border-[#e7dbcd] bg-white/75 p-5 shadow-[0_30px_90px_rgba(3,31,45,0.08)] backdrop-blur-md md:grid-cols-[1.05fr_0.95fr] md:p-8 dark:border-white/10 dark:bg-[rgba(7,28,41,0.16)]">
          <div className="flex min-w-0 flex-col justify-center">
            <span className="inline-flex w-fit items-center rounded-full border border-[#d8c8b5] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1d6d89] dark:border-white/15 dark:bg-white/10 dark:text-white/75">
              100 % Nouvelle-Calédonie
            </span>

            <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight text-[#17313d] md:text-6xl dark:text-white">
              Ce qui se vend en NC, c&apos;est ici.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#39505b] md:text-lg dark:text-white/80">
              Annonces, services et pros locaux partout en Nouvelle-Calédonie. De Nouméa aux Loyauté, de Koné à l&apos;Île des Pins.
            </p>

            <form onSubmit={onSubmit} className="mt-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#71838d] dark:text-white/45" />
                <input
                  value={q}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Toyota, studio Nouméa, plombier, iPhone..."
                  aria-label="Rechercher une annonce"
                  className="w-full rounded-2xl border border-[#d8c8b5] bg-white px-4 py-3 pl-11 text-sm text-[#17313d] placeholder:text-[#6d5d4b]/55 outline-none ring-0 backdrop-blur-sm transition focus:border-[#1d9e75]/40 focus:bg-white focus:ring-4 focus:ring-[#1d9e75]/10 dark:border-white/12 dark:bg-white/10 dark:text-white dark:placeholder:text-white/55 dark:focus:border-white/30 dark:focus:bg-white/12 dark:focus:ring-white/10"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-[#17313d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15 dark:bg-white dark:text-[#0a6e8d]"
              >
                Rechercher
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {HERO_CATEGORY_PILLS.map((pill) => (
                <Link
                  key={pill.slug}
                  href={`/annonces?categorie=${encodeURIComponent(pill.slug)}`}
                  className="inline-flex items-center rounded-full border border-[#d8c8b5] bg-white px-3.5 py-2 text-sm font-medium text-[#17313d] transition hover:-translate-y-0.5 hover:border-[#1d9e75]/30 hover:bg-[#f8f2ea] dark:border-white/12 dark:bg-white/8 dark:text-white/90 dark:hover:border-white/20 dark:hover:bg-white/12"
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {cards.map((listing) => (
              <HeroListingCard key={String(listing.id)} listing={listing} />
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-white/12 pt-5 md:grid-cols-3 md:gap-0">
          {HERO_FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`md:px-5 ${index > 0 ? 'md:border-l md:border-white/12' : ''}`}
            >
              <HeroFeature {...feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AnimatedStat({ value, label, loading }: { value: number | null; label: string; loading: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [displayValue, setDisplayValue] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || loading || value == null) return
    let raf = 0
    const start = performance.now()
    const duration = 1500

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.round(value * eased))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [loading, value, visible])

  const formatted = loading ? '...' : new Intl.NumberFormat('fr-FR').format(displayValue)

  return (
    <div ref={ref} className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center shadow-sm">
      <p className="text-4xl font-bold text-coral md:text-[2.5rem]">{formatted}</p>
      <p className="mt-2 text-sm font-medium text-night/65">{label}</p>
    </div>
  )
}

export function HomeStatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
      <PlatformStats variant="light" />
    </section>
  )
}

export function FeaturedListingsSection({
  listings,
  loading,
}: {
  listings: any[]
  loading: boolean
}) {
  if (!loading && listings.length === 0) return null

  return (
    <section id="featured-listings" className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="section-lagon">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Annonces en vedette</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Les annonces les plus visibles en ce moment</h2>
        </div>
        <Link href="/annonces" className="hidden items-center gap-1 text-sm font-semibold text-nc-lagon hover:underline md:inline-flex">
          Tout voir <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-[2rem] border border-[var(--color-border)] border-l-4 border-l-nc-lagon bg-[var(--color-surface)] p-4 shadow-sm md:p-5">
        {loading ? (
          <ListingSkeletonGrid count={8} className="grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" />
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] py-14 text-center text-night/45">
            <p className="text-sm font-semibold text-night">Les meilleures annonces apparaîtront ici</p>
            <p className="mt-2 text-sm text-night/65">
              Boostez votre annonce pour apparaître en tête de page.
            </p>
            <Link href="/annonces/nouvelle" className="btn-primary mt-4 inline-block">
              Déposer une annonce
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export function SearchAlertsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
      <div className="grid gap-5 overflow-hidden rounded-[2rem] border border-[var(--color-border)] border-b-4 border-b-nc-corail bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-lagon">
            <Sparkles className="h-3.5 w-3.5" />
            Coups de cœur
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Gardez vos recherches en mémoire et recevez une alerte quand une offre correspond.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Les utilisateurs peuvent enregistrer des mots-clés pour suivre ce qui compte vraiment: un modèle précis, une commune, une gamme de prix ou une catégorie.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 pb-1 sm:flex-nowrap sm:overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SEARCH_ALERTS.map((term) => (
              <span
                key={term}
                className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm font-medium text-white/85"
              >
                {term}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/8 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Exemple d&apos;alerte</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold">"Toyota Hilux"</p>
              <p className="mt-1 text-sm text-white/65">Nouméa, prix max 3 500 000 XPF</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold">"Studio"</p>
              <p className="mt-1 text-sm text-white/65">Dumbéa / Nouméa, location ou vente</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold">"iPhone"</p>
              <p className="mt-1 text-sm text-white/65">État bon ou comme neuf, en Nouvelle-Calédonie</p>
            </div>
          </div>
          <Link href="/alertes" className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2">
            Gérer mes alertes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CategoryTreeRow({
  category,
  depth,
  onBrowse,
}: {
  category: CategoryNode
  depth: number
  onBrowse: (slug: string) => void
}) {
  const Visual = getHomepageCategoryIcon(category)
  const children = getCategoryChildren(category)

  return (
    <div className={depth === 0 ? 'space-y-3' : 'space-y-3 border-l border-[var(--color-border)] pl-3'}>
      <button
        type="button"
        onClick={() => onBrowse(category.slug)}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
          depth === 0
            ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
            : 'border-[var(--color-border)] bg-[var(--color-background-secondary)]/80'
        }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
          <Visual className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[var(--color-text-primary)]">{category.name}</span>
          <span className="block text-xs text-[var(--color-text-secondary)]">
            {depth === 0 ? 'Famille ouverte' : 'Sous-catégorie ouverte'}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-nc-lagon" />
      </button>

      {children.length > 0 ? (
        <div className={depth === 0 ? 'grid gap-2 md:grid-cols-2' : 'space-y-2'}>
          {children.map((child) => {
            const grandChildren = getCategoryChildren(child)
            const ChildVisual = getHomepageCategoryIcon(child)

            return (
              <div
                key={child.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onBrowse(child.slug)}
                  className="flex w-full items-center gap-3 text-left transition hover:-translate-y-0.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
                    <ChildVisual className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--color-text-primary)]">{child.name}</span>
                    <span className="block text-xs text-[var(--color-text-secondary)]">
                      {grandChildren.length > 0 ? `${grandChildren.length} sous-catégorie${grandChildren.length > 1 ? 's' : ''}` : 'Dernier niveau'}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-nc-lagon" />
                </button>

                {grandChildren.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {grandChildren.map((grandChild) => {
                      const GrandVisual = getHomepageCategoryIcon(grandChild)
                      return (
                        <button
                          key={grandChild.id}
                          type="button"
                          onClick={() => onBrowse(grandChild.slug)}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-nc-lagon/30 hover:bg-nc-lagonLight hover:text-nc-lagonText"
                        >
                          <GrandVisual className="h-3.5 w-3.5" />
                          <span>{grandChild.name}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function CategoryCard({
  category,
  onBrowse,
}: {
  category: CategoryNode
  onBrowse: (slug: string) => void
}) {
  const Visual = getHomepageCategoryIcon(category)

  return (
    <div className="group overflow-hidden rounded-[1.75rem] border border-night/8 border-l-4 border-l-nc-lagon bg-white/95 p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-hover">
      <div className="mb-4 flex flex-col items-start gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nc-lagonLight text-[#0A7EA4]">
          <Visual className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Catégorie</p>
          <h3 className="mt-1 text-lg font-semibold text-night">{category.name}</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(category.subcategories || []).map((sub) => {
          const SubVisual = getHomepageCategoryIcon(sub)
          return (
            <Link
              key={sub.id}
              href={`/annonces?category=${encodeURIComponent(sub.slug)}`}
              className="rounded-full border border-night/10 bg-sand px-3 py-1.5 text-xs font-medium text-night/70 transition-colors hover:border-nc-lagon/30 hover:bg-nc-lagonLight hover:text-nc-lagonText"
            >
              <SubVisual className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />
              {sub.name}
            </Link>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => onBrowse(category.slug)}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-nc-lagon transition-transform group-hover:translate-x-0.5"
      >
        Voir tous les rayons
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function PopularCategoriesSection({
  categories,
  onBrowse,
}: {
  categories: CategoryNode[]
  onBrowse: (slug: string) => void
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10" data-reveal="true">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="section-lagon">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-lagon">Rayons populaires</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-night">Les catégories que les gens cherchent vraiment</h2>
        </div>
        <Link href="/annonces" className="hidden items-center gap-1 text-sm font-semibold text-nc-lagon hover:underline md:inline-flex">
          Voir toutes les annonces <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 rounded-[2rem] border border-night/8 border-l-4 border-l-nc-lagon bg-white/90 p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        {categories.slice(0, 8).map((cat) => (
          <CategoryCard key={cat.id} category={cat} onBrowse={onBrowse} />
        ))}
      </div>
    </section>
  )
}

export function ExpandedCategoriesSection({
  categories,
  onBrowse,
}: {
  categories: CategoryNode[]
  onBrowse: (slug: string) => void
}) {
  return <CategoryTreeSection />
}

function buildCategorySearchHref(categorySlug: string, subcategorySlug?: string) {
  const params = new URLSearchParams()
  params.set('categorie', categorySlug)
  if (subcategorySlug) params.set('sous_categorie', subcategorySlug)
  return `/annonces?${params.toString()}`
}

function ExpandedCategorySubtree({
  rootSlug,
  categories,
  depth = 0,
}: {
  rootSlug: string
  categories: CategoryNode[]
  depth?: number
}) {
  if (!categories.length) return null

  return (
    <div className={depth === 0 ? 'mt-3 grid gap-x-3 gap-y-1 sm:grid-cols-2' : 'mt-2 space-y-1 border-l border-[var(--color-border)] pl-3'}>
      {categories.map((category) => {
        const children = getCategoryChildren(category)
        return (
          <div key={category.id} className="space-y-1">
            <Link
              href={buildCategorySearchHref(rootSlug, category.slug)}
              className={`block transition-colors hover:text-[#0A7EA4] ${
                depth === 0 ? 'text-sm font-medium text-night/70' : 'text-xs text-night/55'
              }`}
            >
              {category.name}
            </Link>
            {children.length > 0 ? (
              <ExpandedCategorySubtree rootSlug={rootSlug} categories={children} depth={depth + 1} />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function ExpandedCategoriesGridSection({
  categories,
}: {
  categories: CategoryNode[]
}) {
  return <CategoryTreeSection />
}

type BonPlanItem = {
  id: number | string
  title: string
  description: string
  kind?: string
  target_audience?: string
  price_xpf?: number
  price_display?: string
  is_free_included?: boolean
  normal_price_xpf?: number | null
  promo_price_xpf?: number | null
  discount_pct?: number | null
  contact_name?: string | null
  location_name?: string | null
  commune_name?: string | null
  event_date?: string | null
  expires_at?: string | null
  author_prenom?: string | null
  author_nom?: string | null
  author_is_pro?: boolean | null
}

type CampaignItem = {
  id: number | string
  title: string
  description?: string | null
  image_url?: string | null
  link_url?: string | null
  cta_text?: string | null
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Date libre'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date libre'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
}

function BonPlanCard({ item }: { item: BonPlanItem }) {
  const audienceLabel = item.target_audience === 'pro' ? 'Professionnel' : 'Particulier'
  const kindLabel = {
    promo: 'Promo',
    event: 'Evenement',
    concert: 'Concert',
    other: 'Bon plan',
  }[item.kind || 'other']

  return (
    <article className="rounded-[1.5rem] border border-white/10 border-l-4 border-l-nc-corail bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge-emeraude rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          {kindLabel}
        </span>
        {item.is_free_included ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Offre Pro
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-lg font-semibold text-night">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-night/60">{item.description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-night/65">
        <span className="rounded-full bg-sand px-2.5 py-1">{audienceLabel}</span>
        <span className="rounded-full bg-sand px-2.5 py-1">{item.price_display || `${item.price_xpf ?? 0} XPF`}</span>
        {item.normal_price_xpf && item.promo_price_xpf ? (
          <span className="rounded-full bg-sand px-2.5 py-1">
            {item.normal_price_xpf.toLocaleString('fr-FR')} {'->'} {item.promo_price_xpf.toLocaleString('fr-FR')} XPF
          </span>
        ) : null}
        {item.discount_pct ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">-{item.discount_pct}%</span>
        ) : null}
      <span className="rounded-full bg-sand px-2.5 py-1">{item.commune_name || item.location_name || 'Nouvelle-Calédonie'}</span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-night/55">
        <p>{formatDateLabel(item.event_date)}</p>
        <p>{item.author_prenom ? `Publié par ${item.author_prenom}` : 'Publication locale'}</p>
        {item.contact_name ? <p>Contact: {item.contact_name}</p> : null}
      </div>
    </article>
  )
}

function CovoiturageCard({
  item,
}: {
  item: {
    id: number | string
    departure: string
    destination: string
    ride_date: string
    ride_time: string
    price_xpf: number
    vehicle?: string | null
    seats_remaining?: number
    music_allowed?: boolean
    no_smoking?: boolean
    driver_prenom?: string | null
    driver_nom?: string | null
    trust_score?: number | null
  }
}) {
  const seatsRemaining = item.seats_remaining ?? 0
  const dateLabel = formatDateLabel(item.ride_date)
  const timeLabel = item.ride_time?.slice(0, 5) || 'Heure libre'

  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge-corail rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          Covoiturage
        </span>
        {seatsRemaining <= 1 ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            Dernière place
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-lg font-semibold text-night">
        {item.departure} - {item.destination}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-night/60">
        {dateLabel} à {timeLabel} · {item.vehicle || 'Véhicule détaillé'} · {item.price_xpf.toLocaleString('fr-FR')} XPF / place
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-night/65">
        <span className="rounded-full bg-sand px-2.5 py-1">{seatsRemaining} place(s) restante(s)</span>
        <span className="rounded-full bg-sand px-2.5 py-1">{item.music_allowed ? 'Musique ok' : 'Musique calme'}</span>
        <span className="rounded-full bg-sand px-2.5 py-1">{item.no_smoking ? 'Non fumeur' : 'Fumeur accepte'}</span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-night/55">
        <p>{item.driver_prenom ? `Conducteur: ${item.driver_prenom}` : 'Conducteur local'}</p>
        <p>{item.trust_score != null ? `Fiabilité: ${item.trust_score}/100` : 'Trajet vérifié'}</p>
      </div>
    </article>
  )
}

function SponsoredCampaignCard({ item }: { item: CampaignItem }) {
  const href = item.link_url || '/annonces'

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 border-l-4 border-l-nc-sable bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-nc-lagon/20 to-nc-emeraude/20">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 90vw, 33vw"
          />
        ) : null}
        <div className="absolute left-3 top-3">
          <span className="badge badge-sable rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-sm">
            Sponsorisé
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold text-night">{item.title}</h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-night/65">
          {item.description || 'Une visibilité locale payante, affichée au bon moment sur Kalico.'}
        </p>
        <a
          href={href}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-nc-sable px-4 py-3 text-sm font-semibold text-white transition hover:bg-nc-sable/90"
        >
          {item.cta_text || 'Découvrir'}
        </a>
      </div>
    </article>
  )
}

export function BonPlanSection({
  sponsoredItems,
  promoItems,
  eventItems,
  covoiturageItems,
  loading,
}: {
  sponsoredItems?: CampaignItem[]
  promoItems?: BonPlanItem[]
  eventItems?: BonPlanItem[]
  covoiturageItems?: Array<{
    id: number | string
    departure: string
    destination: string
    ride_date: string
    ride_time: string
    price_xpf: number
    vehicle?: string | null
    seats_remaining?: number
    music_allowed?: boolean
    no_smoking?: boolean
    driver_prenom?: string | null
    driver_nom?: string | null
    trust_score?: number | null
  }>
  loading?: boolean
}) {
  const sponsoredHasItems = (sponsoredItems || []).length > 0
  const promoHasItems = (promoItems || []).length > 0
  const eventHasItems = (eventItems || []).length > 0
  const rideHasItems = (covoiturageItems || []).length > 0

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
      <div className="grid gap-5 overflow-hidden rounded-[2rem] border border-night/8 bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.12))] p-5 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
        {sponsoredHasItems ? (
          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-sable">Sponsorisé</p>
                <h3 className="mt-1 text-2xl font-bold text-white">Les bons plans mis en avant</h3>
              </div>
              <Link href="/pro/dashboard/publicite" className="text-sm font-semibold text-nc-sable hover:underline">
                Gérer les campagnes
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {sponsoredItems!.map((item) => (
                <SponsoredCampaignCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="section-lagon">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">Bons plans & événements</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-white md:text-3xl">
              Promotions, culture et mobilité locale
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              Une seule vue claire pour les offres du moment, l'agenda culturel et les trajets à partager.
            </p>
          </div>
          <Link href="/bons-plans" className="hidden items-center gap-1 text-sm font-semibold text-white hover:underline md:inline-flex">
            Voir tout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Promotions</p>
                <h4 className="mt-1 text-2xl font-bold text-white">Les offres qui marchent maintenant</h4>
              </div>
              <Link href="/annonces/nouvelle" className="text-sm font-semibold text-nc-emeraude hover:underline">
                Ajouter la vôtre
              </Link>
            </div>
            {loading ? (
              <div className="grid gap-3 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/8" />
                ))}
              </div>
            ) : promoHasItems ? (
              <div className="grid gap-3 md:grid-cols-3">
                {promoItems!.map((item) => (
                  <BonPlanCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-5 py-8 text-center text-white/80">
                <div className="mx-auto flex max-w-md flex-col items-center">
                  <span className="mb-3 text-2xl animate-pulse motion-reduce:animate-none" aria-hidden="true">
                    🎁
                  </span>
                  <p className="font-display text-lg font-medium text-night dark:text-white">
                    La première promo NC, c&apos;est la vôtre.
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    Touchez vos clients là où ils cherchent.
                  </p>
                  <Link href="/bons-plans/nouvelle" className="btn-primary mt-4 inline-flex items-center justify-center">
                    Publier une offre
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-sable">Culture</p>
                <h4 className="mt-1 text-2xl font-bold text-white">Les rendez-vous à venir</h4>
              </div>
              <Link href="/bons-plans/publier" className="text-sm font-semibold text-nc-sable hover:underline">
                Créer un événement
              </Link>
            </div>
            {loading ? (
              <div className="grid gap-3 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-44 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/8" />
                ))}
              </div>
            ) : eventHasItems ? (
              <div className="grid gap-3 md:grid-cols-3">
                {eventItems!.map((item) => (
                  <BonPlanCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 px-5 py-8 text-center text-white/80">
                <div className="mx-auto flex max-w-md flex-col items-center">
                  <span className="mb-3 text-2xl animate-pulse motion-reduce:animate-none" aria-hidden="true">
                    🎭
                  </span>
                  <p className="font-display text-lg font-medium text-night dark:text-white">
                    Le prochain événement NC mérite d&apos;être ici.
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    Concerts, marchés, conférences - tout y est.
                  </p>
                  <Link href="/evenements/nouveau" className="btn-primary mt-4 inline-flex items-center justify-center">
                    Créer un événement
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 border-b-4 border-b-nc-corail bg-white/5 p-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-corail">Mobilité</p>
              <h4 className="mt-1 text-2xl font-bold text-white">Covoiturage local et interurbain</h4>
            </div>
            <Link href="/covoiturage" className="text-sm font-semibold text-nc-corail hover:underline">
              Voir les trajets
            </Link>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-white/70 md:text-base">
            Trouvez un trajet, proposez une place ou consultez les profils de confiance. Les trajets sont
            pensés pour la recherche rapide, les réservations simples et la sécurité des échanges.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/covoiturage" className="btn-primary rounded-2xl px-4 py-2.5">
              Explorer le covoiturage
            </Link>
            <Link href="/covoiturage?mode=publish" className="btn-secondary rounded-2xl px-4 py-2.5">
              Proposer un trajet
            </Link>
          </div>
          {loading ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/8" />
              ))}
            </div>
          ) : rideHasItems ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {covoiturageItems!.map((item) => (
                <CovoiturageCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/8 px-5 py-8 text-center text-white/80">
              <div className="mx-auto flex max-w-md flex-col items-center">
                <span className="mb-3 text-2xl animate-pulse motion-reduce:animate-none" aria-hidden="true">
                  🚗
                </span>
                <p className="font-display text-lg font-medium text-night dark:text-white">
                  Le premier trajet, c&apos;est souvent le plus utile.
                </p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Proposez un trajet, trouvez des passagers.
                </p>
                <Link href="/covoiturage/nouveau" className="btn-primary mt-4 inline-flex items-center justify-center">
                  Proposer un trajet
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

````

## PATH: frontend/src/components/home/HomePage.tsx
````
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck } from 'lucide-react'

import Header from '@/components/layout/Header'
import OnboardingToast from '@/components/onboarding/OnboardingToast'
import { HomeSpotlightSection } from '@/components/home/HomeSpotlightSection'
import {
  BonPlanSection,
  FeaturedListingsSection,
  HomeHeroSection,
  SearchAlertsSection,
  HomeStatsSection,
} from '@/components/home/HomeSections'
import CategoryGridSection from '@/components/home/CategoryGridSection'
import ProCarousel from '@/components/pro/ProCarousel'
import TrocListingsPreview from '@/components/home/TrocListingsPreview'
import { API_ORIGIN, campaignsApi, proApi } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'
import { useAuthStore } from '@/store/authStore'

function cleanText(value: unknown, fallback = '') {
  const text = String(value ?? '')
    .replace(/\bundefined\b/gi, '')
    .replace(/\bnull\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+—\s*$/, '')
    .trim()
  return text.length > 0 ? text : fallback
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        if (typeof entry === 'string') {
          return [key, cleanText(entry, '')]
        }
        return [key, sanitizeValue(entry)]
      })
    )
  }
  return value
}

export default function HomePage() {
  const router = useRouter()
  const { user, hasHydrated } = useAuthStore()
  const [q, setQ] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [promoBonPlans, setPromoBonPlans] = useState<any[]>([])
  const [eventBonPlans, setEventBonPlans] = useState<any[]>([])
  const [covoiturages, setCovoiturages] = useState<any[]>([])
  const [sponsoredBonPlans, setSponsoredBonPlans] = useState<any[]>([])
  const [bonPlansLoading, setBonPlansLoading] = useState(true)
  const [proSummary, setProSummary] = useState<{
    listings?: { active?: number; total?: number }
    stats?: { views_7d?: number }
  } | null>(null)

  const featuredListings = useMemo(() => listings.slice(0, 8), [listings])
  const premiumListings = useMemo(
    () =>
      listings
        .filter((listing) => listing.is_featured || Boolean(listing.boosted_until && new Date(listing.boosted_until) > new Date()))
        .slice(0, 4),
    [listings]
  )

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('kalico_search_history')
      const parsed = raw ? JSON.parse(raw) : []
      setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 5).filter((value) => typeof value === 'string' && value.trim()) : [])
    } catch {
      setRecentSearches([])
    }
  }, [])

  useEffect(() => {
    let alive = true

    const fetchBonPlans = async () => {
      try {
        const baseUrl = API_ORIGIN
        const [promoRes, eventRes, rideRes, campaignRes] = await Promise.all([
          fetch(`${baseUrl}/api/bon-plans?limit=3&kind=promo`, { credentials: 'include' }).then((res) => res.json()),
          fetch(`${baseUrl}/api/bon-plans?limit=3&kind=event,concert`, { credentials: 'include' }).then((res) => res.json()),
          fetch(`${baseUrl}/api/covoiturage?limit=3`, { credentials: 'include' }).then((res) => res.json()),
          campaignsApi.getHome(),
        ])
        if (!alive) return
        setPromoBonPlans(Array.isArray(promoRes?.data) ? promoRes.data.map((item: any) => sanitizeValue(item)) : [])
        setEventBonPlans(Array.isArray(eventRes?.data) ? eventRes.data.map((item: any) => sanitizeValue(item)) : [])
        setCovoiturages(Array.isArray(rideRes?.data) ? rideRes.data.map((item: any) => sanitizeValue(item)) : [])
        setSponsoredBonPlans(Array.isArray(campaignRes.data?.data?.bon_plans) ? campaignRes.data.data.bon_plans.map((item: any) => sanitizeValue(item)) : [])
      } catch {
        if (!alive) return
        setPromoBonPlans([])
        setEventBonPlans([])
        setCovoiturages([])
        setSponsoredBonPlans([])
      } finally {
        if (alive) setBonPlansLoading(false)
      }
    }

    void fetchBonPlans()
    return () => {
      alive = false
    }
  }, [])


  useEffect(() => {
    let alive = true

    const loadProSummary = async () => {
      if (!hasHydrated || !user?.is_pro) {
        if (alive) setProSummary(null)
        return
      }

      try {
        const response = await proApi.getDashboard()
        if (!alive) return
        setProSummary(response.data?.data ?? null)
      } catch {
        if (!alive) return
        setProSummary(null)
      }
    }

    void loadProSummary()
    return () => {
      alive = false
    }
  }, [hasHydrated, user?.is_pro])

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const baseUrl = API_ORIGIN
        const response = await fetch(`${baseUrl}/api/listings?limit=8&sort=date`, { credentials: 'include' })
        const json = await response.json()
        if (!alive) return
        setListings(Array.isArray(json?.data) ? json.data.map((item: any) => sanitizeValue(item)) : [])
      } catch {
        if (!alive) return
        setListings([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void run()
    return () => {
      alive = false
    }
  }, [])

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = q.trim()
    if (term) {
      void trackEvent('listing_search', {
        query: term,
        source: 'home_hero_submit',
      })
      router.push(`/annonces?q=${encodeURIComponent(term)}`)
    }
    else router.push('/annonces')
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <Header />
      <OnboardingToast />

      <HomeHeroSection q={q} onQueryChange={setQ} onSubmit={handleSearch} listings={featuredListings} />

      {recentSearches.length > 0 ? (
      <section className="mx-auto max-w-7xl px-4 pt-4" data-reveal="true">
          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-night/40">
                Recherches récentes
              </p>
              <span className="text-xs text-night/40">
                5 dernières recherches
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              {recentSearches.map((term) => (
                <Link
                  key={term}
                  href={`/annonces?q=${encodeURIComponent(term)}`}
                  className="whitespace-nowrap rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-night transition hover:-translate-y-0.5 hover:border-nc-lagon/30 hover:text-nc-lagon"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {hasHydrated && user?.is_pro && proSummary ? (
      <section className="mx-auto max-w-7xl px-4 pt-4" data-reveal="true">
          <Link
            href="/pro/dashboard"
            className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-nc-lagon/20 bg-nc-lagonLight px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              <BadgeCheck className="h-4 w-4 shrink-0 text-nc-lagon" />
              <span className="text-sm font-semibold text-nc-lagon">Espace Pro</span>
              <span className="truncate text-sm text-night/60">
                · {Number(proSummary.listings?.active ?? 0).toLocaleString('fr-FR')} annonces actives ·{' '}
                {Number(proSummary.stats?.views_7d ?? 0).toLocaleString('fr-FR')} vues cette semaine
              </span>
            </div>
            <span className="text-sm font-semibold text-nc-lagon hover:underline">Tableau de bord →</span>
          </Link>
        </section>
      ) : null}

      <HomeStatsSection />

      <section className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Pros locaux</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">Nos professionnels recommandés</h2>
            <p className="mt-1 text-sm text-night/55">Des pros calédoniens vérifiés, à portée de message.</p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/pros" className="inline-flex items-center gap-1 text-sm font-semibold text-nc-emeraude hover:underline">
              Voir l'annuaire <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pro" className="inline-flex items-center gap-1 text-sm font-semibold text-night/60 hover:text-night">
              Devenir Pro <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <ProCarousel />
      </section>

      <HomeSpotlightSection
        latestListings={featuredListings}
        premiumListings={premiumListings}
        promoItems={promoBonPlans}
        eventItems={eventBonPlans}
        rideItems={covoiturages}
        loading={loading || bonPlansLoading}
      />

      <BonPlanSection
        sponsoredItems={sponsoredBonPlans}
        promoItems={promoBonPlans}
        eventItems={eventBonPlans}
        covoiturageItems={covoiturages}
        loading={bonPlansLoading}
      />

      <FeaturedListingsSection loading={loading} listings={featuredListings} />

      <SearchAlertsSection />

      <section className="mx-auto max-w-7xl px-4 pb-10" data-reveal="true">
        <div className="rounded-[2rem] border border-nc-emeraude/15 border-l-4 border-l-nc-emeraude bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <span className="badge badge-emeraude inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-sm">
              PRO
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">
                Appels d'offres
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">
                Vous cherchez un professionnel ?
              </h2>
              <p className="mt-1 text-sm text-night/55">
                Publiez votre besoin en 2 minutes - les pros de votre commune vous répondent.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/appels-offres?action=publish" className="btn-primary rounded-2xl px-4 py-2.5 text-sm">
              Publier un besoin
            </Link>
            <Link href="/appels-offres" className="btn-secondary rounded-2xl px-4 py-2.5 text-sm">
              Voir les demandes
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral/80">
              Annonces troc
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-night">
              Annonces disponibles au troc
            </h2>
            <p className="mt-1 text-sm text-night/55">
              Ces calédoniens acceptent les échanges - trouvez votre bonheur.
            </p>
          </div>
          <Link href="/troc" className="hidden items-center gap-1 text-sm font-semibold text-coral hover:underline md:inline-flex">
            Voir toutes les annonces troc
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <TrocListingsPreview />
      </section>

      <div data-reveal="true">
        <CategoryGridSection />
      </div>
    </main>
  )
}

````

## PATH: frontend/src/components/layout/Header.tsx
````
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import { Search, MessageCircle, Plus, User, Menu, X, ChevronDown, LogOut, Heart, Home, Settings2, PlusCircle, Tag, Trophy, Car, PhoneCall, ArrowLeftRight, CalendarDays, ClipboardList } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthActionStore } from '@/store/authActionStore'
import { proApi } from '@/lib/api'
import NotificationBell from '@/components/ui/NotificationBell'
import DemoModeSwitcher from '@/components/ui/DemoModeSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type NavLinkItem = {
  label: string
  href: string
}

type NavGroupItem = {
  label: string
  children: NavLinkItem[]
}

const GLOBAL_NAV_LINKS: NavLinkItem[] = [
  { href: '/', label: 'Accueil' },
  { href: '/bons-plans', label: 'Bons Plans' },
  { href: '/covoiturage', label: 'Covoiturage' },
  { href: '/pro', label: 'Devenir Pro' },
]

const GLOBAL_NAV_GROUPS: NavGroupItem[] = [
  {
    label: 'Acheter/Vendre',
    children: [
      { href: '/annonces', label: 'Annonces' },
      { href: '/troc', label: 'Troc' },
    ],
  },
  {
    label: 'Services',
    children: [
      { href: '/appels-offres', label: 'Faire un devis' },
      { href: '/pros', label: 'Professionnels' },
      { href: '/envoi-livraison', label: 'Envoi & Livraison' },
    ],
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [moreOpen, setMoreOpen] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartY = useRef<number | null>(null)

  if (pathname.startsWith('/pro/dashboard')) return null

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const items = [
    { href: '/', icon: Home, label: 'Accueil' },
    { href: '/annonces', icon: Search, label: 'Annonces' },
    { href: '/covoiturage', icon: Car, label: 'Covoit' },
    { href: '/annonces/nouvelle', icon: PlusCircle, label: 'Déposer', isCta: true },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: '#more', icon: Menu, label: 'Plus', isDrawer: true },
  ]

  const drawerItems = [
    { href: '/troc', icon: ArrowLeftRight, label: 'Troc' },
    { href: '/pros', icon: Trophy, label: 'Pros' },
    { href: '/appels-offres', icon: ClipboardList, label: "Appels d'offres" },
    { href: '/covoiturage', icon: Car, label: 'Covoit' },
    { href: '/favoris', icon: Heart, label: 'Favoris' },
    { href: '/bons-plans', icon: Tag, label: 'Bons plans' },
    { href: '/contact', icon: PhoneCall, label: 'Contact' },
    { href: isAuthenticated && user?.id ? `/profil/${user.id}` : '/connexion', icon: User, label: isAuthenticated && user?.id ? 'Mon profil' : 'Connexion' },
  ]

  const closeDrawer = () => {
    setMoreOpen(false)
    setDragOffset(0)
    dragStartY.current = null
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    dragStartY.current = event.touches[0]?.clientY ?? null
  }

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (dragStartY.current == null) return
    const currentY = event.touches[0]?.clientY ?? dragStartY.current
    const offset = Math.max(0, currentY - dragStartY.current)
    setDragOffset(offset)
  }

  const handleTouchEnd = () => {
    if (dragOffset > 80) {
      closeDrawer()
      return
    }
    setDragOffset(0)
    dragStartY.current = null
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around px-1 pt-2 pb-[max(env(safe-area-inset-bottom),8px)]">
        {items.map(({ href, icon: Icon, label, isCta, isDrawer }) =>
          isCta ? (
            isAuthenticated ? (
              <Link key={href} href={href} className="mt-[-1rem] flex flex-col items-center gap-0.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral shadow-lg shadow-coral/30 ring-4 ring-white">
                  <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-semibold text-coral">{label}</span>
              </Link>
            ) : (
              <button
                key={href}
                type="button"
                onClick={() =>
                  openAuthModal({
                    type: 'publish_listing',
                    redirectTo: '/annonces/nouvelle',
                  })
                }
                className="mt-[-1rem] flex flex-col items-center gap-0.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral shadow-lg shadow-coral/30 ring-4 ring-white">
                  <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-semibold text-coral">{label}</span>
              </button>
            )
          ) : isDrawer ? (
            <button
              key={href}
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 transition-colors ${
                moreOpen ? 'bg-sand/70 text-night' : 'text-night/70 hover:bg-sand/60 hover:text-night'
              }`}
            >
              <Icon className="h-4 w-4 text-current" strokeWidth={moreOpen ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${moreOpen ? 'font-semibold text-night' : ''}`}>{label}</span>
            </button>
          ) : (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 transition-colors ${
                isActive(href) ? 'bg-sand/70 text-night' : 'text-night/70 hover:bg-sand/60 hover:text-night'
              }`}
            >
              <Icon className="h-4 w-4 text-current" strokeWidth={isActive(href) ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive(href) ? 'font-semibold text-night' : ''}`}>
                {label}
              </span>
            </Link>
          )
        )}
      </div>

      {moreOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={closeDrawer} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto rounded-t-3xl bg-[var(--color-surface)] p-5 shadow-[0_-18px_60px_rgba(8,32,50,0.18)] overscroll-contain"
            style={{
              transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : 'translateY(0)',
              transition: dragOffset > 0 ? 'none' : 'transform 250ms ease',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-night/10" />
            <p className="mb-3 text-xs uppercase tracking-wide text-night/40">Navigation</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {drawerItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeDrawer}
                  className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] p-3 text-center transition hover:bg-sand/60"
                >
                  <Icon className="h-6 w-6 text-[#0A7EA4]" />
                  <span className="mt-2 text-xs font-medium text-night">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </nav>
  )
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, demoProfile, logout } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState<string | null>(null)
  const [mobileGroupOpen, setMobileGroupOpen] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [proUnreadCount, setProUnreadCount] = useState(0)
  const demoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const runtimeEnv = process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV
  const showQaTools = runtimeEnv === 'development'
  const userMenuId = 'header-user-menu'
  const desktopNavRef = useRef<HTMLDivElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let alive = true

    const loadUnreadCount = async () => {
      if (!isAuthenticated || !user?.is_pro || demoProfile) {
        if (alive) setProUnreadCount(0)
        return
      }

      try {
        const response = await proApi.getDashboard()
        const unreadMessages = Number(response.data?.data?.unread_messages_total ?? 0)
        if (alive) setProUnreadCount(unreadMessages)
      } catch {
        if (alive) setProUnreadCount(0)
      }
    }

    void loadUnreadCount()

    return () => {
      alive = false
    }
  }, [demoProfile, isAuthenticated, user?.is_pro])

  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
    setDesktopMenuOpen(null)
    setMobileGroupOpen(null)
  }, [pathname])

  useEffect(() => {
    const handlePointerDown = (event: Event) => {
      const target = event.target as Node | null
      if (!target) return
      if (desktopNavRef.current && desktopNavRef.current.contains(target)) return
      if (mobileMenuRef.current && mobileMenuRef.current.contains(target)) return
      setDesktopMenuOpen(null)
      setUserMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) router.push(`/annonces?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    router.push('/')
  }

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const isActiveGroup = (group: NavGroupItem) => group.children.some((item) => isActiveLink(item.href))

  const renderNavGroup = (group: NavGroupItem, mobile = false) => {
    const open = mobile ? mobileGroupOpen === group.label : desktopMenuOpen === group.label
    const active = isActiveGroup(group)

    if (mobile) {
      return (
        <div key={group.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)]">
          <button
            type="button"
            onClick={() => setMobileGroupOpen((current) => (current === group.label ? null : group.label))}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
              active ? 'text-nc-lagon' : 'text-night'
            }`}
            aria-expanded={open}
            aria-haspopup="true"
          >
            <span>{group.label}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open ? (
            <div className="px-2 pb-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 fade-in">
                {group.children.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-2xl px-4 py-3 text-sm transition ${
                      isActiveLink(item.href)
                        ? 'bg-nc-lagonLight text-nc-lagon'
                        : 'text-night/75 hover:bg-[var(--color-background-secondary)] hover:text-night'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div key={group.label} className="relative">
        <button
          type="button"
          onClick={() => setDesktopMenuOpen((current) => (current === group.label ? null : group.label))}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            open || active
              ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-night/75 hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
          }`}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {group.label}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open ? (
          <div className="absolute left-0 top-full z-30 mt-3 min-w-[18rem] rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-2 shadow-modal fade-in">
            {group.children.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDesktopMenuOpen(null)}
                    className={`block whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActiveLink(item.href)
                        ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                        : 'text-night/75 hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
                    }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <header data-kalico-header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div ref={desktopNavRef} className="mx-auto flex h-16 max-w-[120rem] items-center gap-3 px-6 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/brand/kalico1.svg"
              alt="Kalico"
              width={160}
              height={40}
              priority
              className="block h-10 w-auto shrink-0"
              style={{ width: 'auto', height: '40px' }}
            />
            <span className="block font-display text-lg font-bold leading-none text-night md:text-xl">Kalico</span>
          </Link>

          <form onSubmit={handleSearch} className="mx-auto hidden w-full max-w-lg md:block">
            <label htmlFor="header-search" className="sr-only">
              Rechercher sur Kalico
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
              <input
                id="header-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher sur Kalico…"
                aria-label="Rechercher sur Kalico"
                className="input py-1.5 pl-9 pr-4 text-sm"
              />
            </div>
          </form>

          <div className="hidden xl:flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-0.5">
            {GLOBAL_NAV_LINKS.filter((link) => link.href === '/').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isActiveLink(link.href)
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-night/75 hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {GLOBAL_NAV_GROUPS.filter((group) => group.label === 'Acheter/Vendre').map((group) => renderNavGroup(group))}

            {GLOBAL_NAV_LINKS.filter((link) => link.href === '/bons-plans').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isActiveLink(link.href)
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-night/75 hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {GLOBAL_NAV_GROUPS.filter((group) => group.label === 'Services').map((group) => renderNavGroup(group))}

            {GLOBAL_NAV_LINKS.filter((link) => link.href === '/covoiturage').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isActiveLink(link.href)
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-night/75 hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {GLOBAL_NAV_LINKS.filter((link) => link.href === '/pro').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full border border-[var(--color-border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-raised)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <Link
              href="/annonces/nouvelle"
              className="md:hidden flex shrink-0 items-center gap-1.5 rounded-xl bg-coral px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-coral/30 transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Déposer
            </Link>
          ) : (
            <button
              type="button"
              onClick={() =>
                openAuthModal({
                  type: 'publish_listing',
                  redirectTo: '/annonces/nouvelle',
                })
              }
              className="md:hidden flex shrink-0 items-center gap-1.5 rounded-xl bg-coral px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-coral/30 transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Déposer
            </button>
          )}

          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {!demoProfile ? <NotificationBell /> : null}
                <Link href="/profil?tab=listings" className="btn-ghost px-3 py-2 text-sm">
                  Mes annonces
                </Link>
                <Link href="/messages" className="btn-ghost relative p-2" aria-label="Messages">
                  <MessageCircle className="h-5 w-5" />
                  {proUnreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                      {proUnreadCount > 99 ? '99+' : proUnreadCount}
                    </span>
                  ) : null}
                </Link>
                <Link href="/favoris" className="btn-ghost relative p-2" aria-label="Favoris">
                  <Heart className="h-5 w-5" />
                </Link>
                <Link href="/annonces/nouvelle" className="btn-primary px-5 py-2 text-sm shadow-sm">
                  <Plus className="h-4 w-4" />
      Déposer
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((value) => !value)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    aria-controls={userMenuId}
                    className="btn-ghost flex items-center gap-2 px-3 py-2"
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-coral/15">
                        <span className="text-xs font-bold text-coral">
                          {user?.first_name?.[0]}
                          {user?.last_name?.[0]}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium">{user?.first_name}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-night/40 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen ? (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div
                        id={userMenuId}
                        role="menu"
                        aria-label="Menu utilisateur"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setUserMenuOpen(false)
                        }}
                        className="absolute right-0 top-full z-20 mt-1 w-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-modal animate-scale-in"
                      >
                        <Link href="/profil" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <User className="h-4 w-4 text-night/50" />
                          Mon profil
                        </Link>
                        <Link href="/profil?tab=listings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <Plus className="h-4 w-4 text-night/50" />
                          Mes annonces
                        </Link>
                        <Link href="/covoiturage/reservations" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <Car className="h-4 w-4 text-night/50" />
                          Mes réservations
                        </Link>
                        <Link href="/mes-rdv" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <CalendarDays className="h-4 w-4 text-night/50" />
                          Mes rendez-vous
                        </Link>
                        <Link href="/covoiturage/mes-courses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <Car className="h-4 w-4 text-night/50" />
                          Mes courses
                        </Link>
                        <Link href="/parametres" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <Settings2 className="h-4 w-4 text-night/50" />
                          Paramètres
                        </Link>
                        <Link href="/favoris" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand" role="menuitem">
                          <Heart className="h-4 w-4 text-night/50" />
                          Favoris
                        </Link>
                        <div className="my-1 border-t border-[var(--color-border)]" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-sand"
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4" />
              Déconnexion
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    openAuthModal({
                      type: 'login',
                      redirectTo: '/connexion',
                    })
                  }
                  className="btn-ghost text-sm"
                >
                  Se connecter
                </button>
                <Link href="/inscription" className="btn-secondary py-2 text-sm">
                  S'inscrire
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    openAuthModal({
                      type: 'publish_listing',
                      redirectTo: '/annonces/nouvelle',
                    })
                  }
                  className="btn-primary px-5 py-2 text-sm shadow-sm"
                >
                  <Plus className="h-4 w-4" />
      Déposer
                </button>
              </>
            )}
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              className="btn-ghost shrink-0 p-2"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-secondary-menu"
              aria-haspopup="menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <ThemeToggle />
          </div>
        </div>

        {menuOpen ? (
          <div
            ref={mobileMenuRef}
            id="mobile-secondary-menu"
            role="menu"
            aria-label="Menu mobile secondaire"
            className="md:hidden flex max-h-[calc(100dvh-4rem)] flex-col gap-3 overflow-y-auto overscroll-contain border-t border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-4 fade-in"
          >
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActiveLink('/')
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-surface-raised)] text-night/75'
              }`}
              role="menuitem"
            >
              Accueil
            </Link>

            {GLOBAL_NAV_GROUPS.map((group) => renderNavGroup(group, true))}

            <Link
              href="/pro"
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl border border-[var(--color-border-strong)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
              role="menuitem"
            >
              Devenir Pro
            </Link>

            <div className="mt-1 grid gap-2 border-t border-[var(--color-border)] pt-3">
              {isAuthenticated ? (
                <>
                  <Link href="/profil?tab=listings" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                    Mes annonces
                  </Link>
                  <Link href="/messages" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                    Messages
                  </Link>
                  <Link href="/parametres" onClick={() => setMenuOpen(false)} className="btn-ghost justify-start" role="menuitem">
                    Paramètres
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost justify-start text-red-500">
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      openAuthModal({
                        type: 'login',
                        redirectTo: '/connexion',
                      })
                    }}
                    className="btn-secondary justify-center"
                    role="menuitem"
                  >
                    Se connecter
                  </button>
                  <Link href="/inscription" onClick={() => setMenuOpen(false)} className="btn-primary justify-center" role="menuitem">
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
        <div className="border-t border-[var(--color-border)] bg-[var(--color-background-secondary)] px-4 py-2">
        <div className="mx-auto max-w-[120rem] px-6 lg:px-10">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <DemoModeSwitcher />
              {demoModeEnabled && showQaTools ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/qa"
                    className="rounded-full border border-coral/15 bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold text-coral transition hover:border-coral/30 hover:bg-coral/5"
                  >
                    Ouvrir le dashboard QA
                  </Link>
                  <span className="rounded-full bg-night/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-night/60">
                    SEED LOCAL ACTIF
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

    </>
  )
}

````

## PATH: frontend/src/components/layout/Footer.tsx
````
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback } from 'react'
import { Mail, Shield, FileText, Lock, MessageCircle } from 'lucide-react'

import NewsletterForm from '@/components/layout/NewsletterForm'

const links = [
  { href: '/mentions-legales', label: 'Mentions légales', icon: FileText },
  { href: '/politique-de-confidentialite', label: 'Confidentialité', icon: Lock },
  { href: '/cgu', label: 'CGU', icon: FileText },
  { href: '/cgv', label: 'CGV', icon: Shield },
  { href: '/politique-cookies', label: 'Cookies', icon: Lock },
  { href: '/contact', label: 'Contact', icon: MessageCircle },
]

export default function Footer() {
  const openCookieBanner = useCallback(() => {
    window.dispatchEvent(new Event('kalico-cookie-banner-open'))
  }, [])

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="relative h-12 w-12 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_24px_rgba(8,32,50,0.12)]">
                <Image
                  src="/brand/kalico1.svg"
                  alt="Kalico"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <div>
                <span className="block font-display text-lg font-bold text-night">Kalico</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-coral/80">
                  Nouvelle-Calédonie
                </span>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-night/60">
              Petites annonces en Nouvelle-Calédonie. Achetez, vendez, échangez et contactez des vendeurs locaux depuis le web ou le mobile.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-night">Informations</p>
            <div className="grid gap-2">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-2 text-sm text-night/60 transition-colors hover:text-coral"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={openCookieBanner}
                className="inline-flex items-center gap-2 text-left text-sm text-night/60 transition-colors hover:text-coral"
              >
                <Lock className="h-4 w-4" />
                Gérer mes cookies
              </button>
              <a
                href="mailto:contact@kalico.nc"
                className="inline-flex items-center gap-2 text-sm text-night/60 transition-colors hover:text-coral"
              >
                <Mail className="h-4 w-4" />
                contact@kalico.nc
              </a>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-background-secondary)]/80 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Newsletter</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">Recevez notre newsletter</h2>
              <p className="mt-2 text-sm leading-relaxed text-night/60">
                Les meilleures annonces, bons plans et pros locaux directement dans votre boîte mail.
              </p>
            </div>

            <div>
              <NewsletterForm />
              <p className="mt-2 text-xs text-night/40">
                Pas de spam. Désinscription en un clic.
              </p>
            </div>
          </div>
        </section>
        <div className="mt-8 flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 text-xs text-night/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Kalico. Tous droits réservés.</p>
          <p>Nouvelle-Calédonie.</p>
        </div>
      </div>
    </footer>
  )
}

````

## PATH: frontend/src/components/auth/SocialAuthButtons.tsx
````
﻿'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { API_ORIGIN } from '@/lib/api'
import { consumeRedirectAfterLogin } from '@/lib/authRedirect'
import { saveStoredTokens } from '@/lib/tokenStorage'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? ''
const showGoogleButton =
  GOOGLE_CLIENT_ID.trim() !== '' && !GOOGLE_CLIENT_ID.toLowerCase().includes('changeme')
const showAppleButton =
  APPLE_CLIENT_ID.trim() !== '' && !APPLE_CLIENT_ID.toLowerCase().includes('changeme')

interface Props {
  redirectTo?: string
  mode?: 'connexion' | 'inscription'
  showLegalFooter?: boolean
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          prompt: () => void
          renderButton: (el: HTMLElement, config: object) => void
          disableAutoSelect: () => void
          cancel: () => void
        }
      }
    }
  }
}

function useGoogleSignIn(onToken: (token: string) => Promise<void>) {
  const [loading, setLoading] = useState(false)
  const googleInitializedRef = useRef(false)
  const isPromptingRef = useRef(false)
  const scriptLoadingRef = useRef(false)

  useEffect(() => {
    return () => {
      isPromptingRef.current = false
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
  }, [])

  const initGoogle = () => {
    if (!window.google?.accounts?.id || googleInitializedRef.current) {
      return false
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async ({ credential }: { credential: string }) => {
        isPromptingRef.current = false
        setLoading(true)
        try {
          await onToken(credential)
        } finally {
          setLoading(false)
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })
    googleInitializedRef.current = true
    return true
  }

  const promptGoogle = () => {
    if (!window.google?.accounts?.id || isPromptingRef.current) {
      return
    }

    isPromptingRef.current = true
    try {
      window.google.accounts.id.prompt()
    } catch {
      isPromptingRef.current = false
    }
  }

  const trigger = () => {
    if (isPromptingRef.current) {
      return
    }

    if (!window.google) {
      if (scriptLoadingRef.current) {
        return
      }

      scriptLoadingRef.current = true
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        scriptLoadingRef.current = false
        initGoogle()
        promptGoogle()
      }
      script.onerror = () => {
        scriptLoadingRef.current = false
      }
      document.head.appendChild(script)
      return
    }

    initGoogle()
    promptGoogle()
  }

  return { trigger, loading }
}

export default function SocialAuthButtons({ redirectTo = '/', mode = 'connexion', showLegalFooter = true }: Props) {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [error, setError] = useState('')
  const [appleLoading, setAppleLoading] = useState(false)

  const handleSocialSuccess = (data: {
    access_token: string
    refresh_token: string
    user: {
      phone_verified?: boolean
      telephone?: string | null
      [key: string]: unknown
    }
  }) => {
    const target = consumeRedirectAfterLogin(redirectTo)
    saveStoredTokens(data.access_token, data.refresh_token)
    setUser(data.user as any)
    if (!data.user.phone_verified || !data.user.telephone) {
      router.push(`/inscription/telephone?next=${encodeURIComponent(target)}`)
      return
    }

    router.push(target)
  }

  const { trigger: triggerGoogle, loading: googleLoading } = useGoogleSignIn(async (id_token) => {
    setError('')
    try {
      const { data } = await axios.post(`${API_ORIGIN}/api/auth/google`, { id_token })
      handleSocialSuccess(data.data)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'La connexion Google a échoué.')
    }
  })

  const handleApple = async () => {
    setError('')
    setAppleLoading(true)
    try {
      const appleResponse = await (window as any).AppleID?.auth.signIn()
      if (!appleResponse?.authorization?.id_token) {
        throw new Error('Token Apple manquant')
      }

      const { data } = await axios.post(`${API_ORIGIN}/api/auth/apple`, {
        id_token: appleResponse.authorization.id_token,
        user: appleResponse.user
          ? {
              firstName: appleResponse.user.name?.firstName,
              lastName: appleResponse.user.name?.lastName,
            }
          : undefined,
      })
      handleSocialSuccess(data.data)
    } catch (err: any) {
      if (err?.error !== 'popup_closed_by_user') {
        setError(err?.response?.data?.error || 'La connexion Apple a échoué.')
      }
    } finally {
      setAppleLoading(false)
    }
  }

  const isLoading = googleLoading || appleLoading

  const handleGoogleClick = () => {
    triggerGoogle()
  }

  const handleAppleClick = () => {
    handleApple()
  }

  return (
    <div className="space-y-4">
      {showGoogleButton || showAppleButton ? (
        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-night/10" />
          <span className="shrink-0 text-xs font-medium text-night/45">ou continuer avec</span>
          <div className="h-px flex-1 bg-night/10" />
        </div>
      ) : null}

      <div className="space-y-3">
        {showGoogleButton ? (
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="btn-secondary w-full justify-start border-night/15 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="flex-1 text-left">
              {googleLoading ? 'Connexion en cours...' : 'Continuer avec Google'}
            </span>
          </button>
        ) : null}

        {showAppleButton ? (
          <button
            type="button"
            onClick={handleAppleClick}
            disabled={isLoading}
            className="btn-secondary w-full justify-start border-night/15 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <svg className="h-5 w-5 shrink-0 fill-night" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.31.07 2.22.75 2.98.8 1.13-.23 2.21-.93 3.39-.84 1.44.12 2.53.7 3.23 1.79-2.93 1.76-2.4 5.62.24 6.73-.57 1.54-1.32 3.05-1.84 4.4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span className="flex-1 text-left">
              {appleLoading ? 'Connexion en cours...' : 'Continuer avec Apple'}
            </span>
          </button>
        ) : null}
      </div>

      {error ? <p className="animate-fade-in text-center text-xs text-[var(--color-danger)]">{error}</p> : null}

      {showLegalFooter ? (
        <p className="text-center text-[10px] leading-relaxed text-night/35">
          En continuant, vous acceptez nos{' '}
          <a href="/cgu" className="underline transition hover:text-night/60">
            CGU
          </a>{' '}
          et notre{' '}
          <a href="/politique-de-confidentialite" className="underline transition hover:text-night/60">
            politique de confidentialité
          </a>
          .
        </p>
      ) : null}
    </div>
  )
}

````

## PATH: frontend/src/components/annonces/AnnonceDetail.tsx
````
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertTriangle, ArrowLeft, BadgeDollarSign, Heart, X } from 'lucide-react'
import { listingsApi, messagesApi, usersApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { consumePendingAuthAction, peekPendingAuthAction } from '@/lib/authAction'
import { useAuthActionStore } from '@/store/authActionStore'
import { useFavorite } from '@/hooks/useFavorite'
import { trackEvent } from '@/lib/analytics'
import { API_ORIGIN } from '@/lib/api'
import ShareButton from '@/components/annonces/ShareButton'
import TrocProposalForm from '@/components/troc/TrocProposalForm'
import {
  ListingHeroCard,
  RelatedSearchesSection,
  ReviewFormSection,
  SellerListingsSection,
  SellerReviewsSection,
  SecurityTipsCard,
  SellerSidebar,
} from '@/components/annonces/AnnonceDetailSections'

type ListingImage = {
  id: number
  url: string
  thumbnail_url?: string | null
  medium_url?: string | null
  original_url?: string | null
}

type ListingUser = {
  id: number
  prenom: string
  nom: string
  avatar_url?: string | null
  is_pro: boolean
  note_moyenne?: number | null
  nb_avis?: number | null
  nb_annonces?: number | null
  created_at?: string | null
  seller_commune_name?: string | null
  seller_province_name?: string | null
  email_verified?: boolean
  telephone_verifie?: boolean
  trust_score?: number | null
  trust_level?: string | null
  is_online?: boolean
  last_seen_label?: string | null
  avg_response_time_label?: string | null
}

export type ListingDetail = {
  id: number | string
  title: string
  price: number | null
  price_negotiable: boolean
  is_free: boolean
  description: string
  condition: string
  status: string
  is_featured?: boolean
  is_urgent?: boolean
  nb_vues?: number
  nb_favoris?: number
  commune_id?: number | null
  commune_name?: string | null
  commune_slug?: string | null
  category_id?: number | null
  category_name?: string | null
  category_slug?: string | null
  category_icon?: string | null
  published_at?: string
  contre_quoi?: string | null
  images?: ListingImage[]
  user: ListingUser
  is_favorited?: boolean
}

type SellerListing = {
  id: number | string
  title?: string
  titre?: string
  prix?: number | null
  price?: number | null
  commune_name?: string | null
  category_icon?: string | null
  cover_image?: string | null
}

type SellerReview = {
  id: number
  note: number
  commentaire?: string | null
  created_at?: string
  auteur_prenom?: string
  auteur_avatar?: string | null
}

interface Props {
  id: string
  initialData?: ListingDetail | null
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'Correct',
  for_parts: 'Pour pièces',
}

const TRUST_LABELS: Record<string, { label: string; className: string }> = {
  excellent: { label: 'Vendeur de confiance', className: 'bg-jungle/10 text-jungle border-jungle/20' },
  bon: { label: 'Vendeur fiable', className: 'bg-teal-50 text-teal-700 border-teal-100' },
  moyen: { label: 'Profil en cours', className: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30' },
  faible: { label: 'Profil sensible', className: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30' },
  inconnu: { label: 'Non évalué', className: 'bg-sand text-night/60 border-night/10' },
}

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'pour', 'avec', 'sur', 'dans',
  'au', 'aux', 'a', 'ab', 'version', 'modele', 'neuf', 'bon', 'etat',
])

function formatDate(value?: string) {
  if (!value) return ''
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: fr })
  } catch {
    return ''
  }
}

function buildAssociatedSearches(listing: ListingDetail) {
  const searches: Array<{ label: string; href: string; tone: string }> = []
  const rawTokens = (listing.title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))

  if (listing.category_name && listing.category_id) {
    searches.push({
      label: listing.category_name,
      href: `/annonces?category_id=${listing.category_id}`,
      tone: 'bg-night text-white',
    })
  }

  if (listing.commune_name && listing.commune_id) {
    searches.push({
      label: listing.commune_name,
      href: `/annonces?commune_id=${listing.commune_id}`,
      tone: 'bg-ocean/10 text-ocean',
    })
  }

  rawTokens.slice(0, 4).forEach((token, index) => {
    searches.push({
      label: token,
      href: `/annonces?q=${encodeURIComponent(token)}`,
      tone: index % 2 === 0 ? 'bg-coral/10 text-coral' : 'bg-sand text-night',
    })
  })

  if (listing.price) {
    const min = Math.max(0, Math.floor(listing.price * 0.75))
    const max = Math.floor(listing.price * 1.25)
    searches.push({
      label: `${min.toLocaleString('fr-FR')} - ${max.toLocaleString('fr-FR')} XPF`,
      href: `/annonces?price_min=${min}&price_max=${max}`,
      tone: 'bg-jungle/10 text-jungle',
    })
  }

  return searches.slice(0, 7)
}

function snapTo10(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value / 10) * 10)
}

export default function AnnonceDetail({ id, initialData }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const { isFavorited, toggleFavorite } = useFavorite()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [listing, setListing] = useState<ListingDetail | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)
  const [activeImage, setActiveImage] = useState(0)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sellerListings, setSellerListings] = useState<SellerListing[]>([])
  const [sellerReviews, setSellerReviews] = useState<SellerReview[]>([])
  const [sellerLoading, setSellerLoading] = useState(false)
  const [reviewNote, setReviewNote] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerNote, setOfferNote] = useState('')
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerFeedback, setOfferFeedback] = useState<string | null>(null)
  const [offerError, setOfferError] = useState<string | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState<'spam' | 'fake' | 'prohibited' | 'offensive' | 'other'>('spam')
  const [reportComment, setReportComment] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportFeedback, setReportFeedback] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [trocModalOpen, setTrocModalOpen] = useState(false)
  const [publishedBannerOpen, setPublishedBannerOpen] = useState(false)
  const replayedMessageRef = useRef(false)
  const trackedViewRef = useRef<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setListing(initialData)
      setLoading(false)
      return
    }

    let alive = true
    setLoading(true)
    listingsApi.getById(id)
      .then(({ data }) => {
        if (!alive) return
        setListing(data.data ?? null)
        setError(null)
      })
      .catch(() => {
        if (alive) setError('Impossible de charger cette annonce.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [id, initialData])

  useEffect(() => {
    setActiveImage(0)
  }, [listing?.id])

  useEffect(() => {
    setPublishedBannerOpen(searchParams.get('published') === '1')
  }, [searchParams])

  useEffect(() => {
    if (!listing?.id) return
    if (trackedViewRef.current === String(listing.id)) return
    trackedViewRef.current = String(listing.id)
    void trackEvent('listing_view', {
      listing_id: listing.id,
      listing_title: listing.title,
      category_id: listing.category_id ?? null,
      seller_id: listing.user?.id ?? null,
    }).catch(() => {})
    void fetch(`${API_ORIGIN}/api/listings/${listing.id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        source: typeof document !== 'undefined' && document.referrer.includes('/annonces') ? 'search' : 'direct',
      }),
    }).catch(() => {})
  }, [listing])

  useEffect(() => {
    replayedMessageRef.current = false
  }, [listing?.id])

  useEffect(() => {
    if (!isAuthenticated || !listing || replayedMessageRef.current) return

    const pending = peekPendingAuthAction()
    if (!pending || pending.type !== 'message_seller' || pending.listingId !== String(listing.id)) return

    replayedMessageRef.current = true
    consumePendingAuthAction()
    void handleMessageSeller()
  }, [isAuthenticated, listing, listing?.id])

  useEffect(() => {
    if (!listing?.user?.id) return

    let alive = true
    setSellerLoading(true)

    const loadSellerContext = async () => {
      try {
        const [listingsRes, reviewsRes] = await Promise.all([
          usersApi.getUserListings(String(listing.user.id)),
          usersApi.getReviews(String(listing.user.id)),
        ])

        if (!alive) return
        const items = (listingsRes.data?.data ?? listingsRes.data ?? []).filter(
          (item: SellerListing) => String(item.id) !== String(listing.id)
        )
        setSellerListings(items)
        setSellerReviews(reviewsRes.data?.data ?? reviewsRes.data ?? [])
      } catch {
        if (alive) {
          setSellerListings([])
          setSellerReviews([])
        }
      } finally {
        if (alive) setSellerLoading(false)
      }
    }

    loadSellerContext()
    return () => {
      alive = false
    }
  }, [listing?.id, listing?.user?.id])

  const currentUserId = user ? String(user.id) : null
  const ownerId = listing ? String(listing.user.id) : null
  const isOwner = Boolean(listing && currentUserId === ownerId)
  const saved = listing ? isFavorited(String(listing.id)) || Boolean(listing.is_favorited) : false
  const images = listing?.images ?? []
  const activeCover = images[activeImage]?.medium_url
    ?? images[activeImage]?.url
    ?? images[0]?.medium_url
    ?? images[0]?.url
    ?? null
  const associatedSearches = useMemo(() => (listing ? buildAssociatedSearches(listing) : []), [listing])
  const primaryCategoryHref = listing?.category_id ? `/annonces?category_id=${listing.category_id}` : '/annonces'
  const trustState = TRUST_LABELS[((listing?.user?.trust_level ?? 'inconnu') as keyof typeof TRUST_LABELS)] ?? TRUST_LABELS.inconnu
  const recentReviews = sellerReviews.slice(0, 4)
  const otherSellerListings = sellerListings.slice(0, 8)
  const shareAnnonce = listing
    ? {
        id: Number(listing.id),
        titre: listing.title,
        prix: listing.is_free ? 0 : listing.price ?? 0,
        commune: listing.commune_name ?? null,
        image_url: activeCover ?? null,
      }
    : null

  const refreshListing = async () => {
    const { data } = await listingsApi.getById(id)
    setListing(data.data ?? null)
  }

  const refreshSellerContext = async () => {
    if (!listing?.user?.id) return
    const [listingsRes, reviewsRes] = await Promise.all([
      usersApi.getUserListings(String(listing.user.id)),
      usersApi.getReviews(String(listing.user.id)),
    ])
    const items = (listingsRes.data?.data ?? listingsRes.data ?? []).filter(
      (item: SellerListing) => String(item.id) !== String(listing.id)
    )
    setSellerListings(items)
    setSellerReviews(reviewsRes.data?.data ?? reviewsRes.data ?? [])
  }

  const handleFavorite = async () => {
    if (!listing) return
    if (!isAuthenticated) {
      openAuthModal({
        type: 'favorite_listing',
        listingId: String(listing.id),
        redirectTo: `/annonces/${listing.id}`,
      })
      return
    }
    await toggleFavorite({
      id: String(listing.id),
      titre: listing.title,
      prix: listing.price,
      cover_image: activeCover,
      commune: listing.commune_name ?? null,
      category: listing.category_name ?? null,
    })
  }

  const handleMessageSeller = async () => {
    if (!listing) return
    void trackEvent('contact_seller_click', {
      listing_id: listing.id,
      listing_title: listing.title,
      seller_id: listing.user?.id ?? null,
    }).catch(() => {})
    if (!isAuthenticated) {
      openAuthModal({
        type: 'message_seller',
        listingId: String(listing.id),
        redirectTo: `/annonces/${listing.id}`,
      })
      return
    }
    setSendingMessage(true)
    try {
      const starter = `Bonjour, votre annonce "${listing.title}" m'interesse. Est-elle toujours disponible ?`
      const res = await messagesApi.startConversation({
        annonce_id: Number(listing.id),
        message: starter,
      })
      const convId = res.data?.conversation_id ?? res.data?.data?.conversation_id ?? res.data?.id
      void fetch(`${API_ORIGIN}/api/listings/${listing.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contact_type: 'message' }),
      }).catch(() => {})
      if (convId) router.push(`/messages/${convId}`)
    } catch {
      setError("Impossible d'ouvrir la conversation.")
    } finally {
      setSendingMessage(false)
    }
  }

  const openOfferModal = () => {
    if (!listing) return
    if (!isAuthenticated) {
      openAuthModal({
        type: 'login',
        redirectTo: `/annonces/${listing.id}`,
      })
      return
    }
    setOfferFeedback(null)
    setOfferError(null)
    setOfferAmount((current) => current || String(snapTo10((listing.price ?? 0) * 0.9 || 0)))
    setOfferNote('')
    setOfferModalOpen(true)
  }

  const openReportModal = () => {
    if (!listing) return
    if (!isAuthenticated) {
      openAuthModal({
        type: 'login',
        redirectTo: `/annonces/${listing.id}`,
      })
      return
    }
    setReportFeedback(null)
    setReportError(null)
    setReportComment('')
    setReportReason('spam')
    setReportModalOpen(true)
  }

  const handleSubmitOffer = async () => {
    if (!listing) return
    const amount = snapTo10(Number(String(offerAmount).replace(/\s/g, '')))
    if (!amount) {
      setOfferError('Indiquez un montant valide pour votre offre.')
      return
    }

    if (!isAuthenticated) {
      openAuthModal({
        type: 'login',
        redirectTo: `/annonces/${listing.id}`,
      })
      return
    }

    setOfferSubmitting(true)
    setOfferError(null)
    setOfferFeedback(null)
    try {
      const starter = `Bonjour, je souhaite faire une offre de ${amount.toLocaleString('fr-FR')} XPF pour "${listing.title}".${offerNote.trim() ? `\n\n${offerNote.trim()}` : ''}`
      const convoRes = await messagesApi.startConversation({
        annonce_id: Number(listing.id),
        message: starter,
      })
      const convId =
        convoRes.data?.data?.conversationId ??
        convoRes.data?.conversationId ??
        convoRes.data?.data?.conversation_id ??
        convoRes.data?.conversation_id ??
        convoRes.data?.id

      if (!convId) {
        throw new Error('Conversation introuvable')
      }

      await messagesApi.makeOffer(convId, amount)
      setOfferFeedback('Votre offre a bien été envoyée. Vous êtes redirigé vers la conversation.')
      setOfferModalOpen(false)
      router.push(`/messages/${convId}`)
    } catch {
      setOfferError("Impossible d'envoyer votre offre pour le moment.")
    } finally {
      setOfferSubmitting(false)
    }
  }

  const handleSubmitReport = async () => {
    if (!listing) return
    setReportSubmitting(true)
    setReportError(null)
    setReportFeedback(null)
    try {
      await listingsApi.report(listing.id, {
        reason: reportReason,
        comment: reportComment.trim(),
      })
      setReportFeedback('Merci, votre signalement a bien été envoyé.')
      setReportModalOpen(false)
      setReportComment('')
      setReportReason('spam')
    } catch {
      setReportError("Impossible d'envoyer le signalement pour le moment.")
    } finally {
      setReportSubmitting(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!listing) return
    setReviewSubmitting(true)
    setReviewError(null)
    try {
      await usersApi.addReview(String(listing.user.id), {
        note: reviewNote,
        commentaire: reviewComment.trim(),
      })
      await Promise.all([
        refreshListing().catch(() => undefined),
        refreshSellerContext().catch(() => undefined),
      ])
      setReviewFeedback('Merci, votre avis a bien été publié.')
      setReviewComment('')
      setReviewNote(5)
    } catch {
      setReviewError('Impossible de publier votre avis pour le moment.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading || !listing) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-3xl border border-night/8 bg-white p-8 text-center text-night/60 shadow-sm">
          Chargement de l'annonce...
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <Link href="/annonces" className="inline-flex items-center gap-2 text-sm text-night/50 hover:text-night">
          <ArrowLeft size={16} />
          Retour aux annonces
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFavorite}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
              saved ? 'border-coral/30 bg-coral/8 text-coral' : 'border-night/10 bg-white text-night/65 hover:text-night'
            }`}
          >
            <Heart size={16} className={saved ? 'fill-coral' : ''} />
            Favori
          </button>
          {shareAnnonce && <ShareButton annonce={shareAnnonce} variant="icon" />}
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {publishedBannerOpen ? (
        <div className="mb-5 rounded-[2rem] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-success)]">Publication réussie</p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--color-success)]">Votre annonce est en ligne</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-success)]/70">
                Partagez-la maintenant, retrouvez-la dans vos annonces et découvrez les options de visibilité pour lui donner un coup de pouce.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPublishedBannerOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-success)]/30 bg-white text-[var(--color-success)] transition hover:bg-[var(--color-success)]/10"
              aria-label="Fermer le message de publication"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {shareAnnonce && <ShareButton annonce={shareAnnonce} variant="full" className="rounded-2xl" />}
            <Link
              href="/profil?tab=listings"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-success)]/30 bg-white px-4 py-3 text-sm font-semibold text-[var(--color-success)] transition hover:bg-[var(--color-success)]/10"
            >
              Voir mes annonces
            </Link>
            <Link
              href="/pro"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--color-success)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Mettre en avant
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-[1.25fr_0.95fr] gap-6 items-start">
        <ListingHeroCard
          listing={listing}
          activeCover={activeCover}
          activeImage={activeImage}
          onPickImage={setActiveImage}
          primaryCategoryHref={primaryCategoryHref}
          trustScore={listing.user.trust_score}
        />

        <div className="space-y-4 lg:sticky lg:top-24">
          <SellerSidebar
            listing={listing}
            currentUserId={currentUserId}
            isOwner={isOwner}
            sendingMessage={sendingMessage}
            onMessageSeller={handleMessageSeller}
            onMakeOffer={openOfferModal}
            onProposeTroc={() => setTrocModalOpen(true)}
            onReportListing={openReportModal}
            onOpenPro={() => router.push('/pro')}
            onViewSeller={() => router.push(`/profil/${listing.user.id}`)}
            trustState={trustState}
            formatDateFn={formatDate}
          />

          <SellerReviewsSection reviews={recentReviews} loading={sellerLoading} formatDateFn={formatDate} />

          <ReviewFormSection
            canReview={Boolean(!isOwner && user)}
            submitting={reviewSubmitting}
            feedback={reviewFeedback}
            error={reviewError}
            reviewNote={reviewNote}
            reviewComment={reviewComment}
            onNoteChange={setReviewNote}
            onCommentChange={setReviewComment}
            onSubmit={handleSubmitReview}
            onRequireAuth={() =>
              openAuthModal({
                type: 'review_seller',
                listingId: String(listing.id),
                redirectTo: `/annonces/${listing.id}`,
              })
            }
          />

          <SecurityTipsCard />
        </div>
      </div>

      <SellerListingsSection items={otherSellerListings} sellerId={listing.user.id} />
      <RelatedSearchesSection searches={associatedSearches} />

      {offerModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-night/55 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="relative w-full max-w-2xl rounded-[2rem] border border-night/10 bg-white p-6 shadow-[0_24px_80px_rgba(8,32,50,0.2)]">
            <button
              type="button"
              onClick={() => setOfferModalOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-night/10 bg-white text-night/50 transition hover:text-night"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                <BadgeDollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Offre rapide</p>
                <h2 className="mt-1 text-2xl font-bold text-night">Faire une offre pour {listing.title}</h2>
                <p className="mt-2 text-sm leading-6 text-night/60">
                  Proposez un montant et ajoutez un message bref. La discussion s’ouvrira directement avec le vendeur.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.1fr]">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-night">Montant proposé (XPF)</span>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={offerAmount}
                  onChange={(event) => setOfferAmount(event.target.value)}
                  onBlur={(event) => setOfferAmount(String(snapTo10(Number(event.target.value || 0))))}
                  className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
                  placeholder="Ex. 12 000"
                />
                {listing.price != null && (
                  <p className="text-xs text-night/45">
                    Prix affiché: {listing.price.toLocaleString('fr-FR')} XPF
                    {listing.price_negotiable ? ' · négociable' : ''}
                  </p>
                )}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-night">Message facultatif</span>
                <textarea
                  value={offerNote}
                  onChange={(event) => setOfferNote(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-coral/40 focus:ring-4 focus:ring-coral/10"
                  placeholder="Ajoutez une courte note sur votre offre..."
                  maxLength={500}
                />
              </label>
            </div>

            {offerFeedback && (
              <div className="mt-4 rounded-2xl bg-jungle/10 px-4 py-3 text-sm font-medium text-jungle">
                {offerFeedback}
              </div>
            )}
            {offerError && (
              <div className="mt-4 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                {offerError}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOfferModalOpen(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-night/5"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmitOffer}
                disabled={offerSubmitting}
                className="inline-flex items-center justify-center rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-coral/90 disabled:cursor-wait disabled:opacity-60"
              >
                {offerSubmitting ? 'Envoi...' : 'Envoyer mon offre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-night/55 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="relative w-full max-w-xl rounded-[2rem] border border-night/10 bg-white p-6 shadow-[0_24px_80px_rgba(8,32,50,0.2)]">
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-night/10 bg-white text-night/50 transition hover:text-night"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-danger)]/80">Signalement</p>
                <h2 className="mt-1 text-2xl font-bold text-night">Signaler cette annonce</h2>
                <p className="mt-2 text-sm leading-6 text-night/60">
                  Aidez-nous à garder une plateforme de confiance. Votre signalement sera transmis à notre équipe.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-night">Motif</span>
                <select
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value as typeof reportReason)}
                  className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-[var(--color-danger)]/30 focus:ring-4 focus:ring-[var(--color-danger)]/10"
                >
                  <option value="spam">Spam ou publicité abusive</option>
                  <option value="fake">Annonce douteuse ou trompeuse</option>
                  <option value="prohibited">Produit ou contenu interdit</option>
                  <option value="offensive">Contenu offensant</option>
                  <option value="other">Autre</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-night">Commentaire (facultatif)</span>
                <textarea
                  value={reportComment}
                  onChange={(event) => setReportComment(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm text-night outline-none transition focus:border-[var(--color-danger)]/30 focus:ring-4 focus:ring-[var(--color-danger)]/10"
                  placeholder="Expliquez brièvement ce qui vous paraît problématique..."
                  maxLength={500}
                />
              </label>
            </div>

            {reportFeedback && (
              <div className="mt-4 rounded-2xl bg-jungle/10 px-4 py-3 text-sm font-medium text-jungle">
                {reportFeedback}
              </div>
            )}
            {reportError && (
              <div className="mt-4 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                {reportError}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-night/5"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={reportSubmitting}
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--color-danger)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {reportSubmitting ? 'Envoi...' : 'Envoyer le signalement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {trocModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-night/55 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-night/10 bg-white shadow-[0_24px_80px_rgba(8,32,50,0.2)]">
            <button
              type="button"
              onClick={() => setTrocModalOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-night/10 bg-white text-night/50 transition hover:text-night z-10"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
              <TrocProposalForm listingId={listing.id} listingTitle={listing.title} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

````

## PATH: frontend/src/components/annonces/AnnonceDetailSections.tsx
````
'use client'

import Link from 'next/link'
import ListingImageComponent from '@/components/ListingImage'
import {
  ArrowLeftRight,
  AlertTriangle,
  BadgeCheck,
  BadgeDollarSign,
  Clock,
  Heart,
  MailCheck,
  MapPin,
  MessageCircle,
  Phone,
  Package,
  Search,
  Send,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react'

type TrustState = {
  label: string
  className: string
}

type ListingImageItem = {
  id: number
  url: string
  thumbnail_url?: string | null
  medium_url?: string | null
  original_url?: string | null
}

type ListingUser = {
  id: number
  prenom: string
  nom: string
  avatar_url?: string | null
  is_pro: boolean
  note_moyenne?: number | null
  nb_avis?: number | null
  nb_annonces?: number | null
  created_at?: string | null
  seller_commune_name?: string | null
  seller_province_name?: string | null
  email_verified?: boolean
  telephone_verifie?: boolean
  trust_score?: number | null
  is_online?: boolean
  last_seen_label?: string | null
  avg_response_time_label?: string | null
}

type ListingDetail = {
  id: number | string
  title: string
  price: number | null
  price_negotiable: boolean
  is_free: boolean
  description: string
  condition: string
  is_featured?: boolean
  is_urgent?: boolean
  nb_vues?: number
  nb_favoris?: number
  commune_name?: string | null
  category_name?: string | null
  category_icon?: string | null
  published_at?: string
  contre_quoi?: string | null
  images?: ListingImageItem[]
  user: ListingUser
}

type SellerListing = {
  id: number | string
  title?: string
  titre?: string
  prix?: number | null
  price?: number | null
  commune_name?: string | null
  category_icon?: string | null
  cover_image?: string | null
}

type SellerReview = {
  id: number
  note: number
  commentaire?: string | null
  created_at?: string
  auteur_prenom?: string
  auteur_avatar?: string | null
}

function starsFor(note: number, className = 'w-3.5 h-3.5') {
  return Array.from({ length: 5 }).map((_, i) => (
    <BadgeCheck
      key={i}
      className={`${className} ${i < Math.round(note) ? 'fill-amber-400 stroke-amber-400' : 'stroke-night/20'}`}
    />
  ))
}

function initials(user: ListingUser) {
  return `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
}

function formatDate(value?: string) {
  if (!value) return ''
  return value
}

function formatPrice(listing: Pick<ListingDetail, 'is_free' | 'price' | 'price_negotiable'>) {
  if (listing.is_free) return 'Gratuit'
  if (listing.price == null) return 'Prix a debattre'
  return `${listing.price.toLocaleString('fr-FR')} XPF`
}

export function ListingHeroCard({
  listing,
  activeCover,
  activeImage,
  onPickImage,
  primaryCategoryHref,
  trustScore,
}: {
  listing: ListingDetail
  activeCover: string | null
  activeImage: number
  onPickImage: (index: number) => void
  primaryCategoryHref: string
  trustScore?: number | null
}) {
  const images = listing.images ?? []

  return (
    <section className="space-y-4">
      <div className="bg-white dark:bg-[var(--color-surface)] rounded-3xl border border-night/8 overflow-hidden shadow-sm">
        <div className="aspect-[4/3] bg-sand relative">
          {activeCover ? (
            <ListingImageComponent src={activeCover} alt={listing.title} sizes="(max-width: 768px) 100vw, 60vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-night/20">📦</div>
          )}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {listing.is_featured && (
              <span className="px-3 py-1 rounded-full bg-coral text-white text-xs font-semibold">À la une</span>
            )}
            {listing.is_urgent && (
              <span className="px-3 py-1 rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)] text-xs font-semibold">Urgent</span>
            )}
            {listing.contre_quoi && (
              <span className="px-3 py-1 rounded-full bg-night text-white text-xs font-semibold">Troc</span>
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="p-3 flex gap-2 overflow-x-auto snap-x scroll-smooth border-t border-night/8">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => onPickImage(index)}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-colors snap-center ${
                  index === activeImage ? 'border-coral' : 'border-transparent'
                }`}
              >
                <ListingImageComponent
                  src={image.thumbnail_url ?? image.url}
                  alt=""
                  sizes="160px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[var(--color-surface)] rounded-3xl border border-night/8 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-night/45 mb-3">
          <Link href={primaryCategoryHref} className="inline-flex items-center gap-1 rounded-full bg-night/5 px-3 py-1 hover:bg-night/10">
            {listing.category_icon && <span>{listing.category_icon}</span>}
            <span>{listing.category_name ?? 'Annonce'}</span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-night/5 px-3 py-1">
            <MapPin size={12} />
            {listing.commune_name ?? 'Nouvelle-Calédonie'}
          </span>
          {trustScore != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-jungle/10 px-3 py-1 text-jungle">
              <Sparkles size={12} />
              Confiance {trustScore}/100
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-night leading-tight">{listing.title}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-night/50">
              <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {formatDate(listing.published_at)}</span>
              <span className="inline-flex items-center gap-1.5"><Heart size={13} /> {listing.nb_favoris ?? 0} favoris</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-coral">{formatPrice(listing)}</p>
            {listing.price_negotiable && !listing.is_free && (
              <p className="text-xs text-night/45">Prix negociable</p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sand/60 p-4">
            <p className="text-[11px] uppercase tracking-wide text-night/40 mb-1">Etat</p>
            <p className="font-medium text-night">{listing.condition}</p>
          </div>
          <div className="rounded-2xl bg-sand/60 p-4">
            <p className="text-[11px] uppercase tracking-wide text-night/40 mb-1">Paiement</p>
            <p className="font-medium text-night">
              {listing.is_free ? 'Gratuit' : listing.price_negotiable ? 'Negotiable' : 'Prix fixe'}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-night/8 bg-night/[0.03] p-4">
          <div className="flex items-center gap-2 text-night mb-2">
            <MessageCircle size={16} className="text-coral" />
            <h2 className="font-semibold">Description</h2>
          </div>
          <p className="text-sm leading-7 text-night/75 whitespace-pre-line">{listing.description}</p>
          {listing.contre_quoi && (
            <div className="mt-4 rounded-2xl border border-dashed border-night/15 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-night/40 mb-1">Echange possible contre</p>
              <p className="text-sm text-night/80">{listing.contre_quoi}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function SellerSidebar({
  listing,
  currentUserId,
  isOwner,
  sendingMessage,
  onMessageSeller,
  onMakeOffer,
  onProposeTroc,
  onReportListing,
  onOpenPro,
  onViewSeller,
  trustState,
  formatDateFn,
}: {
  listing: ListingDetail
  currentUserId: string | null
  isOwner: boolean
  sendingMessage: boolean
  onMessageSeller: () => void
  onMakeOffer: () => void
  onProposeTroc: () => void
  onReportListing: () => void
  onOpenPro: () => void
  onViewSeller: () => void
  trustState: TrustState
  formatDateFn: (value?: string) => string
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="bg-white rounded-3xl border border-night/8 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-coral/10 text-coral font-bold flex items-center justify-center overflow-hidden shrink-0">
            {listing.user.avatar_url ? (
              <img src={listing.user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(listing.user)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-night truncate">
                {listing.user.prenom} {listing.user.nom}
              </h2>
            </div>

            {(listing.user.seller_commune_name || listing.user.seller_province_name) && (
              <p className="mt-1 flex items-center gap-1 text-xs text-night/50">
                <MapPin size={12} />
                {listing.user.seller_commune_name ?? 'Nouvelle-Calédonie'}
                {listing.user.seller_province_name && (
                  <span className="text-night/35">· {listing.user.seller_province_name}</span>
                )}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              {listing.user.email_verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-ocean/20 bg-ocean/8 px-2.5 py-0.5 text-[11px] font-medium text-ocean">
                  <MailCheck size={12} />
                  Email vérifié
                </span>
              )}
              {listing.user.telephone_verifie && (
                <span className="inline-flex items-center gap-1 rounded-full border border-jungle/20 bg-jungle/8 px-2.5 py-0.5 text-[11px] font-medium text-jungle">
                  <Phone size={12} />
                  Téléphone vérifié
                </span>
              )}
              {listing.user.is_pro && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
                  <Store size={12} />
                  Pro
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                listing.user.is_online ? 'border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'border border-night/10 bg-sand text-night/50'
              }`}>
                <span className={`h-2 w-2 rounded-full ${listing.user.is_online ? 'bg-[var(--color-success)]' : 'bg-night/25'}`} />
                {listing.user.is_online ? 'En ligne' : (listing.user.last_seen_label ?? 'Hors ligne')}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">{starsFor(listing.user.note_moyenne ?? 0, 'w-3.5 h-3.5')}</div>
              <span className="text-sm font-semibold text-night">
                {listing.user.note_moyenne ? `${listing.user.note_moyenne.toFixed(1)}/5` : 'Pas encore de note'}
              </span>
              <span className="text-xs text-night/40">{listing.user.nb_avis ?? 0} avis</span>
            </div>

            {listing.user.avg_response_time_label && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-nc-lagonLight px-2.5 py-1 text-[11px] font-medium text-nc-lagonText">
                <Clock size={12} />
                Répond en moyenne en {listing.user.avg_response_time_label}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${trustState.className}`}>
                <BadgeCheck size={12} />
                {trustState.label}
              </span>
              {listing.user.nb_annonces != null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-night/10 bg-sand px-2.5 py-0.5 text-[11px] font-medium text-night/60">
                  <Package size={12} />
                  {listing.user.nb_annonces} annonces
                </span>
              )}
              {listing.user.created_at && (
                <span className="inline-flex items-center gap-1 rounded-full border border-night/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-night/60">
                  <Clock size={12} />
                  Membre depuis {formatDateFn(listing.user.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onMessageSeller}
            disabled={sendingMessage || isOwner}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-coral text-white px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            <MessageCircle size={16} />
            {isOwner ? 'Votre annonce' : sendingMessage ? 'Ouverture...' : 'Envoyer un message'}
          </button>
          {!isOwner && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={onMakeOffer}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-medium text-night transition hover:border-coral/20 hover:bg-coral/5 hover:text-coral"
              >
                <BadgeDollarSign size={16} />
                Faire une offre
              </button>
              {listing.contre_quoi && (
                <button
                  type="button"
                  onClick={onProposeTroc}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-jungle/20 bg-jungle/5 px-4 py-3 text-sm font-medium text-jungle transition hover:bg-jungle/10"
                >
                  <ArrowLeftRight size={16} />
                  Proposer un troc
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-medium text-night/35 cursor-not-allowed"
          >
            <Send size={16} />
            {listing.user.telephone_verifie ? 'Appel non activé' : 'Téléphone non vérifié'}
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={onOpenPro}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-coral/20 bg-coral/5 px-4 py-3 text-sm font-semibold text-coral hover:bg-coral/10"
            >
              <TrendingUp size={16} />
              Booster et mettre en avant
            </button>
          )}
          {!isOwner && (
            <button
              type="button"
              onClick={onReportListing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20"
            >
              <AlertTriangle size={16} />
              Signaler l’annonce
            </button>
          )}
          <button
            type="button"
            onClick={onViewSeller}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-night/10 bg-night/[0.02] px-4 py-3 text-sm font-medium text-night hover:bg-night/[0.05]"
          >
            Voir le profil vendeur
          </button>
        </div>
      </div>
    </aside>
  )
}

export function SellerReviewsSection({
  reviews,
  loading,
  formatDateFn,
}: {
  reviews: SellerReview[]
  loading: boolean
  formatDateFn: (value?: string) => string
}) {
  return (
    <div className="bg-white dark:bg-[var(--color-surface)] rounded-3xl border border-night/8 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-night">
        <Sparkles size={16} className="text-coral" />
        <h2 className="font-semibold">Avis acheteurs</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-16 rounded-2xl bg-sand animate-pulse" />
          <div className="h-16 rounded-2xl bg-sand animate-pulse" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-night/45">Soyez le premier à laisser un avis.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-night/8 bg-night/[0.02] p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-coral/10 text-coral font-semibold flex items-center justify-center overflow-hidden shrink-0">
                  {review.auteur_avatar ? (
                    <img src={review.auteur_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    review.auteur_prenom?.[0]?.toUpperCase() ?? '?'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-night truncate">{review.auteur_prenom ?? 'Acheteur'}</p>
                    <div className="flex items-center gap-0.5">{starsFor(review.note, 'w-3 h-3')}</div>
                  </div>
                  {review.commentaire && <p className="mt-1 text-sm leading-6 text-night/70">{review.commentaire}</p>}
                  {review.created_at && <p className="mt-1 text-[11px] text-night/40">{formatDateFn(review.created_at)}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReviewFormSection({
  canReview,
  submitting,
  feedback,
  error,
  reviewNote,
  reviewComment,
  onNoteChange,
  onCommentChange,
  onSubmit,
  onRequireAuth,
}: {
  canReview: boolean
  submitting: boolean
  feedback: string | null
  error: string | null
  reviewNote: number
  reviewComment: string
  onNoteChange: (value: number) => void
  onCommentChange: (value: string) => void
  onSubmit: () => void
  onRequireAuth?: () => void
}) {
  if (!canReview) {
    return (
      <div className="bg-white rounded-3xl border border-night/8 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-night">
          <BadgeCheck size={16} className="text-[var(--color-warning)]" />
          <h2 className="font-semibold">Laisser un avis</h2>
        </div>
        <p className="text-sm text-night/60 leading-6">
          Connectez-vous pour noter ce vendeur, ajouter des étoiles et partager votre retour avec la communauté.
        </p>
        {onRequireAuth ? (
          <button
            type="button"
            onClick={onRequireAuth}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-night px-4 py-3 text-sm font-medium text-white"
          >
            Se connecter pour noter
          </button>
        ) : (
          <button
            type="button"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-night px-4 py-3 text-sm font-medium text-white opacity-60"
            disabled
          >
            Se connecter pour noter
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-night/8 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-night">
        <BadgeCheck size={16} className="text-[var(--color-warning)]" />
        <h2 className="font-semibold">Laisser un avis</h2>
      </div>

      <p className="text-sm text-night/60 mb-3">
        Votre retour aide les autres acheteurs à faire confiance au vendeur.
      </p>

      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1
          const active = value <= reviewNote
          return (
            <button
              key={value}
              type="button"
              onClick={() => onNoteChange(value)}
              className={`w-9 h-9 rounded-xl border transition-colors flex items-center justify-center ${active ? 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]' : 'border-night/10 bg-white text-night/25 hover:text-[var(--color-warning)]'}`}
              aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
            >
              <BadgeCheck className={`w-4 h-4 ${active ? 'text-[var(--color-warning)]' : ''}`} />
            </button>
          )
        })}
      </div>

      <textarea
        value={reviewComment}
        onChange={(e) => onCommentChange(e.target.value)}
        rows={4}
        maxLength={500}
        placeholder="Votre avis sur le vendeur..."
        className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-coral/25 focus:border-coral resize-none"
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-night text-white px-4 py-3 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Publication...' : 'Publier mon avis'}
      </button>

      {feedback && <p className="mt-3 text-sm text-jungle">{feedback}</p>}
      {error && <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
    </div>
  )
}

export function SecurityTipsCard() {
  return (
    <div className="bg-[var(--color-warning)]/10 rounded-3xl border border-[var(--color-warning)]/30 p-5">
      <div className="flex items-center gap-2 mb-2 text-[var(--color-warning)]">
        <AlertTriangle size={16} />
        <h2 className="font-semibold">Conseils de sécurité</h2>
      </div>
      <ul className="space-y-2 text-sm text-[var(--color-warning)] leading-6">
        <li>- N'envoyez jamais d'argent avant d'avoir vérifié l'annonce et le vendeur.</li>
        <li>- Préférez l'échange en personne dans un lieu public.</li>
        <li>- Gardez toutes les discussions dans Kalico pour faciliter la modération.</li>
      </ul>
    </div>
  )
}

export function SellerListingsSection({
  items,
  sellerId,
}: {
  items: SellerListing[]
  sellerId: number | string
}) {
  if (items.length === 0) return null

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-night">Autres articles du vendeur</h2>
          <p className="text-sm text-night/50">Ses autres annonces sur Kalico.</p>
        </div>
        <Link href={`/profil/${sellerId}`} className="text-sm text-coral hover:underline">
          Voir tous ses articles
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/annonces/${item.id}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-night/5"
          >
            <div className="aspect-[4/3] bg-sand overflow-hidden relative">
              {item.cover_image ? (
                <ListingImageComponent
                  src={item.cover_image}
                  alt={item.title ?? item.titre ?? 'Annonce'}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  imgClassName="group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">📦</div>
              )}
              {item.category_icon && (
                <span className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-1 text-xs shadow-sm">
                  {item.category_icon}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-night line-clamp-2 leading-tight mb-1">
                {item.title ?? item.titre}
              </p>
              <p className="text-base font-bold text-coral">
                {item.prix != null || item.price != null
                  ? `${(item.prix ?? item.price ?? 0).toLocaleString('fr-FR')} XPF`
                  : <span className="text-night/40 font-normal text-sm">Prix libre</span>}
              </p>
              {item.commune_name && (
                <p className="flex items-center gap-1 text-[11px] text-night/40 mt-1">
                  <MapPin size={10} />
                  {item.commune_name}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function RelatedSearchesSection({
  searches,
}: {
  searches: Array<{ label: string; href: string; tone: string }>
}) {
  return (
    <section className="mt-8 bg-white rounded-3xl border border-night/8 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-night">
        <Search size={16} className="text-ocean" />
        <h2 className="font-semibold">Recherches associees</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {searches.map((search) => (
          <Link
            key={`${search.label}-${search.href}`}
            href={search.href}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-transform hover:-translate-y-0.5 ${search.tone}`}
          >
            {search.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

````

## PATH: frontend/src/components/listings/ListingCard.tsx
````
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Clock, Heart, MailCheck, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '@/store/authStore'
import { useFavorite } from '@/hooks/useFavorite'
import ListingImage from '@/components/ListingImage'
import { consumePendingAuthAction, peekPendingAuthAction } from '@/lib/authAction'
import { useAuthActionStore } from '@/store/authActionStore'

export { ListingSkeleton as ListingCardSkeleton, ListingSkeletonGrid as ListingGridSkeleton } from '@/components/ListingSkeleton'

interface Listing {
  id: string
  type?: string
  title: string
  price: number | null
  price_negotiable: boolean
  is_free: boolean
  condition?: string
  is_featured: boolean
  is_urgent: boolean
  published_at?: string
  created_at?: string
  boosted_until?: string | null
  contre_quoi?: string | null
  is_troc?: boolean
  commune_name?: string
  category_name?: string
  category_slug?: string
  category_icon?: string
  cover_image?: string
  distance_km?: number | null
  metadata?: Record<string, unknown>
  user_rating?: number
  seller_trust_score?: number
  seller_email_verified?: boolean
  seller_phone_verified?: boolean
  is_pro?: boolean
  seller_is_pro?: boolean
  seller_pro_verified?: boolean
  seller_prenom?: string | null
  seller_nom?: string | null
  seller_avatar?: string | null
  author?: {
    is_pro?: boolean
    pro_verified?: boolean
  } | null
  seller_is_online?: boolean
  seller_last_seen_label?: string | null
  seller_avg_response_time_label?: string | null
  seller_note_moyenne?: number | null
  seller_nb_avis?: number | null
}

interface Props {
  listing: Listing
  className?: string
  boosted?: boolean
  featured?: boolean
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon Ã©tat',
  fair: 'Correct',
  for_parts: 'Pour piÃ¨ces',
}

const blurPlaceholder = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getListingCategoryLabel(listing: Listing) {
  if (listing.category_name) return listing.category_name
  const slug = String(listing.category_slug ?? '').replaceAll('_', ' ')
  if (!slug) return 'Annonce'
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}
function getListingCategoryInitial(listing: Listing) {
  const label = getListingCategoryLabel(listing)
  return label.trim().charAt(0).toUpperCase() || 'A'
}

function getListingBadgeClass(listing: Listing) {
  const kind = String(listing.type || '').trim().toLowerCase()
  if (kind === 'bon_plan') return 'badge-emeraude'
  if (kind === 'covoiturage') return 'badge-corail'
  if (kind === 'evenement') return 'badge-sable'
  return 'badge-lagon'
}

function getListingFrameClass(listing: Listing) {
  const kind = String(listing.type || '').trim().toLowerCase()
  if (kind === 'bon_plan') return 'border-l-nc-emeraude'
  if (kind === 'covoiturage') return 'border-l-nc-corail'
  if (kind === 'evenement') return 'border-l-nc-sable'
  return 'border-l-nc-lagon'
}

function buildInitials(listing: Listing) {
  const first = (listing.seller_prenom ?? '').trim().charAt(0)
  const last = (listing.seller_nom ?? '').trim().charAt(0)
  const fallback = (listing.title ?? '').trim().charAt(0)
  return `${first}${last}`.trim() || fallback || 'T'
}

function SellerAvatar({ listing }: { listing: Listing }) {
  const initials = buildInitials(listing).toUpperCase()

  if (listing.seller_avatar) {
    return (
      <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/80 bg-sand">
        <Image
          src={listing.seller_avatar}
          alt=""
          fill
          sizes="36px"
          loading="lazy"
          className="object-cover"
        />
      </span>
    )
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/80 bg-coral/10 text-xs font-bold text-coral">
      {initials}
    </span>
  )
}

function ListingImageFrame({
  listing,
  loaded,
  setLoaded,
  saved,
  isLoading,
  onFavorite,
  featuredCard,
}: {
  listing: Listing
  loaded: boolean
  setLoaded: (value: boolean) => void
  saved: boolean
  isLoading: boolean
  onFavorite: (event: React.MouseEvent<HTMLButtonElement>) => void
  featuredCard: boolean
}) {
  const hasCoverImage = Boolean(listing.cover_image)
  const categoryInitial = getListingCategoryInitial(listing)
  const [imageTimedOut, setImageTimedOut] = useState(false)
  const priceLabel = listing.is_free
    ? 'Gratuit'
    : listing.price
      ? `${listing.price.toLocaleString('fr-FR')} XPF`
      : 'Prix à débattre'

  useEffect(() => {
    if (!hasCoverImage) return undefined

    setImageTimedOut(false)
    const timer = window.setTimeout(() => setImageTimedOut(true), 8_000)
    return () => window.clearTimeout(timer)
  }, [hasCoverImage, listing.id])

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-raised)]">
      {hasCoverImage ? (
        <ListingImage
          src={listing.cover_image}
          alt={listing.title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL={blurPlaceholder}
          onLoadingComplete={() => setLoaded(true)}
          imgClassName={`h-full w-full object-cover transition-transform ease-out ${featuredCard ? 'duration-200 group-hover:scale-[1.02]' : 'duration-150 group-hover:scale-[1.01]'} motion-reduce:transition-none motion-reduce:transform-none ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-raised)]">
          <span className="text-6xl font-semibold text-night/20">{categoryInitial}</span>
        </div>
      )}

      {hasCoverImage && !loaded && !imageTimedOut ? <div className="skeleton absolute inset-0 rounded-none" aria-hidden="true" /> : null}

      {featuredCard ? (
        <>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.55))]" />
          <div className="absolute bottom-3 left-3 z-10 text-base font-medium text-white">{priceLabel}</div>
          <div className="absolute right-3 top-3 z-10 rounded bg-coral px-2 py-0.5 text-xs font-medium text-white shadow-sm">
            À la une
          </div>
        </>
      ) : null}

      <button
        type="button"
        onClick={onFavorite}
        disabled={isLoading}
        aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className={`absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-night/50 shadow-md backdrop-blur-sm transition duration-150 hover:scale-110 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 ${
          isLoading ? 'cursor-wait opacity-50' : ''
        }`}
      >
        <Heart className={`h-3.5 w-3.5 ${saved ? 'fill-coral text-coral' : ''}`} />
      </button>
    </div>
  )
}
export default function ListingCard({ listing, className = '', boosted, featured }: Props) {
  const { isAuthenticated } = useAuthStore()
  const { isFavorited, toggleFavorite, isToggling } = useFavorite()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const replayedRef = useRef(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const saved = isFavorited(listing.id)
  const isLoading = isToggling.has(listing.id)

  useEffect(() => {
    replayedRef.current = false
    setImageLoaded(false)
  }, [listing.id])

  useEffect(() => {
    if (!isAuthenticated || replayedRef.current) return

    const pending = peekPendingAuthAction()
    if (!pending || pending.type !== 'favorite_listing' || pending.listingId !== listing.id) return

    replayedRef.current = true
    consumePendingAuthAction()
    void toggleFavorite({
      id: listing.id,
      titre: listing.title,
      prix: listing.price,
      cover_image: listing.cover_image ?? null,
      commune: listing.commune_name ?? null,
      category: listing.category_name ?? null,
    })
  }, [
    isAuthenticated,
    listing.category_name,
    listing.commune_name,
    listing.cover_image,
    listing.id,
    listing.price,
    listing.title,
    toggleFavorite,
  ])

  const handleFavorite = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!isAuthenticated) {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : `/annonces/${listing.id}`
      openAuthModal({
        type: 'favorite_listing',
        listingId: listing.id,
        redirectTo,
      })
      return
    }

    await toggleFavorite({
      id: listing.id,
      titre: listing.title,
      prix: listing.price,
      cover_image: listing.cover_image ?? null,
      commune: listing.commune_name ?? null,
      category: listing.category_name ?? null,
    })
  }

  const priceText = listing.is_free
    ? 'Gratuit'
    : listing.price
      ? `${listing.price.toLocaleString('fr-FR')} XPF`
      : 'Prix Ã  dÃ©battre'
  const priceClassName = listing.is_free ? 'text-jungle' : 'text-coral'

  const publishedAt = listing.published_at ?? listing.created_at ?? new Date().toISOString()
  const timeAgo = formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
    locale: fr,
  })

  const sellerName =
    [listing.seller_prenom, listing.seller_nom].filter(Boolean).join(' ').trim() ||
    'Vendeur Kalico'

  const isConditionVisible = Boolean(listing.condition && CONDITION_LABELS[listing.condition])
  const locationZone = typeof listing.metadata?.quartier_zone === 'string' ? String(listing.metadata.quartier_zone).trim() : ''
  const locationText = listing.commune_name
    ? `${listing.commune_name}${locationZone ? ` Ã‚Â· ${locationZone}` : ''}`
    : 'Nouvelle-CalÃ©donie'
  const isProVerified = Boolean(
    (listing.author?.is_pro && listing.author?.pro_verified)
    || (listing.is_pro && listing.seller_pro_verified)
    || (listing.seller_is_pro && listing.seller_pro_verified)
  )

  const level2 = Boolean((featured ?? boosted ?? listing.is_featured) || Boolean(listing.boosted_until && new Date(listing.boosted_until) > new Date()))

  return (
    <Link
      href={`/annonces/${listing.id}`}
      className={`group block overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-white shadow-sm transform-gpu transition-all ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        level2
          ? 'duration-200 hover:scale-[1.02] hover:shadow-[0_14px_36px_rgba(8,32,50,0.18)]'
          : 'duration-150 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
      } ${className}`}
    >
      <ListingImageFrame
        listing={listing}
        loaded={imageLoaded}
        setLoaded={setImageLoaded}
        saved={saved}
        isLoading={isLoading}
        onFavorite={handleFavorite}
        featuredCard={level2}
      />

      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-6 text-night transition-colors duration-150 group-hover:text-coral">
            {listing.title}
          </h3>
          {level2 ? null : (
            <div className={`text-lg font-medium leading-tight ${priceClassName}`}>
              {priceText}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-text-tertiary)]">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{locationText}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <SellerAvatar listing={listing} />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-sm font-semibold text-night">{sellerName}</p>
                {isProVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <BadgeCheck className="h-3 w-3" />
                    Pro
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-night/50">
                {listing.seller_email_verified ? (
                  <span className="inline-flex items-center gap-1">
                    <MailCheck className="h-3 w-3" />
                    Email vérifié
                  </span>
                ) : null}
                {listing.seller_phone_verified ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Téléphone vérifié
                  </span>
                ) : null}
                {listing.seller_trust_score != null ? (
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {Math.round(listing.seller_trust_score)}/100
                  </span>
                ) : null}
                {isConditionVisible ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-night/65">
                    {CONDITION_LABELS[listing.condition!]}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                  listing.seller_is_online ? 'bg-emerald-50 text-emerald-700' : 'bg-sand text-night/45'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${listing.seller_is_online ? 'bg-emerald-500' : 'bg-night/25'}`} />
                  {listing.seller_is_online ? 'En ligne' : (listing.seller_last_seen_label ?? 'Hors ligne')}
                </span>
                {listing.seller_avg_response_time_label && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-nc-lagonLight px-2 py-0.5 font-medium text-nc-lagonText">
                    <Clock className="h-3 w-3" />
                    {listing.seller_avg_response_time_label}
                  </span>
                )}
                {typeof listing.seller_note_moyenne === 'number' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-nc-emeraudeLight px-2 py-0.5 font-medium text-nc-emeraudeText">
                    <BadgeCheck className="h-3 w-3" />
                    {listing.seller_note_moyenne.toFixed(1)}/5
                    <span className="text-current/70">({listing.seller_nb_avis ?? 0})</span>
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Link>
  )
}

````

## PATH: frontend/src/components/PublishWizard/PublishWizard.tsx
````
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import {
  ArrowLeft,
  CalendarDays,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Layers3,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { listingsApi, metaApi, uploadApi } from '@/lib/api'
import { useAutosave, useBeforeUnload } from '@/hooks/useAutosave'
import { useAuthStore } from '@/store/authStore'
import CategoryFields from '@/components/annonces/CategoryFields'
import ListingCoachCard from '@/components/annonces/ListingCoachCard'
import { FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'
import { getCategoryIcon } from '@/lib/categoryPresentation'
import { compressImage } from '@/lib/imageCompressor'
import { findCategoryNodeById, findCategoryPathById } from '@/shared-copy/categoryTaxonomy'

type CommuneOption = {
  id: number
  name: string
  province_name?: string | null
  slug?: string
}

type ProvinceOption = {
  id: number
  name: string
  slug: string
  code?: string
  communes: CommuneOption[]
}

type CategoryOption = {
  id: number
  name: string
  slug: string
  icon?: string
  children?: CategoryOption[]
  subcategories?: CategoryOption[]
}

type WizardDraft = {
  step: number
  title: string
  category_id: string
  description: string
  price: string
  commune_id: string
  quartier_zone: string
  duration_days: string
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'for_parts'
  price_negotiable: boolean
  is_free: boolean
  is_troc: boolean
  contre_quoi: string
  metadata: Record<string, unknown>
}

type PhotoItem = {
  id: string
  file: File
  preview: string
}

const INITIAL_DRAFT: WizardDraft = {
  step: 1,
  title: '',
  category_id: '',
  description: '',
  price: '',
  commune_id: '',
  quartier_zone: '',
  duration_days: '30',
  condition: 'good',
  price_negotiable: false,
  is_free: false,
  is_troc: false,
  contre_quoi: '',
  metadata: {},
}

const PREVIEW_STORAGE_KEY = 'preview_listing'

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function getCategoryChildren(category?: CategoryOption | null) {
  return category?.children || category?.subcategories || []
}

function flattenCommunes(provinces: ProvinceOption[]) {
  return provinces.flatMap((province) => (
    province.communes.map((commune) => ({
      ...commune,
      province_id: province.id,
      province_name: province.name,
      province_slug: province.slug,
    }))
  ))
}

function isLeafCategory(category?: CategoryOption | null) {
  return getCategoryChildren(category).length === 0
}

function snapTo10(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number(String(value || '').trim())
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.round(parsed / 10) * 10)
}

function StepBadge({ index, active, done }: { index: number; active: boolean; done: boolean }) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
        done ? 'bg-jungle text-white' : active ? 'bg-night text-white' : 'bg-sand text-night/45'
      }`}
    >
      {done ? <Check className="h-4 w-4" /> : index}
    </div>
  )
}

function WizardStepper({ step }: { step: number }) {
  const items = [
    { label: 'Détails', index: 1 },
    { label: 'Photos', index: 2 },
    { label: 'Publication', index: 3 },
  ]

  return (
    <div className="rounded-[1.75rem] border border-night/8 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {items.map((item, idx) => {
          const active = step === item.index
          const done = step > item.index
          return (
            <div key={item.label} className="flex flex-1 items-center gap-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <StepBadge index={item.index} active={active} done={done} />
                <span className={`text-xs font-semibold ${active ? 'text-night' : 'text-night/45'}`}>{item.label}</span>
              </div>
              {idx < items.length - 1 && <div className="h-px flex-1 bg-night/10" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PhotoGrid({
  photos,
  onAddFiles,
  onRemove,
  onMove,
}: {
  photos: PhotoItem[]
  onAddFiles: (files: FileList | File[]) => void | Promise<void>
  onRemove: (index: number) => void
  onMove: (from: number, to: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div className="space-y-4">
      <div
        className={`rounded-[1.75rem] border-2 border-dashed p-5 transition-colors ${
          dragOver ? 'border-coral bg-coral/5' : 'border-night/15 bg-sand/20'
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          if (event.dataTransfer.files.length) {
            void onAddFiles(event.dataTransfer.files)
          }
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-coral shadow-sm">
            <ImagePlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-night">
              {dragOver ? 'Déposez vos photos ici' : 'Ajoutez 1 à 8 photos'}
            </p>
            <p className="mt-1 text-sm text-night/55">
              Glissez-déposez ou cliquez pour choisir vos images. Les 8 premières sont conservées.
            </p>
          </div>
          <p className="text-xs text-night/40">JPEG, PNG, WebP, HEIC</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) {
            void onAddFiles(event.target.files)
          }
          event.target.value = ''
        }}
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex != null && dragIndex !== index) {
                  onMove(dragIndex, index)
                }
                setDragIndex(null)
              }}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-night/10 bg-sand"
            >
              <img src={photo.preview} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-night/70 to-transparent p-3 text-white">
                <span className="truncate text-xs font-medium">{photo.file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                  aria-label="Supprimer la photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {index === 0 && (
                <div className="absolute left-3 top-3 rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                  Principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PublicationPreview({
  draft,
  selectedCategory,
  selectedCommune,
}: {
  draft: WizardDraft
  selectedCategory?: CategoryOption | null
  selectedCommune?: CommuneOption | null
}) {
  return (
    <div className="rounded-[2rem] border border-night/8 bg-[#0c2a35] p-5 text-white shadow-[0_24px_80px_rgba(8,32,50,0.18)]">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
        <Sparkles className="h-3.5 w-3.5" />
        Aperçu
      </div>

      <p className="mt-4 text-sm uppercase tracking-[0.18em] text-white/45">Résumé rapide</p>
      <p className="mt-2 text-3xl font-bold text-white">
        {draft.price ? `${Number(draft.price || 0).toLocaleString('fr-FR')} XPF` : '0 XPF'}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        {draft.title.trim() || "Votre annonce s'affichera ici en temps réel."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Catégorie</p>
          <p className="mt-2 text-sm font-semibold text-white">{selectedCategory?.name || 'À choisir'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Commune</p>
          <p className="mt-2 text-sm font-semibold text-white">{selectedCommune?.name || 'À compléter'}</p>
        </div>
      </div>
    </div>
  )
}

export default function PublishWizard() {
  const router = useRouter()
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const userId = useAuthStore((state) => state.user?.id ?? 'guest')
  const [draft, setDraft] = useState<WizardDraft>(INITIAL_DRAFT)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [communces, setCommunces] = useState<ProvinceOption[]>([])
  const [zoneOptions, setZoneOptions] = useState<string[]>([])
  const [zoneLoading, setZoneLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoryTrailIds, setCategoryTrailIds] = useState<number[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const metadataForm = useForm<{ metadata: Record<string, unknown> }>({ defaultValues: { metadata: {} } })
  const {
    register: registerMetadata,
    formState: { errors: metadataErrors },
  } = metadataForm
  const metadataValues = metadataForm.watch()
  const metadataPayload = metadataValues?.metadata ?? {}
  const metadataSignature = JSON.stringify(metadataPayload)

  const {
    pendingDraft,
    draftAgeLabel,
    isDirty,
    acceptDraft,
    discardDraft,
    clearDraft,
  } = useAutosave(`draft_listing_${userId}`, draft, 30_000)
  useBeforeUnload(isDirty && !submitting)

  useEffect(() => {
    let alive = true
    Promise.all([metaApi.getCommunes(), metaApi.getCategories()])
      .then(([communesRes, categoriesRes]) => {
        if (!alive) return
        setCommunces(communesRes.data?.data ?? [])
        const rawCategories = categoriesRes.data?.data ?? []
        setCategories(
          isDemoMode
            ? (FALLBACK_CATEGORIES as unknown as CategoryOption[])
            : (Array.isArray(rawCategories) ? rawCategories : [])
        )
      })
      .catch(() => {
        if (!alive) return
        setCommunces([])
        setCategories(FALLBACK_CATEGORIES as unknown as CategoryOption[])
      })
      .finally(() => {
        if (alive) setLoadingMeta(false)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!pendingDraft) return
    setDraft((current) => ({
      ...current,
      ...pendingDraft.data,
      step: Number(pendingDraft.data.step || current.step),
    }))
    metadataForm.reset({ metadata: (pendingDraft.data.metadata as Record<string, unknown>) ?? {} })
  }, [pendingDraft])

  useEffect(() => {
    setDraft((current) => {
      const currentSignature = JSON.stringify(current.metadata ?? {})
      if (currentSignature === metadataSignature) {
        return current
      }
      return {
        ...current,
        metadata: metadataPayload,
      }
    })
  }, [metadataSignature, metadataPayload])

  useEffect(() => {
    if (!categories.length) return
    if (!draft.category_id) return

    const path = findCategoryPathById(categories as any, draft.category_id)
    if (!path.length) return

    setCategoryTrailIds(path.map((node) => Number(node.id)))

    const last = path[path.length - 1]
    if (last && !isLeafCategory(last)) {
      setDraft((current) => ({
        ...current,
        category_id: '',
      }))
    }
  }, [categories, draft.category_id])

  useEffect(() => {
    return () => {
      for (const photo of photos) {
        if (photo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(photo.preview)
        }
      }
    }
  }, [photos])

  const selectedCommune = useMemo(
    () => flattenCommunes(communces).find((item) => String(item.id) === draft.commune_id),
    [communces, draft.commune_id]
  )

  useEffect(() => {
    let alive = true

    if (!selectedCommune?.slug) {
      setZoneOptions([])
      setZoneLoading(false)
      return () => {
        alive = false
      }
    }

    setZoneLoading(true)
    metaApi.getZones(selectedCommune.slug)
      .then((response) => {
        if (!alive) return
        const zones = Array.isArray(response.data?.data?.zones) ? response.data.data.zones : []
        setZoneOptions(zones.filter(Boolean))
      })
      .catch(() => {
        if (!alive) return
        setZoneOptions([])
      })
      .finally(() => {
        if (alive) setZoneLoading(false)
      })

    return () => {
      alive = false
    }
  }, [selectedCommune?.slug])

  const selectedCategory = useMemo(
    () => findCategoryNodeById((isDemoMode ? FALLBACK_CATEGORIES : categories) as any, draft.category_id),
    [categories, draft.category_id, isDemoMode]
  )

  const activeCategoryNode = useMemo(() => {
    if (!categoryTrailIds.length) return null
    return findCategoryNodeById(categories as any, categoryTrailIds[categoryTrailIds.length - 1])
  }, [categories, categoryTrailIds])

  const activeCategoryChildren = useMemo(() => {
    if (!activeCategoryNode) return isDemoMode ? FALLBACK_CATEGORIES : categories
    return getCategoryChildren(activeCategoryNode)
  }, [activeCategoryNode, categories, isDemoMode])

  const categoryTrail = useMemo(() => {
    if (!categoryTrailIds.length) return []
    return categoryTrailIds
      .map((id) => findCategoryNodeById((isDemoMode ? FALLBACK_CATEGORIES : categories) as any, id))
      .filter(Boolean) as CategoryOption[]
  }, [categories, categoryTrailIds, isDemoMode])

  const selectedCategoryPath = useMemo(() => {
    if (!draft.category_id) return []
    return findCategoryPathById((isDemoMode ? FALLBACK_CATEGORIES : categories) as any, draft.category_id) as CategoryOption[]
  }, [categories, draft.category_id, isDemoMode])

  const canGoNext = useMemo(() => {
    if (draft.step === 1) {
      return Boolean(
        draft.title.trim() &&
        draft.category_id &&
        draft.description.trim() &&
        selectedCategory &&
        isLeafCategory(selectedCategory)
      )
    }
    if (draft.step === 2) {
      return photos.length >= 1 && photos.length <= 8
    }
    return Boolean(draft.price.trim() && draft.commune_id && draft.duration_days)
  }, [draft, photos.length, selectedCategory])

  const restoreDraft = () => {
    const pending = pendingDraft
    if (!pending) return
    setDraft((current) => ({
      ...current,
      ...pending.data,
      step: Number(pending.data.step || current.step),
    }))
    metadataForm.reset({ metadata: (pending.data.metadata as Record<string, unknown>) ?? {} })
    acceptDraft(pending)
    setError('')
    setSuccess(null)
  }

  const ignoreDraft = () => {
    discardDraft()
    metadataForm.reset({ metadata: {} })
  }

  const openCategoryNode = (category: CategoryOption) => {
    const nextPath = [...categoryTrailIds]
    const existingIndex = nextPath.indexOf(category.id)
    if (existingIndex >= 0) {
      setCategoryTrailIds(nextPath.slice(0, existingIndex + 1))
    } else {
      setCategoryTrailIds([...nextPath, category.id])
    }

    const children = getCategoryChildren(category)
    if (children.length === 0) {
      setDraft((current) => ({
        ...current,
        category_id: String(category.id),
      }))
      return
    }

    setDraft((current) => ({
      ...current,
      category_id: '',
    }))
  }

  const selectCategoryLeaf = (category: CategoryOption) => {
    const path = findCategoryPathById(categories as any, category.id)
    setCategoryTrailIds(path.map((node) => Number(node.id)))
    setDraft((current) => ({
      ...current,
      category_id: String(category.id),
    }))
  }

  const goToCategoryLevel = (index: number) => {
    setCategoryTrailIds((current) => current.slice(0, index + 1))
    const targetId = categoryTrailIds[index]
    const targetNode = targetId ? findCategoryNodeById(categories as any, targetId) : null
    if (targetNode && isLeafCategory(targetNode)) {
      setDraft((current) => ({
        ...current,
        category_id: String(targetNode.id),
      }))
    } else {
      setDraft((current) => ({
        ...current,
        category_id: '',
      }))
    }
  }

  const addPhotos = async (files: FileList | File[]) => {
    const incoming = Array.from(files)
    if (!incoming.length) return

    const optimizedFiles = await Promise.all(
      incoming.slice(0, 8).map(async (file) => {
        if (!file.type.startsWith('image/')) return file
        try {
          return await compressImage(file)
        } catch {
          return file
        }
      })
    )

    setPhotos((current) => {
      const combined = [...current]
      for (const file of optimizedFiles) {
        if (combined.length >= 8) break
        combined.push({
          id: makeId(),
          file,
          preview: URL.createObjectURL(file),
        })
      }
      return combined
    })
    setError('')
  }

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      const target = current[index]
      if (target?.preview.startsWith('blob:')) {
        URL.revokeObjectURL(target.preview)
      }
      return current.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  const movePhoto = (from: number, to: number) => {
    setPhotos((current) => moveItem(current, from, to))
  }

  const handlePreview = async () => {
    const validation = validateStep()
    if (validation) {
      setError(validation)
      return
    }

    if (selectedCategory?.slug && isLeafCategory(selectedCategory) && !(await metadataForm.trigger())) {
      setError('Merci de compléter les caractéristiques spécifiques.')
      return
    }

    if (typeof window === 'undefined') return

    const payload = {
      draft: {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        contre_quoi: draft.contre_quoi.trim(),
        metadata: metadataPayload,
      },
      category_name: selectedCategory?.name ?? null,
      commune_name: selectedCommune?.name ?? null,
      quartier_zone: draft.quartier_zone || null,
      photos: photos.map((photo, index) => ({
        id: photo.id,
        name: photo.file.name,
        preview: photo.preview,
        isPrimary: index === 0,
      })),
      updated_at: new Date().toISOString(),
    }

    try {
      window.sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(payload))
      window.open('/annonces/preview', '_blank')
    } catch {
      setError('Impossible d’ouvrir la prévisualisation pour le moment.')
    }
  }

  const validateStep = () => {
    if (draft.step === 1) {
      if (!draft.title.trim()) return 'Le titre est requis.'
      if (!draft.category_id) return 'La catégorie est requise.'
      if (!selectedCategory || !isLeafCategory(selectedCategory)) return 'Choisissez la sous-catégorie finale.'
      if (!draft.description.trim()) return 'La description est requise.'
    }
    if (draft.step === 2) {
      if (photos.length < 1) return 'Ajoutez au moins une photo.'
      if (photos.length > 8) return 'Vous ne pouvez pas dépasser 8 photos.'
    }
    if (draft.step === 3) {
      if (!draft.price.trim()) return 'Le prix est requis.'
      if (!draft.commune_id) return 'La localisation est requise.'
      if (!draft.duration_days) return 'La durée est requise.'
    }
    return ''
  }

  const handleNext = async () => {
    const validation = validateStep()
    if (validation) {
      setError(validation)
      return
    }
    if (draft.step === 1 && selectedCategory?.slug && isLeafCategory(selectedCategory) && !(await metadataForm.trigger())) {
      setError('Merci de compléter les caractéristiques spécifiques.')
      return
    }
    setError('')
    setDraft((current) => ({ ...current, step: Math.min(3, current.step + 1) }))
  }

  const handlePrevious = () => {
    setError('')
    setDraft((current) => ({ ...current, step: Math.max(1, current.step - 1) }))
  }

  const handleSubmit = async () => {
    const validation = validateStep()
    if (validation) {
      setError(validation)
      return
    }

    if (selectedCategory?.slug && isLeafCategory(selectedCategory) && !(await metadataForm.trigger())) {
      setError('Merci de compléter les caractéristiques spécifiques.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const normalizedMetadata = Object.fromEntries(
        Object.entries(metadataPayload).map(([key, value]) => {
          if (!(/_xpf$|price|tarif/i.test(key))) return [key, value]
          if (value == null || value === '') return [key, value]
          const parsed = Number(value)
          return Number.isFinite(parsed) ? [key, snapTo10(parsed)] : [key, value]
        }),
      )

      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        category_id: Number(draft.category_id),
        commune_id: Number(draft.commune_id),
        condition: draft.condition,
        price: draft.is_free ? null : snapTo10(draft.price),
        is_free: draft.is_free,
        is_troc: draft.is_troc,
        contre_quoi: draft.is_troc ? draft.contre_quoi.trim() : '',
        price_negotiable: draft.price_negotiable,
        is_negotiable: draft.price_negotiable,
        duration_days: Number(draft.duration_days),
        metadata: {
          ...normalizedMetadata,
          quartier_zone: draft.quartier_zone || null,
        },
      }

      const response = await listingsApi.create(payload)
      const createdId = response.data?.data?.id
      if (!createdId) {
        throw new Error('Impossible de créer l’annonce.')
      }

      if (photos.length) {
        await uploadApi.uploadImages(String(createdId), photos.map((photo) => photo.file))
      }

      clearDraft()
      setSuccess('Annonce publiée avec succès.')
      router.push(`/annonces/${createdId}?published=1`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'La publication a échoué.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const stepTitle = draft.step === 1
    ? 'Décrivez votre annonce'
    : draft.step === 2
      ? 'Ajoutez vos photos'
      : 'Derniers détails'

  return (
    <div className="min-h-screen bg-sand-light">
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="mt-3 font-display text-3xl font-bold text-night md:text-4xl">{stepTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night/60 md:text-base">
              Un parcours en 3 étapes pour publier vite, sans perdre de données.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/annonces/nouvelle?mode=simple')}
              className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-2.5 text-sm font-semibold text-night shadow-sm transition hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Mode simple
            </button>
          </div>
        </div>

        {pendingDraft ? (
          <div className="mb-6 rounded-[1.5rem] border border-lagoon/20 bg-lagoon/8 p-4 text-night shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Brouillon restauré</p>
                <p className="mt-1 text-sm text-night/70">
                  Brouillon restauré {draftAgeLabel ? `- ${draftAgeLabel}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={restoreDraft} className="rounded-2xl bg-night px-4 py-2 text-sm font-semibold text-white transition hover:bg-night/90">
                  Restaurer
                </button>
                <button type="button" onClick={ignoreDraft} className="rounded-2xl border border-night/10 bg-white px-4 py-2 text-sm font-semibold text-night transition hover:bg-sand">
                  Ignorer
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="space-y-5 rounded-[2rem] border border-night/8 bg-white/95 p-5 shadow-card">
            <WizardStepper step={draft.step} />

            {error ? (
              <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
                {success}
              </div>
            ) : null}

            {draft.step === 1 && (
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Titre *</span>
                  <input
                    value={draft.title}
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ex. iPhone 14 en excellent état"
                    className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-semibold text-night">Catégorie *</span>
                  <div className="rounded-[1.5rem] border border-night/10 bg-sand/30 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-night/45">
                      <Layers3 className="h-3.5 w-3.5 text-lagoon" />
                      {categoryTrail.length > 0 ? (
                        categoryTrail.map((node, index) => (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => goToCategoryLevel(index)}
                            className="rounded-full bg-white px-2.5 py-1 text-night/70 transition hover:bg-sand hover:text-night"
                          >
                            {(() => {
                              const TrailIcon = getCategoryIcon(node.slug, node.name, node.icon)
                              return <TrailIcon className="mr-1 inline-block h-3.5 w-3.5 align-[-2px] text-nc-lagon" />
                            })()}
                            {node.name}
                          </button>
                        ))
                      ) : (
                        <span>Choisissez une famille puis la sous-catégorie finale</span>
                      )}
                    </div>

                    {loadingMeta ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-night/10 bg-white/70 px-4 py-6 text-center text-sm text-night/45">
                        Chargement des catégories...
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-night">
                              {activeCategoryNode ? activeCategoryNode.name : 'Catégories principales'}
                            </p>
                            <p className="mt-1 text-xs text-night/45">
                              {activeCategoryNode
                                ? 'Choisissez une sous-catégorie finale.'
                                : 'Commencez par une famille.'}
                            </p>
                          </div>
                          {categoryTrail.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => goToCategoryLevel(Math.max(0, categoryTrail.length - 2))}
                              className="rounded-full border border-night/10 bg-white px-3 py-2 text-xs font-semibold text-night/70 transition hover:bg-sand"
                            >
                              {categoryTrail.length > 1 ? 'Retour' : 'Racine'}
                            </button>
                          ) : null}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {activeCategoryChildren.map((category) => {
                            const children = getCategoryChildren(category)
                            const selected = draft.category_id === String(category.id)
                            const parentActive = categoryTrail.some((node) => node.id === category.id)
                            const CategoryIcon = getCategoryIcon(category.slug, category.name, category.icon)

                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => (children.length > 0 ? openCategoryNode(category) : selectCategoryLeaf(category))}
                                className={`group flex min-h-[88px] items-start gap-3 rounded-2xl border p-4 text-left transition ${
                                  selected
                                    ? 'border-nc-lagon bg-nc-lagon text-white shadow-[0_18px_35px_rgba(30,144,255,0.18)]'
                                    : parentActive
                                      ? 'border-lagoon/40 bg-lagoon/8 text-night'
                                      : 'border-night/10 bg-white hover:border-lagoon/25 hover:bg-sand'
                                }`}
                              >
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                                  selected ? 'bg-white/15 text-white' : 'bg-sand text-lagoon'
                                }`}>
                                  <CategoryIcon className="h-5 w-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block font-semibold">{category.name}</span>
                                  <span className={`mt-1 block text-xs ${selected ? 'text-white/70' : 'text-night/45'}`}>
                                    {children.length > 0
                                      ? `${children.length} sous-catégorie${children.length > 1 ? 's' : ''}`
                                      : 'Catégorie finale'}
                                  </span>
                                </span>
                              </button>
                            )
                          })}
                        </div>

                        {selectedCategoryPath.length > 0 ? (
                          <div className="rounded-2xl border border-nc-lagon/20 bg-nc-lagon/8 px-4 py-3 text-sm text-night">
                            <p className="font-semibold text-night">Catégorie finale sélectionnée</p>
                            <p className="mt-1 text-night/65">
                              {selectedCategoryPath.map((node) => node.name).join(' / ')}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-night">Description *</span>
                  <textarea
                    value={draft.description}
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                    rows={6}
                    placeholder="Décrivez l'état, l'historique, les accessoires inclus et ce qui rassure l'acheteur."
                    className="w-full rounded-3xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                  />
                </label>

                {selectedCategory?.slug ? (
                  <CategoryFields
                    categorySlug={selectedCategory.slug}
                    register={registerMetadata}
                    errors={metadataErrors}
                  />
                ) : null}
              </div>
            )}

            {draft.step === 2 && (
              <div className="space-y-4">
                <PhotoGrid photos={photos} onAddFiles={addPhotos} onRemove={removePhoto} onMove={movePhoto} />
                <p className="text-xs text-night/45">
                  Ajoutez jusqu&apos;à 8 photos. Le réordonnancement conserve la première photo comme couverture principale.
                </p>
              </div>
            )}

            {draft.step === 3 && (
              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-nc-lagon/20 bg-nc-lagon/6 p-4 shadow-sm">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={draft.is_troc}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          is_troc: event.target.checked,
                          contre_quoi: event.target.checked ? current.contre_quoi : '',
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-night/20 text-nc-lagon focus:ring-nc-lagon/20"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-night">Troc possible</span>
                      <span className="mt-1 block text-xs leading-relaxed text-night/60">
                        Les autres utilisateurs pourront vous proposer un échange au lieu d&apos;un paiement.
                      </span>
                    </span>
                  </label>

                  {draft.is_troc ? (
                    <label className="mt-4 block space-y-2">
                      <span className="text-sm font-semibold text-night">Contre quoi souhaitez-vous échanger ?</span>
                      <input
                        type="text"
                        value={draft.contre_quoi}
                        onChange={(event) => setDraft((current) => ({ ...current, contre_quoi: event.target.value }))}
                        placeholder="Ex. vélo, smartphone, console, outillage..."
                        className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-nc-lagon focus:ring-4 focus:ring-nc-lagon/20"
                      />
                    </label>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">Prix *</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={draft.price}
                      onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                      onBlur={(event) => setDraft((current) => ({ ...current, price: String(snapTo10(event.target.value || 0)) }))}
                      inputMode="numeric"
                      placeholder="Ex. 15000"
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">Localisation *</span>
                    <select
                      value={draft.commune_id}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        commune_id: event.target.value,
                        quartier_zone: '',
                      }))}
                      disabled={loadingMeta}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20 disabled:opacity-60"
                    >
                      <option value="">{loadingMeta ? 'Chargement...' : 'Choisir une commune'}</option>
                      {communces.map((province) => (
                        <optgroup key={province.slug} label={province.name}>
                          {province.communes.map((commune) => (
                            <option key={commune.id} value={commune.id}>
                              {commune.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">Quartier / Zone</span>
                    <select
                      value={draft.quartier_zone}
                      onChange={(event) => setDraft((current) => ({ ...current, quartier_zone: event.target.value }))}
                      disabled={!draft.commune_id || zoneLoading}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20 disabled:opacity-60"
                    >
                      <option value="">
                        {!draft.commune_id
                          ? 'Choisissez une commune'
                          : zoneLoading
                            ? 'Chargement...'
                            : ''}
                      </option>
                      {zoneOptions.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-2xl border border-dashed border-night/10 bg-white px-4 py-3 text-xs text-night/55">
                    Optionnel : vous pouvez préciser un quartier ou une tribu.
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-night">
                      <CalendarDays className="h-4 w-4 text-coral" />
                      Durée de mise en ligne *
                    </span>
                    <select
                      value={draft.duration_days}
                      onChange={(event) => setDraft((current) => ({ ...current, duration_days: event.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                    >
                      <option value="30">30 jours</option>
                      <option value="60">60 jours</option>
                      <option value="90">90 jours</option>
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-night">État</span>
                    <select
                      value={draft.condition}
                      onChange={(event) => setDraft((current) => ({ ...current, condition: event.target.value as WizardDraft['condition'] }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                    >
                      <option value="new">Neuf</option>
                      <option value="like_new">Comme neuf</option>
                      <option value="good">Bon état</option>
                      <option value="fair">Correct</option>
                      <option value="for_parts">Pour pièces</option>
                    </select>
                  </label>

                  <label className="flex items-end gap-3 rounded-2xl border border-night/10 bg-sand px-4 py-3">
                    <input
                      type="checkbox"
                      checked={draft.price_negotiable}
                      onChange={(event) => setDraft((current) => ({ ...current, price_negotiable: event.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-night/20 text-coral focus:ring-coral/25"
                    />
                    <span className="text-sm text-night">Prix négociable</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {draft.step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-5 py-3 text-sm font-semibold text-night transition hover:bg-sand"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </button>
              ) : null}

              {draft.step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="inline-flex items-center gap-2 rounded-2xl bg-night px-5 py-3 text-sm font-semibold text-white transition hover:bg-night/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-coral-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Publication...' : 'Publier l’annonce'}
                </button>
              )}

              {draft.step === 3 ? (
                <button
                  type="button"
                  onClick={handlePreview}
                  className="inline-flex items-center gap-2 rounded-2xl border border-lagoon/25 bg-lagoon/8 px-5 py-3 text-sm font-semibold text-night transition hover:bg-lagoon/12"
                >
                  Prévisualiser
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => router.push('/annonces')}
                className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-5 py-3 text-sm font-semibold text-night transition hover:bg-sand"
              >
                Voir les annonces
              </button>
            </div>

            {draft.step === 3 ? (
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setShowMobilePreview((current) => !current)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:bg-sand"
                >
                  {showMobilePreview ? 'Masquer l&apos;aperçu' : 'Voir l&apos;aperçu'}
                </button>

                {showMobilePreview ? (
                  <div className="mt-4">
                    <PublicationPreview draft={draft} selectedCategory={selectedCategory} selectedCommune={selectedCommune} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <aside className="hidden space-y-5 lg:block">
            <ListingCoachCard photoCount={photos.length} description={draft.description} />
            <PublicationPreview draft={draft} selectedCategory={selectedCategory} selectedCommune={selectedCommune} />

            <div className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Checklist</p>
              <div className="mt-4 space-y-3 text-sm text-night/65">
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-jungle" />
                  Titre et catégorie renseignés
                </p>
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-jungle" />
                  Photos préparées pour l&apos;upload
                </p>
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-jungle" />
                  Prix, commune et durée validés
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

````

## PATH: frontend/src/app/inscription/page.tsx
````
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Store,
  UserRound,
  X,
} from 'lucide-react'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { metaApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthMapPanel from '@/components/auth/AuthMapPanel'

const schema = z
  .object({
    first_name: z.string().min(2, 'Prénom requis'),
    last_name: z.string().min(2, 'Nom requis'),
    email: z.string().email('Adresse e-mail invalide'),
    phone: z.string().regex(/^(\+687|0)[0-9]{6}$/, 'Numéro NC invalide'),
    commune_id: z.string().optional(),
    password: z
      .string()
      .min(8, 'Au moins 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre'),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirm'],
  })

type FormData = z.infer<typeof schema>
type Step = 1 | 2 | 3
type ProfileChoice = 'particulier' | 'pro'
type BillingCycle = 'monthly' | 'annual'

const STEPS: Array<{ id: Step; label: string; helper: string }> = [
  { id: 1, label: 'Profil', helper: 'Compte et accès' },
  { id: 2, label: 'Identité', helper: 'Vos informations' },
  { id: 3, label: 'Formule', helper: 'Votre compte' },
]

const COMMUNE_PLACEHOLDER = 'Choisir une commune'

const PLAN_FEATURES = [
  { label: 'Annonces actives', free: '5', pro: '∞' },
  { label: 'Photos par annonce', free: '6', pro: '12' },
  { label: 'Badge visible', free: 'Non', pro: 'Oui' },
  { label: 'Statistiques', free: 'Non', pro: 'Oui' },
] as const

function passwordScore(password: string) {
  const rules = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]

  return rules.filter(Boolean).length
}

function strengthLabel(score: number) {
  if (score <= 1) return 'Faible'
  if (score === 2) return 'Moyen'
  if (score === 3) return 'Fort'
  return 'Très fort'
}

function PasswordRules({ password }: { password: string }) {
  const score = passwordScore(password)
  const labels = [
    { ok: password.length >= 8, label: '8 caractères' },
    { ok: /[A-Z]/.test(password), label: '1 majuscule' },
    { ok: /[0-9]/.test(password), label: '1 chiffre' },
    { ok: /[^A-Za-z0-9]/.test(password), label: '1 symbole' },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Solidité du mot de passe</p>
        <p className="text-xs font-semibold text-night/55">{strengthLabel(score)}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => {
          const filled = index < score
          const barClass =
            score <= 1
              ? filled
                ? 'bg-red-500'
                : 'bg-night/10'
              : score === 2
                ? filled
                  ? 'bg-orange-400'
                  : 'bg-night/10'
                : score === 3
                  ? filled
                    ? 'bg-yellow-400'
                    : 'bg-night/10'
                  : filled
                    ? 'bg-jungle'
                    : 'bg-night/10'

          return <span key={index} className={`h-1.5 rounded-full ${barClass}`} />
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {labels.map((item) => (
          <span key={item.label} className={`flex items-center gap-1.5 text-xs ${item.ok ? 'text-jungle' : 'text-night/40'}`}>
            <CheckCircle2 className={`h-3.5 w-3.5 ${item.ok ? 'fill-jungle/10' : ''}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

type RegistrationError = {
  message: string
  ctaHref?: string
  ctaLabel?: string
}

function getRegistrationError(err: any): RegistrationError {
  const raw = String(err?.response?.data?.error ?? err?.message ?? '').toLowerCase()

  if (raw.includes('email') || raw.includes('already exists')) {
    return {
      message: 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.',
      ctaHref: '/connexion',
      ctaLabel: 'Se connecter →',
    }
  }

  if (raw.includes('network') || raw.includes('fetch')) {
    return {
      message: 'Connexion impossible. Vérifiez votre réseau et réessayez.',
    }
  }

  return {
    message: 'Une erreur est survenue. Réessayez dans un moment.',
  }
}

function StepPill({
  step,
  current,
  onClick,
}: {
  step: Step
  current: Step
  onClick: (step: Step) => void
}) {
  const active = step === current
  const completed = step < current
  const clickable = active || completed

  return (
    <button
      type="button"
      onClick={() => clickable && onClick(step)}
      disabled={!clickable}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition duration-150 ${
        active
          ? 'border-coral/25 bg-coral/5 shadow-sm'
          : completed
            ? 'border-jungle/20 bg-jungle/5 hover:border-jungle/30'
            : 'border-night/10 bg-white/75 text-night/40'
      }`}
      aria-current={active ? 'step' : undefined}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-colors duration-200 ${
          active
            ? 'bg-coral text-white'
            : completed
              ? 'bg-jungle text-white'
              : 'bg-night/5 text-night/35'
        }`}
      >
        {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
      </span>
      <span>
        <span className={`block text-sm font-semibold ${active ? 'text-night' : 'text-night/70'}`}>
          {STEPS[step - 1].label}
        </span>
        <span className="block text-xs text-night/50">{STEPS[step - 1].helper}</span>
      </span>
    </button>
  )
}

function AccountTypeCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean
  icon: typeof UserRound | typeof Store
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full flex-col rounded-[1.5rem] border p-5 text-left transition duration-150 ${
        active
          ? 'border-coral/30 bg-coral/5 shadow-sm'
          : 'border-night/10 bg-white hover:-translate-y-0.5 hover:border-coral/20 hover:bg-sand/40 hover:shadow-sm'
      }`}
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${active ? 'bg-coral/10 text-coral' : 'bg-night/5 text-night/55'}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-4 text-base font-semibold text-night">{title}</span>
      <span className="mt-1 text-sm leading-6 text-night/60">{description}</span>
    </button>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuthStore()
  const [step, setStep] = useState<Step>(1)
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward')
  const [selectedProfile, setSelectedProfile] = useState<ProfileChoice>('particulier')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<RegistrationError | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [communes, setCommunes] = useState<Array<{ id: number; name?: string; nom?: string }>>([])
  const [showProOptions, setShowProOptions] = useState(false)
  const socialRedirect = selectedProfile === 'pro' ? '/bienvenue?role=pro' : '/bienvenue?role=particulier'
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const turnstileEnabled = Boolean(turnstileSiteKey && !turnstileSiteKey.startsWith('CHANGEME'))

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const password = watch('password') || ''
  const profileName = watch('first_name') || watch('last_name') || 'Vous'

  useEffect(() => {
    metaApi
      .getCommunes()
      .then(({ data }) => setCommunes(data.data || []))
      .catch(() => setCommunes([]))
  }, [])

  const goToStep = (next: Step) => {
    setStepDirection(next > step ? 'forward' : 'backward')
    setStep(next)
  }

  const submitRegistration = async (data: FormData, accountType: ProfileChoice = selectedProfile) => {
    setServerError(null)
    try {
      const { password_confirm: _passwordConfirm, ...payload } = data
      if (turnstileEnabled && !turnstileToken) {
        setServerError({
          message: 'Veuillez compléter la vérification anti-bot.',
        })
        return
      }

      await registerUser(
        {
          ...payload,
          telephone: payload.phone,
          commune_id: payload.commune_id ? parseInt(payload.commune_id, 10) : undefined,
          account_type: accountType,
        },
        turnstileToken || undefined,
      )
      router.push(`/verification-email?email=${encodeURIComponent(payload.email)}&role=${accountType}`)
    } catch (err: any) {
      setServerError(getRegistrationError(err))
    }
  }

  const nextFromStep1 = async () => {
    const ok = await trigger(['email', 'password', 'password_confirm'])
    if (ok) goToStep(2)
  }

  const nextFromStep2 = async () => {
    const ok = await trigger(['first_name', 'last_name', 'phone', 'commune_id'])
    if (!ok) return

    if (selectedProfile === 'pro') {
      goToStep(3)
      return
    }

    await handleSubmit((data) => submitRegistration(data, 'particulier'))()
  }

  const onSubmit = async (data: FormData) => {
    await submitRegistration(data)
  }

  const canSubmitAtStep2 = selectedProfile === 'particulier'

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="flex min-h-screen items-center justify-center px-6 py-10 md:px-8 lg:px-12">
        <div className="flex w-full max-w-[540px] flex-col gap-6">
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center">
            <p className="font-display text-3xl font-bold text-night">Kalico</p>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral/80">Nouvelle-Calédonie</p>
          </Link>
          <p className="mt-3 text-sm text-night/55">Créez votre compte en 2 minutes. Tout le reste vient après.</p>
        </div>

        <div className="card card-hover overflow-hidden p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="mt-2 font-display text-4xl font-bold text-night md:text-5xl">Rejoindre Kalico</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-night/60 md:text-base">
                Commencez avec votre compte, complétez votre profil, puis choisissez votre formule au bon moment.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {STEPS.map((item) => (
              <StepPill key={item.id} step={item.id} current={step} onClick={goToStep} />
            ))}
          </div>

          {serverError ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p>{serverError.message}</p>
                {serverError.ctaHref ? (
                  <Link href={serverError.ctaHref} className="mt-1 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                    {serverError.ctaLabel || 'Se connecter →'}
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div key={step} className={stepDirection === 'forward' ? 'step-enter-forward' : 'step-enter-backward'}>
              {step === 1 ? (
                <section className="space-y-4 rounded-[1.75rem] border border-night/10 bg-white p-5 shadow-sm md:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Étape 1</p>
                      <h2 className="mt-2 text-2xl font-semibold text-night">Créez votre compte</h2>
                      <p className="mt-1 text-sm text-night/55">E-mail, mot de passe et accès rapide avec Google ou Apple si vous préférez.</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <SocialAuthButtons mode="inscription" redirectTo={socialRedirect} showLegalFooter={false} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className="field-label">Adresse e-mail</span>
                      <input {...register('email')} type="email" className="input h-12 w-full" placeholder="vous@exemple.nc" />
                      {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
                    </label>

                    <label className="space-y-2">
                      <span className="field-label">Mot de passe</span>
                      <div className="relative">
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          className="input h-12 w-full pr-12"
                          placeholder="Créez un mot de passe"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-night/45 transition hover:text-night/70"
                          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password ? <p className="field-error">{errors.password.message}</p> : null}
                      <PasswordRules password={password} />
                    </label>

                    <label className="space-y-2">
                      <span className="field-label">Confirmer le mot de passe</span>
                      <input
                        {...register('password_confirm')}
                        type={showPassword ? 'text' : 'password'}
                        className="input h-12 w-full"
                        placeholder="Répétez le mot de passe"
                      />
                      {errors.password_confirm ? <p className="field-error">{errors.password_confirm.message}</p> : null}
                    </label>
                  </div>

                  <p className="pt-2 text-xs text-night/45">
                    En continuant, vous acceptez nos{' '}
                    <Link href="/cgu" className="underline underline-offset-2 hover:text-night/70">
                      CGU
                    </Link>{' '}
                    et notre{' '}
                    <Link href="/politique-de-confidentialite" className="underline underline-offset-2 hover:text-night/70">
                      politique de confidentialité
                    </Link>
                    .
                  </p>
                </section>
              ) : null}

              {step === 2 ? (
                <section className="space-y-5 rounded-[1.75rem] border border-night/10 bg-white p-5 shadow-sm md:p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Étape 2</p>
                    <h2 className="mt-2 text-2xl font-semibold text-night">Parlez-nous de vous</h2>
                    <p className="mt-1 text-sm text-night/55">Juste l'essentiel pour commencer.</p>
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-[1.5rem] border border-night/10 bg-sand/40 p-5">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-night/10 bg-white">
                          <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(72,202,228,0.22),transparent_65%)]" />
                          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-lg font-bold text-coral">
                            {profileName.trim().charAt(0).toUpperCase() || 'T'}
                          </span>
                          <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-night text-white shadow-sm">
                            <Camera className="h-3.5 w-3.5" />
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-night/45">Avatar optionnel</p>
                          <p className="mt-1 text-sm leading-6 text-night/60">Votre photo peut venir plus tard. Un avatar clair s’affiche en attendant.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="field-label">Prénom</span>
                        <input {...register('first_name')} className="input h-12 w-full" placeholder="Votre prénom" />
                        {errors.first_name ? <p className="field-error">{errors.first_name.message}</p> : null}
                      </label>
                      <label className="space-y-2">
                        <span className="field-label">Nom</span>
                        <input {...register('last_name')} className="input h-12 w-full" placeholder="Votre nom" />
                        {errors.last_name ? <p className="field-error">{errors.last_name.message}</p> : null}
                      </label>

                      <label className="space-y-2 md:col-span-2">
                      <span className="field-label">Téléphone mobile</span>
                      <input {...register('phone')} className="input h-12 w-full" placeholder="+687..." />
                      {errors.phone ? <p className="field-error">{errors.phone.message}</p> : null}
                      <p className="text-xs text-night/45">Nécessaire pour la récupération de mot de passe si vous choisissez l’option SMS.</p>
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="field-label">Votre commune en NC</span>
                        <select {...register('commune_id')} className="input h-12 w-full">
                          <option value="">{COMMUNE_PLACEHOLDER}</option>
                          {communes.map((commune) => (
                            <option key={commune.id} value={commune.id}>
                              {commune.name ?? commune.nom}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <AccountTypeCard
                      active={selectedProfile === 'particulier'}
                      icon={UserRound}
                      title="Particulier"
                      description="J'achète, je vends, je troque et je publie pour un usage personnel."
                      onClick={() => setSelectedProfile('particulier')}
                    />
                    <AccountTypeCard
                      active={selectedProfile === 'pro'}
                      icon={Store}
                      title="Professionnel"
                      description="Enseigne, commerce, agence ou vendeur régulier qui veut plus de visibilité."
                      onClick={() => setSelectedProfile('pro')}
                    />
                  </div>
                </section>
              ) : null}

              {step === 3 && selectedProfile === 'pro' ? (
                <section className="space-y-5 rounded-[1.75rem] border border-night/10 bg-white p-5 shadow-sm md:p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Étape 3</p>
                    <h2 className="mt-2 text-2xl font-semibold text-night">Choisissez votre plan</h2>
                    <p className="mt-1 text-sm text-night/55">
                      Vous pouvez commencer gratuitement ou profiter du Pro quand votre activité le justifie.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => void handleSubmit((data) => submitRegistration(data, 'particulier'))()}
                      disabled={isSubmitting}
                      className="btn-primary w-full"
                    >
                      {isSubmitting ? 'Création…' : 'Commencer gratuitement'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowProOptions((value) => !value)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-coral hover:underline"
                      aria-expanded={showProOptions}
                    >
                      Voir les options Pro →
                    </button>
                  </div>

                  {showProOptions ? (
                    <div className="space-y-4 pt-2">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <article className="rounded-[1.75rem] border border-jungle/20 bg-jungle/5 p-5">
                          <div className="inline-flex items-center rounded-full bg-jungle/15 px-3 py-1 text-xs font-semibold text-jungle">
                            Gratuit
                          </div>
                          <p className="mt-4 text-3xl font-bold text-night">0 XPF / mois</p>
                          <ul className="mt-4 space-y-2 text-sm text-night/65">
                            <li className="flex items-center gap-2">
                              <X className="h-4 w-4 text-night/35" />
                              5 annonces actives
                            </li>
                            <li className="flex items-center gap-2">
                              <X className="h-4 w-4 text-night/35" />
                              6 photos par annonce
                            </li>
                            <li className="flex items-center gap-2">
                              <X className="h-4 w-4 text-night/35" />
                              60 jours de visibilité
                            </li>
                          </ul>
                        </article>

                        <article className="pulse-once rounded-[1.75rem] border border-coral/20 bg-[linear-gradient(180deg,rgba(10,126,164,0.08),rgba(255,255,255,1))] p-5 shadow-lg shadow-coral/10">
                          <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white">
                              Recommandé
                            </span>
                            <button
                              type="button"
                              onClick={() => setBillingCycle((value) => (value === 'monthly' ? 'annual' : 'monthly'))}
                              className="inline-flex items-center gap-1 rounded-full border border-night/10 bg-white px-3 py-1.5 text-xs font-semibold text-night transition hover:border-coral/25 hover:text-coral"
                            >
                              <span className={billingCycle === 'monthly' ? 'text-coral' : 'text-night/50'}>Mensuel</span>
                              <span className="text-night/25">/</span>
                              <span className={billingCycle === 'annual' ? 'text-coral' : 'text-night/50'}>Annuel</span>
                            </button>
                          </div>

                          <p className="mt-4 text-3xl font-bold text-coral">
                            {billingCycle === 'monthly' ? '4 900 XPF / mois' : '44 900 XPF / an'}
                          </p>
                          {billingCycle === 'annual' ? (
                            <p className="mt-2 text-sm font-semibold text-jungle">2 mois offerts</p>
                          ) : (
                            <p className="mt-2 text-sm text-night/55">Paiement flexible, à tout moment.</p>
                          )}

                          <div className="mt-5 space-y-3">
                            {PLAN_FEATURES.map((feature) => (
                              <div key={feature.label} className="rounded-2xl border border-night/8 bg-white/80 p-3">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <span className="font-medium text-night">{feature.label}</span>
                                  <span className="font-semibold text-coral">Pro : {feature.pro}</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-night/10">
                                  <div
                                    className="h-2 rounded-full bg-coral"
                                    style={{
                                      width:
                                        feature.label === 'Annonces actives'
                                          ? '100%'
                                          : feature.label === 'Photos par annonce'
                                            ? '80%'
                                            : feature.label === 'Badge visible'
                                              ? '70%'
                                              : '90%',
                                    }}
                                  />
                                </div>
                                <p className="mt-2 text-xs text-night/55">Gratuit : {feature.free}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-5 grid gap-3 rounded-2xl border border-coral/15 bg-coral/5 p-4 text-sm text-night/65">
                            <div className="flex items-center justify-between gap-3">
                              <span>Annonces</span>
                              <strong className="text-coral">∞ vs 5</strong>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Photos</span>
                              <strong className="text-coral">12 vs 6</strong>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Badge et stats</span>
                              <strong className="text-coral">Visibles</strong>
                            </div>
                            <div className="rounded-2xl bg-white/80 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-night/45">
                                  <BarChart3 className="h-3.5 w-3.5" />
                                  Statistiques
                                </span>
                                <span className="rounded-full bg-coral px-2.5 py-1 text-[11px] font-semibold text-white">Badge Pro</span>
                              </div>
                              <div className="mt-3 h-20 rounded-2xl bg-[linear-gradient(180deg,rgba(72,202,228,0.16),rgba(10,126,164,0.04))] p-3">
                                <div className="flex h-full items-end gap-2">
                                  <span className="h-6 w-4 rounded-t-full bg-night/15" />
                                  <span className="h-10 w-4 rounded-t-full bg-night/15" />
                                  <span className="h-14 w-4 rounded-t-full bg-coral" />
                                  <span className="h-8 w-4 rounded-t-full bg-night/15" />
                                  <span className="h-16 w-4 rounded-t-full bg-coral/70" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      </div>
                    </div>
                  ) : null}

                  <p className="text-center text-sm text-night/55">
                    Pas encore décidé ?{' '}
                    <button type="button" onClick={() => setSelectedProfile('particulier')} className="font-semibold text-coral hover:underline">
                      Commencez gratuitement →
                    </button>
                  </p>
                </section>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-night/10 pt-5">
              <button
                type="button"
                onClick={() => {
                  if (step > 1) goToStep((step - 1) as Step)
                }}
                disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm font-semibold text-night transition hover:border-coral/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>Retour</span>
              </button>

              {step === 1 ? (
                <button type="button" onClick={nextFromStep1} className="btn-primary px-5 py-3">
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : step === 2 ? (
                <button type="button" onClick={nextFromStep2} className="btn-primary px-5 py-3">
                  {canSubmitAtStep2 ? 'Créer mon compte' : 'Continuer'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="btn-primary px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? 'Création…' : 'Créer mon compte'}
                </button>
              )}
            </div>
          </form>
        </div>
        </div>
      </section>

      <AuthMapPanel />
    </div>
  )
}

````

## PATH: frontend/src/app/connexion/ConnexionClient.tsx
````
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import TurnstileChallenge from '@/components/auth/TurnstileChallenge'
import AuthMapPanel from '@/components/auth/AuthMapPanel'
import { consumeRedirectAfterLogin } from '@/lib/authRedirect'
import { DEMO_ACCOUNTS, inferDemoAccount } from '@/lib/demoApi'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type FormData = z.infer<typeof schema>

type ConnexionClientProps = {
  nextPath: string
}

function parseLoginError(raw?: string | null) {
  const normalized = (raw || '').toLowerCase()

  if (
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes('timeout') ||
    normalized.includes('failed to fetch')
  ) {
    return { message: 'Connexion impossible. Vérifiez votre réseau.' }
  }

  if (
    normalized.includes('not found') ||
    normalized.includes('unknown email') ||
    normalized.includes('account not found') ||
    normalized.includes('user not found') ||
    normalized.includes('email does not exist') ||
    normalized.includes('no account')
  ) {
    return {
      message: "Aucun compte avec cet email. Inscrivez-vous ?",
      href: '/inscription',
      linkLabel: "S'inscrire",
    }
  }

  if (
    normalized.includes('incorrect') ||
    normalized.includes('invalid') ||
    normalized.includes('password') ||
    normalized.includes('credentials')
  ) {
    return { message: 'Email ou mot de passe incorrect.' }
  }

  return { message: raw || 'Erreur de connexion' }
}

export default function ConnexionClient({ nextPath }: ConnexionClientProps) {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [awaitingPassword, setAwaitingPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [serverErrorLink, setServerErrorLink] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [showMapPanel, setShowMapPanel] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
  const turnstileEnabled = Boolean(turnstileSiteKey && !turnstileSiteKey.startsWith('CHANGEME'))

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const email = watch('email') || ''
  const demoProfile = inferDemoAccount(email)

  useEffect(() => {
    if (awaitingPassword) {
      passwordInputRef.current?.focus()
    }
  }, [awaitingPassword])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => setShowMapPanel(media.matches)

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const onSubmit = async (data: FormData) => {
    setServerError('')
    setServerErrorLink(null)
    try {
      const demoProfile = inferDemoAccount(data.email)
      const isDemoLogin =
        demoProfile &&
        (demoProfile === 'particulier' || demoProfile === 'pro' || demoProfile === 'bon_plan') &&
        data.password === DEMO_ACCOUNTS[demoProfile].password

      if (turnstileEnabled && !turnstileToken && !isDemoLogin) {
        setServerError("Merci de confirmer que vous n'êtes pas un robot.")
        return
      }

      await login(data.email, data.password, turnstileToken || undefined)
      router.push(isDemoLogin ? '/profil' : consumeRedirectAfterLogin(nextPath || '/'))
    } catch (err: any) {
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verification-email?email=${encodeURIComponent(data.email)}`)
        return
      }
      const parsed = parseLoginError(err?.response?.data?.error || err?.message)
      setServerError(parsed.message)
      setServerErrorLink(parsed.href || null)
    }
  }

  const handlePrimaryAction = async () => {
    if (!awaitingPassword) {
      setServerError('')
      setServerErrorLink(null)
      const ok = await trigger('email')
      if (ok) setAwaitingPassword(true)
      return
    }

    await handleSubmit(onSubmit)()
  }

  const handleDemoQuickLogin = async () => {
    if (!demoProfile || (demoProfile !== 'particulier' && demoProfile !== 'pro' && demoProfile !== 'bon_plan')) return

    setServerError('')
    setServerErrorLink(null)
    try {
      useAuthStore.getState().setDemoProfile(demoProfile)
      router.push('/profil')
    } catch {
      setServerError("Impossible d'activer le compte démo pour le moment.")
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--color-surface)] lg:grid lg:grid-cols-2">
      <main className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[380px]">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-2xl border border-night/10 bg-white shadow-[0_8px_24px_rgba(8,32,50,0.08)]">
              <Image src="/brand/kalico1.svg" alt="Kalico" fill sizes="48px" className="object-cover" priority />
            </span>
            <span>
              <span className="block font-display text-2xl font-bold text-night">Kalico</span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-coral/80">
                Nouvelle-Calédonie
              </span>
            </span>
          </Link>

          <div className="mt-10">
            <h1 className="text-[24px] font-semibold leading-tight text-night">
              Connectez-vous ou créez votre compte Kalico
            </h1>
            <p className="mt-1.5 text-sm text-night/60">La marketplace locale de Nouvelle-Calédonie.</p>
          </div>

          {serverError ? (
            <div className="mt-5 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p>{serverError}</p>
                  {serverErrorLink ? (
                    <Link href={serverErrorLink} className="inline-flex font-semibold underline underline-offset-2">
                      S'inscrire
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {turnstileEnabled ? (
            <div className="mt-5 rounded-2xl border border-night/10 bg-sand/40 p-4">
              <p className="text-sm font-semibold text-night">Vérification anti-bot</p>
              <div className="mt-3">
                <TurnstileChallenge action="login" label="Connexion" onTokenChange={setTurnstileToken} />
              </div>
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handlePrimaryAction()
            }}
            className="mt-7 space-y-4"
          >
            <label className="space-y-2">
              <span className="field-label">Adresse e-mail</span>
              <input
                {...register('email')}
                type="email"
                placeholder="vous@exemple.nc"
                className="input h-12 w-full"
                autoComplete="email"
              />
              {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
            </label>

            {awaitingPassword ? (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between gap-3">
                  <label className="field-label mb-0">Mot de passe</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-xs font-medium text-coral hover:underline"
                  >
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input h-12 w-full pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-night/40 transition hover:text-night/70"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? <p className="field-error">{errors.password.message}</p> : null}
              </div>
            ) : null}

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
              {awaitingPassword ? (
                isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Connexion...
                  </span>
                ) : (
                  'Se connecter'
                )
              ) : (
                'Continuer →'
              )}
            </button>
          </form>

          {demoProfile ? (
            <div className="mt-4 rounded-2xl border border-coral/20 bg-coral/5 p-4">
              <p className="text-sm font-semibold text-night">Compte démo détecté</p>
              <p className="mt-1 text-sm text-night/60">
                Vous pouvez entrer dans l'application sans vérification supplémentaire.
              </p>
              <button type="button" onClick={() => void handleDemoQuickLogin()} className="btn-primary mt-3 w-full py-3">
                Se connecter en mode démo
              </button>
              <p className="mt-2 text-[11px] text-night/45">
                Email: {demoProfile === 'particulier' ? 'particulier@demo.kalico.nc' : demoProfile === 'pro' ? 'pro@demo.kalico.nc' : 'bonplan@demo.kalico.nc'}
              </p>
            </div>
          ) : null}

          <div className="mt-6">
            <SocialAuthButtons redirectTo="/" mode="connexion" showLegalFooter={false} />
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-night/40">
            En continuant, vous acceptez nos{' '}
            <Link href="/cgu" className="transition hover:text-coral hover:underline">
              CGU
            </Link>
            ,{' '}
            <Link href="/mentions-legales" className="transition hover:text-coral hover:underline">
              mentions légales
            </Link>{' '}
            et notre{' '}
            <Link href="/politique-de-confidentialite" className="transition hover:text-coral hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </main>

      {showMapPanel ? <AuthMapPanel /> : null}
    </div>
  )
}

````

## PATH: frontend/src/app/profil/page.tsx
````
'use client'
// src/app/profil/page.tsx  (mon profil)
// src/app/profil/[id]/page.tsx  (profil public)

import { Suspense, useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  BadgeCheck, MapPin, Calendar, Shield, CheckCircle2,
  Edit3, Save, X, Package, MessageCircle, Heart, AlertTriangle, Clock3, CreditCard
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Header from '@/components/layout/Header'
import ListingCard from '@/components/listings/ListingCard'
import { subscriptionsApi, usersApi } from '@/lib/api'
import { inferDemoAccount } from '@/lib/demoApi'
import { useAuthSessionSync } from '@/hooks/useAuthSessionSync'
import ProfileDemoPreview from '@/components/ui/ProfileDemoPreview'
import Link from 'next/link'

const TABS = [
  { id: 'listings', label: 'Annonces',     icon: <Package   className="w-4 h-4" /> },
  { id: 'reviews',  label: 'Avis reçus',   icon: <BadgeCheck className="w-4 h-4" /> },
]

type SubscriptionStatus = {
  plan?: 'free' | 'pro' | null
  status?: 'active' | 'expiring_soon' | 'expired' | 'payment_failed' | null
  current_period_end?: string | null
  days_remaining?: number | null
  payment_provider?: 'stripe' | 'payplug' | null
  payment_status?: 'pending' | 'succeeded' | 'failed' | 'refunded' | null
}

function getSubscriptionStatusMeta(status?: SubscriptionStatus | null) {
  if (!status || status.plan === 'free') return null

  if (status.status === 'payment_failed') {
    return {
      tone: 'danger' as const,
      label: 'Paiement échoué',
      description: 'Mettez à jour votre moyen de paiement pour conserver vos avantages Pro.',
      cta: { href: '/parametres#factures', label: 'Mettre à jour mon moyen de paiement' },
      icon: AlertTriangle,
    }
  }

  if (status.status === 'expired') {
    return {
      tone: 'danger' as const,
      label: 'Abonnement expiré',
      description: 'Votre abonnement a expiré. Réactivez-le pour retrouver vos avantages Pro.',
      cta: { href: '/abonnement', label: 'Réactiver mon abonnement' },
      icon: AlertTriangle,
    }
  }

  if (status.status === 'expiring_soon' && typeof status.days_remaining === 'number') {
    return {
      tone: 'warning' as const,
      label: `Expire dans ${status.days_remaining} jour${status.days_remaining > 1 ? 's' : ''}`,
      description: 'Votre abonnement arrive à échéance. Renouvelez pour éviter une interruption.',
      cta: { href: '/abonnement', label: 'Renouveler maintenant' },
      icon: Clock3,
    }
  }

  return {
    tone: 'success' as const,
    label: 'Abonnement actif',
    description: 'Votre abonnement est actif et vos avantages Pro sont disponibles.',
    cta: null,
    icon: CheckCircle2,
  }
}

function ProfilePageContent() {
  const params   = useParams<{ id?: string }>()
  const searchParams = useSearchParams()
  const { user: me, demoProfile, authReady } = useAuthSessionSync()

  // Si pas d'id dans l'URL â†’ mon profil
  const profileId = params?.id || me?.id
  const isOwn     = !params?.id || params.id === me?.id
  const demoActive = Boolean(demoProfile || me?.demo_role || inferDemoAccount(me?.email))
  const demoKey = (demoProfile || me?.demo_role || inferDemoAccount(me?.email) || 'particulier') as 'particulier' | 'pro' | 'bon_plan'
  const demoProfileEmail =
    demoKey === 'particulier'
      ? 'particulier@demo.kalico.nc'
      : demoKey === 'pro'
        ? 'pro@demo.kalico.nc'
        : 'bonplan@demo.kalico.nc'
  const activeTab = searchParams.get('tab')

  const [profile,   setProfile]   = useState<any>(null)
  const [listings,  setListings]  = useState<any[]>([])
  const [reviews,   setReviews]   = useState<any[]>([])
  const [tab,       setTab]       = useState('listings')
  const [editing,   setEditing]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const { data: subscriptionStatusData } = useQuery({
    queryKey: ['subscriptions', 'status'],
    queryFn: async () => {
      const response = await subscriptionsApi.getStatus()
      return response.data as { data: SubscriptionStatus | null }
    },
    enabled: Boolean(isOwn && profileId && !demoActive),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 0,
  })
  const subscriptionStatus = subscriptionStatusData?.data ?? null
  const subscriptionMeta = getSubscriptionStatusMeta(subscriptionStatus)

  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    if (!authReady) return
    if (!profileId) {
      setLoading(false)
      return
    }
    if (demoActive) {
      setLoading(false)
      return
    }
    loadProfile()
  }, [authReady, profileId, demoActive])

  const loadProfile = async () => {
    try {
      const [profRes, listRes, revRes] = await Promise.all([
        usersApi.getProfile(profileId!),
        usersApi.getUserListings(profileId!),
        usersApi.getReviews(profileId!),
      ])
      setProfile(profRes.data.data)
      setListings(listRes.data.data)
      setReviews(revRes.data.data)
      reset(profRes.data.data)
    } finally {
      setLoading(false)
    }
  }

  const onSave = async (data: any) => {
    setSaving(true)
    try {
      await usersApi.updateProfile({
        first_name: data.first_name,
        last_name:  data.last_name,
        phone:      data.phone,
        bio:        data.bio,
      })
      setProfile({ ...profile, ...data })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const RatingRow = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <BadgeCheck key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-[var(--color-warning)]' : 'text-night/20'}`} />
      ))}
    </div>
  )

  if (!authReady) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
          <div className="card p-6 flex gap-5">
            <div className="skeleton w-20 h-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-6 w-48" />
              <div className="skeleton h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="card p-6 flex gap-5">
          <div className="skeleton w-20 h-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!profile && !demoActive) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-12 text-center">
          <div className="w-full rounded-[2rem] border border-night/8 bg-white dark:bg-[var(--color-surface)] p-8 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Profil</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-night">
              {profileId ? 'Chargement de votre profil' : 'Connectez-vous pour accéder à votre espace.'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-night/60">
              {profileId
                ? 'Votre espace personnel est en cours de chargement. Si la page reste vide, reconnectez-vous pour réinitialiser la session.'
                : 'Vous devez être connecté pour consulter ou modifier votre profil. Utilisez votre compte Kalico pour accéder à cet espace.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/connexion" className="btn-primary px-4 py-2 text-sm">
                Se connecter
              </Link>
              <Link href="/inscription" className="btn-secondary px-4 py-2 text-sm">
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (demoActive) {
    const demoKey = (demoProfile || me?.demo_role || inferDemoAccount(me?.email) || 'particulier') as 'particulier' | 'pro' | 'bon_plan'
    const demoCards = {
      particulier: {
        title: 'Mon compte particulier',
        subtitle: 'Publier, suivre, discuter',
        stats: [
          { value: '3', label: 'annonces' },
          { value: '18', label: 'messages' },
          { value: '24', label: 'favoris' },
        ],
        tabs: ['Annonces', 'Avis reçus', 'Favoris', 'Messages', 'Paramètres'],
        hint: "Tu vois l'espace classique d'un utilisateur qui dépose une annonce.",
      },
      pro: {
        title: 'Espace professionnel',
        subtitle: 'Suivi de performance et visibilité',
        stats: [
          { value: '47', label: 'annonces' },
          { value: '1.2k', label: 'vues' },
          { value: '4.9', label: 'note' },
        ],
        tabs: ['Annonces', 'Avis reçus', 'Statistiques', 'Boosts', 'Paramètres'],
        hint: 'Tu vois un compte orienté business avec indicateurs de performance.',
      },
      bon_plan: {
        title: 'Espace bon plan',
        subtitle: 'Campagnes locales et mises en avant',
        stats: [
          { value: '8', label: 'campagnes' },
          { value: '5', label: 'bénéfices' },
          { value: '12', label: 'diffusions' },
        ],
        tabs: ['Annonces', 'Avis reçus', 'Campagnes', 'Statistiques', 'Paramètres'],
        hint: 'Tu vois une interface pensée pour une promo, un événement ou une annonce sponsorisée.',
      },
    }[demoKey]

    return (
      <div className="min-h-screen">
        <Header />

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
          <div className="card p-5 border-coral/15 bg-coral/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Onboarding du compte</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">
                  {demoKey === 'pro'
                    ? 'Votre espace professionnel est prêt'
                    : demoKey === 'bon_plan'
                      ? 'Votre espace bon plan est prêt'
                      : 'Votre espace particulier est prêt'}
                </h2>
                <p className="mt-1 text-sm text-night/60">
                  {demoKey === 'pro'
                    ? 'Complétez les infos société, activez les options de visibilité et préparez vos annonces.'
                    : demoKey === 'bon_plan'
                      ? 'Programmez vos promos, affichez vos campagnes et mesurez la visibilité.'
                      : 'Complétez votre profil, publiez une annonce et échangez avec les acheteurs.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={demoKey === 'pro' ? '/parametres' : '/annonces/nouvelle'} className="btn-primary px-4 py-2 text-sm">
                  {demoKey === 'pro' ? 'Configurer mon espace pro' : 'Déposer ma première annonce'}
                </Link>
                <Link href="/annonces" className="btn-ghost px-4 py-2 text-sm">
                  Explorer les annonces
                </Link>
              </div>
            </div>
          </div>

          <ProfileDemoPreview mode="account" profile={demoKey} />

        </div>
      </div>
    )
  }

  const securityPanel = activeTab === 'securite' ? (
    <div className="card border-coral/15 bg-coral/5 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Sécurité et connexion</p>
      <h2 className="mt-2 text-xl font-bold text-night">Votre sécurité est active sur ce compte</h2>
      <p className="mt-2 text-sm text-night/60">
        Vous pouvez modifier votre mot de passe, vérifier vos appareils actifs et consulter les options de récupération dans Paramètres.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/parametres#donnees" className="btn-primary px-4 py-2 text-sm">
          Gérer mes données
        </Link>
        <Link href="/parametres#cookies" className="btn-ghost px-4 py-2 text-sm">
          Consentement cookies
        </Link>
      </div>
    </div>
  ) : null

  const notificationsPanel = activeTab === 'notifications' ? (
    <div className="card border-coral/15 bg-coral/5 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Notifications</p>
      <h2 className="mt-2 text-xl font-bold text-night">Les notifications sont gérées depuis le compte</h2>
      <p className="mt-2 text-sm text-night/60">
        Les alertes de recherche, les messages et les réponses d’annonces restent visibles dans votre espace. Les réglages détaillés sont accessibles depuis Paramètres de notification.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/parametres/notifications" className="btn-primary px-4 py-2 text-sm">
          Ouvrir les paramètres
        </Link>
        <Link href="/alertes" className="btn-ghost px-4 py-2 text-sm">
          Mes alertes
        </Link>
        <Link href="/messages" className="btn-ghost px-4 py-2 text-sm">
          Ouvrir mes messages
        </Link>
        <Link href="/profil/alertes-trajet" className="btn-ghost px-4 py-2 text-sm">
          Mes alertes trajet
        </Link>
      </div>

      {!demoActive && isOwn && (
        <div className="mt-6 rounded-[1.5rem] border border-night/8 bg-white dark:bg-[var(--color-surface)] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Bons Plans</p>
              <h3 className="mt-1 text-lg font-bold text-night">Tout est regroupé dans le centre de préférences</h3>
              <p className="mt-1 text-sm text-night/60">
                Les promos, catégories, enseignes et canaux sont maintenant gérés dans Paramètres de notification pour éviter les doublons.
              </p>
            </div>
            <Link href="/parametres/notifications#bons-plans" className="btn-primary px-4 py-2 text-sm">
              Ouvrir les préférences
            </Link>
          </div>
        </div>
      )}
    </div>
  ) : null

  const favoritesPanel = isOwn ? (
    <div className="card border-coral/15 bg-white dark:bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Favoris</p>
          <h2 className="mt-2 text-xl font-bold text-night">Mes favoris</h2>
          <p className="mt-2 text-sm text-night/60">
            Retrouvez ici les annonces que vous avez mises en mémoire pour les consulter plus tard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/favoris" className="btn-primary px-4 py-2 text-sm">
            Ouvrir mes favoris
          </Link>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        {securityPanel}
        {notificationsPanel}
        {favoritesPanel}

        <div className="card p-5 border-coral/15 bg-coral/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Onboarding du compte</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-night">
                {profile?.is_pro ? 'Votre espace professionnel est prêt' : 'Votre espace particulier est prêt'}
              </h2>
              <p className="mt-1 text-sm text-night/60">
                {profile?.is_pro
                  ? 'Complétez les infos société, activez les options de visibilité et préparez vos annonces.'
                  : 'Complétez votre profil, publiez une annonce et échangez avec les acheteurs.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile?.is_pro ? (
                <Link href="/parametres" className="btn-primary px-4 py-2 text-sm">
                  Configurer mon espace pro
                </Link>
              ) : (
                <Link href="/annonces/nouvelle" className="btn-primary px-4 py-2 text-sm">
                  Déposer ma première annonce
                </Link>
              )}
              <Link href="/annonces" className="btn-ghost px-4 py-2 text-sm">
                Explorer les annonces
              </Link>
            </div>
          </div>
        </div>

        {isOwn && !demoActive && subscriptionMeta && (
          <div
            className={`rounded-[1.5rem] border p-4 shadow-sm ${
              subscriptionMeta.tone === 'danger'
                ? 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10'
                : subscriptionMeta.tone === 'warning'
                  ? 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10'
                  : 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10'
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <subscriptionMeta.icon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    subscriptionMeta.tone === 'danger'
                      ? 'text-[var(--color-danger)]'
                      : subscriptionMeta.tone === 'warning'
                        ? 'text-[var(--color-warning)]'
                        : 'text-[var(--color-success)]'
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-night">{subscriptionMeta.label}</p>
                  <p className="text-sm text-night/60">{subscriptionMeta.description}</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/75 dark:bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-night/60">
                    {subscriptionStatus?.plan === 'pro' ? 'Pro' : 'Gratuit'}
                    {subscriptionStatus?.payment_provider ? ` · ${subscriptionStatus.payment_provider.toUpperCase()}` : ''}
                    {typeof subscriptionStatus?.days_remaining === 'number' && subscriptionStatus.days_remaining > 0
                      ? ` · ${subscriptionStatus.days_remaining} j`
                      : ''}
                  </div>
                </div>
              </div>

              {subscriptionMeta.cta && (
                <Link
                  href={subscriptionMeta.cta.href}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    subscriptionMeta.tone === 'danger'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : subscriptionMeta.tone === 'warning'
                        ? 'bg-night text-white hover:bg-night/90'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  {subscriptionMeta.cta.label}
                </Link>
              )}
            </div>
          </div>
        )}

        <ProfileDemoPreview mode="account" profile={demoKey} />

        {/* â”€â”€ Carte profil â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-5">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-coral/15 flex items-center justify-center text-coral font-bold text-2xl overflow-hidden">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : `${profile.first_name?.[0]}${profile.last_name?.[0]}`
                }
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-jungle rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Infos */}
            {editing ? (
              <form onSubmit={handleSubmit(onSave)} className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-night/60 mb-1 block">Prénom</label>
                    <input {...register('first_name')} className="input text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-night/60 mb-1 block">Nom</label>
                    <input {...register('last_name')} className="input text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-night/60 mb-1 block">Téléphone</label>
                  <input {...register('phone')} placeholder="+687123456" className="input text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-night/60 mb-1 block">Présentation</label>
                  <textarea {...register('bio')} rows={3} placeholder="Parlez un peu de vous…" className="input text-sm resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary text-sm py-2">
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Enregistrer</>}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="btn-ghost text-sm py-2">
                    <X className="w-4 h-4" /> Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-night">
                      {profile.first_name} {profile.last_name}
                      {profile.is_pro && <span className="badge bg-ocean text-white text-xs ml-2">PRO</span>}
                    </h1>

                    {/* Note */}
                    {profile.rating_count > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <RatingRow rating={profile.rating} />
                        <span className="text-sm text-night/60">
                          {parseFloat(profile.rating).toFixed(1)} · {profile.rating_count} avis
                        </span>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-night/50">
                      {profile.commune_name && (
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.commune_name}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Membre depuis {format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })}
                      </span>
                    </div>

                    {/* Bio */}
                    {profile.bio && <p className="text-sm text-night/60 mt-3 max-w-lg">{profile.bio}</p>}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {profile.is_verified && (
                        <span className="badge bg-jungle/10 text-jungle text-xs">
                          <CheckCircle2 className="w-3 h-3" /> Compte vérifié
                        </span>
                      )}
                      <span className="badge bg-sand text-night/50 text-xs">
                        <Shield className="w-3 h-3" /> {profile.active_listings_count} annonce{profile.active_listings_count > 1 ? 's' : ''} active{profile.active_listings_count > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {isOwn ? (
                      <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-2">
                        <Edit3 className="w-4 h-4" /> Modifier
                      </button>
                    ) : (
                      <Link
                        href={`/messages?listing_user=${profile.id}`}
                        className="btn-primary text-sm py-2"
                      >
                        <MessageCircle className="w-4 h-4" /> Contacter
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ Onglets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-night/10 bg-[var(--color-background-secondary)] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white text-coral shadow-sm ring-1 ring-black/5' : 'text-night/75 hover:bg-white hover:text-night'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
          {isOwn && (
            <Link href="/favoris" className="flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-night/50 hover:text-night transition-all">
              <Heart className="w-4 h-4" /> Favoris
            </Link>
          )}
        </div>

        {/* â”€â”€ Contenu onglets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {tab === 'listings' && (
          <div>
            {listings.length === 0 ? (
              <div className="text-center py-16 text-night/40">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Vous n'avez pas encore d'annonce. Publiez la vôtre.</p>
                {isOwn && (
                  <Link href="/annonces/nouvelle" className="btn-primary text-sm mt-4 inline-flex">
                    Déposer une annonce
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-16 text-night/40">
                <BadgeCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Vos premiers avis apparaîtront ici.</p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-coral/15 flex items-center justify-center text-coral font-bold text-sm shrink-0">
                      {rev.first_name?.[0]}{rev.last_name?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-sm text-night">
                          {rev.first_name} {rev.last_name}
                        </p>
                        <span className="text-xs text-night/35">
                          {format(new Date(rev.created_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      <RatingRow rating={rev.rating} />
                      {rev.listing_title && (
                        <p className="text-xs text-night/40 mt-1">Re: {rev.listing_title}</p>
                      )}
                      {rev.comment && (
                        <p className="text-sm text-night/70 mt-2 leading-relaxed">{rev.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <Header />
          <div className="mx-auto max-w-5xl px-4 py-12">
            <div className="card animate-pulse p-6">
              <div className="skeleton h-7 w-40 rounded-full" />
              <div className="mt-4 space-y-3">
                <div className="skeleton h-6 w-3/5 rounded-full" />
                <div className="skeleton h-4 w-4/5 rounded-full" />
                <div className="skeleton h-4 w-2/5 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  )
}

````

## PATH: frontend/src/app/annonces/nouvelle/page.tsx
````
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Clock3, Lock, MapPin, Sparkles } from 'lucide-react'

import Header from '@/components/layout/Header'
import PublishWizard from '@/components/PublishWizard/PublishWizard'
import { bonPlansApi, metaApi } from '@/lib/api'
import { useAutosave, useBeforeUnload } from '@/hooks/useAutosave'
import { useAuthStore } from '@/store/authStore'
import { useAuthActionStore } from '@/store/authActionStore'

export default function NewListingPage() {
  const [mode, setMode] = useState<'wizard' | 'simple' | null>(null)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)

  useEffect(() => {
    const queryMode = new URLSearchParams(window.location.search).get('mode')
    setMode(queryMode === 'simple' ? 'simple' : 'wizard')
  }, [])

  useEffect(() => {
    if (isAuthenticated) return
    openAuthModal({
      type: 'publish_listing',
      redirectTo: '/annonces/nouvelle',
    })
  }, [isAuthenticated, openAuthModal])

  if (mode === null) {
    return <div className="min-h-screen bg-sand-light" />
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-sand-light">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <div className="rounded-[2rem] border border-night/8 bg-white p-6 shadow-sm md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-coral/15 bg-coral/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
              <Lock className="h-3.5 w-3.5" />
              Connexion requise
            </div>
            <h1 className="mt-4 text-3xl font-bold text-night">Publier une annonce</h1>
            <p className="mt-3 text-sm leading-6 text-night/60">
              Connectez-vous pour conserver votre brouillon, joindre vos photos et publier sans perdre vos données.
            </p>
            <button
              type="button"
              onClick={() =>
                openAuthModal({
                  type: 'publish_listing',
                  redirectTo: '/annonces/nouvelle',
                })
              }
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-night px-4 py-3 text-sm font-semibold text-white transition hover:bg-night/90"
            >
              Se connecter pour continuer
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (mode !== 'simple') {
    return <PublishWizard />
  }

  return <SimpleBonPlanPage />
}

type CommuneOption = {
  id: number
  name: string
  province_name?: string | null
}

type FormState = {
  title: string
  description: string
  kind: 'promo' | 'event' | 'concert' | 'other'
  target_audience: 'particulier' | 'pro'
  duration_days: 3 | 7
  commune_id: string
  location_name: string
  event_date: string
  link_url: string
  normal_price_xpf: string
  promo_price_xpf: string
  discount_pct: string
  conditions: string
  contact_name: string
  contact_phone: string
  contact_email: string
  website_url: string
  opening_hours: string
}

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  kind: 'promo',
  target_audience: 'particulier',
  duration_days: 3,
  commune_id: '',
  location_name: '',
  event_date: '',
  link_url: '',
  normal_price_xpf: '',
  promo_price_xpf: '',
  discount_pct: '',
  conditions: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  website_url: '',
  opening_hours: '',
}

function snapTo10(value: string) {
  if (!value.trim()) return ''
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return value
  return String(Math.max(0, Math.round(parsed / 10) * 10))
}

function computePrice(targetAudience: FormState['target_audience'], durationDays: FormState['duration_days']) {
  if (targetAudience === 'particulier') {
    return durationDays === 7 ? 590 : 290
  }
  return durationDays === 7 ? 1990 : 990
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XPF`
}

function SimpleBonPlanPage() {
  const router = useRouter()
  const userId = useAuthStore((state) => state.user?.id ?? 'guest')
  const [communces, setCommunces] = useState<CommuneOption[]>([])
  const [loadingCommunes, setLoadingCommunes] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const autosave = useAutosave(`draft_bon_plan_${userId}`, form, 30_000)

  useBeforeUnload(autosave.isDirty && !submitting)

  useEffect(() => {
    let alive = true
    metaApi
      .getCommunes()
      .then((res) => {
        if (!alive) return
        setCommunces(res.data?.data ?? [])
      })
      .catch(() => {
        if (!alive) return
        setCommunces([])
      })
      .finally(() => {
        if (alive) setLoadingCommunes(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const estimatedPrice = useMemo(
    () => computePrice(form.target_audience, form.duration_days),
    [form.target_audience, form.duration_days]
  )

  const selectedCommune = useMemo(
    () => communces.find((item) => String(item.id) === form.commune_id),
    [communces, form.commune_id]
  )

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    const requiredErrors = [
      !form.title.trim() && 'Veuillez renseigner un titre.',
      !form.description.trim() && 'Veuillez renseigner une description.',
      !form.commune_id && 'Veuillez choisir une commune.',
      !form.location_name.trim() && 'Veuillez préciser un lieu exact.',
      !form.event_date && 'Veuillez choisir une date.',
    ].filter(Boolean) as string[]

    if (requiredErrors.length > 0) {
      setError(requiredErrors[0])
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        kind: form.kind,
        target_audience: form.target_audience,
        duration_days: form.duration_days,
        commune_id: form.commune_id ? Number(form.commune_id) : null,
        location_name: form.location_name.trim() || null,
        event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
        link_url: form.link_url.trim() || null,
        normal_price_xpf: form.normal_price_xpf ? Number(snapTo10(form.normal_price_xpf)) : null,
        promo_price_xpf: form.promo_price_xpf ? Number(snapTo10(form.promo_price_xpf)) : null,
        discount_pct: form.discount_pct ? Number(form.discount_pct) : null,
        conditions: form.conditions.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        website_url: form.website_url.trim() || null,
        opening_hours: form.opening_hours.trim() || null,
        photos: [],
        social_links: {},
      }

      const response = await Promise.race([
        bonPlansApi.create(payload),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error('timeout')), 8000)
        }),
      ]) as any
      const created = response.data?.data
      setCreatedId(created?.id ?? null)
      setSuccessMessage(
        created?.free_included
          ? 'Bon plan publié gratuitement dans le cadre de votre offre Pro du mois.'
          : 'Bon plan publié avec succès.'
      )
      setForm(INITIAL_FORM)
      try {
        autosave.clearDraft()
      } catch {
        // Ignore localStorage issues after a successful publish.
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setError(
        err?.message === 'timeout'
          ? 'Le service de publication ne répond pas pour le moment. Réessayez dans quelques instants.'
          : err?.response?.data?.error || 'La publication du bon plan a échoué. Veuillez vérifier les champs puis recommencer.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const restoreDraft = () => {
    const draft = autosave.pendingDraft
    if (!draft) return
    setForm(draft.data)
    setError('')
    setSuccessMessage('')
    autosave.acceptDraft(draft)
  }

  const ignoreDraft = () => {
    autosave.discardDraft()
  }

  return (
    <div className="min-h-screen bg-sand-light">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-coral/15 bg-coral/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
              <Sparkles className="h-3.5 w-3.5" />
              Bon plan
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-night md:text-4xl">Publier un bon plan local</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night/60 md:text-base">
              Partagez une promo, un concert, une ouverture ou un petit événement local. Les particuliers paient peu,
              les pros ont plus de visibilité, et les abonnés Pro ont un bon plan offert chaque mois.
            </p>
          </div>
          <Link href="/annonces" className="hidden items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-2.5 text-sm font-semibold text-night shadow-sm transition hover:-translate-y-0.5 md:inline-flex">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>

        {autosave.pendingDraft ? (
          <div className="mb-6 rounded-[1.5rem] border border-lagoon/20 bg-lagoon/8 p-4 text-night shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Brouillon restaure</p>
                <p className="mt-1 text-sm text-night/70">
                  Brouillon restaure {autosave.draftAgeLabel ? `- ${autosave.draftAgeLabel}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="rounded-2xl bg-night px-4 py-2 text-sm font-semibold text-white transition hover:bg-night/90"
                >
                  Restaurer
                </button>
                <button
                  type="button"
                  onClick={ignoreDraft}
                  className="rounded-2xl border border-night/10 bg-white px-4 py-2 text-sm font-semibold text-night transition hover:bg-sand"
                >
                  Ignorer
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-6 rounded-[1.5rem] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-5 text-[var(--color-success)]">
            <p className="font-semibold">Bon plan publié</p>
            <p className="mt-1 text-sm">{successMessage}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/" className="btn-primary rounded-2xl px-4 py-2.5">
                Voir l&apos;accueil
              </Link>
              <Link href="/annonces" className="btn-secondary rounded-2xl px-4 py-2.5">
                Parcourir les annonces
              </Link>
            </div>
            {createdId ? <p className="mt-3 text-xs opacity-70">Référence: #{createdId}</p> : null}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-night/8 bg-white/95 p-5 shadow-card">
            {error ? (
              <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            ) : null}


            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Profil payeur</span>
                <select
                  value={form.target_audience}
                  onChange={(e) => handleChange('target_audience', e.target.value as FormState['target_audience'])}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                >
                  <option value="particulier">Particulier</option>
                  <option value="pro">Professionnel</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Durée</span>
                <select
                  value={form.duration_days}
                  onChange={(e) => handleChange('duration_days', Number(e.target.value) as 3 | 7)}
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                >
                  <option value={3}>3 jours</option>
                  <option value={7}>7 jours</option>
                </select>
              </label>
            </div>

            <div className="rounded-[1.5rem] border border-night/8 bg-sand/30 p-4">
              <p className="text-sm font-semibold text-night">Infos promotionnelles et contact</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Prix normal</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={form.normal_price_xpf}
                    onChange={(e) => handleChange('normal_price_xpf', e.target.value)}
                    onBlur={(e) => handleChange('normal_price_xpf', snapTo10(e.target.value))}
                    inputMode="numeric"
                    placeholder="Ex. 5000"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Prix promo</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={form.promo_price_xpf}
                    onChange={(e) => handleChange('promo_price_xpf', e.target.value)}
                    onBlur={(e) => handleChange('promo_price_xpf', snapTo10(e.target.value))}
                    inputMode="numeric"
                    placeholder="Ex. 3000"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Remise (%)</span>
                  <input
                    value={form.discount_pct}
                    onChange={(e) => handleChange('discount_pct', e.target.value)}
                    inputMode="numeric"
                    placeholder="Ex. 40"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Horaires</span>
                  <input
                    value={form.opening_hours}
                    onChange={(e) => handleChange('opening_hours', e.target.value)}
                    placeholder="Ex. Lun-Sam 9h-18h"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Contact</span>
                  <input
                    value={form.contact_name}
                    onChange={(e) => handleChange('contact_name', e.target.value)}
                    placeholder="Nom du contact"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Téléphone</span>
                  <input
                    value={form.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="Numéro de contact"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Email</span>
                  <input
                    value={form.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="contact@..."
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-night">Site web</span>
                  <input
                    value={form.website_url}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-night">Conditions</span>
                  <textarea
                    value={form.conditions}
                    onChange={(e) => handleChange('conditions', e.target.value)}
                    rows={3}
                    placeholder="Conditions, date limite, réservation, accès..."
                    className="w-full rounded-3xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
              </div>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-night">Titre</span>
              <input
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex. Concert acoustique au bord de mer"
                required
                className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-night">Type de bon plan</span>
              <select
                value={form.kind}
                onChange={(e) => handleChange('kind', e.target.value as FormState['kind'])}
                className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
              >
                <option value="promo">Promo</option>
                <option value="event">Événement</option>
                <option value="concert">Concert</option>
                <option value="other">Autre</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-night">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Décrivez l'offre, l'heure, le lieu, les conditions et tout ce qui aide le visiteur à comprendre."
                rows={6}
                required
                className="w-full rounded-3xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Commune</span>
                <select
                  value={form.commune_id}
                  onChange={(e) => handleChange('commune_id', e.target.value)}
                  disabled={loadingCommunes}
                  required
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20 disabled:opacity-60"
                >
                  <option value="">{loadingCommunes ? 'Chargement...' : 'Choisir une commune'}</option>
                  {communces.map((commune) => (
                    <option key={commune.id} value={commune.id}>
                      {commune.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-night">Lieu exact</span>
                <input
                  value={form.location_name}
                  onChange={(e) => handleChange('location_name', e.target.value)}
                  placeholder="Ex. Galerie, boutique, salle, plage..."
                  required
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-night">
                  <CalendarDays className="h-4 w-4 text-coral" />
                  Date de l&apos;événement
                </span>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => handleChange('event_date', e.target.value)}
                  required
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-night">
                  <MapPin className="h-4 w-4 text-coral" />
                  Lien utile
                </span>
                <input
                  value={form.link_url}
                  onChange={(e) => handleChange('link_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-lagoon focus:ring-4 focus:ring-lagoon/20"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Publication...' : 'Publier le bon plan'}
              </button>
              <Link href="/pro" className="btn-secondary inline-flex items-center gap-2 rounded-2xl px-5 py-3">
                Voir les offres Pro
              </Link>
            </div>
          </form>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-night/8 bg-[#0c2a35] p-5 text-white shadow-[0_24px_80px_rgba(8,32,50,0.18)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
                <Sparkles className="h-3.5 w-3.5" />
                Apercu prix
              </div>
              <p className="mt-4 text-sm uppercase tracking-[0.18em] text-white/45">Estimation</p>
              <p className="mt-2 text-4xl font-bold text-white">{formatPrice(estimatedPrice)}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Le prix est calculé selon le profil choisi et la durée. Si vous êtes Pro et que votre bon plan offert
                du mois est encore disponible, le tarif peut tomber à 0 XPF.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Particulier</p>
                  <p className="mt-2 text-sm font-semibold text-white">290 XPF / 3 jours</p>
                  <p className="mt-1 text-sm text-white/65">590 XPF / 7 jours</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lagoon">Professionnel</p>
                  <p className="mt-2 text-sm font-semibold text-white">990 XPF / 3 jours</p>
                  <p className="mt-1 text-sm text-white/65">1 990 XPF / 7 jours</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral/80">Résumé</p>
              <div className="mt-4 space-y-3 text-sm text-night/65">
                <p><span className="font-semibold text-night">Profil:</span> {form.target_audience === 'pro' ? 'Professionnel' : 'Particulier'}</p>
                <p><span className="font-semibold text-night">Durée:</span> {form.duration_days} jours</p>
                <p><span className="font-semibold text-night">Type:</span> {form.kind}</p>
                <p><span className="font-semibold text-night">Commune:</span> {selectedCommune?.name || 'À compléter'}</p>
                <p><span className="font-semibold text-night">Lieu:</span> {form.location_name.trim() || 'Non renseigné'}</p>
              </div>
              <div className="mt-4 rounded-2xl bg-sand p-4 text-sm text-night/65">
                <Clock3 className="mb-2 h-4 w-4 text-coral" />
                La publication reste visible pendant la durée choisie, puis expire automatiquement.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

````

## PATH: frontend/src/components/ui/EmptyStates.tsx
````
'use client'

import { WifiOff, RefreshCw, SearchX, MessageCircle, Heart, Package, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

type EmptyVariant = 'search' | 'messages' | 'favoris' | 'annonces' | 'notifications' | 'generic'

const CONFIGS: Record<EmptyVariant, { title: string; subtitle: string; cta?: string; icon: React.ReactNode }> = {
  search: {
    title: 'Aucune annonce trouvee',
    subtitle: 'Essaie d elargir la recherche ou de changer les filtres.',
    cta: 'Effacer les filtres',
    icon: <SearchX className="w-8 h-8" />,
  },
  messages: {
    title: 'Aucun message',
    subtitle: 'Une conversation commencera ici des que tu contactes un vendeur.',
    cta: 'Parcourir les annonces',
    icon: <MessageCircle className="w-8 h-8" />,
  },
  favoris: {
    title: 'Aucun favori',
    subtitle: 'Ajoute des annonces en favori pour les retrouver plus vite.',
    cta: 'Explorer',
    icon: <Heart className="w-8 h-8" />,
  },
  annonces: {
    title: 'Aucune annonce publiee',
    subtitle: 'Publie ta premiere annonce pour demarrer.',
    cta: 'Deposer une annonce',
    icon: <Package className="w-8 h-8" />,
  },
  notifications: {
    title: 'Aucune notification',
    subtitle: 'Les alertes et nouveaux événements apparaîtront ici.',
    icon: <Bell className="w-8 h-8" />,
  },
  generic: {
    title: 'Rien a afficher',
    subtitle: 'Reviens un peu plus tard.',
    cta: 'Actualiser',
    icon: <Package className="w-8 h-8" />,
  },
}

export function MobileEmptyState({
  variant,
  onCta,
}: {
  variant: EmptyVariant
  onCta?: () => void
}) {
  const config = CONFIGS[variant]

  return (
    <div className="rounded-2xl border border-night/10 bg-white p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral">
        {config.icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-night">{config.title}</h3>
      <p className="mx-auto max-w-md text-sm text-night/60">{config.subtitle}</p>
      {config.cta && onCta ? (
        <button onClick={onCta} className="mt-5 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white">
          {config.cta}
        </button>
      ) : null}
    </div>
  )
}

export function MobileOfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>Connexion indisponible</span>
      </div>
      <button onClick={onRetry} className="inline-flex items-center gap-1 font-semibold">
        <RefreshCw className="w-4 h-4" />
        Reessayer
      </button>
    </div>
  )
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const sync = () => setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  return { isOnline }
}

````

## PATH: frontend/src/components/ui/ToastCenter.tsx
````
'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { TOAST_EVENT, type ToastPayload, type ToastTone } from '@/lib/toast'

type ToastItem = ToastPayload & {
  id: number
  tone: ToastTone
}

const TONE_STYLES: Record<ToastTone, { root: string; icon: string; Icon: typeof CheckCircle2 }> = {
  success: {
    root: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'text-emerald-600',
    Icon: CheckCircle2,
  },
  error: {
    root: 'border-red-200 bg-red-50 text-red-700',
    icon: 'text-red-600',
    Icon: AlertCircle,
  },
  info: {
    root: 'border-[#0A7EA4]/15 bg-white text-night',
    icon: 'text-[#0A7EA4]',
    Icon: Info,
  },
}

export default function ToastCenter() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail
      const message = detail?.message?.trim()
      if (!message) return

      const toast: ToastItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        message,
        title: detail?.title,
        tone: detail?.tone || 'info',
      }
      setToasts((current) => [...current, toast].slice(-4))

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, 3400)
    }

    window.addEventListener(TOAST_EVENT, handleToast as EventListener)
    return () => window.removeEventListener(TOAST_EVENT, handleToast as EventListener)
  }, [])

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[140] flex w-[min(92vw,24rem)] flex-col gap-2">
      {toasts.map((toast) => {
        const config = TONE_STYLES[toast.tone]
        const Icon = config.Icon
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_16px_50px_rgba(8,32,50,0.16)] ${config.root}`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.icon}`} />
              <div className="min-w-0 flex-1">
                {toast.title ? <p className="font-semibold">{toast.title}</p> : null}
                <p className={toast.title ? 'mt-1 text-sm leading-5' : 'text-sm leading-5'}>{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="rounded-full p-1 text-night/35 transition hover:bg-night/5 hover:text-night"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

````

## PATH: frontend/src/components/onboarding/OnboardingToast.tsx
````
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import styles from './OnboardingToast.module.css'

type OnboardingFeature = {
  key: string
  title: string
  description: string
  href: string
  cta: string
}

const STORAGE_KEY = 'kalico_onboarding_seen'
const SESSION_KEY = 'kalico_onboarding_seen_session'
const SHOW_DELAY_MS = 2000
const EXIT_ANIMATION_MS = 300

const FEATURES: OnboardingFeature[] = [
  {
    key: 'listing_first_post',
    title: 'Déposez votre première annonce',
    description: 'Publiez en quelques minutes et touchez des acheteurs locaux.',
    href: '/deposer',
    cta: 'Déposer une annonce',
  },
  {
    key: 'search_alerts',
    title: 'Activez les alertes de recherche',
    description: 'Recevez une alerte dès qu’une annonce correspond à ce que vous cherchez.',
    href: '/alertes',
    cta: 'Créer une alerte',
  },
  {
    key: 'discover_pros',
    title: 'Découvrez les pros locaux',
    description: 'Comparez des professionnels vérifiés près de chez vous.',
    href: '/pros',
    cta: 'Voir les pros',
  },
  {
    key: 'covoiturage_offer',
    title: 'Proposez un trajet en covoiturage',
    description: 'Publiez un trajet et remplissez vos places en quelques clics.',
    href: '/covoiturage',
    cta: 'Proposer un trajet',
  },
]

function readSeenFeatures(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writeSeenFeatures(next: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(next))))
}

export default function OnboardingToast() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [seenFeatures, setSeenFeatures] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isRendered, setIsRendered] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user || typeof window === 'undefined') {
      setSeenFeatures([])
      return
    }

    setSeenFeatures(readSeenFeatures())
  }, [hasHydrated, isAuthenticated, user])

  const nextFeature = useMemo(() => {
    if (!hasHydrated || !isAuthenticated || !user) return null
    return FEATURES.find((feature) => !seenFeatures.includes(feature.key)) ?? null
  }, [hasHydrated, isAuthenticated, user, seenFeatures])

  useEffect(() => {
    if (!nextFeature || typeof window === 'undefined') {
      setIsVisible(false)
      setIsRendered(false)
      return
    }

    if (window.sessionStorage.getItem(SESSION_KEY) === '1') {
      setIsVisible(false)
      setIsRendered(false)
      return
    }

    setIsClosing(false)
    const timer = window.setTimeout(() => {
      setIsRendered(true)
      window.requestAnimationFrame(() => setIsVisible(true))
    }, SHOW_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [nextFeature?.key])

  const dismissFeature = () => {
    if (!nextFeature || typeof window === 'undefined') return

    const nextSeen = Array.from(new Set([...seenFeatures, nextFeature.key]))
    setSeenFeatures(nextSeen)
    writeSeenFeatures(nextSeen)
    window.sessionStorage.setItem(SESSION_KEY, '1')

    setIsClosing(true)
    setIsVisible(false)
    window.setTimeout(() => {
      setIsRendered(false)
      setIsClosing(false)
    }, EXIT_ANIMATION_MS)
  }

  if (!nextFeature || !isRendered) {
    return null
  }

  return (
    <aside
      className={[
        styles.toast,
        isVisible ? styles.visible : '',
        isClosing ? styles.closing : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
      role="status"
    >
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Sparkles className="h-4 w-4" />
        </span>
        <button type="button" className={styles.closeButton} onClick={dismissFeature} aria-label="Fermer le conseil">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={styles.content}>
        <p className={styles.title}>{nextFeature.title}</p>
        <p className={styles.description}>{nextFeature.description}</p>
        <Link href={nextFeature.href} className={styles.cta} onClick={dismissFeature}>
          {nextFeature.cta}
        </Link>
      </div>
    </aside>
  )
}

````

## PATH: frontend/src/hooks/useScrollReveal.ts
````
'use client'

import { useEffect } from 'react'

let revealObserver: IntersectionObserver | null = null
let mutationObserver: MutationObserver | null = null
let revealInitialized = false

function markRevealed(element: HTMLElement) {
  element.dataset.revealVisible = 'true'
}

function observeRevealTargets(observer: IntersectionObserver, root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-reveal="true"]').forEach((element) => {
    if (element.dataset.revealVisible === 'true') return
    observer.observe(element)
  })
}

export function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined' || revealInitialized) return

    revealInitialized = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll<HTMLElement>('[data-reveal="true"]').forEach(markRevealed)
      return
    }

    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const element = entry.target as HTMLElement
          markRevealed(element)
          observer.unobserve(element)
        })
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -8% 0px',
      },
    )

    observeRevealTargets(revealObserver)

    mutationObserver = new MutationObserver((mutations) => {
      if (!revealObserver) return

      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return

          if (node.matches?.('[data-reveal="true"]')) {
            revealObserver.observe(node)
          }

          node.querySelectorAll?.('[data-reveal="true"]').forEach((element) => {
            revealObserver.observe(element)
          })
        })
      }
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      revealObserver?.disconnect()
      mutationObserver?.disconnect()
      revealObserver = null
      mutationObserver = null
      revealInitialized = false
    }
  }, [])
}

````

## PATH: frontend/src/lib/api.ts
````
// src/lib/api.ts
// Client HTTP centralise avec cache GET leger et refresh token automatique

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig, type AxiosRequestConfig } from 'axios'

import { rememberRedirectAfterLogin } from '@/lib/authRedirect'
import { requestDraftSave } from '@/lib/draftEvents'
import { isDemoMode, showDemoToast } from '@/lib/demoMode'
import { clearStoredTokens, getStoredAccessToken, getStoredRefreshToken, saveStoredTokens } from '@/lib/tokenStorage'
import { normalizeApiBase } from '@/lib/apiBase'

const API_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
export const API_ORIGIN = API_URL.replace(/\/api$/, '')

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

type CacheMatcher = string | RegExp | ((key: string) => boolean)

type CacheEntry<T> = {
  expiresAt: number
  value: T
}

type CachedResponse<T> = Pick<AxiosResponse<T>, 'data' | 'status' | 'statusText' | 'headers' | 'config'>

const requestCache = new Map<string, CacheEntry<unknown>>()
const inflightCache = new Map<string, Promise<unknown>>()

const CACHE_TTL = {
  short: 5_000,
  medium: 30_000,
  long: 5 * 60_000,
  static: 24 * 60 * 60_000,
}

function stableSerialize(value: unknown): string {
  if (value == null) return ''
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}:${stableSerialize(val)}`)
  return `{${entries.join(',')}}`
}

function getAuthToken() {
  if (typeof window === 'undefined') return ''
  return getStoredAccessToken()
}

function getRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `req_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function getCookieValue(name: string) {
  if (typeof document === 'undefined') return ''

  const prefix = `${name}=`
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  if (!cookie) return ''
  return decodeURIComponent(cookie.slice(prefix.length))
}

function redirectToLoginAfterAuthFailure() {
  if (typeof window === 'undefined') return

  requestDraftSave()
  rememberRedirectAfterLogin()
  clearTokens()
  window.location.assign('/connexion')
}

function toCachedResponse<T>(response: AxiosResponse<T>): CachedResponse<T> {
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    config: response.config,
  }
}

function createDemoResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as AxiosRequestConfig,
  } as AxiosResponse<T>
}

function buildCacheKey(scope: string, url: string, params?: unknown, extra?: unknown) {
  return [scope, url, stableSerialize(params), stableSerialize(extra), getAuthToken()].join('|')
}

async function cachedGet<T>(key: string, fetcher: () => Promise<AxiosResponse<T>>, ttlMs = CACHE_TTL.medium) {
  const now = Date.now()
  const cached = requestCache.get(key) as CacheEntry<CachedResponse<T>> | undefined
  if (cached && cached.expiresAt > now) return cached.value

  const pending = inflightCache.get(key) as Promise<CachedResponse<T>> | undefined
  if (pending) return pending

  const promise = fetcher()
    .then((response) => {
      const value = toCachedResponse(response)
      requestCache.set(key, { expiresAt: Date.now() + ttlMs, value })
      inflightCache.delete(key)
      return value
    })
    .catch((error) => {
      inflightCache.delete(key)
      throw error
    })

  inflightCache.set(key, promise)
  return promise
}

export function invalidateApiCache(match?: CacheMatcher) {
  if (!match) {
    requestCache.clear()
    inflightCache.clear()
    return
  }

  const tester = typeof match === 'function'
    ? match
    : match instanceof RegExp
      ? (key: string) => match.test(key)
      : (key: string) => key.startsWith(match)

  for (const key of requestCache.keys()) {
    if (tester(key)) requestCache.delete(key)
  }

  for (const key of inflightCache.keys()) {
    if (tester(key)) inflightCache.delete(key)
  }
}

export function clearApiCache() {
  requestCache.clear()
  inflightCache.clear()
}

// Intercepteur requete : ajoute le Bearer token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = getStoredAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`

    const method = String(config.method || 'get').toUpperCase()
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCookieValue('kalico_csrf')
      if (csrfToken) {
        const headers = config.headers as Record<string, string> & { set?: (key: string, value: string) => void }
        if (typeof headers.set === 'function') {
          headers.set('x-csrf-token', csrfToken)
        } else {
          headers['x-csrf-token'] = csrfToken
        }
      }
    }
  }
  config.headers['x-request-id'] = config.headers['x-request-id'] ?? getRequestId()
  return config
})

// Intercepteur reponse : refresh automatique
let isRefreshing = false
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const requestId = error.response?.headers?.['x-request-id'] ?? original?.headers?.['x-request-id']

    if (process.env.NODE_ENV === 'development') {
      console.warn('[api] request failed', {
        request_id: requestId,
        status: error.response?.status ?? null,
        url: original?.url ?? null,
      })
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      isRefreshing = true
      const refreshToken = getStoredRefreshToken()

      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          refreshToken ? { refresh_token: refreshToken } : undefined,
          { withCredentials: true }
        )
        const { access_token, refresh_token } = data.data
        saveTokens(access_token, refresh_token)

        queue.forEach((p) => p.resolve(access_token))
        queue = []

        original.headers.Authorization = `Bearer ${access_token}`
        return api(original)
      } catch {
        queue.forEach((p) => p.reject(error))
        queue = []
        redirectToLoginAfterAuthFailure()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Helpers tokens
export const saveTokens = (access: string, refresh?: string | null) => {
  saveStoredTokens(access, refresh)
}

export const clearTokens = () => {
  clearStoredTokens()
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('user')
  }
  clearApiCache()
}

// Fonctions API

// Auth
export const authApi = {
  register: (data: object, turnstileToken?: string) =>
    api.post('/auth/register', {
      ...data,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    }),
  login: (data: object, turnstileToken?: string) =>
    api.post('/auth/login', {
      ...data,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/users/me'),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  forgotPassword: (identifier: string, turnstileToken?: string) =>
    api.post('/auth/forgot-password', {
      identifier,
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    }),
  resendVerification: (email: string, turnstileToken?: string) => api.post('/auth/resend-verification', { email, turnstile_token: turnstileToken }),
}

export const phoneApi = {
  send: (telephone: string) => api.post('/phone/send', { telephone }),
  verify: (telephone: string, code: string) => api.post('/phone/verify', { telephone, code }),
  resend: (telephone: string, channel: 'sms' | 'email' = 'sms') => api.post('/auth/otp/resend', { telephone, channel }),
}

// Listings
export const listingsApi = {
  search: (params: object = {}) => cachedGet(
    buildCacheKey('listings.search', '/listings', params),
    () => api.get('/listings', { params }),
    CACHE_TTL.medium,
  ),
  getById: (id: string) => cachedGet(
    buildCacheKey('listings.getById', `/listings/${id}`),
    () => api.get(`/listings/${id}`),
    CACHE_TTL.short,
  ),
  getUserListings: (userId: string, params: object = {}) => cachedGet(
    buildCacheKey('listings.getUserListings', `/listings/user/${userId}`, params),
    () => api.get(`/listings/user/${userId}`, { params }),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/listings', data)
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
  update: async (id: string, data: object) => {
    const res = await api.put(`/listings/${id}`, data)
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
  updateStatus: async (id: string | number, data: { status: 'active' | 'reserved' | 'sold' }) => {
    const res = await api.patch(`/listings/${id}/status`, data)
    invalidateApiCache('listings.')
    invalidateApiCache('messages.')
    return res
  },
  delete: async (id: string, reason = 'other') => {
    const res = await api.delete(`/listings/${id}`, { data: { reason } })
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
  report: (id: string | number, data: object = {}) => api.post(`/listings/${id}/signaler`, data),
}

export const trocApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('troc.list', '/troc', params),
    () => api.get('/troc', { params }),
    CACHE_TTL.short,
  ),
  swipeFeed: (params: object = {}) => cachedGet(
    buildCacheKey('troc.swipeFeed', '/troc/swipe-feed', params),
    () => api.get('/troc/swipe-feed', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('troc.getById', `/troc/${id}`),
    () => api.get(`/troc/${id}`),
    CACHE_TTL.short,
  ),
  getProposalsReceived: () => api.get('/troc/proposals/received'),
  getProposalsSent: () => api.get('/troc/proposals/sent'),
  getCycles: () => api.get('/troc/cycles'),
  sendProposal: (id: string | number, data: object) => api.post(`/troc/${id}/proposals`, data),
  swipe: (data: { listing_id: string | number; direction: 'left' | 'right' }) => api.post('/troc/swipes', data),
  acceptProposal: (id: string | number) => api.patch(`/troc/proposals/${id}/accept`),
  declineProposal: (id: string | number) => api.patch(`/troc/proposals/${id}/decline`),
  counterProposal: (id: string | number, data: object) => api.patch(`/troc/proposals/${id}/counter`, data),
  completeProposal: (id: string | number) => api.patch(`/troc/proposals/${id}/complete`),
  confirmCycle: (id: string | number) => api.patch(`/troc/cycles/${id}/confirm`),
  getUserBadges: (id: string | number) => api.get(`/users/${id}/troc-badges`),
}

// Upload
export const uploadApi = {
  uploadImages: (listingId: string, files: File[], config?: Pick<AxiosRequestConfig, 'onUploadProgress'>) => {
    const form = new FormData()
    files.forEach((f) => form.append('images', f))
    return api.post(`/upload/listing/${listingId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    })
  },
  uploadProductImages: (files: File[], config?: Pick<AxiosRequestConfig, 'onUploadProgress'>) => {
    const form = new FormData()
    files.forEach((f) => form.append('images', f))
    return api.post('/upload/product', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    })
  },
  uploadChatPhoto: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return api.post('/upload/chat', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadChatDocument: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload/chat/document', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadChatAudio: (audioBase64: string, mimeType: string) =>
    api.post('/upload/chat/audio', {
      audio_base64: audioBase64,
      mime_type: mimeType,
    }),
  deleteImage: (imageId: string) => api.delete(`/upload/image/${imageId}`),
  setCover: (imageId: string) => api.put(`/upload/image/${imageId}/cover`),
}

// Messages
export const messagesApi = {
  getConversations: () => cachedGet(
    buildCacheKey('messages.getConversations', '/messages/conversations'),
    () => api.get('/messages/conversations'),
    CACHE_TTL.short,
  ),
  getMessages: (convId: string | number, page = 1, limit = 30, before?: string | null) => cachedGet(
    buildCacheKey('messages.getMessages', `/messages/conversations/${convId}`, { page, limit, before: before || '' }),
    () => api.get(`/messages/conversations/${convId}`, { params: { page, limit, before: before || undefined } }),
    CACHE_TTL.short,
  ),
  startConversation: (data: object) => {
    if (isDemoMode()) {
      showDemoToast('Désactivé en mode démo')
      return Promise.resolve(createDemoResponse({ data: { id: 'demo-conversation', ...data } }))
    }
    return api.post('/messages/conversations', data)
  },
  makeOffer: (convId: string | number, amount_xpf: number) =>
    api.post('/messages/offers', { conv_id: Number(convId), amount_xpf }),
  sendMessage: (convId: string, content: string) => {
    if (isDemoMode()) {
      showDemoToast('Désactivé en mode démo')
      return Promise.resolve(createDemoResponse({
        data: {
          id: `demo-message-${Date.now()}`,
          conv_id: convId,
          content,
          created_at: new Date().toISOString(),
          sender_id: 0,
        },
      }))
    }
    return api.post(`/messages/conversations/${convId}`, { content })
  },
  sendPhoto: (convId: string, photo_url: string) => {
    if (isDemoMode()) {
      showDemoToast('Désactivé en mode démo')
      return Promise.resolve(createDemoResponse({
        data: {
          id: `demo-photo-${Date.now()}`,
          conv_id: convId,
          type: 'photo',
          photo_url,
          created_at: new Date().toISOString(),
          sender_id: 0,
        },
      }))
    }
    return api.post(`/messages/conversations/${convId}`, { type: 'photo', photo_url })
  },
  sendDocument: (convId: string, attachment_url: string, attachment_name: string, attachment_mime_type: string, attachment_size_bytes?: number | null) => {
    if (isDemoMode()) {
      showDemoToast('DÃ©sactivÃ© en mode dÃ©mo')
      return Promise.resolve(createDemoResponse({
        data: {
          id: `demo-doc-${Date.now()}`,
          conv_id: convId,
          type: 'document',
          attachment_url,
          attachment_name,
          attachment_mime_type,
          attachment_size_bytes: attachment_size_bytes ?? null,
          created_at: new Date().toISOString(),
          sender_id: 0,
        },
      }))
    }
    return api.post(`/messages/conversations/${convId}`, {
      type: 'document',
      attachment_url,
      attachment_name,
      attachment_mime_type,
      attachment_size_bytes,
    })
  },
  sendAudio: (convId: string, audio_url: string) => {
    if (isDemoMode()) {
      showDemoToast('DÃ©sactivÃ© en mode dÃ©mo')
      return Promise.resolve(createDemoResponse({
        data: {
          id: `demo-audio-${Date.now()}`,
          conv_id: convId,
          type: 'audio',
          photo_url: audio_url,
          created_at: new Date().toISOString(),
          sender_id: 0,
        },
      }))
    }
    return api.post(`/messages/conversations/${convId}`, { type: 'audio', audio_url })
  },
  markConversationRead: (convId: string | number) =>
    api.patch(`/messages/conversations/${convId}/read`),
}

// Communes and categories
export const metaApi = {
  getCommunes: () => cachedGet(
    buildCacheKey('meta.getCommunes', '/communes'),
    () => api.get('/communes'),
    CACHE_TTL.static,
  ),
  getZones: (communeSlug: string) => cachedGet(
    buildCacheKey('meta.getZones', `/communes/${communeSlug}/zones`),
    () => api.get(`/communes/${communeSlug}/zones`),
    CACHE_TTL.static,
  ),
  getCategories: () => cachedGet(
    buildCacheKey('meta.getCategories', '/categories'),
    () => api.get('/categories'),
    CACHE_TTL.static,
  ),
}

export const searchApi = {
  suggestions: (params: { q?: string; limit?: number } = {}) => cachedGet(
    buildCacheKey('search.suggestions', '/search/suggestions', params),
    () => api.get('/search/suggestions', { params }),
    CACHE_TTL.short,
  ),
}

export const statsApi = {
  getHome: () => cachedGet(
    buildCacheKey('stats.getHome', '/stats/home'),
    () => api.get('/stats/home'),
    CACHE_TTL.long,
  ),
  getPlatform: () => cachedGet(
    buildCacheKey('stats.getPlatform', '/stats/platform'),
    () => api.get('/stats/platform'),
    CACHE_TTL.long,
  ),
  getSeller: () => cachedGet(
    buildCacheKey('stats.getSeller', '/stats/seller'),
    () => api.get('/stats/seller'),
    CACHE_TTL.short,
  ),
}

export const bonPlansApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('bonPlans.list', '/bon-plans', params),
    () => api.get('/bon-plans', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('bonPlans.getById', `/bon-plans/${id}`),
    () => api.get(`/bon-plans/${id}`),
    CACHE_TTL.short,
  ),
  businesses: (params: object = {}) => cachedGet(
    buildCacheKey('bonPlans.businesses', '/bon-plans/businesses', params),
    () => api.get('/bon-plans/businesses', { params }),
    CACHE_TTL.static,
  ),
  getPrefs: () => api.get('/bon-plans/notifications/prefs'),
  savePrefs: (data: object) => api.put('/bon-plans/notifications/prefs', data).finally(() => invalidateApiCache('bonPlans.')),
  create: async (data: object) => {
    const res = await api.post('/bon-plans', data)
    invalidateApiCache('bonPlans.')
    invalidateApiCache('stats.')
    return res
  },
}

export const campaignsApi = {
  getHome: () => cachedGet(
    buildCacheKey('campaigns.getHome', '/campaigns/public/home'),
    () => api.get('/campaigns/public/home'),
    CACHE_TTL.short,
  ),
  getCategoryBanner: (categorySlug: string) => cachedGet(
    buildCacheKey('campaigns.getCategoryBanner', `/campaigns/public/category/${categorySlug}`),
    () => api.get(`/campaigns/public/category/${encodeURIComponent(categorySlug)}`),
    CACHE_TTL.short,
  ),
  getDashboard: () => cachedGet(
    buildCacheKey('campaigns.getDashboard', '/campaigns/dashboard'),
    () => api.get('/campaigns/dashboard'),
    CACHE_TTL.short,
  ),
  getWeeklyBonPlans: () => cachedGet(
    buildCacheKey('campaigns.getWeeklyBonPlans', '/campaigns/dashboard/bon-plans/weekly'),
    () => api.get('/campaigns/dashboard/bon-plans/weekly'),
    CACHE_TTL.short,
  ),
  getAdmin: () => cachedGet(
    buildCacheKey('campaigns.getAdmin', '/campaigns/admin'),
    () => api.get('/campaigns/admin'),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/campaigns', data)
    invalidateApiCache('campaigns.')
    invalidateApiCache('bonPlans.')
    return res
  },
  pause: async (id: string | number) => {
    const res = await api.post(`/campaigns/${id}/pause`)
    invalidateApiCache('campaigns.')
    invalidateApiCache('bonPlans.')
    return res
  },
  resume: async (id: string | number) => {
    const res = await api.post(`/campaigns/${id}/resume`)
    invalidateApiCache('campaigns.')
    invalidateApiCache('bonPlans.')
    return res
  },
  saveWeeklyBonPlans: async (campaignIds: Array<string | number>) => {
    const res = await api.put('/campaigns/dashboard/bon-plans/weekly', { campaign_ids: campaignIds })
    invalidateApiCache('campaigns.')
    invalidateApiCache('bonPlans.')
    return res
  },
}

export const eventsApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('events.list', '/events', params),
    () => api.get('/events', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('events.getById', `/events/${id}`),
    () => api.get(`/events/${id}`),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/events', data)
    invalidateApiCache('events.')
    invalidateApiCache('bonPlans.')
    invalidateApiCache('stats.')
    return res
  },
  reserveTickets: async (id: string | number, data: object) => {
    const res = await api.post(`/events/${id}/reservations`, data)
    invalidateApiCache('events.')
    return res
  },
  getTicket: (token: string) => cachedGet(
    buildCacheKey('events.ticket', `/events/tickets/${token}`),
    () => api.get(`/events/tickets/${token}`),
    CACHE_TTL.short,
  ),
  scanTicket: async (token: string, data: object = {}) => {
    const res = await api.post(`/events/tickets/${token}/scan`, data)
    invalidateApiCache('events.ticket.')
    return res
  },
}

export const couponsApi = {
  listMine: () => cachedGet(
    buildCacheKey('coupons.mine', '/coupons/mine'),
    () => api.get('/coupons/mine'),
    CACHE_TTL.short,
  ),
  getByCode: (code: string) => cachedGet(
    buildCacheKey('coupons.getByCode', `/coupons/${code}`),
    () => api.get(`/coupons/${encodeURIComponent(code)}`),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/coupons', data)
    invalidateApiCache('coupons.')
    return res
  },
  useCoupon: async (code: string, data: object = {}) => {
    const res = await api.post(`/coupons/${encodeURIComponent(code)}/use`, data)
    invalidateApiCache('coupons.')
    return res
  },
  deactivate: async (id: string | number) => {
    const res = await api.delete(`/coupons/${id}`)
    invalidateApiCache('coupons.')
    return res
  },
}

export const proApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('pro.list', '/pros', params),
    () => api.get('/pros', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('pro.getById', `/pros/${id}`),
    () => api.get(`/pros/${id}`),
    CACHE_TTL.short,
  ),
  requestQuote: async (id: string | number, data: object) => {
    const res = await api.post(`/pro/${id}/quote`, data)
    invalidateApiCache('pro.')
    invalidateApiCache('pro.quoteRequests.')
    return res
  },
  getQuoteRequestsReceived: (params: object = {}) => cachedGet(
    buildCacheKey('pro.quoteRequests.received', '/pro/quote-requests', params),
    () => api.get('/pro/quote-requests', { params }),
    CACHE_TTL.short,
  ),
  getQuoteRequestById: (id: string | number) => cachedGet(
    buildCacheKey('pro.quoteRequests.getById', `/pro/quote-requests/${id}`),
    () => api.get(`/pro/quote-requests/${id}`),
    CACHE_TTL.short,
  ),
  downloadQuoteRequestPdf: (id: string | number) => api.get(`/pro/quote-requests/${id}/pdf`, { responseType: 'blob' }),
  getQuoteRequestsMine: (params: object = {}) => cachedGet(
    buildCacheKey('pro.quoteRequests.mine', '/pro/quote-requests/mine', params),
    () => api.get('/pro/quote-requests/mine', { params }),
    CACHE_TTL.short,
  ),
  getReviews: (id: string | number, params: object = {}) => cachedGet(
    buildCacheKey('pro.getReviews', `/pros/${id}/reviews`, params),
    () => api.get(`/pros/${id}/reviews`, { params }),
    CACHE_TTL.short,
  ),
  apply: async (data: object) => {
    const res = await api.post('/pros/apply', data)
    invalidateApiCache('pro.')
    return res
  },
  addReview: async (id: string | number, data: object) => {
    const res = await api.post(`/pros/${id}/reviews`, data)
    invalidateApiCache('pro.')
    return res
  },
  getDashboard: () => cachedGet(
    buildCacheKey('pro.dashboard', '/pro/dashboard'),
    () => api.get('/pro/dashboard'),
    CACHE_TTL.short,
  ),
  getReferral: () => cachedGet(
    buildCacheKey('pro.referral', '/pro/referral'),
    () => api.get('/pro/referral'),
    CACHE_TTL.short,
  ),
  getListings: () => cachedGet(
    buildCacheKey('pro.listings', '/pro/listings'),
    () => api.get('/pro/listings'),
    CACHE_TTL.short,
  ),
  getProducts: () => cachedGet(
    buildCacheKey('pro.products', '/pro/products'),
    () => api.get('/pro/products'),
    CACHE_TTL.short,
  ),
  getCatalogCategories: () => cachedGet(
    buildCacheKey('pro.catalogCategories', '/pro/products/categories'),
    () => api.get('/pro/products/categories'),
    CACHE_TTL.short,
  ),
  createCatalogCategory: async (data: object) => {
    const res = await api.post('/pro/products/categories', data)
    invalidateApiCache('pro.')
    return res
  },
  updateCatalogCategory: async (id: string | number, data: object) => {
    const res = await api.put(`/pro/products/categories/${id}`, data)
    invalidateApiCache('pro.')
    return res
  },
  deleteCatalogCategory: async (id: string | number) => {
    const res = await api.delete(`/pro/products/categories/${id}`)
    invalidateApiCache('pro.')
    return res
  },
  createProduct: async (data: object) => {
    const res = await api.post('/pro/products', data)
    invalidateApiCache('pro.')
    return res
  },
  updateProduct: async (id: string | number, data: object) => {
    const res = await api.put(`/pro/products/${id}`, data)
    invalidateApiCache('pro.')
    return res
  },
  archiveProduct: async (id: string | number) => {
    const res = await api.patch(`/pro/products/${id}/archive`)
    invalidateApiCache('pro.')
    return res
  },
  publishProduct: async (id: string | number) => {
    const res = await api.post(`/pro/products/${id}/publish`)
    invalidateApiCache('pro.')
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
  renewListing: async (id: string | number) => {
    const res = await api.post(`/pro/listings/${id}/renew`)
    invalidateApiCache('pro.')
    return res
  },
  getBoosts: () => cachedGet(
    buildCacheKey('pro.boosts', '/pro/boosts'),
    () => api.get('/pro/boosts'),
    CACHE_TTL.short,
  ),
  getInvoices: () => cachedGet(
    buildCacheKey('pro.invoices', '/pro/invoices'),
    () => api.get('/pro/invoices'),
    CACHE_TTL.short,
  ),
  updateProfile: async (data: object) => {
    const res = await api.patch('/pro/me', data)
    invalidateApiCache('pro.')
    return res
  },
  downloadInvoicePdf: (id: string | number) => api.get(`/pro/invoices/${id}/pdf`, { responseType: 'blob' }),
  getAutoReply: () => cachedGet(
    buildCacheKey('pro.autoReply.get', '/pro/auto-reply'),
    () => api.get('/pro/auto-reply'),
    CACHE_TTL.short,
  ),
  updateAutoReply: async (data: object) => {
    const res = await api.put('/pro/auto-reply', data)
    invalidateApiCache('pro.')
    return res
  },
}

export const importApi = {
  fields: () => cachedGet(
    buildCacheKey('import.fields', '/import/fields'),
    () => api.get('/import/fields'),
    CACHE_TTL.static,
  ),
  upload: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post('/import/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    invalidateApiCache('import.')
    return res
  },
  saveMapping: async (jobId: string | number, mapping: Record<string, string>) => {
    const res = await api.post(`/import/${jobId}/mapping`, { mapping })
    invalidateApiCache('import.')
    invalidateApiCache('pro.')
    return res
  },
  status: (jobId: string | number) => api.get(`/import/${jobId}/status`),
  report: (jobId: string | number) => api.get(`/import/${jobId}/report`),
  history: () => cachedGet(
    buildCacheKey('import.history', '/import/history'),
    () => api.get('/import/history'),
    CACHE_TTL.short,
  ),
}

export const paymentApi = {
  getSavedCards: () => cachedGet(
    buildCacheKey('payment.savedCards', '/payment/saved-cards'),
    () => api.get('/payment/saved-cards'),
    CACHE_TTL.short,
  ),
  boostOneClick: async (data: object) => {
    const res = await api.post('/payment/boost-one-click', data)
    invalidateApiCache('payment.')
    invalidateApiCache('pro.')
    invalidateApiCache('listings.')
    invalidateApiCache('stats.')
    return res
  },
}

export const proDocumentsApi = {
  list: () => cachedGet(
    buildCacheKey('proDocuments.list', '/pro/documents'),
    () => api.get('/pro/documents'),
    CACHE_TTL.short,
  ),
  upload: async (data: { file: File; document_type: string; label?: string }) => {
    const form = new FormData()
    form.append('file', data.file)
    form.append('document_type', data.document_type)
    if (data.label) {
      form.append('label', data.label)
    }
    const res = await api.post('/pro/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    invalidateApiCache('proDocuments.')
    invalidateApiCache('pro.')
    return res
  },
  delete: async (id: string | number) => {
    const res = await api.delete(`/pro/documents/${id}`)
    invalidateApiCache('proDocuments.')
    invalidateApiCache('pro.')
    return res
  },
}

export const deliveryApi = {
  estimate: (params: object = {}) => cachedGet(
    buildCacheKey('delivery.estimate', '/delivery-requests/estimate', params),
    () => api.get('/delivery-requests/estimate', { params }),
    CACHE_TTL.short,
  ),
  createRequest: async (data: object) => {
    const res = await api.post('/delivery-requests', data)
    invalidateApiCache('delivery.')
    return res
  },
  getMine: () => cachedGet(
    buildCacheKey('delivery.mine', '/delivery-requests/mine'),
    () => api.get('/delivery-requests/mine'),
    CACHE_TTL.short,
  ),
  getDashboard: () => cachedGet(
    buildCacheKey('delivery.dashboard', '/delivery-requests/dashboard'),
    () => api.get('/delivery-requests/dashboard'),
    CACHE_TTL.short,
  ),
  submitOffer: async (requestId: string | number, data: object) => {
    const res = await api.post(`/delivery-requests/${requestId}/offers`, data)
    invalidateApiCache('delivery.')
    return res
  },
  selectOffer: async (requestId: string | number, offerId: string | number) => {
    const res = await api.post(`/delivery-requests/${requestId}/select`, { offer_id: offerId })
    invalidateApiCache('delivery.')
    invalidateApiCache('notifications.')
    return res
  },
  markDelivered: async (requestId: string | number) => {
    const res = await api.post(`/delivery-requests/${requestId}/deliver`)
    invalidateApiCache('delivery.')
    invalidateApiCache('notifications.')
    return res
  },
}

export const fretApi = deliveryApi

export const adminApi = {
  listProDocuments: () => cachedGet(
    buildCacheKey('admin.proDocuments.list', '/admin/pro-documents'),
    () => api.get('/admin/pro-documents'),
    CACHE_TTL.short,
  ),
  validateProDocument: async (id: string | number, data: { status: 'validated' | 'rejected'; rejection_reason?: string }) => {
    const res = await api.post(`/admin/pro-documents/${id}/validate`, data)
      invalidateApiCache('admin.proDocuments.')
      invalidateApiCache('proDocuments.')
      invalidateApiCache('pro.')
      return res
    },
    runCinemaScraper: async () => {
      const res = await api.post('/admin/cinema/scrape')
      invalidateApiCache('events.')
      return res
    },
  }

export const proLaunchPackApi = {
  get: () => cachedGet(
    buildCacheKey('proLaunchPack.get', '/pro/launch-pack'),
    () => api.get('/pro/launch-pack'),
    CACHE_TTL.short,
  ),
  scheduleCall: async (data: object) => {
    const res = await api.post('/pro/launch-pack/schedule-call', data)
    invalidateApiCache('proLaunchPack.')
    invalidateApiCache('pro.')
    return res
  },
  completeStep: async (data: { step_key: string }) => {
    const res = await api.post('/pro/onboarding/complete-step', data)
    invalidateApiCache('proLaunchPack.')
    invalidateApiCache('pro.')
    return res
  },
}

export const quoteRequestsApi = {
  create: async (data: object) => {
    const res = await api.post('/quote-requests', data)
    invalidateApiCache('quoteRequests.')
    return res
  },
  getMine: (params: object = {}) => cachedGet(
    buildCacheKey('quoteRequests.mine', '/quote-requests/mine', params),
    () => api.get('/quote-requests/mine', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('quoteRequests.getById', `/quote-requests/${id}`),
    () => api.get(`/quote-requests/${id}`),
    CACHE_TTL.short,
  ),
  getProIncoming: (params: object = {}) => cachedGet(
    buildCacheKey('quoteRequests.proIncoming', '/quote-requests/pro/incoming', params),
    () => api.get('/quote-requests/pro/incoming', { params }),
    CACHE_TTL.short,
  ),
  getProOffersMine: (params: object = {}) => cachedGet(
    buildCacheKey('quoteRequests.proOffersMine', '/quote-requests/pro/offers', params),
    () => api.get('/quote-requests/pro/offers', { params }),
    CACHE_TTL.short,
  ),
  submitOffer: async (id: string | number, data: object) => {
    const res = await api.post(`/quote-requests/${id}/offers`, data)
    invalidateApiCache('quoteRequests.')
    return res
  },
  selectOffer: async (id: string | number, data: object) => {
    const res = await api.post(`/quote-requests/${id}/select`, data)
    invalidateApiCache('quoteRequests.')
    return res
  },
  cancel: async (id: string | number) => {
    const res = await api.delete(`/quote-requests/${id}`)
    invalidateApiCache('quoteRequests.')
    return res
  },
}

export const proQuotesApi = {
  create: async (data: object) => {
    const res = await api.post('/pro-quotes', data)
    invalidateApiCache('proQuotes.')
    return res
  },
  list: (params: object = {}) => cachedGet(
    buildCacheKey('proQuotes.list', '/pro-quotes', params),
    () => api.get('/pro-quotes', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number, token?: string) => cachedGet(
    buildCacheKey('proQuotes.getById', `/pro-quotes/${id}`, { token: token || '' }),
    () => api.get(`/pro-quotes/${id}`, { params: token ? { token } : {} }),
    CACHE_TTL.short,
  ),
  update: async (id: string | number, data: object) => {
    const res = await api.put(`/pro-quotes/${id}`, data)
    invalidateApiCache('proQuotes.')
    return res
  },
  send: async (id: string | number, data: object = {}) => {
    const res = await api.post(`/pro-quotes/${id}/send`, data)
    invalidateApiCache('proQuotes.')
    invalidateApiCache('pro.')
    return res
  },
  accept: async (id: string | number, data: object = {}) => {
    const res = await api.post(`/pro-quotes/${id}/accept`, data)
    invalidateApiCache('proQuotes.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  refuse: async (id: string | number, data: object = {}) => {
    const res = await api.post(`/pro-quotes/${id}/refuse`, data)
    invalidateApiCache('proQuotes.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  convert: async (id: string | number, data: object = {}) => {
    const res = await api.post(`/pro-quotes/${id}/convert`, data)
    invalidateApiCache('proQuotes.')
    invalidateApiCache('pro.')
    return res
  },
  downloadPdf: (id: string | number, token?: string) => api.get(`/pro-quotes/${id}/pdf`, {
    responseType: 'blob',
    params: token ? { token } : {},
  }),
}

export const proBookingsApi = {
  getSlots: (proId: string | number) => cachedGet(
    buildCacheKey('proBookings.getSlots', `/pro/${proId}/booking-slots`),
    () => api.get(`/pro/${proId}/booking-slots`),
    CACHE_TTL.short,
  ),
  getCalendar: (proId: string | number, month?: string) => cachedGet(
    buildCacheKey('proBookings.getCalendar', `/pro/${proId}/booking-calendar`, { month: month || '' }),
    () => api.get(`/pro/${proId}/booking-calendar`, { params: month ? { month } : {} }),
    CACHE_TTL.short,
  ),
  book: async (proId: string | number, data: object) => {
    const res = await api.post(`/pro/${proId}/bookings`, data)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  getMine: () => cachedGet(
    buildCacheKey('proBookings.mine', '/pro/bookings/mine'),
    () => api.get('/pro/bookings/mine'),
    CACHE_TTL.short,
  ),
  getById: (bookingId: string | number, token?: string) => cachedGet(
    buildCacheKey('proBookings.byId', `/pro/bookings/${bookingId}`, token ? { token } : {}),
    () => api.get(`/pro/bookings/${bookingId}`, { params: token ? { token } : {} }),
    CACHE_TTL.short,
  ),
  getDashboard: () => cachedGet(
    buildCacheKey('proBookings.dashboard', '/pro/dashboard/bookings'),
    () => api.get('/pro/dashboard/bookings'),
    CACHE_TTL.short,
  ),
  getSettings: () => cachedGet(
    buildCacheKey('proBookings.settings', '/pro/dashboard/booking-settings'),
    () => api.get('/pro/dashboard/booking-settings'),
    CACHE_TTL.short,
  ),
  updateSettings: async (data: object) => {
    const res = await api.put('/pro/dashboard/booking-settings', data)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    return res
  },
  createSlot: async (data: object) => {
    const res = await api.post('/pro/dashboard/booking-slots', data)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    return res
  },
  deleteSlot: async (slotId: string | number) => {
    const res = await api.delete(`/pro/dashboard/booking-slots/${slotId}`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    return res
  },
  getExceptions: () => cachedGet(
    buildCacheKey('proBookings.exceptions', '/pro/dashboard/booking-exceptions'),
    () => api.get('/pro/dashboard/booking-exceptions'),
    CACHE_TTL.short,
  ),
  createException: async (data: object) => {
    const res = await api.post('/pro/dashboard/booking-exceptions', data)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    return res
  },
  deleteException: async (exceptionId: string | number) => {
    const res = await api.delete(`/pro/dashboard/booking-exceptions/${exceptionId}`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    return res
  },
  confirm: async (bookingId: string | number) => {
    const res = await api.post(`/pro/bookings/${bookingId}/confirm`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  decline: async (bookingId: string | number) => {
    const res = await api.post(`/pro/bookings/${bookingId}/decline`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  cancel: async (bookingId: string | number) => {
    const res = await api.post(`/pro/bookings/${bookingId}/cancel`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
  complete: async (bookingId: string | number) => {
    const res = await api.post(`/pro/bookings/${bookingId}/complete`)
    invalidateApiCache('proBookings.')
    invalidateApiCache('pro.')
    invalidateApiCache('notifications.')
    return res
  },
}

export const reviewsApi = {
  getByPro: (proId: string | number, params: object = {}) => cachedGet(
    buildCacheKey('reviews.getByPro', `/reviews/pro/${proId}`, params),
    () => api.get(`/reviews/pro/${proId}`, { params }),
    CACHE_TTL.short,
  ),
  getInvite: (token: string) => cachedGet(
    buildCacheKey('reviews.getInvite', `/reviews/invite/${token}`),
    () => api.get(`/reviews/invite/${token}`),
    CACHE_TTL.short,
  ),
  createInvite: (data: object) => api.post('/reviews/invite', data),
  createReview: (data: object) => api.post('/reviews', data),
  reply: (reviewId: string | number, data: object) => api.post(`/reviews/${reviewId}/reply`, data),
  helpful: (reviewId: string | number, data: object = {}) => api.post(`/reviews/${reviewId}/helpful`, data),
  report: (reviewId: string | number, data: object = {}) => api.post(`/reviews/${reviewId}/report`, data),
}

export const newsletterApi = {
  getSubscription: () => cachedGet(
    buildCacheKey('newsletter.subscription.get', '/newsletter/subscription'),
    () => api.get('/newsletter/subscription'),
    CACHE_TTL.short,
  ),
  subscribe: async (data: object) => {
    const res = await api.post('/newsletter/subscribe', data)
    invalidateApiCache('newsletter.')
    return res
  },
  unsubscribe: async (data: object = {}) => {
    const res = await api.delete('/newsletter/unsubscribe', { data })
    invalidateApiCache('newsletter.')
    return res
  },
  preview: (userId: string | number) => cachedGet(
    buildCacheKey('newsletter.preview', `/newsletter/preview/${userId}`),
    () => api.get(`/newsletter/preview/${userId}`),
    CACHE_TTL.short,
  ),
  send: async (data: object = {}) => {
    const res = await api.post('/newsletter/send', data)
    invalidateApiCache('newsletter.')
    return res
  },
}

export const contactApi = {
  send: (data: object) => api.post('/contact', data),
}

export const rgpdApi = {
  exportData: () => api.get('/rgpd/exporter-donnees', { responseType: 'blob' }),
  deleteAccount: (data: { confirmation: string; password?: string }) => api.post('/rgpd/supprimer-compte', data),
  getLogs: () => cachedGet(
    buildCacheKey('rgpd.logs', '/rgpd/mes-logs'),
    () => api.get('/rgpd/mes-logs'),
    CACHE_TTL.short,
  ),
  setConsent: (data: { analytics?: boolean; marketing?: boolean }) => api.post('/rgpd/consentement', data),
}

export const proTransportApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('proTransport.list', '/pro-transport', params),
    () => api.get('/pro-transport', { params }),
    CACHE_TTL.short,
  ),
  getById: (id: string | number) => cachedGet(
    buildCacheKey('proTransport.getById', `/pro-transport/${id}`),
    () => api.get(`/pro-transport/${id}`),
    CACHE_TTL.short,
  ),
  getAvailability: (id: string | number, params: object = {}) => cachedGet(
    buildCacheKey('proTransport.getAvailability', `/pro-transport/${id}/availability`, params),
    () => api.get(`/pro-transport/${id}/availability`, { params }),
    CACHE_TTL.short,
  ),
  quote: (id: string | number, data: object) => api.post(`/pro-transport/${id}/quote`, data),
  apply: async (data: object) => {
    const res = await api.post('/pro-transport/apply', data)
    invalidateApiCache('proTransport.')
    return res
  },
  createRide: async (data: object) => {
    const res = await api.post('/pro-transport/rides', data)
    invalidateApiCache('proTransport.')
    return res
  },
  confirmRide: async (id: string | number) => {
    const res = await api.post(`/pro-transport/rides/${id}/confirm`)
    invalidateApiCache('proTransport.')
    return res
  },
  completeRide: async (id: string | number) => {
    const res = await api.post(`/pro-transport/rides/${id}/complete`)
    invalidateApiCache('proTransport.')
    return res
  },
  reviewRide: async (id: string | number, data: object) => {
    const res = await api.post(`/pro-transport/rides/${id}/review`, data)
    invalidateApiCache('proTransport.')
    return res
  },
  getMyRides: () => cachedGet(
    buildCacheKey('proTransport.myRides', '/pro-transport/rides/mine'),
    () => api.get('/pro-transport/rides/mine'),
    CACHE_TTL.short,
  ),
  getDashboard: () => cachedGet(
    buildCacheKey('proTransport.dashboard', '/pro-transport/dashboard'),
    () => api.get('/pro-transport/dashboard'),
    CACHE_TTL.short,
  ),
}

export const businessesApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('businesses.list', '/businesses', params),
    () => api.get('/businesses', { params }),
    CACHE_TTL.short,
  ),
  getBySlug: (slug: string) => cachedGet(
    buildCacheKey('businesses.getBySlug', `/businesses/${slug}`),
    () => api.get(`/businesses/${slug}`),
    CACHE_TTL.short,
  ),
  getReviews: (slug: string, params: object = {}) => cachedGet(
    buildCacheKey('businesses.getReviews', `/businesses/${slug}/reviews`, params),
    () => api.get(`/businesses/${slug}/reviews`, { params }),
    CACHE_TTL.short,
  ),
  addReview: (slug: string, data: object) => api.post(`/businesses/${slug}/reviews`, data),
  updateReview: (slug: string, reviewId: string | number, data: object) => api.put(`/businesses/${slug}/reviews/${reviewId}`, data),
  reportReview: (slug: string, reviewId: string | number, data: object = {}) => api.post(`/businesses/${slug}/reviews/${reviewId}/report`, data),
  replyReview: (slug: string, reviewId: string | number, data: object) => api.post(`/businesses/${slug}/reviews/${reviewId}/reply`, data),
}

export const adminBusinessesApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('adminBusinesses.list', '/admin/businesses', params),
    () => api.get('/admin/businesses', { params }),
    CACHE_TTL.short,
  ),
  verify: (id: string | number) => api.patch(`/admin/businesses/${id}/verify`).finally(() => invalidateApiCache('adminBusinesses.')),
  unverify: (id: string | number) => api.patch(`/admin/businesses/${id}/unverify`).finally(() => invalidateApiCache('adminBusinesses.')),
  reportedReviews: () => cachedGet(
    buildCacheKey('adminBusinesses.reportedReviews', '/admin/businesses/reviews/reported'),
    () => api.get('/admin/businesses/reviews/reported'),
    CACHE_TTL.short,
  ),
  keepReview: (id: string | number) => api.patch(`/admin/businesses/reviews/${id}/keep`).finally(() => invalidateApiCache('adminBusinesses.')),
  deleteReview: (id: string | number) => api.delete(`/admin/businesses/reviews/${id}`).finally(() => invalidateApiCache('adminBusinesses.')),
}

export const covoiturageApi = {
  list: (params: object = {}) => cachedGet(
    buildCacheKey('covoiturage.list', '/covoiturage', params),
    () => api.get('/covoiturage', { params }),
    CACHE_TTL.short,
  ),
  getDriverProfile: (id: string | number) => cachedGet(
    buildCacheKey('covoiturage.driverProfile', `/covoiturage/drivers/${id}/profile`),
    () => api.get(`/covoiturage/drivers/${id}/profile`),
    CACHE_TTL.short,
  ),
  mine: () => cachedGet(
    buildCacheKey('covoiturage.mine', '/covoiturage/mine'),
    () => api.get('/covoiturage/mine'),
    CACHE_TTL.short,
  ),
  myReservations: () => cachedGet(
    buildCacheKey('covoiturage.myReservations', '/covoiturage/reservations/mine'),
    () => api.get('/covoiturage/reservations/mine'),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/covoiturage', data)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  book: async (id: string | number, data: object = {}) => {
    const res = await api.post(`/covoiturage/${id}/book`, data)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  acceptBooking: async (bookingId: string | number) => {
    const res = await api.post(`/covoiturage/bookings/${bookingId}/accept`)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  refuseBooking: async (bookingId: string | number) => {
    const res = await api.post(`/covoiturage/bookings/${bookingId}/refuse`)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  cancelBooking: async (bookingId: string | number) => {
    const res = await api.post(`/covoiturage/bookings/${bookingId}/cancel`)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  cancel: async (id: string | number) => {
    const res = await api.patch(`/covoiturage/${id}/cancel`)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
  review: async (id: string | number, data: object) => {
    const res = await api.post(`/covoiturage/${id}/reviews`, data)
    invalidateApiCache('covoiturage.')
    invalidateApiCache('stats.')
    return res
  },
}

export const notificationsApi = {
  getNotifications: (limit = 20) => cachedGet(
    buildCacheKey('notifications.get', '/users/notifications', { limit }),
    () => api.get('/users/notifications', { params: { limit } }),
    CACHE_TTL.short,
  ),
  getPreferences: () => cachedGet(
    buildCacheKey('notifications.preferences.get', '/users/notifications/preferences'),
    () => api.get('/users/notifications/preferences'),
    CACHE_TTL.short,
  ),
  savePreferences: (data: object) => api.put('/users/notifications/preferences', data).finally(() => invalidateApiCache('notifications.preferences.')),
  markAllRead: () => api.post('/users/notifications/read-all').finally(() => invalidateApiCache('notifications.')),
  markRead: (id: number) => api.post(`/users/notifications/${id}/read`).finally(() => invalidateApiCache('notifications.')),
}

export const subscriptionsApi = {
  getStatus: () => cachedGet(
    buildCacheKey('subscriptions.getStatus', '/subscriptions/status'),
    () => api.get('/subscriptions/status'),
    CACHE_TTL.short,
  ),
  getPlans: () => cachedGet(
    buildCacheKey('subscriptions.getPlans', '/subscriptions/plans'),
    () => api.get('/subscriptions/plans'),
    CACHE_TTL.medium,
  ),
}

export const alertsApi = {
  list: () => cachedGet(
    buildCacheKey('alerts.list', '/alerts'),
    () => api.get('/alerts'),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/alerts', data)
    invalidateApiCache('alerts.')
    return res
  },
  update: async (id: number | string, data: object) => {
    const res = await api.patch(`/alerts/${id}`, data)
    invalidateApiCache('alerts.')
    return res
  },
  delete: async (id: number | string) => {
    const res = await api.delete(`/alerts/${id}`)
    invalidateApiCache('alerts.')
    return res
  },
}

export const covoitAlertsApi = {
  list: () => cachedGet(
    buildCacheKey('covoitAlerts.list', '/covoiturage/alerts'),
    () => api.get('/covoiturage/alerts'),
    CACHE_TTL.short,
  ),
  create: async (data: object) => {
    const res = await api.post('/covoiturage/alerts', data)
    invalidateApiCache('covoitAlerts.')
    return res
  },
  update: async (id: number | string, data: object) => {
    const res = await api.patch(`/covoiturage/alerts/${id}`, data)
    invalidateApiCache('covoitAlerts.')
    return res
  },
  delete: async (id: number | string) => {
    const res = await api.delete(`/covoiturage/alerts/${id}`)
    invalidateApiCache('covoitAlerts.')
    return res
  },
}

// Users
export const usersApi = {
  getProfile: (id: string) => cachedGet(
    buildCacheKey('users.getProfile', `/users/${id}/profile`),
    () => api.get(`/users/${id}/profile`),
    CACHE_TTL.short,
  ),
  updateProfile: async (data: object) => {
    const res = await api.put('/users/me', data)
    invalidateApiCache('users.')
    invalidateApiCache('stats.')
    return res
  },
  getUserListings: (id: string, params: object = {}) => listingsApi.getUserListings(id, params),
  getReviews: (id: string) => cachedGet(
    buildCacheKey('users.getReviews', `/users/${id}/reviews`),
    () => api.get(`/users/${id}/reviews`),
    CACHE_TTL.short,
  ),
  addReview: async (id: string, data: object) => {
    const res = await api.post(`/users/${id}/reviews`, data)
    invalidateApiCache('users.')
    invalidateApiCache('stats.')
    return res
  },
}

````

## PATH: frontend/src/store/authStore.ts
````
// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, saveTokens, clearTokens } from '@/lib/api'
import { useFavorisStore } from '@/store/favorisStore'
import { getStoredAccessToken, getStoredRefreshToken } from '@/lib/tokenStorage'
import { DEMO_ACCOUNTS, inferDemoAccount, isDemoEmail } from '@/lib/demoApi'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  prenom?: string
  nom?: string
  telephone?: string | null
  phone_verified?: boolean
  avatar_url: string | null
  is_verified: boolean
  is_pro: boolean
  is_admin: boolean
  rating: number
  commune_name?: string
  demo_role?: string
  account_type?: 'personal' | 'professional'
  pro_plan?: 'pro'
  onboarding_step?: number
  pro_category?: string | null
  tours_seen?: string[]
}

export type DemoProfileKey = 'visitor' | 'particulier' | 'pro' | 'bon_plan'

const REAL_AUTH_BACKUP_KEY = 'auth-store-real-backup'
const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login'

const DEMO_USERS: Record<Exclude<DemoProfileKey, 'visitor'>, User> = {
  particulier: {
    id: 'demo-particulier',
    email: 'particulier@demo.kalico.nc',
    first_name: 'Emma',
    last_name: 'Martin',
    avatar_url: null,
    is_verified: true,
    is_pro: false,
    is_admin: false,
    rating: 4.8,
    commune_name: 'Nouméa',
    demo_role: 'Particulier',
    tours_seen: [],
  },
  pro: {
    id: 'demo-pro',
    email: 'pro@demo.kalico.nc',
    first_name: 'Atelier',
    last_name: 'Kalo',
    avatar_url: null,
    is_verified: true,
    is_pro: true,
    is_admin: false,
    rating: 4.9,
    commune_name: 'Dumbéa',
    demo_role: 'Compte Pro',
    pro_category: 'Artisan BTP',
    tours_seen: [],
  },
  bon_plan: {
    id: 'demo-bon-plan',
    email: 'bonplan@demo.kalico.nc',
    first_name: 'Kalico',
    last_name: 'Bon Plan',
    avatar_url: null,
    is_verified: true,
    is_pro: true,
    is_admin: false,
    rating: 5,
    commune_name: 'Nouméa',
    demo_role: 'Annonceur Bon Plan',
    pro_category: 'Bon plans & événements',
    tours_seen: [],
  },
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  demoProfile: DemoProfileKey | null
  hasHydrated: boolean

  login:    (email: string, password: string, turnstileToken?: string) => Promise<void>
  register: (data: object, turnstileToken?: string) => Promise<void>
  logout:   () => Promise<void>
  fetchMe:  () => Promise<void>
  refreshMe: () => Promise<void>
  setUser:  (user: User) => void
  setDemoProfile: (profile: DemoProfileKey | null) => void
  setHasHydrated: (hydrated: boolean) => void
}

type RealAuthBackup = {
  user: User | null
  isAuthenticated: boolean
  access_token: string | null
}

function readRealAuthBackup(): RealAuthBackup | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(REAL_AUTH_BACKUP_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeRealAuthBackup(state: RealAuthBackup) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(REAL_AUTH_BACKUP_KEY, JSON.stringify(state))
}

function clearRealAuthBackup() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(REAL_AUTH_BACKUP_KEY)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      isLoading:       false,
      isAuthenticated: false,
      demoProfile:     null,
      hasHydrated:     false,

      setDemoProfile: (profile) => {
        const currentDemo = get().demoProfile

        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
        }

        if (!profile) {
          const backup = readRealAuthBackup()
          if (backup) {
            if (backup.access_token) {
              saveTokens(backup.access_token)
            }
            set({
              user: backup.user,
              isAuthenticated: backup.isAuthenticated,
              demoProfile: null,
            })
            useFavorisStore.getState().hydrate()
            clearRealAuthBackup()
            return
          }

          clearTokens()
          useFavorisStore.getState().clear()
          set({ user: null, isAuthenticated: false, demoProfile: null })
          return
        }

        if (!currentDemo) {
          writeRealAuthBackup({
            user: get().user,
            isAuthenticated: get().isAuthenticated,
            access_token: typeof window !== 'undefined' ? getStoredAccessToken() : null,
          })
        }

        if (profile === 'visitor') {
          clearTokens()
          useFavorisStore.getState().clear()
          set({ user: null, isAuthenticated: false, demoProfile: 'visitor' })
          return
        }

        const demoUser = DEMO_USERS[profile]
        clearTokens()
        useFavorisStore.getState().clear()
        clearRealAuthBackup()
        set({
          user: demoUser,
          isAuthenticated: true,
          demoProfile: profile,
        })
      },

      login: async (email, password, turnstileToken) => {
        set({ isLoading: true })
        try {
          const inferredDemo = inferDemoAccount(email)
          const demoProfile =
            inferredDemo === 'particulier' || inferredDemo === 'pro' || inferredDemo === 'bon_plan'
              ? inferredDemo
              : null
          const expectedPassword = demoProfile ? DEMO_ACCOUNTS[demoProfile].password : null

          if (demoProfile && isDemoEmail(email) && password === expectedPassword) {
            get().setDemoProfile(demoProfile)
            return
          }

          const { data } = await authApi.login({ email, password }, turnstileToken)
          const { user, access_token, refresh_token } = data.data
          saveTokens(access_token, refresh_token)
          set({ user, isAuthenticated: true, demoProfile: null })
          clearRealAuthBackup()
          // Sync les favoris depuis le serveur après connexion
          useFavorisStore.getState().hydrate()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (formData, turnstileToken) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.register(formData, turnstileToken)
          const { user, access_token, refresh_token } = data.data
          saveTokens(access_token, refresh_token)
          set({ user, isAuthenticated: true, demoProfile: null })
          clearRealAuthBackup()
          useFavorisStore.getState().hydrate()
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
          const refreshToken = getStoredRefreshToken()
        if (refreshToken) {
          await authApi.logout().catch(() => {})
        }
        clearTokens()
        clearRealAuthBackup()
        // Vider les favoris au logout
        useFavorisStore.getState().clear()
        set({ user: null, isAuthenticated: false, demoProfile: null })
      },

      fetchMe: async () => {
        if (get().demoProfile) return
        try {
          const { data } = await authApi.me()
          set({ user: data.data, isAuthenticated: true, demoProfile: null })
        } catch {
          set({ user: null, isAuthenticated: false, demoProfile: null })
        }
      },

      refreshMe: async () => {
        if (get().demoProfile) return
        try {
          const { data } = await authApi.me()
          set({ user: data.data, isAuthenticated: true, demoProfile: null })
        } catch {
          set({ user: null, isAuthenticated: false, demoProfile: null })
        }
      },

      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        demoProfile: state.demoProfile,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

````

## PATH: frontend/src/store/authActionStore.ts
````
'use client'

import { create } from 'zustand'
import type { PendingAuthAction } from '@/lib/authAction'
import { storePendingAuthAction } from '@/lib/authAction'
import { rememberExplicitRedirectAfterLogin } from '@/lib/authRedirect'

type AuthActionState = {
  isOpen: boolean
  action: PendingAuthAction | null
  openAuthModal: (action: PendingAuthAction) => void
  closeAuthModal: () => void
  clearAuthModal: () => void
}

export const useAuthActionStore = create<AuthActionState>((set) => ({
  isOpen: false,
  action: null,
  openAuthModal: (action) => {
    storePendingAuthAction(action)
    rememberExplicitRedirectAfterLogin(action.redirectTo)
    set({ isOpen: true, action })
  },
  closeAuthModal: () => {
    set({ isOpen: false })
  },
  clearAuthModal: () => {
    set({ isOpen: false, action: null })
  },
}))


````

## PATH: frontend/src/app/annonces/[id]/page.tsx
````
// ============================================================
//  Kalico — Page détail annonce
//  Server Component pour generateMetadata + Open Graph
//  Le rendu interactif est délégué à AnnonceDetail (client)
// ============================================================

import type { Metadata } from 'next'
import { notFound }      from 'next/navigation'
import Header            from '@/components/layout/Header'
import AnnonceDetail     from '@/components/annonces/AnnonceDetail'
import JsonLd            from '@/components/seo/JsonLd'
import { normalizeApiBase } from '@/lib/apiBase'
import { generateAnnonceMetadata } from '@/lib/seoHelpers'
import { SITE_URL } from '@/types/seo.types'

const API = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')

// ── Fetch serveur (shared between generateMetadata + page) ────
async function fetchAnnonce(id: string) {
  try {
    const res = await fetch(`${API}/listings/${id}`, {
      next: { revalidate: 60 }, // ISR : revalide toutes les 60 s
    })
    if (!res.ok) return null
    const { data } = await res.json()
    return data
  } catch {
    return null
  }
}

// ── Open Graph dynamique ──────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const annonce = await fetchAnnonce(id)
  if (!annonce) {
    return {
      title: 'Annonce introuvable | Kalico',
      robots: { index: false },
    }
  }

  return generateAnnonceMetadata({
    id:          annonce.id,
    titre:       annonce.titre,
    description: annonce.description,
    prix:        annonce.prix,
    commune:     annonce.commune_name ?? '',
    categorie:   annonce.category_name ?? '',
    images:      annonce.images ?? [],
    user:        { prenom: annonce.user?.prenom ?? '', verifie: !!annonce.user?.verifie },
    created_at:  annonce.created_at ?? '',
    updated_at:  annonce.updated_at ?? '',
  })
}

// ── Page ──────────────────────────────────────────────────────
export default async function ListingDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const annonce = await fetchAnnonce(id)
  if (!annonce) notFound()

  // JSON-LD schema.org Product pour le référencement Google Shopping
  const jsonLdData: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type':    'Product',
      name:        annonce.titre,
      description: annonce.description?.slice(0, 300),
      image:       annonce.images?.map((i: any) => i.url) ?? [],
      url:         `${SITE_URL}/annonces/${annonce.id}`,
      ...(annonce.prix && {
        offers: {
          '@type':       'Offer',
          price:          annonce.prix,
          priceCurrency: 'XPF',
          availability:  'https://schema.org/InStock',
          seller: {
            '@type': 'Person',
            name:    annonce.user?.prenom ?? 'Vendeur',
          },
        },
      }),
    },
    {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil',    item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Annonces',   item: `${SITE_URL}/annonces` },
        { '@type': 'ListItem', position: 3, name: annonce.titre, item: `${SITE_URL}/annonces/${annonce.id}` },
      ],
    },
  ]

  return (
    <>
      <JsonLd data={jsonLdData} />
      <Header />
      {/* AnnonceDetail est un Client Component — il reçoit les données prefetchées */}
      <AnnonceDetail initialData={annonce} id={id} />
    </>
  )
}

````

## PATH: frontend/src/app/pro/page.tsx
````
import type { Metadata } from 'next'

import ProLandingPageClient from './ProLandingPageClient'
import { SITE_URL } from '@/types/seo.types'

export const metadata: Metadata = {
  title: 'Devenir Pro - Kalico NC',
  description:
    'Créez votre espace Pro sur Kalico : vitrine, devis, réservations, transport, envoi & livraison et visibilité locale en Nouvelle-Calédonie.',
  alternates: {
    canonical: `${SITE_URL}/pro`,
  },
  openGraph: {
    title: 'Devenir Pro - Kalico NC',
    description:
      'Créez votre espace Pro sur Kalico : vitrine, devis, réservations, transport, envoi & livraison et visibilité locale en Nouvelle-Calédonie.',
    url: `${SITE_URL}/pro`,
    siteName: 'Kalico',
    locale: 'fr_NC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devenir Pro - Kalico NC',
    description:
      'Créez votre espace Pro sur Kalico : vitrine, devis, réservations, transport, envoi & livraison et visibilité locale en Nouvelle-Calédonie.',
  },
}

export default function ProPage() {
  return <ProLandingPageClient />
}

````

## PATH: frontend/src/components/pro/ProLandingPageClient.tsx
[fichier non trouv?]

## PATH: frontend/src/app/bons-plans/page.tsx
````
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Clock3, MapPin, Search, Sparkles, Users } from 'lucide-react'

import Header from '@/components/layout/Header'
import BonPlanCard, { type BonPlanCardModel } from '@/components/bon-plans/BonPlanCard'
import { bonPlansApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

const CATEGORY_TABS = [
  { value: '', label: 'Tout' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'mode', label: 'Mode' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'high_tech', label: 'High-Tech' },
  { value: 'auto_moto', label: 'Auto/Moto' },
  { value: 'maison', label: 'Maison' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'services', label: 'Services' },
  { value: 'sport', label: 'Sport' },
  { value: 'voyages', label: 'Voyages' },
  { value: 'autre', label: 'Autre' },
] as const

const EVENT_TABS = [
  { value: 'all', label: 'Tout' },
  { value: 'upcoming', label: 'À venir' },
  { value: 'weekend', label: 'Ce week-end' },
  { value: 'free', label: 'Gratuits' },
  { value: 'past', label: 'Passés' },
] as const

type BusinessOption = {
  name: string
  slug?: string | null
  business_logo_url?: string | null
  business_badge?: string | null
}

type DirectoryItem = {
  id: number | string
  title: string
  description: string
  kind?: string
  target_audience?: string
  price_xpf?: number
  normal_price_xpf?: number | null
  promo_price_xpf?: number | null
  discount_pct?: number | null
  location_name?: string | null
  commune_name?: string | null
  category_name?: string | null
  event_date?: string | null
  expires_at?: string | null
  contact_name?: string | null
  author_prenom?: string | null
  website_url?: string | null
  link_url?: string | null
  view_count?: number | null
  share_count?: number | null
  is_free_included?: boolean
  author_is_pro?: boolean | null
}

function formatDateLabel(value?: string | null, fallback = 'Date libre') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function isPastEvent(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
}

function isWeekendEvent(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const day = date.getDay()
  return day === 5 || day === 6 || day === 0
}

function EventCard({ item }: { item: DirectoryItem }) {
  const href = item.link_url || item.website_url || (item.contact_name ? `mailto:${item.contact_name}` : '#')
  const hasLink = href !== '#'

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-night/8 bg-[var(--color-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-l-4 border-l-nc-sable p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-sable">Événement</span>
          {item.author_is_pro ? <span className="badge badge-emeraude">Organisateur vérifié</span> : null}
        </div>
        <h3 className="mt-3 text-lg font-bold leading-tight text-night">{item.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-night/65">{item.description}</p>

        <div className="mt-4 grid gap-2 text-xs font-semibold text-night/65 sm:grid-cols-2">
          <span className="rounded-full bg-sand px-2.5 py-1">
            <MapPin className="mr-1 inline h-3.5 w-3.5 text-coral" />
            {item.commune_name || item.location_name || 'Nouvelle-Calédonie'}
          </span>
          <span className="rounded-full bg-sand px-2.5 py-1">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5 text-coral" />
            {formatDateLabel(item.event_date, 'Date à confirmer')}
          </span>
          <span className="rounded-full bg-sand px-2.5 py-1">
            <Users className="mr-1 inline h-3.5 w-3.5 text-coral" />
            {item.share_count ?? 0} partages
          </span>
          <span className="rounded-full bg-sand px-2.5 py-1">
            <Clock3 className="mr-1 inline h-3.5 w-3.5 text-coral" />
            {item.contact_name || 'Contact local'}
          </span>
        </div>

        <div className="mt-4 rounded-2xl bg-sand/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night/45">Info</p>
          <p className="mt-1 text-sm font-semibold text-night">
            {item.link_url ? 'Ouvert à la billetterie' : 'Informations à venir'}
          </p>
          <p className="mt-1 text-sm text-night/60">
            {item.link_url || item.website_url ? 'Consultez le lien de l’événement pour les détails.' : 'Suivez les mises à jour de l’agenda local.'}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {hasLink ? (
            <a
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noreferrer' : undefined}
              className="inline-flex items-center gap-2 rounded-2xl bg-coral px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-coral/90"
            >
              Ouvrir
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-2xl bg-night/10 px-4 py-2.5 text-sm font-semibold text-night/60">
              Bientôt disponible
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-2xl border border-night/10 bg-white px-4 py-2.5 text-sm font-semibold text-night">
            {isPastEvent(item.event_date) ? 'Passé' : 'À venir'}
          </span>
        </div>
      </div>
    </article>
  )
}

export default function BonsPlansPage() {
  const { isAuthenticated } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)

  const [promoItems, setPromoItems] = useState<BonPlanCardModel[]>([])
  const [eventItems, setEventItems] = useState<DirectoryItem[]>([])
  const [businesses, setBusinesses] = useState<BusinessOption[]>([])

  const [promoQuery, setPromoQuery] = useState('')
  const [promoCategory, setPromoCategory] = useState('')
  const [promoBusiness, setPromoBusiness] = useState('')

  const [eventQuery, setEventQuery] = useState('')
  const [eventTimeFilter, setEventTimeFilter] = useState<'all' | 'upcoming' | 'weekend' | 'free' | 'past'>('all')
  const [activeTab, setActiveTab] = useState<'promos' | 'evenements'>('promos')

  const [promoLoading, setPromoLoading] = useState(true)
  const [eventLoading, setEventLoading] = useState(true)
  const [savingFollow, setSavingFollow] = useState(false)

  useEffect(() => {
    let alive = true
    bonPlansApi
      .businesses()
      .then((res) => {
        if (!alive) return
        setBusinesses(Array.isArray(res.data?.data) ? res.data.data : [])
      })
      .catch(() => {
        if (!alive) return
        setBusinesses([])
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    setPromoLoading(true)
    bonPlansApi
      .list({
        limit: 18,
        kind: 'promo',
        q: promoQuery.trim() || undefined,
        category: promoCategory || undefined,
        business_name: promoBusiness.trim() || undefined,
      })
      .then((res) => {
        if (!alive) return
        setPromoItems(Array.isArray(res.data?.data) ? res.data.data : [])
      })
      .catch(() => {
        if (!alive) return
        setPromoItems([])
      })
      .finally(() => {
        if (alive) setPromoLoading(false)
      })

    return () => {
      alive = false
    }
  }, [promoBusiness, promoCategory, promoQuery])

  useEffect(() => {
    let alive = true
    setEventLoading(true)
    bonPlansApi
      .list({
        limit: 18,
        kind: 'event,concert',
        q: eventQuery.trim() || undefined,
      })
      .then((res) => {
        if (!alive) return
        setEventItems(Array.isArray(res.data?.data) ? res.data.data : [])
      })
      .catch(() => {
        if (!alive) return
        setEventItems([])
      })
      .finally(() => {
        if (alive) setEventLoading(false)
      })

    return () => {
      alive = false
    }
  }, [eventQuery])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash === '#evenements') setActiveTab('evenements')
    if (hash === '#promos') setActiveTab('promos')
  }, [])

  const activeBusinessSuggestions = useMemo(
    () => businesses.filter((item) => item.name.toLowerCase().includes(promoBusiness.toLowerCase().trim())).slice(0, 6),
    [businesses, promoBusiness]
  )

  const visiblePromos = useMemo(() => promoItems, [promoItems])

  const visibleEvents = useMemo(() => {
    return eventItems.filter((item) => {
      if (eventTimeFilter === 'all') return true
      const past = isPastEvent(item.event_date)
      if (eventTimeFilter === 'past') return past
      if (eventTimeFilter === 'upcoming') return !past
      if (eventTimeFilter === 'weekend') return !past && isWeekendEvent(item.event_date)
      if (eventTimeFilter === 'free') return Boolean(item.is_free_included || Number(item.price_xpf || 0) === 0 || Number(item.promo_price_xpf || 0) === 0)
      return true
    })
  }, [eventItems, eventTimeFilter])

  const handleFollowBusiness = async (business: string) => {
    if (!isAuthenticated) {
      openAuthModal({
        type: 'publish_listing',
        redirectTo: '/bons-plans',
      })
      return
    }

    setSavingFollow(true)
    try {
      const current = await bonPlansApi.getPrefs().catch(() => ({ data: { data: { notify_businesses: [] } } }))
      const prefs = current.data?.data || {}
      const nextBusinesses = Array.from(new Set([...(prefs.notify_businesses || []), business]))
      await bonPlansApi.savePrefs({
        ...prefs,
        notify_all: true,
        notify_businesses: nextBusinesses,
        via_push: true,
      })
      window.alert(`Vous suivez maintenant ${business}.`)
    } catch {
      window.alert("Impossible d'ajouter l'enseigne aux suivis.")
    } finally {
      setSavingFollow(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-night">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-[2rem] border border-night/8 border-b-4 border-b-nc-emeraude bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.16))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.14)] md:px-8 md:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-emeraude">
            <Sparkles className="h-3.5 w-3.5" />
            Bons plans & Événements
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">
            Promos locales et agenda culturel de Nouvelle-Calédonie, au même endroit.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/72 md:text-base">
            Retrouvez les bons plans du moment et l’agenda culturel de la Nouvelle-Calédonie sans changer de navigation.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-8">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'promos', label: '🏷️ Promotions' },
            { id: 'evenements', label: '🎭 Événements' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'promos' | 'evenements')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-[#0A7EA4] text-white shadow-sm'
                  : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        {activeTab === 'promos' ? (
          <section id="promos" className="rounded-[2rem] border border-night/8 bg-[var(--color-surface)] p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="section-emeraude">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-emeraude">Promotions</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Les offres qui marchent maintenant</h2>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-night/8 border-l-4 border-l-nc-emeraude bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                  <input
                    value={promoQuery}
                    onChange={(e) => setPromoQuery(e.target.value)}
                    placeholder="Rechercher une promotion, une enseigne..."
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 pl-11 text-sm outline-none transition focus:border-nc-emeraude/35 focus:ring-4 focus:ring-nc-emeraude/10"
                  />
                </div>
                <div className="flex-1">
                  <input
                    value={promoBusiness}
                    onChange={(e) => setPromoBusiness(e.target.value)}
                    placeholder="Filtrer par enseigne"
                    list="bon-plans-businesses"
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-nc-emeraude/35 focus:ring-4 focus:ring-nc-emeraude/10"
                  />
                  <datalist id="bon-plans-businesses">
                    {activeBusinessSuggestions.map((business) => (
                      <option key={business.slug || business.name} value={business.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] whitespace-nowrap">
                {CATEGORY_TABS.map((tab) => {
                  const active = tab.value === promoCategory
                  return (
                    <button
                      key={tab.value || 'all'}
                      type="button"
                      onClick={() => setPromoCategory(tab.value)}
                      className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                        active
                          ? 'border-nc-emeraude bg-nc-emeraude text-white'
                          : 'border-night/10 bg-transparent text-night/65 hover:bg-night/5 hover:text-night'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              {promoLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-[420px] animate-pulse rounded-[1.5rem] border border-night/8 bg-white/70" />
                  ))}
                </div>
              ) : visiblePromos.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {visiblePromos.map((bonPlan) => (
                    <BonPlanCard
                      key={bonPlan.id}
                      bonPlan={bonPlan}
                      compact
                      onFollowBusiness={handleFollowBusiness}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-night/8 bg-white px-6 py-14 text-center text-night/55">
                  <p className="text-lg font-semibold text-night">Les premières promos arrivent bientôt</p>
                  <p className="mt-2 text-sm">
                    Commerçants, artisans, associations - publiez votre offre et touchez des milliers de Calédoniens.
                  </p>
                  <Link href="/bons-plans/publier" className="btn-primary mt-5 inline-flex items-center gap-2">
                    Publier une promo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section id="evenements" className="rounded-[2rem] border border-night/8 bg-[var(--color-surface)] p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="section-sable">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-nc-sable">Culture</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-night">Les rendez-vous à venir</h2>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-night/8 border-l-4 border-l-nc-sable bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                  <input
                    value={eventQuery}
                    onChange={(e) => setEventQuery(e.target.value)}
                    placeholder="Rechercher un événement, une salle, un artiste..."
                    className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 pl-11 text-sm outline-none transition focus:border-nc-sable/35 focus:ring-4 focus:ring-nc-sable/10"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] whitespace-nowrap">
                  {EVENT_TABS.map((tab) => {
                    const active = tab.value === eventTimeFilter
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setEventTimeFilter(tab.value)}
                        className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                          active
                            ? 'border-nc-sable bg-nc-sable text-white'
                            : 'border-night/10 bg-transparent text-night/65 hover:bg-night/5 hover:text-night'
                        }`}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4">
              {eventLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-[320px] animate-pulse rounded-[1.5rem] border border-night/8 bg-white/70" />
                  ))}
                </div>
              ) : visibleEvents.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {visibleEvents.map((item) => (
                    <EventCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-night/8 bg-white px-6 py-14 text-center text-night/55">
                  <p className="text-lg font-semibold text-night">Aucun événement à venir pour le moment</p>
                  <p className="mt-2 text-sm">
                    Concerts, marchés, expos, conférences - ajoutez votre événement pour le faire connaître.
                  </p>
                  <Link href="/bons-plans/publier" className="btn-primary mt-5 inline-flex items-center gap-2">
                    Créer un événement
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

      {savingFollow ? (
        <div className="fixed bottom-4 right-4 rounded-full bg-night px-4 py-2 text-sm font-semibold text-white shadow-lg">
          Mise à jour en cours...
        </div>
      ) : null}
    </main>
  )
}

````

## PATH: frontend/src/app/covoiturage/page.tsx
````
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, BadgeCheck, Bell, Car, Search, Users } from 'lucide-react'

import Header from '@/components/layout/Header'
import BookingButton from '@/components/covoiturage/BookingButton'
import TransporterCard from '@/components/transport/TransporterCard'
import { API_ORIGIN, covoiturageApi, proTransportApi } from '@/lib/api'
import { useAuthActionStore } from '@/store/authActionStore'
import { useAuthStore } from '@/store/authStore'

type Ride = {
  id: number | string
  departure: string
  destination: string
  ride_date: string
  ride_time: string
  seats_total: number
  seats_reserved: number
  seats_remaining?: number
  booking_mode?: 'auto' | 'manual'
  recurrence_type?: 'none' | 'daily' | 'weekly'
  recurrence_days?: number[]
  recurrence_until?: string | null
  recurrence_count?: number | null
  recurrence_parent_id?: number | string | null
  price_xpf: number
  vehicle?: string | null
  description: string
  status: string
  trust_score?: number | null
  avg_rating?: number | null
  is_verified_driver?: boolean
  is_featured?: boolean
  user_id?: number | string
  driver_prenom?: string | null
  driver_nom?: string | null
  departure_commune_name?: string | null
  destination_commune_name?: string | null
  bookings_count?: number
  reviews_count?: number
  music_allowed?: boolean
  no_smoking?: boolean
  animals_allowed?: boolean
  women_only?: boolean
  is_direct?: boolean
  via_stops?: string[] | null
}

type Transporter = {
  id: number | string
  company_name: string
  display_name?: string | null
  pro_logo_url?: string | null
  vehicle_photo_url?: string | null
  transport_type: string[]
  transport_type_labels?: string[]
  vehicle_description?: string | null
  vehicle_capacity?: number | null
  service_zones?: string[]
  base_price_xpf?: number | null
  price_per_km_xpf?: number | null
  avg_rating?: number | null
  total_rides?: number | null
  rides_completed?: number | null
  is_verified?: boolean
  is_available?: boolean
  pro_commune?: string | null
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Date libre'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date libre'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
}

function snapTo10(value: number) {
  return Math.max(0, Math.round(value / 10) * 10)
}

const WEEKDAY_OPTIONS = [
  { value: 1, short: 'Lun', label: 'Lundi' },
  { value: 2, short: 'Mar', label: 'Mardi' },
  { value: 3, short: 'Mer', label: 'Mercredi' },
  { value: 4, short: 'Jeu', label: 'Jeudi' },
  { value: 5, short: 'Ven', label: 'Vendredi' },
  { value: 6, short: 'Sam', label: 'Samedi' },
  { value: 0, short: 'Dim', label: 'Dimanche' },
] as const

function addIsoDays(value: string, days: number) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return ''
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatRecurrenceLabel(ride: Ride) {
  if (!ride.recurrence_type || ride.recurrence_type === 'none') return ''

  if (ride.recurrence_type === 'daily') {
    return 'Tous les jours'
  }

  const days = Array.isArray(ride.recurrence_days)
    ? [...new Set(ride.recurrence_days.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6))].sort((a, b) => a - b)
    : []

  if (!days.length) {
    return 'Chaque semaine'
  }

  if (days.length === 5 && [1, 2, 3, 4, 5].every((day, index) => days[index] === day)) {
    return 'Lun-ven'
  }

  return days.map((day) => WEEKDAY_OPTIONS.find((option) => option.value === day)?.short || '').filter(Boolean).join(', ')
}

function formatRecurrenceDraftSummary(draft: {
  recurrence_type: 'daily' | 'weekly'
  recurrence_days: number[]
  recurrence_until: string
  ride_date: string
}) {
  if (!draft.ride_date || !draft.recurrence_until) return null

  const untilLabel = formatDateLabel(draft.recurrence_until)
  const days = [...new Set(draft.recurrence_days.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6))].sort((a, b) => a - b)
  const dayLabel =
    draft.recurrence_type === 'daily'
      ? 'Tous les jours'
      : days.length
        ? days.map((day) => WEEKDAY_OPTIONS.find((option) => option.value === day)?.label || '').filter(Boolean).join(', ')
        : 'Chaque semaine'

  let occurrences = 1
  const start = new Date(`${draft.ride_date}T12:00:00Z`)
  const end = new Date(`${draft.recurrence_until}T12:00:00Z`)
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
    if (draft.recurrence_type === 'daily') {
      occurrences = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    } else if (days.length) {
      let count = 0
      const cursor = new Date(start)
      cursor.setUTCHours(12, 0, 0, 0)
      while (cursor <= end) {
        if (days.includes(cursor.getUTCDay())) count += 1
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
      occurrences = count || 1
    }
  }

  return { untilLabel, dayLabel, occurrences }
}

function formatTimeLabel(value?: string | null) {
  if (!value) return 'Heure libre'
  return value.slice(0, 5)
}

function formatRouteLabel(ride: Ride) {
  const departure = ride.departure_commune_name || ride.departure || 'Départ'
  const destination = ride.destination_commune_name || ride.destination || 'Arrivée'
  return `${departure} → ${destination}`
}

function sortRides(rides: Ride[], sortBy: string) {
  const list = [...rides]
  switch (sortBy) {
    case 'rating':
      return list.sort((a, b) => (b.avg_rating ?? b.trust_score ?? 0) - (a.avg_rating ?? a.trust_score ?? 0))
    case 'price_asc':
      return list.sort((a, b) => (a.price_xpf ?? 0) - (b.price_xpf ?? 0))
    case 'price_desc':
      return list.sort((a, b) => (b.price_xpf ?? 0) - (a.price_xpf ?? 0))
    case 'city':
      return list.sort((a, b) => formatRouteLabel(a).localeCompare(formatRouteLabel(b), 'fr', { sensitivity: 'base' }))
    case 'time':
    default:
      return list.sort((a, b) => {
        const ad = `${a.ride_date || ''}T${a.ride_time || '00:00'}`
        const bd = `${b.ride_date || ''}T${b.ride_time || '00:00'}`
        return new Date(ad).getTime() - new Date(bd).getTime()
      })
  }
}

function RideCard({
  ride,
  currentUserId,
  onBooked,
}: {
  ride: Ride
  currentUserId?: number | string | null
  onBooked?: () => void | Promise<void>
}) {
  const rating = ride.avg_rating ?? ride.trust_score ?? 0
  const recurrenceLabel = formatRecurrenceLabel(ride)

  return (
    <article className="rounded-[1.75rem] border border-[var(--color-border)] border-l-4 border-l-nc-corail bg-[var(--color-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge-corail rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          {ride.is_featured ? 'Boosté' : 'Covoiturage'}
        </span>
        {recurrenceLabel ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            ↻ {recurrenceLabel}
          </span>
        ) : null}
        {ride.is_verified_driver ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Conducteur vérifié
          </span>
        ) : null}
        {ride.women_only ? (
          <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
            Réservé aux femmes
          </span>
        ) : null}
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-secondary)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
          {formatDateLabel(ride.ride_date)}
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{formatRouteLabel(ride)}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {formatTimeLabel(ride.ride_time)} · {ride.vehicle || 'Véhicule détaillé'} · {ride.seats_remaining ?? 0} place{(ride.seats_remaining ?? 0) > 1 ? 's' : ''} restante{(ride.seats_remaining ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-2xl bg-nc-corailLight px-3 py-2 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-nc-corailText">Prix</p>
          <p className="mt-1 text-lg font-bold text-nc-corailText">{ride.price_xpf.toLocaleString('fr-FR')} XPF</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
        <span className="rounded-full bg-[var(--color-background-secondary)] px-2.5 py-1">Départ: {ride.departure}</span>
        <span className="rounded-full bg-[var(--color-background-secondary)] px-2.5 py-1">Arrivée: {ride.destination}</span>
        <span className="rounded-full bg-[var(--color-background-secondary)] px-2.5 py-1">Note {rating > 0 ? `${rating.toFixed(1)}/5` : '—'}</span>
        {ride.is_direct === false ? (
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
            🚏 Via {Array.isArray(ride.via_stops) && ride.via_stops.length ? ride.via_stops.slice(0, 3).join(', ') : 'route compatible'}
          </span>
        ) : null}
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{ride.description}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
        <div className="text-sm text-[var(--color-text-secondary)]">
          {ride.user_id ? (
            <Link
              href={`/covoiturage/conducteur/${ride.user_id}`}
              className="font-semibold text-[var(--color-text-primary)] hover:text-[#0A7EA4] hover:underline"
            >
              {ride.driver_prenom || 'Conducteur local'}
            </Link>
          ) : (
            <p className="font-semibold text-[var(--color-text-primary)]">{ride.driver_prenom || 'Conducteur local'}</p>
          )}
          <p>{ride.trust_score != null ? `Confiance ${ride.trust_score}/100` : 'Profil rassurant'}</p>
        </div>
        <BookingButton
          rideId={ride.id}
          bookingMode={ride.booking_mode}
          seatsRemaining={ride.seats_remaining ?? ride.seats_total}
          driverId={ride.user_id ?? null}
          currentUserId={currentUserId ?? null}
          onBooked={onBooked}
        />
      </div>
    </article>
  )
}

export default function CovoituragePage() {
  const { user } = useAuthStore()
  const openAuthModal = useAuthActionStore((state) => state.openAuthModal)
  const [activeTab, setActiveTab] = useState<'search' | 'publish' | 'transport'>('search')
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ departure: '', destination: '', ride_date: '' })
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false)
  const [sortBy, setSortBy] = useState<'time' | 'city' | 'rating' | 'price_asc' | 'price_desc'>('time')
  const [transporters, setTransporters] = useState<Transporter[]>([])
  const [transportLoading, setTransportLoading] = useState(false)
  const [transportFilters, setTransportFilters] = useState({
    type: '',
    departure: '',
    destination: '',
    ride_date: '',
    ride_time: '',
    passengers: 1,
  })
  const [form, setForm] = useState({
    departure: '',
    destination: '',
    ride_date: '',
    ride_time: '',
    seats_total: 3,
    price_xpf: 0,
    vehicle: '',
    description: '',
    booking_mode: 'auto' as 'auto' | 'manual',
    women_only: false,
    recurrence_enabled: false,
    recurrence_type: 'weekly' as 'daily' | 'weekly',
    recurrence_days: [1, 2, 3, 4, 5] as number[],
    recurrence_until: '',
  })
  const [saving, setSaving] = useState(false)
  const [publishNotice, setPublishNotice] = useState<null | {
    title: string
    description: string
    details: string[]
  }>(null)

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get('mode')
    const tab = new URLSearchParams(window.location.search).get('tab')
    setActiveTab(tab === 'transport' ? 'transport' : mode === 'publish' ? 'publish' : 'search')
  }, [])

  useEffect(() => {
    if (!form.recurrence_enabled || !form.ride_date) return
    setForm((prev) => {
      if (!prev.recurrence_enabled || !prev.ride_date) return prev
      const suggestedUntil = addIsoDays(prev.ride_date, 30)
      if (!suggestedUntil) return prev
      if (!prev.recurrence_until || prev.recurrence_until < prev.ride_date) {
        return { ...prev, recurrence_until: suggestedUntil }
      }
      return prev
    })
  }, [form.recurrence_enabled, form.ride_date])

  useEffect(() => {
    if (!publishNotice) return
    const timer = window.setTimeout(() => setPublishNotice(null), 9000)
    return () => window.clearTimeout(timer)
  }, [publishNotice])

  const hasFilters = useMemo(
    () => Boolean(filters.departure || filters.destination || filters.ride_date || womenOnlyFilter),
    [filters, womenOnlyFilter],
  )

  const visibleRides = useMemo(() => {
    const list = filters.ride_date ? rides.filter((ride) => ride.ride_date === filters.ride_date) : rides
    return sortRides(list, sortBy)
  }, [filters.ride_date, rides, sortBy])

  const featuredRides = useMemo(
    () => [...rides].filter((ride) => ride.is_featured || (ride.trust_score ?? 0) >= 85 || (ride.avg_rating ?? 0) >= 4.8).slice(0, 5),
    [rides],
  )

  const verifiedDrivers = useMemo(
    () =>
      rides
        .filter((ride) => ride.is_verified_driver || (ride.trust_score ?? 0) >= 80)
        .slice(0, 3)
        .map((ride) => ({
          id: ride.id,
          name: ride.driver_prenom || 'Conducteur',
          score: ride.avg_rating ?? ride.trust_score ?? 0,
          route: formatRouteLabel(ride),
        })),
    [rides],
  )

  const recurrenceDraftSummary = useMemo(
    () =>
      form.recurrence_enabled
        ? formatRecurrenceDraftSummary({
            recurrence_type: form.recurrence_type,
            recurrence_days: form.recurrence_days,
            recurrence_until: form.recurrence_until,
            ride_date: form.ride_date,
          })
        : null,
    [form.recurrence_days, form.recurrence_enabled, form.recurrence_type, form.recurrence_until, form.ride_date],
  )

  const refreshRides = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '12')
      if (filters.departure) params.set('departure', filters.departure)
      if (filters.destination) params.set('destination', filters.destination)
      if (womenOnlyFilter) params.set('women_only', 'true')

      const response = await fetch(`${API_ORIGIN}/api/covoiturage?${params.toString()}`, { credentials: 'include' })
      const json = await response.json()
      const data = Array.isArray(json?.data) ? json.data : []
      setRides(data)
    } catch (err) {
      console.error('[covoiturage] loadRides:', err)
      setRides([])
    } finally {
      setLoading(false)
    }
  }

  const refreshTransporters = async () => {
    setTransportLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '12')
      if (transportFilters.type) params.set('type', transportFilters.type)
      if (transportFilters.departure) params.set('zone', transportFilters.departure)
      if (transportFilters.passengers) params.set('passengers', String(transportFilters.passengers))
      if (transportFilters.ride_date) params.set('date', transportFilters.ride_date)
      if (transportFilters.ride_time) params.set('time', transportFilters.ride_time)

      const response = await proTransportApi.list(Object.fromEntries(params.entries()))
      const data = Array.isArray(response.data?.data) ? response.data.data : []
      setTransporters(data)
    } catch (err) {
      console.error('[covoiturage] loadTransporters:', err)
      setTransporters([])
    } finally {
      setTransportLoading(false)
    }
  }

  useEffect(() => {
    void refreshRides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.departure, filters.destination, womenOnlyFilter])

  useEffect(() => {
    if (activeTab === 'transport') {
      void refreshTransporters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])


  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const recurrenceSummary = form.recurrence_enabled
        ? formatRecurrenceDraftSummary({
            recurrence_type: form.recurrence_type,
            recurrence_days: form.recurrence_days,
            recurrence_until: form.recurrence_until,
            ride_date: form.ride_date,
          })
        : null

      await covoiturageApi.create({
        ...form,
        price_xpf: snapTo10(Number(form.price_xpf)),
        stops: [],
        comfort: form.vehicle || null,
        luggage_allowed: 'Oui',
        music_allowed: true,
        no_smoking: true,
        animals_allowed: false,
        women_only: form.women_only,
      })
      setForm({
        departure: '',
        destination: '',
        ride_date: '',
        ride_time: '',
        seats_total: 3,
        price_xpf: 0,
        vehicle: '',
        description: '',
        booking_mode: 'auto',
        women_only: false,
        recurrence_enabled: false,
        recurrence_type: 'weekly',
        recurrence_days: [1, 2, 3, 4, 5],
        recurrence_until: '',
      })

      setPublishNotice({
        title: form.recurrence_enabled ? 'Série publiée' : 'Trajet publié',
        description: form.recurrence_enabled
          ? 'Votre série récurrente est désormais en ligne. Elle sera visible sur les créneaux choisis.'
          : 'Votre trajet est désormais visible dans la liste des covoiturages disponibles.',
        details:
          form.recurrence_enabled && recurrenceSummary
            ? [
                `${recurrenceSummary.occurrences} trajet${recurrenceSummary.occurrences > 1 ? 's' : ''} programmés`,
                `Jusqu’au ${recurrenceSummary.untilLabel}`,
                recurrenceSummary.dayLabel,
              ]
            : ['Votre trajet est prêt à être consulté et réservé.'],
      })

      await refreshRides()
      setActiveTab('search')
    } catch (err) {
      console.error('[covoiturage] handleCreate:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand-light text-night">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {publishNotice ? (
          <section className="mb-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Publication réussie</p>
                <h2 className="mt-1 text-xl font-bold text-emerald-950">{publishNotice.title}</h2>
                <p className="mt-2 text-sm text-emerald-900/75">{publishNotice.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setPublishNotice(null)}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                aria-label="Fermer la notification de publication"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {publishNotice.details.map((detail) => (
                <span key={detail} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
                  {detail}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-night/8 border-b-4 border-b-nc-corail bg-[linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.18))] px-6 py-8 text-white shadow-[0_24px_80px_rgba(8,32,50,0.12)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-nc-corail">
            <Car className="h-3.5 w-3.5" />
            Covoiturage
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">Trouver un trajet, publier une place, voyager serein.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Trouvez un trajet ou proposez une place - simple, local, entre Calédoniens.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/connexion" className="btn-primary rounded-2xl px-4 py-2.5">
              Se connecter
            </Link>
            <Link href="?mode=publish" className="btn-secondary rounded-2xl px-4 py-2.5">
              Proposer un trajet
            </Link>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'search', label: 'Rechercher un trajet' },
            { id: 'publish', label: 'Proposer un trajet' },
            { id: 'transport', label: 'Transport Pro' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'search' | 'publish' | 'transport')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-[#0A7EA4] text-white shadow-sm'
                  : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {activeTab === 'search' ? (
              <section className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void refreshRides()
                  }}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Départ</span>
                    <input
                      value={filters.departure}
                      onChange={(e) => setFilters((prev) => ({ ...prev, departure: e.target.value }))}
                      placeholder="Nouméa"
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Destination</span>
                    <input
                      value={filters.destination}
                      onChange={(e) => setFilters((prev) => ({ ...prev, destination: e.target.value }))}
                      placeholder="Bourail"
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-sm font-semibold text-night">Date du trajet</span>
                    <input
                      type="date"
                      value={filters.ride_date}
                      onChange={(e) => setFilters((prev) => ({ ...prev, ride_date: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-night/10 bg-[var(--color-background-secondary)] px-4 py-3 text-sm text-night/70">
                    <input
                      type="checkbox"
                      checked={womenOnlyFilter}
                      onChange={(e) => setWomenOnlyFilter(e.target.checked)}
                      className="h-4 w-4 rounded border-night/20 text-coral"
                    />
                    <span>Afficher seulement les trajets réservés aux femmes</span>
                  </label>
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5"
                      >
                        <Search className="h-4 w-4" />
                        Rechercher
                      </button>
                      {user ? (
                        <Link
                          href="/profil/alertes-trajet"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-[#0A7EA4]/5 px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10"
                        >
                          <Bell className="h-4 w-4" />
                          Alerte
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            openAuthModal({
                              type: 'login',
                              redirectTo: '/profil/alertes-trajet',
                            })
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0A7EA4]/20 bg-[#0A7EA4]/5 px-4 py-2.5 text-sm font-semibold text-[#0A7EA4] transition hover:bg-[#0A7EA4]/10"
                        >
                          <Bell className="h-4 w-4" />
                          Alerte
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                <div className="mt-6 border-t border-[var(--color-border)] pt-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-corail">Trier les résultats</p>
                    {hasFilters ? <p className="text-xs text-night/55">Filtres actifs pour un tri plus rapide.</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'time', label: 'Départ' },
                      { value: 'city', label: 'Ville' },
                      { value: 'rating', label: 'Note conducteur' },
                      { value: 'price_asc', label: 'Prix croissant' },
                      { value: 'price_desc', label: 'Prix décroissant' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSortBy(opt.value as typeof sortBy)}
                        className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                          sortBy === opt.value
                            ? 'border-nc-corail bg-nc-corail text-white'
                            : 'border-night/10 bg-sand text-night/70 hover:bg-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5">
                    {loading ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="h-48 animate-pulse rounded-[1.75rem] bg-sand/60" />
                        ))}
                      </div>
                    ) : visibleRides.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {visibleRides.map((ride) => (
                          <RideCard
                            key={ride.id}
                            ride={ride}
                            currentUserId={user?.id ?? null}
                            onBooked={refreshRides}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[1.75rem] border border-dashed border-night/10 bg-sand/30 p-8 text-center text-night/55">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral">
                          <Car className="h-6 w-6" />
                        </div>
                        <p className="mt-4 text-lg font-semibold text-night">Aucun trajet disponible pour le moment</p>
                        <p className="mt-2 text-sm">Soyez le premier à proposer un trajet en NC.</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('publish')}
                          className="btn-primary mt-5 inline-flex items-center gap-2"
                        >
                          Proposer un trajet
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : activeTab === 'publish' ? (
              <section className="relative rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
                <form
                  onSubmit={handleCreate}
                  className={user ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4 md:grid-cols-2 opacity-40 pointer-events-none select-none'}
                >
                  <div className="md:col-span-2 flex items-center gap-2">
                    <span className="rounded-full bg-coral/10 p-2 text-coral">
                      <Car className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-corail">Publier un trajet</p>
                      <h2 className="mt-1 text-lg font-semibold text-night">Renseignez un trajet clair et rassurant</h2>
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Départ</span>
                    <input
                      required
                      value={form.departure}
                      onChange={(e) => setForm((prev) => ({ ...prev, departure: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Destination</span>
                    <input
                      required
                      value={form.destination}
                      onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Date</span>
                    <input
                      type="date"
                      required
                      value={form.ride_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, ride_date: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Heure</span>
                    <input
                      type="time"
                      required
                      value={form.ride_time}
                      onChange={(e) => setForm((prev) => ({ ...prev, ride_time: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Places</span>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      required
                      value={form.seats_total}
                      onChange={(e) => setForm((prev) => ({ ...prev, seats_total: Number(e.target.value) }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Prix / place</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      required
                      value={form.price_xpf}
                      onChange={(e) => setForm((prev) => ({ ...prev, price_xpf: Number(e.target.value) }))}
                      onBlur={(e) => setForm((prev) => ({ ...prev, price_xpf: snapTo10(Number(e.target.value || 0)) }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-sm font-semibold text-night">Véhicule et confort</span>
                    <input
                      value={form.vehicle}
                      onChange={(e) => setForm((prev) => ({ ...prev, vehicle: e.target.value }))}
                      placeholder="SUV, climatisation, coffre..."
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <div className="md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-night">Mode de réservation</span>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        {
                          value: 'auto',
                          title: 'R?servation automatique',
                          description: 'La place est bloquée instantanément',
                        },
                        {
                          value: 'manual',
                          title: 'Sur acceptation',
                          description: "Je vois le profil et j'accepte/refuse dans les 24h",
                        },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-2xl border p-4 transition ${
                            form.booking_mode === option.value
                              ? 'border-[#0A7EA4] bg-nc-lagonLight'
                              : 'border-night/10 bg-sand/40 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="booking_mode"
                            value={option.value}
                            checked={form.booking_mode === option.value}
                            onChange={() => setForm((prev) => ({ ...prev, booking_mode: option.value as 'auto' | 'manual' }))}
                            className="sr-only"
                          />
                          <p className="font-semibold text-night">{option.title}</p>
                          <p className="mt-1 text-sm text-night/60">{option.description}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-night/10 bg-[var(--color-background-secondary)] px-4 py-3 text-sm text-night/70">
                    <input
                      type="checkbox"
                      checked={form.women_only}
                      onChange={(e) => setForm((prev) => ({ ...prev, women_only: e.target.checked }))}
                      className="h-4 w-4 rounded border-night/20 text-coral"
                    />
                    <span>Réserver ce trajet aux femmes</span>
                  </label>
                  <div className="md:col-span-2 rounded-3xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-night">Trajet récurrent</p>
                        <p className="mt-1 text-xs text-night/60">
                          Publiez une seule fois, puis générez automatiquement les prochains trajets.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-night">
                        <input
                          type="checkbox"
                          checked={form.recurrence_enabled}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              recurrence_enabled: e.target.checked,
                              recurrence_until: e.target.checked && prev.ride_date ? addIsoDays(prev.ride_date, 30) : prev.recurrence_until,
                            }))
                          }
                          className="h-4 w-4 rounded border-night/20 text-[#0A7EA4] focus:ring-[#0A7EA4]/25"
                        />
                        Activer
                      </label>
                    </div>
                    {form.recurrence_enabled ? (
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-sm font-semibold text-night">Fréquence</span>
                          <select
                            value={form.recurrence_type}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                recurrence_type: e.target.value as 'daily' | 'weekly',
                              }))
                            }
                            className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                          >
                            <option value="weekly">Chaque semaine</option>
                            <option value="daily">Tous les jours</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-sm font-semibold text-night">Jusqu'au</span>
                          <input
                            type="date"
                            value={form.recurrence_until}
                            onChange={(e) => setForm((prev) => ({ ...prev, recurrence_until: e.target.value }))}
                            className="w-full rounded-2xl border border-night/10 bg-white px-4 py-3 text-sm outline-none"
                          />
                        </label>
                        {form.recurrence_type === 'weekly' ? (
                          <div className="md:col-span-2">
                            <span className="mb-2 block text-sm font-semibold text-night">Jours de départ</span>
                            <div className="flex flex-wrap gap-2">
                              {WEEKDAY_OPTIONS.map((weekday) => {
                                const isActive = form.recurrence_days.includes(weekday.value)
                                return (
                                  <button
                                    key={weekday.value}
                                    type="button"
                                    onClick={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        recurrence_days: prev.recurrence_days.includes(weekday.value)
                                          ? prev.recurrence_days.filter((day) => day !== weekday.value)
                                          : [...prev.recurrence_days, weekday.value].sort((a, b) => a - b),
                                      }))
                                    }
                                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                                      isActive
                                        ? 'bg-[#0A7EA4] text-white shadow-sm'
                                        : 'border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'
                                    }`}
                                  >
                                    {weekday.short}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {form.recurrence_enabled ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Récapitulatif</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-night">
                          <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-700">Trajet récurrent</span>
                          {recurrenceDraftSummary ? (
                            <>
                              <span>•</span>
                              <span>Jusqu’au {recurrenceDraftSummary.untilLabel}</span>
                              <span>•</span>
                              <span>{recurrenceDraftSummary.dayLabel}</span>
                              <span>•</span>
                              <span>{recurrenceDraftSummary.occurrences} trajet{recurrenceDraftSummary.occurrences > 1 ? 's' : ''} programmés</span>
                            </>
                          ) : (
                            <span>Choisissez une date de début et une date de fin pour prévisualiser la série.</span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-sm font-semibold text-night">Description du trajet</span>
                    <textarea
                      required
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={5}
                      placeholder="Étapes, bagages, musique, règles de confort, point de rendez-vous..."
                      className="w-full rounded-3xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>

                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving || !user}
                      className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? 'Publication...' : 'Publier le trajet'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
        setForm({
          departure: '',
          destination: '',
          ride_date: '',
          ride_time: '',
          seats_total: 3,
          price_xpf: 0,
          vehicle: '',
          description: '',
          booking_mode: 'auto',
          women_only: false,
          recurrence_enabled: false,
          recurrence_type: 'weekly',
          recurrence_days: [1, 2, 3, 4, 5],
          recurrence_until: '',
        })
                      }
                      className="btn-secondary inline-flex items-center gap-2 rounded-2xl px-5 py-3"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </form>

                {!user ? (
                  <div className="absolute inset-5 flex items-center justify-center rounded-[1.5rem] bg-white/80 p-6 backdrop-blur-sm">
                    <div className="max-w-sm rounded-[1.5rem] border border-night/8 bg-white p-6 text-center shadow-lg">
                      <p className="text-lg font-semibold text-night">Connectez-vous pour proposer un trajet</p>
                      <div className="mt-4 flex flex-col gap-3">
                        <Link href="/connexion" className="btn-primary inline-flex justify-center rounded-2xl px-4 py-2.5">
                          Se connecter
                        </Link>
                        <Link href="/inscription" className="btn-secondary inline-flex justify-center rounded-2xl px-4 py-2.5">
                          Créer un compte
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : (
              <section className="rounded-[2rem] border border-night/8 bg-white p-5 shadow-card">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nc-lagon">Transport Pro</p>
                    <h2 className="mt-1 text-2xl font-bold text-night">Trouver un transporteur local</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night/60">
                      Comparez les transporteurs professionnels, leurs zones d&apos;intervention et leurs tarifs.
                    </p>
                  </div>
                  <Link href="/pro/transport/inscription" className="text-sm font-semibold text-[#0A7EA4] hover:underline">
                    Devenir transporteur pro
                  </Link>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void refreshTransporters()
                  }}
                  className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                >
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Type de transport</span>
                    <select
                      value={transportFilters.type}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    >
                      <option value="">Tous les types</option>
                      <option value="taxi">Taxi / VTC</option>
                      <option value="navette">Navette</option>
                      <option value="aeroport">Transfert aéroport</option>
                      <option value="excursion">Excursion</option>
                      <option value="scolaire">Transport scolaire</option>
                      <option value="chauffeur">Location avec chauffeur</option>
                      <option value="location">Location avec chauffeur</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Commune / zone</span>
                    <input
                      value={transportFilters.departure}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, departure: e.target.value }))}
                      placeholder="Nouméa, Dumbéa..."
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Destination</span>
                    <input
                      value={transportFilters.destination}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, destination: e.target.value }))}
                      placeholder="Aéroport, Bourail..."
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Date</span>
                    <input
                      type="date"
                      value={transportFilters.ride_date}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, ride_date: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Heure</span>
                    <input
                      type="time"
                      value={transportFilters.ride_time}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, ride_time: e.target.value }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-night">Passagers</span>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={transportFilters.passengers}
                      onChange={(e) => setTransportFilters((prev) => ({ ...prev, passengers: Number(e.target.value) }))}
                      className="w-full rounded-2xl border border-night/10 bg-sand px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <div className="md:col-span-2 xl:col-span-3">
                    <button
                      type="submit"
                      className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5"
                    >
                      <Users className="h-4 w-4" />
                      Rechercher des transporteurs
                    </button>
                  </div>
                </form>

                <div className="mt-6 border-t border-[var(--color-border)] pt-5">
                  {transportLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-80 animate-pulse rounded-[1.75rem] bg-sand/60" />
                      ))}
                    </div>
                  ) : transporters.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {transporters.map((transporter) => (
                        <TransporterCard
                          key={transporter.id}
                          transporter={transporter}
                          detailHref={`/covoiturage/transport/${transporter.id}`}
                          quoteHref={`/covoiturage/transport/${transporter.id}#devis`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.75rem] border border-dashed border-night/10 bg-sand/30 p-8 text-center text-night/55">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0A7EA4]/10 text-[#0A7EA4]">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-night">Aucun transporteur trouvé</p>
                      <p className="mt-2 text-sm">Essayez de changer la zone, le type ou la date de recherche.</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            {featuredRides.length > 0 ? (
              <div className="sticky top-20 rounded-[2rem] border border-night/8 border-l-4 border-l-nc-corail bg-white p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nc-corail">Annonces boostées</p>
                    <h2 className="mt-1 text-lg font-semibold text-night">Les plus visibles maintenant</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold text-night/65">
                    <BadgeCheck className="h-4 w-4 text-amber-500" />
                    {featuredRides.length} coup(s) de cœur
                  </div>
                </div>

                {loading ? (
                  <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-32 animate-pulse rounded-[1.5rem] bg-sand/60" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {featuredRides.map((ride) => (
                      <article key={ride.id} className="rounded-[1.5rem] border border-night/8 bg-[var(--color-background-secondary)] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nc-corailLight text-nc-corailText">
                            <Car className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-nc-corail">Boosté</p>
                            <h3 className="truncate text-sm font-semibold text-night">{formatRouteLabel(ride)}</h3>
                            <p className="mt-1 text-xs text-night/55">
                              {ride.driver_prenom || 'Conducteur local'} · {ride.price_xpf.toLocaleString('fr-FR')} XPF
                            </p>
                          </div>
                        </div>
                        <Link href="/covoiturage" className="btn-secondary mt-3 inline-flex w-full justify-center rounded-2xl px-3 py-2 text-sm">
                          Voir
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-night/8 bg-[linear-gradient(135deg,_rgba(10,126,164,0.92),_rgba(46,139,87,0.88))] p-5 text-white shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Publiez votre annonce</p>
              <p className="mt-2 text-lg font-semibold">Touchez des milliers de Calédoniens</p>
              <p className="mt-2 text-sm text-white/75">Un trajet visible, une mise en relation simple, sans logique de paiement.</p>
              <button
                type="button"
                onClick={() => setActiveTab('publish')}
                className="btn-primary mt-4 inline-flex w-full justify-center rounded-2xl px-4 py-2.5"
              >
                Déposer une annonce
              </button>
            </div>

            {verifiedDrivers.length > 0 ? (
              <div className="rounded-[1.5rem] border border-night/8 bg-[var(--color-background-secondary)] p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-nc-corail" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nc-corail">Conducteurs vérifiés</p>
                    <h3 className="mt-1 text-sm font-semibold text-night">Les profils les plus rassurants</h3>
                  </div>
                </div>
                <div className="mt-3 grid gap-3">
                  {verifiedDrivers.map((driver) => (
                    <div key={driver.id} className="rounded-2xl border border-night/8 bg-white p-3">
                      <p className="text-sm font-semibold text-night">{driver.name}</p>
                      <p className="mt-1 text-xs text-night/55">{driver.route}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-nc-corail">
                        {driver.score > 0 ? `${driver.score.toFixed(1)}/5 de note` : 'Conducteur vérifié'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

      </main>
    </div>
  )
}

````

## PATH: frontend/src/app/messages/page.tsx
````
'use client'

import { Suspense } from 'react'
import MessagesPage from '@/components/messages/MessagesPage'

export default function MessagesRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <MessagesPage />
    </Suspense>
  )
}

````

## PATH: frontend/src/app/favoris/page.tsx
````
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowUpDown, Clock, Grid2X2, Heart, List, MapPin, Search, Trash2 } from 'lucide-react'

import Header from '@/components/layout/Header'
import { useFavorite } from '@/hooks/useFavorite'
import { useFavorisStore } from '@/store/favorisStore'
import { useAuthStore } from '@/store/authStore'

type SortKey = 'savedAt_desc' | 'savedAt_asc' | 'prix_asc' | 'prix_desc'
type ViewMode = 'grid' | 'list'

function FavoriListItem({
  item,
  onRemove,
}: {
  item: ReturnType<typeof useFavorisStore.getState>['items'][0]
  onRemove: () => void
}) {
  const savedAgo = item.savedAt
    ? formatDistanceToNow(new Date(item.savedAt), { locale: fr, addSuffix: true })
    : 'récemment'

  return (
    <div className="group flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/annonces/${item.id}`} className="shrink-0">
        <div className="h-24 w-24 overflow-hidden rounded-xl bg-sand">
          {item.cover_image ? (
            <img
              src={item.cover_image}
              alt={item.titre}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl opacity-30">📦</div>
          )}
        </div>
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/annonces/${item.id}`}>
          <h3 className="mb-1.5 line-clamp-2 text-sm font-medium leading-tight text-night transition-colors hover:text-coral">
            {item.titre}
          </h3>
        </Link>

        <p className="mb-2 text-base font-bold text-night">
          {item.prix ? (
            <>
              {item.prix.toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-normal text-night/50">XPF</span>
            </>
          ) : (
            <span className="text-sm italic text-night/40">Prix à débattre</span>
          )}
        </p>

        <div className="flex items-center gap-3 text-xs text-night/40">
          {item.commune ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {item.commune}
            </span>
          ) : null}
          {item.category ? (
            <span className="rounded-full bg-sand px-2 py-0.5">{item.category}</span>
          ) : null}
          <span className="ml-auto flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Sauvegardé {savedAgo}
          </span>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="shrink-0 self-start rounded-lg p-1.5 text-night/25 transition-all hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
        aria-label="Retirer des favoris"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function EmptyFavoris({
  filtered,
  isGuest,
}: {
  filtered: boolean
  isGuest: boolean
}) {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-coral/10">
        <Heart className="h-9 w-9 text-coral/50" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-night font-display">
        {filtered ? 'Aucun favori correspondant' : 'Aucun favori sauvegardé'}
      </h2>
      <p className="mx-auto mb-6 max-w-xs text-sm text-night/50">
        {filtered
          ? 'Essayez de modifier votre recherche ou vos filtres.'
          : isGuest
            ? 'Sauvegardez vos annonces préférées puis créez un compte pour les retrouver sur tous vos appareils.'
            : "Appuyez sur le ❤ d'une annonce pour la retrouver ici à tout moment."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/annonces" className="btn-primary px-6 py-2.5">
          Parcourir les annonces
        </Link>
        {isGuest ? (
          <Link href="/inscription?next=/favoris" className="rounded-2xl border border-[var(--color-border)] px-6 py-2.5 text-sm font-semibold text-night transition hover:bg-night/5">
            Créer un compte
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export default function FavorisPage() {
  const { items } = useFavorisStore()
  const { isAuthenticated } = useAuthStore()
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const { toggleFavorite } = useFavorite()

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('savedAt_desc')
  const [view, setView] = useState<ViewMode>('grid')
  const [removing, setRemoving] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let result = [...items]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.titre.toLowerCase().includes(q)
          || item.commune?.toLowerCase().includes(q)
          || item.category?.toLowerCase().includes(q),
      )
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'savedAt_desc':
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        case 'savedAt_asc':
          return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
        case 'prix_asc':
          return (a.prix ?? Infinity) - (b.prix ?? Infinity)
        case 'prix_desc':
          return (b.prix ?? -Infinity) - (a.prix ?? -Infinity)
        default:
          return 0
      }
    })

    return result
  }, [items, search, sort])

  const handleRemove = async (item: typeof items[0]) => {
    setRemoving((prev) => new Set(prev).add(item.id))
    await new Promise((resolve) => setTimeout(resolve, 200))
    await toggleFavorite({
      id: item.id,
      titre: item.titre,
      prix: item.prix,
      cover_image: item.cover_image,
      commune: item.commune,
      category: item.category,
    })
    setRemoving((prev) => {
      const next = new Set(prev)
      next.delete(item.id)
      return next
    })
  }

  const handleRemoveAll = async () => {
    if (!confirm(`Supprimer les ${items.length} favoris ?`)) return
    for (const item of items) {
      await toggleFavorite({
        id: item.id,
        titre: item.titre,
        prix: item.prix,
        cover_image: item.cover_image,
        commune: item.commune,
        category: item.category,
      })
    }
  }

  if (!hasHydrated) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
          <div className="skeleton h-10 w-48 rounded-full" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-44 rounded-[1.5rem]" />
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {!isAuthenticated ? (
          <div className="mb-6 rounded-[2rem] border border-[#0A7EA4]/15 bg-nc-lagonLight p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nc-lagon">Vos favoris sont là</p>
            <h2 className="mt-1 text-2xl font-bold text-night font-display">
              Consultez et préparez vos favoris avant de créer un compte
            </h2>
            <p className="mt-1 text-sm text-night/55">
              Vos annonces sauvegardées restent visibles ici. Créez un compte pour les synchroniser sur tous vos appareils.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/inscription?next=/favoris" className="btn-primary rounded-2xl px-4 py-2.5 text-sm">
                Créer un compte
              </Link>
              <Link href="/connexion?next=/favoris" className="btn-secondary rounded-2xl px-4 py-2.5 text-sm">
                Se connecter
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-night font-display">
              <Heart className="h-6 w-6 fill-coral text-coral" />
              Mes favoris
            </h1>
            <p className="mt-0.5 text-sm text-night/50">
              {items.length} annonce{items.length > 1 ? 's' : ''} sauvegardée{items.length > 1 ? 's' : ''}
            </p>
          </div>

          {items.length > 0 ? (
            <button
              onClick={handleRemoveAll}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-night/40 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Tout supprimer
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <EmptyFavoris filtered={false} isGuest={!isAuthenticated} />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative min-w-48 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher dans mes favoris…"
                  className="input py-2 pl-9 text-sm"
                />
                {search ? (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-night/30 hover:text-night/60"
                  >
                    ×
                  </button>
                ) : null}
              </div>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="input cursor-pointer appearance-none py-2 pl-9 pr-8 text-sm"
                >
                  <option value="savedAt_desc">Plus récents</option>
                  <option value="savedAt_asc">Plus anciens</option>
                  <option value="prix_asc">Prix croissant</option>
                  <option value="prix_desc">Prix décroissant</option>
                </select>
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/35" />
              </div>

              <div className="flex overflow-hidden rounded-xl border border-night/12">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 transition-colors ${view === 'grid' ? 'bg-coral text-white' : 'text-night/40 hover:bg-sand'}`}
                  aria-label="Vue grille"
                >
                  <Grid2X2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 transition-colors ${view === 'list' ? 'bg-coral text-white' : 'text-night/40 hover:bg-sand'}`}
                  aria-label="Vue liste"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {search ? (
                <p className="text-sm text-night/50">
                  {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                </p>
              ) : null}
            </div>

            {filtered.length === 0 ? (
              <EmptyFavoris filtered isGuest={!isAuthenticated} />
            ) : view === 'grid' ? (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className={`transition-all duration-200 ${removing.has(item.id) ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
                  >
                    <Link href={`/annonces/${item.id}`} className="group block overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                        {item.cover_image ? (
                          <img
                            src={item.cover_image}
                            alt={item.titre}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl opacity-30">📦</div>
                        )}
                        <button
                          onClick={(event) => {
                            event.preventDefault()
                            handleRemove(item)
                          }}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110"
                          aria-label="Retirer des favoris"
                        >
                          <Heart className="h-4 w-4 fill-coral text-coral" />
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="mb-1.5 line-clamp-2 text-sm font-medium leading-tight text-night transition-colors group-hover:text-coral">
                          {item.titre}
                        </h3>
                        <p className="text-base font-bold text-night">
                          {item.prix ? (
                            <>
                              {item.prix.toLocaleString('fr-FR')}{' '}
                              <span className="text-sm font-normal text-night/50">XPF</span>
                            </>
                          ) : (
                            <span className="text-sm italic text-night/40">Prix à débattre</span>
                          )}
                        </p>
                        {item.commune ? (
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-night/40">
                            <MapPin className="h-3 w-3" />
                            {item.commune}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className={`transition-all duration-200 ${removing.has(item.id) ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}`}
                  >
                    <FavoriListItem item={item} onRemove={() => handleRemove(item)} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

````

## PATH: frontend/src/app/notifications/page.tsx
[fichier non trouv?]

## PATH: frontend/src/app/bienvenue/page.tsx
````
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, BadgeCheck, Megaphone, Store, UserRound, Sparkles, CheckCircle2 } from 'lucide-react'
import { PRO_PLANS } from '@/types/monetisation.types'

type Role = 'particulier' | 'pro'

const CONFIG: Record<Role, {
  title: string
  subtitle: string
  icon: typeof UserRound
  cta: { label: string; href: string }
  items: string[]
  badge: string
}> = {
  particulier: {
    title: 'Bienvenue chez Kalico',
    subtitle: 'Votre compte particulier est prêt. Vous pouvez déjà publier, chercher et discuter.',
    icon: UserRound,
    cta: { label: 'Déposer ma première annonce', href: '/annonces/nouvelle' },
    items: ['Compléter votre profil', 'Ajouter une photo', 'Publier votre annonce'],
    badge: 'Compte particulier créé',
  },
  pro: {
    title: 'Bienvenue dans l’espace professionnel',
    subtitle: 'Votre compte pro est prêt. Vous pouvez maintenant préparer votre vitrine et vos options de visibilité.',
    icon: Store,
    cta: { label: 'Choisir ma formule Pro', href: '/abonnement' },
    items: ['Comparer les prix', 'Choisir mensuel ou annuel', 'Activer les boosts moins chers'],
    badge: 'Compte pro prêt à configurer',
  },
}

const PRO_PLAN = PRO_PLANS[0]

function BienvenueContent() {
  const searchParams = useSearchParams()
  const role = (searchParams.get('role') === 'pro' ? 'pro' : 'particulier') as Role
  const config = CONFIG[role]
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-sand-light px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-night/10 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Étape suivante</p>
                <h1 className="mt-1 font-display text-3xl font-bold text-night">{config.title}</h1>
                <p className="mt-2 text-sm text-night/60">{config.subtitle}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-jungle/10 px-3 py-1 text-xs font-semibold text-jungle">
              <BadgeCheck className="h-3.5 w-3.5" />
              {config.badge}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-sand/70 p-4">
              <p className="text-sm font-semibold text-night">Vos premières actions</p>
              <ul className="mt-3 space-y-2 text-sm text-night/65">
                {config.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-jungle" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-night/10 bg-white p-4">
              <div className="flex items-center gap-3">
                {role === 'pro' ? <Megaphone className="h-5 w-5 text-coral" /> : <ArrowRight className="h-5 w-5 text-coral" />}
                <p className="text-sm font-semibold text-night">
                  {role === 'pro' ? 'Le mode pro se débloque étape par étape' : 'Le parcours particulier est simple et rapide'}
                </p>
              </div>
              <p className="mt-3 text-sm text-night/60">
                Vous pouvez maintenant continuer vers votre espace personnel ou publier votre première annonce.
              </p>
              {role === 'pro' && (
                <div className="mt-4 rounded-2xl bg-coral/5 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-coral" />
                    <p className="text-sm font-semibold text-night">Compte pro en cours de configuration</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-night/65">
                    {['Compléter les infos société', 'Choisir un plan pro', 'Activer la visibilité'].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-jungle" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-night/55">
                    La création reste gratuite. Les options pro s’activent ensuite selon le plan choisi dans l’espace vendeur. Vous pourrez ensuite ajouter vos annonces, vos boosts et vos campagnes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {role === 'pro' ? (
            <div className="mt-6 rounded-[2rem] border border-coral/15 bg-gradient-to-br from-coral/10 via-white to-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral/80">Choisir la formule</p>
                  <h2 className="mt-1 text-2xl font-bold text-night">Le prix devient l’élément principal</h2>
                  <p className="mt-2 text-sm text-night/60">
                    La création reste gratuite. Ensuite, vous choisissez votre rythme Pro selon le besoin réel de votre activité.
                  </p>
                </div>
                <span className="rounded-full bg-night px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                  À partir de {PRO_PLAN.price_monthly.toLocaleString('fr-FR')} XPF / mois
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-night/10 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-night/45">Mensuel</p>
                  <p className="mt-2 text-3xl font-bold text-night">{PRO_PLAN.price_monthly.toLocaleString('fr-FR')} XPF</p>
                  <p className="mt-1 text-sm text-night/55">Idéal pour tester et garder de la souplesse.</p>
                </div>
                <div className="rounded-[1.75rem] border border-coral/25 bg-coral/5 p-5 shadow-[0_16px_40px_rgba(231,111,81,0.10)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">Annuel</p>
                    <span className="rounded-full bg-coral px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Recommandé</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-night">{PRO_PLAN.price_yearly.toLocaleString('fr-FR')} XPF</p>
                  <p className="mt-1 text-sm text-night/55">Plus lisible pour un usage pro régulier.</p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={config.cta.href} className="btn-primary justify-center px-5 py-3">
              {config.cta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/profil" className="btn-ghost justify-center px-5 py-3">
              Aller à mon compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BienvenuePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-light" />}>
      <BienvenueContent />
    </Suspense>
  )
}

````

## PATH: frontend/src/lib/demoMode.ts
````
'use client'

export const DEMO_TOAST_EVENT = 'kalico:demo-toast'

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export function showDemoToast(message = 'Désactivé en mode démo') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DEMO_TOAST_EVENT, { detail: { message } }))
}

````

## PATH: frontend/src/lib/demoApi.ts
````
'use client'

import { api } from '@/lib/api'

export type DemoAccountKey = 'particulier' | 'pro' | 'bon_plan' | 'admin'

export const DEMO_ACCOUNTS: Record<DemoAccountKey, { email: string; password: string; label: string; description: string }> = {
  particulier: {
    email: 'particulier@demo.kalico.nc',
    password: 'Demo1234!',
    label: 'Particulier',
    description: 'Publier, discuter et gérer ses favoris.',
  },
  pro: {
    email: 'pro@demo.kalico.nc',
    password: 'Demo1234!',
    label: 'Compte Pro',
    description: 'Vues, boosts, abonnement et tableaux de bord.',
  },
  bon_plan: {
    email: 'bonplan@demo.kalico.nc',
    password: 'Demo1234!',
    label: 'Bon plan',
    description: 'Promos, événements et campagnes sponsorisées.',
  },
  admin: {
    email: 'admin@demo.kalico.nc',
    password: 'Demo1234!',
    label: 'Administrateur',
    description: 'Modération, dashboards et parcours de supervision.',
  },
}

export async function seedDemoDataset() {
  const { data } = await api.post('/demo/seed')
  return data?.data
}

export async function resetDemoDataset() {
  const { data } = await api.delete('/demo/seed')
  return data?.data
}

export async function getDemoStatus() {
  const { data } = await api.get('/demo/status')
  return data?.data
}

export function isDemoEmail(email?: string | null) {
  return Boolean(email && email.endsWith('@demo.kalico.nc'))
}

export function inferDemoAccount(email?: string | null): DemoAccountKey | null {
  if (!isDemoEmail(email)) return null
  const slug = (email ?? '').split('@')[0]
  if (slug.includes('pro')) return 'pro'
  if (slug.includes('bon')) return 'bon_plan'
  if (slug.includes('part')) return 'particulier'
  return 'particulier'
}

````

## PATH: frontend/src/components/ui/DemoModeSwitcher.tsx
````
'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Sparkles, UserRound, Store, Megaphone, UserCheck } from 'lucide-react'
import { useAuthStore, type DemoProfileKey } from '@/store/authStore'
import { inferDemoAccount } from '@/lib/demoApi'

const DEMO_OPTIONS: Array<{
  key: DemoProfileKey
  label: string
  description: string
  icon: typeof UserRound
}> = [
  { key: 'visitor', label: 'Visiteur', description: 'Voir le site sans être connecté', icon: UserRound },
  { key: 'particulier', label: 'Particulier', description: 'Déposer une annonce classique', icon: UserCheck },
  { key: 'pro', label: 'Compte Pro', description: "Voir l'espace vendeur professionnel", icon: Store },
  { key: 'bon_plan', label: 'Bon plan', description: 'Simuler un annonceur sponsorisé', icon: Megaphone },
]

const PROFILE_TONE: Record<Exclude<DemoProfileKey, 'visitor'> | 'visitor', {
  pill: string
  chip: string
}> = {
  visitor: { pill: 'bg-night/5 text-night/60', chip: 'bg-night/5 text-night/70' },
  particulier: { pill: 'bg-coral/10 text-coral', chip: 'bg-coral text-white' },
  pro: { pill: 'bg-ocean/10 text-ocean', chip: 'bg-ocean text-white' },
  bon_plan: { pill: 'bg-lagoon/15 text-night', chip: 'bg-lagoon text-night' },
}

export default function DemoModeSwitcher() {
  const showDemoBar = process.env.NEXT_PUBLIC_SHOW_DEMO_BAR === 'true'
  const [open, setOpen] = useState(false)
  const { demoProfile, setDemoProfile, user } = useAuthStore()
  const inferredProfile = inferDemoAccount(user?.email)
  const activeProfile = demoProfile ?? inferredProfile ?? 'visitor'

  const activeOption = useMemo(() => {
    return DEMO_OPTIONS.find((option) => option.key === activeProfile) ?? null
  }, [activeProfile])

  if (!showDemoBar) return null

  const currentLabel = activeOption?.label ?? 'Mode réel'
  const currentDescription = activeOption
    ? (user ? `${user.first_name} ${user.last_name}`.trim() : 'Aucun profil démo actif')
    : 'Aucun profil démo actif'
  const tone = PROFILE_TONE[activeProfile as keyof typeof PROFILE_TONE] ?? PROFILE_TONE.visitor

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:shadow-md ${
          demoProfile ? 'border-coral/20 bg-white' : 'border-night/10 bg-white'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="demo-mode-menu"
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone.pill}`}>
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">Mode démo</p>
            <p className="text-sm font-semibold text-night">{currentLabel}</p>
            <p className="text-xs text-night/55">{currentDescription}</p>
          </div>
        </div>
        <div className={`hidden rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] sm:inline-flex ${tone.chip}`}>
          {demoProfile || inferredProfile ? 'Profil actif' : 'Mode réel'}
        </div>
        <ChevronDown className={`h-4 w-4 text-night/45 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer le sélecteur de profil"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            id="demo-mode-menu"
            role="menu"
            aria-label="Sélecteur de mode démo"
            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
            className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-night/10 bg-white shadow-[0_18px_60px_rgba(8,32,50,0.14)]"
          >
            <button
              type="button"
              onClick={() => {
                setDemoProfile(null)
                setOpen(false)
              }}
              role="menuitem"
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                !demoProfile ? 'bg-coral/5' : 'hover:bg-sand'
              }`}
            >
              <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl ${!demoProfile ? 'bg-coral text-white' : 'bg-night/5 text-night/65'}`}>
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-night">Mode réel</p>
                <p className="text-xs text-night/55">Revenir à votre session actuelle ou au compte connecté.</p>
              </div>
            </button>
            {DEMO_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = option.key === demoProfile
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setDemoProfile(option.key)
                    setOpen(false)
                  }}
                  role="menuitem"
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                    active ? 'bg-coral/5' : 'hover:bg-sand'
                  }`}
                >
                  <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl ${active ? 'bg-coral text-white' : 'bg-night/5 text-night/65'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-night">{option.label}</p>
                    <p className="text-xs text-night/55">{option.description}</p>
                  </div>
                  {active && (
                    <span className="rounded-full bg-coral px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      Actif
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

````

## PATH: frontend/src/components/DemoBanner.tsx
````
'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { DEMO_ACCOUNTS } from '@/lib/demoApi'
import { DEMO_TOAST_EVENT, isDemoMode } from '@/lib/demoMode'

type DemoToast = {
  id: number
  message: string
}

export default function DemoBanner() {
  const showDemoBar = process.env.NEXT_PUBLIC_SHOW_DEMO_BAR === 'true'
  const [toasts, setToasts] = useState<DemoToast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isDemoMode() || !showDemoBar) return

    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail
      const message = detail?.message?.trim()
      if (!message) return

      const toast = { id: Date.now() + Math.floor(Math.random() * 1000), message }
      setToasts((current) => [...current, toast].slice(-3))

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, 3200)
    }

    window.addEventListener(DEMO_TOAST_EVENT, handleToast as EventListener)
    return () => window.removeEventListener(DEMO_TOAST_EVENT, handleToast as EventListener)
  }, [mounted, showDemoBar])

  if (!mounted || !isDemoMode() || !showDemoBar) return null

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[120] border-b border-amber-300/80 bg-amber-300 px-4 py-2 text-sm text-amber-950 shadow-[0_10px_30px_rgba(245,158,11,0.22)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="min-w-0">
              <p className="font-medium leading-5">Mode démo - aucun paiement réel ne sera débité</p>
              <p className="text-[11px] leading-4 text-amber-900/85">
                Code SMS <strong>123456</strong> - Compte de départ{' '}
                <strong>{DEMO_ACCOUNTS.particulier.email}</strong> / <strong>{DEMO_ACCOUNTS.particulier.password}</strong>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <span className="rounded-full bg-black/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-950">
              Demo
            </span>
            <span className="rounded-full border border-amber-400/60 bg-white/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
              Buyer
            </span>
            <span className="rounded-full border border-amber-400/60 bg-white/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
              Pro
            </span>
            <span className="rounded-full border border-amber-400/60 bg-white/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
              Admin
            </span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed right-4 top-20 z-[130] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-night shadow-[0_16px_50px_rgba(8,32,50,0.16)]"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="flex-1 leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="rounded-full p-1 text-night/35 transition hover:bg-night/5 hover:text-night"
              aria-label="Fermer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

````

## PATH: frontend/src/components/DemoModeNotice.tsx
````
'use client'

import { AlertTriangle } from 'lucide-react'
import { isDemoMode } from '@/lib/demoMode'

type DemoModeNoticeProps = {
  className?: string
}

export default function DemoModeNotice({ className = '' }: DemoModeNoticeProps) {
  const showDemoBar = process.env.NEXT_PUBLIC_SHOW_DEMO_BAR === 'true'
  if (!isDemoMode() || !showDemoBar) return null

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-amber-950 ${className}`}
      role="status"
      aria-live="polite"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
      <div>
        <p className="text-sm font-semibold">Mode démonstration</p>
        <p className="text-sm leading-6">
          Aucun paiement réel ne sera effectué. Le tunnel reste visible pour tester le parcours.
        </p>
      </div>
    </div>
  )
}

````

## PATH: frontend/src/app/qa/page.tsx
````
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Database,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Monitor,
  Crown,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import ProfileDemoPreview from '@/components/ui/ProfileDemoPreview'
import { DEMO_ACCOUNTS, getDemoStatus, resetDemoDataset, seedDemoDataset } from '@/lib/demoApi'
import { useAuthStore } from '@/store/authStore'

const QUICK_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/annonces', label: 'Annonces' },
  { href: '/annonces/nouvelle', label: 'Bon plan' },
  { href: '/messages', label: 'Messages' },
  { href: '/parametres', label: 'Paramètres' },
  { href: '/profil', label: 'Profil' },
  { href: '/admin/dashboard', label: 'Admin' },
]

export default function DemoQaPage() {
  const router = useRouter()
  const { login, logout, isAuthenticated, user } = useAuthStore()
  const [status, setStatus] = useState<any>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const demoEmail = user?.email ?? ''
  const demoBadge = useMemo(() => demoEmail.endsWith('@demo.kalico') ? 'Compte démo actif' : 'Mode réel', [demoEmail])

  const loadStatus = async () => {
    try {
      const data = await getDemoStatus()
      setStatus(data)
    } catch {
      setStatus(null)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleSeed = async () => {
    setBusy('seed')
    setMessage('')
    try {
      const result = await seedDemoDataset()
      setMessage(`Jeu de données généré: ${result?.counts?.users ?? 0} comptes, ${result?.counts?.listings ?? 0} annonces.`)
      await loadStatus()
    } finally {
      setBusy(null)
    }
  }

  const handleReset = async () => {
    setBusy('reset')
    setMessage('')
    try {
      const result = await resetDemoDataset()
      setMessage(result?.cleared ? 'Jeu de données démo supprimé.' : 'Jeu de données remis à zéro.')
      await loadStatus()
    } finally {
      setBusy(null)
    }
  }

  const loginAs = async (key: keyof typeof DEMO_ACCOUNTS) => {
    setBusy(key)
    setMessage('')
    try {
      await login(DEMO_ACCOUNTS[key].email, DEMO_ACCOUNTS[key].password)
      router.push(key === 'admin' ? '/admin/dashboard' : '/profil')
    } catch (err: any) {
      setMessage(err?.response?.data?.error ?? 'Connexion démo impossible.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="min-h-screen bg-sand-light text-night">
      <Header />

      <section className="px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-night/8 bg-[radial-gradient(circle_at_top_left,_rgba(72,202,228,0.24),_transparent_38%),linear-gradient(135deg,_rgba(8,32,50,0.98),_rgba(10,126,164,0.88))] px-6 py-7 text-white shadow-[0_24px_80px_rgba(8,32,50,0.18)] md:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-lagoon">
                  <Sparkles className="h-3.5 w-3.5" />
                  Demo / QA local
                </div>
                <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">
                  Environnement visuel complet pour tester Kalico sans friction.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
                  Générez les données locales, ouvrez les rôles instantanés, puis naviguez dans toutes les pages critiques
                  comme un utilisateur réel, sur web et mobile.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[24rem]">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lagoon">Statut</p>
                  <p className="mt-2 text-sm font-semibold">{status?.enabled ? 'Local activé' : 'Mode hors ligne'}</p>
                  <p className="text-xs text-white/60">{demoBadge}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lagoon">Comptes</p>
                  <p className="mt-2 text-2xl font-bold">{status?.counts?.users ?? 0}</p>
                  <p className="text-xs text-white/60">comptes démo</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lagoon">Annonces</p>
                  <p className="mt-2 text-2xl font-bold">{status?.counts?.listings ?? 0}</p>
                  <p className="text-xs text-white/60">annonces seedées</p>
                </div>
              </div>
            </div>
          </div>

          {message ? (
            <div className="rounded-2xl border border-night/10 bg-white p-4 text-sm text-night/70 shadow-sm">
              {message}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-night/8 bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">Bootstrap local</p>
                    <h2 className="text-xl font-bold text-night">Créer ou vider les données de démonstration</h2>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSeed}
                    disabled={busy !== null}
                    className="btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5"
                  >
                    {busy === 'seed' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Générer le seed local
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={busy !== null}
                    className="btn-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5"
                  >
                    {busy === 'reset' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Vider le seed
                  </button>
                  <Link href="/annonces" className="btn-ghost inline-flex items-center gap-2 rounded-2xl px-4 py-2.5">
                    Explorer les annonces
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm text-night/65">
                  Les comptes démo utilisent le mot de passe commun <span className="font-semibold">Demo1234!</span>.
                  Le seed crée des annonces, messages, notifications, avis, paiements simulés et événements analytics.
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-night/8 bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ocean/10 text-ocean">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ocean/80">Connexion instantanée</p>
                    <h2 className="text-xl font-bold text-night">Accéder aux rôles réels seedés</h2>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {Object.entries(DEMO_ACCOUNTS).map(([key, account]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => loginAs(key as keyof typeof DEMO_ACCOUNTS)}
                      disabled={busy !== null}
                      className="rounded-2xl border border-night/10 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-night">{account.label}</p>
                          <p className="mt-1 text-sm text-night/55">{account.description}</p>
                        </div>
                        <span className="rounded-full bg-coral/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-coral">
                          Login
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-night/45">{account.email}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-night/8 bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lagoon/15 text-night">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">Navigation rapide</p>
                    <h2 className="text-xl font-bold text-night">Ouvrir les pages critiques en un clic</h2>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {QUICK_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className="rounded-full border border-night/10 bg-sand px-4 py-2 text-sm font-semibold text-night/70 transition hover:border-coral/30 hover:bg-coral/5 hover:text-coral">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <ProfileDemoPreview mode="account" />

              <div className="rounded-[1.75rem] border border-night/8 bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-night/5 text-night">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-coral/80">Surfaces visuelles</p>
                    <h2 className="text-xl font-bold text-night">Rendu desktop, tablette et mobile</h2>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-sand p-4">
                    <p className="text-sm font-semibold text-night">Desktop</p>
                    <p className="mt-1 text-sm text-night/60">Header, hero, listes, cartes et dashboards.</p>
                  </div>
                  <div className="rounded-2xl bg-sand p-4">
                    <p className="text-sm font-semibold text-night">Tablette</p>
                    <p className="mt-1 text-sm text-night/60">Menus, filtres et colonnes adaptatives.</p>
                  </div>
                  <div className="rounded-2xl bg-sand p-4">
                    <p className="text-sm font-semibold text-night">Mobile</p>
                    <p className="mt-1 text-sm text-night/60">Navigation tactile, retour arrière et état démo.</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-night/10 bg-night/[0.03] p-4 text-sm text-night/60">
                  Sur mobile, installez le seed puis utilisez les boutons de connexion instantanée dans l’écran de login
                  pour basculer entre particulier, pro, bon plan et admin.
                </div>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="mt-4 btn-ghost inline-flex items-center gap-2 rounded-2xl px-4 py-2.5"
                  >
                    Déconnexion rapide
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

````

## PATH: backend/src/index.js
````
// ============================================================
//  Kalico — Backend Express (point d'entrée)
// ============================================================

'use strict';

const express     = require('express');
const http        = require('http');
const path        = require('path');
const cors        = require('cors');
const helmet      = require('helmet');
const { checkConnection }   = require('./config/database');
const errorHandler          = require('./middleware/errorHandler');
const { requestContext }    = require('./middleware/requestContext');
const { requestLogger }     = require('./middleware/requestLogger');
const { internalAuth }      = require('./middleware/internalAuth');
const { apiLimiter, authLimiter }        = require('./middleware/rateLimit');
const { csrfMiddleware }    = require('./middleware/csrf');
const { initSocket, shutdownWebsocketBridge }        = require('./services/websocketServer');
const { startAllJobs }      = require('./jobs/scheduler');
const { ensureDefaultPopupCampaign } = require('./services/campaignsService');
const { logger }            = require('./utils/logger');
const {
  getSnapshot,
  registerObservabilityInstance,
  stopObservabilityHeartbeat,
} = require('./services/observability');

// ── Routes ────────────────────────────────────────────────────
const authRouter      = require('./routes/auth');
const annoncesRouter  = require('./routes/annonces');
const usersRouter     = require('./routes/users');
const messagesRouter  = require('./routes/messages');
const categoriesRouter= require('./routes/categories');
const communesRouter  = require('./routes/communes');
const uploadRouter    = require('./routes/upload');
const uploadsRouter   = require('./routes/uploads');
const adminRouter     = require('./routes/admin.routes');
const rgpdRouter      = require('./routes/rgpd.route');
const legalRouter     = require('./routes/legal');
const paymentRouter   = require('./routes/payment.route');
const subscriptionsRouter = require('./routes/subscriptions');
const phoneRouter     = require('./routes/phone.route');
const alertRouter     = require('./routes/alert.route');
const pushTokenRouter      = require('./routes/pushToken.route');
const notificationsRouter  = require('./routes/notifications.route');
const statsRouter          = require('./routes/stats.route');
const offersRouter         = require('./routes/offers.route');
const bonPlansRouter       = require('./routes/bonPlans.route');
const businessesRouter     = require('./routes/businesses.route');
const businessesAdminRouter = require('./routes/businesses.admin.route');
const proRouter            = require('./routes/pro');
const proDocumentsRouter   = require('./routes/pro-documents');
const proQuotesRouter      = require('./routes/pro.quotes');
const reviewsRouter        = require('./routes/reviews');
const newsletterRouter     = require('./routes/newsletter');
const contactRouter        = require('./routes/contact.route');
const analyticsRouter      = require('./routes/analytics.route');
const searchRouter         = require('./routes/search.route');
const proBookingsRouter    = require('./routes/pro.bookings');
const proLaunchPackRouter  = require('./routes/pro.launch-pack');
const proTransportRouter   = require('./routes/pro-transport');
const fretRouter           = require('./routes/fret');
const deliveryRouter       = require('./routes/delivery');
const campaignsRouter      = require('./routes/campaigns.route');
const quoteRequestsRouter  = require('./routes/quote-requests.route');
const eventsRouter         = require('./routes/events.route');
const importRouter         = require('./routes/import.route');
const covoiturageRouter    = require('./routes/covoiturage.route');
const couponsRouter        = require('./routes/coupons.route');
const proProductsRouter    = require('./routes/pro.products');
const demoRouter           = require('./routes/demo.route');
const trocRouter           = require('./routes/troc');

// ── Application ───────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const port   = Number(process.env.PORT || 3001);

// ── Middlewares globaux ───────────────────────────────────────

const allowedOrigins = [
  process.env.BASE_URL        || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:19006',   // Expo dev
  'http://127.0.0.1:3000',
  'http://127.0.0.1:19006',
];

const allowedOriginSet = new Set(
  allowedOrigins.map((value) => {
    try {
      return new URL(value).origin;
    } catch {
      return value;
    }
  })
);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    let normalizedOrigin = origin;
    try {
      normalizedOrigin = new URL(origin).origin;
    } catch {
      cb(new Error(`CORS: origine non autorisée — ${origin}`));
      return;
    }
    if (allowedOriginSet.has(normalizedOrigin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origine non autorisée — ${origin}`));
    }
  },
  credentials: true,
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.stripe.com'],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const csp = [
    "default-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production' || req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});
app.use(requestContext);
app.use(requestLogger);
app.use(csrfMiddleware);
app.use('/api/', apiLimiter);

// ── Health check ──────────────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  try {
    const dbTime = await checkConnection();
    res.json({
      ok: true,
      service: 'kalico-backend',
      db: dbTime,
      request_id: _req.requestId ?? null,
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      error: 'DB indisponible',
      detail: err.message,
      request_id: _req.requestId ?? null,
    });
  }
});

app.get('/api/internal/observability', internalAuth, async (_req, res) => {
  const snapshot = await getSnapshot();
  res.json({
    ok: true,
    service: 'kalico-backend',
    request_id: _req.requestId ?? null,
    data: snapshot,
  });
});

// ── Routes API ────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/listings',   annoncesRouter);
app.use('/api/users/notifications', notificationsRouter);
app.use('/api/users',      usersRouter);
app.use('/api/users',      pushTokenRouter);   // POST /api/users/push-token
app.use('/api/messages',   messagesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/communes',   communesRouter);
app.use('/api/upload',     uploadRouter);
app.use('/uploads',        express.static(path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads')));
app.use('/uploads',        uploadsRouter);
app.use('/api/admin',      adminRouter);
app.use('/api/rgpd',       rgpdRouter);
app.use('/api',            legalRouter);
app.use('/api/payment',    paymentRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/phone',      phoneRouter);
app.use('/api/alerts',     alertRouter);
app.use('/api/stats',      statsRouter); // GET /api/users/notifications
app.use('/api/messages',   offersRouter);          // POST /api/messages/offers
app.use('/api/bon-plans',  bonPlansRouter);
app.use('/api/businesses', businessesRouter);
app.use('/api/admin/businesses', businessesAdminRouter);
app.use('/api/pro',        proBookingsRouter);
app.use('/api/pro',        proLaunchPackRouter);
app.use('/api/pro',        proDocumentsRouter);
app.use('/api/pro-quotes', proQuotesRouter);
app.use('/api/pros',       proRouter);
app.use('/api/pro',        proRouter);
app.use('/api/pro',        proProductsRouter);
app.use('/api/reviews',    reviewsRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/contact',    contactRouter);
app.use('/api/analytics',  analyticsRouter);
app.use('/api/search',     searchRouter);
app.use('/api/pro-transport', proTransportRouter);
app.use('/api/fret', fretRouter);
app.use('/api/delivery-requests', deliveryRouter);
app.use('/api/delivery-offers', deliveryRouter);
app.use('/api/quote-requests', quoteRequestsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/import', importRouter);
app.use('/api/covoiturage', covoiturageRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/demo',       demoRouter);
app.use('/api/troc',       trocRouter);

// Auth sociale (Google / Apple) — chargement optionnel
try {
  app.use('/api/auth', require('./routes/auth.social'));
} catch { /* module optionnel */ }

// ── 404 ───────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    error: 'Route introuvable.',
    request_id: _req.requestId ?? null,
  });
});

// ── Gestionnaire d'erreurs global ─────────────────────────────

app.use(errorHandler);

// ── Démarrage ─────────────────────────────────────────────────

async function start() {
  let databaseReady = true;
  try {
    await checkConnection();
    logger.info('db_connection_ok');
  } catch (err) {
    logger.error('db_connection_failed', { error: err });
    if (process.env.DEMO_MODE !== 'true') {
      process.exit(1);
    }
    databaseReady = false;
    logger.warn('db_connection_failed_demo_mode', {
      message: 'Base de donnees indisponible, mode demo degrade active.',
    });
  }

  initSocket(server);
  await ensureDefaultPopupCampaign().catch((error) => {
    logger.warn('default_popup_init_failed', { error: error?.message || String(error) });
  });
  if (process.env.RUN_JOBS !== 'false' && databaseReady) {
    startAllJobs();
  } else if (process.env.RUN_JOBS !== 'false') {
    logger.warn('jobs_skipped_demo_mode', {
      message: 'Jobs ignores pendant le boot demo sans base locale.',
    });
  } else {
    logger.info('cron_disabled_on_instance');
  }

  server.listen(port, () => {
    void registerObservabilityInstance('api');
    logger.info('api_started', {
      port,
      environment: process.env.NODE_ENV || 'development',
    });
  });

  const shutdown = (signal) => {
    logger.info('api_shutdown_signal', { signal });
    server.close(() => {
      stopObservabilityHeartbeat();
      shutdownWebsocketBridge().finally(() => {
        logger.info('api_http_closed');
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    logger.error('uncaught_exception', { error });
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled_rejection', { reason });
  });
}

start();

````

## PATH: backend/src/routes/auth.js
````
// ============================================================
//  Routes — Authentification
//  POST /api/auth/register
//  POST /api/auth/login
//  POST /api/auth/refresh
//  GET  /api/auth/me
//  POST /api/auth/logout
//  POST /api/auth/forgot-password
//  POST /api/auth/reset-password
// ============================================================

const express = require('express');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  verificationLimiter,
  phoneLimiter,
  refreshLimiter,
} = require('../middleware/rateLimit');
const { sendWelcomeEmail, sendVerificationEmail } = require('../services/emailService');
const { verifyTurnstileToken } = require('../services/turnstile');
const { query } = require('../config/database');
const { verifyCsrf } = require('../middleware/csrf');
const { setSecureCookie, clearSecureCookie, getCookieValue } = require('../config/cookies');
const { getRefreshExpiresMs } = require('../config/jwt');
const { deliverPasswordReset } = require('../services/passwordResetDeliveryService');
const {
  normalizePhoneNumber,
  resendPhoneOtp,
} = require('../services/phoneOtpService');
const {
  confirmEmail,
  deleteRefreshToken,
  findUserByIdentifier,
  findUserById,
  loginAccount,
  refreshSessionWithRotation,
  registerAccount,
  resendVerification,
  requestPasswordResetForUser,
  resetPasswordWithToken,
} = require('../services/authAccountService');
const { addToTokenBlacklist } = require('../services/tokenService');

const router = express.Router();
const REFRESH_COOKIE_NAME = 'kalico_refresh_token';

const registerSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(100).required(),
  prenom: Joi.string().min(1).max(100).required(),
  nom: Joi.string().min(1).max(100).required(),
  commune_id: Joi.number().integer().optional(),
  telephone: Joi.string().pattern(/^(\+687|0)[0-9]{6}$/).required(),
  account_type: Joi.string().valid('personal', 'professional', 'particulier', 'pro').default('personal'),
  turnstile_token: Joi.string().allow('').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  turnstile_token: Joi.string().allow('').optional(),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

const forgotSchema = Joi.object({
  identifier: Joi.string().trim().min(3).max(255).required(),
  turnstile_token: Joi.string().allow('').optional(),
});

const resetSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(100).required(),
});

const resendOtpSchema = Joi.object({
  telephone: Joi.string().pattern(/^\+?[0-9]{6,15}$/).required(),
  channel: Joi.string().valid('sms', 'email').default('sms'),
});

function setRefreshCookie(res, refreshToken) {
  setSecureCookie(res, REFRESH_COOKIE_NAME, refreshToken, {
    maxAge: getRefreshExpiresMs(),
  });
}

function readRefreshToken(req) {
  const bodyToken = String(req.body?.refresh_token || '').trim();
  if (bodyToken) return bodyToken;
  return getCookieValue(req, REFRESH_COOKIE_NAME);
}

router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await verifyTurnstileToken({ req, token: value.turnstile_token, ip: req.ip, action: 'register' });
    const { user, verificationToken, accessToken, refreshToken } = await registerAccount(value);
    const normalizedPhone = normalizePhoneNumber(value.telephone);
    await query('UPDATE users SET telephone = $1, phone_verified = FALSE, updated_at = NOW() WHERE id = $2', [normalizedPhone, user.id]);
    setRefreshCookie(res, refreshToken);

    sendVerificationEmail(user.email, user.prenom, verificationToken).catch((err) => {
      console.error('[AUTH] Erreur envoi email vérification:', err.message);
    });

    sendWelcomeEmail(user.email, user.prenom).catch((err) => {
      console.error('[AUTH] Erreur envoi email bienvenue:', err.message);
    });

    return res.status(201).json({
      data: {
        user,
        access_token: accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await verifyTurnstileToken({ req, token: value.turnstile_token, ip: req.ip, action: 'login' });
    const { user, accessToken, refreshToken } = await loginAccount(value, { ip: req.ip });
    setRefreshCookie(res, refreshToken);

    return res.json({
      data: {
        user,
        access_token: accessToken,
      },
    });
  } catch (err) {
    if (err.code === 'EMAIL_NOT_VERIFIED') {
      return res.status(403).json({
        error: err.message,
        code: err.code,
      });
    }
    next(err);
  }
});

// TODO: test refresh rotation after deploy with Redis blacklist enabled.
router.post('/refresh', refreshLimiter, async (req, res, next) => {
  try {
    const { error, value = {} } = refreshSchema.validate(req.body);
    const refreshToken = String(value.refresh_token || readRefreshToken(req) || '').trim();
    if (error && !refreshToken) return res.status(400).json({ error: 'refresh_token manquant.' });
    if (!refreshToken) return res.status(400).json({ error: 'refresh_token manquant.' });

    const { accessToken, refreshToken: newRefresh } = await refreshSessionWithRotation(refreshToken);
    setRefreshCookie(res, newRefresh);

    return res.json({
      data: {
        access_token: accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await findUserById(req.user.id);
    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', verifyCsrf, async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const accessToken = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;
    const refresh_token = readRefreshToken(req);
    if (accessToken) {
      await addToTokenBlacklist(accessToken);
    }
    if (refresh_token) {
      await deleteRefreshToken(refresh_token);
    }
    clearSecureCookie(res, REFRESH_COOKIE_NAME);
    return res.json({ message: 'Déconnecté avec succès.' });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const { error, value } = forgotSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await verifyTurnstileToken({ req, token: value.turnstile_token, ip: req.ip, action: 'forgot_password' });
    const recipient = await findUserByIdentifier(value.identifier);
    const user = recipient.rows[0];
    const neutralMessage = 'Si ce compte existe, vous recevrez un lien de réinitialisation par email ou SMS selon vos coordonnées vérifiées.';

    if (!user) {
      return res.json({ message: neutralMessage });
    }

    const reset = await requestPasswordResetForUser(user);
    if (!reset) {
      return res.json({ message: neutralMessage });
    }

    await deliverPasswordReset({ user, token: reset.token });

    return res.json({ message: neutralMessage });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const { error, value } = forgotSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await verifyTurnstileToken({ req, token: value.turnstile_token, ip: req.ip, action: 'forgot_password' });
    const reset = await requestPasswordReset(value.email);
    if (!reset) {
      return res.json({ message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' });
    }

    await sendResetEmail(value.email, reset.token).catch((err) => {
      console.error('[AUTH] Erreur envoi email reset:', err.message);
    });

    return res.json({ message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-email', verificationLimiter, async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token manquant.' });

    const user = await confirmEmail(token);
    if (!user) {
      return res.status(400).json({ error: 'Lien invalide ou expiré.' });
    }

    sendWelcomeEmail(user.email, user.prenom).catch((err) => {
      console.error('[AUTH] Erreur envoi welcome après vérification:', err.message);
    });

    return res.json({
      message: 'Email confirmé avec succès.',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/resend-verification', verificationLimiter, async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email manquant.' });

    await verifyTurnstileToken({ req, token: req.body?.turnstile_token, ip: req.ip, action: 'resend_verification' });
    const result = await resendVerification(email);
    if (!result) {
      return res.json({ message: 'Si un compte existe, un nouveau lien a été envoyé.' });
    }

    await sendVerificationEmail(result.user.email, result.user.prenom, result.token);

    return res.json({ message: 'Si un compte existe, un nouveau lien de confirmation a été envoyé.' });
  } catch (err) {
    next(err);
  }
});

router.post('/otp/resend', authenticate, phoneLimiter, async (req, res, next) => {
  try {
    const { error, value } = resendOtpSchema.validate(req.body || {});
    if (error) return res.status(400).json({ error: error.details[0].message });

    const normalized = normalizePhoneNumber(value.telephone);
    const { rows } = await query(
      'SELECT id FROM users WHERE telephone = $1 AND phone_verified = TRUE AND id != $2',
      [normalized, req.user.id]
    );
    if (rows[0]) {
      return res.status(409).json({ error: 'Ce numéro est déjà associé à un autre compte' });
    }

    const result = await resendPhoneOtp({
      user: req.user,
      telephone: normalized,
      preferChannel: value.channel,
    });

    return res.json({
      success: true,
      message: result.message,
      channel: result.channel,
      masked: result.masked,
      expires_at: result.expires_at,
      cooldown: result.cooldown,
      telephone: normalized,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { error, value } = resetSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const ok = await resetPasswordWithToken(value.token, value.password);
    if (!ok) {
      return res.status(400).json({ error: 'Lien invalide ou expiré.' });
    }

    return res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

````

## PATH: backend/src/routes/auth.social.js
````
// backend/src/routes/auth.social.js
// ── Routes OAuth — Google & Apple ────────────────────────────────────────────
// npm i google-auth-library apple-signin-auth jsonwebtoken

const express       = require('express')
const { OAuth2Client } = require('google-auth-library')
const appleSignin   = require('apple-signin-auth')
const { query }     = require('../config/database')
const { isConfiguredValue } = require('../config/env')
const { signAccessToken, signRefreshToken, getRefreshExpiresMs } = require('../config/jwt')
const { setSecureCookie } = require('../config/cookies')
const { socialAuthLimiter } = require('../middleware/rateLimit')
const { logger } = require('../utils/logger')

const router       = express.Router()
const REFRESH_COOKIE_NAME = 'kalico_refresh_token'
const googleClientId = isConfiguredValue(process.env.GOOGLE_CLIENT_ID) ? process.env.GOOGLE_CLIENT_ID.trim() : ''
const appleClientId = isConfiguredValue(process.env.APPLE_CLIENT_ID) ? process.env.APPLE_CLIENT_ID.trim() : ''
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null

// ── Utilitaire : upsert utilisateur social ────────────────────────────────────

async function upsertSocialUser({ email, prenom, nom, avatar_url, provider, provider_id }) {
  // 1. Chercher par provider_id (le plus fiable)
  const byProvider = await query(
    `SELECT id, email, prenom, nom, telephone, phone_verified, is_admin, is_pro, email_verified
     FROM users WHERE ${provider}_id = $1 AND deleted_at IS NULL`,
    [provider_id]
  )
  if (byProvider.rows[0]) return byProvider.rows[0]

  // 2. Chercher par email (compte déjà existant sans social)
  const byEmail = await query(
    `SELECT id, email, prenom, nom, telephone, phone_verified, is_admin, is_pro, email_verified
     FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  )

  if (byEmail.rows[0]) {
    // Lier le compte social à l'existant
    await query(
      `UPDATE users SET ${provider}_id = $1, avatar_url = COALESCE(avatar_url, $2),
       updated_at = NOW() WHERE id = $3`,
      [provider_id, avatar_url, byEmail.rows[0].id]
    )
    return byEmail.rows[0]
  }

  // 3. Créer un nouveau compte
  const result = await query(
    `INSERT INTO users (email, prenom, nom, avatar_url, ${provider}_id,
       phone_verified, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, false, true, NOW(), NOW())
     RETURNING id, email, prenom, nom, telephone, phone_verified, is_admin, is_pro, email_verified`,
    [email, prenom, nom, avatar_url, provider_id]
  )
  return result.rows[0]
}

// ── Réponse auth commune ──────────────────────────────────────────────────────

function buildAuthResponse(user) {
  const access_token  = signAccessToken({ sub: user.id, email: user.email })
  const refresh_token = signRefreshToken({ sub: user.id })

  return {
    access_token,
    refresh_token,
    user: {
      id:         user.id,
      email:      user.email,
      first_name: user.prenom,
      last_name:  user.nom,
      telephone:  user.telephone ?? null,
      phone_verified: Boolean(user.phone_verified),
      is_admin:   user.is_admin,
      is_pro:     user.is_pro,
      email_verified: user.email_verified,
      avatar_url: user.avatar_url ?? null,
    },
  }
}

// ── POST /api/auth/google ─────────────────────────────────────────────────────
// Body : { id_token: string }  (token renvoyé par Google Sign-In SDK)

router.post('/google', socialAuthLimiter, async (req, res) => {
  const { id_token } = req.body
  if (!id_token) return res.status(400).json({ error: 'id_token requis' })
  if (!googleClient) return res.status(503).json({ error: 'Connexion Google non configurée' })

  try {
    // Vérifier le token Google
    const ticket  = await googleClient.verifyIdToken({
      idToken:  id_token,
      audience: googleClientId,
    })
    const payload = ticket.getPayload()
    if (!payload?.email_verified) {
      return res.status(401).json({ error: 'Email Google non vérifié' })
    }

    const user = await upsertSocialUser({
      email:       payload.email,
      prenom:      payload.given_name  || payload.name?.split(' ')[0] || 'Utilisateur',
      nom:         payload.family_name || payload.name?.split(' ')[1] || '',
      avatar_url:  payload.picture ?? null,
      provider:    'google',
      provider_id: payload.sub,
    })
    const auth = buildAuthResponse(user)
    setSecureCookie(res, REFRESH_COOKIE_NAME, auth.refresh_token, { maxAge: getRefreshExpiresMs() })

    res.json({
      data: {
        access_token: auth.access_token,
        user: auth.user,
      },
    })
  } catch (err) {
    logger.error('auth_google_error', { error: err })
    res.status(401).json({ error: 'Token Google invalide ou expiré' })
  }
})

// ── POST /api/auth/apple ──────────────────────────────────────────────────────
// Body : { id_token, user?: { firstName, lastName } }
// Apple ne renvoie le nom qu'à la première connexion — on le stocke côté client

router.post('/apple', socialAuthLimiter, async (req, res) => {
  const { id_token, user: appleUser } = req.body
  if (!id_token) return res.status(400).json({ error: 'id_token requis' })
  if (!appleClientId) return res.status(503).json({ error: 'Connexion Apple non configurée' })

  try {
    const payload = await appleSignin.verifyIdToken(id_token, {
      audience:        appleClientId,
      ignoreExpiration: false,
    })

    if (!payload.email) {
      return res.status(401).json({ error: 'Email Apple manquant' })
    }

    const user = await upsertSocialUser({
      email:       payload.email,
      prenom:      appleUser?.firstName || 'Utilisateur',
      nom:         appleUser?.lastName  || '',
      avatar_url:  null,   // Apple ne fournit pas de photo
      provider:    'apple',
      provider_id: payload.sub,
    })
    const auth = buildAuthResponse(user)
    setSecureCookie(res, REFRESH_COOKIE_NAME, auth.refresh_token, { maxAge: getRefreshExpiresMs() })

    res.json({
      data: {
        access_token: auth.access_token,
        user: auth.user,
      },
    })
  } catch (err) {
    logger.error('auth_apple_error', { error: err })
    res.status(401).json({ error: 'Token Apple invalide ou expiré' })
  }
})

module.exports = router

// ── Colonnes à ajouter en DB ──────────────────────────────────────────────────
// ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
// ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id  VARCHAR(255) UNIQUE;
// CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;
// CREATE INDEX IF NOT EXISTS idx_users_apple_id  ON users (apple_id)  WHERE apple_id  IS NOT NULL;

````

## PATH: backend/src/routes/annonces.js
````
// ============================================================
//  Routes — Annonces (listings)
//  GET    /api/listings            — Recherche / liste
//  GET    /api/listings/:id        — Détail
//  POST   /api/listings            — Créer
//  PUT    /api/listings/:id        — Modifier
//  DELETE /api/listings/:id        — Supprimer
//  POST   /api/listings/:id/favoris  — Ajouter/retirer des favoris
//  GET    /api/listings/:id/favoris  — Statut favori
//  POST   /api/listings/:id/signaler — Signaler
//  POST   /api/listings/:id/boost    — Booster (pro)
// ============================================================

const express = require('express');
const Joi     = require('joi');
const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { matchImmediateAlerts } = require('../jobs/scheduler');
const { rateLimitAnnonces, flagIfSuspicious } = require('../middleware/antiScam');
const { buildListingSearchContext, encodeListingCursor } = require('../services/listingsQuery');
const { deletePrefix, getJson, setJson } = require('../services/sharedCache');
const { enqueueTrocMatching } = require('../services/trocQueueService');
const {
  mapListingSearchRow,
  mapListingDetailResponse,
  mapUserListingRow,
} = require('../services/listingsPresentation');
const { getUserPresence, getPresenceLabel } = require('../services/presenceService');
const { getSellerResponseTime } = require('../services/sellerInsightsService');
const { createNotification } = require('../services/notificationService');
const { sendPushToUser } = require('../services/pushService');
const {
  isDonCategory,
  validateListingMetadata,
} = require('../services/listingMetadata');


const router = express.Router();

const LIST_CACHE_PREFIX = 'cache:listings:';

async function readListCache(key) {
  return getJson(`${LIST_CACHE_PREFIX}${key}`);
}

async function writeListCache(key, value, ttlMs) {
  return setJson(`${LIST_CACHE_PREFIX}${key}`, value, ttlMs);
}

async function clearListCache() {
  await deletePrefix(LIST_CACHE_PREFIX);
}

async function executeListingSearch(req, res, next, extraQuery = {}) {
  try {
    const mergedQuery = { ...(req.query || {}), ...(extraQuery || {}) };
    const cacheKey = `list:${JSON.stringify(mergedQuery)}`;
    const cached = await readListCache(cacheKey);
    if (cached) return res.json(cached);

    const { whereClause, params, orderBy, pageNum, pageSize, offset, geo, cursorWhere, cursorParams, sort, sortConfig } = buildListingSearchContext(mergedQuery);
    const cursorParamCount = cursorParams?.length || 0;
    const limitPlaceholder = params.length + cursorParamCount + 1;
    const offsetPlaceholder = params.length + cursorParamCount + 2;
    const distanceSelect = geo?.enabled
      ? `ROUND((
          ST_Distance(
            ST_SetSRID(ST_MakePoint(com.longitude, com.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint($${geo.lngParam}, $${geo.latParam}), 4326)::geography
          ) / 1000.0
        )::numeric, 1) AS distance_km`
      : 'NULL::numeric AS distance_km';

    const countRes = await query(
      `SELECT COUNT(*) AS total
       FROM annonces a
       LEFT JOIN categories cat    ON cat.id = a.category_id
       LEFT JOIN categories parent ON parent.id = cat.parent_id
       LEFT JOIN communes com      ON com.id = a.commune_id
       LEFT JOIN provinces prov    ON prov.id = com.province_id
       WHERE ${whereClause}`,
      params
    );

    const listRes = await query(
      `SELECT
          a.id,
          a.titre AS titre,
          a.titre AS title,
          a.prix AS prix,
          a.prix AS price,
          a.condition,
          a.is_negotiable AS price_negotiable,
          (a.prix IS NULL) AS is_free,
          a.contre_quoi,
          a.metadata,
          a.created_at AS published_at,
          a.created_at AS created_at_sort,
          a.boost_expires_at AS boost_expires_at,
          a.nb_vues,
          a.boost_expires_at AS boosted_until,
          ${sortConfig.rankSelect ? `${sortConfig.rankSelect},` : ''}
          ${distanceSelect},
          a.commune_id,
          cat.id AS category_id,
          cat.name AS category_name, cat.slug AS category_slug, cat.icon AS category_icon,
          com.name AS commune_name,
          u.id AS seller_id, u.prenom AS seller_prenom, u.nom AS seller_nom,
          u.avatar_url AS seller_avatar,
          CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
          u.pro_verified AS seller_pro_verified,
          u.email_verified AS seller_email_verified,
          u.phone_verified AS seller_phone_verified,
          u.trust_score AS seller_trust_score,
          u.trust_level AS seller_trust_level,
          u.note_moyenne AS seller_note_moyenne,
          u.nb_avis AS seller_nb_avis,
          u.note_moyenne AS user_rating,
          (SELECT thumbnail_url FROM annonce_images
           WHERE annonce_id = a.id AND is_cover = TRUE
           LIMIT 1) AS cover_image_thumbnail,
          (SELECT id FROM annonce_images
           WHERE annonce_id = a.id AND is_cover = TRUE
           LIMIT 1) AS cover_image_id
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       LEFT JOIN categories parent ON parent.id = cat.parent_id
       LEFT JOIN communes com ON com.id = a.commune_id
       LEFT JOIN provinces prov ON prov.id = com.province_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE ${whereClause}${cursorWhere ? ` AND ${cursorWhere}` : ''}
       ORDER BY ${orderBy}
       LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`,
      [...params, ...(cursorParams || []), pageSize, offset]
    );

    const total = parseInt(countRes.rows[0].total);
    const lastRow = listRes.rows[listRes.rows.length - 1] || null;
    const sellerIds = [...new Set(
      listRes.rows
        .map((row) => Number(row.seller_id))
        .filter((value) => Number.isFinite(value) && value > 0)
    )];
    const sellerInsights = new Map();
    await Promise.all(sellerIds.map(async (sellerId) => {
      const [presence, response] = await Promise.all([
        Promise.resolve(getUserPresence(sellerId)),
        getSellerResponseTime(query, sellerId).catch(() => ({
          avg_response_time_minutes: null,
          avg_response_time_label: null,
        })),
      ]);
      sellerInsights.set(sellerId, {
        seller_is_online: presence.is_online,
        seller_last_seen_at: presence.last_seen_at,
        seller_last_seen_label: getPresenceLabel(presence),
        seller_avg_response_time_minutes: response.avg_response_time_minutes,
        seller_avg_response_time_label: response.avg_response_time_label,
      });
    }));
    const nextCursor = lastRow && listRes.rows.length === pageSize
      ? encodeListingCursor({
          v: 1,
          sort,
          values: sortConfig.tupleFromRow(lastRow),
        })
      : null;

    const payload = {
      data: listRes.rows.map((row) => ({
        ...mapListingSearchRow(row),
        ...(sellerInsights.get(Number(row.seller_id)) || {}),
      })),
      nextCursor,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    };

    await writeListCache(cacheKey, payload, 15_000);
    return res.json(payload);
  } catch (err) {
    next(err);
    return null;
  }
}

// ── Schémas ─────────────────────────────────────────────────

const baseListingSchema = Joi.object({
  title:            Joi.string().min(3).max(200).optional(),
  titre:            Joi.string().min(3).max(200).optional(),
  description:      Joi.string().min(10).max(5000).optional(),
  price:            Joi.number().min(0).max(100000000).allow(null).optional(),
  category_id:      Joi.number().integer().required(),
  commune_id:       Joi.number().integer().required(),
  condition:        Joi.string().valid('new','like_new','good','fair','for_parts').required(),
  is_free:          Joi.boolean().default(false),
  price_negotiable: Joi.boolean().default(false),
  is_negotiable:    Joi.boolean().default(false),
  contre_quoi:      Joi.string().max(200).allow(null, '').optional(),
  phone:            Joi.string().max(20).optional().allow(''),
  is_troc:          Joi.boolean().optional(),
  troc_accepts_complement_xpf: Joi.boolean().optional(),
  troc_complement_max_xpf: Joi.number().integer().min(0).optional(),
  troc_wants:       Joi.alternatives().try(
                      Joi.array().items(Joi.string().trim().min(1).max(80)),
                      Joi.string().allow('')
                    ).optional(),
  troc_status:      Joi.string().valid('open', 'negotiating', 'completed', 'cancelled').optional(),
  metadata:         Joi.object().unknown(true).optional(),
});

const createSchema = baseListingSchema.fork(
  ['description'],
  (f) => f.required()
);

const updateSchema = baseListingSchema.fork(
  ['category_id', 'commune_id', 'condition'],
  (f) => f.optional()
);
const updateSchemaWithStatus = updateSchema.keys({
  status: Joi.string().valid('active', 'reserved', 'inactive', 'sold').optional(),
});

const signalerSchema = Joi.object({
  reason:  Joi.string().valid('spam','fake','prohibited','offensive','other').required(),
  comment: Joi.string().max(500).optional().allow(''),
});

function normalizeTrocWants(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\n|;/]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

async function getCategoryById(categoryId) {
  if (!categoryId) return null;
  const result = await query(
    `SELECT id, slug, name
     FROM categories
     WHERE id = $1
     LIMIT 1`,
    [categoryId]
  );
  return result.rows[0] || null;
}

function resolveListingMetadata(categorySlug, value) {
  return validateListingMetadata(categorySlug, value || {});
}

async function resolveListingCategoryMetadata(categoryId, rawMetadata) {
  const category = await getCategoryById(categoryId);
  if (!category) {
    const error = new Error('Catégorie introuvable.');
    error.statusCode = 400;
    throw error;
  }

  const metadata = resolveListingMetadata(category.slug, rawMetadata);
  return { category, metadata };
}

// ── GET /api/listings — Recherche ───────────────────────────

router.get('/', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next);
});

router.get('/location_courte_duree', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'location_courte_duree' });
});

router.get('/locations', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'location_courte_duree' });
});

router.get('/services', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'services' });
});

router.get('/don', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'don' });
});

router.get('/dons', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'don' });
});

router.get('/immobilier', optionalAuth, async (req, res, next) => {
  return executeListingSearch(req, res, next, { category: 'immobilier' });
});

// ── GET /api/listings/:id — Détail ──────────────────────────

router.post('/:id/view', async (req, res, next) => {
  try {
    const listingId = Number(req.params.id);
    if (!Number.isFinite(listingId) || listingId <= 0) {
      return res.status(400).json({ error: 'Annonce invalide.' });
    }

    const source = String(req.body?.source || 'direct').slice(0, 40);
    await query(
      `INSERT INTO listing_stats (listing_id, viewer_ip, source)
       VALUES ($1, $2, $3)`,
      [listingId, req.ip || req.headers['x-forwarded-for'] || null, source]
    );

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/contact', async (req, res, next) => {
  try {
    const listingId = Number(req.params.id);
    if (!Number.isFinite(listingId) || listingId <= 0) {
      return res.status(400).json({ error: 'Annonce invalide.' });
    }

    const contactType = String(req.body?.contact_type || 'message').slice(0, 30);
    await query(
      `INSERT INTO listing_contacts (listing_id, contact_type)
       VALUES ($1, $2)`,
      [listingId, contactType]
    );

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
          a.*,
          cat.id AS category_id, cat.name AS category_name, cat.slug AS category_slug, cat.icon AS category_icon,
          parent.name AS parent_category_name, parent.slug AS parent_category_slug,
          com.id AS commune_id, com.name AS commune_name, com.slug AS commune_slug,
          prov.name AS province_name,
          u.id AS seller_id, u.prenom AS seller_prenom, u.nom AS seller_nom,
          u.avatar_url AS seller_avatar,
          CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS seller_is_pro,
          u.pro_verified AS seller_pro_verified,
          u.trust_score AS seller_trust_score, u.trust_level AS seller_trust_level,
          u.note_moyenne AS seller_note, u.nb_avis AS seller_nb_avis,
          u.created_at AS seller_since, u.nb_annonces AS seller_nb_annonces,
          seller_com.name AS seller_commune_name,
          seller_prov.name AS seller_province_name,
          u.email_verified AS seller_email_verified,
          u.phone_verified AS seller_phone_verified,
          COALESCE(
            json_agg(
              json_build_object(
                'id', img.id,
                'url', img.url,
                'thumbnail_url', img.thumbnail_url,
                'variants', img.variants,
                'is_cover', img.is_cover
              )
              ORDER BY img.is_cover DESC, img.sort_order
            ) FILTER (WHERE img.id IS NOT NULL),
            '[]'
          ) AS images
       FROM annonces a
       LEFT JOIN categories cat    ON cat.id = a.category_id
       LEFT JOIN categories parent ON parent.id = cat.parent_id
       LEFT JOIN communes com      ON com.id = a.commune_id
       LEFT JOIN provinces prov    ON prov.id = com.province_id
       LEFT JOIN users u           ON u.id = a.user_id
       LEFT JOIN communes seller_com ON seller_com.id = u.commune_id
       LEFT JOIN provinces seller_prov ON seller_prov.id = seller_com.province_id
       LEFT JOIN annonce_images img ON img.annonce_id = a.id
       WHERE a.id = $1 AND a.deleted_at IS NULL
       GROUP BY a.id, cat.id, parent.id, com.id, prov.id, u.id, seller_com.id, seller_prov.id`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Annonce introuvable.' });
    }

    const listing = result.rows[0];
    const sellerPresence = getUserPresence(listing.seller_id);
    const sellerResponse = await getSellerResponseTime(query, listing.seller_id).catch(() => ({
      avg_response_time_minutes: null,
      avg_response_time_label: null,
    }));
    listing.seller_is_online = sellerPresence.is_online;
    listing.seller_last_seen_at = sellerPresence.last_seen_at;
    listing.seller_last_seen_label = getPresenceLabel(sellerPresence);
    listing.seller_avg_response_time_minutes = sellerResponse.avg_response_time_minutes;
    listing.seller_avg_response_time_label = sellerResponse.avg_response_time_label;

    // Incrémenter les vues (async, non bloquant)
    query(
      `UPDATE annonces SET nb_vues = nb_vues + 1 WHERE id = $1`,
      [id]
    ).catch(() => {});

    // Statut favori si connecté
    let isFavorited = false;
    if (req.user) {
      const fav = await query(
        `SELECT 1 FROM favoris WHERE user_id = $1 AND annonce_id = $2`,
        [req.user.id, id]
      );
      isFavorited = fav.rows.length > 0;
    }

    return res.json(mapListingDetailResponse(listing, isFavorited));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/listings — Créer ───────────────────────────────

router.post('/', authenticate, rateLimitAnnonces, async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const title = (value.title || value.titre || '').trim();
    const description = value.description?.trim();
    const priceNegotiable = value.price_negotiable || value.is_negotiable || false;
    const isTroc = Boolean(value.is_troc);
    const trocWants = normalizeTrocWants(value.troc_wants);
    const trocAcceptsComplement = Boolean(value.troc_accepts_complement_xpf);
    const trocComplementMax = Number(value.troc_complement_max_xpf || 0);
    const trocStatus = value.troc_status || 'open';
    const rawMetadata = Object.prototype.hasOwnProperty.call(value, 'metadata') ? value.metadata : {};
    const { category, metadata } = await resolveListingCategoryMetadata(value.category_id, rawMetadata);
    const isDonListing = isDonCategory(category.slug);
    const price = isDonListing ? 0 : (value.is_free ? null : value.price);

    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis.' });
    }

    if (!isDonListing && !value.is_free && (price === null || price === undefined)) {
      return res.status(400).json({ error: 'Le prix est requis pour une annonce payante.' });
    }

    if (isTroc && trocWants.length === 0) {
      return res.status(400).json({ error: 'Merci de preciser ce que vous cherchez pour le troc.' });
    }

    if (isTroc && trocAcceptsComplement && trocComplementMax <= 0) {
      return res.status(400).json({ error: 'Le complement XPF maximal doit etre superieur a 0.' });
    }

    // Limite d'annonces actives pour les non-pro
    if (!req.user.is_pro) {
      const activeCount = await query(
        `SELECT COUNT(*) AS n FROM annonces WHERE user_id = $1 AND status = 'active' AND deleted_at IS NULL`,
        [req.user.id]
      );
      if (parseInt(activeCount.rows[0].n) >= 10) {
        return res.status(403).json({
          error: 'Limite de 10 annonces actives atteinte. Passez en compte Pro pour publier davantage.',
          code: 'LIMIT_REACHED',
        });
      }
    }

    const result = await withTransaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO annonces
           (user_id, titre, description, prix, category_id, commune_id, condition, is_negotiable, phone, contre_quoi,
            is_troc, troc_accepts_complement_xpf, troc_complement_max_xpf, troc_wants, troc_status, metadata, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'active')
         RETURNING *`,
        [
          req.user.id,
          title,
          description,
          price,
          value.category_id,
          value.commune_id,
          value.condition,
          priceNegotiable,
          value.phone || null,
          value.contre_quoi || null,
          isTroc,
          isTroc ? trocAcceptsComplement : false,
          isTroc ? trocComplementMax : 0,
          isTroc ? trocWants : [],
          isTroc ? trocStatus : 'open',
          JSON.stringify(metadata),
        ]
      );

      await client.query(
        `UPDATE users SET nb_annonces = nb_annonces + 1 WHERE id = $1`,
        [req.user.id]
      );

      return ins.rows[0];
    });

    // Déclencher les alertes de recherche immédiates en arrière-plan
    matchImmediateAlerts(result).catch((err) =>
      console.error('[alerts:immediate] Erreur post-publication:', err.message)
    );
    if (isTroc) {
      enqueueTrocMatching(result.id).catch((err) =>
        console.error('[troc:matching] Enqueue erreur:', err.message)
      );
    }
    await flagIfSuspicious(result.id);
    void clearListCache();

    return res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/listings/:id — Modifier ────────────────────────

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query(
      `SELECT id, user_id, category_id, commune_id, titre, description, prix, condition, status,
              is_boosted, boost_type, boost_expires_at, nb_vues, nb_favoris, slug,
              expires_at, published_at, created_at, updated_at, metadata, is_troc,
              troc_accepts_complement_xpf, troc_complement_max_xpf, troc_wants, troc_status,
              boosted_until, delete_reason, phone, is_negotiable, contre_quoi, deleted_at, view_count
       FROM annonces
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Annonce introuvable.' });

    const listing = existing.rows[0];
    if (listing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres annonces.' });
    }

    const { error, value } = updateSchemaWithStatus.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const nextCategoryId = Object.prototype.hasOwnProperty.call(value, 'category_id') && value.category_id !== undefined
      ? value.category_id
      : listing.category_id;
    const rawMetadata = Object.prototype.hasOwnProperty.call(value, 'metadata')
      ? value.metadata
      : (listing.metadata || {});
    const { category, metadata } = await resolveListingCategoryMetadata(nextCategoryId, rawMetadata);
    const isDonListing = isDonCategory(category.slug);

    const fields = [];
    const params = [];
    let p = 1;

    const title = (value.title || value.titre || '').trim();
    const hasTitle = Object.prototype.hasOwnProperty.call(value, 'title') || Object.prototype.hasOwnProperty.call(value, 'titre');
    if (hasTitle && !title) {
      return res.status(400).json({ error: 'Le titre est requis.' });
    }

    if (hasTitle) {
      fields.push(`titre = $${p}`);
      params.push(title);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'description') && value.description !== undefined) {
      fields.push(`description = $${p}`);
      params.push(value.description?.trim() || null);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'price') || Object.prototype.hasOwnProperty.call(value, 'is_free')) {
      const price = isDonListing ? 0 : (value.is_free ? null : value.price);
      fields.push(`prix = $${p}`);
      params.push(price);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'category_id') && value.category_id !== undefined) {
      fields.push(`category_id = $${p}`);
      params.push(value.category_id);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'metadata') || Object.prototype.hasOwnProperty.call(value, 'category_id')) {
      fields.push(`metadata = $${p}`);
      params.push(JSON.stringify(metadata));
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'commune_id') && value.commune_id !== undefined) {
      fields.push(`commune_id = $${p}`);
      params.push(value.commune_id);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'condition') && value.condition !== undefined) {
      fields.push(`condition = $${p}`);
      params.push(value.condition);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'price_negotiable') || Object.prototype.hasOwnProperty.call(value, 'is_negotiable')) {
      const priceNegotiable = value.price_negotiable || value.is_negotiable || false;
      fields.push(`is_negotiable = $${p}`);
      params.push(priceNegotiable);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'contre_quoi')) {
      fields.push(`contre_quoi = $${p}`);
      params.push(value.contre_quoi || null);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'is_troc')) {
      const nextIsTroc = Boolean(value.is_troc);
      const trocWants = normalizeTrocWants(value.troc_wants);
      const trocAcceptsComplement = Boolean(value.troc_accepts_complement_xpf);
      const trocComplementMax = Number(value.troc_complement_max_xpf || 0);
      const trocStatus = value.troc_status || (nextIsTroc ? listing.troc_status || 'open' : 'open');

      if (nextIsTroc && trocWants.length === 0) {
        return res.status(400).json({ error: 'Merci de preciser ce que vous cherchez pour le troc.' });
      }

      if (nextIsTroc && trocAcceptsComplement && trocComplementMax <= 0) {
        return res.status(400).json({ error: 'Le complement XPF maximal doit etre superieur a 0.' });
      }

      fields.push(`is_troc = $${p}`);
      params.push(nextIsTroc);
      p++;

      fields.push(`troc_accepts_complement_xpf = $${p}`);
      params.push(nextIsTroc ? trocAcceptsComplement : false);
      p++;

      fields.push(`troc_complement_max_xpf = $${p}`);
      params.push(nextIsTroc ? trocComplementMax : 0);
      p++;

      fields.push(`troc_wants = $${p}`);
      params.push(nextIsTroc ? trocWants : []);
      p++;

      fields.push(`troc_status = $${p}`);
      params.push(nextIsTroc ? trocStatus : 'open');
      p++;
    } else {
      if (Object.prototype.hasOwnProperty.call(value, 'troc_wants')) {
        fields.push(`troc_wants = $${p}`);
        params.push(normalizeTrocWants(value.troc_wants));
        p++;
      }

      if (Object.prototype.hasOwnProperty.call(value, 'troc_accepts_complement_xpf')) {
        fields.push(`troc_accepts_complement_xpf = $${p}`);
        params.push(Boolean(value.troc_accepts_complement_xpf));
        p++;
      }

      if (Object.prototype.hasOwnProperty.call(value, 'troc_complement_max_xpf')) {
        fields.push(`troc_complement_max_xpf = $${p}`);
        params.push(Number(value.troc_complement_max_xpf || 0));
        p++;
      }

      if (Object.prototype.hasOwnProperty.call(value, 'troc_status')) {
        fields.push(`troc_status = $${p}`);
        params.push(value.troc_status || 'open');
        p++;
      }
    }

    if (Object.prototype.hasOwnProperty.call(value, 'phone')) {
      fields.push(`phone = $${p}`);
      params.push(value.phone || null);
      p++;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'status') && value.status !== undefined) {
      fields.push(`status = $${p}`);
      params.push(value.status);
      p++;
    }

    if (fields.length === 0) return res.status(400).json({ error: 'Aucun champ à modifier.' });

    params.push(id);
    const result = await query(
      `UPDATE annonces SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${p} RETURNING *`,
      params
    );

    flagIfSuspicious(id).catch((err) =>
      console.error('[antiScam] Erreur revalidation:', err.message)
    );
    if (result.rows[0]?.is_troc) {
      enqueueTrocMatching(result.rows[0].id).catch((err) =>
        console.error('[troc:matching] Enqueue erreur:', err.message)
      );
    }
    void clearListCache();

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/listings/:id — Supprimer ─────────────────────

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'other' } = req.body;

    const existing = await query(
      `SELECT user_id FROM annonces WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Annonce introuvable.' });

    if (existing.rows[0].user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres annonces.' });
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE annonces SET deleted_at = NOW(), delete_reason = $1 WHERE id = $2`,
        [reason, id]
      );
      await client.query(
        `UPDATE users SET nb_annonces = GREATEST(nb_annonces - 1, 0) WHERE id = $1`,
        [existing.rows[0].user_id]
      );
    });

    void clearListCache();
    return res.json({ message: 'Annonce supprimée.' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/listings/:id/favoris — Toggle favori ────────────

router.post('/:id/favoris', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query(
      `SELECT 1 FROM favoris WHERE user_id = $1 AND annonce_id = $2`,
      [req.user.id, id]
    );

    if (existing.rows.length > 0) {
      await query(`DELETE FROM favoris WHERE user_id = $1 AND annonce_id = $2`, [req.user.id, id]);
      void clearListCache();
      return res.json({ favorited: false });
    } else {
      await query(
        `INSERT INTO favoris (user_id, annonce_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [req.user.id, id]
      );
      void clearListCache();
      return res.json({ favorited: true });
    }
  } catch (err) {
    next(err);
  }
});

// ── GET /api/listings/:id/favoris — Statut favori ───────────

router.get('/:id/favoris', authenticate, async (req, res, next) => {
  try {
    const fav = await query(
      `SELECT 1 FROM favoris WHERE user_id = $1 AND annonce_id = $2`,
      [req.user.id, req.params.id]
    );
    return res.json({ favorited: fav.rows.length > 0 });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/listings/:id/signaler — Signalement ───────────

router.post('/:id/signaler', authenticate, async (req, res, next) => {
  try {
    const { error, value } = signalerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Vérifier qu'on ne signale pas sa propre annonce
    const listing = await query(
      `SELECT user_id FROM annonces WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (!listing.rows[0]) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (listing.rows[0].user_id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas signaler votre propre annonce.' });
    }

    await query(
      `INSERT INTO signalements (annonce_id, reporter_id, reason, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (annonce_id, reporter_id) DO UPDATE SET reason = $3, comment = $4`,
      [req.params.id, req.user.id, value.reason, value.comment || null]
    );
    void clearListCache();

    return res.json({ message: 'Signalement enregistré. Notre équipe va examiner cette annonce.' });
  } catch (err) {
    next(err);
  }
});

// ?? GET /api/users/:userId/listings ? Annonces d'un utilisateur

// ?? PATCH /api/listings/:id/mark-given ? Marquer un don comme compl?t?

router.patch('/:id/mark-given', authenticate, async (req, res, next) => {
  try {
    const listing = await query(
      `SELECT a.id, a.user_id, a.status, a.metadata, cat.slug AS category_slug
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       WHERE a.id = $1 AND a.deleted_at IS NULL`,
      [req.params.id]
    );

    if (!listing.rows[0]) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (listing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres annonces.' });
    }
    if (!isDonCategory(listing.rows[0].category_slug)) {
      return res.status(400).json({ error: 'Cette action est r?serv?e aux annonces de don.' });
    }

    const result = await query(
      `UPDATE annonces
       SET status = 'completed',
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('given_at', NOW()),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    void clearListCache();
    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const nextStatus = String(req.body?.status || '').trim().toLowerCase();
    if (!['active', 'reserved', 'sold'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Statut invalide. Utilisez active, reserved ou sold.' });
    }

    const listingResult = await query(
      `SELECT a.id, a.user_id, a.status, a.titre, a.metadata, a.deleted_at,
              u.prenom, u.nom, u.email
       FROM annonces a
       JOIN users u ON u.id = a.user_id
       WHERE a.id = $1 AND a.deleted_at IS NULL
       LIMIT 1`,
      [req.params.id]
    );

    const listing = listingResult.rows[0];
    if (!listing) {
      return res.status(404).json({ error: 'Annonce introuvable.' });
    }
    if (listing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres annonces.' });
    }

    const updated = await query(
      `UPDATE annonces
       SET status = $2,
           updated_at = NOW(),
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('status_updated_at', NOW()::text)
       WHERE id = $1
       RETURNING *`,
      [req.params.id, nextStatus]
    );

    const conversationRows = await query(
      `SELECT id, buyer_id
       FROM conversations
       WHERE annonce_id = $1`,
      [req.params.id]
    );

    const systemMessage = nextStatus === 'reserved'
      ? `📌 L'annonce « ${listing.titre} » est maintenant réservée.`
      : `✅ L'annonce « ${listing.titre} » est marquée comme vendue.`

    await Promise.all(
      conversationRows.rows.map(async (conversation) => {
        const recipientId = Number(conversation.buyer_id)
        if (!Number.isFinite(recipientId) || recipientId <= 0) return

        await query(
          `INSERT INTO messages (conv_id, sender_id, type, content)
           VALUES ($1, $2, 'system', $3)`,
          [conversation.id, req.user.id, systemMessage]
        ).catch(() => {})

        await Promise.all([
          createNotification(recipientId, {
            type: 'system',
            title: nextStatus === 'reserved' ? 'Annonce réservée' : 'Annonce vendue',
            body: systemMessage,
            href: `/messages/${conversation.id}`,
          }),
          sendPushToUser(recipientId, {
            title: nextStatus === 'reserved' ? 'Annonce réservée' : 'Annonce vendue',
            body: systemMessage,
            data: { type: 'listing_status_update', listing_id: Number(req.params.id), conversation_id: conversation.id, status: nextStatus },
          }).catch(() => {}),
        ])
      })
    )

    void clearListCache();
    return res.json({ data: updated.rows[0] })
  } catch (err) {
    next(err)
  }
})

router.get('/user/:userId', optionalAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, parseInt(limit));
    const offset   = (pageNum - 1) * pageSize;

    const result = await query(
      `SELECT a.id, a.titre, a.prix, a.condition, a.created_at, a.nb_vues AS view_count, a.status, a.metadata,
              cat.name AS category_name,
              com.name AS commune_name,
              u.id AS seller_id, u.prenom AS seller_prenom, u.nom AS seller_nom,
              u.avatar_url AS seller_avatar,
              CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
              u.pro_verified AS seller_pro_verified,
              u.email_verified AS seller_email_verified,
              u.phone_verified AS seller_phone_verified,
              u.trust_score AS seller_trust_score,
              u.trust_level AS seller_trust_level,
              (SELECT thumbnail_url FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image,
              (SELECT id FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image_id
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       LEFT JOIN communes com   ON com.id = a.commune_id
       LEFT JOIN users u        ON u.id = a.user_id
       WHERE a.user_id = $1 AND a.deleted_at IS NULL AND a.status = 'active'
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    );

    return res.json({ data: result.rows.map(mapUserListingRow) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

````

## PATH: backend/src/routes/users.js
````
// ============================================================
//  Routes — Utilisateurs
//  GET  /api/users/:id             — Profil public
//  PUT  /api/users/me              — Modifier mon profil
//  GET  /api/users/me/favoris      — Mes favoris
//  GET  /api/users/:id/reviews     — Avis reçus
//  POST /api/users/:id/reviews     — Laisser un avis
// ============================================================

const express = require('express');
const bcrypt  = require('bcryptjs');
const Joi     = require('joi');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { findUserById } = require('../services/authAccountService');
const { getUserTrocBadges } = require('../services/trocWorkflowService');
const { getUserPresence, getPresenceLabel } = require('../services/presenceService');
const { getSellerResponseTime } = require('../services/sellerInsightsService');

const router = express.Router();

async function fetchUserDetailedProfile(userId) {
  const result = await query(
    `SELECT
        u.id,
        u.prenom,
        u.nom,
        u.avatar_url,
        u.bio,
        u.member_since,
        COALESCE(u.rides_as_driver, 0) AS rides_as_driver,
        COALESCE(u.rides_as_passenger, 0) AS rides_as_passenger,
        COALESCE(u.trust_score, 100) AS trust_score,
        CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
        u.nb_annonces,
        u.note_moyenne,
        u.nb_avis,
        u.created_at,
        u.phone_verified,
        u.email_verified,
        u.commune_id,
        com.name AS commune_name,
        com.id AS commune_id_lookup,
        prov.id AS province_id,
        prov.name AS province_name,
        COALESCE((
          SELECT SUM(a.nb_vues)::int
          FROM annonces a
          WHERE a.user_id = u.id AND a.deleted_at IS NULL
        ), 0) AS total_vues,
        COALESCE((
          SELECT SUM(a.nb_favoris)::int
          FROM annonces a
          WHERE a.user_id = u.id AND a.deleted_at IS NULL
        ), 0) AS total_favoris,
        COALESCE((
          SELECT COUNT(*)
          FROM annonces a
          WHERE a.user_id = u.id AND a.deleted_at IS NULL AND a.status = 'active'
        ), 0) AS active_listings_count,
        COALESCE((
          SELECT COUNT(*)
          FROM annonces a
          WHERE a.user_id = u.id AND a.deleted_at IS NULL AND a.status = 'active'
            AND (
              a.is_boosted = TRUE
              AND (a.boost_expires_at IS NULL OR a.boost_expires_at > NOW())
            )
        ), 0) AS annonces_boostees,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'rating', r.rating,
              'comment', r.comment,
              'role', r.role,
              'reviewer_prenom', rev.prenom,
              'created_at', r.created_at
            ) ORDER BY r.created_at DESC
          )
          FROM user_reviews r
          LEFT JOIN users rev ON rev.id = r.reviewer_id
          WHERE r.reviewed_id = u.id
        ), '[]'::json) AS reviews
     FROM users u
     LEFT JOIN communes com ON com.id = u.commune_id
     LEFT JOIN provinces prov ON prov.id = com.province_id
     WHERE u.id = $1 AND u.deleted_at IS NULL
     GROUP BY u.id, com.id, com.name, prov.id, prov.name`,
    [userId]
  );

  return result.rows[0] || null;
}

async function getPublicProfilePayload(userId) {
  const profile = await fetchUserDetailedProfile(userId);
  if (!profile) return null;

  const [presence, responseTime] = await Promise.all([
    Promise.resolve(getUserPresence(profile.id)),
    getSellerResponseTime(query, profile.id).catch(() => ({
      avg_response_time_minutes: null,
      avg_response_time_label: null,
    })),
  ]);

  return {
    ...profile,
    is_online: presence.is_online,
    last_seen_at: presence.last_seen_at,
    last_seen_label: getPresenceLabel(presence),
    ...responseTime,
  };
}

// ── GET /api/users/me/favoris — Mes favoris ─────────────────

// â”€â”€ GET /api/users/me â€” Mon profil courant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await findUserById(req.user.id)
    const user = result.rows[0] || null
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' })
    return res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

const tourSeenSchema = Joi.object({
  tourKey: Joi.string().trim().min(1).max(120).required(),
})

// â”€â”€ PATCH /api/users/me/tours-seen â€” Marquer un tour comme vu â”€â”€â”€â”€â”€â”€â”€

router.patch('/me/tours-seen', authenticate, async (req, res, next) => {
  try {
    const { error, value } = tourSeenSchema.validate(req.body || {})
    if (error) return res.status(400).json({ error: error.details[0].message })

    await query(
      `UPDATE users
       SET tours_seen = CASE
         WHEN $2 = ANY(COALESCE(tours_seen, '{}'::text[])) THEN COALESCE(tours_seen, '{}'::text[])
         ELSE COALESCE(tours_seen, '{}'::text[]) || $2::text
       END,
       updated_at = NOW()
       WHERE id = $1`,
      [req.user.id, value.tourKey]
    )

    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})
router.get('/me/favoris', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, parseInt(limit));
    const offset   = (pageNum - 1) * pageSize;

    const result = await query(
      `SELECT a.id, a.titre, a.prix, a.condition, a.created_at,
              cat.name AS category_name, com.name AS commune_name,
              u.id AS seller_id, u.prenom AS seller_prenom, u.nom AS seller_nom,
              u.avatar_url AS seller_avatar,
              CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS seller_is_pro,
              u.pro_verified AS seller_pro_verified,
              u.email_verified AS seller_email_verified,
              u.phone_verified AS seller_phone_verified, u.trust_score AS seller_trust_score,
              u.trust_level AS seller_trust_level,
              f.created_at AS favorited_at,
              (SELECT thumbnail_url FROM annonce_images WHERE annonce_id = a.id AND is_cover = TRUE LIMIT 1) AS cover_image
       FROM favoris f
       JOIN annonces a  ON a.id = f.annonce_id AND a.deleted_at IS NULL AND a.status = 'active'
       LEFT JOIN categories cat ON cat.id = a.category_id
       LEFT JOIN communes com   ON com.id = a.commune_id
       LEFT JOIN users u       ON u.id = a.user_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, pageSize, offset]
    );

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/:id/profile — Profil public détaillé ──────

router.get('/:id/profile', async (req, res, next) => {
  try {
    const profile = await getPublicProfilePayload(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    return res.json({
      data: profile,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/:id — Profil public ──────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const profile = await getPublicProfilePayload(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    return res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/users/me — Modifier mon profil ──────────────────

const updateProfileSchema = Joi.object({
  prenom:     Joi.string().min(1).max(100).optional(),
  nom:        Joi.string().min(1).max(100).optional(),
  bio:        Joi.string().max(500).optional().allow(''),
  commune_id: Joi.number().integer().optional().allow(null),
  telephone:  Joi.string().max(20).optional().allow(''),
  current_password: Joi.string().optional(),
  new_password:     Joi.string().min(8).max(100).optional(),
});

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { current_password, new_password, ...profileFields } = value;

    // Changement de mot de passe
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Mot de passe actuel requis pour le modifier.' });
      }
      const userRow = await query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id]);
      const valid   = await bcrypt.compare(current_password, userRow.rows[0].password_hash);
      if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });

      profileFields.password_hash = await bcrypt.hash(new_password, 12);
    }

    const fields = [];
    const params = [];
    let p = 1;
    for (const [key, val] of Object.entries(profileFields)) {
      fields.push(`${key} = $${p}`);
      params.push(val);
      p++;
    }

    if (fields.length === 0) return res.status(400).json({ error: 'Aucun champ à modifier.' });

    params.push(req.user.id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${p}
       RETURNING id, email, prenom, nom, bio, commune_id, telephone, avatar_url, is_pro, phone_verified, onboarding_step`,
      params
    );

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/users/me/onboarding ── Avancement onboarding ──

router.patch('/me/onboarding', authenticate, async (req, res, next) => {
  try {
    const step = Number(req.body?.step ?? req.body?.onboarding_step ?? 0)
    if (!Number.isFinite(step) || step < 0) {
      return res.status(400).json({ error: 'Étape d’onboarding invalide.' })
    }

    const result = await query(
      `UPDATE users
       SET onboarding_step = GREATEST(COALESCE(onboarding_step, 0), $2::int), updated_at = NOW()
       WHERE id = $1
       RETURNING id, onboarding_step`,
      [req.user.id, Math.min(3, Math.floor(step))]
    )

    return res.json({ data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/users/:id/reviews — Avis reçus ──────────────────

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.id, r.note, r.commentaire, r.created_at,
              u.prenom AS auteur_prenom, u.avatar_url AS auteur_avatar
       FROM avis r
       JOIN users u ON u.id = r.auteur_id
       WHERE r.destinataire_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [req.params.id]
    ).catch(() => ({ rows: [] }));

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/troc-badges', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Utilisateur invalide.' });
    }

    const badges = await getUserTrocBadges(query, userId);
    return res.json({ data: badges });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users/:id/reviews — Laisser un avis ────────────

router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const destinataireId = parseInt(req.params.id);
    if (destinataireId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous laisser un avis.' });
    }

    const { note, commentaire } = req.body;
    if (!note || note < 1 || note > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5.' });
    }

    await query(
      `INSERT INTO avis (auteur_id, destinataire_id, note, commentaire)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (auteur_id, destinataire_id) DO UPDATE SET note = $3, commentaire = $4`,
      [req.user.id, destinataireId, note, commentaire || null]
    ).catch(() => {});

    // Recalculer la note moyenne
    await query(
      `UPDATE users SET
         note_moyenne = (SELECT AVG(note) FROM avis WHERE destinataire_id = $1),
         nb_avis      = (SELECT COUNT(*)  FROM avis WHERE destinataire_id = $1)
       WHERE id = $1`,
      [destinataireId]
    ).catch(() => {});

    return res.json({ message: 'Avis enregistré.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

````

## PATH: backend/src/routes/messages.js
````
// ============================================================
//  Routes — Messagerie
//  GET  /api/messages/conversations
//  GET  /api/messages/conversations/:id
//  POST /api/messages/conversations
//  POST /api/messages/conversations/:id
//  DELETE /api/messages/conversations/:id
// ============================================================

const express = require('express');
const Joi = require('joi');
const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { messageLimiter } = require('../middleware/rateLimit');
const { emitNewMessage, emitConversationRead } = require('../services/websocketServer');
const { sendNewMessageEmail } = require('../services/emailService');
const { sendPushToUser } = require('../services/pushService');
const { notifyNewMessage } = require('../services/notificationService');
const { maybeSendAutoReply } = require('../services/autoReplyService');
const {
  archiveConversation,
  appendConversationMessage,
  createHttpError,
  listConversationsForUser,
  loadConversationThread,
  loadConversationAttachmentForUser,
  loadMessageNotificationTarget,
  markConversationMessagesRead,
  startConversation,
} = require('../services/messageConversationService');
const { verifyAttachmentDownloadToken } = require('../services/messageAttachmentAccess');

const router = express.Router();
router.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/attachments/') && req.query?.token) {
    return next();
  }
  return authenticate(req, res, next);
});

const startConversationSchema = Joi.object({
  annonce_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().trim()).optional(),
  listing_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().trim()).optional(),
  message: Joi.string().min(1).max(2000).required(),
}).or('annonce_id', 'listing_id');

const sendMessageSchema = Joi.object({
  type: Joi.string().valid('text', 'photo', 'audio', 'document').default('text'),
  content: Joi.string().max(2000).allow('', null).optional(),
  photo_url: Joi.string().max(500).allow('', null).optional(),
  audio_url: Joi.string().max(500).allow('', null).optional(),
  attachment_url: Joi.string().max(500).allow('', null).optional(),
  attachment_name: Joi.string().max(255).allow('', null).optional(),
  attachment_mime_type: Joi.string().max(120).allow('', null).optional(),
  attachment_size_bytes: Joi.number().integer().min(0).allow(null).optional(),
});

router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await listConversationsForUser(req.user.id);
    res.json({ data: conversations });
  } catch (err) {
    next(err);
  }
});

router.get('/conversations/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const before = req.query.before || null;

    const thread = await loadConversationThread(userId, id, page, limit, before);
    res.json({
      data: {
        conversation: thread.conversation,
        messages: thread.messages,
      },
      pagination: thread.pagination,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/attachments/:messageId/download', async (req, res, next) => {
  try {
    const messageId = Number(req.params.messageId);
    const token = String(req.query?.token || '').trim();
    let userId = req.user?.id || null;

    if (token) {
      const decoded = verifyAttachmentDownloadToken(token);
      if (Number(decoded.messageId) !== messageId) {
        throw createHttpError(401, 'Jeton de téléchargement invalide');
      }
      if (userId && Number(userId) !== Number(decoded.userId)) {
        throw createHttpError(403, 'Téléchargement non autorisé');
      }
      userId = decoded.userId;
    }

    if (!userId || !messageId) {
      throw createHttpError(401, 'Téléchargement non autorisé');
    }

    const attachment = await loadConversationAttachmentForUser(userId, messageId);
    await fs.access(attachment.filePath);
    res.download(attachment.filePath, attachment.attachment_name || path.basename(attachment.filePath));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Pièce jointe introuvable' });
    }
    if (err.status === 404) {
      return res.status(404).json({ error: err.message || 'Pièce jointe introuvable' });
    }
    next(err);
  }
});

// TODO: test E2E sur l'ouverture de conversation, le PATCH read et le double-check.
router.patch('/conversations/:id/read', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const readCount = await markConversationMessagesRead(id, userId);
    if (readCount > 0) {
      await emitConversationRead(id, userId, readCount);
    }

    res.json({
      data: {
        conversation_id: Number(id),
        read_count: readCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/conversations', messageLimiter, validate({ body: startConversationSchema }), async (req, res, next) => {
  try {
    const buyerId = req.user.id;
    const listingId = req.body.listing_id ?? req.body.annonce_id;
    const { message } = req.body;

    const result = await startConversation(buyerId, listingId, message);

    res.status(201).json({
      message: 'Conversation démarrée',
      data: {
        conversationId: result.conversationId,
        message: result.message,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/conversations/:id', messageLimiter, validate({ body: sendMessageSchema }), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await appendConversationMessage(userId, id, req.body);
    const sender = `${req.user.prenom || ''} ${req.user.nom || ''}`.trim() || 'Un utilisateur';

    emitNewMessage(id, { ...result.message, conversation_id: id }, result.recipientId);

    const isTrocProposalMessage = result.message?.type === 'troc_proposal'
      || Boolean(result.message?.metadata?.proposal_id)
      || Boolean(result.message?.metadata?.troc_proposal_id);

    if (!isTrocProposalMessage) {
      loadMessageNotificationTarget(id, result.recipientId).then((target) => {
        if (!target) return;

        sendNewMessageEmail(target.email, target.prenom, sender, target.titre, id, result.recipientId).catch(() => {});
        const notificationBody = result.message.type === 'audio'
          ? 'Nouveau message vocal'
          : result.message.type === 'photo'
            ? 'Nouvelle photo partagée'
            : result.message.type === 'document'
              ? 'Nouveau document partagé'
              : result.message.content?.slice(0, 100) ?? 'Nouveau message';

        sendPushToUser(result.recipientId, {
          title: `💬 ${sender}`,
          body: notificationBody,
          data: { type: 'new_message', convId: id },
        }).catch(() => {});
        notifyNewMessage(result.recipientId, sender, target.titre ?? '', id).catch(() => {});
      }).catch(() => {});

      maybeSendAutoReply({
        conversationId: id,
        senderId: userId,
        recipientId: result.recipientId,
        sourceMessage: result.message,
      }).then((autoReply) => {
        if (!autoReply?.message) return;
        emitNewMessage(id, { ...autoReply.message, conversation_id: id }, autoReply.recipientId);
        sendPushToUser(autoReply.recipientId, {
          title: '💬 Réponse automatique',
          body: String(autoReply.message.content || '').slice(0, 120) || 'Réponse automatique',
          data: { type: 'new_message', convId: id },
        }).catch(() => {});
      }).catch(() => {});
    }

    res.status(201).json({ data: result.message });
  } catch (err) {
    if (err.status === 422 && err.reason) {
      return res.status(422).json({
        error: err.message,
        reason: err.reason,
      });
    }
    next(err);
  }
});

router.delete('/conversations/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await archiveConversation(userId, id);
    res.json({ message: 'Conversation archivée' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

````

## PATH: backend/src/routes/notifications.route.js
````
'use strict';

// ============================================================
//  Kalico — Routes notifications in-app et préférences
//  GET  /api/users/notifications                 — Liste
//  GET  /api/users/notifications/preferences     — Préférences
//  PUT  /api/users/notifications/preferences     — Mise à jour
//  GET  /api/users/notifications/unsubscribe/:token — Désabonnement public
//  POST /api/users/notifications/:id/read        — Marquer une comme lue
//  POST /api/users/notifications/read-all        — Tout marquer lu
// ============================================================

const express = require('express');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');
const {
  disableNotificationByToken,
  getNotificationPreferences,
  saveNotificationPreferences,
} = require('../services/notificationPreferencesService');

const router = express.Router();

const preferencesSchema = Joi.object({
  email_new_message: Joi.boolean().optional(),
  push_new_message: Joi.boolean().optional(),
  email_search_alert: Joi.boolean().optional(),
  push_search_alert: Joi.boolean().optional(),
  email_boost_activated: Joi.boolean().optional(),
  email_offer_received: Joi.boolean().optional(),
  email_listing_expiring: Joi.boolean().optional(),
  email_listing_expired: Joi.boolean().optional(),
  email_performance_report: Joi.boolean().optional(),
  push_performance_report: Joi.boolean().optional(),
  performance_report_frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'never').optional(),
});

function renderUnsubscribeResult(title, message, status = 'success') {
  const background = status === 'success' ? '#f0fdf4' : '#fff7ed';
  const border = status === 'success' ? '#bbf7d0' : '#fed7aa';
  const accent = status === 'success' ? '#15803d' : '#c2410c';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:32px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid ${border};border-radius:20px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,.08)">
    <div style="padding:28px 30px;background:${background};border-bottom:1px solid ${border}">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${accent};">Kalico</p>
      <h1 style="margin:0;font-size:26px;line-height:1.2;">${title}</h1>
    </div>
    <div style="padding:28px 30px;font-size:16px;line-height:1.7;">
      <p style="margin:0 0 16px;">${message}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">
        Vous pouvez ajuster vos préférences depuis votre compte Kalico si vous souhaitez réactiver certaines notifications.
      </p>
      <p style="margin:24px 0 0;">
        <a href="${process.env.BASE_URL || 'https://kalico.nc'}/parametres/notifications"
           style="display:inline-block;background:#0a7ea4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;">
          Gérer mes notifications
        </a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Public unsubscribe before auth middleware
router.get('/unsubscribe/:token', async (req, res, next) => {
  try {
    const prefs = await disableNotificationByToken(req.params.token);
    if (!prefs) {
      return res.status(404).send(renderUnsubscribeResult(
        'Lien expiré',
        'Le lien de désabonnement est invalide ou a déjà été utilisé.',
        'warning'
      ));
    }

    const message = prefs.email_new_message === false && prefs.email_performance_report === false
      ? 'Votre désabonnement a bien été pris en compte.'
      : 'Vos préférences ont été mises à jour.';

    return res.status(200).send(renderUnsubscribeResult(
      'Désabonnement confirmé',
      message,
      'success'
    ));
  } catch (err) {
    next(err);
  }
});

router.use(authenticate);

// ── GET /api/users/notifications ─────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(`
      SELECT id, type, title, body, href, is_read AS read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, Math.min(Number(limit), 50), Number(offset)]);

    const unread = await query(
      'SELECT COUNT(*) AS n FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );

    return res.json({
      data:   result.rows,
      unread: Number(unread.rows[0]?.n ?? 0),
    });
  } catch (err) { next(err); }
});

router.get('/preferences', async (req, res, next) => {
  try {
    const prefs = await getNotificationPreferences(req.user.id);
    return res.json({ data: prefs });
  } catch (err) {
    next(err);
  }
});

router.put('/preferences', async (req, res, next) => {
  try {
    const { error, value } = preferencesSchema.validate(req.body, {
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const prefs = await saveNotificationPreferences(req.user.id, value);
    return res.json({ data: prefs });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users/notifications/:id/read ───────────────────

router.post('/:id/read', async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── POST /api/users/notifications/read-all ───────────────────

router.post('/read-all', async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;

````

## PATH: backend/src/routes/payment.route.js
````
'use strict';

// ============================================================
//  Kalico - Routes paiement
//  Boost, abonnements Pro, webhooks Stripe et PayPlug
// ============================================================

const { Router } = require('express');
const Stripe = require('stripe');
const { authenticate } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimit');
const { query, withTransaction } = require('../config/database');
const { isConfiguredValue } = require('../config/env');
const { validate, Joi } = require('../middleware/validate');
const { sendMail, sendBoostActivatedEmail } = require('../services/emailService');
const payplug = require('../services/payplugService');
const { verifyPayPlugWebhook } = payplug;
const {
  findBoost,
  getWebPlan,
  getMobilePlan,
  XPF_PER_EUR,
  xpfToEurCents,
  formatXpfEur,
} = require('../services/paymentCatalog');
const {
  ensureStripe,
  getOrCreateStripeCustomer,
  markPaymentSucceeded,
} = require('../services/paymentHelpers');
const { ensureProReferralCode } = require('../services/referralCodeService');
const { refreshTrustScore } = require('../services/trustService');
const {
  processPayplugWebhook,
  processStripeWebhookEvent,
} = require('../services/paymentWebhookService');

const router = Router();

const stripeWebhookSecret = isConfiguredValue(process.env.STRIPE_WEBHOOK_SECRET)
  ? process.env.STRIPE_WEBHOOK_SECRET.trim()
  : '';
const payplugWebhookSecret = isConfiguredValue(process.env.PAYPLUG_WEBHOOK_SECRET)
  ? process.env.PAYPLUG_WEBHOOK_SECRET.trim()
  : '';
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const demoModeEnabled = process.env.DEMO_MODE === 'true';
const stripe = isConfiguredValue(process.env.STRIPE_SECRET_KEY)
  ? new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: '2023-10-16' })
  : null;

const boostSchema = {
  body: Joi.object({
    annonce_id: Joi.number().integer().positive().required(),
    boost_type: Joi.string().valid('une', 'urgent', 'remonte', 'photos').required(),
    boost_duration: Joi.number().integer().valid(3, 7, 14, 30).required(),
    provider: Joi.string().valid('stripe', 'payplug').default('stripe'),
  }),
};

const boostOneClickSchema = {
  body: Joi.object({
    annonce_id: Joi.number().integer().positive().required(),
    boost_type: Joi.string().valid('une', 'urgent', 'remonte', 'photos').required(),
    boost_duration: Joi.number().integer().valid(3, 7, 14, 30).required(),
    payment_method_id: Joi.string().trim().min(3).required(),
  }),
};

const subscriptionSchema = {
  body: Joi.object({
    plan_id: Joi.string().valid('pro').required(),
    billing_period: Joi.string().valid('monthly', 'yearly').required(),
    provider: Joi.string().valid('stripe', 'payplug').default('stripe'),
  }),
};

const mobilePlanSchema = {
  body: Joi.object({
    plan: Joi.string().valid('pro_mensuel', 'pro_annuel').required(),
  }),
};

async function hasExistingSubscription(userId) {
  const { rows } = await query(
    `SELECT id
     FROM subscriptions
     WHERE user_id = $1
       AND status IN ('active', 'trialing', 'payplug_active')
     LIMIT 1`,
    [userId]
  );
  return !!rows[0];
}

function getPayplugSignature(req) {
  const raw = req.headers['x-payplug-signature'] ?? req.headers['payplug-signature'];
  if (Array.isArray(raw)) return raw[0] || '';
  return typeof raw === 'string' ? raw.trim() : '';
}

function safePaymentError(provider, fallback) {
  return { error: fallback || `Erreur de paiement${provider ? ` (${provider})` : ''}` };
}

function buildDemoPaymentUrl(path, params = {}) {
  const query = new URLSearchParams();
  query.set('demo', '1');

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }

  return `${baseUrl}${path}?${query.toString()}`;
}

async function verifyStripeSubscriptionStatus(sessionId, userId) {
  if (!isConfiguredValue(process.env.STRIPE_SECRET_KEY)) {
    return { code: 503, body: { status: 'invalid', error: 'STRIPE_SECRET_KEY manquant' } };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'payment_intent'],
  });

  const { rows: pmtRows } = await query(
    'SELECT id, type, metadata FROM payments WHERE provider_ref = $1 AND user_id = $2 LIMIT 1',
    [sessionId, userId]
  );
  const payment = pmtRows[0];
  if (!payment) {
    return { code: 403, body: { status: 'invalid', error: 'Session non autorisée' } };
  }

  if (payment.metadata?.payment_type && payment.metadata.payment_type !== 'subscription') {
    return { code: 403, body: { status: 'invalid', error: 'Type de paiement non cohérent' } };
  }

  if (session.metadata?.user_id !== String(userId)) {
    return { code: 403, body: { status: 'invalid', error: 'Session non autorisée' } };
  }

  if (session.status !== 'complete') {
    return { code: 200, body: { status: 'pending' } };
  }

  const sub = session.subscription;
  if (!sub) {
    return { code: 400, body: { status: 'invalid', error: 'Abonnement manquant' } };
  }

  const isTrial = sub?.status === 'trialing';
  return {
    code: 200,
    body: {
      status: isTrial ? 'ok_trial' : 'ok_subscription',
      plan: session.metadata?.plan_id ?? null,
      trial_end: sub?.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      period_end: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      provider: 'stripe',
    },
  };
}

async function verifyPayplugSubscriptionStatus(paymentId, userId) {
  if (!payplug.isPayPlugConfigured()) {
    return { code: 503, body: { status: 'invalid', error: 'PayPlug non configuré' } };
  }

  const resource = await payplug.verifyIPN(String(paymentId), 'subscription');
  const meta = resource.metadata ?? {};
  const resourceUserId = Number(meta.user_id ?? 0);

  if (resourceUserId && resourceUserId !== Number(userId)) {
    return { code: 403, body: { status: 'invalid', error: 'Ressource non autorisée' } };
  }

  const isActive = resource.is_active ?? resource.state === 'active';
  if (!isActive) {
    return { code: 200, body: { status: 'pending' } };
  }

  const isYearly = meta.billing_period === 'yearly';
  const periodEnd = new Date();
  isYearly ? periodEnd.setFullYear(periodEnd.getFullYear() + 1) : periodEnd.setMonth(periodEnd.getMonth() + 1);

  return {
    code: 200,
    body: {
      status: 'ok_subscription',
      plan: meta.plan_id ?? null,
      period_end: periodEnd.toISOString(),
      provider: 'payplug',
    },
  };
}

async function applyBoostPayment({ annonceId, boost, provider, paymentRef, userId, metadata = {} }) {
  const expiresAt = new Date(Date.now() + Number(boost.duration || 0) * 24 * 60 * 60 * 1000);
  return withTransaction(async (client) => {
    const paymentResult = await client.query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'boost', $2, $3, $4, 'succeeded', $5)
       RETURNING id`,
      [
        userId,
        provider,
        paymentRef,
        boost.price_xpf,
        JSON.stringify({
          ...metadata,
          boost_type: boost.type,
          duration: boost.duration,
          amount_xpf: boost.price_xpf,
        }),
      ]
    );

    await client.query(
      `UPDATE annonces
       SET is_boosted = TRUE,
           boost_type = $1,
           boost_expires_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [boost.type, expiresAt.toISOString(), annonceId]
    );

    await client.query(
      `INSERT INTO annonce_boosts (annonce_id, type, expires_at, payment_id)
       VALUES ($1, $2, $3, $4)`,
      [annonceId, boost.type, expiresAt.toISOString(), paymentResult.rows[0].id]
    );

    return {
      payment_id: paymentResult.rows[0].id,
      expires_at: expiresAt.toISOString(),
    };
  });
}

router.post('/boost/mobile', authenticate, paymentLimiter, validate(boostSchema), async (req, res) => {
  const { annonce_id, boost_type, boost_duration } = req.body;

  const boost = findBoost(boost_type, boost_duration);
  if (!boost) return res.status(400).json({ error: 'Boost introuvable dans le catalogue' });

  if (demoModeEnabled) {
    return res.json({
      data: {
        client_secret: 'demo_client_secret_boost',
        customer_id: 'demo_customer',
        ephemeral_key: 'demo_ephemeral_key',
        boost,
        amount_display: formatXpfEur(boost.price_xpf),
        demo: true,
        success: true,
        message: 'Paiement simulé',
      },
    });
  }

  if (!ensureStripe(res)) return;

  const { rows: annonceRows } = await query(
    `SELECT a.id, a.titre, cat.slug AS category_slug
     FROM annonces a
     LEFT JOIN categories cat ON cat.id = a.category_id
     WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'active'`,
    [annonce_id, req.user.id]
  );
  if (!annonceRows[0]) return res.status(403).json({ error: 'Annonce introuvable ou non autorisée' });
  if ((annonceRows[0].category_slug || '').toLowerCase() === 'dons' || (annonceRows[0].category_slug || '').toLowerCase() === 'don') {
    return res.status(400).json({ error: 'Les dons ne peuvent pas être boostés.' });
  }

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email);
    const eurCents = xpfToEurCents(boost.price_xpf);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: eurCents,
      currency: 'eur',
      customer: customerId,
      payment_method_types: ['card'],
      description: `${boost.label} — ${annonceRows[0].titre}`,
      metadata: {
        payment_type: 'boost',
        user_id: String(req.user.id),
        annonce_id: String(annonce_id),
        boost_type,
        duration: String(boost_duration),
        amount_xpf: String(boost.price_xpf),
      },
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    await query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'boost', 'stripe', $2, $3, 'pending', $4)`,
      [
        req.user.id,
        paymentIntent.id,
        boost.price_xpf,
        JSON.stringify({ annonce_id, boost_type, boost_duration }),
      ]
    );

    return res.json({
      data: {
        client_secret: paymentIntent.client_secret,
        customer_id: customerId,
        ephemeral_key: ephemeralKey.secret,
        boost,
        amount_display: formatXpfEur(boost.price_xpf),
      },
    });
  } catch (err) {
    console.error('[payment] boost/mobile error:', err.message);
    return res.status(500).json({ error: 'Erreur création paiement boost mobile' });
  }
});

router.post('/boost', authenticate, paymentLimiter, validate(boostSchema), async (req, res) => {
  const { annonce_id, boost_type, boost_duration, provider } = req.body;

  if (provider === 'payplug') {
    if (demoModeEnabled) {
      return res.json({
        success: true,
        demo: true,
        provider,
        message: 'Paiement simulé',
        checkout_url: buildDemoPaymentUrl('/paiement/succes', {
          type: 'boost',
          provider,
        }),
      });
    }

    if (!payplug.isPayPlugConfigured()) {
      return res.status(503).json({ error: 'PayPlug non configuré — vérifiez PAYPLUG_SECRET_KEY' });
    }

    const boost = findBoost(boost_type, boost_duration);
    if (!boost) return res.status(400).json({ error: 'Boost introuvable' });

    const { rows: annonceRows } = await query(
      `SELECT a.id, a.titre, cat.slug AS category_slug
       FROM annonces a
       LEFT JOIN categories cat ON cat.id = a.category_id
       WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'active'`,
      [annonce_id, req.user.id]
    );
    if (!annonceRows[0]) return res.status(403).json({ error: 'Annonce introuvable ou non autorisée' });
    if ((annonceRows[0].category_slug || '').toLowerCase() === 'dons' || (annonceRows[0].category_slug || '').toLowerCase() === 'don') {
      return res.status(400).json({ error: 'Les dons ne peuvent pas être boostés.' });
    }

    try {
      const payment = await payplug.createPayment({
        amount_xpf: boost.price_xpf,
        description: `${boost.label} — ${annonceRows[0].titre}`,
        email: req.user.email,
        first_name: req.user.prenom || 'Client',
        last_name: req.user.nom || 'Kalico',
        return_url: `${baseUrl}/paiement/succes?type=boost&pp_payment_id={PAYPLUG_PAYMENT_ID}`,
        cancel_url: `${baseUrl}/paiement/annule?provider=payplug`,
        metadata: {
          payment_type: 'boost',
          user_id: String(req.user.id),
          annonce_id: String(annonce_id),
          boost_type,
          duration: String(boost_duration),
        },
      });

      await query(
        `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
         VALUES ($1, 'boost', 'payplug', $2, $3, 'pending', $4)`,
        [
          req.user.id,
          payment.id,
          boost.price_xpf,
          JSON.stringify({ annonce_id, boost_type, boost_duration }),
        ]
      );

      return res.json({ checkout_url: payment.hosted_payment.payment_url });
    } catch (err) {
      console.error('[payment] boost PayPlug error:', err.message);
      return res.status(500).json(safePaymentError('payplug', 'Impossible de finaliser le paiement PayPlug pour ce boost'));
    }
  }

  if (demoModeEnabled) {
    return res.json({
      success: true,
      demo: true,
      provider: 'stripe',
      message: 'Paiement simulé',
      checkout_url: buildDemoPaymentUrl('/paiement/succes', {
        type: 'boost',
        provider: 'stripe',
      }),
    });
  }

  if (!ensureStripe(res)) return;

  const boost = findBoost(boost_type, boost_duration);
  if (!boost) return res.status(400).json({ error: 'Boost introuvable' });

  const { rows: annonceRows } = await query(
    `SELECT a.id, a.titre, cat.slug AS category_slug
     FROM annonces a
     LEFT JOIN categories cat ON cat.id = a.category_id
     WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'active'`,
    [annonce_id, req.user.id]
  );
  if (!annonceRows[0]) return res.status(403).json({ error: 'Annonce introuvable ou non autorisée' });
  if ((annonceRows[0].category_slug || '').toLowerCase() === 'dons' || (annonceRows[0].category_slug || '').toLowerCase() === 'don') {
    return res.status(400).json({ error: 'Les dons ne peuvent pas être boostés.' });
  }

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      success_url: `${baseUrl}/paiement/succes?session_id={CHECKOUT_SESSION_ID}&type=boost`,
      cancel_url: `${baseUrl}/paiement/annule`,
      metadata: {
        payment_type: 'boost',
        user_id: String(req.user.id),
        annonce_id: String(annonce_id),
        boost_type,
        duration: String(boost_duration),
        amount_xpf: String(boost.price_xpf),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: xpfToEurCents(boost.price_xpf),
            product_data: {
              name: `${boost.label} — ${formatXpfEur(boost.price_xpf)}`,
              description: annonceRows[0].titre,
            },
          },
        },
      ],
    });

    await query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'boost', 'stripe', $2, $3, 'pending', $4)`,
      [
        req.user.id,
        session.id,
        boost.price_xpf,
        JSON.stringify({ annonce_id, boost_type, boost_duration }),
      ]
    );

    return res.json({ checkout_url: session.url });
  } catch (err) {
    console.error('[payment] boost error:', err.message);
    return res.status(500).json({ error: 'Erreur création boost' });
  }
});

router.get('/saved-cards', authenticate, async (req, res) => {
  if (demoModeEnabled) {
    return res.json({
      data: [
        {
          id: 'demo_card_1',
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2030,
          funding: 'credit',
          holder_name: req.user.prenom || req.user.email || 'Client',
        },
      ],
    });
  }

  if (!ensureStripe(res)) return;

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email);
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 20,
    });

    return res.json({
      data: paymentMethods.data.map((method) => ({
        id: method.id,
        brand: method.card?.brand || 'card',
        last4: method.card?.last4 || '----',
        exp_month: method.card?.exp_month ?? null,
        exp_year: method.card?.exp_year ?? null,
        funding: method.card?.funding ?? null,
        holder_name: method.billing_details?.name ?? req.user.prenom ?? req.user.email ?? null,
      })),
    });
  } catch (err) {
    console.error('[payment] saved cards error:', err.message);
    return res.status(500).json({ error: 'Impossible de charger les cartes enregistrées' });
  }
});

router.post('/boost-one-click', authenticate, paymentLimiter, validate(boostOneClickSchema), async (req, res) => {
  if (!ensureStripe(res)) return;

  const { annonce_id, boost_type, boost_duration, payment_method_id } = req.body;
  const boost = findBoost(boost_type, boost_duration);
  if (!boost) return res.status(400).json({ error: 'Boost introuvable' });

  const { rows: annonceRows } = await query(
    `SELECT a.id, a.titre, cat.slug AS category_slug
     FROM annonces a
     LEFT JOIN categories cat ON cat.id = a.category_id
     WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'active'`,
    [annonce_id, req.user.id]
  );
  if (!annonceRows[0]) return res.status(403).json({ error: 'Annonce introuvable ou non autorisée' });
  if ((annonceRows[0].category_slug || '').toLowerCase() === 'dons' || (annonceRows[0].category_slug || '').toLowerCase() === 'don') {
    return res.status(400).json({ error: 'Les dons ne peuvent pas être boostés.' });
  }

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: xpfToEurCents(boost.price_xpf),
      currency: 'eur',
      customer: customerId,
      payment_method: payment_method_id,
      confirm: true,
      off_session: true,
      description: `${boost.label} — ${annonceRows[0].titre}`,
      metadata: {
        payment_type: 'boost',
        user_id: String(req.user.id),
        annonce_id: String(annonce_id),
        boost_type,
        duration: String(boost_duration),
        amount_xpf: String(boost.price_xpf),
        payment_mode: 'one_click',
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({
        error: 'Validation bancaire requise pour cette carte.',
        requires_action: true,
        client_secret: paymentIntent.client_secret || null,
        payment_intent_id: paymentIntent.id,
      });
    }

    const activation = await applyBoostPayment({
      annonceId: annonce_id,
      boost,
      provider: 'stripe',
      paymentRef: paymentIntent.id,
      userId: req.user.id,
      metadata: {
        payment_mode: 'one_click',
        payment_method_id,
      },
    });

    return res.json({
      data: {
        boost,
        payment_intent_id: paymentIntent.id,
        payment_id: activation.payment_id,
        expires_at: activation.expires_at,
        amount_display: formatXpfEur(boost.price_xpf),
      },
    });
  } catch (err) {
    const code = err?.code || err?.type;
    if (code === 'StripeCardError' || code === 'card_error' || err?.decline_code) {
      return res.status(402).json({
        error: err.message || 'Carte refusée.',
        requires_action: Boolean(err.payment_intent?.client_secret),
        client_secret: err.payment_intent?.client_secret || null,
      });
    }
    console.error('[payment] boost one-click error:', err.message);
    return res.status(500).json({ error: 'Impossible de lancer le boost en un clic' });
  }
});

router.post('/subscription', authenticate, paymentLimiter, validate(subscriptionSchema), async (req, res) => {
  const { plan_id, billing_period, provider } = req.body;

  if (provider === 'payplug') {
    if (demoModeEnabled) {
      return res.json({
        success: true,
        demo: true,
        provider,
        message: 'Paiement simulé',
        checkout_url: buildDemoPaymentUrl('/abonnement/confirmation', {
          payment_id: 'demo_payplug_subscription',
          provider,
          type: 'subscription',
        }),
      });
    }

    if (!payplug.isPayPlugConfigured()) {
      return res.status(503).json({ error: 'PayPlug non configuré — vérifiez PAYPLUG_SECRET_KEY' });
    }

    const planSlug = `${plan_id}_${billing_period === 'yearly' ? 'annuel' : 'mensuel'}`;
    const planConfig = payplug.PAYPLUG_SUBSCRIPTION_PLANS[planSlug];
    if (!planConfig) return res.status(400).json({ error: 'Plan PayPlug introuvable' });

    if (await hasExistingSubscription(req.user.id)) {
      return res.status(409).json({ error: 'Abonnement déjà actif' });
    }

    try {
      const subscription = await payplug.createSubscription({
        plan: planSlug,
        email: req.user.email,
        first_name: req.user.prenom || 'Client',
        last_name: req.user.nom || 'Kalico',
        return_url: `${baseUrl}/abonnement/confirmation?payment_id={PAYPLUG_SUBSCRIPTION_ID}&provider=payplug`,
        cancel_url: `${baseUrl}/paiement/annule?provider=payplug`,
        metadata: {
          payment_type: 'subscription',
          user_id: String(req.user.id),
          plan_id,
          billing_period,
        },
      });

      await query(
        `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
         VALUES ($1, 'subscription', 'payplug', $2, $3, 'pending', $4)`,
        [
          req.user.id,
          subscription.id,
          Math.round((planConfig.amount_cents / 100) * payplug.XPF_PER_EUR),
          JSON.stringify({ plan_id, billing_period }),
        ]
      );

      return res.json({ checkout_url: subscription.hosted_payment.payment_url });
    } catch (err) {
      console.error('[payment] subscription PayPlug error:', err.message);
      return res.status(500).json(safePaymentError('payplug', 'Impossible de finaliser l’abonnement PayPlug'));
    }
  }

  if (demoModeEnabled) {
    return res.json({
      success: true,
      demo: true,
      provider: 'stripe',
      message: 'Paiement simulé',
      checkout_url: buildDemoPaymentUrl('/abonnement/confirmation', {
        session_id: 'demo_stripe_subscription',
        provider: 'stripe',
        type: 'subscription',
      }),
    });
  }

  if (!ensureStripe(res)) return;

  const plan = getWebPlan(plan_id, billing_period);
  if (!plan) return res.status(400).json({ error: 'Plan introuvable' });
  if (!plan.stripe_price_id) return res.status(500).json({ error: 'Price Stripe non configuré pour ce plan' });

  if (await hasExistingSubscription(req.user.id)) {
    return res.status(409).json({ error: 'Abonnement déjà actif' });
  }

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: `${baseUrl}/abonnement/confirmation?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url: `${baseUrl}/paiement/annule`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { plan_id, billing_period, user_id: String(req.user.id) },
      },
      metadata: {
        payment_type: 'subscription',
        user_id: String(req.user.id),
        plan_id,
        billing_period,
        amount_xpf: String(plan.amount_xpf),
      },
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    });

    await query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'subscription', 'stripe', $2, $3, 'pending', $4)`,
      [req.user.id, session.id, plan.amount_xpf, JSON.stringify({ plan_id, billing_period })]
    );

    return res.json({ checkout_url: session.url });
  } catch (err) {
    console.error('[payment] subscription error:', err.message);
    return res.status(500).json({ error: 'Erreur création abonnement' });
  }
});

router.post('/subscribe', authenticate, paymentLimiter, validate(subscriptionSchema), async (req, res, next) => {
  req.url = '/subscription';
  return router.handle(req, res, next);
});

router.post('/subscribe/mobile', authenticate, paymentLimiter, validate(mobilePlanSchema), async (req, res) => {
  const { plan } = req.body;

  const planConfig = getMobilePlan(plan);
  if (!planConfig) return res.status(400).json({ error: 'Plan invalide' });
  if (!planConfig.price_id.startsWith('price_')) {
    return res.status(500).json({ error: "Price ID Stripe non configuré — vérifiez les variables d'environnement" });
  }

  if (demoModeEnabled) {
    return res.json({
      data: {
        client_secret: 'demo_client_secret_subscription',
        customer_id: 'demo_customer',
        ephemeral_key: 'demo_ephemeral_key',
        subscription_id: `demo_subscription_${plan}`,
        status: 'active',
        trial_end: null,
        plan,
        amount_display: formatXpfEur(planConfig.amount_xpf),
        demo: true,
        success: true,
        message: 'Paiement simulé',
      },
    });
  }

  if (!ensureStripe(res)) return;

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, req.user.id, req.user.email);

    if (await hasExistingSubscription(req.user.id)) {
      return res.status(409).json({ error: 'Vous avez déjà un abonnement actif' });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: planConfig.price_id }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        plan,
        user_id: String(req.user.id),
        amount_xpf: String(planConfig.amount_xpf),
      },
    });

    const paymentIntent = subscription.latest_invoice?.payment_intent;
    const setupIntent = !paymentIntent
      ? await stripe.setupIntents.create({
          customer: customerId,
          payment_method_types: ['card'],
          usage: 'off_session',
          metadata: { subscription_id: subscription.id, plan, user_id: String(req.user.id) },
        })
      : null;

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    await query(
      `INSERT INTO subscriptions
         (user_id, plan_id, billing_period, provider, provider_sub_id, payment_provider, status,
          current_period_start, current_period_end, cancel_at_period_end)
       VALUES ($1, $2, $3, 'stripe', $4, 'stripe', $5, NOW(), NOW() + INTERVAL '14 days', FALSE)
       ON CONFLICT (provider_sub_id) DO NOTHING`,
      [
        req.user.id,
        'pro',
        plan.includes('annuel') ? 'yearly' : 'monthly',
        subscription.id,
        subscription.status === 'trialing' ? 'trialing' : 'active',
      ]
    );

    await query(
      `UPDATE users SET is_pro = TRUE, pro_plan = $2, updated_at = NOW() WHERE id = $1`,
      [req.user.id, 'pro']
    );
    await ensureProReferralCode(query, req.user.id).catch(() => {});
    await refreshTrustScore(req.user.id).catch(() => {});

    return res.json({
      data: {
        client_secret: paymentIntent?.client_secret ?? setupIntent?.client_secret,
        customer_id: customerId,
        ephemeral_key: ephemeralKey.secret,
        subscription_id: subscription.id,
        status: subscription.status,
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        plan,
        amount_display: formatXpfEur(planConfig.amount_xpf),
      },
    });
  } catch (err) {
    console.error('[payment] subscribe/mobile error:', err.message);
    return res.status(500).json({ error: 'Erreur création abonnement mobile' });
  }
});

router.post('/cancel', authenticate, paymentLimiter, async (req, res) => {
  if (!ensureStripe(res)) return;

  try {
    const { rows } = await query('SELECT stripe_customer_id, email, prenom FROM users WHERE id = $1', [req.user.id]);
    const { stripe_customer_id, email, prenom } = rows[0] ?? {};
    if (!stripe_customer_id) return res.status(404).json({ error: 'Aucun abonnement actif' });

    const { data: subs } = await stripe.subscriptions.list({ customer: stripe_customer_id, status: 'active', limit: 1 });
    if (!subs.length) {
      const { data: trials } = await stripe.subscriptions.list({ customer: stripe_customer_id, status: 'trialing', limit: 1 });
      if (!trials.length) return res.status(404).json({ error: 'Aucun abonnement actif ou en essai' });
      subs.push(trials[0]);
    }

    const sub = subs[0];
    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });

    const periodEnd = new Date(sub.current_period_end * 1000);
    const periodEndStr = periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    await sendMail({
      to: email,
      subject: "[Kalico] Confirmation d'annulation de votre abonnement Pro",
      html: `<p>Bonjour ${prenom},</p>
             <p>Votre annulation a bien été prise en compte.</p>
             <p>Votre abonnement Pro reste actif jusqu'au <strong>${periodEndStr}</strong>.<br>
             Vous conservez tous vos avantages Pro jusqu'à cette date.</p>
             <p>Vous pouvez à tout moment réactiver votre abonnement depuis votre espace.</p>`,
    }).catch(() => {});

    await query(
      `UPDATE subscriptions SET cancel_at_period_end = TRUE, updated_at = NOW()
       WHERE user_id = $1 AND status IN ('active','trialing')`,
      [req.user.id]
    );

    return res.json({
      ok: true,
      cancel_at: periodEnd.toISOString(),
      cancel_at_label: periodEndStr,
      message: `Abonnement annulé — actif jusqu'au ${periodEndStr}`,
    });
  } catch (err) {
    console.error('[payment] cancel error:', err.message);
    return res.status(500).json({ error: "Erreur lors de l'annulation" });
  }
});

router.get('/my-subscription', authenticate, paymentLimiter, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, u.is_pro, u.pro_plan
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC LIMIT 1`,
      [req.user.id]
    );
    return res.json({ data: rows[0] ?? null });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération abonnement' });
  }
});

router.get('/invoices', authenticate, paymentLimiter, async (req, res) => {
  if (!ensureStripe(res)) return;
  try {
    const { rows } = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user.id]);
    const customerId = rows[0]?.stripe_customer_id;
    if (!customerId) return res.json({ data: [] });

    const { data: invoices } = await stripe.invoices.list({
      customer: customerId,
      limit: 24,
      expand: ['data.payment_intent'],
    });

    await Promise.all(invoices.map(async (inv) => {
      const amountXpf = Math.round((inv.amount_paid / 100) * XPF_PER_EUR);
      await query(
        `INSERT INTO billing_documents
           (user_id, provider, provider_ref, document_type, status, amount_eur_cents, amount_xpf,
            currency, pdf_url, hosted_url, payload, updated_at)
         VALUES ($1, 'stripe', $2, 'invoice', $3, $4, $5, $6, $7, $8, $9::jsonb, NOW())
         ON CONFLICT (provider, provider_ref, document_type)
         DO UPDATE SET
           status = EXCLUDED.status,
           amount_eur_cents = EXCLUDED.amount_eur_cents,
           amount_xpf = EXCLUDED.amount_xpf,
           currency = EXCLUDED.currency,
           pdf_url = EXCLUDED.pdf_url,
           hosted_url = EXCLUDED.hosted_url,
           payload = EXCLUDED.payload,
           updated_at = NOW()`,
        [
          req.user.id,
          inv.id,
          inv.status,
          inv.amount_paid,
          amountXpf,
          inv.currency?.toUpperCase?.() ?? 'EUR',
          inv.invoice_pdf ?? null,
          inv.hosted_invoice_url ?? null,
          JSON.stringify(inv),
        ]
      );
    }));

    return res.json({
      data: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        date: new Date(inv.created * 1000).toISOString(),
        amount_eur: (inv.amount_paid / 100).toFixed(2),
        amount_xpf: Math.round((inv.amount_paid / 100) * XPF_PER_EUR),
        status: inv.status,
        pdf_url: inv.invoice_pdf,
        hosted_url: inv.hosted_invoice_url,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération factures' });
  }
});

router.get('/billing-documents', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         id,
         provider,
         provider_ref,
         document_type,
         status,
         amount_eur_cents,
         amount_xpf,
         currency,
         pdf_url,
         hosted_url,
         payload,
         created_at
       FROM billing_documents
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 24`,
      [req.user.id]
    );

    return res.json({
      data: rows.map((doc) => ({
        id: doc.id,
        provider: doc.provider,
        provider_ref: doc.provider_ref,
        document_type: doc.document_type,
        status: doc.status,
        amount_eur: doc.amount_eur_cents != null ? (Number(doc.amount_eur_cents) / 100).toFixed(2) : null,
        amount_xpf: doc.amount_xpf,
        currency: doc.currency,
        pdf_url: doc.pdf_url,
        hosted_url: doc.hosted_url,
        date: doc.created_at,
        payload: doc.payload,
      })),
    });
  } catch (err) {
    console.error('[payment] billing-documents error:', err.message);
    return res.status(500).json({ error: 'Erreur récupération historique de facturation' });
  }
});

router.get('/subscriptions/verify', authenticate, paymentLimiter, async (req, res) => {
  const { session_id: sessionId, payment_id: paymentId } = req.query;

  try {
    if (demoModeEnabled) {
      return res.json({
        status: 'ok_subscription',
        plan: req.query.plan_id ?? 'pro',
        trial_end: null,
        period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        provider: (req.query.provider ?? 'stripe'),
        demo: true,
      });
    }

    if (sessionId && typeof sessionId === 'string') {
      const result = await verifyStripeSubscriptionStatus(sessionId, req.user.id);
      return res.status(result.code).json(result.body);
    }

    if (paymentId && typeof paymentId === 'string') {
      const result = await verifyPayplugSubscriptionStatus(paymentId, req.user.id);
      return res.status(result.code).json(result.body);
    }

    return res.status(400).json({ status: 'invalid', error: 'Paramètre de paiement manquant' });
  } catch (err) {
    if (err?.code === 'PAYPLUG_NOT_CONFIGURED') {
      return res.status(503).json({ status: 'invalid', error: 'PayPlug non configuré' });
    }
    console.error('[payment] subscriptions verify error:', err.message);
    return res.status(200).json({ status: 'invalid', error: 'Vérification indisponible' });
  }
});

router.get('/verify-session', authenticate, paymentLimiter, async (req, res) => {
  if (!ensureStripe(res)) return;
  const { session_id, type } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ status: 'invalid', error: 'session_id manquant' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'payment_intent'],
    });

    const { rows: pmtRows } = await query(
      'SELECT id, type, metadata FROM payments WHERE provider_ref = $1 AND user_id = $2 LIMIT 1',
      [session_id, req.user.id]
    );
    const payment = pmtRows[0];
    if (!payment) {
      return res.status(403).json({ status: 'invalid', error: 'Session non autorisée' });
    }

    if (payment.metadata?.payment_type && payment.metadata.payment_type !== type) {
      return res.status(403).json({ status: 'invalid', error: 'Type de paiement non cohérent' });
    }

    if (session.metadata?.user_id !== String(req.user.id)) {
      return res.status(403).json({ status: 'invalid', error: 'Session non autorisée' });
    }

    if (session.status !== 'complete') {
      return res.json({ status: 'pending' });
    }

    if (type === 'boost') {
      const annonceId = session.metadata?.annonce_id;
      if (!annonceId) {
        return res.status(400).json({ status: 'invalid', error: 'Annonce manquante' });
      }
      const boost = annonceId ? await query('SELECT titre, boost_type, boost_expires_at FROM annonces WHERE id = $1', [annonceId]) : { rows: [{}] };
      const boost_days = session.metadata?.duration ? Number(session.metadata.duration) : null;

      return res.json({
        status: 'ok_boost',
        annonce_id: annonceId,
        annonce_titre: boost.rows[0]?.titre ?? null,
        boost_type: session.metadata?.boost_type ?? null,
        boost_days,
      });
    }

    if (type === 'subscription') {
      const sub = session.subscription;
      if (!sub) {
        return res.status(400).json({ status: 'invalid', error: 'Abonnement manquant' });
      }
      const isTrial = sub?.status === 'trialing';
      return res.json({
        status: isTrial ? 'ok_trial' : 'ok_subscription',
        plan: session.metadata?.plan_id ?? null,
        trial_end: sub?.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        period_end: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      });
    }

    return res.json({ status: 'ok_boost' });
  } catch (err) {
    console.error('[payment] verify-session error:', err.message);
    return res.status(200).json({ status: 'invalid', error: 'Vérification indisponible' });
  }
});

router.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!stripeWebhookSecret) return res.status(503).json({ error: 'STRIPE_WEBHOOK_SECRET manquant' });
  if (!sig || !req.rawBody) return res.status(400).json({ error: 'Signature webhook Stripe manquante' });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret);
  } catch (err) {
    console.error('[webhook] Signature invalide:', err.message);
    return res.status(400).json({ error: 'Signature invalide' });
  }

  try {
    const { rows } = await query(
      `INSERT INTO webhook_events (event_id, provider, type, processed_at)
       VALUES ($1, 'stripe', $2, NOW())
       ON CONFLICT (event_id) DO NOTHING RETURNING id`,
      [event.id, event.type]
    );
    if (!rows[0]) return res.json({ received: true, duplicate: true });
  } catch (err) {
    console.error('[webhook] Erreur idempotence:', err.message);
  }

  try {
    await processStripeWebhookEvent({
      event,
      stripe,
      query,
      withTransaction,
      sendMail,
      sendBoostActivatedEmail,
      getWebPlan,
      markPaymentSucceeded,
      formatXpfEur,
      XPF_PER_EUR,
      baseUrl,
    });
    return res.json({ received: true });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentType = session.metadata?.payment_type;
      const userId = Number(session.metadata?.user_id ?? 0);

      await markPaymentSucceeded(session.id);

      if (paymentType === 'boost') {
        const annonceId = Number(session.metadata?.annonce_id ?? 0);
        const boostType = session.metadata?.boost_type;
        const duration = Number(session.metadata?.duration ?? 0);
        if (annonceId && boostType && duration) {
          const expiresAt = new Date(Date.now() + duration * 86400_000);
          await query(
            `UPDATE annonces SET is_boosted = TRUE, boost_type = $1, boost_expires_at = $2, updated_at = NOW() WHERE id = $3`,
            [boostType, expiresAt, annonceId]
          );
          const { rows: pmtRows } = await query(`SELECT id FROM payments WHERE provider_ref = $1 LIMIT 1`, [session.id]);
          if (pmtRows[0]) {
            await query(
              `INSERT INTO annonce_boosts (annonce_id, type, expires_at, payment_id)
               VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
              [annonceId, boostType, expiresAt, pmtRows[0].id]
            ).catch(() => {});
          }
        }
      }

      if (paymentType === 'subscription') {
        const planId = session.metadata?.plan_id;
        const billingPeriod = session.metadata?.billing_period;
        const subId = session.subscription;

        if (userId && planId && subId) {
          const stripeSub = await stripe.subscriptions.retrieve(subId);
          const periodStart = new Date(stripeSub.current_period_start * 1000);
          const periodEnd = new Date(stripeSub.current_period_end * 1000);

          await withTransaction(async (client) => {
            await client.query(
              `INSERT INTO subscriptions
                 (user_id, plan_id, billing_period, provider, provider_sub_id, status,
                  current_period_start, current_period_end, cancel_at_period_end)
               VALUES ($1, $2, $3, 'stripe', $4, $5, $6, $7, FALSE)
               ON CONFLICT (provider_sub_id)
               DO UPDATE SET
                 status               = EXCLUDED.status,
                 current_period_start = EXCLUDED.current_period_start,
                 current_period_end   = EXCLUDED.current_period_end,
                 updated_at           = NOW()`,
              [userId, planId, billingPeriod, subId, stripeSub.status, periodStart, periodEnd]
            );

            await client.query(
              `UPDATE users SET is_pro = TRUE, pro_plan = $2, pro_expires_at = $3, updated_at = NOW() WHERE id = $1`,
              [userId, planId, periodEnd]
            );
            await ensureProReferralCode(client, userId).catch(() => {});
            await refreshTrustScore(userId).catch(() => {});
            await client.query(
              `UPDATE payments SET metadata = metadata || $2::jsonb, updated_at = NOW() WHERE provider_ref = $1`,
              [session.id, JSON.stringify({ provider_sub_id: subId })]
            );
          });

          const { rows: userRows } = await query('SELECT email, prenom FROM users WHERE id = $1', [userId]);
          if (userRows[0]) {
            const planLabel = 'Pro';
            const periodLabel = billingPeriod === 'yearly' ? 'annuel' : 'mensuel';
            const amountXpf = getWebPlan(planId, billingPeriod)?.amount_xpf ?? 0;
            await sendMail({
              to: userRows[0].email,
              subject: `[Kalico] Votre abonnement ${planLabel} est activé !`,
              html: `<p>Bonjour ${userRows[0].prenom},</p>
                     <p>Votre abonnement <strong>Kalico ${planLabel} ${periodLabel}</strong> est maintenant actif.</p>
                     <p>Montant : <strong>${formatXpfEur(amountXpf)}</strong></p>
                     <p>Prochain renouvellement : ${periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                     <p>Gérez votre abonnement depuis <a href="${baseUrl}/parametres">vos paramètres</a>.</p>`,
            }).catch(() => {});
          }
        }
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const subId = sub.id;

      const periodStart = new Date(sub.current_period_start * 1000);
      const periodEnd = new Date(sub.current_period_end * 1000);

      await query(
        `UPDATE subscriptions
         SET status = $2, current_period_start = $3, current_period_end = $4,
             cancel_at_period_end = $5, updated_at = NOW()
         WHERE provider_sub_id = $1`,
        [subId, sub.status, periodStart, periodEnd, sub.cancel_at_period_end]
      );

      if (sub.status === 'active') {
        const activeUserRes = await query(
          `SELECT user_id
           FROM subscriptions
           WHERE provider_sub_id = $1
           LIMIT 1`,
          [subId]
        );
        await query(
          `UPDATE users SET is_pro = TRUE, pro_expires_at = $2, updated_at = NOW()
           WHERE id = (SELECT user_id FROM subscriptions WHERE provider_sub_id = $1 LIMIT 1)`,
          [subId, periodEnd]
        );
        if (activeUserRes.rows[0]?.user_id) {
          await ensureProReferralCode(query, activeUserRes.rows[0].user_id).catch(() => {});
          await refreshTrustScore(activeUserRes.rows[0].user_id).catch(() => {});
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subId = event.data.object.id;
      const { rows } = await query(
        `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
         WHERE provider_sub_id = $1 RETURNING user_id`,
        [subId]
      );
      if (rows[0]) {
        await query(
          `UPDATE users SET is_pro = FALSE, pro_plan = NULL, pro_expires_at = NULL, updated_at = NOW()
           WHERE id = $1`,
          [rows[0].user_id]
        );
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const inv = event.data.object;
      const subId = inv.subscription;
      if (subId && inv.billing_reason === 'subscription_cycle') {
        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const periodEnd = new Date(stripeSub.current_period_end * 1000);
        await query(
          `UPDATE subscriptions SET current_period_end = $2, updated_at = NOW() WHERE provider_sub_id = $1`,
          [subId, periodEnd]
        );
        await query(
          `UPDATE users SET pro_expires_at = $2, updated_at = NOW()
           WHERE id = (SELECT user_id FROM subscriptions WHERE provider_sub_id = $1 LIMIT 1)`,
          [subId, periodEnd]
        );
        const { rows: userRows } = await query(
          `SELECT u.email, u.prenom FROM users u
           JOIN subscriptions s ON s.user_id = u.id
           WHERE s.provider_sub_id = $1 LIMIT 1`,
          [subId]
        );
        if (userRows[0]) {
          const amountEur = (inv.amount_paid / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
          const amountXpf = Math.round((inv.amount_paid / 100) * XPF_PER_EUR).toLocaleString('fr-FR');
          await sendMail({
            to: userRows[0].email,
            subject: '[Kalico] Renouvellement de votre abonnement Pro confirmé',
            html: `<p>Bonjour ${userRows[0].prenom},</p>
                   <p>Votre abonnement Kalico Pro a été renouvelé avec succès.</p>
                   <p>Montant débité : <strong>${amountXpf} XPF (${amountEur} €)</strong></p>
                   <p>Prochain renouvellement : ${periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                   <p><a href="${baseUrl}/parametres#factures">Télécharger la facture</a></p>`,
          }).catch(() => {});
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const subId = event.data.object.subscription;
      if (subId) {
        await query(
          `UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE provider_sub_id = $1`,
          [subId]
        );
        const { rows } = await query(
          `SELECT u.email, u.prenom FROM users u
           JOIN subscriptions s ON s.user_id = u.id
           WHERE s.provider_sub_id = $1 LIMIT 1`,
          [subId]
        );
        if (rows[0]) {
          await sendMail({
            to: rows[0].email,
            subject: '[Kalico] Échec du renouvellement de votre abonnement',
            html: `<p>Bonjour ${rows[0].prenom},</p>
                   <p>Le renouvellement de votre abonnement Kalico Pro a échoué.</p>
                   <p>Veuillez mettre à jour votre moyen de paiement depuis <a href="${baseUrl}/parametres">vos paramètres</a> pour ne pas perdre vos avantages Pro.</p>`,
          }).catch(() => {});
        }
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[webhook] Erreur traitement:', err.message);
    return res.status(500).json({ error: 'Erreur traitement webhook' });
  }
});

router.get('/verify-payplug', authenticate, paymentLimiter, async (req, res) => {
  const { id, type, resource_type = 'payment' } = req.query;
  if (!id) return res.status(400).json({ status: 'invalid', error: 'id manquant' });

  try {
    if (demoModeEnabled) {
      if (resource_type === 'payment') {
        return res.json({
          status: 'ok_boost',
          annonce_id: req.query.annonce_id ?? null,
          annonce_titre: null,
          boost_type: req.query.boost_type ?? null,
          boost_days: req.query.duration ? Number(req.query.duration) : null,
          provider: 'payplug',
          demo: true,
        });
      }

      return res.json({
        status: 'ok_subscription',
        plan: req.query.plan_id ?? null,
        period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        provider: 'payplug',
        demo: true,
      });
    }

    if (!payplug.isPayPlugConfigured()) {
      return res.status(503).json({ error: 'PayPlug non configuré' });
    }

    const resource = await payplug.verifyIPN(String(id), String(resource_type));

    const meta = resource.metadata ?? {};
    const userId = Number(meta.user_id ?? 0);
    if (userId && userId !== req.user.id) {
      return res.status(403).json({ status: 'invalid', error: 'Ressource non autorisée' });
    }

    if (resource_type === 'payment') {
      if (!resource.is_paid) return res.json({ status: 'pending' });

      const annonceId = meta.annonce_id;
      let annonceTitre = null;
      if (annonceId) {
        const { rows } = await query(
          'SELECT titre, boost_type, boost_expires_at FROM annonces WHERE id = $1',
          [annonceId]
        );
        annonceTitre = rows[0]?.titre ?? null;
      }

      return res.json({
        status: 'ok_boost',
        annonce_id: annonceId,
        annonce_titre: annonceTitre,
        boost_type: meta.boost_type ?? null,
        boost_days: meta.duration ? Number(meta.duration) : null,
        provider: 'payplug',
      });
    }

    if (resource_type === 'subscription') {
      const isActive = resource.is_active ?? resource.state === 'active';
      if (!isActive) return res.json({ status: 'pending' });

      const isYearly = meta.billing_period === 'yearly';
      const periodEnd = new Date();
      isYearly ? periodEnd.setFullYear(periodEnd.getFullYear() + 1) : periodEnd.setMonth(periodEnd.getMonth() + 1);

      return res.json({
        status: 'ok_subscription',
        plan: meta.plan_id,
        period_end: periodEnd.toISOString(),
        provider: 'payplug',
      });
    }

    return res.json({ status: 'invalid' });
  } catch (err) {
    console.error('[payment] verify-payplug error:', err.message);
    return res.status(200).json({ status: 'pending' });
  }
});

router.post('/webhooks/payplug', async (req, res) => {
  const resourceId = req.body?.id;
  const resourceType = req.body?.object ?? 'payment';
  const signature = getPayplugSignature(req);

  if (!payplugWebhookSecret) {
    return res.status(503).json({ error: 'PAYPLUG_WEBHOOK_SECRET manquant' });
  }
  if (!resourceId) {
    return res.status(400).json({ error: 'Payload IPN invalide' });
  }
  if (!verifyPayPlugWebhook(req.rawBody, signature)) {
    return res.status(401).json({ error: 'Signature webhook PayPlug invalide' });
  }

  try {
    const { rows } = await query(
      `INSERT INTO webhook_events (event_id, provider, type, processed_at)
       VALUES ($1, 'payplug', $2, NOW())
       ON CONFLICT (event_id) DO NOTHING RETURNING id`,
      [String(resourceId), resourceType]
    );
    if (!rows[0]) return res.json({ received: true, duplicate: true });
  } catch (err) {
    console.error('[webhook/payplug] idempotence error:', err.message);
  }

  try {
    const resource = await processPayplugWebhook({
      resourceId,
      resourceType,
      payplug,
      query,
      withTransaction,
      sendMail,
      sendBoostActivatedEmail,
      baseUrl,
    });
    if (resourceType === 'payment' && resource.is_paid) {
      return res.json({ received: true });
    }
    if (resourceType === 'subscription') {
      return res.json({ received: true });
    }

    if (false) {
    const resource = await payplug.verifyIPN(resourceId, resourceType);

    if (resourceType === 'payment' && resource.is_paid) {
      const meta = resource.metadata ?? {};
      const userId = Number(meta.user_id ?? 0);

      await query(
        `UPDATE payments SET status = 'succeeded', updated_at = NOW()
         WHERE provider_ref = $1 AND status = 'pending'`,
        [resourceId]
      );

      if (meta.payment_type === 'boost' && meta.annonce_id) {
        const annonceId = Number(meta.annonce_id);
        const boostType = meta.boost_type;
        const duration = Number(meta.duration ?? 7);
        const expiresAt = new Date(Date.now() + duration * 86400_000);

        await query(
          `UPDATE annonces SET is_boosted = TRUE, boost_type = $1, boost_expires_at = $2, updated_at = NOW()
           WHERE id = $3`,
          [boostType, expiresAt, annonceId]
        );

        await query(
          `INSERT INTO annonce_boosts (annonce_id, type, expires_at, payment_provider)
           VALUES ($1, $2, $3, 'payplug') ON CONFLICT DO NOTHING`,
          [annonceId, boostType, expiresAt]
        ).catch(() => {});

        console.log(`[webhook/payplug] Boost activé - annonce ${annonceId} (${boostType} ${duration}j)`);
      }
    }

    if (resourceType === 'subscription') {
      const meta = resource.metadata ?? {};
      const userId = Number(meta.user_id ?? 0);
      const planId = meta.plan_id;
      const period = meta.billing_period;

      const isActive = resource.is_active ?? resource.state === 'active';

      if (isActive && userId && planId) {
        const now = new Date();
        const isYearly = period === 'yearly';
        const periodEnd = new Date(now);
        isYearly ? periodEnd.setFullYear(periodEnd.getFullYear() + 1) : periodEnd.setMonth(periodEnd.getMonth() + 1);

        await withTransaction(async (client) => {
          await client.query(
            `INSERT INTO subscriptions
               (user_id, plan_id, billing_period, provider, provider_sub_id, payment_provider, status,
                current_period_start, current_period_end, cancel_at_period_end)
             VALUES ($1, $2, $3, 'payplug', $4, 'payplug', 'active', NOW(), $5, FALSE)
             ON CONFLICT (provider_sub_id)
             DO UPDATE SET status = 'active', current_period_end = $5, payment_provider = EXCLUDED.payment_provider, updated_at = NOW()`,
            [userId, planId, period, resourceId, periodEnd]
          );

          await client.query(
            `UPDATE users SET is_pro = TRUE, pro_plan = $2, pro_expires_at = $3, updated_at = NOW()
             WHERE id = $1`,
            [userId, planId, periodEnd]
          );
          await ensureProReferralCode(client, userId).catch(() => {});
          await refreshTrustScore(userId).catch(() => {});

          await client.query(
            `UPDATE payments SET status = 'succeeded', updated_at = NOW()
             WHERE provider_ref = $1 AND status = 'pending'`,
            [resourceId]
          );
        });

        const { rows: userRows } = await query(
          'SELECT email, prenom FROM users WHERE id = $1',
          [userId]
        );
        if (userRows[0]) {
          const planLabel = 'Pro';
          const periodLabel = isYearly ? 'annuel' : 'mensuel';
          const planSlug = `${planId}_${isYearly ? 'annuel' : 'mensuel'}`;
          const planConfig = payplug.PAYPLUG_SUBSCRIPTION_PLANS[planSlug];
          const xpf = planConfig ? Math.round((planConfig.amount_cents / 100) * payplug.XPF_PER_EUR) : 0;

          await sendMail({
            to: userRows[0].email,
            subject: `[Kalico] Votre abonnement ${planLabel} est activé !`,
            html: `<p>Bonjour ${userRows[0].prenom},</p>
                   <p>Votre abonnement <strong>Kalico ${planLabel} ${periodLabel}</strong> via PayPlug est activé.</p>
                   <p>Montant : <strong>${payplug.formatXpfEur(xpf)}</strong></p>
                   <p>Prochain renouvellement : ${periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                   <p>Gérez votre abonnement depuis <a href="${baseUrl}/parametres">vos paramètres</a>.</p>`,
          }).catch(() => {});
        }

        console.log(`[webhook/payplug] Abonnement activé - user ${userId} plan ${planId}`);
      }

      const isCancelled = resource.is_cancelled ?? resource.state === 'cancelled';
      if (isCancelled && userId) {
        await query(
          `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
           WHERE provider_sub_id = $1`,
          [resourceId]
        );
        await query(
          `UPDATE users SET is_pro = FALSE, pro_plan = NULL, pro_expires_at = NULL, updated_at = NOW()
           WHERE id = $1 AND id = (SELECT user_id FROM subscriptions WHERE provider_sub_id = $2 LIMIT 1)`,
          [userId, resourceId]
        );
        console.log(`[webhook/payplug] Abonnement annulé - user ${userId}`);
      }
    }

    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[webhook/payplug] Erreur traitement:', err.message);
    return res.status(200).json({ received: true, error: err.message });
  }
});

router.delete('/subscription', authenticate, (req, res, next) => {
  req.method = 'POST';
  req.url = '/cancel';
  router.handle(req, res, next);
});

module.exports = router;

````

## PATH: backend/src/routes/covoiturage.route.js
````
'use strict';

const express = require('express');
const Joi = require('joi');
const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { triggerCovoiturageAlerts } = require('../services/covoitAlertService');
const { createNotification } = require('../services/notificationService');
const { sendPushToUser } = require('../services/pushService');
const { getRouteCompatibility, isOnRoute, getRouteStopsBetween, normalizeRouteText } = require('../shared-copy/routesNC');
const {
  sendRideAutoBookingPassengerEmail,
  sendRideAutoBookingDriverEmail,
  sendRideManualRequestEmail,
  sendRideBookingAcceptedPassengerEmail,
  sendRideBookingAcceptedDriverEmail,
  sendRideReviewReminderEmail,
} = require('../services/emailService');

const router = express.Router();

const recurrenceDaysSchema = Joi.array().items(Joi.number().integer().min(0).max(6)).default([]);

const createSchema = Joi.object({
  departure: Joi.string().min(2).max(120).required(),
  destination: Joi.string().min(2).max(120).required(),
  stops: Joi.array().items(Joi.string().min(1).max(120)).default([]),
  ride_date: Joi.string().isoDate().required(),
  ride_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  seats_total: Joi.number().integer().min(1).max(8).required(),
  booking_mode: Joi.string().valid('auto', 'manual').default('auto'),
  price_xpf: Joi.number().integer().min(0).required(),
  vehicle: Joi.string().max(120).allow('', null),
  comfort: Joi.string().max(120).allow('', null),
  luggage_allowed: Joi.string().max(120).allow('', null),
  music_allowed: Joi.boolean().default(true),
  no_smoking: Joi.boolean().default(true),
  animals_allowed: Joi.boolean().default(false),
  women_only: Joi.boolean().default(false),
  description: Joi.string().min(10).max(1500).required(),
  departure_commune_id: Joi.number().integer().allow(null),
  destination_commune_id: Joi.number().integer().allow(null),
  trust_score: Joi.number().integer().min(0).max(100).allow(null),
  is_verified_driver: Joi.boolean().default(false),
  expires_at: Joi.string().isoDate().allow(null),
  recurrence_enabled: Joi.boolean().default(false),
  recurrence_type: Joi.string().valid('none', 'daily', 'weekly').default('none'),
  recurrence_days: recurrenceDaysSchema,
  recurrence_until: Joi.string().isoDate().allow('', null),
  recurrence_count: Joi.number().integer().min(1).max(60).allow(null),
});

const bookingSchema = Joi.object({
  seats: Joi.number().integer().min(1).max(8).default(1),
  message: Joi.string().max(1000).allow('', null),
});

const reviewSchema = Joi.object({
  target_user_id: Joi.number().integer().required(),
  booking_id: Joi.number().integer().allow(null),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(2).max(1000).allow('', null),
});

const alertSchema = Joi.object({
  from_commune: Joi.string().max(100).allow('', null),
  to_commune: Joi.string().max(100).allow('', null),
  jour_semaine: Joi.number().integer().min(0).max(6).allow(null),
  heure_min: Joi.string().pattern(/^\d{2}:\d{2}$/).allow('', null),
  heure_max: Joi.string().pattern(/^\d{2}:\d{2}$/).allow('', null),
  via_push: Joi.boolean().default(true),
  via_email: Joi.boolean().default(false),
  active: Joi.boolean().default(true),
});

const updateAlertSchema = Joi.object({
  from_commune: Joi.string().max(100).allow('', null),
  to_commune: Joi.string().max(100).allow('', null),
  jour_semaine: Joi.number().integer().min(0).max(6).allow(null),
  heure_min: Joi.string().pattern(/^\d{2}:\d{2}$/).allow('', null),
  heure_max: Joi.string().pattern(/^\d{2}:\d{2}$/).allow('', null),
  via_push: Joi.boolean(),
  via_email: Joi.boolean(),
  active: Joi.boolean(),
}).min(1);

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function computeExpiryDate(rideDate, explicitExpiry) {
  if (explicitExpiry) return new Date(explicitExpiry);
  const base = new Date(`${rideDate}T12:00:00Z`);
  return new Date(base.getTime() + 24 * 60 * 60 * 1000);
}

function parseUtcMiddayDate(value) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function normalizeRecurrenceDays(days) {
  return [...new Set((Array.isArray(days) ? days : []).map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6))].sort((a, b) => a - b);
}

function buildRecurrenceDates({ rideDate, recurrenceType, recurrenceDays, recurrenceUntil, recurrenceCount }) {
  const baseDate = parseUtcMiddayDate(rideDate);
  if (!baseDate) return [rideDate];

  const maxOccurrences = Number.isFinite(Number(recurrenceCount)) ? Math.min(Math.max(1, Number(recurrenceCount)), 60) : null;
  const untilDate = recurrenceUntil ? parseUtcMiddayDate(recurrenceUntil) : addUtcDays(baseDate, 30);
  const dates = [formatUtcDate(baseDate)];

  if (!untilDate || untilDate.getTime() < baseDate.getTime()) {
    return dates;
  }

  if (recurrenceType === 'daily') {
    let cursor = addUtcDays(baseDate, 1);
    while (cursor.getTime() <= untilDate.getTime() && (!maxOccurrences || dates.length < maxOccurrences)) {
      dates.push(formatUtcDate(cursor));
      cursor = addUtcDays(cursor, 1);
    }
    return dates;
  }

  if (recurrenceType === 'weekly') {
    const selectedDays = recurrenceDays.length > 0 ? recurrenceDays : [baseDate.getUTCDay()];
    const allowedDays = new Set(selectedDays);
    let cursor = addUtcDays(baseDate, 1);
    while (cursor.getTime() <= untilDate.getTime() && (!maxOccurrences || dates.length < maxOccurrences)) {
      if (allowedDays.has(cursor.getUTCDay())) {
        dates.push(formatUtcDate(cursor));
      }
      cursor = addUtcDays(cursor, 1);
    }
  }

  return dates;
}

function mapRide(item) {
  return {
    ...item,
    stops: parseJson(item.stops, []),
    booking_mode: item.booking_mode || 'auto',
    recurrence_type: item.recurrence_type || 'none',
    recurrence_days: parseJson(item.recurrence_days, []),
    recurrence_until: item.recurrence_until || null,
    recurrence_count: item.recurrence_count == null ? null : Number(item.recurrence_count),
    recurrence_parent_id: item.recurrence_parent_id == null ? null : Number(item.recurrence_parent_id),
    seats_remaining: Number.isFinite(Number(item.seats_remaining))
      ? Math.max(0, Number(item.seats_remaining))
      : Math.max(0, Number(item.seats_total || 0) - Number(item.seats_reserved || 0)),
  };
}

function enhanceRideForSearch(ride, searchFrom, searchTo) {
  const compatibility = getRouteCompatibility(ride.departure, ride.destination, searchFrom, searchTo);
  return {
    ...ride,
    is_direct: Boolean(searchFrom && searchTo)
      ? normalizeRouteText(ride.departure) === normalizeRouteText(searchFrom)
        && normalizeRouteText(ride.destination) === normalizeRouteText(searchTo)
      : true,
    via_stops: compatibility.via_stops,
    route_name: compatibility.route_name,
  };
}

function buildRideLabel(ride) {
  return `${ride.departure} → ${ride.destination}`;
}

function mapBookingRow(row, currentUserId) {
  if (!row) return null;
  const isDriver = Number(row.driver_id) === Number(currentUserId);
  const otherUser = isDriver
    ? {
        id: row.passenger_id,
        prenom: row.passenger_prenom,
        nom: row.passenger_nom,
        avatar_url: row.passenger_avatar_url,
        trust_score: row.passenger_trust_score,
      }
    : {
        id: row.driver_id,
        prenom: row.driver_prenom,
        nom: row.driver_nom,
        avatar_url: row.driver_avatar_url,
        trust_score: row.driver_trust_score,
      };

  return {
    id: row.booking_id,
    ride_id: row.ride_id,
    role: isDriver ? 'driver' : 'passenger',
    status: row.booking_status,
    booking_mode: row.booking_mode,
    message: row.booking_message,
    seats: Number(row.booking_seats || 1),
    created_at: row.booking_created_at,
    responded_at: row.booking_responded_at,
    expires_at: row.booking_expires_at,
    review_id: row.review_id || null,
    review_exists: Boolean(row.review_id),
    is_expired: row.booking_status === 'pending' && row.booking_expires_at ? new Date(row.booking_expires_at).getTime() < Date.now() : false,
    ride: {
      id: row.ride_id,
      departure: row.departure,
      destination: row.destination,
      ride_date: row.ride_date,
      ride_time: row.ride_time,
      price_xpf: row.price_xpf,
      seats_total: row.seats_total,
      seats_remaining: row.seats_remaining,
      booking_mode: row.ride_booking_mode || row.booking_mode || 'auto',
      status: row.ride_status,
      driver_id: row.driver_id,
      driver_prenom: row.driver_prenom,
      driver_nom: row.driver_nom,
      driver_avatar_url: row.driver_avatar_url,
      driver_trust_score: row.driver_trust_score,
    },
    other_user: otherUser,
  };
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(24, Math.max(1, Number(req.query.limit || 8)));
    const searchFrom = String(req.query.departure || '').trim();
    const searchTo = String(req.query.destination || '').trim();
    const filters = [];
    const params = [];

    filters.push(`c.status IN ('published', 'full')`);
    filters.push(`c.expires_at > NOW()`);

    if (searchFrom && !searchTo) {
      params.push(`%${String(req.query.departure).trim()}%`);
      filters.push(`(c.departure ILIKE $${params.length} OR co_dep.name ILIKE $${params.length})`);
    }

    if (searchTo && !searchFrom) {
      params.push(`%${String(req.query.destination).trim()}%`);
      filters.push(`(c.destination ILIKE $${params.length} OR co_dest.name ILIKE $${params.length})`);
    }

    if (req.query.q) {
      params.push(`%${String(req.query.q).trim()}%`);
      filters.push(`(
        c.departure ILIKE $${params.length}
        OR c.destination ILIKE $${params.length}
        OR c.description ILIKE $${params.length}
        OR c.vehicle ILIKE $${params.length}
      )`);
    }

    if (req.query.status) {
      params.push(String(req.query.status));
      filters.push(`c.status = $${params.length}`);
    }

    if (String(req.query.women_only) === 'true') {
      filters.push(`COALESCE(c.women_only, FALSE) = TRUE`);
    }

    const where = `WHERE ${filters.join(' AND ')}`;
    params.push(limit);

    const result = await query(
      `SELECT
         c.id,
         c.user_id,
         c.departure,
         c.destination,
         c.stops,
         c.ride_date,
         c.ride_time,
         c.seats_total,
         c.seats_reserved,
         c.seats_remaining,
         c.booking_mode,
         c.recurrence_type,
         c.recurrence_days,
         c.recurrence_until,
         c.recurrence_count,
         c.recurrence_parent_id,
         c.price_xpf,
         c.vehicle,
         c.comfort,
         c.luggage_allowed,
         c.music_allowed,
         c.no_smoking,
         c.animals_allowed,
         c.women_only,
         c.description,
         c.status,
         c.departure_commune_id,
         c.destination_commune_id,
         c.trust_score,
         c.is_verified_driver,
         c.expires_at,
         c.created_at,
         c.updated_at,
         u.prenom AS driver_prenom,
         u.nom AS driver_nom,
         u.avatar_url AS driver_avatar_url,
         u.phone_verified AS driver_phone_verified,
         u.email_verified AS driver_email_verified,
         u.identity_verified AS driver_identity_verified,
         u.photo_verified AS driver_photo_verified,
         COALESCE(bookings.total_bookings, 0) AS bookings_count,
         COALESCE(reviews.total_reviews, 0) AS reviews_count,
         COALESCE(reviews.avg_rating, 0) AS avg_rating,
         co_dep.name AS departure_commune_name,
         co_dest.name AS destination_commune_name
       FROM covoiturages c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN communes co_dep ON co_dep.id = c.departure_commune_id
       LEFT JOIN communes co_dest ON co_dest.id = c.destination_commune_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_bookings
         FROM ride_bookings b
         WHERE b.ride_id = c.id AND b.status IN ('auto_confirmed','accepted','pending')
       ) bookings ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_reviews, ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
         FROM covoiturage_reviews r
         WHERE r.covoiturage_id = c.id
       ) reviews ON TRUE
       ${where}
       ORDER BY c.ride_date ASC, c.ride_time ASC, c.created_at DESC
       LIMIT $${params.length}`,
      params
    );

    let rides = result.rows.map(mapRide);
    if (searchFrom && searchTo) {
      rides = rides.filter((ride) => isOnRoute(ride.departure, ride.destination, searchFrom, searchTo));
      rides = rides
        .map((ride) => enhanceRideForSearch(ride, searchFrom, searchTo))
        .sort((a, b) => {
          if (a.is_direct !== b.is_direct) return a.is_direct ? -1 : 1;
          return Number(new Date(`${a.ride_date || ''}T${a.ride_time || '00:00'}`)) - Number(new Date(`${b.ride_date || ''}T${b.ride_time || '00:00'}`));
        });
    } else {
      rides = rides.map((ride) => enhanceRideForSearch(ride, searchFrom, searchTo));
    }

    return res.json({ data: rides });
  } catch (err) {
    next(err);
  }
});

router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         c.*,
         c.seats_remaining,
         c.booking_mode,
         COALESCE(bookings.total_bookings, 0) AS bookings_count,
         COALESCE(reviews.total_reviews, 0) AS reviews_count,
         COALESCE(reviews.avg_rating, 0) AS avg_rating,
         co_dep.name AS departure_commune_name,
         co_dest.name AS destination_commune_name
       FROM covoiturages c
       LEFT JOIN communes co_dep ON co_dep.id = c.departure_commune_id
       LEFT JOIN communes co_dest ON co_dest.id = c.destination_commune_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_bookings
         FROM ride_bookings b
         WHERE b.ride_id = c.id AND b.status IN ('auto_confirmed','accepted','pending')
       ) bookings ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_reviews, ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
         FROM covoiturage_reviews r
         WHERE r.covoiturage_id = c.id
       ) reviews ON TRUE
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    return res.json({ data: result.rows.map(mapRide) });
  } catch (err) {
    next(err);
  }
});

router.get('/drivers/:id/profile', async (req, res, next) => {
  try {
    const driverId = Number(req.params.id);
    if (!Number.isFinite(driverId) || driverId <= 0) {
      return res.status(400).json({ error: 'Conducteur invalide.' });
    }

    const profileRes = await query(
      `SELECT
         u.id,
         u.prenom,
         u.nom,
         u.avatar_url,
         u.bio,
         u.member_since,
         COALESCE(u.rides_as_driver, 0) AS rides_as_driver,
         COALESCE(u.rides_as_passenger, 0) AS rides_as_passenger,
         COALESCE(u.trust_score, 100) AS trust_score,
         CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
         u.nb_avis,
         u.note_moyenne,
         u.created_at,
         u.phone_verified,
         u.email_verified,
         com.name AS commune_name,
         prov.name AS province_name,
         COALESCE((
           SELECT COUNT(*)
           FROM covoiturages c
           WHERE c.user_id = u.id AND c.deleted_at IS NULL
         ), 0) AS rides_total,
         COALESCE((
           SELECT COUNT(*)
           FROM covoiturages c
           WHERE c.user_id = u.id AND c.deleted_at IS NULL AND c.status IN ('published', 'full')
         ), 0) AS rides_active,
         COALESCE((
           SELECT COUNT(*)
           FROM covoiturage_reviews r
           WHERE r.target_user_id = u.id
         ), 0) AS reviews_count,
         COALESCE((
           SELECT ROUND(AVG(r.rating)::numeric, 1)
           FROM covoiturage_reviews r
           WHERE r.target_user_id = u.id
         ), 0) AS avg_rating,
         (
           SELECT c.vehicle
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
             AND c.vehicle IS NOT NULL
             AND c.vehicle <> ''
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS vehicle,
         (
           SELECT c.comfort
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
             AND c.comfort IS NOT NULL
             AND c.comfort <> ''
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS comfort,
         (
           SELECT c.luggage_allowed
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
             AND c.luggage_allowed IS NOT NULL
             AND c.luggage_allowed <> ''
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS luggage_allowed,
         (
           SELECT c.seats_total
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS vehicle_capacity,
         (
           SELECT c.music_allowed
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS music_allowed,
         (
           SELECT c.no_smoking
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS no_smoking,
         (
           SELECT c.animals_allowed
           FROM covoiturages c
           WHERE c.user_id = u.id
             AND c.deleted_at IS NULL
           ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
           LIMIT 1
         ) AS animals_allowed
       FROM users u
       LEFT JOIN communes com ON com.id = u.commune_id
       LEFT JOIN provinces prov ON prov.id = com.province_id
       WHERE u.id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id, com.name, prov.name`,
      [driverId]
    );

    const profile = profileRes.rows[0];
    if (!profile) {
      return res.status(404).json({ error: 'Conducteur introuvable.' });
    }

    const ridesRes = await query(
      `SELECT
         c.*,
         c.seats_total,
         COALESCE(c.seats_remaining, GREATEST(c.seats_total - c.seats_reserved, 0)) AS seats_remaining,
         c.booking_mode,
         COALESCE(bookings.total_bookings, 0) AS bookings_count,
         COALESCE(reviews.total_reviews, 0) AS reviews_count,
         COALESCE(reviews.avg_rating, 0) AS avg_rating,
         co_dep.name AS departure_commune_name,
         co_dest.name AS destination_commune_name,
         u.prenom AS driver_prenom,
         u.nom AS driver_nom,
         u.avatar_url AS driver_avatar_url,
         u.trust_score AS driver_trust_score
       FROM covoiturages c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN communes co_dep ON co_dep.id = c.departure_commune_id
       LEFT JOIN communes co_dest ON co_dest.id = c.destination_commune_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_bookings
         FROM ride_bookings b
         WHERE b.ride_id = c.id AND b.status IN ('auto_confirmed', 'accepted', 'pending')
       ) bookings ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS total_reviews, ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
         FROM covoiturage_reviews r
         WHERE r.covoiturage_id = c.id
       ) reviews ON TRUE
       WHERE c.user_id = $1
         AND c.deleted_at IS NULL
       ORDER BY c.ride_date DESC, c.ride_time DESC, c.created_at DESC
       LIMIT 8`,
      [driverId]
    );

    const reviewsRes = await query(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         rev.prenom AS reviewer_prenom,
         rev.nom AS reviewer_nom,
         rev.avatar_url AS reviewer_avatar_url,
         c.id AS ride_id,
         c.departure,
         c.destination,
         c.ride_date,
         c.ride_time
       FROM covoiturage_reviews r
       LEFT JOIN users rev ON rev.id = r.reviewer_id
       LEFT JOIN covoiturages c ON c.id = r.covoiturage_id
       WHERE r.target_user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 12`,
      [driverId]
    );

    const mappedRides = ridesRes.rows.map(mapRide);

    return res.json({
      data: {
        profile,
        vehicle: {
          vehicle: profile.vehicle,
          vehicle_description: profile.comfort ?? null,
          vehicle_capacity: profile.vehicle_capacity != null ? Number(profile.vehicle_capacity) : null,
          luggage_allowed: profile.luggage_allowed ?? null,
          music_allowed: profile.music_allowed,
          no_smoking: profile.no_smoking,
          animals_allowed: profile.animals_allowed,
        },
        rides: mappedRides,
        latest_ride: mappedRides[0] || null,
        reviews: reviewsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const rideDate = new Date(value.ride_date);
    if (Number.isNaN(rideDate.getTime())) {
      return res.status(400).json({ error: 'Date de trajet invalide.' });
    }

    const expiresAt = computeExpiryDate(value.ride_date, value.expires_at);
    const recurrenceEnabled = Boolean(value.recurrence_enabled) && value.recurrence_type !== 'none';
    const recurrenceType = recurrenceEnabled ? value.recurrence_type : 'none';
    const recurrenceDays = recurrenceEnabled ? normalizeRecurrenceDays(value.recurrence_days) : [];
    const recurrenceBaseDate = parseUtcMiddayDate(value.ride_date) || new Date(`${value.ride_date}T12:00:00Z`);
    const recurrenceUntil = recurrenceEnabled
      ? value.recurrence_until || formatUtcDate(addUtcDays(recurrenceBaseDate, 30))
      : null;
    const recurrenceCount = Number.isFinite(Number(value.recurrence_count)) ? Number(value.recurrence_count) : null;
    const recurrenceDates = recurrenceEnabled
      ? buildRecurrenceDates({
          rideDate: value.ride_date,
          recurrenceType,
          recurrenceDays,
          recurrenceUntil,
          recurrenceCount,
        })
      : [value.ride_date];

    const created = await withTransaction(async (client) => {
      const insertRide = async (rideDateValue, recurrenceParentId = null) => {
        const rideExpiresAt = computeExpiryDate(rideDateValue, value.expires_at);
        const inserted = await client.query(
          `INSERT INTO covoiturages
             (user_id, departure, destination, stops, ride_date, ride_time, seats_total, seats_reserved,
              seats_remaining, booking_mode, recurrence_type, recurrence_days, recurrence_until, recurrence_count,
              recurrence_parent_id, price_xpf, vehicle, comfort, luggage_allowed, music_allowed, no_smoking, animals_allowed,
              women_only, description, status, departure_commune_id, destination_commune_id, trust_score,
              is_verified_driver, expires_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,0,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'published',$23,$24,$25,$26,$27)
           RETURNING *`,
          [
            req.user.id,
            value.departure.trim(),
            value.destination.trim(),
            JSON.stringify(value.stops || []),
            rideDateValue,
            value.ride_time,
            value.seats_total,
            value.booking_mode,
            recurrenceType,
            JSON.stringify(recurrenceDays),
            recurrenceUntil,
            recurrenceCount,
            recurrenceParentId,
            value.price_xpf,
            value.vehicle?.trim() || null,
            value.comfort?.trim() || null,
            value.luggage_allowed?.trim() || null,
            value.music_allowed,
            value.no_smoking,
            value.animals_allowed,
            Boolean(value.women_only),
            value.description.trim(),
            value.departure_commune_id || null,
            value.destination_commune_id || null,
            value.trust_score ?? null,
            Boolean(value.is_verified_driver),
            rideExpiresAt,
          ]
        );

        return inserted.rows[0];
      };

      const baseRide = await insertRide(recurrenceDates[0], null);
      if (recurrenceEnabled && recurrenceDates.length > 1) {
        await client.query(`UPDATE covoiturages SET recurrence_parent_id = $2 WHERE id = $1`, [baseRide.id, baseRide.id]);
        baseRide.recurrence_parent_id = baseRide.id;
        for (const rideDateValue of recurrenceDates.slice(1)) {
          await insertRide(rideDateValue, baseRide.id);
        }
      }

      return baseRide;
    });

    logger.info('covoiturage_created', {
      user_id: req.user.id,
      covoiturage_id: created.id,
      occurrences: recurrenceDates.length,
    });
    await query(
      `UPDATE users
       SET rides_as_driver = COALESCE(rides_as_driver, 0) + $2
       WHERE id = $1`,
      [req.user.id, recurrenceDates.length]
    ).catch(() => {});
    void triggerCovoiturageAlerts(created).catch((error) => {
      logger.warn('covoiturage_alert_trigger_failed', {
        covoiturage_id: created.id,
        error: error?.message || String(error),
      });
    });

    return res.status(201).json({ data: mapRide(created) });
  } catch (err) {
    next(err);
  }
});

router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, user_id, from_commune, to_commune, jour_semaine, heure_min, heure_max,
              via_push, via_email, active, last_notified_at, created_at
       FROM covoit_alerts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/alerts', authenticate, async (req, res, next) => {
  try {
    const { error, value } = alertSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM covoit_alerts WHERE user_id = $1 AND active = true`,
      [req.user.id]
    );
    const count = Number(countResult.rows[0]?.total || 0);
    if (count >= 3) {
      return res.status(429).json({ error: 'Vous pouvez créer jusqu’à 3 alertes trajet.' });
    }

    const inserted = await query(
      `INSERT INTO covoit_alerts
         (user_id, from_commune, to_commune, jour_semaine, heure_min, heure_max, via_push, via_email, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, user_id, from_commune, to_commune, jour_semaine, heure_min, heure_max,
                 via_push, via_email, active, last_notified_at, created_at`,
      [
        req.user.id,
        value.from_commune?.trim() || null,
        value.to_commune?.trim() || null,
        value.jour_semaine ?? null,
        value.heure_min || null,
        value.heure_max || null,
        Boolean(value.via_push),
        Boolean(value.via_email),
        Boolean(value.active),
      ]
    );

    return res.status(201).json({ data: inserted.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/alerts/:id', authenticate, async (req, res, next) => {
  try {
    const { error, value } = updateAlertSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const fields = [];
    const params = [];
    let index = 1;

    for (const key of ['from_commune', 'to_commune', 'jour_semaine', 'heure_min', 'heure_max', 'via_push', 'via_email', 'active']) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
      fields.push(`${key} = $${index++}`);
      const raw = value[key];
      if (typeof raw === 'string') {
        params.push(raw.trim() || null);
      } else {
        params.push(raw);
      }
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour.' });
    }

    fields.push('updated_at = NOW()');
    params.push(req.params.id, req.user.id);

    const result = await query(
      `UPDATE covoit_alerts
       SET ${fields.join(', ')}
       WHERE id = $${index++} AND user_id = $${index}
       RETURNING id, user_id, from_commune, to_commune, jour_semaine, heure_min, heure_max,
                 via_push, via_email, active, last_notified_at, created_at`,
      params
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Alerte introuvable.' });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/alerts/:id', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM covoit_alerts WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Alerte introuvable.' });
    }

    return res.json({ message: 'Alerte supprimée.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/book', authenticate, async (req, res, next) => {
  try {
    const { error, value } = bookingSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const rideId = Number(req.params.id);
    if (!Number.isFinite(rideId) || rideId <= 0) {
      return res.status(400).json({ error: 'Trajet invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const rideRes = await client.query(
        `SELECT
           c.id,
           c.user_id,
           c.departure,
           c.destination,
           c.stops,
           c.ride_date,
           c.ride_time,
         c.seats_total,
         c.seats_reserved,
         c.seats_remaining,
         c.booking_mode,
         c.recurrence_type,
         c.recurrence_days,
         c.recurrence_until,
         c.recurrence_count,
         c.recurrence_parent_id,
         c.price_xpf,
           c.vehicle,
           c.comfort,
           c.luggage_allowed,
           c.music_allowed,
           c.no_smoking,
           c.animals_allowed,
           c.description,
           c.status,
           c.departure_commune_id,
           c.destination_commune_id,
           c.trust_score,
           c.is_verified_driver,
           c.expires_at,
           c.created_at,
           c.updated_at,
           u.prenom AS driver_prenom,
           u.nom AS driver_nom,
           u.email AS driver_email,
           u.avatar_url AS driver_avatar_url,
           u.trust_score AS driver_trust_score
         FROM covoiturages c
         JOIN users u ON u.id = c.user_id
         WHERE c.id = $1
         FOR UPDATE`,
        [rideId]
      );

      const ride = rideRes.rows[0];
      if (!ride) {
        throw Object.assign(new Error('Trajet introuvable.'), { statusCode: 404 });
      }
      if (Number(ride.user_id) === Number(req.user.id)) {
        throw Object.assign(new Error('Vous ne pouvez pas réserver votre propre trajet.'), { statusCode: 400 });
      }
      if (!['published', 'full'].includes(ride.status)) {
        throw Object.assign(new Error('Ce trajet ne peut plus être réservé.'), { statusCode: 400 });
      }

      const seatsRemaining = Number.isFinite(Number(ride.seats_remaining))
        ? Math.max(0, Number(ride.seats_remaining))
        : Math.max(0, Number(ride.seats_total || 0) - Number(ride.seats_reserved || 0));
      if (seatsRemaining < value.seats) {
        throw Object.assign(new Error('Plus assez de places disponibles.'), { statusCode: 400 });
      }

      const existing = await client.query(
        `SELECT id FROM ride_bookings WHERE ride_id = $1 AND passenger_id = $2`,
        [rideId, req.user.id]
      );
      if (existing.rows.length > 0) {
        throw Object.assign(new Error('Vous avez déjà réservé ce trajet.'), { statusCode: 400 });
      }

      const passengerRes = await client.query(
        `SELECT id, prenom, nom, email, avatar_url, trust_score
         FROM users
         WHERE id = $1`,
        [req.user.id]
      );
      const passenger = passengerRes.rows[0];
      if (!passenger) {
        throw Object.assign(new Error('Utilisateur introuvable.'), { statusCode: 404 });
      }

      const bookingMode = String(ride.booking_mode || 'auto').toLowerCase() === 'manual' ? 'manual' : 'auto';
      const bookingStatus = bookingMode === 'manual' ? 'pending' : 'auto_confirmed';

      const bookingRes = await client.query(
        `INSERT INTO ride_bookings
           (ride_id, passenger_id, status, booking_mode, message, seats, responded_at)
         VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7 THEN NOW() ELSE NULL END)
         RETURNING *`,
        [
          rideId,
          req.user.id,
          bookingStatus,
          bookingMode,
          value.message?.trim() || null,
          value.seats,
          bookingMode === 'auto',
        ]
      );

      let updatedRide = ride;
      if (bookingMode === 'auto') {
        const autoUpdated = await client.query(
          `UPDATE covoiturages
           SET seats_reserved = seats_reserved + $2,
               seats_remaining = GREATEST(COALESCE(seats_remaining, seats_total) - $2, 0),
               status = CASE
                 WHEN GREATEST(COALESCE(seats_remaining, seats_total) - $2, 0) = 0 THEN 'full'
                 ELSE status
               END,
               updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [rideId, value.seats]
        );
        updatedRide = autoUpdated.rows[0] || ride;

        await client.query(
          `UPDATE users
           SET rides_as_passenger = COALESCE(rides_as_passenger, 0) + 1
           WHERE id = $1`,
          [req.user.id]
        );
      }

      return {
        booking: bookingRes.rows[0],
        ride: updatedRide,
        passenger,
        driver: {
          id: ride.user_id,
          prenom: ride.driver_prenom,
          nom: ride.driver_nom,
          email: ride.driver_email,
          avatar_url: ride.driver_avatar_url,
          trust_score: ride.driver_trust_score,
        },
        seatsRemaining: bookingMode === 'auto'
          ? Math.max(0, Number(updatedRide.seats_remaining ?? (updatedRide.seats_total - updatedRide.seats_reserved)))
          : seatsRemaining,
        bookingMode,
      };
    });

    const rideLabel = buildRideLabel(result.ride);
    const rideDetails = {
      departure: result.ride.departure,
      destination: result.ride.destination,
      ride_date: result.ride.ride_date,
      ride_time: result.ride.ride_time,
      seats: result.booking.seats,
      price_xpf: result.ride.price_xpf,
      driverPrenom: result.driver.prenom,
      passengerPrenom: result.passenger.prenom,
    };

    if (result.bookingMode === 'auto') {
      await createNotification(result.ride.user_id, {
        type: 'ride_booking_auto',
        title: 'Nouvelle réservation !',
        body: `${result.passenger.prenom || 'Un passager'} a réservé une place pour ${rideLabel}`,
        href: '/covoiturage/reservations',
      }).catch(() => {});
      await createNotification(req.user.id, {
        type: 'ride_booking_auto_confirmed',
        title: '✅ Place réservée',
        body: `Votre place est confirmée sur ${rideLabel}`,
        href: '/covoiturage/reservations',
      }).catch(() => {});

      await sendPushToUser(result.ride.user_id, {
        title: 'Nouvelle réservation !',
        body: `${result.passenger.prenom || 'Un passager'} a réservé une place pour ${rideLabel}`,
        data: { type: 'ride_booking_auto', booking_id: result.booking.id, ride_id: result.ride.id },
      }).catch(() => {});
      await sendPushToUser(req.user.id, {
        title: '✅ Place réservée',
        body: `Votre place est confirmée sur ${rideLabel}`,
        data: { type: 'ride_booking_auto_confirmed', booking_id: result.booking.id, ride_id: result.ride.id },
      }).catch(() => {});

      await sendRideAutoBookingPassengerEmail(
        result.passenger.email,
        result.passenger.prenom || 'Bonjour',
        rideDetails,
        result.passenger.id
      ).catch(() => {});
      await sendRideAutoBookingDriverEmail(
        result.driver.email,
        result.driver.prenom || 'Bonjour',
        rideDetails,
        result.driver.id
      ).catch(() => {});
    } else {
      await createNotification(result.ride.user_id, {
        type: 'ride_booking_requested',
        title: 'Demande de réservation !',
        body: `${result.passenger.prenom || 'Un passager'} demande une place — vous avez 24h pour accepter.`,
        href: '/covoiturage/reservations',
      }).catch(() => {});

      await sendPushToUser(result.ride.user_id, {
        title: 'Demande de réservation !',
        body: `${result.passenger.prenom || 'Un passager'} demande une place — vous avez 24h pour accepter.`,
        data: { type: 'ride_booking_requested', booking_id: result.booking.id, ride_id: result.ride.id },
      }).catch(() => {});

      await sendRideManualRequestEmail(
        result.driver.email,
        result.driver.prenom || 'Bonjour',
        rideDetails,
        result.driver.id
      ).catch(() => {});
    }

    logger.info('covoiturage_booked', {
      user_id: req.user.id,
      covoiturage_id: rideId,
      booking_mode: result.bookingMode,
      booking_id: result.booking.id,
    });

    return res.status(201).json({
      data: {
        id: result.booking.id,
        ride_id: rideId,
        status: result.booking.status,
        booking_mode: result.booking.booking_mode,
        seats: result.booking.seats,
        message: result.booking.message,
        expires_at: result.booking.expires_at,
        responded_at: result.booking.responded_at,
        seats_remaining: result.seatsRemaining,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/reservations/mine', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         b.id AS booking_id,
         b.ride_id,
         b.status AS booking_status,
         b.booking_mode,
         b.message AS booking_message,
         b.seats AS booking_seats,
         b.created_at AS booking_created_at,
         b.responded_at AS booking_responded_at,
         b.expires_at AS booking_expires_at,
         c.user_id AS driver_id,
         c.departure,
         c.destination,
         c.ride_date,
         c.ride_time,
         c.price_xpf,
         c.seats_total,
         c.seats_reserved,
         COALESCE(c.seats_remaining, GREATEST(c.seats_total - c.seats_reserved, 0)) AS seats_remaining,
         c.booking_mode AS ride_booking_mode,
         c.status AS ride_status,
         d.prenom AS driver_prenom,
         d.nom AS driver_nom,
         d.avatar_url AS driver_avatar_url,
         d.trust_score AS driver_trust_score,
         p.id AS passenger_id,
         p.prenom AS passenger_prenom,
         p.nom AS passenger_nom,
         p.avatar_url AS passenger_avatar_url,
         p.trust_score AS passenger_trust_score,
         review.id AS review_id,
         CASE WHEN c.user_id = $1 THEN 'driver' ELSE 'passenger' END AS role,
         CASE WHEN c.user_id = $1 THEN p.id ELSE d.id END AS other_user_id,
         CASE WHEN c.user_id = $1 THEN p.prenom ELSE d.prenom END AS other_user_prenom,
         CASE WHEN c.user_id = $1 THEN p.nom ELSE d.nom END AS other_user_nom,
         CASE WHEN c.user_id = $1 THEN p.avatar_url ELSE d.avatar_url END AS other_user_avatar_url,
         CASE WHEN c.user_id = $1 THEN p.trust_score ELSE d.trust_score END AS other_user_trust_score
       FROM ride_bookings b
       JOIN covoiturages c ON c.id = b.ride_id
       JOIN users d ON d.id = c.user_id
       JOIN users p ON p.id = b.passenger_id
       LEFT JOIN LATERAL (
         SELECT r.id
         FROM covoiturage_reviews r
         WHERE r.booking_id = b.id
           AND r.reviewer_id = $1
           AND r.target_user_id = CASE WHEN c.user_id = $1 THEN p.id ELSE d.id END
         LIMIT 1
       ) review ON TRUE
       WHERE b.passenger_id = $1 OR c.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    return res.json({ data: result.rows.map((row) => mapBookingRow(row, req.user.id)) });
  } catch (err) {
    next(err);
  }
});

router.post('/bookings/:bookingId/accept', authenticate, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Réservation invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const bookingRes = await client.query(
        `SELECT
           b.id AS booking_id,
           b.ride_id,
           b.passenger_id,
           b.status AS booking_status,
           b.booking_mode,
           b.message AS booking_message,
           b.seats AS booking_seats,
           b.created_at AS booking_created_at,
           b.responded_at AS booking_responded_at,
           b.expires_at AS booking_expires_at,
           c.id AS ride_id,
           c.user_id AS driver_id,
           c.departure,
           c.destination,
           c.ride_date,
           c.ride_time,
           c.price_xpf,
           c.seats_total,
           c.seats_reserved,
           c.seats_remaining,
           c.booking_mode AS ride_booking_mode,
           c.status AS ride_status,
           d.prenom AS driver_prenom,
           d.nom AS driver_nom,
           d.email AS driver_email,
           d.avatar_url AS driver_avatar_url,
           d.trust_score AS driver_trust_score,
           p.prenom AS passenger_prenom,
           p.nom AS passenger_nom,
           p.email AS passenger_email,
           p.avatar_url AS passenger_avatar_url,
           p.trust_score AS passenger_trust_score
         FROM ride_bookings b
         JOIN covoiturages c ON c.id = b.ride_id
         JOIN users d ON d.id = c.user_id
         JOIN users p ON p.id = b.passenger_id
         WHERE b.id = $1
         FOR UPDATE`,
        [bookingId]
      );

      const booking = bookingRes.rows[0];
      if (!booking) {
        throw Object.assign(new Error('Réservation introuvable.'), { statusCode: 404 });
      }

      if (Number(booking.driver_id) !== Number(req.user.id) && !req.user.is_admin) {
        throw Object.assign(new Error('Action non autorisée.'), { statusCode: 403 });
      }

      if (booking.booking_status !== 'pending') {
        throw Object.assign(new Error('Cette demande ne peut plus être acceptée.'), { statusCode: 400 });
      }

      if (booking.booking_mode !== 'manual') {
        throw Object.assign(new Error('Seules les demandes manuelles peuvent être validées.'), { statusCode: 400 });
      }

      if (booking.booking_expires_at && new Date(booking.booking_expires_at).getTime() < Date.now()) {
        throw Object.assign(new Error('Cette demande a expiré.'), { statusCode: 400 });
      }

      const newSeatsReserved = Number(booking.seats_reserved || 0) + Number(booking.booking_seats || 1);
      const updatedRideRes = await client.query(
        `UPDATE covoiturages
         SET seats_reserved = $2,
             seats_remaining = GREATEST(COALESCE(seats_remaining, seats_total) - $3, 0),
             status = CASE
               WHEN GREATEST(COALESCE(seats_remaining, seats_total) - $3, 0) = 0 THEN 'full'
               ELSE status
             END,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [booking.ride_id, newSeatsReserved, Number(booking.booking_seats || 1)]
      );

      await client.query(
        `UPDATE ride_bookings
         SET status = 'accepted',
             responded_at = NOW()
         WHERE id = $1`,
        [bookingId]
      );

      await client.query(
        `UPDATE users
         SET rides_as_passenger = COALESCE(rides_as_passenger, 0) + 1
         WHERE id = $1`,
        [booking.passenger_id]
      );

      return {
        booking,
        ride: updatedRideRes.rows[0] || booking,
        driver: {
          id: booking.driver_id,
          prenom: booking.driver_prenom,
          nom: booking.driver_nom,
          email: booking.driver_email,
          avatar_url: booking.driver_avatar_url,
          trust_score: booking.driver_trust_score,
        },
        passenger: {
          id: booking.passenger_id,
          prenom: booking.passenger_prenom,
          nom: booking.passenger_nom,
          email: booking.passenger_email,
          avatar_url: booking.passenger_avatar_url,
          trust_score: booking.passenger_trust_score,
        },
      };
    });

    const rideLabel = buildRideLabel(result.ride);
    const details = {
      departure: result.ride.departure,
      destination: result.ride.destination,
      ride_date: result.ride.ride_date,
      ride_time: result.ride.ride_time,
      seats: result.booking.booking_seats,
      price_xpf: result.ride.price_xpf,
      driverPrenom: result.driver.prenom,
      passengerPrenom: result.passenger.prenom,
    };

    await createNotification(result.passenger.id, {
      type: 'ride_booking_accepted',
      title: '✅ Réservation acceptée !',
      body: `${result.driver.prenom || 'Le conducteur'} vous attend sur ${rideLabel}`,
      href: '/covoiturage/reservations',
    }).catch(() => {});
    await createNotification(result.driver.id, {
      type: 'ride_booking_accepted_driver',
      title: '✅ Réservation confirmée',
      body: `Vous avez accepté la réservation de ${result.passenger.prenom || 'ce passager'} sur ${rideLabel}`,
      href: '/covoiturage/reservations',
    }).catch(() => {});

    await sendPushToUser(result.passenger.id, {
      title: '✅ Réservation acceptée !',
      body: `${result.driver.prenom || 'Le conducteur'} vous attend.`,
      data: { type: 'ride_booking_accepted', booking_id: result.booking.booking_id, ride_id: result.booking.ride_id },
    }).catch(() => {});
    await sendPushToUser(result.driver.id, {
      title: '✅ Réservation confirmée',
      body: `Vous avez accepté la réservation de ${result.passenger.prenom || 'ce passager'}.`,
      data: { type: 'ride_booking_accepted_driver', booking_id: result.booking.booking_id, ride_id: result.booking.ride_id },
    }).catch(() => {});

    await sendRideBookingAcceptedPassengerEmail(
      result.passenger.email,
      result.passenger.prenom || 'Bonjour',
      details,
      result.passenger.id
    ).catch(() => {});
    await sendRideBookingAcceptedDriverEmail(
      result.driver.email,
      result.driver.prenom || 'Bonjour',
      details,
      result.driver.id
    ).catch(() => {});

    return res.json({ data: { booking_id: bookingId, status: 'accepted' } });
  } catch (err) {
    next(err);
  }
});

router.post('/bookings/:bookingId/refuse', authenticate, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Réservation invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const bookingRes = await client.query(
        `SELECT
           b.id AS booking_id,
           b.ride_id,
           b.passenger_id,
           b.status AS booking_status,
           b.booking_mode,
           b.message AS booking_message,
           b.seats AS booking_seats,
           b.expires_at AS booking_expires_at,
           c.id AS ride_id,
           c.user_id AS driver_id,
           c.departure,
           c.destination,
           c.ride_date,
           c.ride_time,
           c.price_xpf,
           d.prenom AS driver_prenom,
           d.email AS driver_email,
           p.prenom AS passenger_prenom,
           p.email AS passenger_email
         FROM ride_bookings b
         JOIN covoiturages c ON c.id = b.ride_id
         JOIN users d ON d.id = c.user_id
         JOIN users p ON p.id = b.passenger_id
         WHERE b.id = $1
         FOR UPDATE`,
        [bookingId]
      );

      const booking = bookingRes.rows[0];
      if (!booking) {
        throw Object.assign(new Error('Réservation introuvable.'), { statusCode: 404 });
      }

      if (Number(booking.driver_id) !== Number(req.user.id) && !req.user.is_admin) {
        throw Object.assign(new Error('Action non autorisée.'), { statusCode: 403 });
      }

      if (booking.booking_status !== 'pending') {
        throw Object.assign(new Error('Cette demande ne peut plus être refusée.'), { statusCode: 400 });
      }

      await client.query(
        `UPDATE ride_bookings
         SET status = 'refused',
             responded_at = NOW()
         WHERE id = $1`,
        [bookingId]
      );

      return booking;
    });

    await createNotification(result.passenger_id, {
      type: 'ride_booking_refused',
      title: '❌ Proposition refusée',
      body: `${result.driver_prenom || 'Le conducteur'} n'a pas pu accepter votre demande.`,
      href: '/covoiturage/reservations',
    }).catch(() => {});

    await sendPushToUser(result.passenger_id, {
      title: '❌ Proposition refusée',
      body: `${result.driver_prenom || 'Le conducteur'} n'a pas pu accepter votre demande.`,
      data: { type: 'ride_booking_refused', booking_id: result.booking_id, ride_id: result.ride_id },
    }).catch(() => {});

    return res.json({ data: { booking_id: bookingId, status: 'refused' } });
  } catch (err) {
    next(err);
  }
});

router.post('/bookings/:bookingId/cancel', authenticate, async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({ error: 'Réservation invalide.' });
    }

    const result = await withTransaction(async (client) => {
      const bookingRes = await client.query(
        `SELECT
           b.id AS booking_id,
           b.ride_id,
           b.passenger_id,
           b.status AS booking_status,
           b.booking_mode,
           b.seats AS booking_seats,
           c.user_id AS driver_id,
           c.departure,
           c.destination,
           c.ride_date,
           c.ride_time,
           c.price_xpf,
           c.seats_total,
           c.seats_reserved,
           c.seats_remaining,
           d.prenom AS driver_prenom,
           d.email AS driver_email,
           p.prenom AS passenger_prenom,
           p.email AS passenger_email
         FROM ride_bookings b
         JOIN covoiturages c ON c.id = b.ride_id
         JOIN users d ON d.id = c.user_id
         JOIN users p ON p.id = b.passenger_id
         WHERE b.id = $1
         FOR UPDATE`,
        [bookingId]
      );

      const booking = bookingRes.rows[0];
      if (!booking) {
        throw Object.assign(new Error('Réservation introuvable.'), { statusCode: 404 });
      }

      const isParticipant = Number(booking.driver_id) === Number(req.user.id) || Number(booking.passenger_id) === Number(req.user.id);
      if (!isParticipant && !req.user.is_admin) {
        throw Object.assign(new Error('Action non autorisée.'), { statusCode: 403 });
      }

      if (booking.booking_status === 'cancelled') {
        throw Object.assign(new Error('Cette réservation est déjà annulée.'), { statusCode: 400 });
      }

      const shouldRestoreSeats = ['auto_confirmed', 'accepted'].includes(booking.booking_status);
      if (shouldRestoreSeats) {
        const restoredSeats = Number(booking.booking_seats || 1);
        await client.query(
          `UPDATE covoiturages
           SET seats_reserved = GREATEST(COALESCE(seats_reserved, 0) - $2, 0),
               seats_remaining = LEAST(COALESCE(seats_remaining, seats_total) + $2, seats_total),
               status = 'published',
               updated_at = NOW()
           WHERE id = $1`,
          [booking.ride_id, restoredSeats]
        );
      }

      await client.query(
        `UPDATE ride_bookings
         SET status = 'cancelled',
             responded_at = COALESCE(responded_at, NOW())
         WHERE id = $1`,
        [bookingId]
      );

      return booking;
    });

    const otherUserId = Number(result.driver_id) === Number(req.user.id) ? result.passenger_id : result.driver_id;
    const otherUserName = Number(result.driver_id) === Number(req.user.id)
      ? result.passenger_prenom
      : result.driver_prenom;

    await createNotification(otherUserId, {
      type: 'ride_booking_cancelled',
      title: 'Réservation annulée',
      body: `${otherUserName || 'Votre interlocuteur'} a annulé la réservation.`,
      href: '/covoiturage/reservations',
    }).catch(() => {});

    await sendPushToUser(otherUserId, {
      title: 'Réservation annulée',
      body: `${otherUserName || 'Votre interlocuteur'} a annulé la réservation.`,
      data: { type: 'ride_booking_cancelled', booking_id: result.booking_id, ride_id: result.ride_id },
    }).catch(() => {});

    return res.json({ data: { booking_id: bookingId, status: 'cancelled' } });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const rideRes = await query(`SELECT id, user_id, status FROM covoiturages WHERE id = $1`, [req.params.id]);
    const ride = rideRes.rows[0];

    if (!ride) return res.status(404).json({ error: 'Trajet introuvable.' });
    if (ride.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Action non autorisee.' });
    }

    const updated = await query(
      `UPDATE covoiturages
       SET status = 'cancelled',
           seats_reserved = 0,
           seats_remaining = seats_total,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    await query(
      `UPDATE ride_bookings
       SET status = 'cancelled', responded_at = COALESCE(responded_at, NOW())
       WHERE ride_id = $1 AND status IN ('pending', 'auto_confirmed', 'accepted')`,
      [req.params.id]
    );

    logger.info('covoiturage_cancelled', { user_id: req.user.id, covoiturage_id: Number(req.params.id) });

    return res.json({ data: mapRide(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const { error, value } = reviewSchema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const rideRes = await query(`SELECT id, user_id, status FROM covoiturages WHERE id = $1`, [req.params.id]);
    const ride = rideRes.rows[0];
    if (!ride) return res.status(404).json({ error: 'Trajet introuvable.' });

    const bookingRes = await query(
      `SELECT id, passenger_id FROM ride_bookings WHERE id = $1 AND ride_id = $2`,
      [value.booking_id || 0, req.params.id]
    );
    const booking = bookingRes.rows[0] || null;
    const canReview = Number(ride.user_id) === Number(req.user.id) || (booking && Number(booking.passenger_id) === Number(req.user.id));
    if (!canReview) {
      return res.status(403).json({ error: 'Seuls les participants au trajet peuvent laisser un avis.' });
    }

    const inserted = await query(
      `INSERT INTO covoiturage_reviews
         (covoiturage_id, booking_id, reviewer_id, target_user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.params.id,
        value.booking_id || null,
        req.user.id,
        value.target_user_id,
        value.rating,
        value.comment?.trim() || null,
      ]
    );

    logger.info('covoiturage_review_created', { user_id: req.user.id, covoiturage_id: Number(req.params.id) });

    return res.status(201).json({ data: inserted.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

````

## PATH: backend/src/routes/bonPlans.route.js
````
'use strict';

const express = require('express');
const Joi = require('joi');
const Stripe = require('stripe');

const { query, withTransaction } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { paymentLimiter } = require('../middleware/rateLimit');
const { isConfiguredValue } = require('../config/env');
const payplug = require('../services/payplugService');
const { ensureStripe, getOrCreateStripeCustomer } = require('../services/paymentHelpers');
const { xpfToEurCents, formatXpfEur } = require('../services/paymentCatalog');
const { getRedisClient } = require('../config/redis');
const statsRouter = require('./stats.route');
const {
  activateBonPlanFromPayment,
  getBonPlanPricing,
  recordBonPlanView,
  normalizeBusinessName,
  slugifyBusinessName,
  formatXpf,
} = require('../services/bonPlansService');

const router = express.Router();

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const demoModeEnabled = process.env.DEMO_MODE === 'true';
const stripe = isConfiguredValue(process.env.STRIPE_SECRET_KEY)
  ? new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: '2023-10-16' })
  : null;

const CATEGORY_VALUES = [
  'alimentation',
  'mode',
  'beaute',
  'high_tech',
  'auto_moto',
  'maison',
  'restauration',
  'services',
  'sport',
  'voyages',
  'autre',
];

const createSchema = Joi.object({
  business_name: Joi.string().min(2).max(255).optional().allow('', null),
  business_logo_url: Joi.string().uri().optional().allow('', null),
  catalog_pdf_url: Joi.string().uri().optional().allow('', null),
  catalog_pdf_pages: Joi.number().integer().min(1).optional().allow(null),
  title: Joi.string().min(3).max(150).required(),
  description: Joi.string().min(10).max(500).required(),
  image_url: Joi.string().uri().optional().allow('', null),
  promo_label: Joi.string().max(80).optional().allow('', null),
  original_price_xpf: Joi.number().integer().min(0).optional().allow(null),
  promo_price_xpf: Joi.number().integer().min(0).optional().allow(null),
  cta_label: Joi.string().max(60).optional().allow('', null),
  cta_url: Joi.string().uri().optional().allow('', null),
  category: Joi.string().valid(...CATEGORY_VALUES).optional().allow('', null),
  promo_valid_from: Joi.string().isoDate().optional().allow('', null),
  promo_valid_until: Joi.string().isoDate().optional().allow('', null),
  duration_days: Joi.number().integer().valid(3, 7, 30).required(),
  payment_provider: Joi.string().valid('stripe', 'payplug').default('stripe'),
  contact_email: Joi.string().email().max(255).required(),
  contact_name: Joi.string().max(120).optional().allow('', null),
  contact_phone: Joi.string().max(30).optional().allow('', null),
  website_url: Joi.string().uri().optional().allow('', null),
  link_url: Joi.string().uri().optional().allow('', null),
  location_name: Joi.string().max(120).optional().allow('', null),
  event_date: Joi.string().isoDate().optional().allow('', null),
  conditions: Joi.string().max(500).optional().allow('', null),
  opening_hours: Joi.string().max(255).optional().allow('', null),
  photos: Joi.array().items(Joi.string().uri().allow('', null)).max(12).default([]),
  social_links: Joi.object().unknown(true).default({}),
  kind: Joi.string().valid('promo', 'event', 'concert', 'other').optional(),
  target_audience: Joi.string().valid('particulier', 'pro').optional(),
  commune_id: Joi.number().integer().optional().allow(null),
});

const prefsSchema = Joi.object({
  notify_all: Joi.boolean().optional(),
  notify_categories: Joi.array().items(Joi.string().valid(...CATEGORY_VALUES)).optional(),
  notify_businesses: Joi.array().items(Joi.string().min(1).max(255)).optional(),
  via_push: Joi.boolean().optional(),
  via_email: Joi.boolean().optional(),
});

function mapLegacyCategory(kind) {
  switch (String(kind || '').trim()) {
    case 'event':
      return 'voyages';
    case 'concert':
      return 'culture';
    case 'promo':
    case 'other':
    default:
      return 'services';
  }
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function cleanDisplayText(value, fallback = '') {
  const text = String(value ?? '')
    .replace(/\bundefined\b/gi, '')
    .replace(/\bnull\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+—\s*$/, '')
    .trim();
  return text.length > 0 ? text : fallback;
}

function normalizePreviewBusinessName(body, user) {
  return normalizeBusinessName(body.business_name || body.contact_name || `${user.prenom || ''} ${user.nom || ''}`.trim() || body.title);
}

function encodeCursor(row) {
  if (!row) return null;
  return Buffer.from(JSON.stringify({ published_from: row.published_from, id: row.id })).toString('base64url');
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const decoded = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf8'));
    if (!decoded?.published_from || !decoded?.id) return null;
    return decoded;
  } catch {
    return null;
  }
}

function serializeBonPlan(row) {
  const pricing = getBonPlanPricing(Number(row.duration_days || 7), Boolean(row.user_is_pro));
  const promoPrice = row.amount_xpf ?? row.promo_price_xpf ?? pricing.final_price_xpf;
  const originalPrice = row.original_price_xpf ?? row.normal_price_xpf ?? pricing.original_price_xpf;
  const photos = Array.isArray(row.photos)
    ? row.photos
    : (() => {
        try {
          return row.photos ? JSON.parse(row.photos) : [];
        } catch {
          return [];
        }
      })();

  return {
    id: row.id,
    business_id: row.business_id ?? null,
    business_name: cleanDisplayText(row.business_name, cleanDisplayText(row.title, 'Kalico')),
    business_logo_url: row.business_logo_url ?? null,
    catalog_pdf_url: row.catalog_pdf_url ?? null,
    catalog_pdf_pages: row.catalog_pdf_pages == null ? null : Number(row.catalog_pdf_pages),
    business_badge: row.business_badge || row.badge || 'none',
    business_review_avg: row.business_review_avg ?? row.review_avg ?? 0,
    business_review_count: row.business_review_count ?? row.review_count ?? 0,
    user_id: row.user_id ?? null,
    title: cleanDisplayText(row.title, 'Bon plan local'),
    description: cleanDisplayText(row.description, 'Découvrez cette offre locale.'),
    image_url: row.image_url ?? null,
    promo_label: row.promo_label ?? null,
    original_price_xpf: originalPrice ?? null,
    promo_price_xpf: row.promo_price_xpf ?? null,
    cta_label: row.cta_label || 'En profiter',
    cta_url: row.cta_url || row.link_url || row.website_url || null,
    category: row.category || mapLegacyCategory(row.kind),
    promo_valid_from: row.promo_valid_from ?? null,
    promo_valid_until: row.promo_valid_until ?? null,
    published_from: row.published_from ?? row.created_at,
    published_until: row.published_until ?? row.expires_at ?? null,
    duration_days: Number(row.duration_days || 7),
    payment_provider: row.payment_provider ?? null,
    payment_intent_id: row.payment_intent_id ?? null,
    amount_xpf: row.amount_xpf ?? promoPrice,
    amount_eur: row.amount_eur ?? null,
    paid_at: row.paid_at ?? null,
    status: row.status,
    view_count: Number(row.view_count || 0),
    click_count: Number(row.click_count || 0),
    price_xpf: promoPrice,
    price_display: promoPrice ? formatXpfEur(Number(promoPrice)) : null,
    is_free_included: Boolean(row.is_free_included),
    normal_price_xpf: originalPrice ?? null,
    discount_pct: row.discount_pct ?? pricing.discount_pct,
    contact_name: cleanDisplayText(row.contact_name, null),
    contact_phone: row.contact_phone ?? null,
    contact_email: row.contact_email ?? null,
    website_url: row.website_url ?? null,
    link_url: row.link_url ?? null,
    social_links: row.social_links ?? {},
    opening_hours: row.opening_hours ?? null,
    photos,
    location_name: cleanDisplayText(row.location_name, null),
    commune_name: cleanDisplayText(row.commune_name, null),
    event_date: row.event_date ?? null,
    author_id: row.author_id ?? null,
    author_prenom: row.author_prenom ?? null,
    author_nom: row.author_nom ?? null,
    author_is_pro: Boolean(row.author_is_pro),
    kind: row.kind || 'promo',
    target_audience: row.target_audience || (row.business_name ? 'pro' : 'particulier'),
  };
}

async function queryBonPlans(filters = {}) {
  const {
    limit = 12,
    after = null,
    offset = null,
    q = '',
    category = '',
    business_name = '',
    kind = '',
    target_audience = '',
  } = filters;

  const params = [];
  const where = [`bp.status = 'active'`, `bp.published_until > NOW()`];

  if (kind) {
    const kinds = String(kind)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (kinds.length) {
      params.push(kinds);
      where.push(`bp.kind = ANY($${params.length}::text[])`);
    }
  }

  if (target_audience) {
    params.push(target_audience);
    where.push(`bp.target_audience = $${params.length}`);
  }

  if (category) {
    params.push(String(category).trim().toLowerCase());
    where.push(`LOWER(COALESCE(bp.category, 'autre')) = $${params.length}`);
  }

  if (business_name) {
    params.push(`%${String(business_name).trim()}%`);
    where.push(`(bp.business_name ILIKE $${params.length} OR b.name ILIKE $${params.length})`);
  }

  if (q) {
    params.push(`%${String(q).trim()}%`);
    where.push(`(
      bp.title ILIKE $${params.length}
      OR bp.description ILIKE $${params.length}
      OR bp.business_name ILIKE $${params.length}
      OR bp.contact_name ILIKE $${params.length}
      OR b.name ILIKE $${params.length}
    )`);
  }

  const countParams = [...params];

  const cursor = decodeCursor(after);
  if (cursor?.published_from && cursor?.id) {
    params.push(cursor.published_from);
    params.push(cursor.id);
    where.push(`(bp.published_from, bp.id) < ($${params.length - 1}::timestamptz, $${params.length}::int)`);
  }

  if (offset !== null && Number.isFinite(Number(offset)) && Number(offset) > 0) {
    params.push(Number(offset));
  }

  const queryParams = [...params];
  queryParams.push(Math.min(24, Math.max(1, Number(limit) || 12)));

  const listQuery = `
    SELECT
      bp.id,
      bp.user_id,
      bp.business_id,
      bp.business_name,
      bp.business_logo_url,
      bp.catalog_pdf_url,
      bp.catalog_pdf_pages,
      bp.title,
      bp.description,
      bp.image_url,
      bp.promo_label,
      bp.original_price_xpf,
      bp.normal_price_xpf,
      bp.promo_price_xpf,
      bp.cta_label,
      bp.cta_url,
      bp.category,
      bp.promo_valid_from,
      bp.promo_valid_until,
      bp.published_from,
      bp.published_until,
      bp.duration_days,
      bp.payment_provider,
      bp.payment_intent_id,
      bp.amount_xpf,
      bp.amount_eur,
      bp.paid_at,
      bp.status,
      bp.view_count,
      bp.click_count,
      bp.kind,
      bp.target_audience,
      bp.location_name,
      bp.event_date,
      bp.link_url,
      bp.price_xpf,
      bp.is_free_included,
      bp.discount_pct,
      bp.conditions,
      bp.contact_name,
      bp.contact_phone,
      bp.contact_email,
      bp.website_url,
      bp.social_links,
      bp.opening_hours,
      bp.photos,
      bp.commune_id,
      com.name AS commune_name,
      u.id AS author_id,
      u.prenom AS author_prenom,
      u.nom AS author_nom,
      CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS author_is_pro,
      b.badge AS business_badge,
      b.review_avg AS business_review_avg,
      b.review_count AS business_review_count
    FROM bon_plans bp
    LEFT JOIN users u ON u.id = bp.user_id
    LEFT JOIN communes com ON com.id = bp.commune_id
    LEFT JOIN businesses b ON b.id = bp.business_id
    WHERE ${where.join(' AND ')}
    ORDER BY bp.published_from DESC, bp.id DESC
    LIMIT $${queryParams.length}
    ${offset !== null && Number.isFinite(Number(offset)) && Number(offset) > 0 ? `OFFSET $${queryParams.length - 1}` : ''}
  `;

  const totalQuery = `
    SELECT COUNT(*)::int AS total
    FROM bon_plans bp
    LEFT JOIN businesses b ON b.id = bp.business_id
    WHERE ${where.join(' AND ')}
  `;

  return { listQuery, totalQuery, listParams: queryParams, countParams };
}

async function createPaymentForBonPlan({ user, bonPlan, provider, amountXpf, amountEur, durationDays }) {
  const metadata = {
    payment_type: 'bon_plan',
    bon_plan_id: String(bonPlan.id),
    user_id: String(user.id),
    business_name: bonPlan.business_name,
    category: bonPlan.category,
    duration_days: String(durationDays),
    amount_xpf: String(amountXpf),
    amount_eur: String(amountEur),
  };

  if (demoModeEnabled) {
    await query(
      `UPDATE bon_plans
       SET status = 'active',
           paid_at = NOW(),
           payment_provider = $2,
           amount_xpf = $3,
           amount_eur = $4,
           published_from = COALESCE(published_from, NOW()),
           published_until = NOW() + make_interval(days => duration_days),
           updated_at = NOW()
       WHERE id = $1`,
      [bonPlan.id, provider, amountXpf, amountEur]
    );

    return {
      checkout_url: `${baseUrl}/bons-plans/${bonPlan.id}?demo=1`,
      demo: true,
      success: true,
      message: 'Paiement simule',
      provider,
    };
  }

  if (provider === 'payplug') {
    if (!payplug.isPayPlugConfigured()) {
      throw Object.assign(new Error('PayPlug non configure'), { status: 503 });
    }

    const payment = await payplug.createPayment({
      amount_xpf: amountXpf,
      description: `${bonPlan.title} — ${bonPlan.business_name}`,
      email: user.email,
      first_name: user.prenom || 'Client',
      last_name: user.nom || 'Kalico',
      return_url: `${baseUrl}/bons-plans/publier?payment_id={PAYPLUG_PAYMENT_ID}&provider=payplug`,
      cancel_url: `${baseUrl}/bons-plans/publier?cancelled=1`,
      metadata,
    });

    await query(
      `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
       VALUES ($1, 'bon_plan', 'payplug', $2, $3, 'pending', $4)`,
      [user.id, payment.id, amountXpf, JSON.stringify(metadata)]
    );

    return { checkout_url: payment.hosted_payment.payment_url, payment_id: payment.id, provider };
  }

  if (!stripe) {
    throw Object.assign(new Error('Stripe non configure'), { status: 503 });
  }

  const customerId = await getOrCreateStripeCustomer(stripe, user.id, user.email);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    success_url: `${baseUrl}/bons-plans/publier?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
    cancel_url: `${baseUrl}/bons-plans/publier?cancelled=1`,
    metadata,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: xpfToEurCents(amountXpf),
          product_data: {
            name: `${bonPlan.title} — ${bonPlan.business_name}`,
            description: bonPlan.description.slice(0, 200),
          },
        },
      },
    ],
  });

  await query(
    `INSERT INTO payments (user_id, type, provider, provider_ref, amount_xpf, status, metadata)
     VALUES ($1, 'bon_plan', 'stripe', $2, $3, 'pending', $4)`,
    [user.id, session.id, amountXpf, JSON.stringify(metadata)]
  );

  return { checkout_url: session.url, payment_id: session.id, provider };
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(24, Math.max(1, Number(req.query.limit || 12)));
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || req.query.cat || '').trim();
    const businessName = String(req.query.business_name || '').trim();
    const kind = String(req.query.kind || '').trim();
    const targetAudience = String(req.query.target_audience || '').trim();
    const after = String(req.query.after || '').trim();
    const offset = req.query.page ? Math.max(0, (Number(req.query.page) - 1) * limit) : null;

    const { listQuery, totalQuery, listParams, countParams } = await queryBonPlans({
      limit,
      after,
      offset,
      q,
      category,
      business_name: businessName,
      kind,
      target_audience: targetAudience,
    });

    const [listResult, totalResult] = await Promise.all([
      query(listQuery, listParams),
      query(totalQuery, countParams),
    ]);

    const data = listResult.rows.map(serializeBonPlan);
    return res.json({
      data,
      nextCursor: data.length ? encodeCursor(listResult.rows[listResult.rows.length - 1]) : null,
      total: Number(totalResult.rows[0]?.total ?? 0),
      pagination: {
        total: Number(totalResult.rows[0]?.total ?? 0),
        limit,
        offset: offset ?? 0,
        has_more: data.length === limit,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/businesses', optionalAuth, async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT name, slug, logo_url AS business_logo_url, badge AS business_badge
       FROM businesses
       WHERE name IS NOT NULL AND name <> ''
       ORDER BY bon_plan_count DESC, name ASC
       LIMIT 100`
    ).catch(async () => ({ rows: [] }));

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/meta/businesses', optionalAuth, async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT name, slug, logo_url AS business_logo_url, badge AS business_badge
       FROM businesses
       WHERE name IS NOT NULL AND name <> ''
       ORDER BY bon_plan_count DESC, name ASC
       LIMIT 100`
    ).catch(async () => ({ rows: [] }));

    return res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/notifications/prefs', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT user_id, notify_all, notify_categories, notify_businesses, via_push, via_email
       FROM bon_plan_notification_prefs
       WHERE user_id = $1`,
      [req.user.id]
    );

    return res.json({
      data: rows[0] ?? {
        user_id: req.user.id,
        notify_all: false,
        notify_categories: [],
        notify_businesses: [],
        via_push: true,
        via_email: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/notifications/prefs', authenticate, validate({ body: prefsSchema }), async (req, res, next) => {
  try {
    const body = req.body || {};
    const notifyCategories = Array.isArray(body.notify_categories)
      ? body.notify_categories.map((value) => String(value).trim().toLowerCase()).filter(Boolean)
      : null;
    const notifyBusinesses = Array.isArray(body.notify_businesses)
      ? body.notify_businesses.map((value) => String(value).trim().toLowerCase()).filter(Boolean)
      : null;

    const result = await query(
      `INSERT INTO bon_plan_notification_prefs
         (user_id, notify_all, notify_categories, notify_businesses, via_push, via_email, updated_at)
       VALUES ($1, COALESCE($2, FALSE), COALESCE($3, '{}'), COALESCE($4, '{}'), COALESCE($5, TRUE), COALESCE($6, FALSE), NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         notify_all = COALESCE(EXCLUDED.notify_all, bon_plan_notification_prefs.notify_all),
         notify_categories = COALESCE(EXCLUDED.notify_categories, bon_plan_notification_prefs.notify_categories),
         notify_businesses = COALESCE(EXCLUDED.notify_businesses, bon_plan_notification_prefs.notify_businesses),
         via_push = COALESCE(EXCLUDED.via_push, bon_plan_notification_prefs.via_push),
         via_email = COALESCE(EXCLUDED.via_email, bon_plan_notification_prefs.via_email),
         updated_at = NOW()
       RETURNING user_id, notify_all, notify_categories, notify_businesses, via_push, via_email`,
      [
        req.user.id,
        body.notify_all,
        notifyCategories,
        notifyBusinesses,
        body.via_push,
        body.via_email,
      ]
    );

    return res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Bon plan invalide.' });
    }

    await recordBonPlanView(id).catch(() => {});

    const result = await query(
      `SELECT
         bp.id,
         bp.user_id,
         bp.business_id,
      bp.business_name,
      bp.business_logo_url,
      bp.catalog_pdf_url,
      bp.catalog_pdf_pages,
      bp.title,
         bp.description,
         bp.image_url,
         bp.promo_label,
         bp.original_price_xpf,
         bp.normal_price_xpf,
         bp.promo_price_xpf,
         bp.cta_label,
         bp.cta_url,
         bp.category,
         bp.promo_valid_from,
         bp.promo_valid_until,
         bp.published_from,
         bp.published_until,
         bp.duration_days,
         bp.payment_provider,
         bp.payment_intent_id,
         bp.amount_xpf,
         bp.amount_eur,
         bp.paid_at,
         bp.status,
         bp.view_count,
         bp.click_count,
         bp.kind,
         bp.target_audience,
         bp.location_name,
         bp.event_date,
         bp.link_url,
         bp.price_xpf,
         bp.is_free_included,
         bp.discount_pct,
         bp.conditions,
         bp.contact_name,
         bp.contact_phone,
         bp.contact_email,
         bp.website_url,
         bp.social_links,
         bp.opening_hours,
         bp.photos,
         bp.commune_id,
         com.name AS commune_name,
         u.id AS author_id,
         u.prenom AS author_prenom,
         u.nom AS author_nom,
         CASE WHEN u.is_pro = TRUE AND (u.pro_expires_at IS NULL OR u.pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS author_is_pro,
         b.badge AS business_badge,
         b.review_avg AS business_review_avg,
         b.review_count AS business_review_count
       FROM bon_plans bp
       LEFT JOIN users u ON u.id = bp.user_id
       LEFT JOIN communes com ON com.id = bp.commune_id
       LEFT JOIN businesses b ON b.id = bp.business_id
       WHERE bp.id = $1
         AND bp.status = 'active'
         AND bp.published_until > NOW()
       LIMIT 1`,
      [id]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Bon plan introuvable.' });
    }

    return res.json({ data: serializeBonPlan(row) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/click', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Bon plan invalide.' });
    }

    await query(
      `UPDATE bon_plans SET click_count = click_count + 1, updated_at = NOW()
       WHERE id = $1`,
      [id]
    ).catch(() => {});

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, paymentLimiter, validate({ body: createSchema }), async (req, res, next) => {
  try {
    const value = req.body || {};
    const isPro = Boolean(req.user?.is_pro && (req.user?.pro_plan === 'pro' || req.user?.pro_plan == null || req.user?.pro_expires_at == null || new Date(req.user.pro_expires_at) > new Date()));
    const durationDays = Number(value.duration_days) === 3 ? 7 : Number(value.duration_days);
    const pricing = getBonPlanPricing(durationDays, isPro);
    const paymentProvider = String(value.payment_provider || 'stripe');
    const businessName = normalizeBusinessName(value.business_name || value.contact_name || value.title);
    const category = String(value.category || mapLegacyCategory(value.kind)).trim().toLowerCase();
    const publishedUntil = new Date(Date.now() + durationDays * 86400_000);

    const payload = {
      user_id: req.user.id,
      business_name: businessName,
      business_logo_url: value.business_logo_url || null,
      title: value.title.trim(),
      description: value.description.trim(),
      image_url: value.image_url || null,
      promo_label: value.promo_label?.trim() || null,
      original_price_xpf: toNumberOrNull(value.original_price_xpf ?? value.normal_price_xpf) ?? pricing.original_price_xpf,
      promo_price_xpf: toNumberOrNull(value.promo_price_xpf) ?? pricing.final_price_xpf,
      cta_label: value.cta_label?.trim() || 'En profiter',
      cta_url: value.cta_url?.trim() || value.link_url?.trim() || value.website_url?.trim() || null,
      category,
      promo_valid_from: toDateOrNull(value.promo_valid_from),
      promo_valid_until: toDateOrNull(value.promo_valid_until),
      commune_id: value.commune_id ?? null,
      location_name: value.location_name?.trim() || null,
      event_date: toDateOrNull(value.event_date),
      duration_days: durationDays,
      payment_provider: paymentProvider,
      contact_name: value.contact_name?.trim() || null,
      contact_phone: value.contact_phone?.trim() || null,
      contact_email: value.contact_email?.trim() || req.user.email,
      website_url: value.website_url?.trim() || null,
      conditions: value.conditions?.trim() || null,
      opening_hours: value.opening_hours?.trim() || null,
      photos: JSON.stringify(Array.isArray(value.photos) ? value.photos.filter(Boolean) : []),
      social_links: JSON.stringify(value.social_links || {}),
      status: 'draft',
      published_from: new Date(),
      published_until: publishedUntil,
      amount_xpf: pricing.final_price_xpf,
      amount_eur: Math.round(pricing.final_price_xpf / 119.3317),
    };

    const created = await withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO bon_plans
           (user_id, business_name, business_logo_url, catalog_pdf_url, catalog_pdf_pages, title, description, image_url, promo_label, original_price_xpf, promo_price_xpf, cta_label, cta_url,
            category, promo_valid_from, promo_valid_until, commune_id, location_name, event_date, duration_days, payment_provider, contact_name, contact_phone,
            contact_email, website_url, conditions, opening_hours, photos, social_links, status, published_from, published_until, amount_xpf, amount_eur)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
            $12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
            $22,$23,$24,$25,$26,$27::jsonb,$28::jsonb,$29,$30,$31,$32,$33,$34)
         RETURNING *`,
        [
          payload.user_id,
          payload.business_name,
          payload.business_logo_url,
          payload.catalog_pdf_url,
          payload.catalog_pdf_pages,
          payload.title,
          payload.description,
          payload.image_url,
          payload.promo_label,
          payload.original_price_xpf,
          payload.promo_price_xpf,
          payload.cta_label,
          payload.cta_url,
          payload.category,
          payload.promo_valid_from,
          payload.promo_valid_until,
          payload.commune_id,
          payload.location_name,
          payload.event_date,
          payload.duration_days,
          payload.payment_provider,
          payload.contact_name,
          payload.contact_phone,
          payload.contact_email,
          payload.website_url,
          payload.conditions,
          payload.opening_hours,
          payload.photos,
          payload.social_links,
          payload.status,
          payload.published_from,
          payload.published_until,
          payload.amount_xpf,
          payload.amount_eur,
        ]
      );

      const bonPlan = inserted.rows[0];
      if (!bonPlan) throw new Error('Impossible de creer le bon plan');

      const payment = await createPaymentForBonPlan({
        user: req.user,
        bonPlan,
        provider: paymentProvider,
        amountXpf: pricing.final_price_xpf,
        amountEur: payload.amount_eur,
        durationDays,
      });

      if (!demoModeEnabled) {
        await client.query(
          `UPDATE bon_plans
           SET payment_intent_id = $2,
               updated_at = NOW()
           WHERE id = $1`,
          [bonPlan.id, payment.payment_id || payment.checkout_url || `pending_${bonPlan.id}`]
        );
      } else {
        await client.query(
          `UPDATE bon_plans
           SET status = 'active',
               paid_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [bonPlan.id]
        );
      }

      return { bonPlan: { ...bonPlan, ...payload }, payment, pricing };
    });

    if (statsRouter.invalidateCache) {
      await statsRouter.invalidateCache('home');
    }

    return res.status(201).json({
      data: {
        id: created.bonPlan.id,
        payment_url: created.payment.checkout_url,
        checkout_url: created.payment.checkout_url,
        payment_provider: paymentProvider,
        demo: Boolean(created.payment.demo),
        success: Boolean(created.payment.success),
        message: created.payment.message || null,
        pricing: created.pricing,
        bon_plan: serializeBonPlan({
          ...created.bonPlan,
          amount_xpf: created.pricing.final_price_xpf,
          amount_eur: Math.round(created.pricing.final_price_xpf / 119.3317),
          status: demoModeEnabled ? 'active' : 'draft',
        }),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

````

## PATH: backend/src/routes/demo.route.js
````
'use strict';

const express = require('express');
const {
  clearDemoDataset,
  getDemoStatus,
  seedDemoDataset,
} = require('../services/demoSeedService');

const router = express.Router();

function isLocalDemoEnabled() {
  return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
}

router.use((req, res, next) => {
  if (!isLocalDemoEnabled()) {
    return res.status(404).json({ error: 'Route introuvable.' });
  }
  next();
});

router.get('/status', async (_req, res, next) => {
  try {
    const status = await getDemoStatus();
    res.json({ data: status });
  } catch (err) {
    next(err);
  }
});

router.post('/seed', async (_req, res, next) => {
  try {
    const summary = await seedDemoDataset();
    res.json({
      message: 'Jeu de données démo généré.',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/seed', async (_req, res, next) => {
  try {
    const summary = await clearDemoDataset();
    res.json({
      message: 'Jeu de données démo supprimé.',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

````

## PATH: backend/src/worker.js
````
'use strict';

const { checkConnection } = require('./config/database');
const { startAllJobs } = require('./jobs/scheduler');
const { logger } = require('./utils/logger');
const {
  recordError,
  registerObservabilityInstance,
  stopObservabilityHeartbeat,
} = require('./services/observability');

async function start() {
  try {
    await checkConnection();
    logger.info('worker_db_connection_ok');
  } catch (err) {
    recordError({ source: 'worker', message: err.message, error_code: err.code ?? null });
    logger.error('worker_db_connection_failed', { error: err });
    process.exit(1);
  }

  startAllJobs();
  void registerObservabilityInstance('worker');
  logger.info('worker_started');

  const shutdown = (signal) => {
    logger.info('worker_shutdown_signal', { signal });
    stopObservabilityHeartbeat();
    setTimeout(() => process.exit(0), 0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    recordError({ source: 'worker', type: 'uncaughtException', message: error.message });
    logger.error('worker_uncaught_exception', { error });
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    recordError({ source: 'worker', type: 'unhandledRejection', message: String(reason) });
    logger.error('worker_unhandled_rejection', { reason });
  });
}

start();

````

## PATH: backend/src/jobs/scheduler.js
````
﻿'use strict';

// ============================================================
//  Kalico â€” Jobs planifiÃ©s (node-cron)
//  â€¢ Expiration des boosts payÃ©s
//  â€¢ Envoi des alertes de recherche (daily + weekly)
//  â€¢ Matching immediate des nouvelles annonces
// ============================================================

const cron                = require('node-cron');
const { query }           = require('../config/database');
const {
  sendAlertEmail,
  sendPerformanceReportEmail,
  sendListingExpiringEmail,
  sendListingExpiredEmail,
  sendProBookingReminderEmail,
  sendRideReviewReminderEmail,
} = require('../services/emailService');
const { sendMail }        = require('../services/emailService');
const {
  notifyListingExpiring,
  notifyListingExpired,
  notifySearchAlert,
  notifyPerformanceReport,
} = require('../services/notificationService');
const { createNotification } = require('../services/notificationService');
const { sendPushToUser, sendPushToUsers } = require('../services/pushService');
const { getJson, setJson, withLock } = require('../services/sharedCache');
const { drainTrocMatchingQueue, rememberTrocSignal } = require('../services/trocQueueService');
const { detectTrocCycles, listingMatchesNeed } = require('../services/trocService');
const { logger }          = require('../utils/logger');
const { recordJob }       = require('../services/observability');
const { flushBonPlanViews } = require('../services/bonPlansService');
const {
  autoSelectWeeklyBonPlans,
  expireCampaignsAndActivateQueued,
  notifyWeeklyBonPlanSelectionReminder,
} = require('../services/campaignsService');
const { checkAdminAlerts } = require('../services/adminAlerts');
const { ensureNotificationPreferences } = require('../services/notificationPreferencesService');
const { sendNewsletterBatch } = require('../services/newsletterService');
const { ticketExpiry, importCleanup } = require('../cron');

async function runSingletonJob(lockName, ttlMs, task) {
  const started = await withLock(lockName, ttlMs, async () => {
    await task();
    return true;
  });
  if (!started) {
    recordJob('skipped', { lock_name: lockName });
    logger.info('cron_skip_locked', { lock_name: lockName });
  }
}

function formatUserName(firstName, lastName) {
  return `${firstName || ''} ${lastName || ''}`.trim() || 'Un utilisateur';
}

function formatXpf(amount) {
  return `${Number(amount || 0).toLocaleString('fr-FR')} XPF`;
}

function getPerformanceWindowDays(frequency) {
  switch (String(frequency || '').toLowerCase()) {
    case 'daily':
      return 1;
    case 'monthly':
      return 30;
    case 'weekly':
    default:
      return 7;
  }
}

function getPerformancePeriodLabel(frequency, startDate) {
  const labelMap = {
    daily: 'les derniÃ¨res 24 heures',
    weekly: 'les 7 derniers jours',
    monthly: 'les 30 derniers jours',
  };
  const label = labelMap[String(frequency || '').toLowerCase()] || 'les 7 derniers jours';
  if (!startDate) return label;
  return `${label} (depuis le ${new Date(startDate).toLocaleDateString('fr-FR')})`;
}

function getTrocBaseUrl() {
  return process.env.BASE_URL || 'https://kalico.nc';
}

async function loadOpenTrocListingsByIds(ids = []) {
  const normalized = [...new Set(ids.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))];
  if (!normalized.length) return [];

  const result = await query(`
    SELECT
      a.id,
      a.user_id,
      a.titre AS title,
      a.description,
      a.prix,
      a.category_id,
      cat.name AS category_name,
      cat.slug AS category_slug,
      a.troc_wants,
      a.troc_accepts_complement_xpf,
      a.troc_complement_max_xpf,
      a.troc_status,
      u.prenom,
      u.nom,
      u.email,
      u.expo_push_token
    FROM annonces a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN categories cat ON cat.id = a.category_id
    WHERE a.id = ANY($1::int[])
      AND a.deleted_at IS NULL
      AND a.status = 'active'
      AND COALESCE(a.is_troc, FALSE) = TRUE
      AND COALESCE(a.troc_status, 'open') = 'open'
  `, [normalized]);

  return result.rows;
}

async function loadAllOpenTrocListings() {
  const result = await query(`
    SELECT
      a.id,
      a.user_id,
      a.titre AS title,
      a.description,
      a.prix,
      a.category_id,
      cat.name AS category_name,
      cat.slug AS category_slug,
      a.troc_wants,
      a.troc_accepts_complement_xpf,
      a.troc_complement_max_xpf,
      a.troc_status,
      u.prenom,
      u.nom,
      u.email,
      u.expo_push_token
    FROM annonces a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN categories cat ON cat.id = a.category_id
    WHERE a.deleted_at IS NULL
      AND a.status = 'active'
      AND COALESCE(a.is_troc, FALSE) = TRUE
      AND COALESCE(a.troc_status, 'open') = 'open'
    ORDER BY a.created_at DESC
  `);

  return result.rows;
}

function buildDirectMatchKey(anchorListing, candidateListing) {
  const ids = [Number(anchorListing.id), Number(candidateListing.id)].sort((a, b) => a - b);
  return `troc:direct:${ids.join(':')}`;
}

function buildCycleMatchKey(cycle) {
  const listingIds = (cycle?.listing_ids || []).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  return `troc:cycle:${listingIds.join(':')}`;
}

async function notifyTrocDirectMatch(anchorListing, candidateListing) {
  const baseUrl = getTrocBaseUrl();
  const anchorOwner = {
    id: Number(anchorListing.user_id),
    prenom: anchorListing.prenom,
    nom: anchorListing.nom,
    email: anchorListing.email,
    pushToken: anchorListing.expo_push_token,
  };
  const candidateOwner = {
    id: Number(candidateListing.user_id),
    prenom: candidateListing.prenom,
    nom: candidateListing.nom,
    email: candidateListing.email,
    pushToken: candidateListing.expo_push_token,
  };

  const payloads = [
    {
      recipient: anchorOwner,
      counterpart: candidateListing,
      href: `/troc/${candidateListing.id}`,
    },
    {
      recipient: candidateOwner,
      counterpart: anchorListing,
      href: `/troc/${anchorListing.id}`,
    },
  ];

  for (const payload of payloads) {
    const recipientName = formatUserName(payload.recipient.prenom, payload.recipient.nom);
    const counterpartName = formatUserName(payload.counterpart.prenom, payload.counterpart.nom);
    const title = 'ðŸ”„ Troc compatible trouvÃ© !';
    const body = `${counterpartName} a une annonce qui correspond Ã  votre troc.`;

    await createNotification(payload.recipient.id, {
      type: 'troc_match',
      title,
      body,
      href: payload.href,
    }).catch(() => {});

    await sendPushToUser(payload.recipient.id, {
      title,
      body,
      data: {
        type: 'troc_match',
        listing_id: payload.counterpart.id,
        counterpart_listing_id: payload.counterpart.id,
      },
    }).catch(() => {});

    if (payload.recipient.email) {
      await sendMail({
        to: payload.recipient.email,
        subject: title,
        html: `<p>Bonjour ${recipientName},</p>
          <p><strong>${counterpartName}</strong> a une annonce compatible avec votre troc.</p>
          <p><a href="${baseUrl}${payload.href}">Voir le match</a></p>`,
      }).catch(() => {});
    }
  }
}

async function notifyTrocCycle(cycle, listingById) {
  const baseUrl = getTrocBaseUrl();
  const participants = (cycle.participant_ids || []).map((participantId) => {
    const listing = (cycle.listing_ids || [])
      .map((listingId) => listingById.get(Number(listingId)))
      .find((item) => item && Number(item.user_id) === Number(participantId));

    const profile = listing || {};
    return {
      participantId: Number(participantId),
      prenom: profile.prenom,
      nom: profile.nom,
      email: profile.email,
      pushToken: profile.expo_push_token,
    };
  });

  for (const participant of participants) {
    const recipientName = formatUserName(participant.prenom, participant.nom);
    const title = 'ðŸ”„ Troc en chaÃ®ne dÃ©tectÃ© !';
    const body = "Vous, d'autres troceurs et leurs annonces pouvez tous y gagner.";

    await createNotification(participant.participantId, {
      type: 'troc_cycle',
      title,
      body,
      href: `/troc/cycles/${cycle.id}`,
    }).catch(() => {});

    await sendPushToUser(participant.participantId, {
      title,
      body,
      data: {
        type: 'troc_cycle',
        cycle_id: cycle.id,
      },
    }).catch(() => {});

    if (participant.email) {
      await sendMail({
        to: participant.email,
        subject: title,
        html: `<p>Bonjour ${recipientName},</p>
          <p>Un troc en chaÃ®ne a Ã©tÃ© dÃ©tectÃ© autour de vos annonces.</p>
          <p><a href="${baseUrl}/troc/cycles/${cycle.id}">Voir le cycle</a></p>`,
      }).catch(() => {});
    }
  }
}

async function processTrocMatchingQueue() {
  if (String(process.env.TROC_MATCHING_ENABLED || 'true') === 'false') {
    return { processed: 0, matches: 0, cycles: 0 };
  }

  const queuedIds = await drainTrocMatchingQueue(40);
  if (!queuedIds.length) {
    return { processed: 0, matches: 0, cycles: 0 };
  }

  const anchorIds = [...new Set(queuedIds.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))];
  if (!anchorIds.length) {
    return { processed: 0, matches: 0, cycles: 0 };
  }

  const anchors = await loadOpenTrocListingsByIds(anchorIds);
  if (!anchors.length) {
    return { processed: anchorIds.length, matches: 0, cycles: 0 };
  }

  const openListings = await loadAllOpenTrocListings();
  const listingById = new Map(openListings.map((listing) => [Number(listing.id), listing]));

  let matchCount = 0;
  let cycleCount = 0;

  for (const anchorListing of anchors) {
    const candidates = openListings.filter((candidate) =>
      Number(candidate.id) !== Number(anchorListing.id)
      && Number(candidate.user_id) !== Number(anchorListing.user_id)
      && listingMatchesNeed(anchorListing, candidate)
      && listingMatchesNeed(candidate, anchorListing)
    );

    for (const candidateListing of candidates) {
      const key = buildDirectMatchKey(anchorListing, candidateListing);
      if (!(await rememberTrocSignal(key, 24 * 60 * 60 * 1000))) {
        continue;
      }

      await notifyTrocDirectMatch(anchorListing, candidateListing);
      matchCount++;
    }

    const cycles = detectTrocCycles(anchorListing, openListings, {
      expiryHours: Number(process.env.TROC_CYCLE_EXPIRY_HOURS || 48),
      maxDepth: Number(process.env.TROC_CYCLE_MAX_DEPTH || 3),
    });

    for (const cycle of cycles) {
      const key = buildCycleMatchKey(cycle);
      if (!(await rememberTrocSignal(key, Number(process.env.TROC_CYCLE_EXPIRY_HOURS || 48) * 60 * 60 * 1000))) {
        continue;
      }

      await query(
        `INSERT INTO troc_cycles (
           participant_ids, listing_ids, status, confirmations, detected_at, updated_at, expires_at
         )
         VALUES ($1::int[], $2::int[], 'proposed', '{}'::int[], NOW(), NOW(), NOW() + make_interval(hours => $3))`,
        [
          cycle.participant_ids,
          cycle.listing_ids,
          Number(process.env.TROC_CYCLE_EXPIRY_HOURS || 48),
        ]
      ).catch(() => {});

      await notifyTrocCycle(cycle, listingById);
      cycleCount++;
    }
  }

  return {
    processed: anchorIds.length,
    matches: matchCount,
    cycles: cycleCount,
  };
}

// â”€â”€ 1. Expiration des boosts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Toutes les heures : dÃ©sactive les boosts dont boost_expires_at est passÃ©

function startBoostExpiryJob() {
  cron.schedule('0 * * * *', async () => {
    recordJob('started', { job: 'boost-expiry' });
    await runSingletonJob('cron:boost-expiry', 50 * 60 * 1000, async () => {
      try {
        const result = await query(`
          UPDATE annonces
          SET is_boosted = FALSE, boost_type = NULL, boost_expires_at = NULL, updated_at = NOW()
          WHERE is_boosted = TRUE AND boost_expires_at < NOW()
          RETURNING id
        `);
        if (result.rowCount > 0) {
          logger.info('cron_boost_expired', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'boost-expiry', message: err.message });
        logger.error('cron_boost_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'boost-expiry' });
}

function startListingExpiryJob() {
  cron.schedule('10 * * * *', async () => {
    recordJob('started', { job: 'listing-expiry' });
    await runSingletonJob('cron:listing-expiry', 50 * 60 * 1000, async () => {
      try {
        const result = await query(`
          WITH expired AS (
            UPDATE annonces a
            SET status = 'expired',
                updated_at = NOW()
            WHERE a.status = 'active'
              AND a.expires_at < NOW()
              AND a.deleted_at IS NULL
            RETURNING a.id, a.titre, a.user_id
          )
          SELECT e.id, e.titre, e.user_id, u.email, u.prenom
          FROM expired e
          JOIN users u ON u.id = e.user_id
          WHERE u.deleted_at IS NULL
        `);

        for (const row of result.rows) {
          await notifyListingExpired(row.user_id, row.id, row.titre).catch(() => {});
          await sendListingExpiredEmail(
            row.email,
            row.prenom,
            {
              annonceId: row.id,
              annonceTitle: row.titre,
            },
            row.user_id
          ).catch(() => {});
        }

        if (result.rowCount > 0) {
          logger.info('cron_listing_expired_notified', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'listing-expiry', message: err.message });
        logger.error('cron_listing_expiry_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'listing-expiry' });
}

function startFretExpirationJob() {
  cron.schedule('*/5 * * * *', async () => {
    recordJob('started', { job: 'fret-expiry' });
    await runSingletonJob('cron:fret-expiry', 4 * 60 * 1000, async () => {
      logger.info('cron_fret_expiry_skipped', { reason: 'manual_fret_flow' });
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'fret-expiry' });
}

function startProQuoteExpiryJob() {
  cron.schedule('20 * * * *', async () => {
    recordJob('started', { job: 'pro-quote-expiry' });
    await runSingletonJob('cron:pro-quote-expiry', 50 * 60 * 1000, async () => {
      try {
        const result = await query(`
          UPDATE pro_quotes
          SET status = 'expired',
              updated_at = NOW()
          WHERE valid_until IS NOT NULL
            AND valid_until < NOW()
            AND status IN ('sent', 'viewed')
          RETURNING id, pro_id, quote_number
        `);

        if (result.rowCount > 0) {
          for (const row of result.rows) {
            await createNotification(row.pro_id, {
              type: 'quote_expired',
              title: `Votre devis ${row.quote_number} a expirÃ© sans rÃ©ponse.`,
              body: `Votre devis ${row.quote_number} a expirÃ© sans rÃ©ponse.`,
              href: '/pro/dashboard/devis',
            }).catch(() => {});
          }
          logger.info('cron_pro_quote_expired', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'pro-quote-expiry', message: err.message });
        logger.error('cron_pro_quote_expiry_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'pro-quote-expiry' });
}

function startBonPlanMaintenanceJob() {
  const flushIntervalMs = Math.max(15 * 60 * 1000, Number(process.env.BON_PLAN_VIEWS_FLUSH_INTERVAL_MS || 3600000));

  cron.schedule('15 * * * *', async () => {
    recordJob('started', { job: 'bon-plan-expiry' });
    await runSingletonJob('cron:bon-plan-expiry', 45 * 60 * 1000, async () => {
      try {
        const result = await query(`
          UPDATE bon_plans
          SET status = 'expired', updated_at = NOW()
          WHERE status = 'active'
            AND published_until IS NOT NULL
            AND published_until < NOW()
          RETURNING id
        `);
        if (result.rowCount > 0) {
          logger.info('cron_bon_plans_expired', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'bon-plan-expiry', message: err.message });
        logger.error('cron_bon_plans_expiry_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  setInterval(() => {
    runSingletonJob('cron:bon-plan-views', flushIntervalMs - 5_000, async () => {
      try {
        const result = await flushBonPlanViews();
        if (result?.flushed) {
          logger.info('cron_bon_plan_views_flushed', { count: result.flushed });
        }
      } catch (err) {
        recordJob('error', { job: 'bon-plan-views', message: err.message });
        logger.error('cron_bon_plan_views_error', { error: err });
      }
    }).catch(() => {});
  }, flushIntervalMs).unref?.();

  logger.info('cron_job_started', { job: 'bon-plan-expiry' });
  logger.info('cron_job_started', { job: 'bon-plan-views-flush', interval_ms: flushIntervalMs });
}

function startCampaignMaintenanceJob() {
  cron.schedule('*/5 * * * *', async () => {
    recordJob('started', { job: 'campaign-maintenance' });
    await runSingletonJob('cron:campaign-maintenance', 4 * 60 * 1000, async () => {
      try {
        const result = await expireCampaignsAndActivateQueued();
        if (result?.expiredCount > 0 || result?.activatedCount > 0) {
          logger.info('cron_campaigns_maintenance', {
            expired: result.expiredCount || 0,
            activated: result.activatedCount || 0,
          });
        }
      } catch (err) {
        recordJob('error', { job: 'campaign-maintenance', message: err.message });
        logger.error('cron_campaigns_maintenance_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'campaign-maintenance' });
}

function startWeeklyBonPlanSelectionJob() {
  cron.schedule('0 8 * * 1', async () => {
    recordJob('started', { job: 'bon-plan-weekly-reminder' });
    await runSingletonJob('cron:bon-plan-weekly-reminder', 60 * 60 * 1000, async () => {
      try {
        const result = await notifyWeeklyBonPlanSelectionReminder();
        if (result?.reminded > 0) {
          logger.info('cron_bon_plan_weekly_reminder_sent', result);
        }
      } catch (err) {
        recordJob('error', { job: 'bon-plan-weekly-reminder', message: err.message });
        logger.error('cron_bon_plan_weekly_reminder_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  cron.schedule('0 12 * * 2', async () => {
    recordJob('started', { job: 'bon-plan-weekly-auto-selection' });
    await runSingletonJob('cron:bon-plan-weekly-auto-selection', 60 * 60 * 1000, async () => {
      try {
        const result = await autoSelectWeeklyBonPlans();
        if (result?.auto_selected > 0) {
          logger.info('cron_bon_plan_weekly_auto_selected', result);
        }
      } catch (err) {
        recordJob('error', { job: 'bon-plan-weekly-auto-selection', message: err.message });
        logger.error('cron_bon_plan_weekly_auto_selection_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'bon-plan-weekly-reminder' });
  logger.info('cron_job_started', { job: 'bon-plan-weekly-auto-selection' });
}

async function expireTrocProposals() {
  const expired = await query(`
    WITH expired AS (
      UPDATE troc_proposals
      SET status = 'expired',
          updated_at = NOW()
      WHERE status = 'pending'
        AND expires_at < NOW()
      RETURNING id, proposer_id, listing_id
    )
    SELECT e.id, e.proposer_id, e.listing_id, u.email, u.prenom, a.titre
    FROM expired e
    JOIN users u ON u.id = e.proposer_id
    JOIN annonces a ON a.id = e.listing_id
  `);

  for (const row of expired.rows) {
    await createNotification(row.proposer_id, {
      type: 'troc_expired',
      title: 'â° Proposition expirÃ©e',
      body: "Votre proposition de troc n'a pas reÃ§u de reponse.",
      href: `/troc/${row.listing_id}`,
    }).catch(() => {});

    await sendPushToUser(row.proposer_id, {
      title: 'â° Proposition expirÃ©e',
      body: "Votre proposition de troc n'a pas reÃ§u de reponse.",
      data: { type: 'troc_expired', proposal_id: row.id, listing_id: row.listing_id },
    }).catch(() => {});
  }

  return expired.rowCount || expired.rows.length || 0;
}

async function expireTrocCycles() {
  const expired = await query(`
    WITH broken AS (
      UPDATE troc_cycles
      SET status = 'broken',
          updated_at = NOW()
      WHERE status = 'proposed'
        AND expires_at < NOW()
      RETURNING id, participant_ids
    )
    SELECT id, participant_ids
    FROM broken
  `);

  for (const row of expired.rows) {
    await sendPushToUsers(row.participant_ids || [], {
      title: 'ðŸ”„ Cycle Troc expirÃ©',
      body: "Le troc en chaÃ®ne n'a pas ete confirme a temps.",
      data: { type: 'troc_cycle_expired', cycle_id: row.id },
    }).catch(() => {});
  }

  return expired.rowCount || expired.rows.length || 0;
}

function startTrocMaintenanceJob() {
  cron.schedule('*/5 * * * *', async () => {
    recordJob('started', { job: 'troc-maintenance' });
    await runSingletonJob('cron:troc-maintenance', 4 * 60 * 1000, async () => {
      try {
        const expiredProposals = await expireTrocProposals();
        const brokenCycles = await expireTrocCycles();
        if (expiredProposals || brokenCycles) {
          logger.info('cron_troc_maintenance', {
            expired_proposals: expiredProposals,
            broken_cycles: brokenCycles,
          });
        }
      } catch (err) {
        recordJob('error', { job: 'troc-maintenance', message: err.message });
        logger.error('cron_troc_maintenance_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'troc-maintenance' });
}

function startTrocMatchingJob() {
  cron.schedule('*/30 * * * * *', async () => {
    recordJob('started', { job: 'troc-matching' });
    await runSingletonJob('cron:troc-matching', 25 * 1000, async () => {
      try {
        const result = await processTrocMatchingQueue();
        if (result.processed || result.matches || result.cycles) {
          logger.info('cron_troc_matching', result);
        }
      } catch (err) {
        recordJob('error', { job: 'troc-matching', message: err.message });
        logger.error('cron_troc_matching_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'troc-matching' });
}

function startAdminAlertsJob() {
  cron.schedule('*/5 * * * *', async () => {
    recordJob('started', { job: 'admin-alerts' });
    await runSingletonJob('cron:admin-alerts', 4 * 60 * 1000, async () => {
      try {
        const alerts = await checkAdminAlerts();
        if (alerts?.length) {
          logger.info('cron_admin_alerts', { alerts: alerts.length });
        }
      } catch (err) {
        recordJob('error', { job: 'admin-alerts', message: err.message });
        logger.error('cron_admin_alerts_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'admin-alerts' });
}

// â”€â”€ 2. Envoi des alertes daily â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tous les jours Ã  8h00 heure NoumÃ©a

// â”€â”€ 2. Email + notif relance annonces expirant dans 3 jours â”€â”€â”€â”€â”€
// Tous les jours Ã  9h00 heure NoumÃ©a

function startExpiringListingsJob() {
  cron.schedule('0 9 * * *', async () => {
    recordJob('started', { job: 'expiring-listings' });
    await runSingletonJob('cron:expiring-listings', 30 * 60 * 1000, async () => {
      try {
        // Annonces actives qui expirent dans 3 jours exactement (Â±1h)
        const result = await query(`
          SELECT a.id, a.titre, a.user_id, u.email, u.prenom
          FROM annonces a
          JOIN users u ON u.id = a.user_id
          WHERE a.status = 'active'
            AND a.expires_at BETWEEN NOW() + INTERVAL '2 days 23 hours'
                                 AND NOW() + INTERVAL '3 days 1 hour'
            AND a.deleted_at IS NULL
            AND u.deleted_at IS NULL
        `);

        for (const row of result.rows) {
          // Notification in-app
          await notifyListingExpiring(row.user_id, row.id, row.titre, 3).catch(() => {});

          await sendListingExpiringEmail(
            row.email,
            row.prenom,
            {
              annonceId: row.id,
              annonceTitle: row.titre,
              daysLeft: 3,
            },
            row.user_id
          ).catch(() => {});
        }

        if (result.rowCount > 0) {
          logger.info('cron_expiring_listings_notified', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'expiring-listings', message: err.message });
        logger.error('cron_expiring_listings_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'expiring-listings' });
}

function startDailyAlertsJob() {
  cron.schedule('0 8 * * *', () => runSingletonJob('cron:alerts-daily', 30 * 60 * 1000, () => runAlertJob('daily')), { timezone: 'Pacific/Noumea' });
  recordJob('started', { job: 'alerts-daily' });
  logger.info('cron_job_started', { job: 'alerts-daily' });
}

// â”€â”€ 3. Envoi des alertes weekly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tous les lundis Ã  8h00 heure NoumÃ©a

function startWeeklyAlertsJob() {
  cron.schedule('0 8 * * 1', () => runSingletonJob('cron:alerts-weekly', 30 * 60 * 1000, () => runAlertJob('weekly')), { timezone: 'Pacific/Noumea' });
  recordJob('started', { job: 'alerts-weekly' });
  logger.info('cron_job_started', { job: 'alerts-weekly' });
}

function startPerformanceReportsJob() {
  cron.schedule('30 7 * * *', async () => {
    recordJob('started', { job: 'performance-reports' });
    await runSingletonJob('cron:performance-reports', 45 * 60 * 1000, async () => {
      await runPerformanceReportsJob();
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'performance-reports' });
}

function startAnalyticsPurgeJob() {
  cron.schedule('30 3 * * *', async () => {
    recordJob('started', { job: 'analytics-purge' });
    await runSingletonJob('cron:analytics-purge', 20 * 60 * 1000, async () => {
      try {
        const result = await query(`
          DELETE FROM analytics_events
          WHERE created_at < NOW() - INTERVAL '90 days'
        `);
        if (result.rowCount > 0) {
          logger.info('cron_analytics_purged', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'analytics-purge', message: err.message });
        logger.error('cron_analytics_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'analytics-purge' });
}

// â”€â”€ Logique de matching des alertes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function runAlertJob(frequency) {
  logger.info('cron_alerts_start', { frequency });
  let sent = 0;
  let errors = 0;

  try {
    // RÃ©cupÃ©rer toutes les alertes actives pour cette frÃ©quence
    const alerts = await query(`
      SELECT sa.id, sa.user_id, sa.label, sa.filters, sa.unsubscribe_token,
             sa.last_sent_at, u.email, u.prenom
      FROM search_alerts sa
      JOIN users u ON u.id = sa.user_id
      WHERE sa.status = 'active'
        AND sa.frequency = $1
        AND u.deleted_at IS NULL
    `, [frequency]);

    for (const alert of alerts.rows) {
      try {
        const annonces = await matchAlerteAnnonces(alert);
        if (!annonces.length) continue;

        const prefs = await ensureNotificationPreferences(alert.user_id).catch(() => null);

        await sendAlertEmail(alert.email, alert.prenom, alert, annonces);

        await notifySearchAlert(
          alert.user_id,
          alert.label,
          annonces.length,
          alert.filters || {}
        ).catch(() => {});

        if (prefs?.push_search_alert) {
          await sendPushToUser(alert.user_id, {
            title: `ðŸ”” ${annonces.length} nouvelle${annonces.length > 1 ? 's' : ''} annonce${annonces.length > 1 ? 's' : ''} pour "${alert.label}"`,
            body: 'Cliquez pour voir les rÃ©sultats',
            data: {
              type: 'search_alert',
              alert_id: alert.id,
              label: alert.label,
            },
          }).catch(() => {});
        }

        // Logger les annonces envoyÃ©es pour Ã©viter les doublons
        for (const a of annonces) {
          await query(`
            INSERT INTO alert_sent_log (alert_id, annonce_id)
            VALUES ($1, $2)
            ON CONFLICT (alert_id, annonce_id) DO NOTHING
          `, [alert.id, a.id]).catch(() => {});
        }

        // Mettre Ã  jour last_sent_at et nb_results
        await query(`
          UPDATE search_alerts
          SET last_sent_at = NOW(), nb_results = nb_results + $2, updated_at = NOW()
          WHERE id = $1
        `, [alert.id, annonces.length]);

        sent++;
      } catch (alertErr) {
        recordJob('error', { job: `alerts-${frequency}`, message: alertErr.message });
        logger.error('cron_alerts_alert_error', { alert_id: alert.id, error: alertErr });
        errors++;
      }
    }
  } catch (err) {
    recordJob('error', { job: `alerts-${frequency}`, message: err.message });
    logger.error('cron_alerts_general_error', { frequency, error: err });
  }

  logger.info('cron_alerts_done', { frequency, sent, errors });
}

/**
 * Trouve les annonces correspondant aux filtres d'une alerte
 * et non encore envoyÃ©es Ã  cet utilisateur
 */
async function matchAlerteAnnonces(alert) {
  const filters = typeof alert.filters === 'string'
    ? JSON.parse(alert.filters)
    : alert.filters;

  const conditions = [
    `a.status = 'active'`,
    // Exclure les annonces dÃ©jÃ  envoyÃ©es pour cette alerte
    `a.id NOT IN (
       SELECT annonce_id FROM alert_sent_log WHERE alert_id = $1
     )`,
    // Annonces publiÃ©es depuis le dernier envoi (ou derniÃ¨res 7 jours si premiÃ¨re fois)
    `a.created_at > COALESCE($2::timestamptz, NOW() - INTERVAL '7 days')`,
  ];
  const params = [alert.id, alert.last_sent_at || null];
  let   idx    = params.length + 1;

  if (filters.q) {
    conditions.push(`(a.titre ILIKE $${idx} OR a.description ILIKE $${idx})`);
    params.push(`%${filters.q}%`);
    idx++;
  }
  if (filters.category_id || filters.categorie_id) {
    conditions.push(`a.category_id = $${idx++}`);
    params.push(filters.category_id || filters.categorie_id);
  }
  if (filters.commune_id) {
    conditions.push(`a.commune_id = $${idx++}`);
    params.push(filters.commune_id);
  }
  if (filters.price_min != null || filters.prix_min != null) {
    conditions.push(`a.prix_xpf >= $${idx++}`);
    params.push(filters.price_min ?? filters.prix_min);
  }
  if (filters.price_max != null || filters.prix_max != null) {
    conditions.push(`a.prix_xpf <= $${idx++}`);
    params.push(filters.price_max ?? filters.prix_max);
  }
  if (filters.condition) {
    conditions.push(`a.condition = $${idx++}`);
    params.push(filters.condition);
  }
  if (String(filters.troc) === 'true' || String(filters.troc) === '1') {
    conditions.push(`a.contre_quoi IS NOT NULL AND a.contre_quoi <> ''`);
  }

  const result = await query(`
    SELECT a.id, a.titre, a.prix_xpf, c.nom AS commune
    FROM annonces a
    LEFT JOIN communes c ON c.id = a.commune_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.created_at DESC
    LIMIT 20
  `, params);

  return result.rows;
}

/**
 * Matching immÃ©diat : appelÃ© quand une nouvelle annonce est publiÃ©e
 * Envoie les emails aux utilisateurs ayant une alerte 'immediate' correspondante
 */
async function matchImmediateAlerts(annonce) {
  try {
    const alerts = await query(`
      SELECT sa.id, sa.user_id, sa.label, sa.filters, sa.unsubscribe_token,
             sa.last_sent_at, u.email, u.prenom
      FROM search_alerts sa
      JOIN users u ON u.id = sa.user_id
      WHERE sa.status = 'active'
        AND sa.frequency = 'immediate'
        AND sa.user_id != $1
        AND u.deleted_at IS NULL
    `, [annonce.user_id]);

    for (const alert of alerts.rows) {
      if (String(alert.user_id) === String(annonce.user_id)) {
        continue;
      }

      const filters = typeof alert.filters === 'string'
        ? JSON.parse(alert.filters)
        : alert.filters;

      // Test simple cÃ´tÃ© JS pour l'immediate (Ã©vite une requÃªte par alerte)
      const matches = (
        (!filters.q             || annonce.titre?.toLowerCase().includes(filters.q.toLowerCase())) &&
        (!(filters.category_id || filters.categorie_id) || String(annonce.category_id) === String(filters.category_id || filters.categorie_id)) &&
        (!filters.commune_id    || String(annonce.commune_id)   === String(filters.commune_id))   &&
        (!filters.price_min && !filters.prix_min || (annonce.prix ?? annonce.prix_xpf ?? 0) >= Number(filters.price_min ?? filters.prix_min)) &&
        (!filters.price_max && !filters.prix_max || (annonce.prix ?? annonce.prix_xpf ?? 0) <= Number(filters.price_max ?? filters.prix_max)) &&
        (!filters.condition     || String(annonce.condition) === String(filters.condition)) &&
        (String(filters.troc) !== 'true' && String(filters.troc) !== '1' || Boolean(annonce.contre_quoi))
      );

      if (!matches) continue;

      const prefs = await ensureNotificationPreferences(alert.user_id).catch(() => null);

      await sendAlertEmail(alert.email, alert.prenom, alert, [annonce]).catch(() => {});
      await notifySearchAlert(
        alert.user_id,
        alert.label,
        1,
        alert.filters || {}
      ).catch(() => {});
      if (prefs?.push_search_alert) {
        await sendPushToUser(alert.user_id, {
          title: `ðŸ”” 1 nouvelle annonce pour "${alert.label}"`,
          body: 'Cliquez pour voir le rÃ©sultat',
          data: {
            type: 'search_alert',
            alert_id: alert.id,
            label: alert.label,
          },
        }).catch(() => {});
      }
      await query(`
        INSERT INTO alert_sent_log (alert_id, annonce_id) VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [alert.id, annonce.id]).catch(() => {});
      await query(
        'UPDATE search_alerts SET nb_results = nb_results + 1, last_sent_at = NOW() WHERE id = $1',
        [alert.id]
      ).catch(() => {});
    }
  } catch (err) {
  logger.error('cron_alerts_immediate_error', { error: err });
  }
}

// â”€â”€ Point d'entrÃ©e â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ 5. Email post-transaction pour inciter les avis â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tous les jours Ã  10h00 : envoyer un email 48h aprÃ¨s le premier message

async function buildPerformanceReportForUser(userRow, prefs) {
  const frequency = prefs.performance_report_frequency || 'weekly';
  const days = getPerformanceWindowDays(frequency);
  const lastSentAt = prefs.last_performance_report_at ? new Date(prefs.last_performance_report_at) : null;
  const periodStart = lastSentAt && !Number.isNaN(lastSentAt.getTime())
    ? lastSentAt
    : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await query(`
    SELECT
      a.id,
      a.titre AS title,
      a.prix,
      a.nb_vues AS total_views,
      a.nb_favoris AS total_favorites,
      a.is_boosted,
      COALESCE(ev.views, 0) AS views,
      COALESCE(ev.clicks, 0) AS clicks,
      COALESCE(ev.favorites, 0) AS favorites
    FROM annonces a
    LEFT JOIN (
      SELECT
        ae.metadata ->> 'listing_id' AS listing_id,
        COUNT(*) FILTER (WHERE ae.event_name = 'listing_view') AS views,
        COUNT(*) FILTER (WHERE ae.event_name = 'contact_seller_click') AS clicks,
        COUNT(*) FILTER (WHERE ae.event_name = 'favorite_add') AS favorites
      FROM analytics_events ae
      WHERE ae.created_at >= $2
        AND ae.event_name IN ('listing_view', 'contact_seller_click', 'favorite_add')
      GROUP BY ae.metadata ->> 'listing_id'
    ) ev ON ev.listing_id = a.id::text
    WHERE a.user_id = $1
      AND a.status = 'active'
    ORDER BY COALESCE(ev.views, 0) DESC,
             COALESCE(ev.clicks, 0) DESC,
             COALESCE(ev.favorites, 0) DESC,
             a.created_at DESC
  `, [userRow.user_id, periodStart.toISOString()]);

  const rows = result.rows || [];
  if (!rows.length) return null;

  const totals = rows.reduce((acc, item) => ({
    views: acc.views + Number(item.views || 0),
    clicks: acc.clicks + Number(item.clicks || 0),
    favorites: acc.favorites + Number(item.favorites || 0),
  }), { views: 0, clicks: 0, favorites: 0 });

  return {
    user_id: userRow.user_id,
    email: userRow.email,
    prenom: userRow.prenom,
    is_pro: Boolean(userRow.is_pro),
    frequency,
    period_label: getPerformancePeriodLabel(frequency, periodStart),
    period_start: periodStart,
    totals,
    listings: rows,
  };
}

async function runPerformanceReportsJob() {
  logger.info('cron_performance_reports_start');
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const recipients = await query(`
      SELECT
        p.user_id,
        u.email,
        u.prenom,
        u.is_pro,
        p.email_performance_report,
        p.push_performance_report,
        p.performance_report_frequency,
        p.last_performance_report_at
      FROM notification_preferences p
      JOIN users u ON u.id = p.user_id
      WHERE u.deleted_at IS NULL
        AND p.performance_report_frequency <> 'never'
        AND (p.email_performance_report = TRUE OR p.push_performance_report = TRUE)
    `);

    for (const recipient of recipients.rows) {
      try {
        const report = await buildPerformanceReportForUser(recipient, recipient);
        if (!report) {
          skipped++;
          continue;
        }

        if (recipient.email_performance_report) {
          await sendPerformanceReportEmail({
            to: recipient.email,
            prenom: recipient.prenom,
            report,
            recipientUserId: recipient.user_id,
          }).catch(() => {});
        }

        if (recipient.push_performance_report) {
          await sendPushToUser(recipient.user_id, {
            title: 'ðŸ“Š Votre rapport de performance est prÃªt',
            body: `${report.totals.views.toLocaleString('fr-FR')} vues Â· ${report.totals.clicks.toLocaleString('fr-FR')} clics`,
            data: {
              type: 'performance_report',
              period: report.frequency,
            },
          }).catch(() => {});
        }

        await notifyPerformanceReport(
          recipient.user_id,
          report.period_label,
          '/parametres/notifications'
        ).catch(() => {});

        await query(
          `UPDATE notification_preferences
           SET last_performance_report_at = NOW(),
               updated_at = NOW()
           WHERE user_id = $1`,
          [recipient.user_id]
        ).catch(() => {});

        sent++;
      } catch (error) {
        errors++;
        recordJob('error', { job: 'performance-reports', message: error.message });
        logger.error('cron_performance_reports_error', { user_id: recipient.user_id, error });
      }
    }
  } catch (error) {
    recordJob('error', { job: 'performance-reports', message: error.message });
    logger.error('cron_performance_reports_general_error', { error });
  }

  logger.info('cron_performance_reports_done', { sent, skipped, errors });
}

function startReviewReminderJob() {
  cron.schedule('0 10 * * *', async () => {
    recordJob('started', { job: 'reviews' });
    await runSingletonJob('cron:review-reminder', 30 * 60 * 1000, async () => {
      try {
        // Conversations dont le premier message date d'exactement 48h (Â±1h)
        // et pour lesquelles aucun avis n'a encore Ã©tÃ© laissÃ©
        const result = await query(`
          SELECT DISTINCT
            c.id          AS conv_id,
            c.buyer_id,
            c.seller_id,
            a.titre       AS annonce_titre,
            ub.email      AS buyer_email,
            ub.prenom     AS buyer_prenom,
            us.prenom     AS seller_prenom
          FROM conversations c
          JOIN annonces a   ON a.id   = c.annonce_id
          JOIN users ub     ON ub.id  = c.buyer_id
          JOIN users us     ON us.id  = c.seller_id
          WHERE c.created_at BETWEEN NOW() - INTERVAL '49 hours'
                                  AND NOW() - INTERVAL '47 hours'
            AND ub.deleted_at IS NULL
            AND us.deleted_at IS NULL
            -- Pas encore d'avis laissÃ© par l'acheteur pour ce vendeur
            AND NOT EXISTS (
              SELECT 1 FROM avis av
              WHERE av.auteur_id  = c.buyer_id
                AND av.cible_id   = c.seller_id
            )
        `);

        const emailService = require('../services/emailService');
        const baseUrl = process.env.BASE_URL || 'https://kalico.nc';

        for (const row of result.rows) {
          await emailService.sendMail({
            to:      row.buyer_email,
            subject: "Retour sur votre transaction - Kalico",
            html: '<p>Bonjour ' + row.buyer_prenom + ',</p>'
                + '<p>Vous avez Ã©changÃ© avec <strong>' + row.seller_prenom + '</strong>'
                + ' Ã  propos de "<strong>' + row.annonce_titre + '</strong>".</p>'
                + '<p>Partagez votre expÃ©rience en laissant un avis â€” cela aide la communautÃ© Kalico !</p>'
                + '<p><a href="' + baseUrl + '/profil/' + row.seller_id + '?review=1"'
                + ' style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;'
                + 'text-decoration:none;font-weight:bold;display:inline-block;">'
                + 'Laisser un avis</a></p>'
                + '<p style="color:#9ca3af;font-size:12px;">Email automatique Kalico.</p>',
          }).catch(() => {});
        }

        if (result.rowCount > 0) {
          logger.info('cron_reviews_sent', { count: result.rowCount });
        }
      } catch (err) {
        recordJob('error', { job: 'reviews', message: err.message });
        logger.error('cron_reviews_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'reviews' });
}

function startRideReviewReminderJob() {
  cron.schedule('20 10 * * *', async () => {
    recordJob('started', { job: 'covoiturage-reviews' });
    await runSingletonJob('cron:covoiturage-review-reminder', 30 * 60 * 1000, async () => {
      try {
        const result = await query(`
          SELECT
            b.id AS booking_id,
            b.ride_id,
            b.passenger_id,
            b.review_reminder_sent_at,
            c.user_id AS driver_id,
            c.departure,
            c.destination,
            c.ride_date,
            c.ride_time,
            d.prenom AS driver_prenom,
            p.prenom AS passenger_prenom,
            p.email AS passenger_email
          FROM ride_bookings b
          JOIN covoiturages c ON c.id = b.ride_id
          JOIN users d ON d.id = c.user_id
          JOIN users p ON p.id = b.passenger_id
          WHERE b.status IN ('auto_confirmed', 'accepted')
            AND b.review_reminder_sent_at IS NULL
            AND p.deleted_at IS NULL
            AND d.deleted_at IS NULL
            AND (c.ride_date + c.ride_time) <= NOW() - INTERVAL '24 hours'
            AND NOT EXISTS (
              SELECT 1
              FROM covoiturage_reviews r
              WHERE r.booking_id = b.id
                AND r.reviewer_id = b.passenger_id
                AND r.target_user_id = c.user_id
            )
          ORDER BY c.ride_date DESC, c.ride_time DESC, b.created_at DESC
          LIMIT 50
        `);

        let sent = 0;
        for (const row of result.rows) {
          const claimed = await query(
            `UPDATE ride_bookings
             SET review_reminder_sent_at = NOW()
             WHERE id = $1 AND review_reminder_sent_at IS NULL
             RETURNING id`,
            [row.booking_id]
          );
          if (!claimed.rows[0]) continue;

          const rideLabel = `${row.departure} â†’ ${row.destination}`;
          const details = {
            departure: row.departure,
            destination: row.destination,
            rideDate: row.ride_date,
            rideTime: row.ride_time,
            driverPrenom: row.driver_prenom,
            passengerPrenom: row.passenger_prenom,
            bookingId: row.booking_id,
            reviewUrl: `${getTrocBaseUrl()}/covoiturage/reservations?review_booking=${encodeURIComponent(String(row.booking_id))}`,
          };

          await createNotification(row.passenger_id, {
            type: 'review',
            title: 'âœï¸ Notez votre conducteur',
            body: `Partagez votre avis sur ${rideLabel} pour aider la communautÃ©.`,
            href: `/covoiturage/reservations?review_booking=${row.booking_id}`,
          }).catch(() => {});

          await sendPushToUser(row.passenger_id, {
            title: 'âœï¸ Notez votre conducteur',
            body: `Partagez votre avis sur ${rideLabel}.`,
            data: { type: 'ride_review_reminder', booking_id: row.booking_id, ride_id: row.ride_id },
          }).catch(() => {});

          await sendRideReviewReminderEmail(
            row.passenger_email,
            row.passenger_prenom || 'Bonjour',
            details,
            row.passenger_id
          ).catch(() => {});

          sent++;
        }

        if (sent > 0) {
          logger.info('cron_covoiturage_reviews_sent', { count: sent });
        }
      } catch (err) {
        recordJob('error', { job: 'covoiturage-reviews', message: err.message });
        logger.error('cron_covoiturage_reviews_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'covoiturage-reviews' });
}

async function runProBookingReminderWindow({
  lockName,
  reminderColumn,
  windowStartHours,
  windowEndHours,
  reminderLabel,
  notificationTitle,
  notificationBody,
  emailIntro,
}) {
  const result = await query(`
    SELECT
      b.id AS booking_id,
      b.pro_id,
      b.requester_user_id,
      b.requester_name,
      b.requester_email,
      b.requester_phone,
      b.commune,
      b.subject,
      b.details,
      b.starts_at,
      b.ends_at,
      b.status,
      b.booking_access_token,
      b.${reminderColumn},
      p.prenom AS pro_prenom,
      p.nom AS pro_nom,
      p.pro_company_name,
      p.pro_commune,
      p.pro_phone,
      p.pro_website,
      p.pro_hours,
      p.email AS pro_email,
      p.expo_push_token AS pro_push_token,
      requester.prenom AS requester_prenom,
      requester.nom AS requester_nom,
      requester.email AS requester_email,
      requester.expo_push_token AS requester_push_token
    FROM pro_bookings b
    JOIN users p ON p.id = b.pro_id
    LEFT JOIN users requester ON requester.id = b.requester_user_id
    WHERE b.status = 'confirmed'
      AND b.${reminderColumn} IS NULL
      AND b.starts_at >= NOW() + ($1 * INTERVAL '1 hour')
      AND b.starts_at < NOW() + ($2 * INTERVAL '1 hour')
      AND p.deleted_at IS NULL
      AND (requester.id IS NULL OR requester.deleted_at IS NULL)
    ORDER BY b.starts_at ASC
    LIMIT 100
  `, [windowStartHours, windowEndHours]);

  let sent = 0;
  for (const row of result.rows) {
    const claimed = await query(
      `UPDATE pro_bookings
       SET ${reminderColumn} = NOW()
       WHERE id = $1
         AND ${reminderColumn} IS NULL
       RETURNING id`,
      [row.booking_id]
    );
    if (!claimed.rows[0]) continue;

    const startsAt = new Date(row.starts_at);
    const when = Number.isNaN(startsAt.getTime())
      ? 'votre rendez-vous'
      : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(startsAt);
    const proName = formatUserName(row.pro_prenom, row.pro_nom) || row.pro_company_name || 'Professionnel';
    const bookingToken = String(row.booking_access_token || '').trim();
    const bookingUrlForRequester = `${getTrocBaseUrl()}/mes-rdv/${row.booking_id}${bookingToken ? `?token=${encodeURIComponent(bookingToken)}` : ''}`;
    const bookingUrlForPro = `${getTrocBaseUrl()}/mes-rdv/${row.booking_id}${bookingToken ? `?token=${encodeURIComponent(bookingToken)}` : ''}`;

    if (row.requester_user_id) {
      const requesterName = formatUserName(row.requester_prenom, row.requester_nom) || row.requester_name || 'Client';
      await createNotification(row.requester_user_id, {
        type: 'appointment_reminder',
        title: notificationTitle,
        body: `${proName} Â· ${when}`,
        href: '/mes-rdv',
      }).catch(() => {});

      await sendPushToUser(row.requester_user_id, {
        title: notificationTitle,
        body: notificationBody(row, proName, requesterName, when),
        data: {
          type: 'appointment_reminder',
          booking_id: row.booking_id,
          pro_id: row.pro_id,
          reminder: reminderLabel,
        },
      }).catch(() => {});

      if (row.requester_email) {
        await sendProBookingReminderEmail(
          row.requester_email,
          row.requester_prenom || row.requester_name || 'Bonjour',
          {
            reminderLabel,
            intro: emailIntro('client', row, proName, when),
            subject: row.subject,
            proName,
            proCommune: row.pro_commune,
            commune: row.commune,
            locationText: row.pro_commune || 'Lieu Ã  confirmer',
            slotLabel: when,
            bookingId: row.booking_id,
            bookingAccessToken: row.booking_access_token,
            bookingUrl: bookingUrlForRequester,
          },
          row.requester_user_id
        ).catch(() => {});
      }
    }

    await createNotification(row.pro_id, {
      type: 'appointment_reminder',
      title: notificationTitle,
      body: `${row.requester_name || 'Client'} Â· ${when}`,
      href: '/pro/dashboard/rdv',
    }).catch(() => {});

    await sendPushToUser(row.pro_id, {
      title: notificationTitle,
      body: notificationBody(row, proName, row.requester_name || 'Client', when),
      data: {
        type: 'appointment_reminder',
        booking_id: row.booking_id,
        pro_id: row.pro_id,
        reminder: reminderLabel,
      },
    }).catch(() => {});

    if (row.pro_email) {
      await sendProBookingReminderEmail(
        row.pro_email,
        row.pro_prenom || row.pro_company_name || 'Bonjour',
        {
          reminderLabel,
          intro: emailIntro('pro', row, proName, when),
          subject: row.subject,
          proName,
          proCommune: row.pro_commune,
          commune: row.commune,
          locationText: row.pro_commune || 'Lieu Ã  confirmer',
          slotLabel: when,
          bookingId: row.booking_id,
          bookingAccessToken: row.booking_access_token,
          bookingUrl: bookingUrlForPro,
        },
        row.pro_id
      ).catch(() => {});
    }

    sent++;
  }

  if (sent > 0) {
    logger.info('cron_pro_booking_reminders_sent', {
      reminder: reminderLabel,
      count: sent,
      lock_name: lockName,
    });
  }

  return sent;
}

function startProBookingReminderJob() {
  cron.schedule('*/15 * * * *', async () => {
    recordJob('started', { job: 'pro-booking-reminders' });
    await runSingletonJob('cron:pro-booking-reminders', 10 * 60 * 1000, async () => {
      try {
        const sent24h = await runProBookingReminderWindow({
          lockName: 'pro-booking-reminder-24h',
          reminderColumn: 'reminder_24h_sent_at',
          windowStartHours: 23.75,
          windowEndHours: 24.25,
          reminderLabel: 'J-1',
          notificationTitle: 'ðŸ“… Rendez-vous demain',
          notificationBody: (row, proName, partnerName, when) => `Rendez-vous avec ${proName} Â· ${when}`,
          emailIntro: (role, row, proName, when) => role === 'client'
            ? `Votre rendez-vous avec ${proName} approche.`
            : `Votre rendez-vous avec ${row.requester_name || 'un client'} approche.`,
        });

        const sent2h = await runProBookingReminderWindow({
          lockName: 'pro-booking-reminder-2h',
          reminderColumn: 'reminder_2h_sent_at',
          windowStartHours: 1.75,
          windowEndHours: 2.25,
          reminderLabel: 'H-2',
          notificationTitle: 'â° Rendez-vous dans 2 heures',
          notificationBody: (row, proName, partnerName, when) => `PrÃ©parez votre rendez-vous avec ${proName} Â· ${when}`,
          emailIntro: (role, row, proName, when) => role === 'client'
            ? `Votre rendez-vous avec ${proName} est prÃ©vu dans moins de 2 heures.`
            : `Votre rendez-vous avec ${row.requester_name || 'un client'} est prÃ©vu dans moins de 2 heures.`,
        });

        if (sent24h || sent2h) {
          logger.info('cron_pro_booking_reminders', { sent_24h: sent24h, sent_2h: sent2h });
        }
      } catch (err) {
        recordJob('error', { job: 'pro-booking-reminders', message: err.message });
        logger.error('cron_pro_booking_reminders_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'pro-booking-reminders' });
}

function startNewsletterJob() {
  cron.schedule('0 18 * * 0', async () => {
    recordJob('started', { job: 'newsletter' });
    await runSingletonJob('cron:newsletter-weekly', 60 * 60 * 1000, async () => {
      try {
        const result = await sendNewsletterBatch();
        logger.info('cron_newsletter_sent', result);
      } catch (err) {
        recordJob('error', { job: 'newsletter', message: err.message });
        logger.error('cron_newsletter_error', { error: err });
      }
    });
  }, { timezone: 'Pacific/Noumea' });

  logger.info('cron_job_started', { job: 'newsletter' });
}

function startAllJobs() {
  startBoostExpiryJob();
  startBonPlanMaintenanceJob();
  startCampaignMaintenanceJob();
  startWeeklyBonPlanSelectionJob();
  startAdminAlertsJob();
  startTrocMatchingJob();
  startTrocMaintenanceJob();
  startListingExpiryJob();
  startFretExpirationJob();
  startProQuoteExpiryJob();
  startExpiringListingsJob();
  startReviewReminderJob();
  startRideReviewReminderJob();
  startProBookingReminderJob();
  startNewsletterJob();
  startDailyAlertsJob();
  startWeeklyAlertsJob();
  startPerformanceReportsJob();
  startAnalyticsPurgeJob();
  ticketExpiry.startTicketExpiryJob();
  importCleanup.startImportCleanupJob();
}

module.exports = { startAllJobs, matchImmediateAlerts, expireTrocProposals, expireTrocCycles, processTrocMatchingQueue };


````

## PATH: backend/package.json
````
{
  "name": "kalico-backend",
  "version": "1.0.0-rc1",
  "private": true,
  "scripts": {
    "dev": "node src/index.js",
    "build": "node --check src/index.js",
    "start": "node src/index.js",
    "worker": "node src/worker.js",
    "test": "node src/tests/run.js",
    "seed:demo": "node src/scripts/seedDemo.js",
    "migrate": "node src/scripts/runMigrations.js",
    "demo:status": "node -e \"require('./src/services/demoSeedService').getDemoStatus().then((s)=>{console.log(JSON.stringify(s,null,2));}).catch((e)=>{console.error(e);process.exit(1);})\""
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.774.0",
    "apple-signin-auth": "^1.4.0",
    "archiver": "^7.0.1",
    "axios": "^1.18.0",
    "bcryptjs": "^2.4.3",
    "cheerio": "^1.2.0",
    "cors": "^2.8.5",
    "csv-parse": "^7.0.0",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "google-auth-library": "^9.15.1",
    "helmet": "^8.2.0",
    "joi": "^18.2.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.1.1",
    "node-cron": "^4.2.1",
    "nodemailer": "^8.0.5",
    "pg": "^8.13.3",
    "qrcode": "^1.5.4",
    "redis": "^4.7.0",
    "sharp": "^0.33.4",
    "socket.io": "^4.8.1",
    "stripe": "^17.7.0",
    "twilio": "^5.4.4",
    "uuid": "^11.1.1",
    "xlsx": "^0.18.5"
  },
  "overrides": {
    "uuid": "^11.1.1"
  }
}

````

## PATH: backend/src/services/authAccountService.js
````
'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, withTransaction } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const { generateTokens, getRefreshExpiresMs, verifyAccessToken, verifyRefreshToken } = require('../config/jwt');
const { ensureNotificationPreferences } = require('./notificationPreferencesService');
const { normalizePhoneNumber } = require('./phoneOtpService');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeAccountType(accountType) {
  const value = String(accountType || '').trim().toLowerCase();
  if (value === 'professional' || value === 'pro') return 'professional';
  return 'personal';
}

function createHttpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  if (code) {
    err.code = code;
  }
  return err;
}

function buildRefreshBlacklistKey(refreshToken) {
  const hash = crypto.createHash('sha256').update(String(refreshToken || '')).digest('hex');
  return `refresh:blacklist:${hash}`;
}

function buildAccessBlacklistKey(accessToken) {
  const hash = crypto.createHash('sha256').update(String(accessToken || '')).digest('hex');
  return `access:blacklist:${hash}`;
}

function buildSafeUser(user) {
  if (!user) return null;
  const { password_hash, deleted_at, ...safeUser } = user;
  return safeUser;
}

function createTimedToken(ttlMs) {
  return {
    token: crypto.randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + ttlMs),
  };
}

const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_FAILURE_MAX = 5;
const loginFallback = new Map();

function getLoginScope(email, ip) {
  return `${normalizeEmail(email)}|${String(ip || 'unknown').trim().toLowerCase() || 'unknown'}`;
}

function getLoginScopes(email, ip) {
  const normalizedEmail = normalizeEmail(email);
  const scopes = [
    `email:${normalizedEmail}`,
    `email_ip:${getLoginScope(email, ip)}`,
  ];
  return [...new Set(scopes)];
}

function cleanupLoginFallback(scope) {
  const entry = loginFallback.get(scope);
  if (!entry) return null;
  if (entry.blockedUntil && entry.blockedUntil <= Date.now()) {
    loginFallback.delete(scope);
    return null;
  }
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    loginFallback.delete(scope);
    return null;
  }
  return entry;
}

async function getLoginThrottleState(scopes) {
  const client = await getRedisClient();
  if (client) {
    let blockedUntil = 0;
    let count = 0;
    for (const scope of scopes) {
      blockedUntil = Math.max(blockedUntil, Number(await client.get(`login:block:${scope}`) || 0));
      count = Math.max(count, Number(await client.get(`login:fail:${scope}`) || 0));
    }
    return {
      blockedUntil: Number.isFinite(blockedUntil) ? blockedUntil : 0,
      count,
      source: 'redis',
    };
  }

  let blockedUntil = 0;
  let count = 0;
  for (const scope of scopes) {
    const fallback = cleanupLoginFallback(scope);
    if (!fallback) continue;
    blockedUntil = Math.max(blockedUntil, fallback.blockedUntil || 0);
    count = Math.max(count, fallback.count || 0);
  }
  return { blockedUntil, count, source: 'memory' };
}

async function recordLoginFailure(scopes) {
  const client = await getRedisClient();
  if (client) {
    let maxCount = 0;
    let maxBlockedUntil = 0;
    for (const scope of scopes) {
      const count = await client.incr(`login:fail:${scope}`);
      if (count === 1) {
        await client.expire(`login:fail:${scope}`, Math.ceil(LOGIN_FAILURE_WINDOW_MS / 1000));
      }
      maxCount = Math.max(maxCount, count);
      if (count >= LOGIN_FAILURE_MAX) {
        const blockedUntil = Date.now() + LOGIN_FAILURE_WINDOW_MS;
        await client.set(`login:block:${scope}`, String(blockedUntil), {
          PX: LOGIN_FAILURE_WINDOW_MS,
        });
        await client.del(`login:fail:${scope}`);
        maxBlockedUntil = Math.max(maxBlockedUntil, blockedUntil);
      }
    }
    return { count: maxCount, blockedUntil: maxBlockedUntil };
  }

  let maxCount = 0;
  let maxBlockedUntil = 0;
  for (const scope of scopes) {
    const existing = cleanupLoginFallback(scope) || { count: 0, expiresAt: Date.now() + LOGIN_FAILURE_WINDOW_MS, blockedUntil: 0 };
    existing.count += 1;
    existing.expiresAt = Date.now() + LOGIN_FAILURE_WINDOW_MS;
    if (existing.count >= LOGIN_FAILURE_MAX) {
      existing.blockedUntil = Date.now() + LOGIN_FAILURE_WINDOW_MS;
    }
    loginFallback.set(scope, existing);
    maxCount = Math.max(maxCount, existing.count);
    maxBlockedUntil = Math.max(maxBlockedUntil, existing.blockedUntil || 0);
  }
  return { count: maxCount, blockedUntil: maxBlockedUntil };
}

async function clearLoginFailures(scopes) {
  const client = await getRedisClient();
  if (client) {
    const keys = scopes.flatMap((scope) => [`login:fail:${scope}`, `login:block:${scope}`]);
    await client.del(...keys).catch(() => {});
    return;
  }
  for (const scope of scopes) {
    loginFallback.delete(scope);
  }
}

function createVerificationToken() {
  return createTimedToken(24 * 60 * 60 * 1000);
}

function createPasswordResetToken() {
  return createTimedToken(60 * 60 * 1000);
}

async function upsertEmailVerificationToken(userId, token, expiresAt) {
  await query(
    `INSERT INTO email_verification_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
    [userId, token, expiresAt]
  ).catch(() => {});
}

async function upsertPasswordResetToken(userId, token, expiresAt) {
  await query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
    [userId, token, expiresAt]
  ).catch(() => {});
}

async function persistRefreshToken(userId, refreshToken, refreshExpiresAt) {
  await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [userId, refreshToken, refreshExpiresAt]
  ).catch(() => {});
}

async function deleteRefreshToken(refreshToken) {
  await revokeRefreshToken(refreshToken);
}

async function blacklistRefreshToken(refreshToken) {
  const client = await getRedisClient();
  if (!client || !refreshToken) return false;

  try {
    await client.set(buildRefreshBlacklistKey(refreshToken), '1', {
      PX: Math.max(1, getRefreshExpiresMs()),
    });
    return true;
  } catch {
    return false;
  }
}

async function blacklistAccessToken(accessToken) {
  const client = await getRedisClient();
  if (!client || !accessToken) return false;

  try {
    const payload = verifyAccessToken(accessToken);
    const ttlMs = Math.max(1, (Number(payload.exp || 0) * 1000) - Date.now());
    await client.set(buildAccessBlacklistKey(accessToken), '1', {
      PX: ttlMs,
    });
    return true;
  } catch {
    return false;
  }
}

async function isRefreshTokenBlacklisted(refreshToken) {
  const client = await getRedisClient();
  if (!client || !refreshToken) return false;

  try {
    return Boolean(await client.get(buildRefreshBlacklistKey(refreshToken)));
  } catch {
    return false;
  }
}

async function isAccessTokenBlacklisted(accessToken) {
  const client = await getRedisClient();
  if (!client || !accessToken) return false;

  try {
    return Boolean(await client.get(buildAccessBlacklistKey(accessToken)));
  } catch {
    return false;
  }
}

async function revokeRefreshToken(refreshToken) {
  await query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]).catch(() => {});
  await blacklistRefreshToken(refreshToken).catch(() => {});
}

async function rotateRefreshToken(userId, oldRefreshToken) {
  const { accessToken, refreshToken: newRefresh, refreshExpiresAt } = generateTokens(userId);

  await withTransaction(async (client) => {
    await client.query(`DELETE FROM refresh_tokens WHERE token = $1`, [oldRefreshToken]);
    await client.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, newRefresh, refreshExpiresAt]
    );
  });

  await blacklistRefreshToken(oldRefreshToken).catch(() => {});

  return { accessToken, refreshToken: newRefresh };
}

async function findUserByEmail(email) {
  return query(
    `SELECT id, email, password_hash, prenom, nom, is_admin, account_type, pro_category,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN pro_plan ELSE NULL END AS pro_plan,
            pro_expires_at, last_bon_plan_offer_at, email_verified, onboarding_step, COALESCE(tours_seen, '{}'::text[]) AS tours_seen, deleted_at
     FROM users WHERE email = $1`,
    [normalizeEmail(email)]
  );
}

async function findUserById(userId) {
  return query(
    `SELECT id, email, prenom, nom, telephone, phone_verified, email_verified,
            avatar_url, commune_id, bio, is_admin, account_type, pro_category,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN pro_plan ELSE NULL END AS pro_plan,
            pro_expires_at, last_bon_plan_offer_at, onboarding_step, COALESCE(tours_seen, '{}'::text[]) AS tours_seen,
            nb_annonces, note_moyenne, nb_avis, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
}

async function findUserByIdentifier(identifier) {
  const email = normalizeEmail(identifier);
  const telephone = normalizePhoneNumber(identifier);

  return query(
    `SELECT id, email, prenom, nom, telephone, phone_verified, email_verified,
            avatar_url, commune_id, bio, is_admin, account_type,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN pro_plan ELSE NULL END AS pro_plan,
            pro_expires_at, last_bon_plan_offer_at, onboarding_step, deleted_at
     FROM users
     WHERE deleted_at IS NULL
       AND (email = $1 OR telephone = $2)
     ORDER BY CASE
       WHEN email = $1 THEN 0
       WHEN telephone = $2 THEN 1
       ELSE 2
     END
     LIMIT 1`,
    [email, telephone]
  );
}

async function registerAccount({ email, password, prenom, nom, commune_id, account_type }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedAccountType = normalizeAccountType(account_type);
  const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw createHttpError(409, 'Cet email est déjà utilisé.');
  }

  const password_hash = await bcrypt.hash(password, 12);
  const user = await withTransaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO users (email, password_hash, prenom, nom, commune_id, is_pro, account_type, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING id, email, prenom, nom, is_admin, is_pro, pro_plan, pro_expires_at, last_bon_plan_offer_at, email_verified, onboarding_step, account_type, pro_category, COALESCE(tours_seen, '{}'::text[]) AS tours_seen`,
      [normalizedEmail, password_hash, prenom.trim(), nom.trim(), commune_id || null, normalizedAccountType === 'professional', normalizedAccountType]
    );
    return ins.rows[0];
  });

  const verification = createVerificationToken();
  await upsertEmailVerificationToken(user.id, verification.token, verification.expiresAt);

  const { accessToken, refreshToken, refreshExpiresAt } = generateTokens(user.id);
  await persistRefreshToken(user.id, refreshToken, refreshExpiresAt);
  await ensureNotificationPreferences(user.id).catch(() => {});

  return {
    user,
    verificationToken: verification.token,
    accessToken,
    refreshToken,
  };
}

async function loginAccount({ email, password }, meta = {}) {
  const scopes = getLoginScopes(email, meta.ip);
  const throttle = await getLoginThrottleState(scopes);
  if (throttle.blockedUntil && throttle.blockedUntil > Date.now()) {
    const waitMs = Math.max(0, throttle.blockedUntil - Date.now());
    const retryAfter = Math.max(1, Math.ceil(waitMs / 1000));
    const err = createHttpError(429, 'Trop de tentatives de connexion. Réessayez dans 15 minutes.', 'LOGIN_LOCKED');
    err.retryAfter = retryAfter;
    throw err;
  }

  const result = await findUserByEmail(email);
  const user = result.rows[0];

  if (!user || !user.password_hash) {
    const after = await recordLoginFailure(scopes);
    if (after.blockedUntil && after.blockedUntil > Date.now()) {
      const err = createHttpError(429, 'Trop de tentatives de connexion. Réessayez dans 15 minutes.', 'LOGIN_LOCKED');
      err.retryAfter = Math.max(1, Math.ceil((after.blockedUntil - Date.now()) / 1000));
      throw err;
    }
    throw createHttpError(401, 'Email ou mot de passe incorrect.');
  }
  if (user.deleted_at) {
    throw createHttpError(401, 'Ce compte a été supprimé.');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const after = await recordLoginFailure(scopes);
    if (after.blockedUntil && after.blockedUntil > Date.now()) {
      const err = createHttpError(429, 'Trop de tentatives de connexion. Réessayez dans 15 minutes.', 'LOGIN_LOCKED');
      err.retryAfter = Math.max(1, Math.ceil((after.blockedUntil - Date.now()) / 1000));
      throw err;
    }
    throw createHttpError(401, 'Email ou mot de passe incorrect.');
  }

  if (!user.email_verified) {
    throw createHttpError(403, 'Veuillez confirmer votre email avant de vous connecter.', 'EMAIL_NOT_VERIFIED');
  }

  await clearLoginFailures(scopes);
  const { accessToken, refreshToken, refreshExpiresAt } = generateTokens(user.id);
  await persistRefreshToken(user.id, refreshToken, refreshExpiresAt);

  return {
    user: buildSafeUser(user),
    accessToken,
    refreshToken,
  };
}

// SECURITY: rotation active, old refresh tokens are revoked and blacklisted on use.
// TODO: test refresh rotation after deploy with Redis blacklist enabled.
async function refreshSessionWithRotation(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw createHttpError(401, 'Token de rafra?chissement invalide ou expir?.');
  }

  if (await isRefreshTokenBlacklisted(refreshToken)) {
    throw createHttpError(401, 'Token de rafra?chissement invalide ou expir?.');
  }

  const tokenRow = await query(
    `SELECT id FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()`,
    [refreshToken, payload.sub]
  ).catch(() => ({ rows: [] }));
  if (!tokenRow.rows[0]) {
    throw createHttpError(401, 'Token de rafra?chissement invalide ou expir?.');
  }

  const user = await query(
    `SELECT id, email, prenom, nom, is_admin, account_type,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN TRUE ELSE FALSE END AS is_pro,
            CASE WHEN is_pro = TRUE AND (pro_expires_at IS NULL OR pro_expires_at > NOW()) THEN pro_plan ELSE NULL END AS pro_plan,
            pro_expires_at, last_bon_plan_offer_at, email_verified
     FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [payload.sub]
  );
  if (!user.rows[0]) {
    throw createHttpError(401, 'Utilisateur introuvable.');
  }

  return rotateRefreshToken(payload.sub, refreshToken);
}

async function requestPasswordReset(email) {
  const result = await findUserByIdentifier(email);
  const user = result.rows[0];
  if (!user) {
    return null;
  }

  return requestPasswordResetForUser(user);
}

async function requestPasswordResetForUser(user) {
  if (!user?.id) {
    return null;
  }

  const token = createPasswordResetToken();
  await upsertPasswordResetToken(user.id, token.token, token.expiresAt);

  return {
    user,
    token: token.token,
  };
}

async function confirmEmail(token) {
  const tokenRow = await query(
    `SELECT user_id FROM email_verification_tokens
     WHERE token = $1 AND expires_at > NOW()`,
    [token]
  ).catch(() => ({ rows: [] }));

  if (!tokenRow.rows[0]) {
    return null;
  }

  const userRow = await query(
    `UPDATE users
     SET email_verified = TRUE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, prenom, nom, is_admin, account_type, is_pro, pro_plan, pro_expires_at, last_bon_plan_offer_at, email_verified`,
    [tokenRow.rows[0].user_id]
  );

  await query(`DELETE FROM email_verification_tokens WHERE user_id = $1`, [tokenRow.rows[0].user_id]).catch(() => {});

  return userRow.rows[0] || null;
}

async function resendVerification(email) {
  const result = await query(
    `SELECT id, email, prenom, account_type, pro_plan, pro_expires_at, last_bon_plan_offer_at, email_verified
     FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [normalizeEmail(email)]
  );

  const user = result.rows[0];
  if (!user || user.email_verified) {
    return null;
  }

  const verification = createVerificationToken();
  await upsertEmailVerificationToken(user.id, verification.token, verification.expiresAt);

  return {
    user,
    token: verification.token,
  };
}

async function resetPasswordWithToken(token, password) {
  const tokenRow = await query(
    `SELECT user_id FROM password_reset_tokens
     WHERE token = $1 AND expires_at > NOW()`,
    [token]
  ).catch(() => ({ rows: [] }));

  if (!tokenRow.rows[0]) {
    return false;
  }

  const hash = await bcrypt.hash(password, 12);
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, tokenRow.rows[0].user_id]);
  await query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [tokenRow.rows[0].user_id]).catch(() => {});

  return true;
}

module.exports = {
  buildSafeUser,
  blacklistAccessToken,
  blacklistRefreshToken,
  confirmEmail,
  createHttpError,
  buildRefreshBlacklistKey,
  buildAccessBlacklistKey,
  createPasswordResetToken,
  createVerificationToken,
  deleteRefreshToken,
  findUserByEmail,
  findUserByIdentifier,
  findUserById,
  loginAccount,
  normalizeEmail,
  persistRefreshToken,
  refreshSessionWithRotation,
  registerAccount,
  resendVerification,
  requestPasswordReset,
  requestPasswordResetForUser,
  resetPasswordWithToken,
  isAccessTokenBlacklisted,
  revokeRefreshToken,
  rotateRefreshToken,
  upsertEmailVerificationToken,
  upsertPasswordResetToken,
};

````

## PATH: backend/src/middleware/authenticate.js
[fichier non trouv?]

## PATH: docker-compose.prod.yml
````
x-backend-env: &backend-env
  NODE_ENV: production
  PORT: 3001
  BASE_URL: ${BASE_URL}
  DB_HOST: pgbouncer
  DB_PORT: 6432
  DB_NAME: ${DB_NAME}
  DB_USER: ${DB_USER}
  DB_PASSWORD: ${DB_PASSWORD}
  DB_POOL_MAX: ${DB_POOL_MAX:-10}
  REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
  JWT_SECRET: ${JWT_SECRET}
  JWT_ACCESS_EXPIRES: ${JWT_ACCESS_EXPIRES}
  JWT_REFRESH_EXPIRES: ${JWT_REFRESH_EXPIRES}
  JWT_EXPIRES_IN: ${JWT_ACCESS_EXPIRES}
  JWT_REFRESH_EXPIRES_IN: ${JWT_REFRESH_EXPIRES}
  AWS_BUCKET: ${AWS_BUCKET}
  AWS_REGION: ${AWS_REGION}
  AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
  AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
  SMTP_HOST: ${SMTP_HOST}
  SMTP_PORT: ${SMTP_PORT}
  SMTP_USER: ${SMTP_USER}
  SMTP_PASS: ${SMTP_PASS}
  SMTP_FROM: ${SMTP_FROM}
  STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
  STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
  STRIPE_PRICE_PRO_MENSUEL: ${STRIPE_PRICE_PRO_MENSUEL}
  STRIPE_PRICE_PRO_ANNUEL: ${STRIPE_PRICE_PRO_ANNUEL}
  PAYPLUG_SECRET_KEY: ${PAYPLUG_SECRET_KEY}
  TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
  TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
  TWILIO_VERIFY_SID: ${TWILIO_VERIFY_SID}
  GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
  GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
  APPLE_CLIENT_ID: ${APPLE_CLIENT_ID}
  APPLE_TEAM_ID: ${APPLE_TEAM_ID}
  APPLE_KEY_ID: ${APPLE_KEY_ID}
  APPLE_PRIVATE_KEY: ${APPLE_PRIVATE_KEY}
  ADMIN_EMAIL: ${ADMIN_EMAIL}
  ADMIN_API_TOKEN: ${ADMIN_API_TOKEN}
  ADMIN_ALERT_EMAIL: ${ADMIN_ALERT_EMAIL}
  STORAGE_LOCAL_PATH: /app/uploads
  MAX_FILE_SIZE_MB: ${MAX_FILE_SIZE_MB}
  MAX_IMAGES_PER_LISTING: ${MAX_IMAGES_PER_LISTING}
  INTERNAL_API_TOKEN: ${INTERNAL_API_TOKEN}

services:
  nginx:
    image: nginx:1.27-alpine
    container_name: kalico_nginx
    restart: unless-stopped
    environment:
      SERVER_NAME: ${SERVER_NAME:-51.255.161.64.nip.io}
      ADMIN_SERVER_NAME: ${ADMIN_SERVER_NAME:-admin.51.255.161.64.nip.io}
      NGINX_SSL_ENABLED: ${NGINX_SSL_ENABLED:-false}
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/sites:/etc/nginx/conf.d:ro
      - ./docker/nginx/entrypoint.sh:/docker/nginx/entrypoint.sh:ro
      - ./nginx/logrotate.conf:/etc/logrotate.d/nginx:ro
      - certbot_www:/var/www/certbot:ro
      - certbot_conf:/etc/letsencrypt:ro
      - uploads_data:/app/uploads:ro
      - ./nginx/logs:/var/log/nginx
    entrypoint: ["/bin/sh", "/docker/nginx/entrypoint.sh"]
    depends_on:
      - backend
      - frontend
    networks:
      - app_net
      - kalico_internal

  certbot:
    image: certbot/certbot:v3.0.1
    container_name: kalico_certbot
    restart: unless-stopped
    volumes:
      - certbot_www:/var/www/certbot
      - certbot_conf:/etc/letsencrypt
    	entrypoint: ["tail", "-f", "/dev/null"]
    	command: []

  postgres:
    image: postgis/postgis:16-3.4
    container_name: kalico_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGBOUNCER_AUTH_PASSWORD: ${PGBOUNCER_AUTH_PASSWORD:-}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/01_init.sql:ro
      - ./database:/docker-entrypoint-initdb-src:ro
      - ./docker/postgres/init-pgbouncer-auth.sql:/docker-entrypoint-initdb.d/02_pgbouncer_auth.sql:ro
    networks:
      - db_net
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER} -d ${DB_NAME}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    container_name: kalico_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - cache_net
    healthcheck:
      test: ['CMD', 'redis-cli', '-a', '${REDIS_PASSWORD}', 'ping']
      interval: 10s
      retries: 5

  pgbouncer:
    build:
      context: ./docker/pgbouncer
      dockerfile: Dockerfile
    user: "1000:1000"
    restart: unless-stopped
    environment:
      DB_USER: ${DB_USER}
      DB_NAME: ${DB_NAME}
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      PGBOUNCER_PORT: 6432
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_AUTH_PASSWORD: ${PGBOUNCER_AUTH_PASSWORD:-}
      PGBOUNCER_MAX_CLIENT_CONN: ${PGBOUNCER_MAX_CLIENT_CONN:-500}
      PGBOUNCER_DEFAULT_POOL_SIZE: ${PGBOUNCER_DEFAULT_POOL_SIZE:-50}
      PGBOUNCER_RESERVE_POOL_SIZE: ${PGBOUNCER_RESERVE_POOL_SIZE:-20}
      PGBOUNCER_SERVER_IDLE_TIMEOUT: ${PGBOUNCER_SERVER_IDLE_TIMEOUT:-600}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - db_net
    healthcheck:
      test: ['CMD-SHELL', 'nc -z 127.0.0.1 6432']
      interval: 10s
      timeout: 5s
      retries: 10

  backend:
    image: ${BACKEND_IMAGE}
    restart: unless-stopped
    environment:
      <<: *backend-env
      RUN_JOBS: 'false'
    depends_on:
      pgbouncer:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - uploads_data:/app/uploads
    networks:
      - db_net
      - cache_net
      - app_net
      - kalico_internal

  worker:
    image: ${BACKEND_IMAGE}
    restart: unless-stopped
    command: ['npm', 'run', 'worker']
    environment:
      <<: *backend-env
      RUN_JOBS: 'true'
    depends_on:
      pgbouncer:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - uploads_data:/app/uploads
    networks:
      - db_net
      - cache_net
      - app_net
    healthcheck:
      test: ['CMD-SHELL', 'pgrep -f "node" > /dev/null || exit 1']
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        NEXT_PUBLIC_STRIPE_PK: ${NEXT_PUBLIC_STRIPE_PK}
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        NEXT_PUBLIC_DEMO_MODE: ${NEXT_PUBLIC_DEMO_MODE}
        NEXT_PUBLIC_SHOW_DEMO_BAR: ${NEXT_PUBLIC_SHOW_DEMO_BAR}
        NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: ${NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY}
        NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY: ${NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY}
        NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY: ${NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY}
        NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY: ${NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY}
    restart: unless-stopped
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-https://kalico-nc.com}
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_STRIPE_PK: ${NEXT_PUBLIC_STRIPE_PK}
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
      NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: ${NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY}
      NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY: ${NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY}
      NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY: ${NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY}
      NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY: ${NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY}
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      NEXT_PUBLIC_DEMO_MODE: ${NEXT_PUBLIC_DEMO_MODE}
      NEXT_PUBLIC_SHOW_DEMO_BAR: ${NEXT_PUBLIC_SHOW_DEMO_BAR}
    depends_on:
      - backend
    networks:
      - app_net
    healthcheck:
      test: ['CMD-SHELL', 'wget -qO- http://0.0.0.0:3000/api/health || exit 1']
      interval: 30s
      timeout: 10s
      retries: 3

  admin:
    build:
      context: ./admin
      dockerfile: Dockerfile
    container_name: kalico_admin
    restart: unless-stopped
    environment:
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD_HASH: ${ADMIN_PASSWORD_HASH}
      ADMIN_API_TOKEN: ${ADMIN_API_TOKEN}
      ADMIN_ALERT_EMAIL: ${ADMIN_ALERT_EMAIL}
      BACKEND_URL: http://backend:3001
      ADMIN_TOTP_SECRET: ${ADMIN_TOTP_SECRET}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-https://admin.51.255.161.64.nip.io}
      NODE_ENV: production
    depends_on:
      - backend
    networks:
      - kalico_internal
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3002/api/health']
      interval: 30s
      timeout: 10s
      retries: 3

  backup:
    build:
      context: ./
      dockerfile: backup/Dockerfile
    container_name: kalico_backup
    restart: unless-stopped
    environment:
      PGHOST: postgres
      PGPORT: 5432
      PGUSER: ${DB_USER}
      PGPASSWORD: ${DB_PASSWORD}
      PGDATABASE: ${DB_NAME}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_BUCKET: ${AWS_BUCKET}
      AWS_REGION: ${AWS_REGION}
    volumes:
      - backups_data:/backups
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - db_net

networks:
  db_net:
    driver: bridge
  cache_net:
    driver: bridge
  app_net:
    driver: bridge
  kalico_internal:
    driver: bridge
    internal: true

volumes:
  postgres_data:
    name: kalico_postgres_data
  redis_data:
    name: kalico_redis_data
  certbot_www:
    name: kalico_certbot_www
  certbot_conf:
    name: kalico_certbot_conf
  uploads_data:
    name: kalico_uploads_data
  backups_data:
    name: kalico_backups_data

````

## PATH: nginx/sites/kalico.nc.conf
````
# ============================================================
# Kalico site template
# Rendered by docker/nginx/entrypoint.sh
#
# NGINX_SSL_ENABLED=false -> HTTP-only bootstrap
# NGINX_SSL_ENABLED=true  -> HTTP redirect + HTTPS production
# ============================================================

# >>> HTTP_ONLY_BEGIN
server {
    listen 80;
    server_name ${SERVER_NAME} www.${SERVER_NAME};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    client_max_body_size 20M;

    location ^~ /api/auth {
        limit_req zone=api_auth burst=10 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host       $host;
        proxy_set_header X-Real-IP  $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
    }

    location ^~ /api/listings {
        limit_req zone=api_listings burst=15 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host       $host;
        proxy_set_header X-Real-IP  $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
    }

    location ^~ /api/upload/ {
        limit_req zone=upload burst=5 nodelay;
        client_max_body_size 15M;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host       $host;
        proxy_set_header X-Real-IP  $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location ^~ /api/ {
        limit_req zone=api burst=30 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host       $host;
        proxy_set_header X-Real-IP  $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
    }

    location ~ ^/uploads/[0-9]+ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host       $host;
        proxy_set_header X-Real-IP  $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    location /uploads/ {
        alias /app/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }

    location /ws {
        proxy_pass         http://backend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "Upgrade";
        proxy_set_header   Host       $host;
        proxy_set_header   X-Real-IP  $remote_addr;
        proxy_read_timeout 3600s;
    }

    location = /api/payment/webhook {
        return 308 /api/payment/webhooks/stripe;
    }

    location /api/payment/webhooks/stripe {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass         http://frontend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_set_header   X-Real-IP  $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    location /_next/static/ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
# <<< HTTP_ONLY_END

# >>> HTTPS_BEGIN
server {
    listen 80;
    server_name ${SERVER_NAME} www.${SERVER_NAME};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://${SERVER_NAME}$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name www.${SERVER_NAME};

    ssl_certificate     /etc/letsencrypt/live/${SERVER_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${SERVER_NAME}/privkey.pem;

    return 301 https://${SERVER_NAME}$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${SERVER_NAME};

    ssl_certificate     /etc/letsencrypt/live/${SERVER_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${SERVER_NAME}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains" always;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self), payment=(self)" always;

    resolver 127.0.0.11 valid=10s ipv6=off;

    add_header Content-Security-Policy "
        default-src 'self';
        script-src  'self' 'unsafe-inline' js.stripe.com;
        style-src   'self' 'unsafe-inline';
        img-src     'self' data: blob: *.amazonaws.com https://${SERVER_NAME};
        font-src    'self' data:;
        connect-src 'self' api.stripe.com wss://${SERVER_NAME} https://${SERVER_NAME};
        frame-src   js.stripe.com hooks.stripe.com;
        object-src  'none';
        base-uri    'self';
        form-action 'self';
    " always;

    client_max_body_size 20M;

    location /api/ {
        limit_req zone=api burst=30 nodelay;
        proxy_pass         http://backend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_set_header   X-Real-IP  $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    location /api/auth/login {
        limit_req zone=api_auth burst=10 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/auth/register {
        limit_req zone=api_auth burst=10 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/upload/ {
        limit_req zone=upload burst=5 nodelay;
        client_max_body_size 20M;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location ~ ^/uploads/[0-9]+ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host       $host;
        proxy_set_header X-Real-IP  $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    location /uploads/ {
        alias /app/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }

    location /ws {
        proxy_pass         http://backend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "Upgrade";
        proxy_set_header   Host       $host;
        proxy_set_header   X-Real-IP  $remote_addr;
        proxy_read_timeout 3600s;
    }

    location = /api/payment/webhook {
        return 308 /api/payment/webhooks/stripe;
    }

    location /api/payment/webhooks/stripe {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass         http://frontend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_set_header   X-Real-IP  $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    location /_next/static/ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
# <<< HTTPS_END

````

## PATH: playwright.config.ts
````
import { defineConfig, devices } from '@playwright/test'
import { storageStatePath } from './tests/support/auth'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
const isExternalUrl = /^https?:\/\//i.test(baseURL) && !/^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?/i.test(baseURL)
const desktop = { ...devices['Desktop Chrome'] }
const iPhone13 = { ...devices['iPhone 13'] }
const mobileChrome = { ...devices['Pixel 7'] }
const mobileSafari = { ...devices['iPhone 14'] }
const samsungGalaxyS22 = {
  viewport: { width: 360, height: 780 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
}
const authState = (role: 'particulier' | 'vendeur' | 'pro' | 'conducteur' | 'admin') => storageStatePath(role)
const useLocalWebServer = process.env.PLAYWRIGHT_USE_LOCAL_SERVER !== 'false' && !isExternalUrl
const visualProjects = [
  {
    name: 'Desktop Chrome',
    testMatch: /visual\/.*\.spec\.ts$/,
    use: { ...desktop },
  },
  {
    name: 'iPhone 13',
    testMatch: /visual\/.*\.spec\.ts$/,
    use: { ...iPhone13 },
  },
  {
    name: 'Samsung Galaxy S22',
    testMatch: /visual\/.*\.spec\.ts$/,
    use: { ...samsungGalaxyS22 },
  },
] as const

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  globalSetup: './tests/global-setup',
  globalTeardown: './tests/global-teardown',
  reporter: [
    ['line'],
    ['html', { open: 'never' }],
    ['./tests/reporters/consolidated-report'],
  ],
  outputDir: 'test-results',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
  },
  projects: [
    ...visualProjects,
    {
      name: 'mobile-chrome',
      testMatch: /e2e\/mobile\/.*\.spec\.ts$/,
      use: {
        browserName: 'chromium',
        ...mobileChrome,
      },
    },
    {
      name: 'mobile-safari',
      testMatch: /e2e\/mobile\/.*\.spec\.ts$/,
      use: {
        browserName: 'webkit',
        ...mobileSafari,
      },
    },
    {
      name: 'smoke',
      testMatch: /smoke\/.*\.spec\.ts$/,
      use: {
        ...desktop,
      },
    },
    {
      name: 'public',
      testMatch: /public\.spec\.ts$/,
      use: {
        ...desktop,
      },
    },
    {
      name: 'particulier',
      testMatch: /particulier\.spec\.ts$/,
      use: {
        ...desktop,
        storageState: authState('particulier'),
      },
    },
    {
      name: 'vendeur',
      testMatch: /vendeur\.spec\.ts$/,
      use: {
        ...desktop,
        storageState: authState('vendeur'),
      },
    },
    {
      name: 'pro',
      testMatch: /pro\.spec\.ts$/,
      use: {
        ...desktop,
        storageState: authState('pro'),
      },
    },
    {
      name: 'conducteur',
      testMatch: /conducteur\.spec\.ts$/,
      use: {
        ...desktop,
        storageState: authState('conducteur'),
      },
    },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts$/,
      use: {
        ...desktop,
        storageState: authState('admin'),
      },
    },
  ],
})

````

## PATH: vercel.json
[fichier non trouv?]

## PATH: eas.json
[fichier non trouv?]

## PATH: app.json
[fichier non trouv?]

## PATH: package.json
````
{
  "name": "kalico-root",
  "version": "1.0.0-rc1",
  "private": true,
  "scripts": {
    "seed": "node database/seeds/demo-seed.js",
    "seed:reset": "npm run seed",
    "seed:playwright": "node backend/src/scripts/seedPlaywrightUsers.js",
    "dev": "node scripts/dev.js",
    "migrate": "node scripts/migrate.js",
    "test:e2e": "playwright test",
    "test:e2e:smoke": "playwright test --project=smoke",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.60.0",
    "@types/node": "^25.9.2",
    "msw": "^2.14.6"
  }
}

````

## PATH: DESIGN.md
````
# KALICO NC - Design System & Gouvernance visuelle

Ce document est la reference visuelle du projet Kalico NC.
Tout changement visuel futur doit s y conformer.

## 1. Identite de marque

### Positionnement
Kalico est la marketplace de proximite de Nouvelle-Caledonie.
Le visuel doit rester chaleureux, local, de confiance et professionnel, sans devenir corporatif.

### Anti-patterns a eviter
- froid
- generique
- trop sombre
- trop flashy
- style "site IA"
- jargon technique visible

### Voix et ton des textes
- Pas de tiret cadratin dans les textes visibles
- Phrases courtes
- Ancrage geographique explicite : NC, Noumea, communes, provinces, ile, archipel
- Un seul pronom de traitement a definir pour toute l app : TODO: choisir entre tutoiement ou vouvoiement et harmoniser partout
- Pas de jargon technique visible cote utilisateur

---

## 2. Design tokens

### 2.1 Palette de couleurs

Les couleurs ci-dessous viennent de `frontend/src/app/globals.css` et de `frontend/tailwind.config.js`.

| Token | Valeur light | Valeur dark / override | Role semantique | Contraste approx sur fond blanc |
|---|---:|---:|---|---:|
| `--coral` | `#0a7ea4` | identique | CTA principal, accents d action | ~4.6:1 |
| `--ocean` | `#08324f` | identique | fond profond, hover accent | ~12:1 |
| `--lagoon` | `#48cae4` | identique | accent info, decoration | ~1.8:1, pas pour texte courant |
| `--sand` | `#f4f8f7` | identique | fond secondaire, surface douce | ~1:1, couleur de fond |
| `--jungle` | `#2d6a4f` | identique | success secondaire, eco, confiance | ~6:1 |
| `--night` | `#082032` | identique | texte principal et fond profond | ~15:1 |
| `--color-background-primary` | `#fbfcfc` | `#04121e` | fond de base de page | ~1:1 |
| `--color-background-secondary` | `#f4f8f7` | `#082032` | fond de surface secondaire | ~1:1 |
| `--color-bg-page` | `#f4f8f7` | `#04121e` | fond global des pages | ~1:1 |
| `--color-surface` | `#fbfcfc` | `#04121e` | fond de carte / surface | ~1:1 |
| `--color-surface-raised` | `#ffffff` | `#082032` | cartes elevées, panneaux | ~1:1 |
| `--color-border` | `rgba(8, 32, 50, 0.1)` | `rgba(255, 255, 255, 0.1)` | bordure standard | n/a |
| `--color-border-secondary` | `rgba(8, 32, 50, 0.1)` | `rgba(255, 255, 255, 0.1)` | bordure secondaire | n/a |
| `--color-border-strong` | `rgba(10, 126, 164, 0.26)` | `rgba(72, 202, 228, 0.28)` | bordure active / focus visuel | n/a |
| `--color-text-primary` | `#082032` | `#f7fbfc` | texte principal | ~15:1 |
| `--color-text-secondary` | `rgba(8, 32, 50, 0.72)` | `rgba(247, 251, 252, 0.72)` | texte secondaire | ~8:1 |
| `--color-text-tertiary` | `rgba(8, 32, 50, 0.46)` | `rgba(247, 251, 252, 0.48)` | meta, aide, labels faibles | ~4:1 |
| `--color-success` | `#2d6a4f` | `#4ade80` | success, confirmation | ~6:1 |
| `--color-warning` | `#d97706` | `#f59e0b` | alerte, attention | ~3.8:1 |
| `--color-danger` | `#d7263d` | `#f87171` | erreur, suppression, validation negative | ~4.9:1 |
| `--color-info` | `#0a7ea4` | `#48cae4` | information, lien d accent | ~4.6:1 |
| `--nc-lagon` | `#1e90ff` | identique | badge eau / mer / visuel secondaire | ~3.2:1, plutot decoration |
| `--nc-lagon-light` | `rgba(30, 144, 255, 0.08)` | identique | fond de badge / chip lagon | n/a |
| `--nc-lagon-border` | `rgba(30, 144, 255, 0.25)` | identique | bordure badge lagon | n/a |
| `--nc-lagon-text` | `#0a4d8c` | identique | texte badge lagon | ~7.5:1 |
| `--nc-emeraude` | `#2e8b57` | identique | badge nature / pro / confiance | ~5.6:1 |
| `--nc-emeraude-light` | `rgba(46, 139, 87, 0.08)` | identique | fond de badge emeraude | n/a |
| `--nc-emeraude-border` | `rgba(46, 139, 87, 0.25)` | identique | bordure badge emeraude | n/a |
| `--nc-emeraude-text` | `#1a5233` | identique | texte badge emeraude | ~10:1 |
| `--nc-corail` | `#ff6b6b` | identique | badge alerte douce / accent secondaire | ~2.7:1, decoration |
| `--nc-corail-light` | `rgba(255, 107, 107, 0.08)` | identique | fond de badge corail | n/a |
| `--nc-corail-border` | `rgba(255, 107, 107, 0.25)` | identique | bordure badge corail | n/a |
| `--nc-corail-text` | `#8b0000` | identique | texte badge corail | ~9:1 |
| `--nc-sable` | `#f5a623` | identique | badge bons plans / vente douce | ~2.2:1, decoration |
| `--nc-sable-light` | `rgba(245, 166, 35, 0.08)` | identique | fond de badge sable | n/a |
| `--nc-sable-border` | `rgba(245, 166, 35, 0.25)` | identique | bordure badge sable | n/a |
| `--nc-sable-text` | `#7a4800` | identique | texte badge sable | ~8:1 |

### Tokens de theme et de compatibilite
- `html[data-theme='dark']` est la reference canonique pour le theme sombre.
- Les aliases `.dark ...` restent actifs comme compatibilite.
- Les classes Tailwind suivantes sont remapees dans `globals.css` pour respecter le theme :
  - `.bg-white`
  - `.bg-white/*`
  - `.bg-sand`
  - `.bg-sand/*`
  - `.text-night`
  - `.text-night/*`
  - `.border-night/*`

### Typographie

Fichiers de reference :
- `frontend/src/app/globals.css`
- `frontend/tailwind.config.js`

Familles :
- `font-display` : titres, heroes, cartes editorialisées
- `font-body` : texte courant, formulaires, navigation
- `font-mono` : codes, donnees techniques, tokens ou diagnostics

Echelle recommandee :

| Niveau | Classe / usage |
|---|---|
| H1 hero | `font-display text-5xl md:text-6xl font-bold leading-[1.05]` |
| H2 section | `font-display text-4xl md:text-5xl font-bold leading-tight` |
| H3 carte | `font-display text-2xl md:text-3xl font-bold leading-tight` |
| H4 / sous-titre | `font-display text-xl font-semibold leading-tight` |
| Body large | `text-lg leading-7` |
| Body standard | `text-base leading-6` |
| Body small | `text-sm leading-5` |
| Caption / meta | `text-xs leading-4` |
| Micro / badge | `text-[10px]` ou `text-[11px]` reserve aux pills et metadonnees |

Poids autorises et usages :
- `font-normal` : texte courant
- `font-medium` : labels, metas, liens secondaires
- `font-semibold` : boutons, titres de carte, badges
- `font-bold` : titres, chiffres clés, pricing

### Espacements

Grille de base : 8pt.

Valeurs autorisees et classes Tailwind usuelles :
- 4px : `p-1`, `m-1`, `gap-1`
- 8px : `p-2`, `m-2`, `gap-2`
- 12px : `p-3`, `m-3`, `gap-3`
- 16px : `p-4`, `m-4`, `gap-4`
- 24px : `p-6`, `m-6`, `gap-6`
- 32px : `p-8`, `m-8`, `gap-8`
- 48px : `p-12`, `m-12`, `gap-12`
- 64px : `p-16`, `m-16`, `gap-16`

Regle :
- toute valeur hors grille doit etre justifiee
- les ecarts ponctuels visibles dans le projet sont surtout :
  - `gap-1.5`
  - `gap-2.5`
  - `gap-3.5`
  - `px-5`
  - `py-7`
  - `pl-9`
  - `mt-[-1rem]`
  - `max-w-[...]`
  - `w-[...]`
  - `h-[...]`

### Rayons de bordure

Le projet n a pas de variable CSS dedicatee pour le radius. Les conventions observables sont :
- cards standards : `rounded-xl` ou `rounded-2xl`
- cartes marketing / hero : `rounded-[1.25rem]` ou `rounded-[1.5rem]`
- inputs et boutons : `rounded-md`
- pills et badges : `rounded-full`
- modales / panneaux denses : `rounded-2xl`

Regles :
- card = rayon doux mais pas circulaire
- button = rayon leger, lisible, tactile
- pill = `rounded-full`
- input = rayon de controle standard, pas de gros arrondi de carte

### Transitions et animations

Durations observees / recommandees :
- interactions : `150ms`
- hover card : `250ms`
- modales et panneaux : `300ms`
- fade-in marketing : `400ms`
- pulse one-shot : `520ms`

Easing recommande :
- `ease-out`
- ou `cubic-bezier(0.16, 1, 0.3, 1)` pour les entrees de panneaux

Regle :
- pas d animation superieure a `400ms` sans justification UX
- `prefers-reduced-motion` doit toujours etre respecte

---

## 3. Catalogue des composants

### Boutons

Reference centrale :
- `frontend/src/app/globals.css`

Variantes :

| Classe | Usage | Couleurs / etats |
|---|---|---|
| `.btn-primary` | action principale, validation, CTA | fond `--coral`, texte blanc, hover `--ocean`, disabled opacity 50 |
| `.btn-secondary` | action secondaire / neutre | bordure `--color-border-strong`, texte `--color-text-primary`, hover fond subtil |
| `.btn-ghost` | action discrète / lien bouton | texte `--coral`, hover fond subtil |
| `.btn-danger` | suppression, desactivation, action destructive | fond `--color-danger`, texte blanc |

Regle :
- ne jamais fabriquer un bouton inline avec des classes Tailwind ad hoc si la variante globale existe deja
- si une nouvelle variante est necessaire, l ajouter dans `globals.css` avant usage

### Inputs

Reference centrale :
- `frontend/src/app/globals.css`

Classes :
- `.input`
- `.field-label`
- `.field-help`
- `.field-error`
- `.field-success`

Etats :
- default : surface `--color-surface-raised`, bordure `--color-border`
- focus : bordure `--coral`
- error : `--color-danger`
- success : `--color-success`
- disabled : a expliciter au cas par cas, via `opacity` et `cursor-not-allowed`

Regle :
- les erreurs utilisent `--color-danger`, pas `red-500` ou `red-50` generiques

### Cards d annonce - `ListingCard`

Fichier :
- `frontend/src/components/listings/ListingCard.tsx`

Tokens et regles :
- fond de carte : `bg-white/96` dans le composant, a harmoniser avec `--color-surface-raised` si refonte
- bordure : `border-night/10` + bordure accent a gauche selon type
- ombre : `shadow-sm` + `shadow-card` via classe globale
- image : `bg-sand` + fallback image / `ListingImage`
- titres : `text-night`, `font-medium`
- prix : `text-night`, `font-bold`
- meta : `text-night/55` et chips en badges globaux

Regle :
- hover subtil seulement, pas d effet carte flottante agressif
- les badges de categorie et de statut doivent passer par `badge-*` quand possible

### Badges et pills

Reference :
- `frontend/src/app/globals.css`

Variantes existantes :
- `.badge`
- `.badge-primary`
- `.badge-success`
- `.badge-info`
- `.badge-warning`
- `.badge-danger`
- `.badge-muted`
- `.badge-lagon`
- `.badge-emeraude`
- `.badge-corail`
- `.badge-sable`

Regle :
- ne pas creer de badge inline avec `bg-emerald-50` ou equivalent si une variante badge existe
- le badge doit rester compact, lisible, et sans surcharge visuelle

### Etats vides

Composant de reference unique :
- `frontend/src/components/ui/EmptyStates.tsx`

Variantes :
- search
- messages
- favoris
- annonces
- notifications
- generic

Regle :
- ne pas inventer d etat vide ad hoc dans une page si la variante manque, il faut d abord enrichir `EmptyStates.tsx`

### Toasts et notifications

Composants :
- `frontend/src/components/ui/ToastCenter.tsx`
- `frontend/src/components/onboarding/OnboardingToast.tsx`
- `frontend/src/components/ui/NotificationBell.tsx`

Regles communes :
- position flottante, ne doit pas bloquer la navigation
- apparition douce, disparition automatique ou explicite
- info / success / error doivent reprendre la palette du projet

### Modales

Il n y a pas de primitive unique de modal dans `components/ui/`.

Composants metier qui jouent un role de modal / panneau :
- `AuthRequiredModal`
- `BoostModal`
- `ProBookingModal`
- `SearchAlertModal`
- `RideReviewModal`
- `PassengerProfileModal`
- `TrocProposalModal`
- `PaymentFailureBanner` est un bandeau, pas une modal

Regles communes a respecter :
- backdrop sombre et discret
- rayon de bordure proche de `rounded-2xl`
- surface sur `--color-surface-raised`
- padding lisible, jamais serre
- z-index au-dessus du contenu applicatif

### Autres composants UI reutilisables notables

- `frontend/src/components/ui/DemoModeSwitcher.tsx`
- `frontend/src/components/ui/FeedbackAlert.tsx`
- `frontend/src/components/ui/ProfileDemoPreview.tsx`
- `frontend/src/components/ui/SearchAutocomplete.tsx`
- `frontend/src/components/ui/ThemeToggle.tsx`
- `frontend/src/components/ui/PdfViewer.tsx`

---

## 4. Heuristiques Nielsen - checklist par page

L evaluation ci-dessous est basee sur le code, pas sur une visite manuelle du site.

### Home `/`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ⚠️ Partiel
4. Cohérence et standards - ⚠️ Partiel
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ✅ Respecte
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ⚠️ Partiel
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ⚠️ Partiel
10. Aide et documentation - ⚠️ Partiel

### Inscription `/inscription`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ⚠️ Partiel
4. Cohérence et standards - ⚠️ Partiel
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ✅ Respecte
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ⚠️ Partiel
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ✅ Respecte
10. Aide et documentation - ⚠️ Partiel

### Connexion `/connexion`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ✅ Respecte
4. Cohérence et standards - ⚠️ Partiel
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ✅ Respecte
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ✅ Respecte
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ✅ Respecte
10. Aide et documentation - ⚠️ Partiel

### Dépôt d annonce `/annonces/nouvelle`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ✅ Respecte
4. Cohérence et standards - ⚠️ Partiel
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ⚠️ Partiel
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ⚠️ Partiel
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ✅ Respecte
10. Aide et documentation - ⚠️ Partiel

### Détail annonce `/annonces/[id]`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ✅ Respecte
4. Cohérence et standards - ✅ Respecte
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ⚠️ Partiel
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ✅ Respecte
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ⚠️ Partiel
10. Aide et documentation - ⚠️ Partiel

### Profil `/profil`

1. Visibilite de l etat systeme - ⚠️ Partiel
2. Correspondance avec le monde reel - ✅ Respecte
3. Controle et liberte utilisateur - ✅ Respecte
4. Cohérence et standards - ⚠️ Partiel
5. Prevention des erreurs - ⚠️ Partiel
6. Reconnaissance plutot que memoire - ✅ Respecte
7. Flexibilite et efficience - ⚠️ Partiel
8. Esthetique et design minimaliste - ⚠️ Partiel
9. Aider a reconnaitre, diagnostiquer, recuperer les erreurs - ✅ Respecte
10. Aide et documentation - ⚠️ Partiel

---

## 5. Dette technique visuelle priorisee

Basee sur l audit du frontend.

| Fichier | Probleme | Type | Priorite | Effort |
|---|---|---|---|---|
| `frontend/src/components/home/HomeSections.tsx` | Fond hero et nombreuses couleurs codees en dur | couleur-dure | P0 | L |
| `frontend/src/components/home/HomeSections.tsx` | Espacements et tailles non homogenes | spacing | P0 | L |
| `frontend/src/app/pro/ProLandingPageClient.tsx` | Palette tres codee en dur, peu tokenisee | couleur-dure | P1 | L |
| `frontend/src/components/auth/AuthMapPanel.tsx` | Couleurs et surfaces trop specifiques | couleur-dure | P1 | M |
| `frontend/src/components/share/ShareSheet.tsx` | Couleurs de fond et bordures non standard | couleur-dure | P1 | M |
| `frontend/src/components/annonces/AnnoncesMap.tsx` | Styles carte et overlay peu alignes sur les tokens | couleur-dure | P1 | M |
| `frontend/src/app/pro/dashboard/parametres/page.tsx` | Couleurs/alertes peu harmonisees | couleur-dure | P1 | M |
| `frontend/src/app/evenements/page.tsx` | Palette encore tres generique | couleur-dure | P1 | M |
| `frontend/src/app/fret/page.tsx` | Mix de tokens et couleurs sémantiques | couleur-dure | P1 | M |
| `frontend/src/app/covoiturage/page.tsx` | Sections encore heterogenes en couleur | couleur-dure | P1 | M |
| `frontend/src/app/annonces/page.tsx` | Quelques gradients et couleurs d anciennes generations | couleur-dure | P1 | M |
| `frontend/src/app/inscription/page.tsx` | Quelques gradients inline et alertes semantic Tailwind | couleur-dure | P1 | M |
| `frontend/src/components/layout/Header.tsx` | Valeurs fixes de largeur/hauteur et safe area | spacing | P0 | M |
| `frontend/src/components/ui/SearchAutocomplete.tsx` | Largeurs et espacements fixes, spinner local | spacing | P2 | S |
| `frontend/src/components/ui/ProfileDemoPreview.tsx` | Cards tres denses et tailles fixes | spacing | P2 | M |
| `frontend/src/components/ui/EmptyStates.tsx` | Certains textes et libelles encore incomplets / encodage | encodage | P2 | S |
| `frontend/src/components/ui/ToastCenter.tsx` | Couleurs hardcodées pour les tons de toasts | couleur-dure | P2 | S |
| `frontend/src/components/ui/NotificationBell.tsx` | Couleurs d alertes et load state en palettes generiques | couleur-dure | P2 | S |
| `frontend/src/components/home/CategoryGridSection.tsx` | Anciennes versions avaient des couleurs durcies, maintenant alignee | token-manquant | P2 | XS |
| `frontend/src/app/connexion/ConnexionClient.tsx` | Styles globaux encore majoritairement light-only | responsive | P2 | S |
| `frontend/src/app/annonces/nouvelle/page.tsx` | Panneau lateral avec gradient inline durci | couleur-dure | P1 | S |

Types de dette :
- encodage
- couleur-dure
- spacing
- token-manquant
- responsive
- accessibilite

---

## 6. Gouvernance - process de modification visuelle

### Regle d or
Toute modification visuelle doit passer par les tokens de ce document.
Si un token manque, il faut l ajouter ici avant de l utiliser dans le code.

### Checklist PR visuelle
- [ ] Aucune couleur hex codee en dur hors tokens definis ici
- [ ] Aucune taille de police hors echelle typographique
- [ ] Aucun espacement hors grille 8pt ou justifie
- [ ] Dark mode teste pour les composants modifies
- [ ] Contraste WCAG verifie pour les nouvelles couleurs
- [ ] Aucun tiret cadratin dans les textes visibles
- [ ] Build Next.js passe sans erreur
- [ ] Heuristiques Nielsen non regressees

### Qui valide
Toute modification de ce fichier doit etre validee par le fondateur, Leo, avant merge.

---

## 7. Direction visuelle - decisions produit

### Cards d annonces - systeme deux niveaux

#### NIVEAU 1 - Card standard (annonces gratuites)
Style de reference : Leboncoin
- Layout : photo a gauche ou en haut + infos texte sous / a droite
- Degradation gracieuse : lisible meme sans photo, avec fallback initiale categorie sur `--color-surface-raised`
- Optimise connexion lente : pas d image bloquante, skeleton immediate
- Tokens : `bg-white`, `border` sur `var(--color-border)`, `text-night`, prix en `coral`
- Hover : `translateY(-2px)` + box-shadow legere, transition 150ms

#### NIVEAU 2 - Card mise en avant (annonces boostees / payantes)
Style de reference : Wallapop / Vinted
- Layout : photo plein format, ratio 4:3, prix en overlay bas gauche sur degradé sombre
- Badge `A la une` ou `Pro` en haut a droite
- Hover : `scale(1.02)` + shadow plus prononcee, transition 200ms
- Tokens : overlay `rgba(0,0,0,0.45)` sur photo, prix en blanc, badge coral

Regle :
- ne jamais utiliser le style niveau 2 pour une annonce gratuite
- le niveau est defini par un champ `boosted` ou `featured` dans les donnees

### Sections vides - CTA stimulant

Remplacer tous les etats vides passifs par un CTA actif.

Structure :
- Icone animee avec pulse subtil, 2s loop, opacity 0.6 -> 1 -> 0.6
- Titre court en `font-display`, accrocheur, ancre NC
- Sous-titre court, maximum 10 mots
- Bouton `btn-primary`

Exemples de copywriting par section :
- Promotions : "La premiere promo NC, c est la votre." / CTA "Publier une offre"
- Culture : "Le prochain evenement NC merite d etre ici." / CTA "Creer un evenement"
- Covoiturage : "Le premier trajet, c est souvent le plus utile." / CTA "Proposer un trajet"
- Troc : "Le troc, c est dans l ADN caledonien." / CTA "Proposer un echange"

Regle :
- aucun texte de type "Aucun X pour le moment" ne doit rester visible pour l utilisateur
- toujours remplacer par un CTA

### Micro-interactions - niveau modere

Transitions standard :
- Interactions UI : 150ms ease-out
- Apparition de modales et drawers : 250ms ease-out
- Animations decoratives : 300-400ms

Animations autorisees :
- Cards : `translateY(-2px)` au hover + box-shadow
- Sections au scroll : fade-in + `translateY(16px -> 0)`, une seule fois, via `IntersectionObserver`
- CTA sections vides : pulse sur l icone, sur l opacite
- Boutons : `scale(0.97)` au clic, pour un feedback tactile

Animations interdites :
- Parallaxe, pour raison de performance sur connexion lente
- Animations > 400ms sur elements fonctionnels
- Auto-play video ou GIF sans controle utilisateur
- Spinner infini sans timeout, max 8s puis message d erreur

Regle accessibilite :
- toute animation doit etre desactivee si `prefers-reduced-motion: reduce` est actif
- CSS cible :
  - `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`

### Performance et degradation gracieuse

Priorite connexion lente, contexte Nouvelle-Caledonie :
- toute image doit avoir un skeleton ou fallback immediat
- pas de police bloquante : `font-display: swap` sur toutes les polices custom
- les sections de la home se chargent independamment, sans waterfall bloquant
- images : lazy loading par defaut, `priority` uniquement sur les 2 premieres cards hero

---

## 8. Principes visuels de reference

### Lois UX appliquees a Kalico

Loi de Fitts : boutons CTA min 44x44px sur mobile, positionnes dans la zone de confort du pouce (bas de l ecran, pas de CTA principal en haut).

Loi de Hick : max 5 choix visibles simultanement dans un formulaire ou un menu. Au-dela, paginer ou grouper.

Loi de Miller : max 7 categories visibles dans un menu ou une grille sans scroll.

Loi de Jakob : s aligner sur les conventions des marketplaces connues (Leboncoin, Vinted) pour les patterns de navigation et de publication.

### Principes Gestalt appliques

Proximite : espacement interne card 12px, espacement entre cards 16px minimum.

Similarite : tous les boutons primaires identiques, tous les prix en coral, toutes les localisations en text-tertiary.

Continuite : grille alignee sur 8pt, pas d elements flottants sans ancrage visuel.

### Emotion Design - 3 niveaux Kalico

Visceral (0-50ms) : fond creme #fdf8f1, pirogue logo, palette NC orange/turquoise. Objectif : chaleur et appartenance immediate.

Comportemental : micro-interactions moderees, transitions 150ms, feedback tactile sur les clics. Objectif : fluidite et confiance.

Reflexif : copywriting ancre NC, "Ce qui se vend en NC, c est ici", sections localisees (Noumea, Loyautes, communes). Objectif : attachement a la marque locale.

### Metriques WCAG 2.1

Contraste texte normal : min 4.5:1

Contraste grands titres : min 3:1

Zone cliquable mobile : min 44x44px

Animations : desactivees si prefers-reduced-motion

Ratios actuels Kalico :
- #e8832a (coral) sur blanc : ~3.2:1 -> acceptable pour titres, insuffisant pour texte courant -> compenser en augmentant la taille ou le poids
- #1d9e75 (emeraude) sur blanc : ~4.6:1 -> conforme
- #1a2e25 (night) sur blanc : ~13:1 -> excellent

## 9. Rappels operationnels

- `html[data-theme='dark']` est la source de verite pour le dark mode.
- Les composants de base doivent utiliser les tokens et les classes globales avant les couleurs utilitaires locales.
- Les etats vides doivent passer par `EmptyStates.tsx` autant que possible.
- Les notifications doivent passer par `ToastCenter.tsx` ou un composant dedie clairement documente.
- Les composants de hero et de home restent les plus sensibles au design system.

````

## PATH: .github/workflows/ci.yml
````
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  ci:
    name: Security, Load and Playwright
    runs-on: ubuntu-latest

    env:
      PLAYWRIGHT_BASE_URL: http://127.0.0.1:3000
      PLAYWRIGHT_BACKEND_URL: http://127.0.0.1:3001
      PLAYWRIGHT_USE_LOCAL_SERVER: 'true'
      PLAYWRIGHT_USE_DEMO_SERVER: 'true'
      PLAYWRIGHT_ENABLE_MSW: 'false'
      NODE_EXE: node
      K6_BASE_URL: http://127.0.0.1:3000
      K6_USERNAME: pro@demo.kalico
      K6_PASSWORD: Demo1234!
      STRIPE_E2E_ENABLED: ${{ secrets.STRIPE_E2E_ENABLED }}
      SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            package-lock.json
            frontend/package-lock.json

      - name: Install root dependencies
        run: npm ci

      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Security scan - dependencies
        if: ${{ secrets.SNYK_TOKEN != '' }}
        uses: snyk/actions/node@v1.0.0
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --all-projects --severity-threshold=high

      - name: Security scan - code
        if: ${{ secrets.SNYK_TOKEN != '' }}
        run: npx --yes snyk@1 code test --severity-threshold=high .
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Install k6
        uses: grafana/setup-k6-action@v1

      - name: Start local demo services
        run: |
          node playwright-launch-services.js > playwright-launch.log 2>&1 &
          echo $! > playwright-launch.pid

      - name: Wait for app health
        run: |
          for i in $(seq 1 60); do
            if curl -fsS http://127.0.0.1:3000 >/dev/null && curl -fsS http://127.0.0.1:3001/api/health >/dev/null; then
              exit 0
            fi
            sleep 5
          done
          echo "Services did not become healthy in time"
          cat playwright-launch.log || true
          exit 1

      - name: Run k6 load test
        uses: grafana/run-k6-action@v1
        with:
          path: tests/performance/critical-routes.js

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright E2E
        run: npm run test:e2e

      - name: Upload Playwright report
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
            playwright-launch.log
          retention-days: 30

      - name: Stop local services
        if: ${{ always() }}
        run: |
          if [ -f playwright-launch.pid ]; then
            kill "$(cat playwright-launch.pid)" || true
          fi

````

## PATH: .github/workflows/deploy.yml
````
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      backend_replicas:
        description: 'Nombre de replicas backend'
        required: false
        default: '2'
      frontend_replicas:
        description: 'Nombre de replicas frontend'
        required: false
        default: '2'

concurrency:
  group: production-deploy
  cancel-in-progress: true

permissions:
  contents: read

env:
  REGISTRY: ghcr.io
  IMAGE_BACKEND: ghcr.io/${{ github.repository }}/backend
  IMAGE_FRONTEND: ghcr.io/${{ github.repository }}/frontend
  BACKEND_REPLICAS: ${{ github.event_name == 'workflow_dispatch' && github.event.inputs.backend_replicas || '2' }}
  FRONTEND_REPLICAS: ${{ github.event_name == 'workflow_dispatch' && github.event.inputs.frontend_replicas || '2' }}

jobs:
  test:
    name: Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_DB: kalico_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package.json

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Static syntax checks
        run: |
          cd backend
          node --check src/index.js
          node --check src/routes/payment.route.js
          node --check src/middleware/validate.js

      - name: Run tests
        run: cd backend && npm test
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: kalico_test
          DB_USER: test
          DB_PASSWORD: test
          JWT_SECRET: test_secret_ci
          STRIPE_WEBHOOK_SECRET: whsec_ci_test

      - name: Lint
        run: cd backend && npm run lint --if-present

  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            package-lock.json
            frontend/package-lock.json

      - name: Install root dependencies
        run: npm ci

      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_USE_LOCAL_SERVER: 'true'

      - name: Upload Playwright report
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
          retention-days: 30

  build:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: e2e
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build & push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ env.IMAGE_BACKEND }}:latest,${{ env.IMAGE_BACKEND }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: ${{ env.IMAGE_FRONTEND }}:latest,${{ env.IMAGE_FRONTEND }}:${{ github.sha }}
          build-args: |
            NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}
            NEXT_PUBLIC_STRIPE_PK=${{ secrets.NEXT_PUBLIC_STRIPE_PK }}
            NEXT_PUBLIC_GOOGLE_CLIENT_ID=${{ secrets.NEXT_PUBLIC_GOOGLE_CLIENT_ID }}
            NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=${{ secrets.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY }}
            NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=${{ secrets.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY }}
            NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY=${{ secrets.NEXT_PUBLIC_PAYPLUG_PLAN_PRO_MONTHLY }}
            NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY=${{ secrets.NEXT_PUBLIC_PAYPLUG_PLAN_PRO_YEARLY }}
            NEXT_PUBLIC_TURNSTILE_SITE_KEY=${{ secrets.NEXT_PUBLIC_TURNSTILE_SITE_KEY }}
            NEXT_PUBLIC_DEMO_MODE=${{ secrets.NEXT_PUBLIC_DEMO_MODE }}
            NEXT_PUBLIC_SHOW_DEMO_BAR=${{ secrets.NEXT_PUBLIC_SHOW_DEMO_BAR }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to AWS Sydney
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            set -e
            cd ${{ secrets.DEPLOY_PATH }}

            echo "${{ github.token }}" | docker login ghcr.io -u "${{ github.actor }}" --password-stdin
            docker pull ${{ env.IMAGE_BACKEND }}:latest
            docker pull ${{ env.IMAGE_FRONTEND }}:latest
            bash scripts/deploy-scale.sh .env.production.local "${{ env.BACKEND_REPLICAS }}" "${{ env.FRONTEND_REPLICAS }}"
            sleep 20
            curl -f ${{ secrets.BASE_URL }}/api/health || (docker compose -f docker-compose.prod.yml --env-file .env.production.local logs --tail=100 backend worker pgbouncer && exit 1)
            curl -f ${{ secrets.BASE_URL }}/ || exit 1
            docker image prune -f

            echo "Deploiement reussi - $(date)"

````

## PATH: .github/workflows/playwright.yml
````
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            package-lock.json
            frontend/package-lock.json

      - name: Install root dependencies
        run: npm ci

      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_USE_LOCAL_SERVER: 'true'

      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
          retention-days: 30

````

## PATH: .github/workflows/security-scan.yml
````
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  trivy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build backend image
        run: docker build -t kalico/backend ./backend

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@v0.36.0
        with:
          image-ref: kalico/backend
          format: sarif
          output: trivy-results.sarif
          severity: CRITICAL,HIGH

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-results.sarif

````
