import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme'

type ListingSkeletonProps = {
  variant?: 'grid' | 'list'
}

type ListingSkeletonListProps = {
  count?: number
  variant?: 'grid' | 'list'
}

function SkeletonBlock({
  style,
}: {
  style?: StyleProp<ViewStyle>
}) {
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )

    animation.start()
    return () => animation.stop()
  }, [shimmer])

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 140],
  })

  return (
    <View style={[styles.block, style]} pointerEvents="none">
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  )
}

export function ListingSkeleton({ variant = 'grid' }: ListingSkeletonProps) {
  if (variant === 'list') {
    return (
      <View style={styles.listCard}>
        <View style={styles.listImageWrap}>
          <SkeletonBlock style={styles.listImage} />
        </View>

        <View style={styles.listBody}>
          <SkeletonBlock style={styles.listTitle} />
          <SkeletonBlock style={styles.listSubtitle} />
          <View style={styles.listMetaRow}>
            <SkeletonBlock style={styles.listMeta} />
            <SkeletonBlock style={styles.listMetaSmall} />
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.gridCard}>
      <SkeletonBlock style={styles.gridImage} />
      <View style={styles.gridBody}>
        <SkeletonBlock style={styles.gridTitle} />
        <SkeletonBlock style={styles.gridSubtitle} />
        <View style={styles.gridMetaRow}>
          <SkeletonBlock style={styles.gridPrice} />
          <SkeletonBlock style={styles.gridMeta} />
        </View>
      </View>
    </View>
  )
}

export function ListingSkeletonList({ count = 6, variant = 'grid' }: ListingSkeletonListProps) {
  const rows = Array.from({ length: count })

  if (variant === 'list') {
    return (
      <View style={styles.listWrap}>
        {rows.map((_, index) => (
          <ListingSkeleton key={index} variant="list" />
        ))}
      </View>
    )
  }

  return (
    <View style={styles.gridWrap}>
      {rows.map((_, index) => (
        <ListingSkeleton key={index} variant="grid" />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  listWrap: {
    gap: Spacing.sm,
  },
  gridCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  gridImage: {
    width: '100%',
    height: 130,
    borderRadius: 0,
  },
  gridBody: {
    padding: Spacing.sm,
    gap: 8,
  },
  gridTitle: {
    width: '88%',
    height: 14,
    borderRadius: 999,
  },
  gridSubtitle: {
    width: '58%',
    height: 12,
    borderRadius: 999,
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  gridPrice: {
    width: 76,
    height: 16,
    borderRadius: 999,
  },
  gridMeta: {
    width: 42,
    height: 10,
    borderRadius: 999,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  listImageWrap: {
    marginRight: Spacing.md,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
  },
  listBody: {
    flex: 1,
    gap: 8,
  },
  listTitle: {
    width: '90%',
    height: 14,
    borderRadius: 999,
  },
  listSubtitle: {
    width: '48%',
    height: 12,
    borderRadius: 999,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  listMeta: {
    width: 110,
    height: 10,
    borderRadius: 999,
  },
  listMetaSmall: {
    width: 52,
    height: 10,
    borderRadius: 999,
  },
  block: {
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
  },
  shimmer: {
    position: 'absolute',
    left: '-40%',
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.55)',
    opacity: 0.8,
  },
})
