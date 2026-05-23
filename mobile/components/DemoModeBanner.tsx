import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme'
import { isDemoModeEnabled } from '@/lib/demo'

export function DemoModeBanner() {
  if (!isDemoModeEnabled()) return null

  return (
    // TODO: test E2E sur le bandeau mode démo permanent mobile.
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="warning" size={16} color="#7C2D12" />
      <Text style={styles.text}>⚠️ Mode démonstration — Aucun paiement réel ne sera effectué</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FBBF24',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    zIndex: 999,
    elevation: 6,
  },
  text: {
    flex: 1,
    color: '#7C2D12',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    lineHeight: 20,
  },
})
