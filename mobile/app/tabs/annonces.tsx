// ============================================================
//  Troca Mobile - Onglet Annonces
// ============================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listingsApi, metaApi } from '@/lib/api';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { MOBILE_FALLBACK_CATEGORIES } from '@/lib/categoryCatalog';
import { MobileListing, normalizeListing } from '@/lib/listingNormalization';

const SORTS = [
  { value: 'date', label: 'Plus récentes' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
];

export default function AnnoncesTab() {
  const [annonces, setAnnonces] = useState<MobileListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [sort, setSort] = useState('date');
  const [prixMin, setPrixMin] = useState('');
  const [prixMax, setPrixMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [commune, setCommune] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstFilterRun = useRef(true);
  const visibleCategories = categories.length > 0 ? categories : MOBILE_FALLBACK_CATEGORIES;

  const fetchAnnonces = useCallback(
    async (reset = false) => {
      if (loading && !reset) return;
      setLoading(true);
      try {
        const p = reset ? 1 : page;
        const params: Record<string, any> = { page: p, limit: 20, sort };
        if (search) params.q = search;
        if (prixMin) params.price_min = prixMin;
        if (prixMax) params.price_max = prixMax;
        if (commune) params.commune_id = commune;
        if (categoryId) params.category_id = categoryId;

        const { data } = await listingsApi.search(params);
        const items = (data.data ?? []).map(normalizeListing);
        setAnnonces((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(items.length === 20);
        if (reset) setPage(1);
      } catch (err) {
        console.error('[annonces] fetch error', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loading, page, search, sort, prixMin, prixMax, commune, categoryId]
  );

  useEffect(() => {
    metaApi
      .getCategories()
      .then(({ data }) => {
        const raw = Array.isArray(data.data) ? data.data : [];
        setCategories(raw);
      })
      .catch(() => setCategories(MOBILE_FALLBACK_CATEGORIES as any));

    metaApi
      .getCommunes()
      .then(({ data }) => {
        const raw = Array.isArray(data.data) ? data.data : [];
        const flat = raw.flatMap((province: any) => province.communes ?? []);
        setCommunes(flat);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
      fetchAnnonces(true);
      return;
    }

    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchAnnonces(true), 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [search, sort, prixMin, prixMax, commune, categoryId, fetchAnnonces]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchAnnonces(true);
  };
  const loadMore = () => {
    if (hasMore && !loading) setPage((p) => p + 1);
  };

  useEffect(() => {
    if (page > 1) fetchAnnonces();
  }, [page, fetchAnnonces]);

  const renderItem = ({ item }: { item: MobileListing }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/annonce/${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.cardImgWrap}>
        {item.image_url || item.cover_image ? (
          <Image source={{ uri: item.image_url ?? item.cover_image ?? '' }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImg, styles.cardImgEmpty]}>
            <Ionicons name="image-outline" size={24} color={Colors.gray300} />
          </View>
        )}
        {item.is_boosted && (
          <View style={styles.boostBadge}>
            <Ionicons name="rocket" size={10} color={Colors.white} />
            <Text style={styles.boostText}>TOP</Text>
          </View>
        )}
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
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.titre ?? item.title}
        </Text>
        <Text style={styles.cardPrice}>
          {(item.prix_xpf ?? item.price) != null
            ? `${Number(item.prix_xpf ?? item.price).toLocaleString('fr-NC')} XPF`
            : 'Prix libre'}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.cardMetaTxt}>{item.commune ?? item.commune_name ?? 'NC'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={Colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher…"
              placeholderTextColor={Colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={() => setShowFilters((f) => !f)}
          >
            <Ionicons name="options-outline" size={20} color={showFilters ? Colors.white : Colors.primary} />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filters}>
            <View style={styles.sortRow}>
              {SORTS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.sortChip, sort === s.value && styles.sortChipActive]}
                  onPress={() => setSort(s.value)}
                >
                  <Text style={[styles.sortLabel, sort === s.value && styles.sortLabelActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View>
              <Text style={styles.filterTitle}>Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  <TouchableOpacity
                    style={[styles.sortChip, categoryId === null && styles.sortChipActive]}
                    onPress={() => setCategoryId(null)}
                  >
                    <Text style={[styles.sortLabel, categoryId === null && styles.sortLabelActive]}>Toutes</Text>
                  </TouchableOpacity>
                  {visibleCategories.map((cat: any) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.sortChip, categoryId === cat.id && styles.sortChipActive]}
                      onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                    >
                      <Ionicons
                        name={
                          (cat.icon as any) ??
                          MOBILE_FALLBACK_CATEGORIES.find((fallback) => fallback.slug === cat.slug)?.icon ??
                          'grid-outline'
                        }
                        size={12}
                        color={categoryId === cat.id ? Colors.white : Colors.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.sortLabel, categoryId === cat.id && styles.sortLabelActive]}>
                        {cat.name ?? cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {communes.length > 0 && (
              <View>
                <Text style={styles.filterTitle}>Commune</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipsRow}>
                    <TouchableOpacity
                      style={[styles.sortChip, commune === null && styles.sortChipActive]}
                      onPress={() => setCommune(null)}
                    >
                      <Text style={[styles.sortLabel, commune === null && styles.sortLabelActive]}>Toutes</Text>
                    </TouchableOpacity>
                    {communes.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.sortChip, commune === c.id && styles.sortChipActive]}
                        onPress={() => setCommune(commune === c.id ? null : c.id)}
                      >
                        <Text style={[styles.sortLabel, commune === c.id && styles.sortLabelActive]}>
                          {c.name ?? c.nom}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="Prix min XPF"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
                value={prixMin}
                onChangeText={setPrixMin}
              />
              <Text style={styles.priceSep}>—</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Prix max XPF"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="numeric"
                value={prixMax}
                onChangeText={setPrixMax}
              />
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={annonces}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune annonce trouvée</Text>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator color={Colors.primary} style={{ margin: Spacing.lg }} /> : null}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    backgroundColor: Colors.white,
    paddingTop: 52,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filters: { marginTop: Spacing.sm, gap: Spacing.sm },
  sortRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  sortChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  sortLabelActive: { color: Colors.white },
  filterTitle: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  chipsRow: { flexDirection: 'row', gap: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  priceInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.text,
    backgroundColor: Colors.gray50,
  },
  priceSep: { color: Colors.textTertiary },
  list: { padding: Spacing.md, paddingBottom: Spacing.xl },
  row: { justifyContent: 'space-between', marginBottom: Spacing.sm },
  card: { width: '48%', backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  cardImgWrap: { position: 'relative' },
  cardImg: { width: '100%', height: 120 },
  cardImgEmpty: { backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  boostBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.warning,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  boostText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white },
  proBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: Colors.primary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  proText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white },
  trustBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    ...Shadow.sm,
  },
  trustText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.primary },
  cardBody: { padding: Spacing.sm },
  cardTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, lineHeight: 17 },
  cardPrice: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, marginTop: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  cardMetaTxt: { fontSize: FontSize.xs, color: Colors.textTertiary },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
