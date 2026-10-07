import { proModules, proSectors } from '@/lib/proOffersPresentation'
import type { ProOfferPageData } from '@/types/pro-offers'

export const demoProOfferPage: ProOfferPageData = {
  modules: proModules,
  sectors: proSectors,
  plans: [
    {
      id: 'free',
      name: 'Gratuit',
      monthlyPriceXpf: 0,
      yearlyPriceXpf: 0,
      savingsMonths: 0,
      features: {
        maxActiveListings: 5,
        maxPhotosPerListing: 6,
        listingDurationDays: 60,
        chat: true,
        phoneVerification: true,
        listingStats: false,
        sellerBadge: false,
        boosts: 'paid',
        pinnedPerCategory: 0,
        prioritySupport: false,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPriceXpf: 2900,
      yearlyPriceXpf: 44900,
      savingsMonths: 2,
      features: {
        maxActiveListings: 'unlimited',
        maxPhotosPerListing: 12,
        listingDurationDays: 'permanent',
        chat: true,
        phoneVerification: true,
        listingStats: true,
        sellerBadge: true,
        boosts: 'discount',
        pinnedPerCategory: 1,
        prioritySupport: true,
      },
    },
  ],
}
