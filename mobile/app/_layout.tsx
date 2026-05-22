// ============================================================
//  Troca Mobile - Root Layout
// ============================================================

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Button, Text, View, Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { AppProviders } from '@/components/AppProviders';
import { usePushNotificationRouting } from '@/hooks/usePushNotificationRouting';
import { setCurrentPath } from '@/lib/navigationState';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const { hydrate, user } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    hydrate().finally(() => SplashScreen.hideAsync());
  }, [hydrate]);

  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

  usePushNotificationRouting(Boolean(user));

  const screens = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" options={{ animation: 'fade' }} />
      <Stack.Screen name="tabs" options={{ animation: 'fade' }} />
      <Stack.Screen name="bons-plans" options={{ animation: 'fade' }} />
      <Stack.Screen name="evenements" options={{ animation: 'fade' }} />
      <Stack.Screen name="covoiturage" options={{ animation: 'fade' }} />
      <Stack.Screen name="annonce/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="messages/[id]" options={{ presentation: 'card' }} />
    </Stack>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>{screens}</AppProviders>
    </GestureHandlerRootView>
  );
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  console.error('[mobile] root_error', error);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F5ECD7' }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#082032', marginBottom: 12, textAlign: 'center' }}>
        Une erreur a interrompu l’application
      </Text>
      <Text style={{ fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 20 }}>
        L’écran de secours a pris le relais pour éviter une page blanche. Tu peux réessayer maintenant.
      </Text>
      <Button title="Réessayer" onPress={retry} />
    </View>
  );
}
