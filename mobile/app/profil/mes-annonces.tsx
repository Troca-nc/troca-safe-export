// ============================================================
//  Troca Mobile - Mes annonces
// ============================================================

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useEffect, useState, useCallback } from 'react'
import { router, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { listingsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme'

type Listing = {
  id: string
  titre?: string
  title?: string
  prix?: number | null
  price?: number | null
  image_url?: string | null
  cover_image?: string | null
  status?: string
  nb_vues?: number
  views_count?: number
  is_boosted?: boolean
  boosted_until?: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: Colors.success },
  inactive: { label: 'Inactive', color: Colors.gray400 },
  expired: { label: 'Expiree', color: Colors.danger },
}

const normalizeListing = (item: any): Listing => ({
  id: String(item.id),
  titre: item.titre ?? item.title ?? '',
  title: item.title ?? item.titre ?? '',
  prix: item.prix ?? item.price ?? null,
  price: item.price ?? item.prix ?? null,
  image_url: item.image_url ?? item.cover_image ?? item.images?.[0]?.url ?? null,
  cover_image: item.cover_image ?? item.image_url ?? item.images?.[0]?.url ?? null,
  status: item.status ?? 'active',
  nb_vues: item.nb_vues ?? item.views_count ?? 0,
  views_count: item.views_count ?? item.nb_vues ?? 0,
  is_boosted: item.is_boosted ?? Boolean(item.boosted_until),
  boosted_until: item.boosted_until ?? null,
})

export default function MesAnnoncesScreen() {
  const { user } = useAuthStore()
  const [annonces, setAnnonces] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchListings = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data } = await listingsApi.getUserListings(String(user?.id ?? ''), { limit: 50, my: true })
      const raw = data.data ?? data ?? []
      setAnnonces(raw.map(normalizeListing))
    } catch {
      Alert.alert('Erreur', 'Impossible de charger vos annonces')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const toggleStatus = async (item: Listing) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active'
    Alert.alert(
      newStatus === 'inactive' ? "Desactiver l'annonce ?" : "Reactiver l'annonce ?",
      newStatus === 'inactive'
        ? 'Elle ne sera plus visible dans les recherches.'
        : 'Elle sera a nouveau visible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await listingsApi.update(item.id, { status: newStatus })
              setAnnonces((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: newStatus } : x)))
            } catch {
              Alert.alert('Erreur', 'Impossible de modifier le statut')
            }
          },
        },
      ]
    )
  }

  const deleteAnnonce = (item: Listing) => {
    Alert.alert('Supprimer ?', `"${item.titre}" sera definitivement supprimee.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await listingsApi.delete(item.id)
            setAnnonces((prev) => prev.filter((x) => x.id !== item.id))
          } catch {
            Alert.alert('Erreur', "Impossible de supprimer l'annonce")
          }
        },
      },
    ])
  }

  const totalViews = annonces.reduce((sum, item) => sum + Number(item.views_count ?? item.nb_vues ?? 0), 0)
  const activeCount = annonces.filter((item) => item.status === 'active').length
  const boostedCount = annonces.filter((item) => item.is_boosted).length

  const renderItem = ({ item }: { item: Listing }) => {
    const status = STATUS_LABELS[item.status ?? 'active'] ?? STATUS_LABELS.inactive

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardMain} onPress={() => router.push(`/annonce/${item.id}`)} activeOpacity={0.8}>
          {item.image_url || item.cover_image ? (
            <Image source={{ uri: item.image_url ?? item.cover_image ?? '' }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={[styles.img, styles.imgEmpty]}>
              <Ionicons name="image-outline" size={20} color={Colors.gray300} />
            </View>
          )}

          <View style={styles.info}>
            <Text style={styles.titre} numberOfLines={2}>
              {item.titre ?? item.title}
            </Text>
            <Text style={styles.prix}>
              {(item.prix ?? item.price) != null
                ? `${Number(item.prix ?? item.price).toLocaleString('fr-NC')} XPF`
                : 'Prix libre'}
            </Text>
            <View style={styles.meta}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
              {item.is_boosted && (
                <View style={styles.boostBadge}>
                  <Ionicons name="rocket" size={10} color={Colors.white} />
                  <Text style={styles.boostText}>Boostee</Text>
                </View>
              )}
              <Ionicons name="eye-outline" size={12} color={Colors.textTertiary} style={{ marginLeft: Spacing.sm }} />
              <Text style={styles.views}>{item.views_count ?? item.nb_vues ?? 0}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => toggleStatus(item)}>
            <Ionicons
              name={item.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.actionLabel}>{item.status === 'active' ? 'Desactiver' : 'Activer'}</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.action} onPress={() => deleteAnnonce(item)}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            <Text style={[styles.actionLabel, { color: Colors.danger }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Mes annonces',
          headerBackTitle: 'Profil',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/tabs/publier')} style={{ marginRight: Spacing.md }}>
              <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={annonces}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                fetchListings()
              }}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.summary}>
              <View style={styles.summaryIntro}>
                <Text style={styles.summaryTitle}>Tableau de bord vendeur</Text>
                <Text style={styles.summarySubtitle}>
                  Suivez vos vues, vos annonces actives et vos boosts, puis ouvrez votre vitrine publique.
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalViews.toLocaleString('fr-FR')}</Text>
                <Text style={styles.summaryLabel}>Vues totales</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{activeCount}</Text>
                <Text style={styles.summaryLabel}>Actives</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{boostedCount}</Text>
                <Text style={styles.summaryLabel}>Boostées</Text>
              </View>
              <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push('/profil')}>
                <Ionicons name="stats-chart" size={16} color={Colors.white} />
                <Text style={styles.dashboardBtnText}>Voir le dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.publicBtn} onPress={() => user?.id && router.push(`/profil/${user.id}`)}>
                <Ionicons name="person-circle-outline" size={16} color={Colors.primary} />
                <Text style={styles.publicBtnText}>Voir ma vitrine publique</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>Aucune annonce</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/tabs/publier')}>
                <Text style={styles.emptyBtnText}>Publier ma premiere annonce</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  list: { padding: Spacing.md, paddingBottom: 32 },
  summary: { marginBottom: Spacing.md, gap: 10 },
  summaryIntro: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  summaryTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  summarySubtitle: { marginTop: 4, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 19 },
  summaryCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', ...Shadow.sm },
  summaryValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  dashboardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12 },
  dashboardBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  publicBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 12, marginTop: 4 },
  publicBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, marginBottom: Spacing.md, ...Shadow.sm, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', padding: Spacing.md },
  img: { width: 80, height: 80, borderRadius: Radius.md, marginRight: Spacing.md },
  imgEmpty: { backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  titre: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, lineHeight: 20 },
  prix: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4, flexWrap: 'wrap' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  boostBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.warning, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4 },
  boostText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white },
  views: { fontSize: FontSize.xs, color: Colors.textTertiary },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  actionDivider: { width: 1, backgroundColor: Colors.border },
  actionLabel: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text, marginTop: Spacing.md },
  emptyBtn: { marginTop: Spacing.lg, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.md },
  emptyBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
})
