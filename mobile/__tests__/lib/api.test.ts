// ============================================================
//  Troca Mobile — Tests lib/api.ts (client Axios + refresh JWT)
// ============================================================

import axios from 'axios';

jest.mock('axios', () => {
  const mockAxios: any = {
    create:       jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    get:          jest.fn(),
    post:         jest.fn(),
  };
  mockAxios.create.mockReturnValue(mockAxios);
  return { default: mockAxios, ...mockAxios };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync:    jest.fn().mockResolvedValue(null),
  setItemAsync:    jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as SecureStore from 'expo-secure-store';

describe('tokenStorage', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAccess appelle SecureStore avec la bonne clé', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('my_token');
    const { tokenStorage } = require('../../lib/api');
    const token = await tokenStorage.getAccess();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('troca_access_token');
    expect(token).toBe('my_token');
  });

  test('setAccess sauvegarde dans SecureStore', async () => {
    const { tokenStorage } = require('../../lib/api');
    await tokenStorage.setAccess('new_token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('troca_access_token', 'new_token');
  });

  test('clear supprime les deux tokens', async () => {
    const { tokenStorage } = require('../../lib/api');
    await tokenStorage.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('troca_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('troca_refresh_token');
  });
});
