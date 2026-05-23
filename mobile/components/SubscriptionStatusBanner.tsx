import { useQuery } from '@tanstack/react-query'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme'
import { subscriptionsApi } from '@/lib/api'
import { isDemoModeEnabled } from '@/lib/demo'
import { useAuthStore } from '@/store/authStore'

type SubscriptionStatus = {
  plan?: 'free' | 'pro' | 'pro_plus' | null
  status?: 'active' | 'expiring_soon' | 'expired' | 'payment_failed' | null
  current_period_end?: string | null
  days_remaining?: number | null
  payment_provider?: 'stripe' | 'payplug' | null
  payment_status?: 'pending' | 'succeeded' | 'failed' | 'refunded' | null
}

function getStatusTone(status?: SubscriptionStatus | null) {
  if (!status || status.plan === 'free') return null
  if (status.status === 'payment_failed') {
    return {
      backgroundColor: '#FEE2E2',
      borderColor: '#FCA5A5',
      icon: 'warning' as const,
      title: 'Paiement échoué',
      message: 'Mettez à jour votre moyen de paiement pour conserver vos avantages Pro.',
      cta: 'Mettre à jour',
      ctaHref: '/profil/abonnement',
    }
  }

  if (status.status === 'expired') {
    return {
      backgroundColor: '#FEE2E2',
      borderColor: '#FCA5A5',
      icon: 'warning' as const,
      title: 'Abonnement expiré',
      message: 'Votre abonnement a expiré. Réactivez-le pour retrouver vos avantages Pro.',
      cta: 'Réactiver',
      ctaHref: '/profil/abonnement',
    }
  }

  if (status.status === 'expiring_soon' && typeof status.days_remaining === 'number') {
    return {
      backgroundColor: '#FFFBEB',
      borderColor: '#FCD34D',
      icon: 'time' as const,
      title: `Expire dans ${status.days_remaining} jour${status.days_remaining > 1 ? 's' : ''}`,
      message: 'Votre abonnement expire bientôt. Renouvelez pour garder vos avantages actifs.',
      cta: 'Renouveler',
      ctaHref: '/profil/abonnement',
    }
  }

  return {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
    icon: 'checkmark-circle' as const,
    title: 'Actif',
    message: 'Votre abonnement est actif et vos avantages Pro sont disponibles.',
    cta: null,
    ctaHref: null,
  }
}

export function SubscriptionStatusBanner() {
  const user = useAuthStore((state) => state.user)

  const { data } = useQuery({
    queryKey: ['subscriptions', 'status'],
    queryFn: async () => {
      const response = await subscriptionsApi.getStatus()
      return response.data as { data: SubscriptionStatus | null }
    },
    enabled: Boolean(user && !isDemoModeEnabled()),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 0,
  })

  const status = data?.data ?? null
  const tone = getStatusTone(status)
  if (!tone) return null

  return (
    <View style={[styles.card, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
      <View style={styles.row}>
        <Ionicons name={tone.icon} size={18} color={tone.borderColor} />
        <View style={styles.textBlock}>
          <Text style={styles.title}>{tone.title}</Text>
          <Text style={styles.message}>{tone.message}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {status?.plan === 'pro_plus' ? 'Pro+' : status?.plan === 'pro' ? 'Pro' : 'Gratuit'}
              </Text>
            </View>
            {status?.payment_provider ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{status.payment_provider === 'payplug' ? 'PayPlug' : 'Stripe'}</Text>
              </View>
            ) : null}
            {typeof status?.days_remaining === 'number' && status.days_remaining > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{status.days_remaining} j restants</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {tone.cta ? (
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push(tone.ctaHref)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{tone.cta}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  ctaText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
})
