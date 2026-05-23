import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt';
import { OfflineBanner } from '@/components/OfflineBanner';
import { DemoModeBanner } from '@/components/DemoModeBanner';
import { isDemoModeEnabled } from '@/lib/demo';
import { queryClient, useOfflineStatus } from '@/lib/queryClient';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const stripeEnabled = Platform.OS !== 'web';
  const StripeProvider = stripeEnabled ? require('@stripe/stripe-react-native').StripeProvider : null;
  const offline = useOfflineStatus();
  const demoModeEnabled = isDemoModeEnabled();

  const content = (
    <QueryClientProvider client={queryClient}>
      <View style={styles.shell}>
        {offline ? <OfflineBanner /> : null}
        <DemoModeBanner />
        <StatusBar style="auto" />
        <View style={[styles.content, demoModeEnabled ? styles.contentWithDemo : null]}>{children}</View>
        <PushPermissionPrompt />
      </View>
    </QueryClientProvider>
  );

  if (!StripeProvider) {
    return content;
  }

  const STRIPE_PK = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.EXPO_PUBLIC_STRIPE_PK ?? '';
  return (
    <StripeProvider publishableKey={STRIPE_PK} merchantIdentifier="merchant.nc.troca.app">
      {content}
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentWithDemo: {
    paddingTop: 48,
  },
});
