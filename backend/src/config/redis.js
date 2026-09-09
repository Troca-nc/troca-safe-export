'use strict';

const { createClient } = require('redis');

let clientPromise = null;
let client = null;
let warnedNoRedis = false;

function isRedisRequired() {
  if (process.env.REDIS_REQUIRED != null) return process.env.REDIS_REQUIRED === 'true';
  return process.env.NODE_ENV === 'production';
}

function redisUnavailable(cause) {
  const error = new Error('Redis is required but unavailable');
  error.code = 'REDIS_REQUIRED_UNAVAILABLE';
  error.cause = cause;
  return error;
}

function getRedisUrl() {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;

  const host = process.env.REDIS_HOST;
  if (!host) return '';

  const port = process.env.REDIS_PORT || '6379';
  const password = process.env.REDIS_PASSWORD || '';
  const auth = password ? `:${encodeURIComponent(password)}@` : '';
  return `redis://${auth}${host}:${port}`;
}

function hasRedisConfig() {
  return Boolean(getRedisUrl());
}

async function getRedisClient() {
  if (client && client.isOpen) return client;
  if (clientPromise) return clientPromise;

  const url = getRedisUrl();
  if (!url) {
    if (isRedisRequired()) throw redisUnavailable(new Error('Redis configuration missing'));
    return null;
  }

  clientPromise = (async () => {
    const nextClient = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => Math.min(100 + retries * 50, 2000),
      },
    });

    nextClient.on('error', (err) => {
      if (!warnedNoRedis) {
        warnedNoRedis = true;
        console.warn('[redis] connexion indisponible:', err.message);
      }
    });

    try {
      await nextClient.connect();
      client = nextClient;
      warnedNoRedis = false;
      return client;
    } catch (err) {
      if (!warnedNoRedis) {
        warnedNoRedis = true;
        console.warn('[redis] client non disponible, mode degrade:', err.message);
      }
      try { nextClient.disconnect(); } catch {}
      if (isRedisRequired()) throw redisUnavailable(err);
      return null;
    }
  })();

  try {
    return await clientPromise;
  } finally {
    clientPromise = null;
  }
}

async function disconnectRedisClient() {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    try { await client.disconnect(); } catch {}
  } finally {
    client = null;
  }
}

module.exports = {
  disconnectRedisClient,
  getRedisClient,
  getRedisUrl,
  hasRedisConfig,
  isRedisRequired,
  redisUnavailable,
};
