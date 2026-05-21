import { Link } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

const cards = [
  { href: '/auth/login' as const, title: 'Connexion', text: 'Accéder à votre espace, vos favoris et vos messages.' },
  { href: '/auth/register' as const, title: 'Inscription', text: 'Créer un compte particulier ou professionnel.' },
  { href: '/tabs/annonces' as const, title: 'Explorer', text: 'Voir les annonces, filtres et catégories.' },
];

export default function WebLanding() {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.kicker}>Troca mobile web</Text>
      <Text style={styles.title}>Version de prévisualisation mobile</Text>
      <Text style={styles.subtitle}>
        Cette version web sert à tester rapidement l'ergonomie de Troca avant l'app native.
      </Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardText}>{card.text}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  kicker: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 30,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    maxWidth: 520,
  },
  grid: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  cardText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
