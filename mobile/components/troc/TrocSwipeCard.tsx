import { useMemo, useRef } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'
import { TrocCompatibilityMeter } from '@/components/troc/TrocCompatibilityMeter'
import type { TrocFeedItem } from '@/lib/trocNormalization'
import type { TrocCompatibility } from '@/types/troc'

type Props = {
  listing: TrocFeedItem
  compatibility?: TrocCompatibility | null
  onPress: () => void
  onSkip: () => void
  onPropose: () => void
}

const SCREEN_WIDTH = Dimensions.get('window').width

function formatWants(wants: string[]) {
  return wants.filter(Boolean).slice(0, 3)
}

export default function TrocSwipeCard({ listing, compatibility, onPress, onSkip, onPropose }: Props) {
  const pan = useRef(new Animated.ValueXY()).current
  const rotation = useMemo(() => pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  }), [pan.x])

  const wants = formatWants(listing.troc_wants)
  const sellerName = [listing.seller_prenom, listing.seller_nom].filter(Boolean).join(' ').trim() || 'Troceur'
  const image = listing.image_url ?? listing.cover_image ?? listing.photos?.[0]?.thumbnail_url ?? listing.photos?.[0]?.url ?? null

  const animateLeave = (direction: 'left' | 'right', callback: () => void) => {
    Animated.timing(pan, {
      toValue: { x: direction === 'left' ? -SCREEN_WIDTH * 1.2 : SCREEN_WIDTH * 1.2, y: 0 },
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 })
      callback()
    })
  }

  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 120) {
        animateLeave('right', onPropose)
        return
      }
      if (gesture.dx < -120) {
        animateLeave('left', onSkip)
        return
      }

      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start(() => {
        if (Math.abs(gesture.dx) < 8 && Math.abs(gesture.dy) < 8) {
          onPress()
        }
      })
    },
  }), [onPress, onPropose, onSkip, pan])

  const cardStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { rotate: rotation },
    ],
  }

  return (
    <Animated.View {...responder.panHandlers} style={[styles.card, cardStyle]}>
      <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={styles.touchArea}>
        <View style={styles.mediaWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.media} />
          ) : (
            <View style={[styles.media, styles.mediaPlaceholder]}>
              <Ionicons name="images-outline" size={30} color={Colors.gray300} />
            </View>
          )}

          <View style={styles.badgeTopLeft}>
            <Text style={styles.badgeText}>🔄 Troc</Text>
          </View>
          {listing.troc_accepts_complement_xpf && listing.troc_complement_max_xpf > 0 ? (
            <View style={styles.badgeTopRight}>
              <Text style={styles.badgeText}>
                Jusqu’à {Number(listing.troc_complement_max_xpf).toLocaleString('fr-FR')} XPF
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="person-circle-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaText} numberOfLines={1}>{sellerName}</Text>
            {listing.seller_is_pro ? (
              <View style={styles.proPill}>
                <Text style={styles.proPillText}>Pro ✓</Text>
              </View>
            ) : null}
          </View>

          {wants.length > 0 ? (
            <View style={styles.tagsRow}>
              {wants.map((want) => (
                <View key={want} style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>{want}</Text>
                </View>
              ))}
              {listing.troc_wants.length > wants.length ? (
                <View style={styles.tagGhost}>
                  <Text style={styles.tagGhostText}>+{listing.troc_wants.length - wants.length}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <TrocCompatibilityMeter
            compatibility={compatibility ?? listing.compatibility ?? null}
            emptyLabel="Connectez-vous pour voir votre compatibilité"
          />

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={onSkip} activeOpacity={0.84}>
              <Ionicons name="close" size={18} color={Colors.gray700} />
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.detailBtn]} onPress={onPress} activeOpacity={0.84}>
              <Ionicons name="eye-outline" size={18} color={Colors.primary} />
              <Text style={styles.detailText}>Détail</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.proposeBtn]} onPress={onPropose} activeOpacity={0.84}>
              <Ionicons name="heart" size={18} color={Colors.white} />
              <Text style={styles.proposeText}>Proposer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  touchArea: {
    flex: 1,
  },
  mediaWrap: {
    position: 'relative',
  },
  media: {
    width: '100%',
    height: 260,
    backgroundColor: Colors.gray100,
  },
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(8,32,50,0.72)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  body: {
    padding: Spacing.md,
    gap: 10,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    lineHeight: 24,
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
    flexShrink: 1,
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
  tagGhost: {
    borderRadius: 999,
    backgroundColor: Colors.gray50,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagGhostText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    minHeight: 44,
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
  },
  skipBtn: {
    backgroundColor: Colors.gray100,
  },
  detailBtn: {
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  proposeBtn: {
    backgroundColor: Colors.primary,
  },
  skipText: {
    color: Colors.gray700,
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  detailText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  proposeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
})
