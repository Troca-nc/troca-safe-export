import type {
  AccountKind,
  AccountOverviewData,
  AccountSubscriptionState,
} from '@/types/account'

const DAY = 86_400_000

function isoDaysFromNow(days: number) {
  return new Date(Date.now() + days * DAY).toISOString()
}

const identityByKind: Record<AccountKind, Pick<AccountOverviewData['profile'], 'id' | 'firstName' | 'lastName' | 'displayName' | 'initials' | 'bio' | 'communeName' | 'accountKind'>> = {
  particulier: {
    id: 'demo-account-particulier',
    firstName: 'Emma',
    lastName: 'Martin (démo)',
    displayName: 'Emma Martin (démo)',
    initials: 'EM',
    bio: 'Passionnée de seconde main et d’échanges locaux.',
    communeName: 'Nouméa',
    accountKind: 'particulier',
  },
  pro: {
    id: 'demo-account-pro',
    firstName: 'Atelier',
    lastName: 'Kalo (démo)',
    displayName: 'Atelier Kalo (démo)',
    initials: 'AK',
    bio: 'Services de proximité et objets réparés en Nouvelle-Calédonie.',
    communeName: 'Dumbéa',
    accountKind: 'pro',
  },
  bon_plan: {
    id: 'demo-account-bon-plan',
    firstName: 'Kalico',
    lastName: 'Bon Plan (démo)',
    displayName: 'Kalico Bon Plan (démo)',
    initials: 'KB',
    bio: 'Des offres locales à découvrir près de chez vous.',
    communeName: 'Nouméa',
    accountKind: 'bon_plan',
  },
}

export function getDemoAccountOverview(
  kind: AccountKind,
  subscriptionState: AccountSubscriptionState = 'active',
): AccountOverviewData {
  const identity = identityByKind[kind]
  const isProfessional = kind !== 'particulier'

  return {
    profile: {
      ...identity,
      avatarUrl: null,
      emailVerified: true,
      phoneVerified: kind !== 'particulier',
      memberSince: isoDaysFromNow(-420),
      rating: isProfessional ? 4.8 : 4.6,
      reviewsCount: isProfessional ? 27 : 8,
    },
    subscription: {
      plan: isProfessional ? 'pro' : 'free',
      status: isProfessional ? subscriptionState : 'active',
      daysRemaining: subscriptionState === 'expiring_soon' ? 4 : subscriptionState === 'active' ? 24 : 0,
      periodEnd: subscriptionState === 'payment_failed' ? isoDaysFromNow(-1) : isoDaysFromNow(subscriptionState === 'expiring_soon' ? 4 : 24),
    },
    completion: {
      percentage: kind === 'particulier' ? 83 : 100,
      missingLabels: kind === 'particulier' ? ['téléphone vérifié'] : [],
    },
    metrics: {
      activeListings: isProfessional ? 12 : 3,
      totalViews: isProfessional ? 684 : 96,
      unreadMessages: isProfessional ? 4 : 2,
      upcomingAppointments: isProfessional ? 2 : 1,
    },
    listings: [
      {
        id: 'demo-account-listing-1',
        title: isProfessional ? 'Service local de démonstration' : 'Vélo de ville de démonstration',
        price: isProfessional ? 4500 : 38000,
        price_negotiable: false,
        is_free: false,
        is_featured: false,
        is_urgent: false,
        condition: 'good',
        created_at: isoDaysFromNow(-2),
        commune_name: identity.communeName,
        category_name: isProfessional ? 'Services' : 'Vélos',
        seller_prenom: identity.firstName,
        seller_nom: identity.lastName,
        seller_avatar: null,
        seller_is_pro: isProfessional,
        seller_pro_verified: isProfessional,
      },
      {
        id: 'demo-account-listing-2',
        title: 'Objet local de démonstration',
        price: 8500,
        price_negotiable: true,
        is_free: false,
        is_featured: false,
        is_urgent: false,
        condition: 'like_new',
        created_at: isoDaysFromNow(-6),
        commune_name: identity.communeName,
        category_name: 'Maison',
        seller_prenom: identity.firstName,
        seller_nom: identity.lastName,
        seller_avatar: null,
        seller_is_pro: isProfessional,
        seller_pro_verified: isProfessional,
      },
    ],
    conversations: [
      {
        id: 'demo-conversation-account-1',
        personName: 'Lina (démo)',
        personAvatarUrl: null,
        listingTitle: 'Annonce de démonstration',
        preview: 'Bonjour, votre annonce est-elle toujours disponible ?',
        unreadCount: 2,
        updatedAt: isoDaysFromNow(-1),
      },
    ],
    appointments: [
      {
        id: 'demo-appointment-account-1',
        partnerName: isProfessional ? 'Client local (démo)' : 'Atelier local (démo)',
        subject: 'Rendez-vous de démonstration',
        startsAt: isoDaysFromNow(2),
        status: 'confirmed',
      },
    ],
    activity: [
      {
        id: 'demo-activity-account-1',
        title: 'Nouveau message (démo)',
        body: 'Une personne vous a écrit au sujet de votre annonce de démonstration.',
        href: '/messages',
        read: false,
        createdAt: isoDaysFromNow(-1),
      },
      {
        id: 'demo-activity-account-2',
        title: 'Annonce consultée (démo)',
        body: 'Votre annonce de démonstration a reçu de nouvelles visites.',
        href: '/profil/annonces',
        read: true,
        createdAt: isoDaysFromNow(-3),
      },
    ],
    partialFailures: [],
  }
}
