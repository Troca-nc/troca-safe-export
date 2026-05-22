// ============================================================
//  Troca Mobile - Mes favoris
// ============================================================

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
} from 'react-native'
import { useEffect, useState, useCallback } from 'react'
import { router, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { favoritesApi } from '@/lib/api'
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme'
import { ListingSkeletonList } from '@/components/ListingSkeleton'

interface Annonce {
  id: string
  seller_id?: number | string
  titre?: string
  title?: string
  prix_xpf?: number | null
  price?: number | null
  commune?: string | null
  commune_name?: string | null
  image_url?: string | null
  cover_image?: string | null
  status?: string
  user?: {
    prenom?: string
    is_pro?: boolean
    email_verified?: boolean
    phone_verified?: boolean
    trust_score?: number | null
    trust_level?: string | null
    seller_prenom?: string
  }
}

export default function FavorisScreen() {
  const [favoris, setFavoris] = useState<Annonce[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetch = useCallback(async () => {
    try {
      const { data } = await favoritesApi.getFavorites()
      const items = (data.data ?? []).map((item: any) => ({
        ...item,
        id: String(item.id),
        seller_id: item.seller_id ?? item.user_id ?? item.seller?.id ?? null,
        titre: item.titre ?? item.title,
        title: item.title ?? item.titre,
        prix_xpf: item.prix_xpf ?? item.price ?? null,
        price: item.price ?? item.prix_xpf ?? null,
        commune: item.commune ?? item.commune_name ?? null,
        commune_name: item.commune_name ?? item.commune ?? null,
        image_url: item.image_url ?? item.cover_image ?? null,
        cover_image: item.cover_image ?? item.image_url ?? null,
        user: {
          prenom: item.seller_prenom ?? item.user?.prenom ?? '',
          is_pro: item.seller_is_pro ?? item.user?.is_pro ?? false,
          email_verified: item.seller_email_verified ?? item.user?.email_verified ?? false,
          phone_verified: item.seller_phone_verified ?? item.user?.phone_verified ?? false,
          trust_score: item.seller_trust_score ?? item.user?.trust_score ?? null,
          trust_level: item.seller_trust_level ?? item.user?.trust_level ?? null,
          seller_prenom: item.seller_prenom ?? '',
        },
      }))
      setFavoris(items)
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les favoris')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const removeFavori = async (id: string) => {
    try {
      await favoritesApi.toggleFavorite(id)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setFavoris((prev) => prev.filter((a) => a.id !== id))
    } catch {
      Alert.alert('Erreur')
    }
  }

  const renderItem = ({ item }: { item: Annonce }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/annonce/${item.id}`)} activeOpacity={0.85}>
      {item.image_url ?? item.cover_image ? (
        <Image source={{ uri: item.image_url ?? item.cover_image ?? '' }} style={styles.img} resizeMode="cover" />
      ) : (
        <View style={[styles.img, styles.imgEmpty]}>
          <Ionicons name="image-outline" size={28} color={Colors.gray300} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.titre} numberOfLines={2}>
          {item.titre ?? item.title}
        </Text>
        <Text style={styles.prix}>
          {(item.prix_xpf ?? item.price) != null
            ? `${Number(item.prix_xpf ?? item.price).toLocaleString('fr-NC')} XPF`
            : 'Prix libre'}
        </Text>
        <View style={styles.meta}>
          {item.commune && (
            <>
              <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
              <Text style={styles.metaTxt}>{item.commune}</Text>
            </>
          )}
          {item.user?.is_pro && (
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          )}
          {item.user?.email_verified && (
            <View style={styles.verifBadge}>
              <Text style={styles.verifText}>Email</Text>
            </View>
          )}
          {item.user?.phone_verified && (
            <View style={styles.verifBadge}>
              <Text style={styles.verifText}>Tel</Text>
            </View>
          )}
          {item.user?.trust_score != null && (
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={10} color={Colors.primary} />
              <Text style={styles.trustText}>{item.user.trust_score}/100</Text>
            </View>
          )}
          {item.status && item.status !== 'active' && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveText}>Indisponible</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.sellerBtn}
            onPress={() => item.seller_id && router.push(`/profil/${item.seller_id}`)}
            disabled={!item.seller_id}
          >
            <Ionicons name="person-circle-outline" size={14} color={Colors.primary} />
            <Text style={styles.sellerBtnText}>Voir le vendeur</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.heart} onPress={() => removeFavori(item.id)}>
        <Ionicons name="heart" size={22} color={Colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Mes favoris',
          headerBackTitle: 'Profil',
          headerTintColor: Colors.primary,
          headerStyle: { backgroundColor: Colors.white },
        }}
      />

      {loading ? (
        <View style={styles.loading}>
          {/* TODO: test E2E sur le chargement initial des favoris mobile. */}
          <ListingSkeletonList count={6} variant="list" />
        </View>
      ) : (
        <FlatList
          data={favoris}
          keyExtractor={(a) => a.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                fetch()
              }}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>Favoris sauvegardés</Text>
              <Text style={styles.headerSubtitle}>
                Retrouvez ici les annonces que vous souhaitez suivre, avec les signaux de confiance du vendeur.
              </Text>
              <View style={styles.headerStats}>
                <View style={styles.headerStat}>
                  <Text style={styles.headerStatValue}>{favoris.length}</Text>
                  <Text style={styles.headerStatLabel}>Annonces</Text>
                </View>
                <View style={styles.headerStat}>
                  <Text style={styles.headerStatValue}>{favoris.filter((a) => a.user?.is_pro).length}</Text>
                  <Text style={styles.headerStatLabel}>Pro</Text>
                </View>
                <View style={styles.headerStat}>
                  <Text style={styles.headerStatValue}>
                    {favoris.filter((a) => a.user?.email_verified || a.user?.phone_verified).length}
                  </Text>
                  <Text style={styles.headerStatLabel}>Vérifiés</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>❤️</Text>
              <Text style={styles.emptyTitle}>Aucun favori</Text>
              <Text style={styles.emptyText}>
                Appuyez sur le cœur d'une annonce pour l'ajouter à vos favoris.
              </Text>
            </View>
          }
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, backgroundColor: Colors.white },
  loading: { flex: 1, backgroundColor: Colors.white, padding: Spacing.md, gap: Spacing.sm },
  headerCard: { margin: Spacing.md, marginBottom: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.white, padding: Spacing.md, ...Shadow.sm },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  headerSubtitle: { marginTop: 4, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  headerStats: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  headerStat: { flex: 1, alignItems: 'center', backgroundColor: Colors.gray50, borderRadius: Radius.md, paddingVertical: 10 },
  headerStatValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  headerStatLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.white },
  img: { width: 80, height: 80, borderRadius: Radius.md, marginRight: Spacing.md },
  imgEmpty: { backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  titre: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, lineHeight: 20 },
  prix: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  metaTxt: { fontSize: FontSize.xs, color: Colors.textTertiary },
  proBadge: { backgroundColor: Colors.primary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  proText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white },
  verifBadge: { backgroundColor: Colors.primary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  verifText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.gray100, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  trustText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.primary },
  inactiveBadge: { backgroundColor: Colors.gray300, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  inactiveText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8 },
  sellerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.white },
  sellerBtnText: { fontSize: 11, fontWeight: FontWeight.semibold, color: Colors.primary },
  heart: { padding: Spacing.sm },
  sep: { height: 1, backgroundColor: Colors.border, marginLeft: 80 + Spacing.md * 2 },
  empty: { alignItems: 'center', paddingTop: 80, padding: Spacing.xl },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
})
