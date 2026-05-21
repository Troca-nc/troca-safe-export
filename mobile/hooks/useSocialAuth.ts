// ============================================================
//  Troca Mobile — Hook authentification sociale
//  Google Sign-In via expo-auth-session
//  Apple Sign-In via expo-apple-authentication
// ============================================================

import { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as AuthSession   from 'expo-auth-session';
import * as WebBrowser    from 'expo-web-browser';
import { useAuthStore }   from '@/store/authStore';

// Nécessaire pour que le browser OAuth se ferme correctement sur Android
WebBrowser.maybeCompleteAuthSession();

// ── Google ────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const SOCIAL_AUTH_ENABLED =
  GOOGLE_CLIENT_ID.trim() !== '' && !GOOGLE_CLIENT_ID.toLowerCase().includes('changeme');

export function useGoogleSignIn() {
  const { loginSocial } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [pendingResponse, setPendingResponse] = useState(false);
  const googleDiscovery = SOCIAL_AUTH_ENABLED ? AuthSession.useAutoDiscovery('https://accounts.google.com') : null;

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'troca', path: 'auth/google' });

  const authRequest = SOCIAL_AUTH_ENABLED
    ? AuthSession.useAuthRequest(
        {
          clientId: GOOGLE_CLIENT_ID,
          redirectUri,
          scopes: ['openid', 'profile', 'email'],
          responseType: AuthSession.ResponseType.IdToken,
          extraParams: { nonce: Math.random().toString(36).slice(2) },
        },
        googleDiscovery ?? null,
      )
    : ([null, null, async () => ({ type: 'dismiss' as const })] as any);

  const [request, response, promptAsync] = authRequest;

  useEffect(() => {
    if (!pendingResponse || !response) return;

    const handleResponse = async () => {
      if (response.type === 'success') {
        const { id_token } = response.params;
        if (!id_token) {
          Alert.alert('Erreur', 'Token Google manquant');
          setPendingResponse(false);
          return;
        }

        setLoading(true);
        try {
          await loginSocial('google', id_token);
        } catch (err: any) {
          Alert.alert('Connexion Google échouée', err?.response?.data?.error ?? 'Erreur inconnue');
        } finally {
          setLoading(false);
        }
      } else if (response.type === 'error') {
        Alert.alert('Erreur Google', response.error?.message ?? 'Authentification annulée');
      }

      setPendingResponse(false);
    };

    handleResponse().catch(() => setPendingResponse(false));
  }, [pendingResponse, response, loginSocial]);

  return {
    signIn: async () => {
      if (!SOCIAL_AUTH_ENABLED) {
        Alert.alert('Non disponible', 'Connexion sociale désactivée hors ligne.');
        return;
      }
      setPendingResponse(true);
      await promptAsync();
    },
    loading: loading || !request,
    available: SOCIAL_AUTH_ENABLED,
  };
}

// ── Apple ─────────────────────────────────────────────────────

export function useAppleSignIn() {
  const { loginSocial } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!SOCIAL_AUTH_ENABLED) {
      Alert.alert('Non disponible', 'Connexion sociale désactivée hors ligne.');
      return;
    }
    // Apple Sign-In n'est disponible que sur iOS 13+
    if (Platform.OS !== 'ios') {
      Alert.alert('Non disponible', 'Apple Sign-In est uniquement disponible sur iOS.');
      return;
    }

    setLoading(true);
    try {
      // Import dynamique pour éviter l'erreur sur Android
      const AppleAuth = await import('expo-apple-authentication');

      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) throw new Error('Token Apple manquant');

      await loginSocial('apple', credential.identityToken);
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Connexion Apple échouée', err?.response?.data?.error ?? err.message ?? 'Erreur inconnue');
      }
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, available: SOCIAL_AUTH_ENABLED };
}
