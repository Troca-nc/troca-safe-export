import AsyncStorage from '@react-native-async-storage/async-storage'

import { getCurrentPath } from '@/lib/navigationState'

const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login'

export async function rememberRedirectAfterLogin(path = getCurrentPath()) {
  if (!path || path.startsWith('/auth/login')) return
  await AsyncStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, path)
}

export async function consumeRedirectAfterLogin(fallback = '/tabs/accueil') {
  try {
    const stored = await AsyncStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)
    if (stored) {
      await AsyncStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
      return stored.startsWith('/') ? stored : fallback
    }
  } catch {
    // Ignore storage issues and keep the default redirect.
  }

  return fallback
}
