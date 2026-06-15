// ============================================================
//  Kalico Mobile - Détail Troc
// ============================================================

import { useMemo, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { trocApi } from '@/lib/api'
import { rememberRedirectAfterLogin } from '@/lib/authRedirect'
import { useAuthStore } from '@/store/authStore'
import TrocProposalSheet from '@/components/troc/TrocProposalSheet'
import { TrocCompatibilityMeter } from '@/components/troc/TrocCompatibilityMeter'
import { normalizeTrocListing, type TrocFeedItem } from '@/lib/trocNormalization'

export default function TrocDetailScreen() {
  // TODO: test E2E sur le detail Troc, l'ouverture de la proposition et le retour au feed.
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const listingId = String(Array.isArray(params.id) ? params.id[0] : params.id ?? '')
  const { user } = useAuthStore()
  const [proposalVisible, setProposalVisible] = useState(false)

  const query = useQuery({
    queryKey: ['troc', 'detail', listingId],
    queryFn: async () => {
      const response = await trocApi.getById(listingId)
      const payload = response.data?.data ?? response.data
      return normalizeTrocListing(payload)
    },
    enabled: Boolean(listingId),
    staleTime: 30_000,
    retry: 0,
  })

  const listing = query.data ?? null
  const wants = useMemo(() => listing?.troc_wants ?? [], [listing])
  const image = listing?.image_url ?? listing?.cover_image ?? listing?.photos?.[0]?.thumbnail_url ?? listing?.photos?.[0]?.url ?? null
  const sellerName = listing ? [listing.seller_prenom, listing.seller_nom].filter(Boolean).join(' ').trim() || 'Troceur' : 'Troceur'

  if (query.isLoading && !listing) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.loaderText}>Chargement de l’annonce…</Text>
      </View>
    )
  }

  if (!listing) {
    return (
      <View style={styles.loaderWrap}>
        <Ionicons name="alert-circle-outline" size={42} color={Colors.primary} />
        <Text style={styles.loaderTitle}>Annonce troc introuvable</Text>
        <Text style={styles.loaderText}>Cette annonce n’est plus disponible ou a été supprimée.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const openProposal = async () => {
    if (!user) {
      await rememberRedirectAfterLogin(`/troc/${listingId}`)
      router.push('/auth/login')
      return
    }
    setProposalVisible(true)
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>🔄 Troc</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{listing.title}</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={openProposal} activeOpacity={0.85}>
          <Ionicons name="heart" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {image ? (
            <Image source={{ uri: image }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="images-outline" size={44} color={Colors.gray300} />
            </View>
          )}
          {listing.troc_accepts_complement_xpf && listing.troc_complement_max_xpf > 0 ? (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                Accepte jusqu’à {Number(listing.troc_complement_max_xpf).toLocaleString('fr-FR')} XPF de complément
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Ionicons name="person-circle-outline" size={16} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{sellerName}</Text>
            {listing.seller_is_pro ? (
              <View style={styles.proPill}>
                <Text style={styles.proPillText}>Pro ✓</Text>
              </View>
            ) : null}
          </View>

          {listing.description ? <Text style={styles.description}>{listing.description}</Text> : null}

          {wants.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ce que le vendeur cherche</Text>
              <View style={styles.tagsRow}>
                {wants.map((want) => (
                  <View key={want} style={styles.tag}>
                    <Text style={styles.tagText}>{want}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <TrocCompatibilityMeter
              compatibility={listing.compatibility ?? null}
              emptyLabel="Publiez une annonce troc pour voir votre compatibilité"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={openProposal} activeOpacity={0.88}>
          <Ionicons name="chatbubbles-outline" size={18} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Proposer un échange</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Catégorie</Text>
            <Text style={styles.infoValue}>{listing.category_name ?? listing.category_slug ?? 'Troc'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statut</Text>
            <Text style={styles.infoValue}>
              {listing.troc_status === 'open'
                ? 'Ouvert'
                : listing.troc_status === 'negotiating'
                  ? 'En négociation'
                  : listing.troc_status === 'completed'
                    ? 'Complété'
                    : 'Annulé'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <TrocProposalSheet
        visible={proposalVisible}
        listing={listing}
        onClose={() => setProposalVisible(false)}
        onSubmitted={() => setProposalVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  headerTitle: {
    marginTop: 3,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 32,
  },
  hero: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 300,
    borderRadius: 28,
    backgroundColor: Colors.gray100,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    backgroundColor: 'rgba(8,32,50,0.78)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    gap: 12,
    ...Shadow.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  proPill: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proPillText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    backgroundColor: Colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  primaryBtn: {
    minHeight: 50,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    ...Shadow.md,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
    gap: 8,
  },
  loaderTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  loaderText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})
