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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { covoiturageApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type Ride = {
  id: number | string;
  departure: string;
  destination: string;
  ride_date: string;
  ride_time: string;
  seats_remaining?: number;
  price_xpf: number;
  vehicle?: string | null;
  description: string;
  trust_score?: number | null;
  is_verified_driver?: boolean;
};

function formatDate(value?: string) {
  if (!value) return 'Date libre';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date libre';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
}

export default function CovoiturageScreen() {
  const { user } = useAuthStore();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookId, setBookId] = useState<string | number | null>(null);
  const [filters, setFilters] = useState({ q: '', departure: '', destination: '' });
  const [form, setForm] = useState({
    departure: '',
    destination: '',
    ride_date: '',
    ride_time: '',
    seats_total: '3',
    price_xpf: '0',
    description: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await covoiturageApi.list({
        limit: 10,
        q: filters.q || undefined,
        departure: filters.departure || undefined,
        destination: filters.destination || undefined,
      });
      setRides(data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de charger les trajets.');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBook = async (id: string | number) => {
    setBookId(id);
    setError('');
    try {
      await covoiturageApi.book(id, { seats: 1 });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Reservation impossible.');
    } finally {
      setBookId(null);
    }
  };

  const handleCreate = async () => {
    setError('');
    try {
      await covoiturageApi.create({
        departure: form.departure,
        destination: form.destination,
        ride_date: form.ride_date,
        ride_time: form.ride_time,
        seats_total: Number(form.seats_total || 3),
        price_xpf: Number(form.price_xpf || 0),
        description: form.description,
      });
      setForm({
        departure: '',
        destination: '',
        ride_date: '',
        ride_time: '',
        seats_total: '3',
        price_xpf: '0',
        description: '',
      });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Publication impossible.');
    }
  };

  const rideCount = useMemo(() => rides.length, [rides]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.rootContent}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Covoiturage</Text>
        <Text style={styles.title}>Trajets simples, confiance claire, reservation rapide.</Text>
        <Text style={styles.subtitle}>
          Publiez un trajet ou trouvez une place en quelques secondes depuis le mobile.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.filterInput}
          placeholder="Depart"
          placeholderTextColor={Colors.textTertiary}
          value={filters.departure}
          onChangeText={(departure) => setFilters((prev) => ({ ...prev, departure }))}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Destination"
          placeholderTextColor={Colors.textTertiary}
          value={filters.destination}
          onChangeText={(destination) => setFilters((prev) => ({ ...prev, destination }))}
        />
        <TextInput
          style={[styles.filterInput, { minWidth: 180 }]}
          placeholder="Mots cles"
          placeholderTextColor={Colors.textTertiary}
          value={filters.q}
          onChangeText={(q) => setFilters((prev) => ({ ...prev, q }))}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={load}>
          <Ionicons name="search" size={16} color={Colors.white} />
          <Text style={styles.searchBtnText}>Filtrer</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Publier un trajet</Text>
        <View style={styles.formGrid}>
          <TextInput style={styles.input} placeholder="Depart" value={form.departure} onChangeText={(departure) => setForm((prev) => ({ ...prev, departure }))} />
          <TextInput style={styles.input} placeholder="Destination" value={form.destination} onChangeText={(destination) => setForm((prev) => ({ ...prev, destination }))} />
          <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={form.ride_date} onChangeText={(ride_date) => setForm((prev) => ({ ...prev, ride_date }))} />
          <TextInput style={styles.input} placeholder="Heure (HH:MM)" value={form.ride_time} onChangeText={(ride_time) => setForm((prev) => ({ ...prev, ride_time }))} />
          <TextInput style={styles.input} placeholder="Places" keyboardType="numeric" value={form.seats_total} onChangeText={(seats_total) => setForm((prev) => ({ ...prev, seats_total }))} />
          <TextInput style={styles.input} placeholder="Prix / place" keyboardType="numeric" value={form.price_xpf} onChangeText={(price_xpf) => setForm((prev) => ({ ...prev, price_xpf }))} />
        </View>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Description du trajet"
          multiline
          value={form.description}
          onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate}>
          <Text style={styles.primaryBtnText}>Publier le trajet</Text>
        </TouchableOpacity>
        {!user ? <Text style={styles.helper}>Connectez-vous pour publier ou reserver.</Text> : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trajets disponibles</Text>
        <Text style={styles.sectionCount}>{rideCount} resultat(s)</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.departure} - {item.destination}</Text>
                {item.is_verified_driver ? (
                  <View style={styles.badge}>
                    <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
                    <Text style={styles.badgeText}>Verifie</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardMeta}>{formatDate(item.ride_date)} · {item.ride_time.slice(0, 5)} · {item.price_xpf.toLocaleString('fr-FR')} XPF</Text>
              <Text style={styles.cardBody} numberOfLines={3}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>{item.seats_remaining ?? 0} place(s)</Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleBook(item.id)} disabled={bookId === item.id}>
                  <Text style={styles.secondaryBtnText}>{bookId === item.id ? '...' : 'Reserver'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aucun trajet trouve</Text>
              <Text style={styles.emptyText}>Modifiez vos filtres ou publiez le premier trajet du jour.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/tabs/accueil')}>
        <Ionicons name="home" size={18} color={Colors.white} />
        <Text style={styles.fabText}>Accueil</Text>
      </TouchableOpacity>
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
  section: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.lg, ...Shadow.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  sectionCount: { fontSize: FontSize.xs, color: Colors.textTertiary },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  input: { flexGrow: 1, flexBasis: '48%', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background, paddingHorizontal: Spacing.md, paddingVertical: 12, color: Colors.text, marginBottom: Spacing.sm },
  textarea: { minHeight: 92, flexBasis: '100%', textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.xs },
  primaryBtnText: { color: Colors.white, fontWeight: FontWeight.semibold },
  helper: { marginTop: Spacing.sm, color: Colors.textTertiary, fontSize: FontSize.xs },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: Colors.primary, fontSize: 10, fontWeight: FontWeight.bold },
  cardMeta: { marginTop: 8, fontSize: FontSize.xs, color: Colors.textSecondary },
  cardBody: { marginTop: 8, fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  cardFooter: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardFooterText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  secondaryBtn: { backgroundColor: Colors.sand, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10 },
  secondaryBtnText: { color: Colors.text, fontWeight: FontWeight.semibold },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  emptyText: { marginTop: 4, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 12, ...Shadow.md },
  fabText: { color: Colors.white, fontWeight: FontWeight.semibold },
});
