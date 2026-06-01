import { useEffect, useMemo, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { statsApi } from '@/lib/api'
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme'

type PlatformStatsResponse = {
  listings_count: number
  bons_plans_count: number
  rides_count: number
}

type Variant = 'light' | 'dark'

type Metric = {
  key: keyof PlatformStatsResponse
  label: string
  icon: keyof typeof Ionicons.glyphMap
  accent: string
}

const metrics: Metric[] = [
  { key: 'listings_count', label: 'annonces actives', icon: 'pricetag-outline', accent: Colors.lagoon },
  { key: 'bons_plans_count', label: 'bons plans du moment', icon: 'ribbon-outline', accent: Colors.emerald },
  { key: 'rides_count', label: 'covoiturages disponibles', icon: 'car-outline', accent: Colors.corail },
]

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function StatSkeleton({ variant }: { variant: Variant }) {
  const pulse = useMemo(() => new Animated.Value(0.45), [])

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    )

    loop.start()
    return () => loop.stop()
  }, [pulse])

  const cardStyles = variant === 'dark' ? styles.darkSkeletonCard : styles.lightSkeletonCard

  return (
    <View style={variant === 'dark' ? styles.darkSkeletonGrid : styles.lightSkeletonGrid}>
      {metrics.map((metric) => (
        <View key={metric.key} style={cardStyles}>
          <Animated.View style={[styles.skeletonDot, { opacity: pulse }]} />
          <Animated.View style={[styles.skeletonValue, { opacity: pulse }]} />
          <Animated.View style={[styles.skeletonLabel, { opacity: pulse }]} />
        </View>
      ))}
    </View>
  )
}

export function PlatformStats({ variant = 'light' }: { variant?: Variant }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [stats, setStats] = useState<PlatformStatsResponse | null>(null)
  const [displayValues, setDisplayValues] = useState<number[]>([0, 0, 0])
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await statsApi.getPlatform()
        if (!mounted) return
        const data = response.data as PlatformStatsResponse
        setStats({
          listings_count: Number(data?.listings_count ?? 0),
          bons_plans_count: Number(data?.bons_plans_count ?? 0),
          rides_count: Number(data?.rides_count ?? 0),
        })
      } catch (err) {
        console.error('[mobile][platform-stats] load failed', err)
        if (mounted) setError(true)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {})
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion)
    return () => {
      subscription?.remove?.()
    }
  }, [])

  useEffect(() => {
    if (!stats || loading || error) return

    const values = metrics.map((metric) => stats[metric.key] ?? 0)
    if (reduceMotion) {
      setDisplayValues(values)
      return
    }

    let raf = 0
    const start = Date.now()
    const duration = 1200

    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplayValues(values.map((value) => Math.round(value * eased)))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [error, loading, reduceMotion, stats])

  const formattedValues = useMemo(() => displayValues.map((value) => formatNumber(value)), [displayValues])

  if (error) return null
  if (loading || !stats) return <StatSkeleton variant={variant} />

  if (variant === 'dark') {
    return (
      <View style={styles.darkGrid}>
        {metrics.map((metric, index) => (
          <View key={metric.key} style={[styles.darkCard, index < metrics.length - 1 && styles.darkCardDivider]}>
            <Ionicons name={metric.icon} size={18} color="rgba(255,255,255,0.5)" />
            <Text style={[styles.darkValue, { color: metric.accent }]}>{formattedValues[index]}</Text>
            <Text style={styles.darkLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.lightGrid}>
      {metrics.map((metric, index) => (
        <View key={metric.key} style={styles.lightCard}>
          <Ionicons name={metric.icon} size={20} color={metric.accent} />
          <Text style={[styles.lightValue, { color: metric.accent }]}>{formattedValues[index]}</Text>
          <Text style={styles.lightLabel}>{metric.label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  lightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  lightCard: {
    flex: 1,
    minWidth: 92,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  lightValue: {
    marginTop: 14,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: FontWeight.bold,
  },
  lightLabel: {
    marginTop: 8,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  darkGrid: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  darkCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  darkCardDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  darkValue: {
    marginTop: 12,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: FontWeight.semibold,
  },
  darkLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.42)',
    textAlign: 'center',
  },
  lightSkeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  lightSkeletonCard: {
    flex: 1,
    minWidth: 92,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 10,
    ...Shadow.sm,
  },
  darkSkeletonGrid: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  darkSkeletonCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 10,
  },
  skeletonDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  skeletonValue: {
    width: 58,
    height: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  skeletonLabel: {
    width: 80,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
})

export default PlatformStats
