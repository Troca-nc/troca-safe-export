'use strict';

const { createClient } = require('redis');
const { getRedisUrl, hasRedisConfig } = require('../config/redis');
const { logger } = require('../utils/logger');
const { recordError } = require('./observability');

let io = null;
let publisher = null;
let subscriber = null;
let bridgeReady = false;
const nodeId = `${process.pid}-${Math.random().toString(36).slice(2)}`;

function ensureIo() {
  if (!io) throw new Error('WebSocket bridge non initialisé');
}

function parseChannel(channel) {
  const parts = String(channel || '').split(':');
  if (parts.length < 3 || parts[0] !== 'ws') return null;
  const scope = parts[1];
  const id = parts.slice(2).join(':');
  if (!scope || !id) return null;
  return { scope, id };
}

async function ensureBridge() {
  if (bridgeReady) return true;
  if (!hasRedisConfig()) return false;

  const url = getRedisUrl();
  if (!url) return false;

  publisher = createClient({ url });
  subscriber = createClient({ url });

  publisher.on('error', (err) => {
    recordError({ source: 'ws_bridge', role: 'publisher', message: err.message });
    logger.warn('ws_bridge_publisher_error', { error: err });
  });
  subscriber.on('error', (err) => {
    recordError({ source: 'ws_bridge', role: 'subscriber', message: err.message });
    logger.warn('ws_bridge_subscriber_error', { error: err });
  });

  await publisher.connect();
  await subscriber.connect();

  await subscriber.pSubscribe('ws:*', async (message, channel) => {
    try {
      const parsed = JSON.parse(message);
      if (!parsed || parsed.origin === nodeId) return;

      const target = parseChannel(channel);
      if (!target) return;

      if (target.scope === 'conv') {
        ensureIo().to(`conv:${target.id}`).emit(parsed.event, parsed.data);
        return;
      }

      if (target.scope === 'user') {
        ensureIo().to(`user:${target.id}`).emit(parsed.event, parsed.data);
      }
    } catch (err) {
      recordError({ source: 'ws_bridge', role: 'subscriber_message', message: err.message });
      console.warn('[ws-bridge] message error:', err.message);
    }
  });

  bridgeReady = true;
  logger.info('ws_bridge_ready');
  return true;
}

async function initWebsocketBridge(socketIo) {
  io = socketIo;
  try {
    await ensureBridge();
  } catch (err) {
    recordError({ source: 'ws_bridge', action: 'init', message: err.message });
    logger.warn('ws_bridge_local_mode', { error: err });
  }
}

async function publishConversationEvent(convId, event, data) {
  ensureIo();
  io.to(`conv:${convId}`).emit(event, data);

  if (!bridgeReady) return;
  try {
    await publisher.publish(`ws:conv:${convId}`, JSON.stringify({
      origin: nodeId,
      event,
      data,
    }));
  } catch (err) {
    recordError({ source: 'ws_bridge', action: 'publish_conversation', message: err.message, convId, event });
    logger.warn('ws_bridge_publish_conversation_error', { error: err });
  }
}

async function publishUserEvent(userId, event, data) {
  ensureIo();
  io.to(`user:${userId}`).emit(event, data);

  if (!bridgeReady) return;
  try {
    await publisher.publish(`ws:user:${userId}`, JSON.stringify({
      origin: nodeId,
      event,
      data,
    }));
  } catch (err) {
    recordError({ source: 'ws_bridge', action: 'publish_user', message: err.message, userId, event });
    logger.warn('ws_bridge_publish_user_error', { error: err });
  }
}

async function shutdownWebsocketBridge() {
  bridgeReady = false;
  try { await subscriber?.quit(); } catch {}
  try { await publisher?.quit(); } catch {}
  subscriber = null;
  publisher = null;
  io = null;
}

module.exports = {
  initWebsocketBridge,
  publishConversationEvent,
  publishUserEvent,
  shutdownWebsocketBridge,
};
