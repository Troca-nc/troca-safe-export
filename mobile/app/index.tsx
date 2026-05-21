import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export default function HomeRedirect() {
  const { hydrate, isHydrated, user } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <View style={styles.root}>
        <Text style={styles.brand}>Troca mobile web</Text>
        <Text style={styles.text}>Préparation de votre espace...</Text>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={user ? '/tabs/accueil' : '/auth/login'} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  brand: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  text: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
