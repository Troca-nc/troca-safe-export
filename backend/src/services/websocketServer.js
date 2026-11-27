'use strict';

// ============================================================
//  Kalico — Service WebSocket (socket.io)
//  Gère la messagerie temps réel et les notifications
// ============================================================

const { verifyAccessToken } = require('../config/jwt');
const { query }             = require('../config/database');
const { isAccessTokenBlacklisted } = require('./authAccountService');
const { logger }            = require('../utils/logger');
const { recordWebsocket }    = require('./observability');
const { canAccessConversation, markConversationMessagesRead } = require('./messageConversationService');
const { markUserOffline, markUserOnline } = require('./presenceService');
const {
  initWebsocketBridge,
  publishConversationEvent,
  publishUserEvent,
  shutdownWebsocketBridge,
} = require('./websocketBridge');

let _io = null;

async function emitConversationRead(convId, userId, readCount = 0) {
  if (!readCount) return 0;

  await publishConversationEvent(convId, 'message_read', {
    convId,
    byUserId: userId,
    readCount,
  });
  await publishConversationEvent(convId, 'messages_read', {
    convId,
    byUserId: userId,
    readCount,
  });
  return readCount;
}

/**
 * Initialise socket.io sur le serveur HTTP Express
 * Appelé une seule fois au démarrage depuis index.js
 */
function initSocket(httpServer) {
  const { Server } = require('socket.io');

  _io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.BASE_URL          || 'http://localhost:3000',
        'http://localhost:3000',
        'http://localhost:19006', // Expo dev
      ],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── Middleware d'authentification ────────────────────────────
  _io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('AUTH_REQUIRED'));

      const payload = verifyAccessToken(token);
      if (await isAccessTokenBlacklisted(token)) {
        return next(new Error('TOKEN_REVOKED'));
      }
      const result  = await query(
        `SELECT u.id, u.prenom, u.nom, u.banned_until, u.auth_invalid_before,
                session.id AS auth_session_id, session.revoked_at AS auth_session_revoked_at,
                session.expires_at AS auth_session_expires_at
         FROM users u
         LEFT JOIN auth_sessions session
           ON session.id = $2 AND session.user_id = u.id
         WHERE u.id = $1 AND u.deleted_at IS NULL`,
        [payload.sub, payload.sid || null]
      );

      if (!result.rows[0]) return next(new Error('USER_NOT_FOUND'));
      if (result.rows[0].auth_invalid_before && Number(payload.iat || 0) * 1000 <= new Date(result.rows[0].auth_invalid_before).getTime()) {
        return next(new Error('SESSION_REVOKED'));
      }
      if (payload.sid && (
        !result.rows[0].auth_session_id
        || result.rows[0].auth_session_revoked_at
        || new Date(result.rows[0].auth_session_expires_at).getTime() <= Date.now()
      )) {
        return next(new Error('SESSION_REVOKED'));
      }
      if (result.rows[0].banned_until && new Date(result.rows[0].banned_until) > new Date()) {
        return next(new Error('USER_BANNED'));
      }

    socket.userId   = result.rows[0].id;
    socket.userName = `${result.rows[0].prenom} ${result.rows[0].nom}`;
    socket.sessionId = payload.sid ? String(payload.sid) : null;
    markUserOnline(socket.userId);
    next();
    } catch (error) {
      recordWebsocket('auth_error');
      if (['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(error?.name)) {
        return next(new Error('AUTH_INVALID'));
      }
      next(new Error('AUTH_UNAVAILABLE'));
    }
  });

  // ── Événements de connexion ──────────────────────────────────
  _io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);
    if (socket.sessionId) socket.join(`session:${socket.sessionId}`);
    socket.data.lastTypingAt = 0;
    socket.data.lastTypingState = null;
    recordWebsocket('connect', { user_id: userId, socket_id: socket.id });
    logger.info('ws_connect', { user_id: userId, socket_id: socket.id });

    // Rejoindre une conversation
    socket.on('join_conversation', async (convId) => {
      try {
        if (!await canAccessConversation(userId, convId)) {
          return socket.emit('error', { message: 'Conversation introuvable' });
        }
        const normalizedId = Number(convId);
        socket.join(`conv:${normalizedId}`);
        socket.emit('joined_conversation', { convId: normalizedId });
      } catch (err) {
        logger.error('ws_join_conversation_error', { error: err, user_id: userId, conv_id: convId });
      }
    });

    socket.on('leave_conversation', (convId) => {
      socket.leave(`conv:${convId}`);
    });

    // Indicateur de frappe
    socket.on('typing', (payload = {}) => {
      const convId = Number(payload?.convId);
      if (!Number.isSafeInteger(convId) || convId <= 0 || !socket.rooms.has(`conv:${convId}`)) {
        return;
      }
      const isTyping = payload?.isTyping;
      const nextState = Boolean(isTyping);
      const now = Date.now();
      if (socket.data.lastTypingState === nextState && now - socket.data.lastTypingAt < 3000) {
        return;
      }
      if (nextState && now - socket.data.lastTypingAt < 400) {
        return;
      }
      socket.data.lastTypingAt = now;
      socket.data.lastTypingState = nextState;
      recordWebsocket('message', { type: 'typing', conv_id: convId, user_id: userId });
      publishConversationEvent(convId, 'user_typing', {
        userId,
        name: socket.userName,
        isTyping: nextState,
      }).catch(() => {});
    });

    // Marquer comme lu
    socket.on('mark_read', async (convId) => {
      try {
        const readCount = await markConversationMessagesRead(convId, userId);
        recordWebsocket('message', { type: 'mark_read', conv_id: convId, user_id: userId });
        if (readCount > 0) {
          emitConversationRead(convId, userId, readCount).catch(() => {});
        }
      } catch (err) {
        logger.error('ws_mark_read_error', { error: err, user_id: userId, conv_id: convId });
      }
    });

    socket.on('disconnect', () => {
      markUserOffline(userId);
      recordWebsocket('disconnect', { user_id: userId, socket_id: socket.id });
      logger.info('ws_disconnect', { user_id: userId, socket_id: socket.id });
    });
  });

  logger.info('ws_initialized');
  initWebsocketBridge(_io).catch(() => {});
  return _io;
}

function getIO() {
  if (_io) return _io;
  return {
    to: () => ({ emit: () => {} }),
    emit: () => {},
  };
}

function emitNewMessage(convId, message, toUserId) {
  publishConversationEvent(convId, 'new_message', message).catch(() => {});
  if (toUserId) {
    publishUserEvent(toUserId, 'notification', { type: 'new_message', convId, message }).catch(() => {});
  }
}

function notifyUser(userId, type, data) {
  publishUserEvent(userId, 'notification', { type, ...data }).catch(() => {});
}

function disconnectUserSockets(userId) {
  const normalizedId = Number(userId);
  if (!_io || !Number.isSafeInteger(normalizedId) || normalizedId <= 0) return false;
  _io.in(`user:${normalizedId}`).disconnectSockets(true);
  return true;
}

function disconnectSessionSockets(sessionId) {
  const normalizedId = String(sessionId || '').trim();
  if (!_io || !/^[0-9a-f-]{36}$/i.test(normalizedId)) return false;
  _io.in(`session:${normalizedId}`).disconnectSockets(true);
  return true;
}

module.exports = {
  initSocket,
  getIO,
  emitNewMessage,
  notifyUser,
  disconnectSessionSockets,
  disconnectUserSockets,
  emitConversationRead,
  shutdownWebsocketBridge,
};
