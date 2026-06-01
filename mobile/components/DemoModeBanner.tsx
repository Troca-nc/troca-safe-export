import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { FontSize, FontWeight, Spacing } from '@/constants/theme'
import { DEMO_ACCOUNTS, isDemoModeEnabled } from '@/lib/demo'

export function DemoModeBanner() {
  if (!isDemoModeEnabled()) return null

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="warning" size={16} color="#7C2D12" />
      <View style={styles.textWrap}>
        <Text style={styles.text}>Mode démo - aucun paiement réel</Text>
        <Text style={styles.subtext}>
          Code SMS 123456 - {DEMO_ACCOUNTS.particulier.email} / {DEMO_ACCOUNTS.particulier.password}
        </Text>
      </View>
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
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FBBF24',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    zIndex: 999,
    elevation: 6,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  text: {
    color: '#7C2D12',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    lineHeight: 18,
  },
  subtext: {
    color: '#7C2D12',
    fontSize: FontSize.xs,
    lineHeight: 16,
    opacity: 0.9,
  },
})
