// ============================================================
//  Troca Mobile — Client WebSocket (socket.io)
// ============================================================

import { io, Socket }   from 'socket.io-client';
import { tokenStorage } from '@/lib/tokenStorage';

const WS_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api')
  .replace('/api', '');

let _socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (_socket?.connected) return _socket;

  const token = await tokenStorage.getAccess();

  _socket = io(WS_URL, {
    auth:        { token },
    transports:  ['websocket'],
    autoConnect: true,
    reconnection:        true,
    reconnectionAttempts: 5,
    reconnectionDelay:   1000,
  });

  _socket.on('connect',       () => console.log('[WS] Connecté'));
  _socket.on('disconnect',    (r) => console.log('[WS] Déconnecté:', r));
  _socket.on('connect_error', (e) => console.warn('[WS] Erreur:', e.message));

  return _socket;
}

export function disconnectSocket() {
  _socket?.disconnect();
  _socket = null;
}
