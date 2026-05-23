// ============================================================
//  Troca Mobile — Store Auth (Zustand)
// ============================================================

import { create } from 'zustand';
import { api, clearApiCache, tokenStorage } from '@/lib/api';

interface User {
  id:        number;
  email:     string;
  prenom:    string;
  nom:       string;
  is_admin:  boolean;
  is_pro:    boolean;
  account_type?: 'personal' | 'professional';
  avatar_url?: string | null;
  email_verified?: boolean;
  telephone_verifie?: boolean;
}

interface AuthState {
  user:         User | null;
  isLoading:    boolean;
  isHydrated:   boolean;

  // Actions
  hydrate:      () => Promise<void>;
  login:        (email: string, password: string) => Promise<void>;
  register:     (data: RegisterData) => Promise<void>;
  loginSocial:  (provider: 'google' | 'apple', token: string) => Promise<void>;
  logout:       () => Promise<void>;
  refreshMe:    () => Promise<void>;
}

interface RegisterData {
  email:      string;
  password:   string;
  prenom:     string;
  nom:        string;
  commune_id?: number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:       null,
  isLoading:  false,
  isHydrated: false,

  // ── Initialisation au démarrage ───────────────────────────
  hydrate: async () => {
    try {
      const token = await tokenStorage.getAccess();
      if (!token) return;
      const { data } = await api.get('/auth/me');
      set({ user: data.data });
    } catch {
      await tokenStorage.clear();
    } finally {
      set({ isHydrated: true });
    }
  },

  // ── Login email/mot de passe ──────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await tokenStorage.setAccess(data.data.access_token);
      await tokenStorage.setRefresh(data.data.refresh_token);
      set({ user: data.data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Inscription ───────────────────────────────────────────
  register: async (payload) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', payload);
      await tokenStorage.setAccess(data.data.access_token);
      await tokenStorage.setRefresh(data.data.refresh_token);
      set({ user: data.data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Login social (Google / Apple) ─────────────────────────
  loginSocial: async (provider, token) => {
    set({ isLoading: true });
    try {
      const endpoint = provider === 'google'
        ? '/auth/google/mobile'
        : '/auth/apple/mobile';
      const { data } = await api.post(endpoint, { id_token: token });
      await tokenStorage.setAccess(data.data.access_token);
      await tokenStorage.setRefresh(data.data.refresh_token);
      set({ user: data.data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Déconnexion ───────────────────────────────────────────
  logout: async () => {
    try {
      const refresh = await tokenStorage.getRefresh();
      if (refresh) await api.post('/auth/logout', { refresh_token: refresh }).catch(() => {});
    } finally {
      await tokenStorage.clear();
      clearApiCache?.();
      set({ user: null });
    }
  },

  // ── Rafraîchir le profil ──────────────────────────────────
  refreshMe: async () => {
    const { data } = await api.get('/auth/me');
    set({ user: data.data });
  },
}));
