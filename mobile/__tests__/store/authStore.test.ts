// ============================================================
//  Troca Mobile — Tests authStore (Zustand)
// ============================================================

import { act, renderHook } from '@testing-library/react-hooks';
import { useAuthStore }    from '../../store/authStore';

// ── Mocks ─────────────────────────────────────────────────────

jest.mock('../../lib/api', () => ({
  api: {
    get:  jest.fn(),
    post: jest.fn(),
  },
  tokenStorage: {
    getAccess:  jest.fn().mockResolvedValue(null),
    getRefresh: jest.fn().mockResolvedValue(null),
    setAccess:  jest.fn().mockResolvedValue(undefined),
    setRefresh: jest.fn().mockResolvedValue(undefined),
    clear:      jest.fn().mockResolvedValue(undefined),
  },
}));

import { api, tokenStorage } from '../../lib/api';

const mockUser = {
  id: 1, email: 'test@troca.nc',
  prenom: 'Jean', nom: 'Test',
  is_admin: false, is_pro: false,
};

const mockTokens = {
  access_token:  'access_token_test',
  refresh_token: 'refresh_token_test',
};

// ── Tests ──────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Reset du store entre chaque test
  useAuthStore.setState({ user: null, isLoading: false, isHydrated: false });
});

describe('authStore — hydrate', () => {
  test('hydrate sans token → user reste null', async () => {
    (tokenStorage.getAccess as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useAuthStore());

    await act(async () => { await result.current.hydrate(); });

    expect(result.current.user).toBeNull();
    expect(result.current.isHydrated).toBe(true);
  });

  test('hydrate avec token valide → user chargé', async () => {
    (tokenStorage.getAccess as jest.Mock).mockResolvedValue('valid_token');
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockUser } });
    const { result } = renderHook(() => useAuthStore());

    await act(async () => { await result.current.hydrate(); });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isHydrated).toBe(true);
  });

  test('hydrate avec token invalide → efface les tokens', async () => {
    (tokenStorage.getAccess as jest.Mock).mockResolvedValue('expired_token');
    (api.get as jest.Mock).mockRejectedValue(new Error('401'));
    const { result } = renderHook(() => useAuthStore());

    await act(async () => { await result.current.hydrate(); });

    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});

describe('authStore — login', () => {
  test('login réussi → user set, tokens sauvegardés', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { data: { user: mockUser, ...mockTokens } },
    });
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login('test@troca.nc', 'password123');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(tokenStorage.setAccess).toHaveBeenCalledWith('access_token_test');
    expect(tokenStorage.setRefresh).toHaveBeenCalledWith('refresh_token_test');
    expect(result.current.isLoading).toBe(false);
  });

  test('login échoué → user reste null, isLoading false', async () => {
    (api.post as jest.Mock).mockRejectedValue({ response: { data: { error: 'Identifiants invalides' } } });
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await expect(result.current.login('bad@email.nc', 'wrong')).rejects.toBeDefined();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('authStore — register', () => {
  test('inscription réussie → user set', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { data: { user: mockUser, ...mockTokens } },
    });
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.register({
        email: 'jean@test.nc', password: 'pass1234',
        prenom: 'Jean', nom: 'Test',
      });
    });

    expect(result.current.user).toEqual(mockUser);
  });
});

describe('authStore — logout', () => {
  test('logout → user null, tokens effacés', async () => {
    useAuthStore.setState({ user: mockUser });
    (api.post as jest.Mock).mockResolvedValue({});
    (tokenStorage.getRefresh as jest.Mock).mockResolvedValue('refresh_tok');
    const { result } = renderHook(() => useAuthStore());

    await act(async () => { await result.current.logout(); });

    expect(result.current.user).toBeNull();
    expect(tokenStorage.clear).toHaveBeenCalled();
  });
});

describe('authStore — loginSocial', () => {
  test('login Google → user set', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { data: { user: mockUser, ...mockTokens } },
    });
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.loginSocial('google', 'google_id_token_xxx');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/google/mobile', expect.objectContaining({ id_token: 'google_id_token_xxx' }));
    expect(result.current.user).toEqual(mockUser);
  });
});
