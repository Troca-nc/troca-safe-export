import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

import BonPlanCard from '@/components/BonPlanCard'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { bonPlansApi } from '@/lib/api'

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

type SectionKey = 'promo' | 'event'

const sectionConfig: Record<SectionKey, {
  title: string
  kicker: string
  subtitle: string
  publishLabel: string
  palette: string
  kind: string
  emptyTitle: string
  emptyText: string
}> = {
  promo: {
    title: 'Promos, ventes flash et coupons locaux',
    kicker: 'Bons plans & promotions',
    subtitle: 'Une vitrine moderne pour les enseignes, artisans et associations locales.',
    publishLabel: 'Publier une promo',
    palette: Colors.emerald,
    kind: 'promo',
    emptyTitle: 'Aucune promotion en ligne pour le moment',
    emptyText: 'Soyez le premier à publier une promo, un coupon ou une vente flash visible par toute la communauté.',
  },
  event: {
    title: 'Concerts, festivals et sorties locales',
    kicker: 'Événements & culture',
    subtitle: 'Les sorties communautaires, concerts, marchés et rendez-vous à venir.',
    publishLabel: 'Publier un événement',
    palette: Colors.sable,
    kind: 'event,concert',
    emptyTitle: 'Aucun événement en ligne pour le moment',
    emptyText: 'Ajoutez un concert, une conférence ou un marché pour alimenter la section culturelle.',
  },
}

function SectionPill({
  active,
  label,
  color,
  onPress,
}: {
  active: boolean
  label: string
  color: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sectionPill,
        active && { backgroundColor: color, borderColor: color },
        pressed && { opacity: 0.88 },
      ]}
    >
      <Text style={[styles.sectionPillText, active && styles.sectionPillTextActive]}>{label}</Text>
    </Pressable>
  )
}

export function PromosEventsScreen({ initialSection = 'promo' }: { initialSection?: SectionKey }) {
  const [activeSection, setActiveSection] = useState<SectionKey>(initialSection)
  const [promoItems, setPromoItems] = useState<BonPlanItem[]>([])
  const [eventItems, setEventItems] = useState<BonPlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const activeConfig = sectionConfig[activeSection]

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      try {
        const [promoRes, eventRes] = await Promise.all([
          bonPlansApi.list({ limit: 24, kind: 'promo', q: search || undefined }),
          bonPlansApi.list({ limit: 24, kind: 'event,concert', q: search || undefined }),
        ])

        if (!alive) return
        setPromoItems(Array.isArray(promoRes.data?.data) ? promoRes.data.data : [])
        setEventItems(Array.isArray(eventRes.data?.data) ? eventRes.data.data : [])
      } catch (err) {
        console.error('[mobile][promos-events] load failed', err)
        if (!alive) return
        setPromoItems([])
        setEventItems([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [search])

  const activeItems = activeSection === 'promo' ? promoItems : eventItems

  const header = (
    <View style={styles.header}>
      <View style={styles.heroBadge}>
        <Ionicons name="sparkles" size={14} color={Colors.lagoonText} />
        <Text style={styles.heroBadgeText}>Bon plans & événements</Text>
      </View>
      <Text style={styles.heroTitle}>{activeConfig.title}</Text>
      <Text style={styles.heroSubtitle}>{activeConfig.subtitle}</Text>

      <View style={styles.toggleRow}>
        <SectionPill active={activeSection === 'promo'} label="Promos" color={Colors.emerald} onPress={() => setActiveSection('promo')} />
        <SectionPill active={activeSection === 'event'} label="Événements" color={Colors.sable} onPress={() => setActiveSection('event')} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Rechercher une promo ou un événement..."
          placeholderTextColor={Colors.textTertiary}
          returnKeyType="search"
        />
      </View>

      <View style={styles.heroActions}>
        <Pressable
          onPress={() => router.push('/annonces/nouvelle')}
          style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.primaryActionText}>{activeConfig.publishLabel}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/annonces')}
          style={({ pressed }) => [styles.secondaryAction, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.secondaryActionText}>Voir les annonces</Text>
        </Pressable>
      </View>
    </View>
  )

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.rootContent}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {header}

          <View style={[styles.sectionCard, { borderBottomColor: activeConfig.palette }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionKicker, { color: activeConfig.palette }]}>{activeConfig.kicker}</Text>
                <Text style={styles.sectionTitle}>{activeSection === 'promo' ? 'Les offres qui marchent maintenant' : 'Les rendez-vous à venir'}</Text>
              </View>
              <Pressable onPress={() => setActiveSection(activeSection === 'promo' ? 'event' : 'promo')}>
                <Text style={[styles.sectionLink, { color: activeConfig.palette }]}>
                  {activeSection === 'promo' ? 'Aller aux événements' : 'Aller aux promos'}
                </Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loader}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : activeItems.length > 0 ? (
              <View style={styles.cardList}>
                {activeItems.map((item) => (
                  <BonPlanCard key={item.id} bonPlan={item} />
                ))}
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>{activeConfig.emptyTitle}</Text>
                <Text style={styles.emptyText}>{activeConfig.emptyText}</Text>
                <Pressable onPress={() => router.push('/annonces/nouvelle')} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>{activeConfig.publishLabel}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  rootContent: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: 32,
    gap: Spacing.md,
  },
  header: {
    paddingBottom: Spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.lagoonLight,
  },
  heroBadgeText: {
    color: Colors.lagoonText,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 14,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  sectionPill: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionPillText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  sectionPillTextActive: {
    color: Colors.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  primaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryActionText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryActionText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 3,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: Spacing.md,
  },
  sectionKicker: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  sectionTitle: {
    marginTop: 4,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  sectionLink: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  cardList: {
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    fontSize: FontSize.sm,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyBtn: {
    minHeight: 44,
    marginTop: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
})

export default PromosEventsScreen
