'use strict';

// ============================================================
//  Troca — Service WebSocket (socket.io)
//  Gère la messagerie temps réel et les notifications
// ============================================================

const { verifyAccessToken } = require('../config/jwt');
const { query }             = require('../config/database');
const { logger }            = require('../utils/logger');
const { recordWebsocket }    = require('./observability');
const { markConversationMessagesRead } = require('./messageConversationService');
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
      const result  = await query(
        'SELECT id, prenom, nom FROM users WHERE id = $1 AND deleted_at IS NULL',
        [payload.sub]
      );

      if (!result.rows[0]) return next(new Error('USER_NOT_FOUND'));

    socket.userId   = result.rows[0].id;
    socket.userName = `${result.rows[0].prenom} ${result.rows[0].nom}`;
    next();
    } catch {
      recordWebsocket('auth_error');
      next(new Error('AUTH_INVALID'));
    }
  });

  // ── Événements de connexion ──────────────────────────────────
  _io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);
    socket.data.lastTypingAt = 0;
    socket.data.lastTypingState = null;
    recordWebsocket('connect', { user_id: userId, socket_id: socket.id });
    logger.info('ws_connect', { user_id: userId, socket_id: socket.id });

    // Rejoindre une conversation
    socket.on('join_conversation', async (convId) => {
      try {
        const conv = await query(
          'SELECT id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
          [convId, userId]
        );
        if (!conv.rows[0]) return socket.emit('error', { message: 'Conversation introuvable' });
        socket.join(`conv:${convId}`);
        socket.emit('joined_conversation', { convId });
      } catch (err) {
        logger.error('ws_join_conversation_error', { error: err, user_id: userId, conv_id: convId });
      }
    });

    socket.on('leave_conversation', (convId) => {
      socket.leave(`conv:${convId}`);
    });

    // Indicateur de frappe
    socket.on('typing', ({ convId, isTyping }) => {
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

module.exports = { initSocket, getIO, emitNewMessage, notifyUser, emitConversationRead, shutdownWebsocketBridge };
