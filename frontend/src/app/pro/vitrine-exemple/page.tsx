import type { Metadata } from 'next'
import { Suspense } from 'react'

import Header from '@/components/layout/Header'
import { generateNoindexMetadata } from '@/lib/seoHelpers'
import { SITE_URL } from '@/types/seo.types'

import ProPublicClient from '../[id]/ProPublicClient'
import type { ProPublicProfile, ProPublicReview } from '../publicStorefrontData'

const demoReviews: ProPublicReview[] = [
  {
    id: 'demo-review-1',
    rating: 5,
    title: 'Très pro du début à la fin',
    comment: 'Réponse rapide, devis clair et suivi impeccable. On sent que tout est pensé pour rassurer le client.',
    reviewer_prenom: 'Mila',
    reviewer_nom: 'T.',
    verified_purchase: true,
    helpful_count: 12,
    created_at: '2026-05-04T10:30:00.000Z',
  },
  {
    id: 'demo-review-2',
    rating: 4,
    title: 'Simple et efficace',
    comment: 'La vitrine est lisible, les produits sont bien présentés et la prise de contact est directe.',
    reviewer_prenom: 'Noah',
    reviewer_nom: 'L.',
    verified_purchase: true,
    helpful_count: 7,
    created_at: '2026-05-10T09:00:00.000Z',
  },
]

const demoProfile: ProPublicProfile = {
  id: 'demo-pro-public',
  display_name: 'Atelier Kalico',
  pro_company_name: 'Atelier Kalico',
  pro_category: 'Artisan BTP',
  pro_commune: 'Dumbéa',
  pro_description:
    'Une vitrine locale pensée pour présenter une activité, envoyer des devis, prendre des rendez-vous et gérer le suivi client sur un seul espace.',
  pro_website: SITE_URL,
  pro_phone: null,
  pro_hours: 'Lun - Sam : 07h30 - 18h',
  pro_logo_url: null,
  pro_banner_url: null,
  pro_catalog_pdf_url: null,
  pro_portfolio_photos: null,
  avg_rating: 4.9,
  review_count: demoReviews.length,
  listing_count: 2,
  product_count: 3,
  booking_settings: {
    is_enabled: true,
    title: 'Réserver un créneau',
    subtitle: 'Choisissez un créneau, décrivez votre besoin et recevez un retour rapide.',
    location_label: 'Point de rendez-vous',
    location_text: 'Dumbéa, Nouvelle-Calédonie',
    instructions: 'Un créneau de confirmation est envoyé après validation.',
    slot_duration_minutes: 30,
    advance_notice_hours: 24,
    max_days_ahead: 30,
    services: [
      { title: 'Visite technique', duration_minutes: 30, price_xpf: 0, description: 'Évaluation initiale sur site.', is_active: true },
      { title: 'Devis détaillé', duration_minutes: 45, price_xpf: 2500, description: 'Échange complet avant lancement.', is_active: true },
    ],
    weekly_hours: [
      { day_index: 1, label: 'Lundi', is_open: true, start_time: '07:30', end_time: '17:30' },
      { day_index: 2, label: 'Mardi', is_open: true, start_time: '07:30', end_time: '17:30' },
    ],
  },
  booking_slots: [
    {
      id: 'slot-1',
      starts_at: '2026-06-30T08:00:00.000Z',
      ends_at: '2026-06-30T08:30:00.000Z',
      label: 'Mardi 8h00',
      status: 'available',
    },
    {
      id: 'slot-2',
      starts_at: '2026-06-30T13:30:00.000Z',
      ends_at: '2026-06-30T14:00:00.000Z',
      label: 'Mardi 13h30',
      status: 'available',
    },
  ],
  catalog_categories: [
    { id: 1, name: 'Prestations', slug: 'prestations', position: 1 },
    { id: 2, name: 'Catalogue', slug: 'catalogue', position: 2 },
  ],
  products: [
    {
      id: 'product-1',
      title: 'Devis rénovation légère',
      description: 'Un format clair pour les petits travaux et les demandes rapides.',
      price_type: 'from',
      price_xpf: 15000,
      stock_quantity: 12,
      is_available: true,
      is_featured: true,
      category_name: 'Prestations',
      catalog_category_id: 1,
      catalog_category_name: 'Prestations',
      commune_name: 'Dumbéa',
      unit_label: 'par dossier',
      image_count: 0,
    },
    {
      id: 'product-2',
      title: 'Pack entretien mensuel',
      description: 'Formule simple pour garder un suivi régulier sur les chantiers.',
      price_type: 'fixed',
      price_xpf: 29000,
      stock_quantity: 8,
      is_available: true,
      is_featured: false,
      category_name: 'Catalogue',
      catalog_category_id: 2,
      catalog_category_name: 'Catalogue',
      commune_name: 'Nouméa',
      unit_label: 'mois',
      image_count: 0,
    },
    {
      id: 'product-3',
      title: 'Visite conseil',
      description: 'Un premier échange pour cadrer le besoin et préparer le devis.',
      price_type: 'on_quote',
      price_xpf: 0,
      stock_quantity: null,
      is_available: true,
      is_featured: false,
      category_name: 'Prestations',
      catalog_category_id: 1,
      catalog_category_name: 'Prestations',
      commune_name: 'Dumbéa',
      unit_label: null,
      image_count: 0,
    },
  ],
  listings: [
    {
      id: 'listing-1',
      title: 'Réfection terrasse bois',
      price: 125000,
      price_negotiable: false,
      is_free: false,
      condition: 'good',
      is_featured: true,
      is_urgent: false,
      published_at: '2026-06-18T10:00:00.000Z',
      created_at: '2026-06-18T10:00:00.000Z',
      boosted_until: null,
      is_troc: false,
      commune_name: 'Dumbéa',
      category_name: 'Artisanat & BTP',
      category_slug: 'artisanat-btp',
      cover_image: null,
      seller_prenom: 'Atelier',
      seller_nom: 'Kalico',
      seller_avatar: null,
      seller_is_pro: true,
      seller_pro_verified: true,
      seller_phone_verified: true,
      seller_is_online: true,
      seller_last_seen_label: 'En ligne',
      seller_avg_response_time_label: 'Répond en moins d’1h',
      seller_note_moyenne: 4.9,
      seller_nb_avis: 47,
      metadata: {},
    },
    {
      id: 'listing-2',
      title: 'Devis pose cuisine',
      price: 0,
      price_negotiable: true,
      is_free: false,
      condition: 'new',
      is_featured: false,
      is_urgent: false,
      published_at: '2026-06-20T12:00:00.000Z',
      created_at: '2026-06-20T12:00:00.000Z',
      boosted_until: null,
      is_troc: false,
      commune_name: 'Nouméa',
      category_name: 'Devis',
      category_slug: 'devis',
      cover_image: null,
      seller_prenom: 'Atelier',
      seller_nom: 'Kalico',
      seller_avatar: null,
      seller_is_pro: true,
      seller_pro_verified: true,
      seller_phone_verified: true,
      seller_is_online: false,
      seller_last_seen_label: 'Aujourd’hui',
      seller_avg_response_time_label: 'Répond vite',
      seller_note_moyenne: 4.8,
      seller_nb_avis: 47,
      metadata: {},
    },
  ],
}

export const metadata: Metadata = generateNoindexMetadata('Vitrine exemple Pro')

export default function ProExamplePage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="space-y-4">
              <div className="h-48 animate-pulse rounded-[2rem] bg-sand/70" />
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="h-64 animate-pulse rounded-[2rem] bg-sand/70" />
                <div className="h-64 animate-pulse rounded-[2rem] bg-sand/70" />
              </div>
            </div>
          </div>
        }
      >
        <ProPublicClient
          proId="demo-pro-public"
          initialProfile={demoProfile}
          initialReviews={demoReviews}
          showPhoneContact={false}
        />
      </Suspense>
    </>
  )
}
