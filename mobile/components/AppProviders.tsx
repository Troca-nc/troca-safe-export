import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const stripeEnabled = Platform.OS !== 'web';
  const StripeProvider = stripeEnabled ? require('@stripe/stripe-react-native').StripeProvider : null;

  if (!StripeProvider) {
    return (
      <>
        <StatusBar style="auto" />
        {children}
      </>
    );
  }

  const STRIPE_PK = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.EXPO_PUBLIC_STRIPE_PK ?? '';
  return (
    <StripeProvider publishableKey={STRIPE_PK} merchantIdentifier="merchant.nc.troca.app">
      <StatusBar style="auto" />
      {children}
    </StripeProvider>
  );
}
