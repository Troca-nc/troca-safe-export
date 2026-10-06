export type FreightService = 'colis' | 'demenagement' | 'fret_pro'
export type CommuneOption = { id: number; name: string; slug: string; provinceName: string }
export type FreightOffer = { id: number; amountXpf: number; pickupDate: string; pickupSlot: string; message: string | null; status: string; transporterName: string; transporterRating: number; transporterVerified: boolean }
export type FreightRequest = { id: number; departure: string; destination: string; cargoType: string; volumeBucket: string; weightBucket: string; status: string; statusLabel: string; offersCount: number; offers: FreightOffer[]; selectedOfferId: number | null; estimatedMinXpf: number | null; estimatedMaxXpf: number | null }
export type FreightDraft = { service_type: FreightService; departure_commune_id: string; destination_commune_id: string; cargo_type: string; volume_bucket: string; weight_bucket: string; urgency: string; budget_max_xpf: string; description: string; contact_email: string; contact_phone: string; fragile: boolean; manutention: boolean }
export type FreightEstimate = { estimated_min_xpf: number; estimated_max_xpf: number; distance_km: number; route_reference_xpf: number }
