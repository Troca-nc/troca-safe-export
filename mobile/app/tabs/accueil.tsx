// ============================================================
//  Troca Mobile — Onglet Accueil
// ============================================================

import {
  View, Text, FlatList, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listingsApi, metaApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { MOBILE_FALLBACK_CATEGORIES } from '@/lib/categoryCatalog';

interface Annonce {
  id: string;
  titre?: string;
  title?: string;
  prix_xpf?: number | null;
  price?: number | null;
  commune?: string | null;
  commune_name?: string | null;
  image_url?: string | null;
  cover_image?: string | null;
  created_at?: string;
  published_at?: string;
  is_pro?: boolean;
  trust_score?: number | null;
  trust_level?: string | null;
  user?: { is_pro?: boolean };
}

export default function AccueilScreen() {
  const { user } = useAuthStore();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);
  const visibleCategories = categories.length > 0 ? categories : MOBILE_FALLBACK_CATEGORIES;

  const normalize = (item: any): Annonce => ({
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
  });

  const fetchAnnonces = useCallback(async (reset = false) => {
    try {
      const p = reset ? 1 : page;
      const params: Record<string, any> = { page: p, limit: 20 };
      if (search) params.q = search;
      if (categorie) params.category_id = categorie;

      const { data } = await listingsApi.search(params);
      const items: Annonce[] = (data.data ?? []).map(normalize);

      setAnnonces((prev) => (reset ? items : [...prev, ...items]));
      setHasMore(items.length === 20);
      if (reset) setPage(1);
    } catch (err) {
      console.error('[accueil] fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, categorie]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      fetchAnnonces(true);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchAnnonces(true), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, categorie, fetchAnnonces]);
  useEffect(() => { if (page > 1) fetchAnnonces(); }, [page]);

  useEffect(() => {
    metaApi.getCategories()
      .then(({ data }) => {
        const raw = Array.isArray(data.data) ? data.data : [];
        setCategories(raw);
      })
      .catch(() => {
        setCategories(MOBILE_FALLBACK_CATEGORIES as any);
      });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchAnnonces(true);
  };

  const loadMore = () => {
    if (hasMore && !loading) setPage((p) => p + 1);
  };

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
              <Text style={styles.proText}>PRO</Text>
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
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour {user?.prenom} 👋</Text>
          <Text style={styles.subtitle}>Que cherchez-vous aujourd'hui ?</Text>
        </View>
        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.rideShortcut} onPress={() => router.push('/bons-plans' as any)}>
            <Ionicons name="pricetag-outline" size={16} color={Colors.primary} />
            <Text style={styles.rideShortcutText}>Bons plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rideShortcut} onPress={() => router.push('/evenements' as any)}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            <Text style={styles.rideShortcutText}>Evenements</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rideShortcut} onPress={() => router.push('/covoiturage' as any)}>
            <Ionicons name="car-sport-outline" size={16} color={Colors.primary} />
            <Text style={styles.rideShortcutText}>Covoiturage</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.gray400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une annonce…"
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={annonces}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cats}
          >
            <TouchableOpacity
              key="all"
              style={[styles.cat, categorie === null && styles.catActive]}
              onPress={() => setCategorie(null)}
            >
              <Ionicons name="apps-outline" size={18} color={categorie === null ? Colors.white : Colors.gray600} />
              <Text style={[styles.catLabel, categorie === null && styles.catLabelActive]}>Tout</Text>
            </TouchableOpacity>
            {visibleCategories.map((cat: any) => {
              const iconName = (cat.icon as any) ?? MOBILE_FALLBACK_CATEGORIES.find((fallback) => fallback.slug === cat.slug)?.icon ?? 'grid-outline';
              const active = categorie === cat.id;
              return (
              <TouchableOpacity
                key={String(cat.id)}
                style={[styles.cat, active && styles.catActive]}
                onPress={() => setCategorie(active ? null : cat.id)}
              >
                <Ionicons name={iconName} size={18} color={active ? Colors.white : Colors.gray600} />
                <Text style={[styles.catLabel, active && styles.catLabelActive]}>
                  {cat.name ?? cat.label}
                </Text>
              </TouchableOpacity>
              );
            })}
          </ScrollView>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune annonce trouvée</Text>
            </View>
          )
        }
        ListFooterComponent={
          loading ? <ActivityIndicator color={Colors.primary} style={{ margin: Spacing.lg }} /> : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  quickLinks: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' },
  rideShortcut: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: Colors.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  rideShortcutText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  greeting: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  subtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl, paddingHorizontal: Spacing.md,
    marginTop: -20, ...Shadow.md,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, height: 44, fontSize: FontSize.md, color: Colors.text },
  cats: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  cat: {
    alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  catActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catIcon: { fontSize: 20 },
  catLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  catLabelActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  row: { justifyContent: 'space-between', marginBottom: Spacing.sm },
  card: {
    width: '48%', backgroundColor: Colors.white,
    borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm,
  },
  cardImg: { width: '100%', height: 130 },
  cardImgPlaceholder: { backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: Spacing.sm },
  cardTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, lineHeight: 18 },
  cardPrice: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, marginTop: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 2, flexWrap: 'wrap' },
  cardMetaText: { fontSize: FontSize.xs, color: Colors.textTertiary, flexShrink: 1 },
  proBadge: { backgroundColor: Colors.warning, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  proText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white },
  trustBadge: { backgroundColor: Colors.white, borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1, flexDirection: 'row', alignItems: 'center', gap: 2, ...Shadow.sm },
  trustText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.primary },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
