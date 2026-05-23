import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { bonPlansApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import BonPlanCard from '@/components/BonPlanCard';

type BonPlan = {
  id: string | number;
  title: string;
  description: string;
  image_url?: string | null;
  promo_label?: string | null;
  original_price_xpf?: number | null;
  promo_price_xpf?: number | null;
  cta_label?: string | null;
  cta_url?: string | null;
  category?: string | null;
  published_until?: string | null;
  business_name?: string | null;
  business_logo_url?: string | null;
  business_badge?: string | null;
  business_review_avg?: number | null;
  business_review_count?: number | null;
};

const CATEGORIES = [
  { value: '', label: 'Tout' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'mode', label: 'Mode' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'high_tech', label: 'High-Tech' },
  { value: 'auto_moto', label: 'Auto/Moto' },
  { value: 'maison', label: 'Maison' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'services', label: 'Services' },
  { value: 'sport', label: 'Sport' },
  { value: 'voyages', label: 'Voyages' },
  { value: 'autre', label: 'Autre' },
];

export default function BonsPlansScreen() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<BonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await bonPlansApi.list({
        limit: 30,
        q: search.trim() || undefined,
        category: category || undefined,
      });
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [search, category]);

  const handleFollow = async (businessName: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      const prefs = await bonPlansApi.getPrefs().catch(() => ({ data: { data: { notify_businesses: [] } } }));
      const current = prefs.data?.data?.notify_businesses || [];
      const next = Array.from(new Set([...current, businessName]));
      await bonPlansApi.savePrefs({
        ...prefs.data?.data,
        notify_all: true,
        notify_businesses: next,
        via_push: true,
      });
    } catch {}
  };

  const renderItem = ({ item }: { item: BonPlan }) => (
    <BonPlanCard bonPlan={item} onFollowBusiness={handleFollow} />
  );

  const header = (
    <View style={styles.header}>
      <Text style={styles.kicker}>Les Bons Plans du moment</Text>
      <Text style={styles.title}>Les meilleures promos des enseignes de Nouvelle-Calédonie</Text>
      <Text style={styles.subtitle}>Publication immédiate après paiement, à partir de 2 900 XPF.</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.gray400} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une promo ou une enseigne..."
          placeholderTextColor={Colors.textTertiary}
          returnKeyType="search"
        />
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.value || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        renderItem={({ item }) => {
          const active = item.value === category;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setCategory(item.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.publishBtn} onPress={() => Linking.openURL('https://troca.nc/bons-plans/publier')}>
        <Text style={styles.publishBtnText}>Publier une promo</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      {header}

      {loading && items.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  kicker: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: FontSize.sm,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  chipsRow: {
    gap: 8,
    paddingVertical: Spacing.md,
  },
  chip: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  chipTextActive: {
    color: Colors.white,
  },
  publishBtn: {
    marginTop: Spacing.sm,
    minHeight: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
