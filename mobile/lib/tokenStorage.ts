import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_ACCESS = 'troca_access_token';
const KEY_REFRESH = 'troca_refresh_token';

export const tokenStorage = {
  getAccess: async () => {
    if (Platform.OS === 'web') {
      try {
        return window.localStorage.getItem(KEY_ACCESS);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(KEY_ACCESS);
  },
  getRefresh: async () => {
    if (Platform.OS === 'web') {
      try {
        return window.localStorage.getItem(KEY_REFRESH);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(KEY_REFRESH);
  },
  setAccess: async (value: string) => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(KEY_ACCESS, value);
      } catch {
        return;
      }
      return;
    }
    return SecureStore.setItemAsync(KEY_ACCESS, value);
  },
  setRefresh: async (value: string) => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(KEY_REFRESH, value);
      } catch {
        return;
      }
      return;
    }
    return SecureStore.setItemAsync(KEY_REFRESH, value);
  },
  clear: async () => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem(KEY_ACCESS);
        window.localStorage.removeItem(KEY_REFRESH);
      } catch {
        return;
      }
      return;
    }
    await SecureStore.deleteItemAsync(KEY_ACCESS);
    await SecureStore.deleteItemAsync(KEY_REFRESH);
  },
};
