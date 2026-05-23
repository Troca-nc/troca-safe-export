import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Colors, Radius, Spacing, FontSize, FontWeight } from '@/constants/theme'

export type PaymentProvider = 'stripe' | 'payplug'

type Props = {
  value: PaymentProvider
  onChange: (provider: PaymentProvider) => void
}

const OPTIONS: Array<{
  value: PaymentProvider
  label: string
  subtitle: string
  note: string
  icon: keyof typeof Ionicons.glyphMap
}> = [
  {
    value: 'stripe',
    label: 'Carte bancaire internationale',
    subtitle: 'Visa, Mastercard, Amex et cartes étrangères',
    note: 'Paiement sécurisé et rapide via Stripe.',
    icon: 'card-outline',
  },
  {
    value: 'payplug',
    label: 'Carte OPT-NC / réseau local',
    subtitle: 'Cartes locales en Nouvelle-Calédonie',
    note: 'Idéal pour les paiements locaux via PayPlug.',
    icon: 'wallet-outline',
  },
]

export function PaymentProviderSelector({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moyen de paiement</Text>
      <Text style={styles.subtitle}>
        Choisissez le tunnel le plus adapté à votre carte. Vous pourrez changer d&apos;option avant la confirmation.
      </Text>

      <View style={styles.grid}>
        {OPTIONS.map((option) => {
          const active = value === option.value
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              activeOpacity={0.85}
              style={[styles.card, active ? styles.cardActive : styles.cardInactive]}
            >
              <View style={[styles.iconWrap, active ? styles.iconWrapActive : styles.iconWrapInactive]}>
                <Ionicons name={option.icon} size={18} color={active ? Colors.white : Colors.text} />
              </View>

              <View style={styles.content}>
                <View style={styles.row}>
                  <Text style={styles.label}>{option.label}</Text>
                  {active ? (
                    <View style={styles.badge}>
                      <Ionicons name="checkmark" size={10} color={Colors.primary} />
                      <Text style={styles.badgeText}>Sélectionné</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                <Text style={styles.note}>{option.note}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  grid: {
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderWidth: 2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: 96,
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  cardInactive: {
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  iconWrap: {
    height: 40,
    width: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.primary,
  },
  iconWrapInactive: {
    backgroundColor: Colors.gray100,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  optionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  note: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
})
