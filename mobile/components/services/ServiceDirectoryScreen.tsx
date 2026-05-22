import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { bonPlansApi } from '@/lib/api';

type ServiceItem = {
  id: number | string;
  title: string;
  description: string;
  kind?: string;
  target_audience?: string;
  price_xpf?: number | null;
  normal_price_xpf?: number | null;
  promo_price_xpf?: number | null;
  discount_pct?: number | null;
  location_name?: string | null;
  commune_name?: string | null;
  event_date?: string | null;
  expires_at?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  link_url?: string | null;
  view_count?: number | null;
  share_count?: number | null;
};

function formatDate(value?: string | null) {
  if (!value) return 'Date libre';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date libre';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
}

function formatMoney(value?: number | null) {
  if (value == null) return 'Sur devis';
  return `${Number(value).toLocaleString('fr-NC')} XPF`;
}

function ServiceCard({
  item,
  mode,
}: {
  item: ServiceItem;
  mode: 'promo' | 'event';
}) {
  const isPromo = mode === 'promo';

  const handleOpen = async () => {
    const target = item.link_url || item.website_url || item.contact_phone ? (item.link_url || item.website_url || `tel:${item.contact_phone}`) : null;
    if (!target) return;
    try {
      await Linking.openURL(target);
    } catch {}
  };

  const handleShare = async () => {
    const payload = {
      title: item.title,
      message: `${item.title}\n${item.description}\n${item.link_url || item.website_url || 'Troca'}`,
    };
    try {
      await Share.share(payload);
    } catch {}
  };

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{isPromo ? 'Promotion' : 'Evenement'}</Text>
        </View>
        {item.target_audience ? (
          <View style={[styles.badge, styles.badgeSoft]}>
            <Text style={[styles.badgeText, styles.badgeSoftText]}>
              {item.target_audience === 'pro' ? 'Pro' : 'Particulier'}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Ionicons name="location-outline" size={12} color={Colors.primary} />
          <Text style={styles.metaText}>{item.commune_name || item.location_name || 'NC'}</Text>
        </View>
        <View style={styles.metaPill}>
          <Ionicons name="calendar-outline" size={12} color={Colors.primary} />
          <Text style={styles.metaText}>{formatDate(item.event_date)}</Text>
        </View>
      </View>

      <View style={styles.priceBox}>
        <Text style={styles.priceLabel}>{isPromo ? 'Tarif promo' : 'Date / reservation'}</Text>
        {isPromo ? (
          <>
            <Text style={styles.priceText}>{formatMoney(item.promo_price_xpf ?? item.price_xpf)}</Text>
            {item.normal_price_xpf != null ? (
              <Text style={styles.priceSub}>
                Au lieu de {formatMoney(item.normal_price_xpf)}
                {item.discount_pct != null ? ` · -${item.discount_pct}%` : ''}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.priceText}>{formatDate(item.event_date)}</Text>
            <Text style={styles.priceSub}>{item.contact_name || 'Organisateur local'}</Text>
          </>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cardActionBtn} onPress={handleOpen}>
          <Text style={styles.cardActionBtnText}>{isPromo ? 'Voir' : 'Ouvrir'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare}>
          <Text style={styles.secondaryBtnText}>Partager</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ServiceDirectoryScreen({
  mode,
  title,
  eyebrow,
  subtitle,
  kind,
  searchPlaceholder,
  publishLabel,
  publishDescription,
}: {
  mode: 'promo' | 'event';
  title: string;
  eyebrow: string;
  subtitle: string;
  kind: string;
  searchPlaceholder: string;
  publishLabel: string;
  publishDescription: string;
}) {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [audience, setAudience] = useState<'all' | 'particulier' | 'pro'>('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    location_name: '',
    event_date: '',
    normal_price_xpf: '',
    promo_price_xpf: '',
    discount_pct: '',
    contact_name: '',
    contact_phone: '',
    website_url: '',
    target_audience: 'particulier',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await bonPlansApi.list({
        limit: 24,
        kind,
        q: search || undefined,
        target_audience: audience === 'all' ? undefined : audience,
      });
      setItems(data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de charger les contenus.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, audience]);

  const handlePublish = async () => {
    setSaving(true);
    setError('');
    try {
      await bonPlansApi.create({
        title: form.title,
        description: form.description,
        kind: mode === 'promo' ? 'promo' : 'event',
        target_audience: form.target_audience,
        duration_days: mode === 'promo' ? 7 : 3,
        location_name: form.location_name || null,
        event_date: form.event_date || null,
        normal_price_xpf: form.normal_price_xpf ? Number(form.normal_price_xpf) : null,
        promo_price_xpf: form.promo_price_xpf ? Number(form.promo_price_xpf) : null,
        discount_pct: form.discount_pct ? Number(form.discount_pct) : null,
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        website_url: form.website_url || null,
        photos: [],
        social_links: {},
      });
      setForm({
        title: '',
        description: '',
        location_name: '',
        event_date: '',
        normal_price_xpf: '',
        promo_price_xpf: '',
        discount_pct: '',
        contact_name: '',
        contact_phone: '',
        website_url: '',
        target_audience: 'particulier',
      });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Publication impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.rootContent}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} keyboardShouldPersistTaps="handled">
        <TextInput
          style={[styles.filterInput, { minWidth: 180 }]}
          placeholder={searchPlaceholder}
          placeholderTextColor={Colors.textTertiary}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setSearch(searchInput.trim())}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => setSearch(searchInput.trim())}>
          <Ionicons name="search" size={16} color={Colors.white} />
          <Text style={styles.searchBtnText}>Rechercher</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, audience === 'all' && styles.filterPillActive]}
          onPress={() => setAudience('all')}
        >
          <Text style={[styles.filterPillText, audience === 'all' && styles.filterPillTextActive]}>Tous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, audience === 'particulier' && styles.filterPillActive]}
          onPress={() => setAudience('particulier')}
        >
          <Text style={[styles.filterPillText, audience === 'particulier' && styles.filterPillTextActive]}>Particuliers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, audience === 'pro' && styles.filterPillActive]}
          onPress={() => setAudience('pro')}
        >
          <Text style={[styles.filterPillText, audience === 'pro' && styles.filterPillTextActive]}>Pros</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{publishLabel}</Text>
        <Text style={styles.helper}>{publishDescription}</Text>
        <View style={styles.formGrid}>
          <TextInput style={styles.input} placeholder="Titre" value={form.title} onChangeText={(title) => setForm((prev) => ({ ...prev, title }))} />
          <TextInput style={styles.input} placeholder={mode === 'promo' ? 'Lieu / boutique' : 'Lieu / salle'} value={form.location_name} onChangeText={(location_name) => setForm((prev) => ({ ...prev, location_name }))} />
          <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={form.event_date} onChangeText={(event_date) => setForm((prev) => ({ ...prev, event_date }))} />
          <TextInput style={styles.input} placeholder="Contact" value={form.contact_name} onChangeText={(contact_name) => setForm((prev) => ({ ...prev, contact_name }))} />
          <TextInput style={styles.input} placeholder="Prix normal" keyboardType="numeric" value={form.normal_price_xpf} onChangeText={(normal_price_xpf) => setForm((prev) => ({ ...prev, normal_price_xpf }))} />
          <TextInput style={styles.input} placeholder="Prix promo" keyboardType="numeric" value={form.promo_price_xpf} onChangeText={(promo_price_xpf) => setForm((prev) => ({ ...prev, promo_price_xpf }))} />
          <TextInput style={styles.input} placeholder="% reduction" keyboardType="numeric" value={form.discount_pct} onChangeText={(discount_pct) => setForm((prev) => ({ ...prev, discount_pct }))} />
          <TextInput style={styles.input} placeholder="Site web" value={form.website_url} onChangeText={(website_url) => setForm((prev) => ({ ...prev, website_url }))} />
        </View>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Description"
          multiline
          value={form.description}
          onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
        />
        <View style={styles.formRow}>
          <TouchableOpacity
            style={[styles.smallPill, form.target_audience === 'particulier' && styles.smallPillActive]}
            onPress={() => setForm((prev) => ({ ...prev, target_audience: 'particulier' }))}
          >
            <Text style={[styles.smallPillText, form.target_audience === 'particulier' && styles.smallPillTextActive]}>Particulier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallPill, form.target_audience === 'pro' && styles.smallPillActive]}
            onPress={() => setForm((prev) => ({ ...prev, target_audience: 'pro' }))}
          >
            <Text style={[styles.smallPillText, form.target_audience === 'pro' && styles.smallPillTextActive]}>Pro</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryBtnText}>Publier</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Contenus visibles</Text>
        <Text style={styles.sectionCount}>{items.length} resultat(s)</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ServiceCard item={item} mode={mode} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aucun contenu trouve</Text>
              <Text style={styles.emptyText}>Modifiez la recherche ou publiez le premier contenu de cette section.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <View style={styles.footerActions}>
          <TouchableOpacity style={styles.footerBtn} onPress={() => router.push('/tabs/accueil' as any)}>
            <Ionicons name="home" size={16} color={Colors.primary} />
            <Text style={styles.footerBtnText}>Accueil</Text>
          </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={() => router.push((mode === 'promo' ? '/evenements' : '/bons-plans') as any)}>
          <Ionicons name="swap-horizontal" size={16} color={Colors.primary} />
          <Text style={styles.footerBtnText}>{mode === 'promo' ? 'Evenements' : 'Bons plans'}</Text>
        </TouchableOpacity>
      </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  rootContent: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg },
  header: { paddingTop: 56, paddingBottom: Spacing.md },
  kicker: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', color: Colors.primary, letterSpacing: 1.2 },
  title: { fontSize: 28, fontWeight: FontWeight.bold, color: Colors.text, marginTop: 6 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 8, lineHeight: 20 },
  errorBox: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  errorText: { color: '#B91C1C', fontSize: FontSize.sm },
  filters: { gap: Spacing.sm, paddingBottom: Spacing.md },
  filterInput: { minWidth: 140, backgroundColor: Colors.white, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text },
  searchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 12 },
  searchBtnText: { color: Colors.white, fontWeight: FontWeight.semibold },
  filterPill: { borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.white },
  filterPillActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  filterPillText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  filterPillTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  section: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.lg, ...Shadow.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  sectionCount: { fontSize: FontSize.xs, color: Colors.textTertiary },
  helper: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 18 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  input: { flexGrow: 1, flexBasis: '48%', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, paddingHorizontal: Spacing.md, paddingVertical: 12, color: Colors.text, marginBottom: Spacing.sm },
  textarea: { minHeight: 92, flexBasis: '100%', textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.sm },
  smallPill: { borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.white },
  smallPillActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  smallPillText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  smallPillTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  publishBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.xs },
  primaryBtnText: { color: Colors.white, fontWeight: FontWeight.semibold },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.md },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  badge: { borderRadius: Radius.full, backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6 },
  badgeSoft: { backgroundColor: Colors.gray100 },
  badgeText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  badgeSoftText: { color: Colors.textSecondary },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  cardDescription: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.full, backgroundColor: Colors.gray100, paddingHorizontal: 10, paddingVertical: 6 },
  metaText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  priceBox: { backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.sm },
  priceLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  priceText: { marginTop: 4, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  priceSub: { marginTop: 4, fontSize: FontSize.sm, color: Colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cardActionBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 12, alignItems: 'center' },
  cardActionBtnText: { color: Colors.white, fontWeight: FontWeight.semibold },
  secondaryBtn: { flex: 1, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.white },
  secondaryBtnText: { color: Colors.text, fontWeight: FontWeight.semibold },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  footerActions: { position: 'absolute', bottom: 16, left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', gap: Spacing.sm },
  footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.white, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12, ...Shadow.sm },
  footerBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
});
