import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt';
import { OfflineBanner } from '@/components/OfflineBanner';
import { queryClient, useOfflineStatus } from '@/lib/queryClient';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const stripeEnabled = Platform.OS !== 'web';
  const StripeProvider = stripeEnabled ? require('@stripe/stripe-react-native').StripeProvider : null;
  const offline = useOfflineStatus();

  const content = (
    <QueryClientProvider client={queryClient}>
      {offline ? <OfflineBanner /> : null}
      <StatusBar style="auto" />
      {children}
      <PushPermissionPrompt />
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
