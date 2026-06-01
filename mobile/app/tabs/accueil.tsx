// ============================================================
//  Troca Mobile - Onglet Accueil
// ============================================================

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  RefreshControl,
  Image,
  Pressable,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { bonPlansApi, covoiturageApi, metaApi } from '@/lib/api'
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme'
import { MOBILE_FALLBACK_CATEGORIES } from '@/lib/categoryCatalog'
import { ListingSkeletonList } from '@/components/ListingSkeleton'
import { getRecentlyViewedListings, type RecentlyViewedListing } from '@/lib/queryClient'
import { useInfiniteListings } from '@/hooks/useInfiniteListings'
import PlatformStats from '@/components/PlatformStats'

interface Annonce {
  id: string
  titre?: string
  title?: string
  prix_xpf?: number | null
  price?: number | null
  commune?: string | null
  commune_name?: string | null
  image_url?: string | null
  cover_image?: string | null
  created_at?: string
  published_at?: string
  is_pro?: boolean
  trust_score?: number | null
  trust_level?: string | null
  user?: { is_pro?: boolean }
}

type SpotlightItem = {
  id: string | number
  title: string
  meta: string
  accent: string
  badge: string
  onPress: () => void
}

function formatMoney(value?: number | null) {
  if (value == null) return 'Prix sur demande'
  return `${Number(value).toLocaleString('fr-FR')} XPF`
}

function SpotlightCard({ item }: { item: SpotlightItem }) {
  return (
    <Pressable
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.spotlightCard,
        { borderBottomColor: item.accent },
        pressed && { opacity: 0.92, transform: [{ translateY: -1 }] },
      ]}
    >
      <Text style={[styles.spotlightBadge, { color: item.accent }]}>{item.badge}</Text>
      <Text style={styles.spotlightTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.spotlightMeta} numberOfLines={2}>{item.meta}</Text>
      <View style={styles.spotlightAction}>
        <Text style={[styles.spotlightActionText, { color: item.accent }]}>Ouvrir</Text>
        <Ionicons name="arrow-forward" size={14} color={item.accent} />
      </View>
    </Pressable>
  )
}

function RecentCard({ item }: { item: RecentlyViewedListing }) {
  return (
    <Pressable style={styles.recentCard} onPress={() => router.push(`/annonce/${item.id}`)}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.recentImage} resizeMode="cover" />
      ) : (
        <View style={[styles.recentImage, styles.recentImagePlaceholder]}>
          <Ionicons name="image-outline" size={22} color={Colors.gray300} />
        </View>
      )}
      <Text style={styles.recentTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.recentPrice}>{item.price != null ? formatMoney(item.price) : 'Prix sur demande'}</Text>
      {item.commune ? <Text style={styles.recentCommune} numberOfLines={1}>{item.commune}</Text> : null}
    </Pressable>
  )
}

export default function AccueilScreen() {
  const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true'
  const [categories, setCategories] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categorie, setCategorie] = useState<number | null>(null)
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedListing[]>([])
  const [promoBonPlans, setPromoBonPlans] = useState<any[]>([])
  const [eventBonPlans, setEventBonPlans] = useState<any[]>([])
  const [covoiturages, setCovoiturages] = useState<any[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visibleCategories = isDemoMode ? MOBILE_FALLBACK_CATEGORIES : (categories.length > 0 ? categories : MOBILE_FALLBACK_CATEGORIES)

  function normalize(item: any): Annonce {
    return {
      id: String(item.id),
      titre: item.titre ?? item.title ?? '',
      title: item.title ?? item.titre ?? '',
      prix_xpf: item.prix_xpf ?? item.price ?? null,
      price: item.price ?? item.prix_xpf ?? null,
      commune: item.commune ?? item.commune_name ?? null,
      commune_name: item.commune_name ?? item.commune ?? null,
      image_url: item.image_url ?? item.cover_image ?? item.images?.[0]?.url ?? null,
      cover_image: item.cover_image ?? item.image_url ?? item.images?.[0]?.url ?? null,
      created_at: item.created_at ?? item.published_at,
      published_at: item.published_at ?? item.created_at,
      is_pro: item.is_pro ?? item.user?.is_pro ?? false,
      trust_score: item.trust_score ?? item.seller_trust_score ?? null,
      trust_level: item.trust_level ?? item.seller_trust_level ?? null,
      user: item.user ?? { is_pro: item.is_pro ?? false },
    }
  }

  const queryFilters = useMemo(() => ({
    q: debouncedSearch,
    category_id: categorie ?? '',
    limit: 20,
    sort: 'date',
    page: 1,
  }), [debouncedSearch, categorie])

  const {
    listings,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
    isError,
  } = useInfiniteListings(queryFilters)

  const annonces = useMemo(() => listings.map(normalize), [listings])
  const isInitialLoading = isLoading && annonces.length === 0
  const isLoadingMore = isFetchingNextPage && annonces.length > 0
  const loadError = useMemo(() => {
    if (!isError) return ''
    return error instanceof Error && error.message === 'timeout'
      ? 'Le chargement des annonces prend trop de temps. Essayez de réessayer.'
      : 'Les annonces sont temporairement indisponibles.'
  }, [error, isError])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  useEffect(() => {
    metaApi.getCategories()
      .then(({ data }) => {
        const raw = Array.isArray(data.data) ? data.data : []
        setCategories(isDemoMode ? MOBILE_FALLBACK_CATEGORIES as any : raw)
      })
      .catch(() => {
        setCategories(MOBILE_FALLBACK_CATEGORIES as any)
      })
  }, [])

  useEffect(() => {
    let alive = true
    const loadSpotlight = async () => {
      try {
        const [promoRes, eventRes, rideRes] = await Promise.all([
          bonPlansApi.list({ limit: 3, kind: 'promo' }),
          bonPlansApi.list({ limit: 3, kind: 'event,concert' }),
          covoiturageApi.list({ limit: 3 }),
        ])
        if (!alive) return
        setPromoBonPlans(Array.isArray(promoRes.data?.data) ? promoRes.data.data : [])
        setEventBonPlans(Array.isArray(eventRes.data?.data) ? eventRes.data.data : [])
        setCovoiturages(Array.isArray(rideRes.data?.data) ? rideRes.data.data : [])
      } catch {
        if (!alive) return
        setPromoBonPlans([])
        setEventBonPlans([])
        setCovoiturages([])
      }
    }

    void loadSpotlight()
    return () => {
      alive = false
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      setRecentlyViewed(getRecentlyViewedListings())
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    void refetch().finally(() => setRefreshing(false))
  }

  const loadMore = () => {
    if (!hasNextPage || isFetchingNextPage) return
    void fetchNextPage()
  }

  const quickLinks = [
    { label: 'Troc', icon: 'swap-horizontal', href: '/tabs/troc' },
    { label: 'Bons plans', icon: 'pricetag-outline', href: '/bons-plans' },
    { label: 'Événements', icon: 'calendar-outline', href: '/evenements' },
    { label: 'Covoiturage', icon: 'car-sport-outline', href: '/covoiturage' },
  ] as const

  const spotlightItems: SpotlightItem[] = [
    {
      id: 'promo',
      title: promoBonPlans[0]?.title ?? 'Promos, ventes flash et coupons locaux',
      meta: promoBonPlans[0]
        ? `${promoBonPlans[0].business_name || 'Enseigne locale'} · ${promoBonPlans[0].promo_price_xpf != null ? formatMoney(promoBonPlans[0].promo_price_xpf) : 'Prix promo'}`
        : 'Des offres locales visibles rapidement depuis le mobile.',
      accent: Colors.emerald,
      badge: 'Bons plans',
      onPress: () => router.push('/bons-plans'),
    },
    {
      id: 'event',
      title: eventBonPlans[0]?.title ?? 'Concerts, marchés et rendez-vous locaux',
      meta: eventBonPlans[0]
        ? `${eventBonPlans[0].commune_name || eventBonPlans[0].location_name || 'Nouvelle-Calédonie'} · ${eventBonPlans[0].event_date || 'Date libre'}`
        : 'Les sorties, ateliers et événements communautaires au même endroit.',
      accent: Colors.sable,
      badge: 'Événements',
      onPress: () => router.push('/evenements'),
    },
    {
      id: 'ride',
      title: covoiturages[0]?.departure && covoiturages[0]?.destination
        ? `${covoiturages[0].departure} → ${covoiturages[0].destination}`
        : 'Covoiturage local et interurbain',
      meta: covoiturages[0]
        ? `${covoiturages[0].ride_date || 'Date libre'} · ${covoiturages[0].ride_time?.slice(0, 5) || 'Heure libre'} · ${Number(covoiturages[0].price_xpf ?? 0).toLocaleString('fr-FR')} XPF`
        : 'Proposez une place ou trouvez un trajet en quelques secondes.',
      accent: Colors.corail,
      badge: 'Covoiturage',
      onPress: () => router.push('/covoiturage'),
    },
  ]

  const header = (
    <View style={styles.headerStack}>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles" size={14} color={Colors.lagoonText} />
          <Text style={styles.heroBadgeText}>Nouvelle-Calédonie</Text>
        </View>
        <Text style={styles.heroTitle}>Achetez, vendez, troquez en NC</Text>
        <Text style={styles.heroSubtitle}>Des milliers d&apos;annonces entre Calédoniens, partout sur le territoire.</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Que recherchez-vous ?"
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/annonces/nouvelle')}>
            <Text style={styles.primaryBtnText}>Publier une annonce</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/annonces')}>
            <Text style={styles.secondaryBtnText}>Parcourir les annonces</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickLinks}>
          {quickLinks.map((link) => (
            <TouchableOpacity key={link.label} style={styles.quickLink} onPress={() => router.push(link.href as any)}>
              <Ionicons name={link.icon as any} size={16} color={Colors.primary} />
              <Text style={styles.quickLinkText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsSection}>
        <PlatformStats variant="light" />
      </View>

      <View style={styles.spotlightSection}>
        <View style={styles.sectionTitleRow}>
          <View>
            <Text style={styles.sectionKicker}>Rappels interactifs</Text>
            <Text style={styles.sectionTitle}>Le meilleur de Troca, en direct</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/bons-plans')} hitSlop={8}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spotlightRow}>
          {spotlightItems.map((item) => (
            <SpotlightCard key={item.id} item={item} />
          ))}
        </ScrollView>
      </View>

      {recentlyViewed.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionKicker}>Reprise rapide</Text>
              <Text style={styles.sectionTitle}>Vus récemment</Text>
            </View>
            <Text style={styles.sectionCount}>{recentlyViewed.length}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
            {recentlyViewed.map((item) => (
              <RecentCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.categoriesWrap}>
        <View style={styles.sectionTitleRow}>
          <View>
            <Text style={styles.sectionKicker}>Rayons populaires</Text>
            <Text style={styles.sectionTitle}>Ce que les gens cherchent vraiment</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/annonces')}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
          <TouchableOpacity
            key="all"
            style={[styles.cat, categorie === null && styles.catActive]}
            onPress={() => setCategorie(null)}
          >
            <Ionicons name="apps-outline" size={18} color={categorie === null ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.catLabel, categorie === null && styles.catLabelActive]}>Tout</Text>
          </TouchableOpacity>
          {visibleCategories.map((cat: any) => {
            const iconName = (cat.icon as any) ?? MOBILE_FALLBACK_CATEGORIES.find((fallback) => fallback.slug === cat.slug)?.icon ?? 'grid-outline'
            const active = categorie === cat.id
            return (
              <TouchableOpacity
                key={String(cat.id)}
                style={[styles.cat, active && styles.catActive]}
                onPress={() => setCategorie(active ? null : cat.id)}
              >
                <Ionicons name={iconName} size={18} color={active ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.catLabel, active && styles.catLabelActive]}>
                  {cat.name ?? cat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )

  const renderItem = ({ item }: { item: Annonce }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/annonce/${item.id}`)}
      activeOpacity={0.85}
    >
      {item.image_url || item.cover_image ? (
        <Image source={{ uri: item.image_url ?? item.cover_image ?? '' }} style={styles.cardImg} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
          <Ionicons name="image-outline" size={32} color={Colors.gray300} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.titre ?? item.title}</Text>
        <Text style={styles.cardPrice}>
          {(item.prix_xpf ?? item.price) != null
            ? `${Number(item.prix_xpf ?? item.price).toLocaleString('fr-NC')} XPF`
            : 'Prix à débattre'}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.cardMetaText}>{item.commune ?? item.commune_name ?? 'NC'}</Text>
          {(item.is_pro || item.user?.is_pro) && (
            <View style={styles.proBadge}>
              <Text style={styles.proText}>Pro ✓</Text>
            </View>
          )}
          {item.trust_score != null && (
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={10} color={Colors.primary} />
              <Text style={styles.trustText}>{item.trust_score}/100</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.rootContent}>
        <FlatList
          data={annonces}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          ListEmptyComponent={
            isInitialLoading ? (
              <View style={styles.skeletonWrap}>
                <ListingSkeletonList count={6} variant="grid" />
              </View>
            ) : loadError ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Les annonces sont temporairement indisponibles</Text>
                <Text style={styles.emptyText}>{loadError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => void refetch()}>
                  <Text style={styles.retryTxt}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Aucune annonce trouvée</Text>
                <Text style={styles.emptyText}>Essayez d&apos;élargir votre recherche ou de changer de catégorie.</Text>
              </View>
            )
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerSkeleton}>
                <ListingSkeletonList count={2} variant="grid" />
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  rootContent: { flex: 1, backgroundColor: Colors.background },
  headerStack: {
    paddingBottom: Spacing.md,
  },
  hero: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
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
    marginTop: 16,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  heroSubtitle: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: FontSize.md, color: Colors.text },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  secondaryBtnText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  quickLinks: {
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 40,
  },
  quickLinkText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  statsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  spotlightSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  recentSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  categoriesWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  sectionKicker: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    marginTop: 4,
    fontSize: FontSize.xl,
    lineHeight: 24,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  sectionLink: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginTop: 4,
  },
  sectionCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  spotlightRow: {
    gap: 12,
    paddingRight: Spacing.lg,
  },
  spotlightCard: {
    width: 240,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 3,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  spotlightBadge: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  spotlightTitle: {
    marginTop: 10,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  spotlightMeta: {
    marginTop: 8,
    fontSize: FontSize.sm,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  spotlightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  spotlightActionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  recentRow: {
    gap: 10,
    paddingRight: Spacing.lg,
  },
  recentCard: {
    width: 150,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  recentImage: {
    width: '100%',
    height: 96,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  recentImagePlaceholder: {
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    lineHeight: 18,
  },
  recentPrice: {
    marginTop: 4,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  recentCommune: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  cats: {
    gap: 10,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 42,
  },
  catActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  catLabelActive: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  card: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardImg: { width: '100%', height: 130 },
  cardImgPlaceholder: { backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: Spacing.sm },
  cardTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, lineHeight: 18 },
  cardPrice: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, marginTop: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4, flexWrap: 'wrap' },
  cardMetaText: { fontSize: FontSize.xs, color: Colors.textTertiary, flexShrink: 1 },
  proBadge: { backgroundColor: Colors.sableLight, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  proText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.sableText },
  trustBadge: { backgroundColor: Colors.surface, borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1, flexDirection: 'row', alignItems: 'center', gap: 2, ...Shadow.sm },
  trustText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.primary },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold, textAlign: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  retryTxt: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  skeletonWrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  footerSkeleton: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
})
