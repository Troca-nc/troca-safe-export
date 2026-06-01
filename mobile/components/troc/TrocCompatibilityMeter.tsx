import { View, Text, StyleSheet } from 'react-native'

import { Colors, Radius, FontSize, FontWeight } from '@/constants/theme'
import type { TrocCompatibility } from '@/types/troc'

type Props = {
  compatibility?: TrocCompatibility | null
  emptyLabel?: string
}

function getTone(score: number) {
  if (score >= 80) return { bar: '#16A34A', chip: '#DCFCE7', text: '#166534' }
  if (score >= 50) return { bar: '#2563EB', chip: '#DBEAFE', text: '#1D4ED8' }
  if (score > 0) return { bar: '#F59E0B', chip: '#FEF3C7', text: '#B45309' }
  return { bar: '#DC2626', chip: '#FEE2E2', text: '#B91C1C' }
}

export function TrocCompatibilityMeter({ compatibility, emptyLabel }: Props) {
  if (!compatibility) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>{emptyLabel ?? 'Connectez-vous pour voir votre compatibilité'}</Text>
      </View>
    )
  }

  const tone = getTone(compatibility.score)

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Troc-o-mètre</Text>
        <View style={[styles.chip, { backgroundColor: tone.chip }]}>
          <Text style={[styles.chipText, { color: tone.text }]}>{compatibility.label}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, compatibility.score))}%`, backgroundColor: tone.bar }]} />
      </View>
      <Text style={styles.scoreText}>
        {compatibility.score}/100 · {compatibility.matching_count} annonce{compatibility.matching_count > 1 ? 's' : ''} compatibles
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  chipText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.gray100,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  scoreText: {
    marginTop: 8,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  emptyCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.gray100,
    backgroundColor: Colors.white,
    padding: 14,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
})
