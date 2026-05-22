import type { ReactNode } from 'react';
import { useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const stripeEnabled = Platform.OS !== 'web';
  const StripeProvider = stripeEnabled ? require('@stripe/stripe-react-native').StripeProvider : null;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  const content = (
    <QueryClientProvider client={queryClient}>
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
