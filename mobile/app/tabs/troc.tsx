// ============================================================
//  Troca Mobile - Onglet Troc
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { trocApi } from '@/lib/api'
import { rememberRedirectAfterLogin } from '@/lib/authRedirect'
import { useAuthStore } from '@/store/authStore'
import { useInfiniteTrocListings } from '@/hooks/useInfiniteTrocListings'
import TrocSwipeCard from '@/components/troc/TrocSwipeCard'
import TrocProposalSheet from '@/components/troc/TrocProposalSheet'
import type { TrocFeedItem } from '@/lib/trocNormalization'

export default function TrocTab() {
  const { user } = useAuthStore()
  const [index, setIndex] = useState(0)
  const [proposalListing, setProposalListing] = useState<TrocFeedItem | null>(null)

  const {
    listings: feed,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteTrocListings({}, 'swipe')

  const cyclesQuery = useQuery({
    queryKey: ['troc', 'cycles', user?.id],
    queryFn: async () => {
      const response = await trocApi.getCycles()
      return Array.isArray(response.data?.data) ? response.data.data : []
    },
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: 0,
  })

  const current = feed[index] ?? null
  const isInitialLoading = isLoading && feed.length === 0
  const cycleBanner = useMemo(() => {
    const cycles = Array.isArray(cyclesQuery.data) ? cyclesQuery.data : []
    return cycles.find((cycle: { status?: string }) => cycle?.status === 'proposed' || cycle?.status === 'all_accepted') ?? null
  }, [cyclesQuery.data])

  useEffect(() => {
    if (feed.length - index <= 3 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [feed.length, fetchNextPage, hasNextPage, index, isFetchingNextPage])

  const moveNext = () => {
    setIndex((value) => value + 1)
  }

  const handleSkip = () => {
    if (!current) return
    void trocApi.swipe({ listing_id: current.id, direction: 'left' }).catch(() => {})
    moveNext()
  }

  const handlePropose = () => {
    if (!current) return
    if (!user) {
      void rememberRedirectAfterLogin('/tabs/troc')
      router.push('/auth/login')
      return
    }
    setProposalListing(current)
  }

  const handleOpenDetail = () => {
    if (!current) return
    router.push(`/troc/${current.id}` as any)
  }

  const handleSubmitted = () => {
    moveNext()
  }

  return (
    <View style={styles.root}>
      {/* TODO: test E2E sur le swipe Troc, l'ouverture du détail et l'envoi de proposition. */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.eyebrow}>🔄 Troc</Text>
            <Text style={styles.title}>Échangez sans dépenser</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => void refetch()} activeOpacity={0.85}>
            <Ionicons name="refresh" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Swipe droit pour proposer, swipe gauche pour passer. Les propositions sont structurées avant le chat.
        </Text>
      </View>

      {cycleBanner ? (
        <TouchableOpacity
          style={styles.cycleBanner}
          activeOpacity={0.88}
          onPress={() => router.push(`/troc/cycles/${cycleBanner.id}` as any)}
        >
          <Ionicons name="git-branch-outline" size={18} color="#7C2D12" />
          <View style={{ flex: 1 }}>
            <Text style={styles.cycleTitle}>Cycle détecté</Text>
            <Text style={styles.cycleText}>Un échange à 3 peut fonctionner. Tous les participants ont 48 h pour confirmer.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#7C2D12" />
        </TouchableOpacity>
      ) : null}

      <View style={styles.deckWrap}>
        {isInitialLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.emptyTitle}>Chargement du feed Troc…</Text>
            <Text style={styles.emptyText}>On prépare les objets les plus compatibles avec vos annonces.</Text>
          </View>
        ) : current ? (
          <TrocSwipeCard
            listing={current}
            compatibility={current.compatibility ?? null}
            onPress={handleOpenDetail}
            onSkip={handleSkip}
            onPropose={handlePropose}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={44} color={Colors.primary} />
            <Text style={styles.emptyTitle}>Vous avez tout vu !</Text>
            <Text style={styles.emptyText}>
              Revenez demain ou publiez votre propre annonce troc pour relancer le matching.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/tabs/publier' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Publier une annonce troc</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footerHint}>
        <Text style={styles.footerHintText}>
          {current ? 'Tap pour le détail. Swipe gauche pour passer. Swipe droit pour proposer.' : 'Rechargez pour découvrir de nouvelles annonces.'}
        </Text>
        {isFetchingNextPage ? <Text style={styles.footerLoader}>Plus de cartes…</Text> : null}
      </View>

      <TrocProposalSheet
        visible={Boolean(proposalListing)}
        listing={proposalListing}
        onClose={() => setProposalListing(null)}
        onSubmitted={handleSubmitted}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 4,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  cycleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: Radius.lg,
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FDBA74',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cycleTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#7C2D12',
  },
  cycleText: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: '#7C2D12',
    lineHeight: 18,
  },
  deckWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    borderRadius: 28,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.lg,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 6,
    minHeight: 46,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  footerHint: {
    marginTop: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  footerHintText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  footerLoader: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
})
