// ============================================================
//  Troca Mobile - Cycle Troc
// ============================================================

import { useMemo, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQueries, useQuery } from '@tanstack/react-query'

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { trocApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { TrocCycle, TrocListing } from '@/types/troc'

type CycleListing = TrocListing & {
  seller_prenom?: string | null
  seller_nom?: string | null
  seller_is_pro?: boolean
  commune_name?: string | null
  images?: Array<{ url?: string | null; thumbnail_url?: string | null; is_cover?: boolean }>
}

function formatName(prenom?: string | null, nom?: string | null) {
  return [prenom, nom].filter(Boolean).join(' ').trim() || 'Troceur'
}

function formatRemaining(expiresAt?: string | null) {
  if (!expiresAt) return '48 h pour confirmer'
  const hours = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 3_600_000))
  return hours > 24 ? `${Math.ceil(hours / 24)} j restants` : `${hours} h restantes`
}

export default function TrocCycleScreen() {
  // TODO: test E2E sur le détail de cycle, la confirmation et l’ouverture du chat de groupe.
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const cycleId = String(Array.isArray(params.id) ? params.id[0] : params.id ?? '')
  const { user } = useAuthStore()
  const [conversationId, setConversationId] = useState<string | number | null>(null)

  const cyclesQuery = useQuery({
    queryKey: ['troc', 'cycles', user?.id],
    queryFn: async () => {
      const response = await trocApi.getCycles()
      return Array.isArray(response.data?.data) ? (response.data.data as TrocCycle[]) : []
    },
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: 0,
  })

  const cycle = useMemo(() => {
    const cycles = Array.isArray(cyclesQuery.data) ? cyclesQuery.data : []
    return cycles.find((item) => String(item.id) === cycleId) ?? null
  }, [cycleId, cyclesQuery.data])

  const listingQueries = useQueries({
    queries: (cycle?.listing_ids ?? []).map((listingId) => ({
      queryKey: ['troc', 'cycle', cycleId, 'listing', listingId],
      queryFn: async () => {
        const response = await trocApi.getById(listingId)
        const payload = response.data?.data ?? response.data
        return payload as CycleListing
      },
      enabled: Boolean(cycle?.listing_ids?.length),
      staleTime: 30_000,
      retry: 0,
    })),
  })

  const listings = listingQueries.map((entry) => entry.data).filter(Boolean) as CycleListing[]
  const confirmations = Array.isArray(cycle?.confirmations) ? cycle.confirmations : []
  const allConfirmed = Boolean(cycle && cycle.status === 'all_accepted')
  const participants = listings.map((listing) => formatName(listing.seller_prenom, listing.seller_nom))

  const confirmCycle = async () => {
    if (!cycle) return
    const response = await trocApi.confirmCycle(cycle.id)
    const conversationId =
      response.data?.data?.conversation?.id ??
      response.data?.data?.conversation_id ??
      response.data?.conversation_id

    await cyclesQuery.refetch()
    if (conversationId) {
      setConversationId(conversationId)
      router.push(`/messages/${conversationId}`)
    }
  }

  if (!user) {
    return (
      <View style={styles.stateWrap}>
        <Ionicons name="lock-closed-outline" size={40} color={Colors.primary} />
        <Text style={styles.stateTitle}>Connectez-vous pour voir ce cycle</Text>
        <Text style={styles.stateText}>Les cycles de troc sont réservés aux participants concernés.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth/login')} activeOpacity={0.86}>
          <Text style={styles.primaryBtnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (cyclesQuery.isLoading && !cycle) {
    return (
      <View style={styles.stateWrap}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.stateText}>Chargement du cycle…</Text>
      </View>
    )
  }

  if (!cycle) {
    return (
      <View style={styles.stateWrap}>
        <Ionicons name="alert-circle-outline" size={42} color={Colors.primary} />
        <Text style={styles.stateTitle}>Cycle introuvable</Text>
        <Text style={styles.stateText}>Ce cycle n’est plus disponible ou ne vous concerne plus.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()} activeOpacity={0.86}>
          <Text style={styles.primaryBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="time-outline" size={13} color={Colors.white} />
          <Text style={styles.heroBadgeText}>{formatRemaining(cycle.expires_at)}</Text>
        </View>
        <Text style={styles.eyebrow}>🔄 Troc en chaîne</Text>
        <Text style={styles.title}>48h pour confirmer</Text>
        <Text style={styles.subtitle}>
          Trois participants peuvent se coordonner pour réaliser un échange en boucle.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Visualisation du cycle</Text>
        <View style={styles.cycleRow}>
          {listings.map((listing, index) => {
            const cover = listing.images?.find((item) => item.is_cover)?.url ?? listing.images?.[0]?.url ?? listing.images?.[0]?.thumbnail_url ?? null
            const name = formatName(listing.seller_prenom, listing.seller_nom)
            return (
              <View key={listing.id} style={styles.cycleItem}>
                <View style={styles.cycleImageWrap}>
                  {cover ? (
                    <Image source={{ uri: cover }} style={styles.cycleImage} />
                  ) : (
                    <View style={[styles.cycleImage, styles.cyclePlaceholder]}>
                      <Ionicons name="swap-horizontal" size={32} color={Colors.gray300} />
                    </View>
                  )}
                </View>
                <Text style={styles.cycleName} numberOfLines={1}>{name}</Text>
                <Text style={styles.cycleListing} numberOfLines={2}>{listing.title}</Text>
                {index < listings.length - 1 ? <Ionicons name="arrow-forward" size={16} color={Colors.primary} /> : null}
              </View>
            )
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Détail de chaque échange</Text>
        <View style={{ gap: 10 }}>
          {listings.length === 3 ? (
            <>
              <View style={styles.exchangeLine}><Text style={styles.exchangeText}>{participants[0]} donne <Text style={styles.exchangeBold}>{listings[0].title}</Text> à {participants[1]}.</Text></View>
              <View style={styles.exchangeLine}><Text style={styles.exchangeText}>{participants[1]} donne <Text style={styles.exchangeBold}>{listings[1].title}</Text> à {participants[2]}.</Text></View>
              <View style={styles.exchangeLine}><Text style={styles.exchangeText}>{participants[2]} donne <Text style={styles.exchangeBold}>{listings[2].title}</Text> à {participants[0]}.</Text></View>
            </>
          ) : (
            <View style={styles.emptyExchange}>
              <Text style={styles.emptyExchangeText}>Ce cycle nécessite trois annonces pour afficher la boucle complète.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Confirmations</Text>
        <View style={{ gap: 10 }}>
          {cycle.participant_ids.map((participantId, index) => {
            const confirmed = confirmations.some((value) => Number(value) === Number(participantId))
            const name = formatName(listings[index]?.seller_prenom, listings[index]?.seller_nom)
            return (
              <View key={participantId} style={styles.confirmLine}>
                <Text style={styles.confirmIcon}>{confirmed ? '✅' : '⏳'}</Text>
                <Text style={styles.confirmText}>{name} {confirmed ? 'a confirmé' : "n'a pas encore confirmé"}</Text>
              </View>
            )
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, allConfirmed && styles.primaryBtnDisabled]}
        onPress={() => void confirmCycle()}
        disabled={allConfirmed}
        activeOpacity={0.86}
      >
        <Text style={styles.primaryBtnText}>{allConfirmed ? 'Cycle déjà confirmé' : 'Je confirme ma participation'}</Text>
      </TouchableOpacity>

      {allConfirmed ? (
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push(conversationId ? `/messages/${conversationId}` : '/tabs/messages')} activeOpacity={0.86}>
          <Text style={styles.secondaryBtnText}>Ouvrir le chat de groupe</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 28,
    gap: Spacing.md,
  },
  stateWrap: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 10,
  },
  stateTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  stateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  hero: {
    borderRadius: 28,
    backgroundColor: Colors.gray900,
    padding: Spacing.lg,
    gap: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 2,
  },
  heroBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#FFD5C8',
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.xxl,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.76)',
    lineHeight: 20,
  },
  card: {
    borderRadius: 24,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    gap: 12,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  cycleItem: {
    width: '31%',
    minWidth: 100,
    alignItems: 'center',
    gap: 6,
  },
  cycleImageWrap: {
    width: '100%',
  },
  cycleImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
  },
  cyclePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  cycleListing: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  exchangeLine: {
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    padding: Spacing.md,
  },
  exchangeText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  exchangeBold: {
    fontWeight: FontWeight.bold,
  },
  emptyExchange: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: Spacing.md,
  },
  emptyExchangeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  confirmLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmIcon: {
    fontSize: 14,
  },
  confirmText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  primaryBtn: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Shadow.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  secondaryBtn: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
})
