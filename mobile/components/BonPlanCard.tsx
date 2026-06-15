import { useMemo } from 'react'
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Colors } from '@/constants/theme'

type BonPlan = {
  id: string | number
  title: string
  description: string
  image_url?: string | null
  promo_label?: string | null
  original_price_xpf?: number | null
  promo_price_xpf?: number | null
  cta_label?: string | null
  cta_url?: string | null
  category?: string | null
  kind?: string | null
  published_until?: string | null
  business_name?: string | null
  business_logo_url?: string | null
  business_badge?: string | null
  business_review_avg?: number | null
  business_review_count?: number | null
}

export default function BonPlanCard({
  bonPlan,
  onFollowBusiness,
}: {
  bonPlan: BonPlan
  onFollowBusiness?: (businessName: string) => void
}) {
  const daysLeft = useMemo(() => {
    if (!bonPlan.published_until) return null
    const diff = Math.ceil((new Date(bonPlan.published_until).getTime() - Date.now()) / 86_400_000)
    return Math.max(0, diff)
  }, [bonPlan.published_until])

  const accent = bonPlan.kind === 'promo'
    ? Colors.emerald
    : bonPlan.kind === 'event' || bonPlan.kind === 'concert'
      ? Colors.sable
      : Colors.lagoon

  const openTarget = async () => {
    const target = bonPlan.cta_url || `https://kalico.nc/bons-plans/${bonPlan.id}`
    try {
      await Linking.openURL(target)
    } catch {}
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={openTarget} style={styles.media}>
        {bonPlan.image_url ? (
          <Image source={{ uri: bonPlan.image_url }} style={styles.mediaImage} />
        ) : (
          <View style={styles.mediaPlaceholder}>
            <Text style={styles.placeholderText}>🏷️</Text>
          </View>
        )}
        <View style={styles.badgesRow}>
          {bonPlan.category ? (
            <Text style={[styles.badge, { backgroundColor: `${accent}18`, color: accent, borderColor: `${accent}40` }]}>
              {bonPlan.category.replace('_', ' ')}
            </Text>
          ) : null}
          {daysLeft != null ? (
            <Text style={[styles.badgeAccent, { backgroundColor: `${accent}18`, color: accent, borderColor: `${accent}40` }]}>
              {daysLeft <= 0 ? 'Terminé' : `Plus que ${daysLeft} j`}
            </Text>
          ) : null}
        </View>
        {bonPlan.business_badge === 'verified' ? (
          <Text style={styles.businessBadge}>Vérifié Kalico</Text>
        ) : bonPlan.business_badge === 'active' ? (
          <Text style={styles.businessBadgeSoft}>Actif</Text>
        ) : null}
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.businessName} numberOfLines={1}>{bonPlan.business_name || 'Enseigne locale'}</Text>
        <Text style={styles.title} numberOfLines={2}>{bonPlan.title}</Text>
        <Text style={styles.description} numberOfLines={3}>{bonPlan.description}</Text>
        <View style={styles.priceRow}>
          {bonPlan.original_price_xpf != null ? <Text style={styles.oldPrice}>{Number(bonPlan.original_price_xpf).toLocaleString('fr-FR')} XPF</Text> : null}
          {bonPlan.promo_price_xpf != null ? <Text style={styles.price}>{Number(bonPlan.promo_price_xpf).toLocaleString('fr-FR')} XPF</Text> : null}
        </View>
        <View style={styles.actions}>
          <Pressable onPress={openTarget} style={styles.cta}>
            <Text style={styles.ctaText}>{bonPlan.cta_label || 'En profiter'}</Text>
          </Pressable>
          {onFollowBusiness && bonPlan.business_name ? (
            <Pressable onPress={() => onFollowBusiness(bonPlan.business_name || '')} style={styles.followBtn}>
              <Ionicons name="heart-outline" size={16} color={Colors.primary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  media: {
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surfaceRaised,
    position: 'relative',
  },
  mediaImage: { width: '100%', height: '100%' },
  mediaPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 42, opacity: 0.3 },
  badgesRow: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  badgeAccent: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  businessBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  businessBadgeSoft: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: Colors.primaryLight,
    color: Colors.primaryDark,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  content: { padding: 14, gap: 8 },
  businessName: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  title: { fontSize: 16, fontWeight: '800', color: Colors.text },
  description: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oldPrice: { fontSize: 12, color: Colors.gray400, textDecorationLine: 'line-through' },
  price: { fontSize: 16, fontWeight: '800', color: Colors.text },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cta: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  ctaText: { color: '#FFF', fontWeight: '800' },
  followBtn: {
    width: 44,
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
